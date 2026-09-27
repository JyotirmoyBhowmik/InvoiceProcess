import datetime
import fnmatch
from typing import Any, Dict, List, Optional
import msal
import requests

from core.logger import get_logger
from ingestion.base import BaseEmailIngestor, IngestionMessage

class MicrosoftGraphEmailClient(BaseEmailIngestor):
    """Microsoft Graph API client with OAuth2 token caching and OData query filtering."""

    GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0"

    def __init__(self, config: Dict[str, Any]):
        self.config = config.get("mailbox", {})
        self.tenant_id = self.config.get("tenant_id")
        self.client_id = self.config.get("client_id")
        self.client_secret = self.config.get("client_secret")
        self.target_mailbox = self.config.get("target_mailbox")
        self.folder = self.config.get("folder", "Inbox")
        self.token: Optional[str] = None
        self.logger = get_logger()

    def authenticate(self) -> bool:
        """Acquires OAuth2 client credentials token from Azure AD (Entra ID)."""
        authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        app = msal.ConfidentialClientApplication(
            client_id=self.client_id,
            client_credential=self.client_secret,
            authority=authority,
        )
        scopes = ["https://graph.microsoft.com/.default"]
        result = app.acquire_token_silent(scopes, account=None)
        if not result:
            result = app.acquire_token_for_client(scopes=scopes)

        if "access_token" in result:
            self.token = result["access_token"]
            self.logger.info("ms_graph_authenticated", target_mailbox=self.target_mailbox)
            return True
        else:
            err = result.get("error_description", result.get("error"))
            self.logger.error("ms_graph_auth_failed", error=err)
            return False

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def fetch_invoice_emails(self, max_count: int = 50) -> List[IngestionMessage]:
        """Polls targeted mailbox using OData filter and expands attachments."""
        if not self.token and not self.authenticate():
            return []

        filters = self.config.get("filters", {})
        max_age_days = filters.get("max_age_days", 7)
        since_date = (datetime.datetime.utcnow() - datetime.timedelta(days=max_age_days)).strftime("%Y-%m-%dT%H:%M:%SZ")

        # OData filter: received within window and contains attachments
        odata_filter = f"hasAttachments eq true and receivedDateTime ge {since_date}"
        url = (
            f"{self.GRAPH_ENDPOINT}/users/{self.target_mailbox}/mailFolders/{self.folder}/messages"
            f"?$filter={odata_filter}&$select=id,sender,subject,receivedDateTime,hasAttachments"
            f"&$expand=attachments($select=id,name,contentType,size,isInline)"
            f"&$top={max_count}"
        )

        try:
            resp = requests.get(url, headers=self._headers(), timeout=30)
            if resp.status_code != 200:
                self.logger.error("graph_fetch_failed", status=resp.status_code, body=resp.text)
                return []

            data = resp.json().get("value", [])
            messages: List[IngestionMessage] = []

            allowed_senders = filters.get("allowed_senders", [])
            subject_keywords = filters.get("subject_keywords", [])

            for item in data:
                sender_email = (
                    item.get("sender", {}).get("emailAddress", {}).get("address", "").lower()
                )
                subject = item.get("subject", "")

                # Sender whitelist validation (glob matching)
                if allowed_senders:
                    sender_match = any(
                        fnmatch.fnmatch(sender_email, pattern.lower()) for pattern in allowed_senders
                    )
                    if not sender_match:
                        continue

                # Subject keyword matching
                if subject_keywords:
                    keyword_match = any(
                        kw.lower() in subject.lower() for kw in subject_keywords
                    )
                    if not keyword_match:
                        continue

                messages.append(
                    IngestionMessage(
                        message_id=item["id"],
                        sender_email=sender_email,
                        subject=subject,
                        received_datetime=item.get("receivedDateTime", ""),
                        raw_payload=item,
                    )
                )

            self.logger.info("emails_filtered", total_retrieved=len(data), filtered_count=len(messages))
            return messages

        except Exception as e:
            self.logger.error("graph_network_error", error=str(e), exc_info=True)
            return []

    def mark_email_processed(self, message_id: str, success: bool) -> bool:
        """Marks message read and adds category tags."""
        if not self.token:
            return False
        url = f"{self.GRAPH_ENDPOINT}/users/{self.target_mailbox}/messages/{message_id}"
        category = "Processed-Invoice" if success else "Invoice-Exception"
        payload = {
            "isRead": True,
            "categories": [category],
        }
        try:
            resp = requests.patch(url, json=payload, headers=self._headers(), timeout=15)
            return resp.status_code in (200, 204)
        except Exception:
            return False
