from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import sqlite3
from pathlib import Path
from uuid import uuid4

from .llm_tagging import tag_note_with_llm
from .embed import embed_note, chunk_text, embed_chunks
from .rag import answer_question, retrieve_top_chunks
from .schemas import NoteCreate, NoteUpdate, NoteResponse, AskRequest, AskResponse

app = FastAPI(title="Note Tagging API")

DB_PATH = Path(__file__).resolve().parent / "notes.db"

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

def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    with _get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                tags TEXT NOT NULL DEFAULT '[]',
                embedding TEXT NOT NULL DEFAULT '[]',
                chunks TEXT NOT NULL DEFAULT '[]'
            )
            """
        )
        conn.commit()


def _parse_json_array(raw: str) -> list:
    try:
        parsed = json.loads(raw) if raw else []
    except Exception:
        return []
    return parsed if isinstance(parsed, list) else []


def _row_to_note_response(row: sqlite3.Row) -> NoteResponse:
    return NoteResponse(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        tags=_parse_json_array(row["tags"]),
    )


def _load_all_note_records() -> list[dict]:
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT id, title, content, tags, embedding, chunks FROM notes ORDER BY rowid DESC"
        ).fetchall()

    notes: list[dict] = []
    for row in rows:
        notes.append(
            {
                "id": row["id"],
                "title": row["title"],
                "content": row["content"],
                "tags": _parse_json_array(row["tags"]),
                "embedding": _parse_json_array(row["embedding"]),
                "chunks": _parse_json_array(row["chunks"]),
            }
        )
    return notes


@app.get("/api/notes", response_model=list[NoteResponse])
def list_notes() -> list[NoteResponse]:
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT id, title, content, tags FROM notes ORDER BY rowid DESC"
        ).fetchall()
    return [_row_to_note_response(row) for row in rows]


def _build_note_record(note_id: str, title: str, content: str) -> dict:
    tags: list[str] = []
    try:
        tagging = tag_note_with_llm(title=title, body=content)
        tags = [t.name for t in tagging.tags]
    except Exception:
        tags = []

    note_embedding: list[float] = []
    try:
        note_embedding = embed_note(title=title, content=content)
    except Exception:
        note_embedding = []

    chunk_texts = chunk_text(f"{title}\n\n{content}")
    chunk_embeddings: list[list[float]] = [[] for _ in chunk_texts]
    try:
        generated = embed_chunks(chunk_texts)
        for i in range(min(len(chunk_embeddings), len(generated))):
            chunk_embeddings[i] = generated[i]
    except Exception:
        pass

    return {
        "id": note_id,
        "title": title,
        "content": content,
        "tags": tags,
        "embedding": note_embedding,
        "chunks": [
            {"index": i, "text": chunk_texts[i], "embedding": chunk_embeddings[i]}
            for i in range(len(chunk_texts))
        ],
    }

@app.post("/api/notes", response_model=NoteResponse)
def create_note(payload: NoteCreate) -> NoteResponse:
    note_id = str(uuid4())
    tags: list[str] = []
    embedding: list[float] = []
    chunks: list[dict] = []
    with _get_conn() as conn:
        conn.execute(
            """
            INSERT INTO notes (id, title, content, tags, embedding, chunks)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                note_id,
                payload.title,
                payload.content,
                json.dumps(tags),
                json.dumps(embedding),
                json.dumps(chunks),
            ),
        )
        conn.commit()
    return NoteResponse(
        id=note_id,
        title=payload.title,
        content=payload.content,
        tags=tags,
    )

@app.put("/api/notes/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, payload: NoteUpdate) -> NoteResponse:
    note_record = _build_note_record(note_id, payload.title, payload.content)
    with _get_conn() as conn:
        cursor = conn.execute(
            """
            UPDATE notes
            SET title = ?, content = ?, tags = ?, embedding = ?, chunks = ?
            WHERE id = ?
            """,
            (
                note_record["title"],
                note_record["content"],
                json.dumps(note_record["tags"]),
                json.dumps(note_record["embedding"]),
                json.dumps(note_record["chunks"]),
                note_id,
            ),
        )
        conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return NoteResponse(
        id=note_id,
        title=payload.title,
        content=payload.content,
        tags=note_record["tags"],
    )


@app.post("/api/ask", response_model=AskResponse)
def ask_question(payload: AskRequest) -> AskResponse:
    notes = _load_all_note_records()
    chunks = retrieve_top_chunks(payload.question, notes, top_k=payload.top_k)
    return answer_question(payload.question, chunks)


_init_db()
