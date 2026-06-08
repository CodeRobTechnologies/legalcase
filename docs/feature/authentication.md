# Authentication

## Overview

LegalCase uses **JWT bearer tokens** with bcrypt password hashing. Tokens are issued on login and verified on protected endpoints via `verify_token` in `auth_service.py`.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | OAuth2 form login (returns token) |
| `POST` | `/auth/login-json` | JSON body login |
| `GET` | `/auth/me` | Current user profile (requires token) |
| `GET` | `/auth/verify` | Validate token |
| `GET` | `/auth/admin-check` | Admin role check |

## Frontend flow

1. User submits credentials on `/login`
2. API returns JWT; frontend stores auth state
3. `ProtectedLayout` redirects unauthenticated users to `/login`
4. On load, `/auth/me` hydrates `user_id` and `user_email` into `sessionStorage`

## Security configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | Auto-generated in dev | JWT signing key — **required in production** |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token lifetime |

## Seeded test accounts

Run `python seed_user.py` from the repo root to create demo users. See [dev/setup.md](../dev/setup.md).

## Protected routes

Any endpoint using `Depends(verify_token)` requires a valid `Authorization: Bearer <token>` header. The frontend Axios client sends credentials via `withCredentials: true`.
