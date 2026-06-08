# 🔒 Security Audit — LegalCase

**Project:** Legal Case Management System (FastAPI backend + React/Vite frontend)
**Deployment:** Frontend on Vercel · Backend on Railway · DB via `DATABASE_URL` (PostgreSQL in prod, SQLite fallback)
**Audit date:** 2026-06-08
**Scope:** Full project (not just a single diff). Backend routes, auth, services, schemas, models, config, and frontend auth/storage.

---

## Executive Summary

The application uses sound primitives in several places — SQLAlchemy ORM (no SQL injection), bcrypt password hashing, UUID upload filenames (no path traversal), static templates (no SSTI), and React auto-escaping (no XSS). The real risks are concentrated in **access control, authentication, secret management, and CORS**.

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| H1 | 🔴 HIGH | Anyone can self-register as `admin` | Open |
| H2 | 🔴 HIGH | Notification routes: broken access control & missing auth | Open |
| H3 | 🔴 HIGH | Databases with real credentials committed to git | Open |
| H4 | 🔴 HIGH | CORS reflects any origin with credentials | Open |
| H5 | 🔴 HIGH | JWT secret fails open + role trusted blindly | Open |
| M1 | 🟠 MEDIUM | `/auth/login-seed` credential-less backdoor | Open |
| M2 | 🟠 MEDIUM | Case reassignment via mass assignment | Open |
| M3 | 🟠 MEDIUM | JWT passed in URL query string | Open |
| L1 | 🟡 LOW | Unauthenticated reminder-trigger endpoint | Open |
| L2 | 🟡 LOW | Debug logging of `Authorization` + raw DB errors to clients | Open |

**Most urgent:** H1, H2, H4 (small, surgical, highly exploitable), then H3 (purge + rotate) and H5.

---

## 🔴 HIGH Findings

### H1 — Anyone can register as **admin**

- **Location:** `backend/app/routes/auth_routes.py:51` (register endpoint) + `backend/app/schemas/user_schema.py:8`
- **Category:** Privilege escalation / mass assignment
- **Confidence:** High (verified)

`UserCreate.role` is a free-form `str` supplied by the caller, and `register_user` has **no authentication** and passes `role` straight into the new `User`.

```python
# user_schema.py
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str          # ← caller-supplied, unvalidated
    phone_number: str
```

**Exploit:**
```bash
curl -X POST $API/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"x","email":"a@b.c","password":"x","role":"admin","phone_number":"1"}'
# then log in → full admin access
```

**Fix:** Do not accept `role` from the registration body. Default new users to a non-privileged role server-side; only an existing admin (behind `verify_admin`) may assign elevated roles. For self-signup, constrain to `Literal["lawyer"]`.

---

### H2 — Notification routes: broken access control & missing auth

- **Location:** `backend/app/routes/notification_routes.py:211–399`
- **Category:** Broken access control / IDOR / missing authentication
- **Confidence:** High (verified)

Multiple distinct flaws in one router:

| Endpoint | Problem |
|----------|---------|
| `GET /notifications/` | Returns **every user's** notifications — no `user_id` filter. Cross-tenant data leak (case titles, hearings, client info). |
| `PUT /notifications/{id}` | **No `verify_token` dependency at all** — fully unauthenticated state change. |
| `POST /notifications/` | **No auth** — attacker sets `user_id` in the body, forging notifications for any user + triggering a websocket broadcast. |
| `GET /notifications/{id}` | Authenticated but **no ownership check** — any lawyer reads another's notification. |
| `DELETE /notifications/{id}` | Authenticated but **no ownership check** — any lawyer deletes another's notification. |

**Exploit:**
```bash
curl $API/notifications/                     # dumps all tenants' notifications
curl -X PUT $API/notifications/5             # no token needed → mutates state
curl -X POST $API/notifications/ -d '{"user_id":1,"title":"x","message":"x","type":"x"}'  # forge
```

**Fix:**
- Add `user_data: dict = Depends(verify_token)` to `mark_notification_read` and `create_notification`.
- Filter `GET /` by `Notification.user_id == user_data["user_id"]` (admins may see all).
- On get/put/delete by id, enforce `notification.user_id == user_id or role == "admin"`.
- On create, set `user_id` from the token — never trust the request body.

---

### H3 — Databases with real credentials committed to git

- **Location:** `test.db`, `backend/test.db` (both tracked); seeded by `seed_user.py`
- **Category:** Hardcoded secret / information disclosure
- **Confidence:** High (verified)

Both SQLite files are committed and **not** in `.gitignore` (only `Thumbs.db` is). `test.db` contains real lawyer accounts with emails and bcrypt hashes:

```
lawyer@example.com         lawyer   $2b$12$...
lawyer@exaample.com        lawyer   $2b$12$...
second_lawyer@example.com  lawyer   $2b$12$...
```

`seed_user.py` / `login_test.py` additionally hardcode the plaintext seed passwords. Anyone with repo access has working credentials and offline-crackable hashes.

**Fix:**
1. `git rm --cached test.db backend/test.db`
2. Add `*.db` (and `*.sqlite*`) to `.gitignore`.
3. **Purge from history** with BFG or `git filter-repo` (removing from HEAD alone is not enough — the blobs remain in history).
4. **Rotate every seeded credential.**
5. Move seed passwords to environment variables; remove plaintext passwords from scripts.

---

### H4 — CORS reflects any origin with credentials

- **Location:** `backend/app/main.py:196–205`
- **Category:** Insecure CORS configuration
- **Confidence:** High (verified)

