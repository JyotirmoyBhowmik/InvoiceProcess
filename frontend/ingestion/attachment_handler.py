import base64
import io
import os
import re
import zipfile
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from core.logger import get_logger

@dataclass
class ProcessedAttachment:
    filename: str
    content_bytes: bytes
    mime_type: str
    size_bytes: int
    source_email_id: str
    sender_email: str
    is_from_zip: bool = False
    parent_zip_name: Optional[str] = None

class AttachmentHandler:
    """Filters, sanitizes, and extracts document payloads from email attachments including nested ZIP files."""

    ALLOWED_MIME_TYPES = {
        "application/pdf": ".pdf",
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/tiff": ".tiff",
        "image/svg+xml": ".svg",
    }

    ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".svg"}

    MAGIC_NUMBERS = {
        b"%PDF": "application/pdf",
        b"\x89PNG\r\n\x1a\n": "image/png",
        b"\xff\xd8\xff": "image/jpeg",
        b"II*\x00": "image/tiff",
        b"MM\x00*": "image/tiff",
        b"PK\x03\x04": "application/zip",
    }

    def __init__(self, config: Dict[str, Any]):
        self.config = config.get("mailbox", {}).get("filters", {})
        self.reject_patterns = self.config.get(
            "reject_file_patterns", ["signature", "logo", "banner", "facebook", "twitter", "linkedin", "icon"]
        )
        self.max_zip_file_count = int(self.config.get("max_zip_file_count", 25))
        self.logger = get_logger()

    def process_attachments(
        self, raw_attachments: List[Dict[str, Any]], email_id: str, sender: str
    ) -> List[ProcessedAttachment]:
        valid_attachments: List[ProcessedAttachment] = []

        for att in raw_attachments:
            name = att.get("name", "").strip()
            is_inline = att.get("isInline", False)

            # 1. Reject inline email decorative elements (e.g. embedded logo signatures)
            if is_inline and any(pat.lower() in name.lower() for pat in self.reject_patterns):
                continue

            # 2. Check extension rejection patterns
            name_lower = name.lower()
            if any(re.search(rf"\b{pat}\b", name_lower) for pat in self.reject_patterns):
                continue

            # 3. Extract base64 content
            content_b64 = att.get("contentBytes")
            if not content_b64:
                continue

            try:
                raw_bytes = base64.b64decode(content_b64)
            except Exception:
                continue

            # Check if this attachment is a ZIP archive
            if name_lower.endswith(".zip") or raw_bytes.startswith(b"PK\x03\x04"):
                extracted_from_zip = self._unpack_zip_archive(raw_bytes, name, email_id, sender)
                valid_attachments.extend(extracted_from_zip)
                continue

            # 4. Extension & Magic byte verification
            _, ext = os.path.splitext(name_lower)
            if ext not in self.ALLOWED_EXTENSIONS:
                continue

            detected_mime = self._detect_magic_mime(raw_bytes)
            if not detected_mime or detected_mime not in self.ALLOWED_MIME_TYPES:
                reported_mime = att.get("contentType", "").lower()
                if reported_mime in self.ALLOWED_MIME_TYPES:
                    detected_mime = reported_mime
                elif ext == ".pdf":
                    detected_mime = "application/pdf"
                else:
                    continue

            # 5. Reject zero-byte or suspiciously small attachments (e.g. 1px tracking pixels)
            if len(raw_bytes) < 1024:
                continue

            valid_attachments.append(
                ProcessedAttachment(
                    filename=name,
                    content_bytes=raw_bytes,
                    mime_type=detected_mime,
                    size_bytes=len(raw_bytes),
                    source_email_id=email_id,
                    sender_email=sender,
                )
            )

        self.logger.info(
            "attachments_processed",
            email_id=email_id,
            input_count=len(raw_attachments),
            valid_count=len(valid_attachments),
        )
        return valid_attachments

    def _unpack_zip_archive(
        self, zip_bytes: bytes, zip_name: str, email_id: str, sender: str
    ) -> List[ProcessedAttachment]:
        """Extracts nested PDFs and images from in-memory ZIP archive safely."""
        extracted: List[ProcessedAttachment] = []
        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                file_list = zf.infolist()
                for info in file_list[: self.max_zip_file_count]:
                    if info.is_dir():
                        continue

                    inner_name = os.path.basename(info.filename)
                    inner_lower = inner_name.lower()

                    # Filter out macos metadata and junk
                    if inner_name.startswith(".") or "__MACOSX" in info.filename:
                        continue

                    _, ext = os.path.splitext(inner_lower)
                    if ext not in self.ALLOWED_EXTENSIONS:
                        continue

                    # Filter out logos
                    if any(pat.lower() in inner_lower for pat in self.reject_patterns):
                        continue

                    file_content = zf.read(info.filename)
                    if len(file_content) < 1024:
                        continue

                    mime = "application/pdf" if ext == ".pdf" else (
                        "image/png" if ext == ".png" else "image/jpeg"
                    )

                    extracted.append(
                        ProcessedAttachment(
                            filename=inner_name,
                            content_bytes=file_content,
                            mime_type=mime,
                            size_bytes=len(file_content),
                            source_email_id=email_id,
                            sender_email=sender,
                            is_from_zip=True,
                            parent_zip_name=zip_name,
                        )
                    )

            self.logger.info("zip_unpacked", zip_name=zip_name, extracted_count=len(extracted))
        except Exception as e:
            self.logger.error("zip_unpack_failed", zip_name=zip_name, error=str(e))

        return extracted

    def _detect_magic_mime(self, data: bytes) -> Optional[str]:
        for magic, mime in self.MAGIC_NUMBERS.items():
            if data.startswith(magic):
                return mime
        return None
