@echo off
echo ==========================================
echo   🚀 Starting "Duly Noted 2" Backend
echo ==========================================

if not exist "cert\localhost.pfx" (
    echo [0/3] Generating SSL Certificate...
    powershell -ExecutionPolicy Bypass -File "generate-certs.ps1"
)

echo [1/3] Spinnning up Docker containers...
docker-compose up -d

echo [2/3] Syncing Database Schema...
echo       (Waiting 3s for DB to be ready...)
timeout /t 3 /nobreak >nul
call npx prisma db push

echo [3/3] Starting Server...
call npm start
