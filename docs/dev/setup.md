# Development Setup

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- See [required/prerequisites.md](../required/prerequisites.md) for the full list

## One-command start

From the repository root:

```bash
npm run dev
```

On Windows:

```powershell
npm run dev:windows
```

The `scripts/run.sh` (or `run.ps1`) script will:

1. Create a Python virtual environment in `.venv` if missing
2. Install backend dependencies from `backend/requirements.txt`
3. Install frontend dependencies if `frontend/node_modules` is missing
4. Start the FastAPI API on port **5000**
5. Start the Vite dev server on port **5173**

## Manual setup

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt

cd backend
uvicorn app.main:app --host 127.0.0.1 --port 5000 --reload
```

### Frontend

```bash
cd frontend
npm install
VITE_API_URL=http://127.0.0.1:5000 npm run dev:frontend
```

## Seed a test user

From the repository root (with the venv active):

```bash
python seed_user.py
```

Default seeded credentials (see `seed_user.py`):

| Email | Password |
|-------|----------|
| `lawyer@example.com` | `Password123!` |
| `lawyer@exaample.com` | `lawyer123` |

## Environment configuration

Copy `backend/.env.example` to `backend/.env` and fill in values. See [required/environment-variables.md](../required/environment-variables.md).

For local development, defaults work out of the box:

- `DATABASE_URL` defaults to SQLite (`sqlite:///./test.db`)
- `VITE_API_URL` defaults to `http://127.0.0.1:5000`

## Useful URLs

| URL | Description |
|-----|-------------|
| http://127.0.0.1:5173 | React frontend |
| http://127.0.0.1:5000 | FastAPI API |
| http://127.0.0.1:5000/docs | Swagger UI (interactive API docs) |
| http://127.0.0.1:5000/health | Health check |
| http://127.0.0.1:5000/api | API status endpoint |

## Database

- **Local dev**: SQLite file at `backend/test.db` (created automatically on first run)
- **Production**: PostgreSQL via `DATABASE_URL` (see `backend/app/database.py`)

Tables are created automatically on API startup via SQLAlchemy `Base.metadata.create_all`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port already in use | Set `API_PORT` or `FRONTEND_PORT` before running `npm run dev` |
| CORS errors | Ensure `FRONTEND_URL` in backend `.env` matches your frontend origin |
| Login fails after restart | If `SECRET_KEY` was auto-generated, tokens from a previous session are invalid — log in again |
| Missing `SECRET_KEY` in production | Always set `SECRET_KEY` in production; see [required/environment-variables.md](../required/environment-variables.md) |
