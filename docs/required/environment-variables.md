# Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure as needed.

```bash
cp backend/.env.example backend/.env
```

## Backend variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No (dev) / Yes (prod) | `sqlite:///./test.db` | Database connection string |
| `SECRET_KEY` | Yes (prod) | Auto-generated in dev | JWT signing secret |
| `ALGORITHM` | No | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `60` | Token expiry in minutes |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS allowed origin(s), comma-separated |

## Twilio (optional)

| Variable | Required | Description |
|----------|----------|-------------|
| `TWILIO_ACCOUNT_SID` | For WhatsApp | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | For WhatsApp | Twilio auth token |
| `TWILIO_WHATSAPP_NUMBER` | For WhatsApp | Sender WhatsApp number |

## Frontend variables

Set at build time (Vite):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No (dev) / Yes (prod) | `http://127.0.0.1:5000` | Backend API base URL |

The dev script (`scripts/run.sh`) sets `VITE_API_URL` automatically.

## Dev script overrides

These can be set when running `npm run dev`:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_HOST` | `127.0.0.1` | API bind host |
| `API_PORT` | `5000` | API port |
| `FRONTEND_PORT` | `5173` | Vite dev server port |

## Production checklist

- [ ] `DATABASE_URL` points to PostgreSQL
- [ ] `SECRET_KEY` is a strong, persistent random string
- [ ] `FRONTEND_URL` matches your deployed frontend origin
- [ ] `VITE_API_URL` is set in Vercel (or your frontend host) to the production API URL
- [ ] Twilio vars set if WhatsApp reminders are needed

## Security

Never commit `.env` files. They are listed in `.gitignore`. Use your hosting provider's secret management for production values.
