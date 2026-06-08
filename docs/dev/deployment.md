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
| `VITE_API_URL` | `https://your-app.up.railway.app` | Yes |

Rebuild after changing `VITE_API_URL` — it is baked in at build time.

### Troubleshooting: login returns 405

If the browser console shows `405` on `POST /auth/login-json` with an empty response body, the frontend is calling **Vercel** instead of your **Railway** API. That happens when `VITE_API_URL` was not set at build time.

1. Vercel → Project → Settings → Environment Variables
2. Add `VITE_API_URL` = your Railway public URL (no trailing slash)
3. Redeploy the frontend (Deployments → … → Redeploy)

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
