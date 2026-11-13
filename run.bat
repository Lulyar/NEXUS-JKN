@echo off
echo ===================================================
echo   Menjalankan Sistem AEGIS-JKN (Healthkathon)
echo ===================================================
echo.
echo 1. Memulai Backend FastAPI di Port 8000...
start "AEGIS-JKN Backend (FastAPI)" cmd /k "cd /d D:\healthkathon && py backend/main.py"

echo 2. Memulai Frontend React/Vite di Port 5173...
start "AEGIS-JKN Frontend (Vite)" cmd /k "cd /d D:\healthkathon\frontend && npm run dev"

echo.
echo ===================================================
echo   Kedua server sudah berjalan!
echo   Buka browser di: http://localhost:5173
echo ===================================================
pause

