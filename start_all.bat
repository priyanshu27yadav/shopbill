@echo off
echo ========================================================
echo   SHOPBILL - Starting Web & API Servers
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Laravel Backend on http://localhost:8000...
start "ShopBill Laravel API" cmd /k "cd backend && php artisan serve --port=8000"

echo [2/3] Starting Vite Frontend on http://localhost:5173...
start "ShopBill React Web" cmd /k "cd frontend && npm run dev"

timeout /t 3 >nul

echo [3/3] Opening ShopBill in Default Browser...
start http://localhost:5173

echo.
echo ========================================================
echo   ShopBill is running!
echo   - Web App: http://localhost:5173
echo   - Backend API: http://localhost:8000
echo.
echo   Login:
echo   - Shopkeeper: shopkeeper@shopbill.com / password123
echo   - Cashier:    cashier@shopbill.com    / password123
echo ========================================================
