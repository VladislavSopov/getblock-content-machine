import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost/postgres")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=True)
read_engine = create_async_engine(DATABASE_URL, echo=False, isolation_level="AUTOCOMMIT")
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

ReadSessionLocal = async_sessionmaker(
    bind=read_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def get_read_db():
    async with ReadSessionLocal() as session:
        yield session

async def create_all_tables():
    import models  # Import here to avoid circular imports
    async with engine.begin() as conn:
        # For development, we create tables if they don't exist
        # In production, use Alembic
        await conn.run_sync(Base.metadata.create_all)
        # Migrate: add status column to content_batches if missing
        await conn.execute(text(
            "ALTER TABLE content_batches ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'"
        ))
        # Backfill: mark old batches that have drafts as done
        await conn.execute(text(
            "UPDATE content_batches SET status = 'done' WHERE status = 'pending' AND id IN (SELECT DISTINCT batch_id FROM content_drafts)"
        ))
