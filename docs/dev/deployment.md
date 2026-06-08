# Deployment

## Frontend (Vercel)

The root `vercel.json` configures a static SPA build:

- **Install**: `npm install --prefix frontend`
- **Build**: `npm run build --prefix frontend`
- **Output**: `frontend/dist`
- **Routing**: All paths rewrite to `index.html` for client-side routing

Set the following in Vercel project settings:

| Variable | Example | Required |
|----------|---------|----------|
| `VITE_API_URL` | `https://api.yourdomain.com` | Yes |

Rebuild after changing `VITE_API_URL` — it is baked in at build time.

## Backend

Deploy the `backend/` directory as a Python web service.

### Recommended settings

| Setting | Value |
|---------|-------|
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Working directory | `backend` |
| Python version | 3.10+ |

### Required production env vars

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://...`) |
| `SECRET_KEY` | Strong random string — **must** be set in production |
| `FRONTEND_URL` | Comma-separated allowed origins for CORS |

See [required/environment-variables.md](../required/environment-variables.md) for the full list.

### PostgreSQL notes

`database.py` automatically converts `postgres://` to `postgresql://` for compatibility with Railway and Supabase.

### File uploads

Uploaded documents are stored in `backend/uploads/`. On ephemeral hosts, use persistent volume storage or migrate to object storage (S3, etc.).

### WhatsApp reminders (optional)

Configure Twilio env vars to enable hearing reminder messages. See [feature/notifications.md](../feature/notifications.md).

## Health checks

| Endpoint | Use |
|----------|-----|
| `GET /health` | Liveness probe |
| `GET /api` | API availability |
| `GET /version` | Version string |

## CORS

`FRONTEND_URL` controls allowed origins. Multiple origins can be comma-separated:

```
FRONTEND_URL=https://app.example.com,https://staging.example.com
```