```python
origins = [o.strip() for o in os.getenv("FRONTEND_URL", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r".*",     # ← matches EVERY origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

`allow_origin_regex=r".*"` matches any origin. Starlette then reflects that exact origin back in `Access-Control-Allow-Origin` and sets `Access-Control-Allow-Credentials: true`. This is the classic "reflect-any-origin + credentials" misconfiguration and completely nullifies the `FRONTEND_URL` allowlist.

**Fix:** Delete the `allow_origin_regex=r".*"` line. Rely solely on the explicit `allow_origins` list. Never combine a wildcard/`.*` regex with `allow_credentials=True`.

---

### H5 — JWT secret fails open + role trusted blindly

- **Location:** `backend/app/services/auth_service.py:45–53` (secret), `:168–189` (decode), `:240–263` (role guards)
- **Category:** Weak JWT handling / broken access control
- **Confidence:** Medium-High

```python
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    import secrets
    SECRET_KEY = secrets.token_hex(32)   # ← random per process instead of failing
ALGORITHM = os.getenv("ALGORITHM", "HS256")
```

Two problems:

1. **Fail-open secret.** If `SECRET_KEY` is unset in prod, a random key is generated per worker process — tokens are only valid on the worker that signed them, restarts silently invalidate all sessions, and the misconfiguration is masked instead of caught.
2. **Role taken entirely from the token**, never rechecked against the DB, with no `iss`/`aud` claims. If the signing key ever leaks (and H3 shows the repo's secret-handling culture is weak), an attacker mints `{"user_id":1,"role":"admin"}` and is admin everywhere.

**Fix:**
- `raise RuntimeError` if `SECRET_KEY` is missing — do not auto-generate.
- Add and validate `iss` / `aud` claims in `jwt.decode`.
- For authorization decisions, load the user from the DB and derive `role` from the DB record, not the token.

---

## 🟠 MEDIUM Findings

### M1 — `/auth/login-seed` credential-less backdoor

- **Location:** `backend/app/routes/auth_routes.py:373`
- `include_in_schema=False` only hides it from `/docs`; the endpoint is unconditionally registered and reachable. A `POST` returns a valid JWT for the **first user in the DB** with no password.
- **Fix:** Delete it, or gate behind an explicit `if os.getenv("ENV") == "dev"` that is off by default in production.

### M2 — Case reassignment via mass assignment

- **Location:** `backend/app/routes/case_routes.py:307–312`
- A lawyer who owns a case can set `lawyer_id` / `client_id` to any value, reassigning (giving away) cases. The ownership gate only checks ownership *before* the edit, not the new values.
- **Fix:** Restrict `lawyer_id` / `client_id` reassignment to admins (ignore those fields when `role != "admin"`), or split reassignment into a separate admin-guarded endpoint.

### M3 — JWT passed in URL query string

- **Location:** `backend/app/routes/document_routes.py:346` + `frontend/src/pages/Documents.tsx`
- The document-download endpoint accepts the JWT via `?token=`. Session tokens in URLs land in access logs, proxy logs, browser history, and the `Referer` header.
- **Fix:** Use the `Authorization` header (stream the file via XHR), or issue a short-lived single-use signed download token distinct from the session JWT.

---

## 🟡 LOW Findings

### L1 — Unauthenticated reminder-trigger endpoint
- **Location:** `backend/app/routes/notification_routes.py:407`
- `POST /notifications/send-hearing-reminders` has no auth — anyone can trigger a full hearing scan + bulk notification creation. **Fix:** require auth/admin or restrict to an internal scheduler.

### L2 — Debug logging of secrets + raw DB errors to clients
- **Location:** `backend/app/main.py:207` (logs full headers incl. `Authorization` on OPTIONS); `backend/app/routes/hearing_routes.py:575` (returns raw DB exception text to the client).
- **Fix:** Remove the debug middleware in prod; return generic 4xx/5xx messages; stop logging credentials.

---

## ✅ Areas Reviewed and Found Clean

- **SQL injection** — all queries use SQLAlchemy ORM; no string-interpolated SQL.
- **SSTI** — templates render static content with no user-controlled context; no `render_template_string` / `| safe` / `Markup` in app code.
- **Path traversal** — upload filenames are server-generated UUIDs; downloads use the stored DB `filepath`, never user-supplied paths.
- **Frontend XSS** — no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `document.write`; React auto-escaping in effect.
- **Password hashing** — bcrypt via passlib, correct hash/verify.
- **IDOR in case / hearing / timeline / dashboard / document routes** — these correctly enforce `role == "admin" or lawyer_id == user_id`. The access-control gap is isolated to `notification_routes` (H2).
- **SSRF (WhatsApp service)** — outbound target is the Twilio SDK with an env-configured sender; only a phone number is user-influenced, no attacker-controlled host/protocol.

---

## Recommended Remediation Order

1. **H1** — Remove `role` from registration (privilege escalation, trivial exploit).
2. **H2** — Add auth + ownership checks to notification routes.
3. **H4** — Delete the wildcard CORS regex (one line).
4. **H3** — Purge committed DBs from history; rotate all seeded credentials.
5. **H5** — Mandatory `SECRET_KEY`; derive role from DB; add `iss`/`aud`.
6. **M1–M3**, then **L1–L2**.

> **Note:** H3 requires git-history rewriting and live credential rotation — perform these manually and coordinate with anyone who has cloned the repo.

---

*Audit performed by reading source directly and verifying each HIGH finding against the code and database. ORM/template/upload/XSS surfaces were checked and found clean as noted above.*
