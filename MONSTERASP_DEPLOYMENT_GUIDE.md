# DealZone — MonsterASP Production Deployment Guide

**Repository:** https://github.com/Dev-Mazen/DealZone | Branch: `main` | Commit: `7273516`  
**Backend:** ASP.NET Core .NET 10 → MonsterASP.NET (IIS / Windows)  
**Frontend:** React 19 / Vite → Vercel  
**Database:** SQL Server on MonsterASP  
**Prepared:** 2026-11-13

---

## Deployment at a Glance

```
Step 1  → Publish backend locally (Release build)
Step 2  → Run SQL migration script on MonsterASP SQL Server
Step 3  → Upload publish output to MonsterASP via FTP
Step 4  → Configure environment variables (never edit source-controlled files)
Step 5  → Restart application
Step 6  → Bootstrap the admin account
Step 7  → Deploy frontend to Vercel
Step 8  → Update CORS origin on MonsterASP
Step 9  → Run smoke tests
```

---

## 1. Project Structure (Verified)

```
DealZone/
├── backend/
│   ├── DealZone.sln
│   └── src/
│       ├── DealZone.Api/           ← PUBLISH THIS PROJECT
│       ├── DealZone.Application/
│       ├── DealZone.Domain/
│       └── DealZone.Infrastructure/
│           └── Persistence/Scripts/
│               └── DealZone_Full_Idempotent_Migrations.sql   ← RUN THIS
└── frontend/                       ← DEPLOY THIS DIRECTORY TO VERCEL
    ├── vercel.json
    └── src/
```

**Target framework:** `net10.0` (confirmed in `DealZone.Api.csproj`)  
**Hosting model:** In-process (`AspNetCoreModuleV2`, confirmed in `web.config`)

---

## 2. Step 1 — Build & Publish Backend

Open PowerShell in the repository root (`d:\Mazen\MyProjects\DealZone`):

```powershell
# Remove any previous publish output
if (Test-Path backend/publish) { Remove-Item -Recurse -Force backend/publish }

# Publish Release build — self-contained: false (MonsterASP provides the runtime)
dotnet publish backend/src/DealZone.Api/DealZone.Api.csproj `
  -c Release `
  -o backend/publish `
  --no-self-contained
