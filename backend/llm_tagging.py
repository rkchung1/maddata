# app/llm_tagging.py
import os
import re
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
from .schemas import TaggingResult

_env_loaded = False

def _get_client() -> OpenAI:
    global _env_loaded
    if not _env_loaded:
        env_path = Path(__file__).resolve().parent / ".env"
        load_dotenv(env_path)
        _env_loaded = True
    return OpenAI()

def _normalize_tag(name: str) -> str:
    name = name.strip().lower()
    name = re.sub(r"[^a-z0-9\s_]", "", name)
    name = re.sub(r"\s+", "_", name)
    name = re.sub(r"_+", "_", name)
    return name[:40].strip("_")

def tag_note_with_llm(title: str, body: str) -> TaggingResult:
    schema = TaggingResult.model_json_schema()

    prompt = f"""
Generate useful semantic tags for this note.

Rules:
- 1 to 3 tags
- 1 broad tag that's more of a general category, the others should be specific and meaningful
- avoid generic tags like note, thoughts, reminder, text
- lowercase snake_case only
- 1 word per tag
- include confidence scores [0,1]

TITLE:
{title}

BODY:
{body}
""".strip()

    model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    resp = _get_client().responses.create(
        model=model_name,
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "note_tagging",
                "schema": schema,
                "strict": True,
            }
        },
    )

    result = TaggingResult.model_validate_json(resp.output_text)

    # Normalize + dedupe
    seen = set()
    cleaned_tags = []
    for t in result.tags:
        norm = _normalize_tag(t.name)
        if not norm or norm in seen:
            continue
        seen.add(norm)
        cleaned_tags.append({"name": norm, "confidence": float(t.confidence)})

    return TaggingResult(tags=cleaned_tags if cleaned_tags else result.tags)
