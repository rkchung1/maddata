from pydantic import BaseModel, Field, ConfigDict
from typing import List

class Tag(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(..., description="Lowercase snake_case tag, 1 word")
    confidence: float = Field(..., ge=0.0, le=1.0)

class TaggingResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tags: List[Tag] = Field(..., min_items=3, max_items=15)

class NoteCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=0)

class NoteUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=0)

class NoteResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    title: str
    content: str
    tags: List[str]
    embedding: List[float] = Field(default_factory=list)

class AskRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question: str = Field(..., min_length=1)
    top_k: int = Field(5, ge=1, le=10)

class Citation(BaseModel):
    model_config = ConfigDict(extra="forbid")
    note_id: str
    note_title: str
    quote: str

class AskResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    answer: str
    citations: List[Citation]
