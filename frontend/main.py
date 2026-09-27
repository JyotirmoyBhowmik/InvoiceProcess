import argparse
import base64
import os
import sys
import uuid
from datetime import datetime

from ai.agent_builder import VertexAgentBuilderExtractor
from core.logger import setup_logger, get_logger
from core.pipeline import InvoicePipeline, PipelineContext, PipelineItem
from db.session import init_database, get_db_session
from db.repository import DatabaseRepository
from exporters.csv_exporter import CsvExporter
from exporters.txt_exporter import TxtExporter
from ingestion.attachment_handler import AttachmentHandler, ProcessedAttachment
from ingestion.graph_client import MicrosoftGraphEmailClient
from logic.tax_engine import TaxEngine
from logic.vendor_resolver import VendorResolver
from notifications.mailer import PipelineNotificationDispatcher
from sampleData import SAMPLE_INVOICE_SVG

def create_sample_attachment() -> ProcessedAttachment:
    """Creates a sample vector invoice attachment for zero-credential dry-run testing."""
    import urllib.parse
    svg_clean = SAMPLE_INVOICE_SVG.split(",", 1)[-1]
    raw_svg_str = urllib.parse.unquote(svg_clean)
    svg_bytes = raw_svg_str.encode("utf-8")

    return ProcessedAttachment(
        filename="Nexus-Dynamics-Cloud-Invoice-0842.svg",
        content_bytes=svg_bytes,
        mime_type="image/svg+xml",
        size_bytes=len(svg_bytes),
        source_email_id="MSG-MOCK-SAMPLE-001",
        sender_email="billing@nexusdynamics.io",
    )

