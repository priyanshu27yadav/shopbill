# Using Supabase with SHOPBILL v1.0

Yes! You can use **Supabase** as your cloud database for **ShopBill**.

---

## How It Works

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│     Web Hosting (Free)          │           │       Supabase (Free)           │
│     (Render / Koyeb / VPS)      │           │                                 │
│                                 │           │   • Managed PostgreSQL DB       │
│   • React 19 Single Page App    │  ───────► │   • Visual Table Editor         │
│   • Laravel 11 Backend API      │  (SSL)    │   • Automated Daily Backups     │
│   • PDF Parser & Print Engine   │           │   • 500 MB Free Storage         │
└─────────────────────────────────┘           └─────────────────────────────────┘
```

> [!NOTE]
> Supabase provides a managed **PostgreSQL database, Auth, and Storage**, but does not host full Docker/PHP web servers. 
> The best architecture is:
> - **Database:** Hosted on **Supabase** (Free 500MB PostgreSQL, no credit card required).
> - **Web App & API:** Hosted on **Render** (Free Docker Web Service) or **Koyeb** (Free Nano).

---

## Step 1: Create a Free Database on Supabase

1. Go to **[supabase.com](https://supabase.com)** and sign up / log in with your GitHub account.
2. Click **New Project**.
3. Fill in the project details:
   - **Name:** `shopbill-db`
   - **Database Password:** Enter a strong password (remember this!).
   - **Region:** Choose the region closest to you (e.g., *South Asia (Mumbai)*, *Central EU (Frankfurt)*, or *US East*).
   - **Pricing Plan:** **Free tier** ($0/month).
4. Click **Create new project** (takes ~1 minute to provision).

---

## Step 2: Get Connection Credentials from Supabase

1. In your Supabase project dashboard, navigate to:
   **Project Settings** (gear icon at bottom left) -> **Database**.
2. Scroll to the **Connection parameters** section:
   - **Host:** `db.xxxxxxxxxxxxxxxxxxxx.supabase.co`
   - **Database name:** `postgres`
   - **Port:** `5432`
   - **User:** `postgres`
   - **Password:** *(the password you created in Step 1)*

---

## Step 3: Connect Your Web Host to Supabase

In your hosting platform (**Render**, **Koyeb**, or your `.env` file):

Set these Environment Variables:

| Variable | Value |
| :--- | :--- |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | `db.xxxxxxxxxxxxxxxxxxxx.supabase.co` |
| `DB_PORT` | `5432` |
| `DB_DATABASE` | `postgres` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | `<your-supabase-database-password>` |
| `DB_SSLMODE` | `require` |
| `SEED_DATABASE` | `true` |

---

## Step 4: Deploy & Verify in Supabase

1. Deploy or trigger a build on your web host (Render/Koyeb).
2. The Docker container will:
   - Connect securely to Supabase over SSL (`sslmode=require`).
   - Automatically execute all 20+ database migrations.
   - Seed default admin accounts and initial catalogue categories.
3. Open the **Table Editor** in Supabase:
   - You will see all tables created: `users`, `shops`, `invoices`, `invoice_items`, `products`, `customers`, etc.
   - You can inspect, edit, and query bills directly inside Supabase's web interface!
