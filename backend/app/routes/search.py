from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Document
from app.schemas import SearchResult

router = APIRouter()


@router.get("/search")
async def search_documents(q: str, db: AsyncSession = Depends(get_db)):
    query = select(Document.id, Document.filename, Document.content).where(
        Document.content.ilike(f"%{q}%")
    )
    result = await db.execute(query)
    rows = result.fetchall()

    results = []
    for row in rows:
        content = row[2] or ""
        snippet = content[:200] + "..." if len(content) > 200 else content
        results.append(
            SearchResult(
                id=row[0],
                filename=row[1],
                snippet=snippet,
            )
        )

    return results
