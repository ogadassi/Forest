@echo off
echo ==========================================
echo   🚀 Starting "Forest" Backend
echo ==========================================

if not exist "cert\localhost.pfx" (
    echo [0/3] Generating SSL Certificate...
    powershell -ExecutionPolicy Bypass -File "generate-certs.ps1"
)

echo [1/2] Syncing Database Schema...
call npx prisma db push

echo [2/2] Starting Server...
call npm start
