@echo off
echo ==========================================
echo   🚀 Starting Duly Noted 2 (Full Stack)
echo ==========================================

cd backend
start cmd /k "start-backend.bat"
cd ..
timeout /t 5
start cmd /k "start-frontend.bat"

echo.
echo Both services are starting in separate windows.
echo Backend: https://localhost:3001
echo Frontend: http://localhost:5173
echo.
pause
