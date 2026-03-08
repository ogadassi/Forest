@echo off
echo ==========================================
echo   🚀 Starting "Forest" Backend
echo ==========================================

if not exist "cert\localhost.pfx" (
    echo [0/3] Generating SSL Certificate...
    powershell -ExecutionPolicy Bypass -File "generate-certs.ps1"
)

echo Checking if Docker is running...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Starting Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Waiting for Docker to start (this may take a minute)...
    :waitForDocker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %errorlevel% neq 0 goto waitForDocker
    echo Docker is now ready!
)

echo [1/3] Spinnning up Docker containers...
docker-compose up -d

echo [2/3] Syncing Database Schema...
echo       (Waiting 3s for DB to be ready...)
timeout /t 3 /nobreak >nul
call npx prisma db push

echo [3/3] Starting Server...
call npm start
