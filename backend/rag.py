import os
import math
from pathlib import Path
from typing import List, Dict, Any

from dotenv import load_dotenv
from openai import OpenAI

from .schemas import AskResponse, Citation

_env_loaded = False


def _get_client() -> OpenAI:
    global _env_loaded
    if not _env_loaded:
        env_path = Path(__file__).resolve().parent / ".env"
        load_dotenv(env_path)
        _env_loaded = True
    return OpenAI()


def _get_model() -> str:
    return os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    if not a or not b or len(a) != len(b):
        return -1.0
    dot = 0.0
    norm_a = 0.0
    norm_b = 0.0
    for i in range(len(a)):
        dot += a[i] * b[i]
        norm_a += a[i] * a[i]
        norm_b += b[i] * b[i]
    if norm_a == 0.0 or norm_b == 0.0:
        return -1.0
    return dot / (math.sqrt(norm_a) * math.sqrt(norm_b))


def retrieve_top_chunks(question: str, notes: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
    from .embed import embed_text

    query_emb = embed_text(question)
    scored: List[Dict[str, Any]] = []
    for note in notes:
        for chunk in note.get("chunks", []):
            score = _cosine_similarity(query_emb, chunk.get("embedding", []))
            scored.append(
                {
                    "note_id": note["id"],
                    "chunk_index": chunk["index"],
                    "text": chunk["text"],
                    "score": score,
                }
            )
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]


def _build_context(chunks: List[Dict[str, Any]]) -> str:
    parts = []
    for c in chunks:
        header = f"[note_id={c['note_id']} chunk={c['chunk_index']}]"
        parts.append(f"{header}\n{c['text']}")
    return "\n\n".join(parts)


def answer_question(question: str, chunks: List[Dict[str, Any]]) -> AskResponse:
    schema = AskResponse.model_json_schema()
    context = _build_context(chunks)

    prompt = f"""
Answer the question using only the provided note chunks.
If the answer is not in the chunks, say: "Answer could not be found."
Return JSON with an answer and citations pointing to the chunks used.

Question:
{question}

Chunks:
{context}
""".strip()

    resp = _get_client().responses.create(
        model=_get_model(),
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "note_answer",
                "schema": schema,
                "strict": True,
            }
        },
    )

    data = AskResponse.model_validate_json(resp.output_text)
    cleaned_citations = []
    for c in data.citations:
        cleaned_citations.append(
            Citation(
                note_id=c.note_id,
                chunk_index=int(c.chunk_index),
                quote=c.quote[:160],
            )
        )
    return AskResponse(answer=data.answer.strip(), citations=cleaned_citations)