```

> **Why `--no-self-contained`?** MonsterASP provides the .NET 10 runtime on the server.
> A framework-dependent publish is smaller and simpler. Do NOT use `--self-contained true`
> unless MonsterASP requires it (they don't for ASP.NET Core hosting).

### Verify publish output

After the command completes, confirm these files exist in `backend/publish/`:

```
backend/publish/
├── DealZone.Api.dll              ← entry point
├── DealZone.Api.runtimeconfig.json
├── web.config                    ← IIS handler
├── appsettings.json              ← base config
├── appsettings.Production.json   ← production overrides (empty credentials)
└── [all dependency DLLs]
```

> `appsettings.Production.json` is committed with **empty credential placeholders**.
> Real credentials are injected via MonsterASP environment variables — never hardcoded here.

---

## 3. Step 2 — Initialize the Database

> ⚠️ Do this **before** uploading the application. The app will fail its health check
> if the database schema doesn't exist.

**Script location:**
```
backend/src/DealZone.Infrastructure/Persistence/Scripts/DealZone_Full_Idempotent_Migrations.sql
```

**Script properties (verified):**
- Size: 87,481 bytes
- Covers all 17 EF Core migrations in correct order
- Idempotent — safe on a fresh database; safe to re-run
- Contains zero `DROP TABLE`, `DROP DATABASE`, or `TRUNCATE` statements
- Last migration: `20261111180118_UnifiedMarketplaceAndProcurementRefactor`
- Ends with `COMMIT; GO` ✅

**Migration order (all 17 — verified):**

| # | Migration |
|---|---|
| 1 | `20261030143637_InitialCreate` |
| 2 | `20261030150059_AddAuthenticationAndRefreshTokens` |
| 3 | `20261030155236_AddVerificationWorkflow` |
| 4 | `20261030162115_AddCatalogAndRfqManagement` |
| 5 | `20261030170921_AddOffersAndNegotiation` |
| 6 | `20261030173630_AddDealsAndDisputesLifecycle` |
| 7 | `20261030175518_AddShippingAndReviews` |
| 8 | `20261030183944_AddNotifications` |
| 9 | `20261030194444_AddConcurrencyUniqueIndexes` |
| 10 | `20261108204006_AddCompanyTypeToCompany` |
| 11 | `20261108210735_UserRoles` |
| 12 | `20261109235010_AddOfferWithdrawalAndRfqSequence` |
| 13 | `20261110010129_AddTenderAndReverseBidding` |
| 14 | `20261110015941_Tenders` |
| 15 | `20261110020729_Tenders2` |
| 16 | `20261110180936_AddDirectCatalogPurchasingAndRestrictedCategories` |
| 17 | `20261111180118_UnifiedMarketplaceAndProcurementRefactor` |

### How to execute via SSMS

1. Open SQL Server Management Studio (SSMS).
2. Connect to your MonsterASP SQL Server:
   - **Server:** `mssqlX.monsterasp.net,1433` (use your actual server host)
   - **Authentication:** SQL Server Authentication
   - **Login / Password:** your MonsterASP database credentials
3. In Object Explorer, expand your database (e.g., `dealzone_db`).
4. Click **New Query** — confirm the database selector shows your DB, **not** `master`.
5. Open or paste the full contents of `DealZone_Full_Idempotent_Migrations.sql`.
6. Press **F5** (Execute).
7. Confirm: `Commands completed successfully.`
8. Verify in Object Explorer: tables `Users`, `Companies`, `Products`, `Rfqs`, `Deals`, `ProductNegotiations`, and `__EFMigrationsHistory` should all exist.

---

## 4. Step 3 — Upload to MonsterASP via FTP

1. In MonsterASP Control Panel → **FTP Accounts** — note the FTP host, username, and password.
2. Connect with FileZilla or WinSCP using **FTPS (Explicit TLS)**.
3. Navigate to `/site/wwwroot/` on the remote server.
4. **Delete** any existing files in `/site/wwwroot/` (or upload over them).
5. Upload the **entire contents** of `backend/publish/` into `/site/wwwroot/`.
   - The root of `/site/wwwroot/` must contain `DealZone.Api.dll` and `web.config` directly.
   - Do NOT upload the `backend/publish/` folder itself — upload its **contents**.

### After upload, verify remotely

```
/site/wwwroot/
├── DealZone.Api.dll      ← must be here (not in a subfolder)
├── web.config            ← must be here
├── appsettings.json
├── appsettings.Production.json
└── [DLLs ...]
```

---

## 5. Step 4 — Configure Environment Variables

**Never edit `appsettings.Production.json` with real credentials.** Set all secrets via MonsterASP Application Settings or by editing the uploaded `web.config` on the server.

### Method A: MonsterASP Control Panel (Recommended)

Navigate to your website → **Application Settings** (or Environment Variables).

Add all variables from the table in Section 5.3 below.

### Method B: Edit web.config on the server

After uploading, edit `/site/wwwroot/web.config` via the MonsterASP File Manager.
Add variables inside the `<environmentVariables>` block:

```xml
<aspNetCore processPath="dotnet"
            arguments=".\DealZone.Api.dll"
            stdoutLogEnabled="false"
            stdoutLogFile=".\logs\stdout"
            hostingModel="inprocess">
  <environmentVariables>
    <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
    <environmentVariable name="ConnectionStrings__DefaultConnection"
      value="Server=db79719.public.databaseasp.net;Database=db79719;User Id=db79719;Password=a-6Z+3Kf9Do?;TrustServerCertificate=True;" />
    <environmentVariable name="JwtSettings__SecretKey"
      value="REPLACE_WITH_64_CHAR_RANDOM_SECRET" />
    <environmentVariable name="CorsSettings__AllowedOrigins__0"
      value="https://deal-zone-one.vercel.app" />
    <environmentVariable name="SmtpSettings__Host"       value="smtp.YOUR-PROVIDER.com" />
    <environmentVariable name="SmtpSettings__Port"       value="587" />
    <environmentVariable name="SmtpSettings__Username"   value="YOUR_SMTP_USER" />
    <environmentVariable name="SmtpSettings__Password"   value="YOUR_SMTP_PASSWORD" />
    <environmentVariable name="SmtpSettings__FromEmail"  value="noreply@dealzone.eg" />
    <environmentVariable name="SmtpSettings__FromName"   value="DealZone Marketplace" />
    <environmentVariable name="SmtpSettings__EnableSsl"  value="true" />
  </environmentVariables>
