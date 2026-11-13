# SHOPBILL — Version 1.0 Production Deployment Guide

Complete retail billing software for grocery, clothing, electronics, hardware, stationery, cosmetics, and general stores.

---

## Deployment Options Overview

| Target | Recommended For | Speed to Deploy | Command |
| :--- | :--- | :--- | :--- |
| **Railway (Cloud)** | Public online SaaS with live URL & SSL | ~3 minutes | `railway up` |
| **Docker Compose** | Linux VPS (Ubuntu/Debian) or cloud VM | ~2 minutes | `docker compose up -d` |
| **Windows Local Store** | In-store physical counter machine | Instant | `start_all.bat` |
| **Windows Desktop (Tauri)** | Standalone offline POS application | Build once | `npm run tauri build` |

---

## Option 1: Live Cloud Deployment on Railway

Railway provisions a managed MySQL database and hosts the unified application container with automatic HTTPS and CDN.

### Step 1: Install & Login to Railway CLI
```bash
# Verify Railway CLI is installed
railway --version

# Log in (opens your browser or outputs device code)
railway login
```

### Step 2: Initialize Project & Provision MySQL
```bash
# Initialize a new Railway project
railway init -n shopbill-production

# Add managed MySQL database
railway add -d mysql
```

### Step 3: Deploy Application Container
```bash
# Deploy with Dockerfile (bundles React SPA + Laravel API + Migrations)
railway up
```

### Step 4: Configure Environment Variables
In the Railway dashboard or via CLI:
```bash
railway variables set APP_KEY="base64:your-generated-key"
railway variables set APP_ENV="production"
railway variables set APP_DEBUG="false"
railway variables set APP_URL="https://your-domain.up.railway.app"
```

Railway automatically maps `MYSQL_URL`, `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, and `MYSQLDATABASE`.

---

## Option 2: Docker Compose Deployment (VPS / Linux Server)

Deploy on any Ubuntu, Debian, CentOS, or AWS EC2 server with Docker and Docker Compose installed.

### Step 1: Clone or Extract the Deliverable Archive
```bash
unzip ShopBill-Version-1-Complete.zip -d /var/www/shopbill
cd /var/www/shopbill
```

### Step 2: Start the Full Production Stack
```bash
docker compose up -d --build
```

This starts:
- **`shopbill_app`** on port `8000`: Laravel 11 API + compiled React SPA.
- **`shopbill_mysql`** on port `3306`: MySQL 8.0 with persistent storage.
- **`shopbill_pma`** on port `8080`: phpMyAdmin database management.

### Step 3: Verify Running Services
```bash
docker compose ps
docker compose logs app
```

Access the software at: `http://your-server-ip:8000`

---

## Option 3: Local Shop Counter Deployment (Windows Standalone)

For retail shopkeepers running directly on their store POS terminal (Windows 10/11) with local XAMPP or MySQL.

### Prerequisites:
1. **PHP 8.2+** with extensions: `pdo_mysql`, `mbstring`, `fileinfo`, `gd`, `zip`.
2. **MySQL 8.0** or MariaDB (via XAMPP or standalone service on port 3306).
3. **Node.js 18+** & npm.

### 1-Click Automated Setup:
Double-click `setup.bat` in the root folder, or execute:
```cmd
setup.bat
```
This automatically:
1. Installs composer & npm dependencies.
2. Creates `.env` and generates the application encryption key.
3. Runs all 20+ MySQL migrations and seeds default test data.
4. Builds the optimized React frontend production bundle.

### 1-Click Daily Startup:
Double-click `start_all.bat`:
- Launches the unified backend service on `http://127.0.0.1:8000`
- Opens the Fast Billing POS in the default browser.

---

## Option 4: Windows Desktop App (Tauri)

For stores requiring a standalone native desktop window and offline billing:

```cmd
cd frontend
npm run tauri dev
```

To compile a distributable `.msi` or `.exe` installer:
```cmd
npm run tauri build
```
*(Requires Rust and MSVC build tools on the build machine).*

---

## Default Access & Testing Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Shop Owner / Admin** | `admin@shopbill.com` | `password123` | Full admin, shop settings, billing, reports |
| **Retail Shopkeeper** | `shopkeeper@shopbill.com` | `password123` | Fast Billing POS, catalogue, customer khata |
| **Counter Cashier** | `cashier@shopbill.com` | `password123` | Billing screen & invoice generation only |

---

## Production Security Checklist
- [x] Set `APP_DEBUG=false` in production `.env`.
- [x] Run `php artisan config:cache` and `php artisan route:cache`.
- [x] Ensure `storage/` and `bootstrap/cache/` are writable.
- [x] Run `php artisan storage:link` to enable shop logo and standee QR uploads.
- [x] Scheduled daily MySQL backup using `mysqldump`.
