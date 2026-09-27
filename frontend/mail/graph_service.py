import base64
import os
import time
from typing import Any, Dict, List, Optional
import msal
import requests
from core.logger import get_logger

class ExchangeOnlineGraphService:
    """Enterprise Microsoft Exchange Online Client via Microsoft Graph API.
    Supports:
    1. Dedicated User ID (Delegated / ROPC authentication)
    2. App Registration (Client Credentials / Certificate authentication)
    Features proactive token cache renewal, mailbox polling, and automated reply dispatch.
    """

    GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0"

    def __init__(self, config: Dict[str, Any]):
        self.config = config.get("mailbox", {})
        self.tenant_id = self.config.get("tenant_id") or os.getenv("AZURE_TENANT_ID", "")
        self.client_id = self.config.get("client_id") or os.getenv("AZURE_CLIENT_ID", "")
        self.client_secret = self.config.get("client_secret") or os.getenv("AZURE_CLIENT_SECRET", "")
        self.username = self.config.get("dedicated_user_id") or os.getenv("AZURE_DEDICATED_USER", "")
        self.password = self.config.get("dedicated_password") or os.getenv("AZURE_DEDICATED_PASS", "")
        self.auth_mode = self.config.get("auth_mode", "app_credential") # "app_credential" or "dedicated_user"
        self.target_mailbox = self.config.get("target_mailbox") or self.username
        self.folder = self.config.get("folder", "Inbox")

        self.logger = get_logger()
        self._token: Optional[str] = None
        self._token_expires_at: float = 0.0
        self._msal_app: Optional[msal.ClientApplication] = None

    def _get_msal_app(self) -> msal.ClientApplication:
        if self._msal_app is not None:
            return self._msal_app

        authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        if self.auth_mode == "dedicated_user" and self.username and self.password:
            self._msal_app = msal.PublicClientApplication(
                client_id=self.client_id,
                authority=authority,
            )
        else:
            self._msal_app = msal.ConfidentialClientApplication(
                client_id=self.client_id,
                client_credential=self.client_secret,
                authority=authority,
            )
        return self._msal_app

    def acquire_token(self, force_refresh: bool = False) -> Optional[str]:
        """Proactively checks token validity and refreshes before expiration."""
        now = time.time()
        # If token exists and is valid for > 5 minutes, return cached token
        if self._token and not force_refresh and (self._token_expires_at - now) > 300:
            return self._token

        app = self._get_msal_app()
        scopes = ["https://graph.microsoft.com/.default"]
        result = None

        if self.auth_mode == "dedicated_user" and self.username and self.password:
            # Resource Owner Password Credentials (ROPC) for dedicated service account
            result = app.acquire_token_by_username_password(
                username=self.username,
                password=self.password,
                scopes=scopes,
            )
        else:
            # Client Credentials Application Permission
            result = app.acquire_token_silent(scopes, account=None)
            if not result:
                result = app.acquire_token_for_client(scopes=scopes)

        if result and "access_token" in result:
            self._token = result["access_token"]
            expires_in = result.get("expires_in", 3600)
            self._token_expires_at = now + float(expires_in)
            self.logger.info("exchange_token_acquired", auth_mode=self.auth_mode, expires_in=expires_in)
            return self._token
        else:
            err = result.get("error_description", result.get("error")) if result else "Unknown token error"
            self.logger.error("exchange_token_failed", error=err)
            return None

    def _auth_headers(self) -> Dict[str, str]:
        token = self.acquire_token()
        if not token:
            raise ConnectionError("Unable to acquire valid Microsoft Graph OAuth2 token")
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def poll_unread_invoices(self, max_items: int = 25) -> List[Dict[str, Any]]:
        """Polls mailbox for unread emails with attachments."""
        url = (
            f"{self.GRAPH_ENDPOINT}/users/{self.target_mailbox}/mailFolders/{self.folder}/messages"
            f"?$filter=isRead eq false and hasAttachments eq true"
            f"&$select=id,sender,subject,receivedDateTime,hasAttachments"
            f"&$expand=attachments($select=id,name,contentType,size,isInline,contentBytes)"
            f"&$top={max_items}"
        )
        try:
            resp = requests.get(url, headers=self._auth_headers(), timeout=30)
            resp.raise_for_status()
            data = resp.json().get("value", [])
            self.logger.info("polled_inbound_messages", count=len(data), mailbox=self.target_mailbox)
            return data
        except Exception as e:
            self.logger.error("poll_failed", error=str(e), mailbox=self.target_mailbox)
            return []

    def send_automated_reply(
        self,
        original_message_id: str,
        recipient_email: str,
        invoice_number: str,
        status: str, # "APPROVED", "RECONCILED", "NEEDS_REVIEW", "REJECTED"
        audit_summary: str,
    ) -> bool:
        """Sends an automated structured reply email informing the sender/supplier of invoice status."""
        subject = f"Re: Invoice #{invoice_number} Processing Status - [{status}]"
        
        status_color = "#16a34a" if status in ("APPROVED", "RECONCILED") else "#d97706" if status == "NEEDS_REVIEW" else "#dc2626"
        
        html_body = f"""
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #0f172a; padding: 18px 24px; color: #ffffff;">
                    <h3 style="margin: 0; font-size: 16px;">Automated Accounts Payable Notice</h3>
                    <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 12px;">Invoice Ref: {invoice_number}</p>
                </div>
                <div style="padding: 20px;">
                    <div style="display: inline-block; padding: 4px 12px; background: {status_color}20; color: {status_color}; border-radius: 4px; font-weight: bold; font-size: 12px; margin-bottom: 14px;">
                        Transaction Status: {status}
                    </div>
                    <p style="font-size: 13px; color: #334155; margin-bottom: 12px;">
                        Your invoice has been processed by our automated server pipeline.
                    </p>
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; font-size: 12px; font-family: monospace; color: #475569;">
                        {audit_summary}
                    </div>
                </div>
                <div style="background-color: #f8fafc; padding: 10px 20px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                    Automated service delivery notice • Please do not reply directly to this mailbox.
                </div>
            </div>
        </body>
        </html>
        """

        reply_payload = {
            "message": {
                "subject": subject,
                "body": {"contentType": "HTML", "content": html_body},
                "toRecipients": [{"emailAddress": {"address": recipient_email}}],
            },
            "saveToSentItems": True,
        }

        url = f"{self.GRAPH_ENDPOINT}/users/{self.target_mailbox}/sendMail"
        try:
            resp = requests.post(url, headers=self._auth_headers(), json=reply_payload, timeout=30)
            if resp.status_code in (200, 202):
                self.logger.info("automated_reply_dispatched", recipient=recipient_email, status=status)
                return True
            else:
                self.logger.error("reply_dispatch_failed", status_code=resp.status_code, body=resp.text)
                return False
        except Exception as e:
            self.logger.error("reply_exception", error=str(e))
            return False

    def mark_as_read(self, message_id: str) -> bool:
        url = f"{self.GRAPH_ENDPOINT}/users/{self.target_mailbox}/messages/{message_id}"
        try:
            resp = requests.patch(url, headers=self._auth_headers(), json={"isRead": True}, timeout=15)
            return resp.status_code in (200, 204)
        except Exception:
            return False