</aspNetCore>
```

### 5.3 — Complete Environment Variable Reference

| Variable | Required | Description | Example |
|---|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | ✅ | Must be `Production` | `Production` |
| `ConnectionStrings__DefaultConnection` | ✅ | Full SQL Server connection string | `Server=mssql3.monsterasp.net;Database=dealzone_db;User Id=dz_user;Password=...;TrustServerCertificate=True;` |
| `JwtSettings__SecretKey` | ✅ | Random string ≥ 32 chars. App refuses to start without it. | *Generate with `openssl rand -base64 48`* |
| `JwtSettings__Issuer` | ❌ | Default: `DealZone.Api` | `DealZone.Api` |
| `JwtSettings__Audience` | ❌ | Default: `DealZone.Clients` | `DealZone.Clients` |
| `JwtSettings__AccessTokenExpirationMinutes` | ❌ | Default: `60` | `60` |
| `JwtSettings__RefreshTokenExpirationDays` | ❌ | Default: `30` | `30` |
| `CorsSettings__AllowedOrigins__0` | ✅ | Exact Vercel URL (update after deploy) | `https://dealzone-abc.vercel.app` |
| `SmtpSettings__Host` | ✅ | SMTP server host | `smtp.gmail.com` |
| `SmtpSettings__Port` | ❌ | Default: `587` | `587` |
| `SmtpSettings__Username` | ✅ | SMTP username / email | `mail@yourdomain.com` |
| `SmtpSettings__Password` | ✅ | SMTP password / app password | *from your SMTP provider* |
| `SmtpSettings__FromEmail` | ❌ | Default: `noreply@dealzone.eg` | `noreply@dealzone.eg` |
| `SmtpSettings__FromName` | ❌ | Default: `DealZone Marketplace` | `DealZone Marketplace` |
| `SmtpSettings__EnableSsl` | ❌ | Default: `true` | `true` |
| `FileStorage__RootPath` | ❌ | Default: `private-storage/verification-documents` (relative to app dir). Do not change unless you have an absolute path outside wwwroot. | — |
| `BackgroundJobs__EnableOfferExpiryJob` | ❌ | Default: `true`. Set `false` to disable on idle-prone hosting. | `true` |
| `BackgroundJobs__OfferExpiryIntervalSeconds` | ❌ | Default: `60` | `60` |
| `BackgroundJobs__EnableTenderClosingJob` | ❌ | Default: `true` | `true` |
| `BackgroundJobs__EnableTokenCleanupJob` | ❌ | Default: `true` | `true` |
| `RateLimiting__Enabled` | ❌ | Default: `true` | `true` |
| `Swagger__Enabled` | ❌ | Default: `false` in production. Set `true` only temporarily for debugging. | `false` |

> **JWT Secret generation** — run this once locally and store the output securely:
> ```powershell
> # PowerShell — generates a 64-character hex string
> -join ((1..32) | ForEach-Object { '{0:X2}' -f (Get-Random -Max 256) })
> ```

---

## 6. Step 5 — Start / Restart the Application

After uploading files and setting environment variables:

1. In MonsterASP Control Panel → **Websites** → your site → **Restart**.
2. Wait 15–30 seconds.
3. Test the health endpoint: `https://<your-domain>/api/v1/health`
   - Expected: HTTP 200 with `{ "status": "Healthy" }`
   - If the app fails to start, see **Troubleshooting** (Section 10).

---

## 7. Step 6 — Bootstrap the Admin Account

> ⚠️ **Important:** Seeders only run inside `IsDevelopment()` in `Program.cs`.
> `AdminUserSeeder` does **not** run automatically in production.

**Two-step bootstrap process:**

**Step 6a — Register the admin user via the API or frontend:**

Use the registration endpoint or the frontend registration form to create the admin user account with the intended admin email address. The account will initially be a regular user.

```
POST https://<your-domain>/api/v1/auth/register
{
  "email": "admin@yourdomain.eg",
  "password": "StrongPassword123!",
  "fullName": "DealZone Admin"
}
```

Confirm the email if the SMTP flow requires it.

**Step 6b — Promote to system admin via SQL:**

Connect to the MonsterASP SQL Server in SSMS and run:

```sql
-- Promote the registered user to system admin
UPDATE [Users]
SET [IsSystemAdmin] = 1
WHERE [Email] = 'admin@yourdomain.eg';

-- Verify
SELECT [Id], [Email], [FullName], [IsSystemAdmin]
FROM [Users]
WHERE [Email] = 'admin@yourdomain.eg';
```

Confirm `IsSystemAdmin = 1` in the result.

> Alternatively, set `AdminSettings__SeedAdminEmail=admin@yourdomain.eg` as an environment
> variable and restart the app. The seeder checks this setting — however in production,
> `Program.cs` only calls `AdminUserSeeder.SeedAsync()` inside `IsDevelopment()`.
> **The SQL UPDATE above is the reliable production method.**

---

