from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, List

@dataclass
class IngestionMessage:
    message_id: str
    sender_email: str
    subject: str
    received_datetime: str
    raw_payload: Dict[str, Any]

class BaseEmailIngestor(ABC):
    """Abstract protocol for email ingestion adapters."""

    @abstractmethod
    def authenticate(self) -> bool:
        """Authenticate with provider (OAuth2, App Credentials, or credentials)."""
        pass

    @abstractmethod
    def fetch_invoice_emails(self, max_count: int = 50) -> List[IngestionMessage]:
        """Fetch emails matching filtering criteria."""
        pass

    @abstractmethod
    def mark_email_processed(self, message_id: str, success: bool) -> bool:
        """Update email metadata, mark read, or move to archive folder."""
        pass
