# DealZone — End-to-End Production Deployment Guide

This guide walks you through deploying the complete **DealZone Egyptian Industrial Raw-Material Marketplace** stack to production.

---

## Architecture Overview

```
                                      +------------------------------------+
                                      |       Vercel (Edge CDN)            |
                                      |   React 19 / Vite 8 Frontend SPA  |
                                      |   https://dealzone.vercel.app      |
                                      +-----------------+------------------+
                                                        |
                                                        | HTTPS REST Calls
                                                        v
                                      +------------------------------------+
                                      |     MonsterASP.NET (IIS)           |
                                      |     .NET 10 Web API Host           |
                                      |  https://dealzone.monsterasp.net   |
                                      +-----------------+------------------+
                                                        |
                                                        | Port 1433 (Encrypted)
                                                        v
                                      +------------------------------------+
                                      |   MonsterASP.NET SQL Server        |
                                      |   Database: DealZoneDb_Prod        |
                                      +------------------------------------+
```

---

## Step 1: Database Setup on MonsterASP.NET

1. Log into your [MonsterASP.NET Control Panel](https://www.monsterasp.net).
2. Navigate to **MS SQL Databases** and click **Create Database**.
3. Fill in the details:
   - **Database Name:** e.g., `dealzone_db`
   - **Login Name:** e.g., `dealzone_user`
   - **Password:** Strong password (save securely)
4. After creation, MonsterASP will display your connection details:
   - **Server Hostname:** e.g., `mssqlX.monsterasp.net`
   - **Database Name:** `dealzone_db`
   - **User ID:** `dealzone_user`
   - **Password:** `<your_password>`
5. Open **SQL Server Management Studio (SSMS)** on your computer:
   - Server name: `mssqlX.monsterasp.net,1433` (or the exact host provided)
   - Authentication: SQL Server Authentication
   - Login: `dealzone_user`
   - Password: `<your_password>`
   - Connect.
6. Open the file in this repository:
   `backend/src/DealZone.Infrastructure/Persistence/Scripts/DealZone_Full_Idempotent_Migrations.sql`
7. Execute the entire script against your newly created database.
   - It will create all 17 migrations, tables, sequences, foreign keys, and indexes safely.

---

## Step 2: Backend Deployment to MonsterASP.NET

### 2.1 Publish the Application Locally
Run the following PowerShell command from the repository root:

```powershell
dotnet publish backend/src/DealZone.Api/DealZone.Api.csproj -c Release -o backend/publish
```

The output will be placed in `backend/publish/` and includes the pre-configured `web.config` file.

### 2.2 Upload via FTP / File Manager
1. In MonsterASP.NET control panel, open **File Manager** or connect using an FTP client (such as FileZilla) using your site's FTP credentials.
2. Navigate to the website root directory: `/site/wwwroot/`
3. Upload all files from inside your local `backend/publish/` folder directly into `/site/wwwroot/`.
4. Ensure `web.config` is present in `/site/wwwroot/web.config`.

### 2.3 Configure Environment Settings in MonsterASP.NET
In MonsterASP.NET Website Settings, configure the Application Environment Variables (or add them inside the `<environmentVariables>` section of `/site/wwwroot/web.config`):

```xml
<environmentVariables>
  <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
  <environmentVariable name="ConnectionStrings__DefaultConnection" value="Server=mssqlX.monsterasp.net;Database=dealzone_db;User Id=dealzone_user;Password=YOUR_STRONG_PASSWORD;TrustServerCertificate=True;" />
  <environmentVariable name="JwtSettings__SecretKey" value="GENERATE_A_64_CHARACTER_RANDOM_SECRET_KEY_HERE_FOR_SECURITY_2026!" />
  <environmentVariable name="JwtSettings__Issuer" value="DealZone.Api" />
  <environmentVariable name="JwtSettings__Audience" value="DealZone.Clients" />
  <environmentVariable name="CorsSettings__AllowedOrigins__0" value="https://your-vercel-app-url.vercel.app" />
  <environmentVariable name="Swagger__Enabled" value="false" />
</environmentVariables>
```

5. Restart the Website from the control panel.
6. Test backend health: Open `https://your-monsterasp-domain.com/health` in your browser. You should receive:
   ```json
   {
     "status": "Healthy",
     "timestampUtc": "2026-11-13T...",
     "entries": { "sqlserver": { "status": "Healthy" } }
   }
   ```

---

## Step 3: Frontend Deployment to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project**.
3. Connect your GitHub account and select the **DealZone** repository (`Dev-Mazen/DealZone`).
4. Configure the Project Settings:
   - **Framework Preset:** Vite
   - **Root Directory:** Click Edit and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand the **Environment Variables** section and add:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://your-monsterasp-domain.com/api/v1` (replace with your actual backend URL)
6. Click **Deploy**.
7. Once deployment finishes, Vercel provides your production URL (e.g. `https://dealzone-frontend.vercel.app`).
8. Return to MonsterASP.NET and update `CorsSettings__AllowedOrigins__0` with this exact Vercel URL to allow secure API requests.

---

## Step 4: Verification and Smoke Testing

1. Open your Vercel website in the browser.
2. Register a new buyer company or log in.
3. Browse the **Marketplace** page: Verify categories (Metals, Textiles, Food) and products load from the database.
4. Test "Make an Offer" and "Buy Now".
5. Test routing: Refresh on `/marketplace`, `/negotiations`, or `/deals`. Vercel's SPA rewrite configuration will ensure no 404 errors occur.