## 8. Step 7 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Import repository: `Dev-Mazen/DealZone`.
3. Configure project:
   - **Root Directory:** `frontend` ← critical, must set this
   - **Framework Preset:** `Vite` (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable **before** clicking Deploy:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://<your-monsterasp-domain>/api/v1`
   - **Environment:** Production (and Preview if desired)
5. Click **Deploy**.
6. After deployment, note the assigned Vercel domain (e.g., `https://dealzone-abc.vercel.app`).

---

## 9. Step 8 — Update CORS Origin

After the Vercel deployment assigns your real domain:

1. Update `CorsSettings__AllowedOrigins__0` in MonsterASP with the exact Vercel URL:
   ```
   https://dealzone-abc.vercel.app
   ```
2. Restart the application on MonsterASP.
3. If you later add a custom domain on Vercel, add it as `CorsSettings__AllowedOrigins__1`.

---

## 10. Step 9 — Smoke Test Checklist

Execute in order. All must pass before going live.

```
Backend health
─────────────
[ ] GET  https://<monsterasp-domain>/api/v1/health
      → HTTP 200
      → Body: { "status": "Healthy", "checks": [{ "name": "database", "status": "Healthy" }, ...] }
      If database check is "Unhealthy": verify connection string and that migrations ran.

[ ] GET  https://<monsterasp-domain>/health
      → HTTP 200 (secondary alias)

Authentication
──────────────
[ ] POST https://<monsterasp-domain>/api/v1/auth/register
      → HTTP 201 (new user created, confirmation email sent)

[ ] Check inbox: confirmation email received
      If no email: SMTP settings are incorrect

[ ] POST https://<monsterasp-domain>/api/v1/auth/login
      → HTTP 200 with { accessToken, refreshToken }

[ ] POST https://<monsterasp-domain>/api/v1/auth/refresh  (using refreshToken)
      → HTTP 200 with new tokens

Frontend
────────
[ ] GET  https://<vercel-domain>/
      → React app loads, no console errors

[ ] Navigate to https://<vercel-domain>/marketplace
      → Page loads (not 404 — SPA rewrite active)

[ ] Navigate to https://<vercel-domain>/rfqs
      → Page loads

[ ] Login through the frontend
      → Tokens stored in localStorage (dz_access, dz_refresh)
      → Dashboard data loads
      → No CORS errors in console

Admin Panel
───────────
[ ] Login as admin
      → Admin dashboard loads with KPI data

[ ] Admin → Companies → verify/reject a company
      → State transitions work

File Storage
────────────
[ ] Register a supplier company and upload a verification document
      → Upload returns 200/201

[ ] As admin, download the verification document
      → File streams correctly (PDF or image)

[ ] Attempt to download the same document while unauthenticated
      → HTTP 401 (access denied)

Background Services
───────────────────
[ ] Wait 5 minutes (do not send any requests)
      → Send another request to /api/v1/health
      → Still responds (may take 3-5s to wake from idle on free plan)
```

---

## 11. MonsterASP Control Panel Configuration Summary

Do these steps once in the MonsterASP Control Panel:

| Step | Location | Action |
|---|---|---|
| Set .NET runtime | Website → Website Settings → ASP.NET Version | Select **.NET 10.x** |
| Set App Pool | Website → Application Pool | Pipeline: **Integrated**, Managed Code: **No Managed Code** |
| Confirm SQL Server | Databases → MS SQL | Note server host, database name, username, password |
| Enable remote access | Databases → MS SQL → your DB | Enable external TCP access (port 1433) |
| FTP credentials | FTP Accounts | Note host, user, password for upload |
| Set environment vars | Website → Application Settings | Add all required variables from Section 5.3 |

---

## 12. Known Limitations & Risks (Free Plan)

| Risk | Severity | Mitigation |
|---|---|---|
| **App idle spin-down** (~15–20 min no traffic) | Medium | Set up [UptimeRobot](https://uptimerobot.com) (free) to ping `/api/v1/health` every 10 minutes |
| **Background jobs pause during idle** | Medium | UptimeRobot ping above keeps jobs running. Alternatively disable them and handle expiry lazily. |
| **File storage in `/site/wwwroot/`** | Low | Files persist across restarts. Plan Blob Storage migration before full production scale. |
| **1 GB SQL Server limit** | Low | Sufficient for a pilot; monitor via MonsterASP DB panel |
| **CORS update required after Vercel deploy** | Medium | Remember Step 8 — update CORS before testing the frontend |

---

## 13. Troubleshooting: App Fails to Start

If the health endpoint returns an error or the site shows an IIS 500/502:

1. In MonsterASP File Manager, edit `web.config` on the server.
2. Set `stdoutLogEnabled="true"`.
3. Restart the application.
4. Send a request to trigger startup.
5. Check `/site/wwwroot/logs/stdout_*.log` via File Manager.
6. Common causes:
   - `JwtSettings__SecretKey` is empty or too short → app throws at startup by design.
   - `ConnectionStrings__DefaultConnection` is empty → EF Core throws on first DB call.
   - .NET 10 runtime not selected in MonsterASP panel → IIS returns 500.32.
7. After fixing, set `stdoutLogEnabled="false"` again.

---

*This document is for deployment preparation only. No credentials should be inserted here.*

