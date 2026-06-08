$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$ApiHost = if ($env:API_HOST) { $env:API_HOST } else { "127.0.0.1" }
$ApiPort = if ($env:API_PORT) { $env:API_PORT } else { "5000" }
$FrontendPort = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "5173" }

$Python = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) {
    $Python = Join-Path $Root "venv\Scripts\python.exe"
}
if (-not (Test-Path $Python)) {
    Write-Host "Creating Python virtual environment in .venv ..."
    python -m venv (Join-Path $Root ".venv")
    $Python = Join-Path $Root ".venv\Scripts\python.exe"
}

Write-Host "Installing backend dependencies ..."
& $Python -m pip install -q -r (Join-Path $Root "backend\requirements.txt")

if (-not (Test-Path (Join-Path $Root "frontend\node_modules"))) {
    Write-Host "Installing frontend dependencies ..."
    npm install --prefix (Join-Path $Root "frontend")
}

if (-not $env:DATABASE_URL) { $env:DATABASE_URL = "sqlite:///./test.db" }
if (-not $env:VITE_API_URL) { $env:VITE_API_URL = "http://${ApiHost}:${ApiPort}" }
if (-not $env:FRONTEND_URL) { $env:FRONTEND_URL = "http://127.0.0.1:${FrontendPort}" }

Write-Host "Starting API on http://${ApiHost}:${ApiPort} ..."
$ApiJob = Start-Job {
    param($Root, $Python, $ApiHost, $ApiPort)
    Set-Location (Join-Path $Root "backend")
    & $Python -m uvicorn app.main:app --host $ApiHost --port $ApiPort --reload
} -ArgumentList $Root, $Python, $ApiHost, $ApiPort

Write-Host "Starting frontend on http://127.0.0.1:${FrontendPort} ..."
$FrontendJob = Start-Job {
    param($Root, $FrontendPort)
    Set-Location (Join-Path $Root "frontend")
    npm run dev:frontend -- --host 127.0.0.1 --port $FrontendPort
} -ArgumentList $Root, $FrontendPort

Write-Host ""
Write-Host "LegalCase is running:"
Write-Host "  Frontend: http://127.0.0.1:${FrontendPort}"
Write-Host "  API:      http://${ApiHost}:${ApiPort}"
Write-Host "  Database: backend/test.db"
Write-Host ""
Write-Host "Press Ctrl+C to stop."

try {
    while ($true) {
        if ($ApiJob.State -eq "Failed" -or $FrontendJob.State -eq "Failed") {
            Receive-Job $ApiJob, $FrontendJob
            throw "One of the dev servers exited unexpectedly."
        }
        Start-Sleep -Seconds 1
    }
}
finally {
    Stop-Job $ApiJob, $FrontendJob -ErrorAction SilentlyContinue
    Remove-Job $ApiJob, $FrontendJob -Force -ErrorAction SilentlyContinue
}
