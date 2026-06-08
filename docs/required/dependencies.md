# Dependencies

## Backend (`backend/requirements.txt`)

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn[standard]` | ASGI server |
| `sqlalchemy` | ORM and database access |
| `psycopg2-binary` | PostgreSQL driver |
| `python-dotenv` | Load `.env` files |
| `python-multipart` | File upload support |
| `python-jose[cryptography]` | JWT tokens |
| `passlib[bcrypt]` | Password hashing |
| `bcrypt==4.0.1` | Pinned bcrypt version |
| `pydantic` | Data validation |
| `pydantic-settings` | Settings management |
| `email-validator` | Email field validation |
| `twilio` | WhatsApp messaging |
| `jinja2` | HTML template rendering |
| `websockets` | WebSocket support |

Install:

```bash
pip install -r backend/requirements.txt
```

## Frontend (`frontend/package.json`)

### Runtime

| Package | Purpose |
|---------|---------|
| `react` | UI library |
| `react-dom` | DOM rendering |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client |

### Development

| Package | Purpose |
|---------|---------|
| `vite` | Build tool and dev server |
| `typescript` | Type checking |
| `@vitejs/plugin-react` | React support for Vite |
| `eslint` + plugins | Linting |

Install:

```bash
npm install --prefix frontend
```

## Root (`package.json`)

| Script | Command |
|--------|---------|
| `dev` | `bash scripts/run.sh` |
| `dev:windows` | `powershell scripts/run.ps1` |

The root package has no runtime dependencies — it only orchestrates the dev workflow.

## Database drivers

| Database | Driver | When |
|----------|--------|------|
| SQLite | Built into Python | Local development (default) |
| PostgreSQL | `psycopg2-binary` | Production |

No extra driver is needed for SQLite.
