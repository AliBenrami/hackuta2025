"""
Database configuration and session management
"""
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment variable
# Using SQLite for local development (easier setup, no separate DB server needed)
# For production, set DATABASE_URL env var to PostgreSQL connection string
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite+aiosqlite:///./hackuta.db"
)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db() -> AsyncSession:
    """
    Dependency to get database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """
    Initialize database tables
    """
    from models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
