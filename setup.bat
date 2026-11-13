@echo off
echo ========================================================
echo   SHOPBILL - Complete Retail Billing Software (v1.0)
echo   Automated Setup Script
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/5] Checking Environment...
where php >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PHP is not in your PATH. Please ensure PHP 8.2+ is installed.
    pause
    exit /b 1
)

where composer >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Composer is not in your PATH.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js and NPM are not in your PATH.
    pause
    exit /b 1
)

echo [2/5] Setting up Laravel Backend...
cd backend
if not exist .env (
    copy .env.example .env
    call php artisan key:generate
)
call composer install --no-interaction
echo.

echo [3/5] Migrating and Seeding MySQL shopbill_db...
call php artisan migrate:fresh --seed --force
call php artisan storage:link
cd ..
echo.

echo [4/5] Setting up Frontend Dependencies...
cd frontend
call npm install
echo [5/5] Building Frontend Production Assets...
call npm run build
cd ..

echo.
echo ========================================================
echo   SHOPBILL Setup Completed Successfully!
echo.
echo   Default Credentials:
echo   - Shopkeeper: shopkeeper@shopbill.com / password123
echo   - Cashier:    cashier@shopbill.com    / password123
echo   - SuperAdmin: admin@shopbill.com      / password123
echo.
echo   Run start_all.bat to launch the application.
echo ========================================================
pause
