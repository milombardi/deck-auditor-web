# Deck Auditor (web)

Audits PowerPoint decks for narrative quality, AI voice, density, and clarity.
Dark-themed pixel-mockup UI, password-gated, bring-your-own-Anthropic-key.

- **Frontend:** Next.js 15 (App Router) + Tailwind + Lucide icons
- **Backend:** FastAPI + SSE streaming
- **Audit logic:** unchanged from the original Streamlit version, lives in `backend/audit/`

## Repo layout

```
deck-auditor-web/
├── frontend/      # Next.js — deploy to Vercel
├── backend/       # FastAPI + Dockerfile — deploy to Render
└── README.md
```

## Local dev

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
APP_PASSWORD=testpw uvicorn main:app --reload
```

Runs on `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`. The frontend will look for the backend at
`NEXT_PUBLIC_API_URL` (defaults to `http://127.0.0.1:8000`).

## Deploy

### Backend → Render

1. Push this repo to GitHub.
2. In Render dashboard → **New > Web Service** → connect your GitHub repo.
3. Render auto-detects `backend/render.yaml`. Confirm the settings:
   - **Root Directory:** `backend`
   - **Runtime:** Docker
   - **Plan:** Free
4. Set environment variables:
   - `APP_PASSWORD` = your chosen password
   - `CORS_ALLOWED_ORIGIN` = your Vercel URL (set after the frontend is deployed)
5. Deploy. Copy the resulting URL (e.g. `https://deck-auditor-api.onrender.com`).

Free tier sleeps after 15 min idle; first request after sleep takes ~30s.

### Frontend → Vercel

1. In Vercel dashboard → **Add New > Project** → import the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL
4. Deploy.
5. After the first frontend deploy, go back to Render and update
   `CORS_ALLOWED_ORIGIN` to the Vercel URL.

## Endpoints (backend)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth` | `{password}` → `{token}` |
| POST | `/api/estimate` | multipart .pptx → `{slide_count, word_count, estimated_cost}` |
| POST | `/api/audit` | multipart .pptx + form fields → SSE stream of progress + result |
| POST | `/api/cancel/{job_id}` | cooperatively stop a running audit |
| GET  | `/api/health` | `{ok: true}` |

All authenticated endpoints require `Authorization: Bearer <token>`.

## Notes

- The user's Anthropic API key is sent with each audit request and used only
  for that audit. It is never logged or persisted server-side.
- Tokens live in-memory on the backend and last 8 hours. Restarting the backend
  invalidates all sessions.
- Cancel works by setting a flag the audit loops check between slides.
