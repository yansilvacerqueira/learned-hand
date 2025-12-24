from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
import logging

from app.config import settings

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.DATABASE_URL, echo=False)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

        # Enable pg_trgm extension for better text search (if not already enabled)
        # This allows GIN indexes with gin_trgm_ops for ILIKE queries
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
            # Create GIN index for content search if it doesn't exist
            await conn.execute(
                text("""
                    CREATE INDEX IF NOT EXISTS idx_document_content_gin
                    ON documents USING gin(content gin_trgm_ops);
                """)
            )
            logger.info("Successfully created pg_trgm extension and GIN index for content search")
        except Exception as e:
            # Extension might not be available or index might already exist
            # This is not critical for basic functionality
            logger.warning(f"Could not create pg_trgm extension or GIN index: {e}")
            logger.info("Continuing without pg_trgm extension - basic search will still work")
