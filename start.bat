@echo off
title AI Data Analytics Assistant - Launcher
echo ========================================================
echo   NexusData AI - Enterprise Data Analytics Assistant
echo ========================================================
echo.
echo [1/2] Starting FastAPI Backend on port 8000...
start "Backend - FastAPI" cmd /k ".\venv\Scripts\python.exe api.py"

echo [2/2] Starting React Vite Frontend on port 5173...
cd AI_Data_Analytics_Assistant\frontend
start "Frontend - React Vite" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul
echo.
echo Opening browser to http://localhost:5173 ...
start http://localhost:5173
echo Application launched!
