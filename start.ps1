# NexusData AI - PowerShell Launcher
Write-Host "Starting NexusData AI..." -ForegroundColor Cyan

# Check if backend is already running
try {
    $res = Invoke-RestMethod -Uri "http://localhost:8000/status" -TimeoutSec 1 -ErrorAction SilentlyContinue
    Write-Host "Backend already running on port 8000" -ForegroundColor Green
} catch {
    Write-Host "Launching Backend on port 8000..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", ".\venv\Scripts\python.exe api.py"
}

# Check if frontend is already running
try {
    $res = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 1 -ErrorAction SilentlyContinue
    Write-Host "Frontend already running on port 5173" -ForegroundColor Green
} catch {
    Write-Host "Launching Frontend on port 5173..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd AI_Data_Analytics_Assistant\frontend && npm run dev"
}

Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
Write-Host "Browser opened to http://localhost:5173!" -ForegroundColor Green
