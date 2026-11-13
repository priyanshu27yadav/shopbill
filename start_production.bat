@echo off
echo ========================================================
echo   SHOPBILL - Starting Production Server
echo   Unified React Frontend + Laravel Backend on Port 8000
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching ShopBill Production Server on http://localhost:8000...
start "ShopBill Production" cmd /k "cd backend && php artisan serve --port=8000"

timeout /t 2 >nul

echo [2/2] Opening ShopBill in Default Browser...
start http://localhost:8000

echo.
echo ========================================================
echo   ShopBill is live!
echo   - App & POS URL: http://localhost:8000
echo   - Default Login: admin@shopbill.com / password123
echo ========================================================
