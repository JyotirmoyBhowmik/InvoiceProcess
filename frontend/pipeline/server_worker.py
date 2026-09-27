import os
import time
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from apscheduler.schedulers.background import BackgroundScheduler

from ai.model_router import MultiModelAIRouter
from core.logger import get_logger, setup_logger
from core.validator import InvoiceValidator
from db.repository import DatabaseRepository
from db.session import get_db_session, init_database
from exporters.csv_exporter import CsvExporter
from exporters.txt_exporter import TxtExporter
from ingestion.attachment_handler import AttachmentHandler
from logic.tax_engine import TaxEngine
from logic.vendor_resolver import VendorResolver
from mail.graph_service import ExchangeOnlineGraphService

class ServerInvoiceAutomationDaemon:
    """Production server daemon that runs on Windows or Linux local server.
    Continuously polls Exchange Online or generic mailboxes, isolates attachments,
    runs layout OCR using selected AI model (Vertex / Azure / Local), reconciles math,
    and commits transactions directly to database.
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = get_logger()
        self.scheduler = BackgroundScheduler()
        self.interval_seconds = int(config.get("mailbox", {}).get("polling_interval_seconds", 60))

        # Core subsystems
        self.mail_service = ExchangeOnlineGraphService(config)
        self.attachment_handler = AttachmentHandler(config)
        self.ai_router = MultiModelAIRouter(config)
        self.validator = InvoiceValidator(
            tolerance=float(config.get("system", {}).get("rounding_tolerance", 0.05))
        )
        self.tax_engine = TaxEngine(config)
        self.csv_exporter = CsvExporter(config)
        self.txt_exporter = TxtExporter(config)

        # Database session
        init_database(config)
        self.db_session = get_db_session(config)
        self.db_repo = DatabaseRepository(self.db_session)
        self.vendor_resolver = VendorResolver(db_repository=self.db_repo)

    def start(self):
        """Starts background scheduling daemon."""
        self.logger.info("server_daemon_starting", interval=self.interval_seconds)
        self.scheduler.add_job(
            self.execute_processing_cycle,
            "interval",
            seconds=self.interval_seconds,
            id="invoice_ingestion_job",
            replace_existing=True,
        )
        self.scheduler.start()

    def stop(self):
        self.scheduler.shutdown(wait=False)
        self.logger.info("server_daemon_stopped")

    def execute_processing_cycle(self):
        """Single atomic processing pass."""
        trace_batch_id = f"BATCH-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        self.logger.info("starting_processing_cycle", batch_id=trace_batch_id)

        try:
            # 1. Poll incoming unread emails with attachments
            messages = self.mail_service.poll_unread_invoices(max_items=20)
            if not messages:
                self.logger.info("cycle_complete_no_unread_invoices")
                return

            self.db_repo.create_batch_record(trace_batch_id, len(messages))
            processed_count = 0
            valid_count = 0
            flagged_count = 0

            for msg in messages:
                msg_id = msg.get("id")
                sender = msg.get("sender", {}).get("emailAddress", {}).get("address", "")
                raw_atts = msg.get("attachments", [])

                # 2. Extract, sanitize, and unpack nested ZIPs in-memory
                valid_attachments = self.attachment_handler.process_attachments(
                    raw_attachments=raw_atts,
                    email_id=msg_id,
                    sender=sender,
                )

                for att in valid_attachments:
                    trace_id = f"TRACE-{uuid.uuid4().hex[:12].upper()}"
                    self.logger.info("processing_attachment", trace_id=trace_id, filename=att.filename)

                    try:
                        # 3. Model-Agnostic AI Document Parsing
                        extracted_invoice, tokens, model_name = self.ai_router.extract(
                            document_bytes=att.content_bytes,
                            mime_type=att.mime_type,
                            filename=att.filename,
                        )

                        # 4. Master Data Resolution
                        vendor_code, default_cat, _ = self.vendor_resolver.resolve(
                            extracted_name=extracted_invoice.vendor.name,
                            extracted_tax_id=extracted_invoice.vendor.tax_id,
                        )
                        tax_code, gl_account, cost_center = self.tax_engine.derive(
                            extracted_invoice.expense_classification.value
                        )

                        # 5. Arithmetic & Invariant Check
                        validation = self.validator.validate(extracted_invoice)
                        if validation.is_valid:
                            valid_count += 1
                        else:
                            flagged_count += 1

                        # 6. Database Transaction Commit
                        fixed_fields = self.config.get("rules", {}).get("fixed_fields", {})
                        from core.pipeline import PipelineItem
                        item = PipelineItem(
                            trace_id=trace_id,
                            attachment=att,
                            invoice=extracted_invoice,
                            vendor_code=vendor_code,
                            tax_code=tax_code,
                            gl_account=gl_account,
                            cost_center=cost_center,
                            validation=validation,
                            tokens_consumed=tokens,
                        )
                        self.db_repo.persist_pipeline_item(trace_batch_id, item, fixed_fields)
                        processed_count += 1

                        # 7. Automated Reply Dispatch
                        status_str = "RECONCILED" if validation.is_valid else "NEEDS_REVIEW"
                        summary_note = (
                            f"Total: {extracted_invoice.financials.total_amount} | "
                            f"Vendor Code: {vendor_code} | GL: {gl_account} | Model: {model_name}"
                        )
                        self.mail_service.send_automated_reply(
                            original_message_id=msg_id,
                            recipient_email=sender,
                            invoice_number=extracted_invoice.header.invoice_number,
                            status=status_str,
                            audit_summary=summary_note,
                        )

                    except Exception as doc_err:
                        self.logger.error("doc_processing_failed", filename=att.filename, error=str(doc_err))

                # Mark message as read
                self.mail_service.mark_as_read(msg_id)

            self.db_repo.finalize_batch(trace_batch_id, valid_count, flagged_count)
            self.logger.info("cycle_completed", processed=processed_count, valid=valid_count, flagged=flagged_count)

        except Exception as cycle_err:
            self.logger.error("cycle_fatal_error", error=str(cycle_err), exc_info=True)
