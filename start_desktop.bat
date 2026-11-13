@echo off
echo ========================================================
echo   SHOPBILL - Launching Windows Desktop Application
echo ========================================================
echo.

cd /d "%~dp0"

echo Starting Laravel Local API Service...
start /min "ShopBill Local Backend" cmd /k "cd backend && php artisan serve --port=8000"

echo Launching Tauri Desktop Window...
cd frontend
call npm run tauri dev

pause
