# Mindflow

## Prerequisites

- `Python` 3.11+ (3.13 also works)
- `Node.js` 18+ and `npm`
- An OpenAI API key (required for embeddings, tagging, and Ask/RAG responses)

## Project Structure

- `backend/` FastAPI API + SQLite database (`backend/notes.db`)
- `frontend/` Vite + React app

## 1) Backend Setup

From the repo root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
OPENAI_API_KEY=your_key_here
# Optional overrides
# OPENAI_MODEL=gpt-4o-mini
# OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

Start the API (run from repo root, or keep `cd ..` first):

```bash
cd ..
uvicorn backend.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

## 2) Frontend Setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:5173`.

The Vite dev server proxies `/api/*` requests to `http://127.0.0.1:8000`.

## 3) Verify It Works

1. Open `http://127.0.0.1:5173`
2. Create a note
3. Save/update the note (this triggers tagging + embeddings)
4. Use the Ask screen to query your notes

## Notes / Troubleshooting

- If Ask fails, confirm `backend/.env` contains a valid `OPENAI_API_KEY`.
- If port `8000` or `5173` is busy, stop the conflicting process or change the port.
- `backend/notes.db` stores local notes data in SQLite.
