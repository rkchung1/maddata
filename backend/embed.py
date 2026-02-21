import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from openai import OpenAI

_env_loaded = False


def _get_client() -> OpenAI:
    global _env_loaded
    if not _env_loaded:
        env_path = Path(__file__).resolve().parent / ".env"
        load_dotenv(env_path)
        _env_loaded = True
    return OpenAI()


def _get_model() -> str:
    return os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def embed_text(text: str) -> List[float]:
    resp = _get_client().embeddings.create(
        model=_get_model(),
        input=text,
        encoding_format="float",
    )
    return resp.data[0].embedding


def embed_note(title: str, content: str) -> List[float]:
    text = f"{title}\n\n{content}"
    return embed_text(text)


def chunk_text(text: str, max_words: int = 200, overlap: int = 40) -> List[str]:
    words = text.split()
    if not words:
        return []
    chunks: List[str] = []
    start = 0
    while start < len(words):
        end = min(len(words), start + max_words)
        chunk = " ".join(words[start:end]).strip()
        if chunk:
            chunks.append(chunk)
        if end == len(words):
            break
        start = max(0, end - overlap)
    return chunks


def embed_chunks(chunks: List[str]) -> List[List[float]]:
    if not chunks:
        return []
    resp = _get_client().embeddings.create(
        model=_get_model(),
        input=chunks,
        encoding_format="float",
    )
    return [item.embedding for item in resp.data]
