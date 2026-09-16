@echo off
echo ====================================================
echo Starting SignBridge ISL System (Backend + Frontend)
echo ====================================================

REM Check if Python venv exists
if not exist "backend\venv\Scripts\python.exe" (
    echo [INFO] Creating Python virtual environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..
)

echo [1/2] Launching Backend FastAPI Server (Port 8000)...
start "SignBridge Backend (FastAPI)" cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --host 127.0.0.1 --port 8000"

echo [2/2] Launching Frontend Vite Server (Port 5173)...
start "SignBridge Frontend (React/Vite)" cmd /k "npm run dev"

echo ====================================================
echo Both servers are launching!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo ====================================================
