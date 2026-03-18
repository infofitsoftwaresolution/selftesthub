from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

from app.core.config import settings

# SSL connection args for AWS RDS
connect_args = {}
if os.path.exists(settings.SSL_CERT_PATH):
    connect_args = {
        "sslmode": "verify-full",
        "sslrootcert": settings.SSL_CERT_PATH
    }

# Create SQLAlchemy engine with proper connection settings
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=30,
    pool_timeout=60,
    echo=False,
    connect_args=connect_args
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    Dependency function that yields db sessions
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 