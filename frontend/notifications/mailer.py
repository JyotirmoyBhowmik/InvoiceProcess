import base64
import os
from typing import Any, Dict, List
import requests
from core.logger import get_logger
from core.pipeline import PipelineContext

class PipelineNotificationDispatcher:
    """Dispatches execution summary emails and attachments via Microsoft Graph API."""

    GRAPH_SEND_URL = "https://graph.microsoft.com/v1.0/users/{user}/sendMail"

    def __init__(self, config: Dict[str, Any]):
        self.config = config.get("notifications", {})
        self.mailbox_config = config.get("mailbox", {})
        self.recipients = self.config.get("recipient_emails", [])
        self.sender = self.config.get("sender_email") or self.mailbox_config.get("target_mailbox")
        self.logger = get_logger()

    def dispatch_summary(self, context: PipelineContext, token: str) -> bool:
        if not self.config.get("enabled", True):
            return True

        if not context.items and not self.config.get("send_empty_reports", False):
            self.logger.info("mailer_skipped_empty_batch")
            return True

        status = "SUCCESS" if not context.flagged_items else "WARNING_REVIEW_NEEDED"
        subject = self.config.get(
            "subject_template", "[INVOICE-PIPELINE] Batch {batch_id} - {status}"
        ).format(batch_id=context.batch_id, status=status)

        html_body = self._build_html_summary(context, status)
        attachments = self._prepare_attachments(context.generated_files)

        payload = {
            "message": {
                "subject": subject,
                "body": {"contentType": "HTML", "content": html_body},
                "toRecipients": [{"emailAddress": {"address": email}} for email in self.recipients],
                "attachments": attachments,
            },
            "saveToSentItems": True,
        }

        url = self.GRAPH_SEND_URL.format(user=self.sender)
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            if resp.status_code in (200, 202):
                self.logger.info("summary_email_sent", recipients=self.recipients, files_count=len(attachments))
                return True
            else:
                self.logger.error("mailer_send_failed", status=resp.status_code, body=resp.text)
                return False
        except Exception as e:
            self.logger.error("mailer_exception", error=str(e), exc_info=True)
            return False

    def _build_html_summary(self, context: PipelineContext, status: str) -> str:
        color = "#16a34a" if status == "SUCCESS" else "#dc2626"
        return f"""
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
            <div style="max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #0f172a; padding: 20px; color: #ffffff;">
                    <h2 style="margin: 0; font-size: 18px;">Invoice Processing Pipeline Audit Report</h2>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Batch ID: {context.batch_id}</p>
                </div>
                <div style="padding: 24px;">
                    <div style="display: inline-block; padding: 4px 12px; background: {color}20; color: {color}; border-radius: 4px; font-weight: bold; font-size: 12px; margin-bottom: 16px;">
                        Status: {status}
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; color: #64748b;">Total Invoices Processed</td>
                            <td style="padding: 8px 0; font-weight: bold; text-align: right;">{len(context.items)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; color: #64748b;">Reconciled & Validated</td>
                            <td style="padding: 8px 0; font-weight: bold; color: #16a34a; text-align: right;">{len(context.valid_items)}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 8px 0; color: #64748b;">Flagged Exceptions</td>
                            <td style="padding: 8px 0; font-weight: bold; color: #dc2626; text-align: right;">{len(context.flagged_items)}</td>
                        </tr>
                    </table>

                    <h4 style="margin: 16px 0 8px 0; font-size: 14px;">Generated Accounting Artifacts:</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px;">
                        {''.join(f'<li>{os.path.basename(f)}</li>' for f in context.generated_files) if context.generated_files else '<li>No files generated</li>'}
                    </ul>
                </div>
                <div style="background-color: #f8fafc; padding: 12px 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                    Automated by Vertex AI Agent Builder & Microsoft Graph API Ingestion Pipeline.
                </div>
            </div>
        </body>
        </html>
        """

    def _prepare_attachments(self, file_paths: List[str]) -> List[Dict[str, Any]]:
        attachments = []
        for path in file_paths:
            if not os.path.exists(path):
                continue
            with open(path, "rb") as f:
                content = base64.b64encode(f.read()).decode("utf-8")
            attachments.append({
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": os.path.basename(path),
                "contentType": "text/csv" if path.endswith(".csv") else "text/plain",
                "contentBytes": content,
            })
        return attachments
