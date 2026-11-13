# Deploying SHOPBILL v1.0 on Render (Render.com)

This guide walks you through deploying **ShopBill** on **Render** with automatic HTTPS, custom domains, database migrations, and zero CORS issues.

---

## Prerequisites: Push Code to GitHub

1. Create a new repository on [GitHub](https://github.com/new) named `shopbill`.
2. Push your project to GitHub from your local terminal:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/shopbill.git
   git branch -M main
   git push -u origin main
   ```

---

## Method 1: 1-Click Blueprint (Fastest & Fully Automated)

The project includes a ready-to-run [`render.yaml`](render.yaml) blueprint specification that automatically provisions both the Web Service and Managed Database.

### Steps:
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click the **New +** button in the top navigation bar and select **Blueprint**.
3. Connect your GitHub account and select your `shopbill` repository.
4. Render will automatically detect `render.yaml` and configure:
   - **Web Service**: `shopbill` (Docker environment combining React SPA + Laravel 11 API).
   - **Database**: `shopbill-db` (Free managed database).
   - All connection strings and environment variables (`APP_KEY`, `DB_HOST`, `DB_PASSWORD`, etc.) are linked automatically.
5. Click **Apply**.
6. Render builds the Docker image, runs database migrations, seeds default accounts, and deploys the app.
7. Your app is live at:
   ```
   https://shopbill-xxxx.onrender.com
   ```

---

## Method 2: Manual Web Service with Cloud MySQL (TiDB / Aiven / Clever Cloud)

If you prefer using MySQL on Render:

### Step 1: Create a Free MySQL Database
Create a free MySQL database on any cloud provider:
- **TiDB Cloud (Free Serverless MySQL)**: [tidbcloud.com](https://tidbcloud.com)
- **Aiven Free MySQL**: [aiven.io](https://aiven.io)
- **Clever Cloud MySQL**: [clever-cloud.com](https://clever-cloud.com)
- **Railway MySQL**: [railway.com](https://railway.com)

Save your `Host`, `Port`, `Database`, `Username`, and `Password`.

### Step 2: Create Web Service on Render
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your `shopbill` repository.
3. Configure settings:
   - **Name**: `shopbill`
   - **Region**: Choose the closest region (e.g. `Oregon`, `Frankfurt`, or `Singapore`).
   - **Branch**: `main`
   - **Runtime**: **Docker**
   - **Plan**: `Free`
4. In the **Environment Variables** section, add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `APP_NAME` | `ShopBill` | Application name |
| `APP_ENV` | `production` | Production mode |
| `APP_DEBUG` | `false` | Security: disable debug |
| `APP_KEY` | *(Click "Generate")* | Laravel encryption key |
| `SEED_DATABASE` | `true` | Seeds default admin & demo catalogue |
| `DB_CONNECTION` | `mysql` | MySQL driver |
| `DB_HOST` | `your-mysql-host` | From your MySQL provider |
| `DB_PORT` | `3306` | MySQL port |
| `DB_DATABASE` | `shopbill_db` | Database name |
| `DB_USERNAME` | `your-db-user` | Database username |
| `DB_PASSWORD` | `your-db-password` | Database password |

5. Click **Create Web Service**.
6. Render will build the multi-stage Docker container:
   - Stage 1: Builds the React 19 + TypeScript + Tailwind CSS production bundle.
   - Stage 2: Packages Laravel 11 with PHP 8.2 extensions (`pdo_mysql`, `gd`, `zip`, `bcmath`).
   - Runs database migrations automatically via `docker-entrypoint.sh`.
   - Binds to Render's dynamic `$PORT`.

---

## Default Login Credentials

Once your Render service displays **Live**:
- Open your Render app URL: `https://<your-app-name>.onrender.com`
- **Shopkeeper / Admin:**
  - **Email:** `admin@shopbill.com`
  - **Password:** `password123`
- **Staff / Cashier:**
  - **Email:** `cashier@shopbill.com`
  - **Password:** `password123`

---

## Render Free Tier Sleeping Note & Custom Domains

> [!NOTE]
> On Render's Free tier, services spin down after 15 minutes of inactivity and take ~30 seconds to wake up on the first request. To prevent sleep, you can upgrade to Render Starter plan ($7/mo) or use a free uptime monitor (like UptimeRobot) to ping the URL every 10 minutes.

### Adding a Custom Domain (e.g., `billing.yourstore.com`)
1. In your Render Web Service dashboard, go to **Settings** -> **Custom Domains**.
2. Click **Add Custom Domain** and enter your domain name.
3. Add the `CNAME` record provided by Render into your domain registrar's DNS (Cloudflare, GoDaddy, Namecheap).
4. Render will automatically issue a free Let's Encrypt SSL certificate!