def main():
    parser = argparse.ArgumentParser(description="Automated Invoice Ingestion & DB Processing Pipeline")
    parser.add_argument("--config", default="config/app_config.yaml", help="Path to master app_config.yaml")
    parser.add_argument("--dry-run", action="store_true", help="Execute pipeline with embedded sample invoice without polling email")
    parser.add_argument("--max-emails", type=int, default=20, help="Maximum emails to ingest")
    parser.add_argument("--log-level", default="INFO", help="Logging level (DEBUG, INFO, WARN, ERROR)")
    parser.add_argument("--skip-db", action="store_true", help="Skip database persistence (file-only mode)")
    args = parser.parse_args()

    setup_logger(args.log_level)
    logger = get_logger()
    logger.info("application_booted", mode="dry_run" if args.dry_run else "live_ingestion")

    # 1. Initialize pipeline with config
    pipeline = InvoicePipeline(config_path=args.config)
    config = pipeline.config

    # 2. Database Initialization (PostgreSQL or MySQL)
    db_repo = None
    db_session = None
    if not args.skip_db:
        dialect = config.get("database", {}).get("dialect", "postgresql")
        logger.info("initializing_database_backend", dialect=dialect)
        db_ready = init_database(config)
        if db_ready:
            try:
                db_session = get_db_session(config)
                db_repo = DatabaseRepository(db_session)
                # Seed initial vendors into PostgreSQL / MySQL table
                db_repo.seed_vendors_from_json("config/vendors.json")
                logger.info("database_ready_for_pipeline", dialect=dialect)
            except Exception as e:
                logger.warn("database_session_failed_fallback_to_json", error=str(e))
        else:
            logger.warn("database_not_reachable_using_json_fallback")

    # 3. Instantiate pipeline stage modules
    vendor_resolver = VendorResolver(db_repository=db_repo)
    tax_engine = TaxEngine(config)
    csv_exporter = CsvExporter(config)
    txt_exporter = TxtExporter(config)
    extractor = VertexAgentBuilderExtractor(config)

    # 4. Define Pipeline Steps
    def step_extract_ocr(context: PipelineContext):
        for item in context.items:
            try:
                invoice_obj, tokens = extractor.extract_document(
                    document_bytes=item.attachment.content_bytes,
                    mime_type=item.attachment.mime_type,
                    filename=item.attachment.filename,
                )
                item.invoice = invoice_obj
                item.tokens_consumed = tokens
            except Exception as e:
                item.error = f"OCR_EXTRACTION_FAILURE: {str(e)}"
                logger.error("pipeline_ocr_error", filename=item.attachment.filename, error=str(e))

    def step_resolve_rules(context: PipelineContext):
        for item in context.items:
            if not item.invoice:
                continue
            vendor_code, default_cat, _ = vendor_resolver.resolve(
                extracted_name=item.invoice.vendor.name,
                extracted_tax_id=item.invoice.vendor.tax_id,
            )
            item.vendor_code = vendor_code

            category = item.invoice.expense_classification.value
            if category == "Other" and default_cat:
                category = default_cat

            tax_code, gl_account, cost_center = tax_engine.derive(category)
            item.tax_code = tax_code
            item.gl_account = gl_account
            item.cost_center = cost_center

    def step_validate(context: PipelineContext):
        for item in context.items:
            if item.invoice:
                item.validation = pipeline.validator.validate(item.invoice)

    def step_persist_database(context: PipelineContext):
        """Atomic insert of batch and processed invoices to MySQL or PostgreSQL."""
        if not db_repo:
            return

        fixed_fields = context.config.get("rules", {}).get("fixed_fields", {})
        db_repo.create_batch_record(context.batch_id, len(context.items))

        persisted = 0
        for item in context.items:
            try:
                rec = db_repo.persist_pipeline_item(context.batch_id, item, fixed_fields)
                item.db_record_id = rec.id
                persisted += 1
            except Exception as e:
                logger.error("db_item_persist_failed", trace_id=item.trace_id, error=str(e))

        context.db_persisted_count = persisted
        db_repo.finalize_batch(
            context.batch_id,
            valid_count=len(context.valid_items),
            flagged_count=len(context.flagged_items),
        )
        logger.info("database_persistence_complete", count=persisted)

    def step_export(context: PipelineContext):
        csv_files = csv_exporter.export(context)
        txt_files = txt_exporter.export(context)
        context.generated_files.extend(csv_files + txt_files)

    # Assemble pipeline chain
    pipeline.add_step(step_extract_ocr)
    pipeline.add_step(step_resolve_rules)
    pipeline.add_step(step_validate)
    if db_repo:
        pipeline.add_step(step_persist_database)
    pipeline.add_step(step_export)

    # 5. Ingestion / Source Items
    initial_items = []
    if args.dry_run:
        logger.info("creating_dry_run_sample_payload")
        sample_att = create_sample_attachment()
        initial_items.append(
            PipelineItem(
                trace_id=f"TRACE-{uuid.uuid4().hex[:12].upper()}",
                attachment=sample_att,
            )
        )
    else:
        graph_client = MicrosoftGraphEmailClient(config)
        attachment_handler = AttachmentHandler(config)

        if graph_client.authenticate():
            emails = graph_client.fetch_invoice_emails(max_count=args.max_emails)
            for msg in emails:
                raw_atts = msg.raw_payload.get("attachments", [])
                processed = attachment_handler.process_attachments(
                    raw_attachments=raw_atts,
                    email_id=msg.message_id,
                    sender=msg.sender_email,
                )
                for p_att in processed:
                    initial_items.append(
                        PipelineItem(
                            trace_id=f"TRACE-{uuid.uuid4().hex[:12].upper()}",
                            attachment=p_att,
                        )
                    )
        else:
            logger.error("ingestion_halted_auth_failed")
            sys.exit(1)

    # 6. Execute Pipeline
    result_context = pipeline.execute(initial_items)

    # 7. Optional Notification Dispatch
    if not args.dry_run and config.get("notifications", {}).get("enabled", False):
        dispatcher = PipelineNotificationDispatcher(config)
        dispatcher.dispatch_summary(result_context, graph_client.token or "")

    logger.info("execution_finished_successfully", batch_id=result_context.batch_id)

if __name__ == "__main__":
    main()
