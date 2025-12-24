from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Generic, TypeVar

T = TypeVar('T')


class DocumentBase(BaseModel):
    filename: str


class DocumentCreate(DocumentBase):
    pass


class TagBase(BaseModel):
    name: str


class TagResponse(TagBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentResponse(DocumentBase):
    id: int
    file_size: Optional[int] = None
    page_count: Optional[int] = None
    status: str
    created_at: datetime
    tags: List[TagResponse] = []

    class Config:
        from_attributes = True


class DocumentDetail(DocumentResponse):
    content: Optional[str] = None


class SearchResult(BaseModel):
    id: int
    filename: str
    snippet: str


class TagCreate(TagBase):
    pass


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    skip: int
    limit: int
    has_next: bool
    has_prev: bool
