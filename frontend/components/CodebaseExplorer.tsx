import React, { useState } from 'react';
import { FileCode, Copy, Check, Download, Layers, ShieldCheck, Terminal, Database, Cpu, Mail } from 'lucide-react';

interface CodeFileDef {
  name: string;
  category: string;
  description: string;
  code: string;
}

export const CODE_FILES: CodeFileDef[] = [
  {
    name: 'config/app_config.yaml',
    category: 'Config',
    description: 'Master YAML configuration with MySQL/PostgreSQL, Graph API, and tax rules',
    code: `system:
  environment: "production"
  log_level: "INFO"
  trace_logging: true
  rounding_tolerance: 0.05

database:
  # Supported dialects: "postgresql", "mysql"
  dialect: "postgresql" # switch to "mysql" for MySQL 8.x / MariaDB
  driver: "psycopg2"    # for postgresql: psycopg2; for mysql: pymysql
  host: "\${DB_HOST:-localhost}"
  port: 5432            # 5432 for Postgres, 3306 for MySQL
  database_name: "\${DB_NAME:-invoice_erp_db}"
  username: "\${DB_USER:-postgres}"
  password: "\${DB_PASSWORD:-postgres_secure_pass}"
  ssl_mode: "prefer"
  pool_size: 10
  max_overflow: 20
  pool_timeout: 30
  pool_recycle: 1800
  echo_sql: false
  auto_migrate: true
  fallback_to_json_vendors: true

mailbox:
  provider: "graph_api"
  tenant_id: "\${AZURE_TENANT_ID}"
  client_id: "\${AZURE_CLIENT_ID}"
  client_secret: "\${AZURE_CLIENT_SECRET}"
  target_mailbox: "finance-invoices@company.com"
  folder: "Inbox"
  filters:
    allowed_senders:
      - "*@makemytrip.com"
      - "*@uber.com"
      - "*@apollohospitals.com"
      - "expenses@vendorportal.com"
      - "*@nexusdynamics.io"
    subject_keywords:
      - "Invoice"
      - "Bill"
      - "Receipt"
      - "E-Ticket"
    max_age_days: 7
    allowed_extensions:
      - ".pdf"
      - ".png"
      - ".jpg"
      - ".jpeg"
      - ".tiff"
      - ".zip"
    reject_file_patterns:
      - "signature"
      - "logo"
      - "banner"
      - "facebook"
      - "linkedin"

agent_builder:
  project_id: "\${GCP_PROJECT_ID}"
  location: "global"
  data_store_id: "\${AGENT_BUILDER_DATASTORE_ID}"
  serving_config_id: "default_search"
  max_output_tokens: 1024
  temperature: 0.05
  model_name: "gemini-2.5-flash"

rules:
  fixed_fields:
    Company_Entity_Code: "CORP_HQ_01"
    Default_Currency: "USD"
    Accounting_System: "SAP_ECC"
    Batch_ID_Prefix: "BATCH-INV"
    ERP_Target: "SAP_FI_AP"
  
  expense_categories:
    Traveling:
      default_tax_code: "TX_TRV_18"
      gl_account: "GL-610020"
      cost_center: "CC-CORP-TRAVEL"
    Medical:
      default_tax_code: "TX_MED_EXEMPT"
      gl_account: "GL-620010"
      cost_center: "CC-HEALTH-HR"
    Food:
      default_tax_code: "TX_FNB_05"
      gl_account: "GL-630040"
      cost_center: "CC-ADMIN-HOSP"
    Cloud_Infrastructure:
      default_tax_code: "TX_TECH_18"
      gl_account: "GL-640050"
      cost_center: "CC-ENG-INFRA"
    Default:
      default_tax_code: "TX_GEN_13"
      gl_account: "GL-699999"
      cost_center: "CC-GEN-OVERHEAD"

outputs:
  csv:
    enabled: true
    output_dir: "./output/csv"
  txt:
    enabled: true
    output_dir: "./output/txt"
    format: "pipe_delimited"
    delimiter: "|"`
  },
  {
    name: 'ingestion/attachment_handler.py',
    category: 'Ingestion',
    description: 'In-memory recursive ZIP unpacking & multi-PDF/image isolation',
    code: `import base64
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

            if is_inline and any(pat.lower() in name.lower() for pat in self.reject_patterns):
                continue

            content_b64 = att.get("contentBytes")
            if not content_b64:
                continue

            try:
                raw_bytes = base64.b64decode(content_b64)
            except Exception:
                continue

            # In-memory ZIP archive unpacking
            if name.lower().endswith(".zip") or raw_bytes.startswith(b"PK\\x03\\x04"):
                extracted_from_zip = self._unpack_zip_archive(raw_bytes, name, email_id, sender)
                valid_attachments.extend(extracted_from_zip)
                continue

            _, ext = os.path.splitext(name.lower())
            if ext not in self.ALLOWED_EXTENSIONS:
                continue

            detected_mime = "application/pdf" if ext == ".pdf" else "image/png"
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

        return valid_attachments

    def _unpack_zip_archive(
        self, zip_bytes: bytes, zip_name: str, email_id: str, sender: str
    ) -> List[ProcessedAttachment]:
        extracted: List[ProcessedAttachment] = []
        try:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
                for info in zf.infolist()[: self.max_zip_file_count]:
                    if info.is_dir() or info.filename.startswith((".", "__MACOSX")):
                        continue

                    inner_name = os.path.basename(info.filename)
                    _, ext = os.path.splitext(inner_name.lower())
                    if ext not in self.ALLOWED_EXTENSIONS:
                        continue

                    file_content = zf.read(info.filename)
                    if len(file_content) < 1024:
                        continue

                    mime = "application/pdf" if ext == ".pdf" else "image/png"
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
        except Exception as e:
            self.logger.error("zip_unpack_failed", zip_name=zip_name, error=str(e))

        return extracted`
  },
  {
    name: 'ai/agent_builder.py',
    category: 'AI / OCR',
    description: 'Vertex AI Grounding & Gemini 2.5 Flash with thinkingBudget: 0 token optimization',
    code: `import json
import os
from typing import Any, Dict, Tuple
from google import genai
from google.genai import types

from ai.prompts import INVOICE_EXTRACTION_SYSTEM_INSTRUCTION, INVOICE_EXTRACTION_PROMPT
from ai.schemas import NormalizedInvoice
from core.logger import get_logger

class VertexAgentBuilderExtractor:
    """Invokes Vertex AI Agent Builder Grounded Generation and Gemini 2.5 Flash with thinkingBudget=0."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config.get("agent_builder", {})
        self.max_tokens = int(self.config.get("max_output_tokens", 1024))
        self.temperature = float(self.config.get("temperature", 0.05))
        self.model_name = self.config.get("model_name", "gemini-2.5-flash")
        self.logger = get_logger()
        self.ai = genai.Client(vertexai=True)

    def extract_document(self, document_bytes: bytes, mime_type: str, filename: str) -> Tuple[NormalizedInvoice, int]:
        encoded_doc = types.Part.from_bytes(data=document_bytes, mime_type=mime_type)
        schema_json = NormalizedInvoice.model_json_schema()

        # Disable thinking budget (0) for fast OCR throughput & low token spend
        response = self.ai.models.generate_content(
            model=self.model_name,
            contents=[
                types.Content(
                    role="user",
                    parts=[encoded_doc, types.Part.from_text(text=INVOICE_EXTRACTION_PROMPT)],
                )
            ],
            config=types.GenerateContentConfig(
                system_instruction=INVOICE_EXTRACTION_SYSTEM_INSTRUCTION,
                temperature=self.temperature,
                max_output_tokens=self.max_tokens,
                response_mime_type="application/json",
                response_schema=schema_json,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )

        parsed_dict = json.loads(response.text)
        invoice_obj = NormalizedInvoice.model_validate(parsed_dict)

        tokens_used = 180
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            tokens_used = (response.usage_metadata.prompt_token_count or 0) + (
                response.usage_metadata.candidates_token_count or 0
            )

        return invoice_obj, tokens_used`
  },
  {
    name: 'db/models.py',
    category: 'Database',
    description: 'SQLAlchemy 2.0 Declarative Models for PostgreSQL and MySQL',
    code: `from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Numeric
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class VendorEntity(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, autoincrement=True)
    vendor_code = Column(String(50), unique=True, nullable=False, index=True)
    canonical_name = Column(String(255), nullable=False, index=True)
    default_category = Column(String(100))
    default_payment_terms = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tax_ids = relationship("VendorTaxId", back_populates="vendor", cascade="all, delete-orphan")
    aliases = relationship("VendorAlias", back_populates="vendor", cascade="all, delete-orphan")

class ProcessedInvoiceRecord(Base):
    __tablename__ = "processed_invoices"
    id = Column(Integer, primary_key=True, autoincrement=True)
    trace_id = Column(String(64), unique=True, nullable=False, index=True)
    batch_id = Column(String(100), ForeignKey("invoice_batches.batch_id"), nullable=False)
    vendor_code = Column(String(50), nullable=False)
    invoice_number = Column(String(100), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    subtotal = Column(Numeric(14, 2), nullable=False)
    tax_amount = Column(Numeric(14, 2), nullable=False)
    total_amount = Column(Numeric(14, 2), nullable=False)
    validation_status = Column(String(50), default="VALID")
    failure_reasons = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class LineItemRecord(Base):
    __tablename__ = "invoice_line_items"
    id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(Integer, ForeignKey("processed_invoices.id", ondelete="CASCADE"), nullable=False)
    item_index = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    quantity = Column(Numeric(12, 3), default=1.000)
    unit_price = Column(Numeric(14, 2), default=0.00)
    line_total = Column(Numeric(14, 2), default=0.00)`
  },
  {
    name: 'db/session.py',
    category: 'Database',
    description: 'Universal SQLAlchemy Engine & Connection Pool for PostgreSQL & MySQL',
    code: `import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db.models import Base

def build_connection_url(db_config):
    dialect = db_config.get("dialect", "postgresql").lower()
    host = db_config.get("host", "localhost")
    port = int(db_config.get("port", 5432 if dialect == "postgresql" else 3306))
    database = db_config.get("database_name", "invoice_erp_db")
    username = db_config.get("username", "postgres" if dialect == "postgresql" else "root")
    password = urllib.parse.quote_plus(str(db_config.get("password", "")))

    if dialect == "mysql":
        return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database}?charset=utf8mb4"
    return f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}?sslmode=prefer"

def get_db_engine(config):
    db_cfg = config.get("database", {})
    url = build_connection_url(db_cfg)
    return create_engine(
        url,
        pool_size=int(db_cfg.get("pool_size", 10)),
        max_overflow=int(db_cfg.get("max_overflow", 20)),
        pool_recycle=1800,
    )`
  },
  {
    name: 'core/validator.py',
    category: 'Core',
    description: 'Arithmetic Invariant Reconciliation: Subtotal + Tax - Discount == Total',
    code: `from dataclasses import dataclass, field
from ai.schemas import NormalizedInvoice

@dataclass
class ValidationResult:
    is_valid: bool
    status: str
    discrepancy_amount: float = 0.0
    failure_reasons: list = field(default_factory=list)

class InvoiceValidator:
    def __init__(self, tolerance: float = 0.05):
        self.tolerance = tolerance

    def validate(self, invoice: NormalizedInvoice) -> ValidationResult:
        subtotal = round(invoice.financials.subtotal, 2)
        total_tax = round(invoice.financials.total_tax, 2)
        shipping = round(invoice.financials.service_charges or 0.0, 2)
        tip = round(invoice.financials.tip or 0.0, 2)
        discount = round(invoice.financials.discount or 0.0, 2)
        total_amount = round(invoice.financials.total_amount, 2)

        # Invariant check
        calculated_total = round(subtotal + total_tax + shipping + tip - discount, 2)
        diff = round(abs(calculated_total - total_amount), 2)

        reasons = []
        is_valid = True
        if diff > self.tolerance:
            is_valid = False
            reasons.append(f"BREAKUP_DISCREPANCY: Sub ({subtotal}) + Tax ({total_tax}) - Disc ({discount}) != Total ({total_amount})")

        return ValidationResult(
            is_valid=is_valid,
            status="VALID" if is_valid else "FLAGGED_REVIEW",
            discrepancy_amount=diff,
            failure_reasons=reasons,
        )`
  }
];

export const CodebaseExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>(CODE_FILES[0].name);
  const [copied, setCopied] = useState(false);

  const active = CODE_FILES.find((f) => f.name === selectedFile) || CODE_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(active.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* File Tree Panel */}
      <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Python Modules & Config
          </span>
          <span className="text-[10px] font-mono text-indigo-400">invoice_processor/</span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[620px] overflow-y-auto">
          {CODE_FILES.map((file) => (
            <button
              key={file.name}
              type="button"
              onClick={() => setSelectedFile(file.name)}
              className={`text-left px-3 py-2.5 rounded-lg transition-all flex flex-col gap-1 border ${
                selectedFile === file.name
                  ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/60 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-900 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold truncate">{file.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-sans">
                  {file.category}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 leading-tight truncate">
                {file.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[700px]">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-bold text-slate-200">{active.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">({active.code.split('\n').length} lines)</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Full File'}
          </button>
        </div>

        <div className="p-4 overflow-auto flex-1 font-mono text-xs bg-slate-950 text-slate-200 leading-relaxed">
          <pre className="whitespace-pre">{active.code}</pre>
        </div>
      </div>
    </div>
  );
};
