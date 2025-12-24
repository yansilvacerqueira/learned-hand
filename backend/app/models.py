from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, Table
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base

document_tags = Table(
    "document_tags",
    Base.metadata,
    Column("document_id", Integer, ForeignKey("documents.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    content = Column(Text)
    file_size = Column(Integer)
    page_count = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    processing_status = relationship(
        "ProcessingStatus", back_populates="document", uselist=False
    )
    tags = relationship("Tag", secondary=document_tags, back_populates="documents")

    __table_args__ = (
        Index("idx_document_filename", "filename"),
        Index("idx_document_created_at", "created_at"),
    )


class ProcessingStatus(Base):
    __tablename__ = "processing_statuses"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    status = Column(String(50), default="completed")
    error_message = Column(Text, nullable=True)
    processed_at = Column(DateTime, nullable=True)

    document = relationship("Document", back_populates="processing_status")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", secondary=document_tags, back_populates="tags")

    __table_args__ = (
        Index("idx_tag_name", "name"),
    )
