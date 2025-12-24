import os
import re
import uuid
import logging
import aiofiles
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, HTTPException, Query
from pydantic import PositiveInt
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Document, ProcessingStatus, Tag, document_tags
from app.schemas import DocumentResponse, DocumentDetail, PaginatedResponse
from app.services.pdf_processor import extract_text_from_pdf
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_MIME_TYPES = ["application/pdf"]
ALLOWED_EXTENSIONS = [".pdf"]


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal attacks."""
    filename = os.path.basename(filename)
    safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '', filename)
    if not safe_filename.lower().endswith('.pdf'):
        safe_filename = f"{uuid.uuid4().hex}.pdf"
    return safe_filename


@router.post("/documents")
async def upload_document(file: UploadFile, db: AsyncSession = Depends(get_db)):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Only PDF files are allowed. Got: {file.content_type}"
        )

    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file extension. Only .pdf files are allowed."
        )

    safe_filename = sanitize_filename(file.filename)

    content = await file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024):.1f}MB"
        )

    if file_size == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    try:
        logger.info(f"Processing PDF: {safe_filename} (size: {file_size} bytes)")

        text_content, page_count = await extract_text_from_pdf(file_path)

        logger.info(f"Successfully processed PDF: {safe_filename} ({page_count} pages)")
    except Exception as e:
        logger.error(f"Failed to process PDF {safe_filename}: {str(e)}")

        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to process PDF: {str(e)}"
        )

    try:
        document = Document(
            filename=safe_filename,
            content=text_content,
            file_size=file_size,
            page_count=page_count,
        )
        db.add(document)
        await db.commit()

        await db.refresh(document)
        logger.info(f"Document created: ID={document.id}, filename={safe_filename}")

        processing_status = ProcessingStatus(
            document_id=document.id,
            status="completed",
            processed_at=datetime.utcnow(),
        )
        db.add(processing_status)

        await db.commit()
    except Exception as e:
        logger.error(f"Failed to save document {safe_filename}: {str(e)}")
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save document: {str(e)}"
        )
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

    return {"id": document.id, "filename": document.filename}


@router.get("/documents", response_model=PaginatedResponse[DocumentResponse])
async def list_documents(
    skip: int = Query(0, ge=0, description="Number of documents to skip"),
    limit: int = Query(5, ge=1, le=1000, description="Maximum number of documents to return"),
    tag: Optional[str] = Query(None, description="Filter documents by tag name"),
    db: AsyncSession = Depends(get_db)
):
    """
    List documents with pagination and optional tag filtering.

    Args:
        skip: Number of documents to skip (default: 0)
        limit: Maximum number of documents to return (default: 5, max: 1000)
        tag: Optional tag name to filter documents
        db: Database session
    """
    from sqlalchemy.orm import selectinload

    count_query = select(func.count(Document.id))
    if tag:
        count_query = count_query.join(Document.tags).where(Tag.name == tag)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = select(Document).options(
        selectinload(Document.processing_status),
        selectinload(Document.tags)
    )

    if tag:
        query = query.join(Document.tags).where(Tag.name == tag)

    query = query.offset(skip).limit(limit).order_by(Document.created_at.desc())

    result = await db.execute(query)
    documents = result.scalars().all()

    response = []
    for doc in documents:
        status = doc.processing_status
        response.append(
            DocumentResponse(
                id=doc.id,
                filename=doc.filename,
                file_size=doc.file_size,
                page_count=doc.page_count,
                status=status.status if status else "unknown",
                created_at=doc.created_at,
                tags=doc.tags or [],
            )
        )

    return PaginatedResponse(
        items=response,
        total=total,
        skip=skip,
        limit=limit,
        has_next=(skip + limit) < total,
        has_prev=skip > 0,
    )


@router.get("/documents/{document_id}")
async def get_document(document_id: PositiveInt, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Document)
        .options(
            selectinload(Document.processing_status),
            selectinload(Document.tags)
        )
        .where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    status = document.processing_status

    return DocumentDetail(
        id=document.id,
        filename=document.filename,
        content=document.content,
        file_size=document.file_size,
        page_count=document.page_count,
        status=status.status if status else "unknown",
        created_at=document.created_at,
        tags=document.tags or [],
    )


@router.delete("/documents/{document_id}")
async def delete_document(document_id: PositiveInt, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        logger.warning(f"Attempted to delete non-existent document: ID={document_id}")
        raise HTTPException(status_code=404, detail="Document not found")

    logger.info(f"Deleting document: ID={document_id}, filename={document.filename}")

    await db.execute(
        delete(document_tags).where(document_tags.c.document_id == document_id)
    )

    await db.execute(
        delete(ProcessingStatus).where(ProcessingStatus.document_id == document_id)
    )

    await db.execute(
        delete(Document).where(Document.id == document_id)
    )

    await db.commit()
    logger.info(f"Successfully deleted document: ID={document_id}")

    return {"message": "Document deleted"}
