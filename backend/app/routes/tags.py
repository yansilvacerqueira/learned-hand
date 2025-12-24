import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import PositiveInt
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Document, Tag
from app.schemas import TagResponse, TagCreate

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/documents/{document_id}/tags", response_model=TagResponse)
async def add_tag_to_document(
    document_id: PositiveInt,
    tag_data: TagCreate,
    db: AsyncSession = Depends(get_db)
):
    """Add a tag to a document. Creates the tag if it doesn't exist."""
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Document)
        .options(selectinload(Document.tags))
        .where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    tag_name = tag_data.name.lower().strip()

    if not tag_name:
        raise HTTPException(status_code=400, detail="Tag name cannot be empty")

    tag_result = await db.execute(select(Tag).where(Tag.name == tag_name))
    tag = tag_result.scalar_one_or_none()

    if not tag:
        tag = Tag(name=tag_name)
        db.add(tag)
        await db.flush()
        logger.info(f"Created new tag: {tag_name}")

    if tag in document.tags:
        logger.info(f"Tag {tag_name} already associated with document {document_id}")
        return TagResponse(
            id=tag.id,
            name=tag.name,
            created_at=tag.created_at
        )

    document.tags.append(tag)
    await db.commit()
    await db.refresh(tag)

    logger.info(f"Added tag '{tag_name}' to document {document_id}")
    return TagResponse(
        id=tag.id,
        name=tag.name,
        created_at=tag.created_at
    )


@router.delete("/documents/{document_id}/tags/{tag_id}")
async def remove_tag_from_document(
    document_id: PositiveInt,
    tag_id: PositiveInt,
    db: AsyncSession = Depends(get_db)
):
    """Remove a tag from a document."""
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Document)
        .options(selectinload(Document.tags))
        .where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    tag_result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = tag_result.scalar_one_or_none()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    if tag not in document.tags:
        raise HTTPException(
            status_code=400,
            detail=f"Tag {tag_id} is not associated with document {document_id}"
        )

    document.tags.remove(tag)
    await db.commit()

    logger.info(f"Removed tag {tag_id} from document {document_id}")
    return {"message": "Tag removed from document"}


@router.get("/documents/{document_id}/tags", response_model=List[TagResponse])
async def get_document_tags(
    document_id: PositiveInt,
    db: AsyncSession = Depends(get_db)
):
    """Get all tags for a document."""
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Document)
        .options(selectinload(Document.tags))
        .where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return [TagResponse(id=tag.id, name=tag.name, created_at=tag.created_at) for tag in document.tags]


@router.get("/tags", response_model=List[TagResponse])
async def list_all_tags(
    search: Optional[str] = Query(None, description="Search tags by name (case-insensitive)"),
    db: AsyncSession = Depends(get_db)
):
    """Get all available tags, optionally filtered by search query."""
    query = select(Tag)

    if search and search.strip():
        search_term = search.lower().strip()
        query = query.where(Tag.name.ilike(f"%{search_term}%"))

    query = query.order_by(Tag.name)
    result = await db.execute(query)
    tags = result.scalars().all()

    return [TagResponse(id=tag.id, name=tag.name, created_at=tag.created_at) for tag in tags]


@router.delete("/tags/{tag_id}")
async def delete_tag(
    tag_id: PositiveInt,
    db: AsyncSession = Depends(get_db)
):
    """Delete a tag from the system. This will remove the tag from all documents."""
    from sqlalchemy.orm import selectinload
    from app.models import document_tags

    result = await db.execute(
        select(Tag)
        .options(selectinload(Tag.documents))
        .where(Tag.id == tag_id)
    )
    tag = result.scalar_one_or_none()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    document_count = len(tag.documents) if tag.documents else 0

    logger.info(f"Deleting tag {tag_id} ({tag.name}) from {document_count} document(s)")

    await db.execute(
        delete(document_tags).where(document_tags.c.tag_id == tag_id)
    )

    await db.execute(delete(Tag).where(Tag.id == tag_id))
    await db.commit()

    logger.info(f"Successfully deleted tag {tag_id}")
    return {
        "message": f"Tag '{tag.name}' deleted",
        "removed_from_documents": document_count
    }

