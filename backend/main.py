from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4

from .llm_tagging import tag_note_with_llm
from .embed import embed_note
from .schemas import NoteCreate, NoteUpdate, NoteResponse

app = FastAPI(title="Note Tagging API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}

_STORE: dict[str, list[dict]] = {"notes": []}


def _find_note_index(note_id: str) -> int | None:
    for i, note in enumerate(_STORE["notes"]):
        if note["id"] == note_id:
            return i
    return None

@app.post("/api/notes", response_model=NoteResponse)
def create_note(payload: NoteCreate) -> NoteResponse:
    try:
        tagging = tag_note_with_llm(title=payload.title, body=payload.content)
        embedding = embed_note(title=payload.title, content=payload.content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    note_id = str(uuid4())
    note_record = {
        "id": note_id,
        "title": payload.title,
        "content": payload.content,
        "tags": [t.name for t in tagging.tags],
        "embedding": embedding,
    }
    _STORE["notes"].append(note_record)
    return NoteResponse(
        id=note_id,
        title=payload.title,
        content=payload.content,
        tags=note_record["tags"],
    )

@app.put("/api/notes/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, payload: NoteUpdate) -> NoteResponse:
    idx = _find_note_index(note_id)
    if idx is None:
        raise HTTPException(status_code=404, detail="Note not found")
    try:
        tagging = tag_note_with_llm(title=payload.title, body=payload.content)
        embedding = embed_note(title=payload.title, content=payload.content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    note_record = {
        "id": note_id,
        "title": payload.title,
        "content": payload.content,
        "tags": [t.name for t in tagging.tags],
        "embedding": embedding,
    }
    _STORE["notes"][idx] = note_record
    return NoteResponse(
        id=note_id,
        title=payload.title,
        content=payload.content,
        tags=note_record["tags"],
    )
