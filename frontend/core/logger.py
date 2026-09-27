import sys
import uuid
import structlog
from typing import Any, Dict

def setup_logger(log_level: str = "INFO") -> None:
    """Configures structured JSON logging with ISO timestamps and trace context."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(structlog.stdlib, log_level.upper(), structlog.stdlib.INFO)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )

def get_logger(trace_id: str | None = None) -> structlog.BoundLogger:
    """Returns a bound logger injected with the active Trace_ID."""
    active_trace_id = trace_id or str(uuid.uuid4())
    return structlog.get_logger().bind(trace_id=active_trace_id)
