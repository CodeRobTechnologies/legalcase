# Prerequisites

## Required software

| Tool | Minimum version | Purpose |
|------|-----------------|---------|
| Node.js | 18+ | Frontend build and dev server |
| npm | 9+ | Package management (bundled with Node) |
| Python | 3.10+ | Backend API |
| pip | Latest | Python package installer |
| Git | Any recent | Version control |

## Optional (production)

| Tool | Purpose |
|------|---------|
| PostgreSQL 14+ | Production database |
| Twilio account | WhatsApp hearing reminders |

## Platform notes

### macOS / Linux

Use `npm run dev` — runs `scripts/run.sh`.

### Windows

Use `npm run dev:windows` — runs `scripts/run.ps1`.

PowerShell execution policy may need to allow scripts:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Verify installations

```bash
node --version
npm --version
python3 --version
```

## Repository clone

```bash
git clone <repository-url>
cd legalcase
npm run dev
```

No global Python packages are required — the dev script creates a local `.venv`.
