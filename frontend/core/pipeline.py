import os
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional
import yaml

from ai.schemas import NormalizedInvoice
from core.logger import get_logger
from core.validator import InvoiceValidator, ValidationResult
from ingestion.attachment_handler import ProcessedAttachment

@dataclass
class PipelineItem:
    trace_id: str
    attachment: ProcessedAttachment
    invoice: Optional[NormalizedInvoice] = None
    vendor_code: str = "VEND_UNKNOWN"
    tax_code: str = "TX_GEN_13"
    gl_account: str = "GL-699999"
    cost_center: str = "CC-GEN-OVERHEAD"
    validation: Optional[ValidationResult] = None
    raw_response: Dict[str, Any] = field(default_factory=dict)
    tokens_consumed: int = 0
    error: Optional[str] = None
    db_record_id: Optional[int] = None

@dataclass
class PipelineContext:
    batch_id: str
    start_time: datetime
    config: Dict[str, Any]
    items: List[PipelineItem] = field(default_factory=list)
    valid_items: List[PipelineItem] = field(default_factory=list)
    flagged_items: List[PipelineItem] = field(default_factory=list)
    generated_files: List[str] = field(default_factory=list)
    db_persisted_count: int = 0

class InvoicePipeline:
    """Modular chain-of-responsibility pipeline runner for automated invoice ingestion and DB persistence."""

    def __init__(self, config_path: str = "config/app_config.yaml"):
        with open(config_path, "r", encoding="utf-8") as f:
            self.raw_config = yaml.safe_load(f)

        # Resolve environment variable placeholders
        self.config = self._interpolate_env(self.raw_config)
        self.validator = InvoiceValidator(
            tolerance=float(self.config.get("system", {}).get("rounding_tolerance", 0.05))
        )
        self.steps: List[Callable[[PipelineContext], None]] = []

    def _interpolate_env(self, data: Any) -> Any:
        if isinstance(data, dict):
            return {k: self._interpolate_env(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._interpolate_env(item) for item in data]
        elif isinstance(data, str) and data.startswith("${") and data.endswith("}"):
            var_content = data[2:-1]
            if ":-" in var_content:
                var_name, default_val = var_content.split(":-", 1)
                return os.getenv(var_name, default_val)
            return os.getenv(var_content, f"MISSING_{var_content}")
        return data

    def add_step(self, step_func: Callable[[PipelineContext], None]) -> "InvoicePipeline":
        self.steps.append(step_func)
        return self

    def execute(self, initial_items: List[PipelineItem] | None = None) -> PipelineContext:
        batch_id = f"{self.config.get('rules', {}).get('fixed_fields', {}).get('Batch_ID_Prefix', 'BATCH')}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        logger = get_logger(batch_id)
        logger.info(
            "pipeline_started",
            batch_id=batch_id,
            step_count=len(self.steps),
            db_dialect=self.config.get("database", {}).get("dialect", "postgresql"),
        )

        context = PipelineContext(
            batch_id=batch_id,
            start_time=datetime.utcnow(),
            config=self.config,
            items=initial_items or [],
        )

        for step in self.steps:
            step_name = getattr(step, "__name__", str(step))
            logger.info("executing_step", step=step_name, batch_id=batch_id)
            try:
                step(context)
            except Exception as e:
                logger.error("step_failed", step=step_name, error=str(e), exc_info=True)

        # Partition valid vs flagged
        context.valid_items = [i for i in context.items if i.validation and i.validation.is_valid]
        context.flagged_items = [i for i in context.items if not i.validation or not i.validation.is_valid]

        logger.info(
            "pipeline_completed",
            batch_id=batch_id,
            total_items=len(context.items),
            valid_count=len(context.valid_items),
            flagged_count=len(context.flagged_items),
            db_persisted=context.db_persisted_count,
            files_count=len(context.generated_files),
        )

        return context
