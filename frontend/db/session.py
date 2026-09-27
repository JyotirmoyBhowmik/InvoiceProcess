import os
import urllib.parse
from typing import Any, Dict, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session
from core.logger import get_logger
from db.models import Base

_engine: Optional[Engine] = None
_session_factory: Optional[sessionmaker] = None

def build_connection_url(db_config: Dict[str, Any]) -> str:
    """Builds standard connection URI for PostgreSQL (psycopg2) or MySQL (pymysql)."""
    dialect = db_config.get("dialect", "postgresql").lower()
    host = db_config.get("host", "localhost")
    port = int(db_config.get("port", 5432 if dialect == "postgresql" else 3306))
    database = db_config.get("database_name", "invoice_erp_db")
    username = db_config.get("username", "postgres" if dialect == "postgresql" else "root")
    password = db_config.get("password", "")

    # URL encode password for special characters
    safe_password = urllib.parse.quote_plus(str(password))

    if dialect == "mysql":
        driver = db_config.get("driver", "pymysql")
        # Example: mysql+pymysql://user:pass@localhost:3306/dbname?charset=utf8mb4
        return f"mysql+{driver}://{username}:{safe_password}@{host}:{port}/{database}?charset=utf8mb4"
    else:
        # Default: PostgreSQL
        driver = db_config.get("driver", "psycopg2")
        ssl_mode = db_config.get("ssl_mode", "prefer")
        # Example: postgresql+psycopg2://user:pass@localhost:5432/dbname?sslmode=prefer
        return f"postgresql+{driver}://{username}:{safe_password}@{host}:{port}/{database}?sslmode={ssl_mode}"

def get_db_engine(config: Dict[str, Any]) -> Engine:
    """Returns singleton pooled SQLAlchemy Engine."""
    global _engine
    if _engine is not None:
        return _engine

    db_cfg = config.get("database", {})
    url = build_connection_url(db_cfg)
    logger = get_logger()

    logger.info(
        "database_connecting",
        dialect=db_cfg.get("dialect", "postgresql"),
        host=db_cfg.get("host"),
        port=db_cfg.get("port"),
        database=db_cfg.get("database_name"),
    )

    _engine = create_engine(
        url,
        pool_size=int(db_cfg.get("pool_size", 10)),
        max_overflow=int(db_cfg.get("max_overflow", 20)),
        pool_timeout=int(db_cfg.get("pool_timeout", 30)),
        pool_recycle=int(db_cfg.get("pool_recycle", 1800)),
        echo=bool(db_cfg.get("echo_sql", False)),
    )
    return _engine

def get_db_session(config: Dict[str, Any]) -> Session:
    """Returns a new scoped SQLAlchemy Session."""
    global _session_factory
    if _session_factory is None:
        engine = get_db_engine(config)
        _session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return _session_factory()

def init_database(config: Dict[str, Any]) -> bool:
    """Tests connection and automatically creates tables if auto_migrate is true."""
    logger = get_logger()
    try:
        engine = get_db_engine(config)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            conn.commit()

        if config.get("database", {}).get("auto_migrate", True):
            Base.metadata.create_all(engine)
            logger.info("database_schema_synced", status="tables_created_or_verified")

        return True
    except Exception as e:
        logger.error("database_init_failed", error=str(e), exc_info=True)
        return False
