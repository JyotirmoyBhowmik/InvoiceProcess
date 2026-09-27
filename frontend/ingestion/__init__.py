from .base import BaseEmailIngestor
from .graph_client import MicrosoftGraphEmailClient
from .attachment_handler import AttachmentHandler, ProcessedAttachment

__all__ = [
    "BaseEmailIngestor",
    "MicrosoftGraphEmailClient",
    "AttachmentHandler",
    "ProcessedAttachment",
]
