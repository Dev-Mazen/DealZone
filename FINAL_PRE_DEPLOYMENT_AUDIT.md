# DealZone — Final Pre-Deployment Audit Report

**Repository:** https://github.com/Dev-Mazen/DealZone  
**Branch:** `main`  
**Audited Commit:** `7273516`  
**Audit Date:** 2026-11-13  
**Auditor:** Principal .NET Architect / DevOps Engineer / Application Security Auditor

---

## Executive Summary

| Area | Status |
|------|--------|
| Git / Source Control | ✅ PASS |
| Secrets & Credentials | ✅ PASS — No real credentials committed |
| Backend Configuration | ✅ PASS with 2 required manual actions |
| Exception Handling | ✅ PASS |
| Security Headers | ✅ PASS |
| Health Checks | ✅ PASS |
| File Storage Security | ✅ PASS |
| Database Migrations | ✅ PASS |
| Background Services | ⚠️ KNOWN LIMITATION (free hosting idle) |
| Frontend Build Config | ✅ PASS |
| Frontend API Client | ⚠️ REQUIRES Vercel env var |
| Vercel SPA Routing | ✅ PASS |
| MonsterASP Compatibility | ✅ PASS |

**Final Verdict: `READY AFTER MINOR FIXES`**

All issues found are configuration-time actions (env vars, connection strings, CORS URL) — not code defects. No critical blockers exist in the codebase.

---

## 1. Git Commit Audit

### 1.1 Diff Summary — Commit 7273516

```
61 files changed, 11244 insertions(+), 221 deletions(-)
```

**What is in the commit:**

| Category | Contents |
|---|---|
| Deployment configuration | `web.config`, `appsettings.Production.json`, `vercel.json` |
| Documentation | `DEPLOYMENT_READINESS_REPORT.md`, `MONSTERASP_DEPLOYMENT.md`, `VERCEL_DEPLOYMENT.md`, `DATABASE_DEPLOYMENT.md`, `DEPLOYMENT_GUIDE.md`, `README.md` |
| Feature — Negotiations | `NegotiationsController.cs`, `NegotiationService.cs`, `IProductNegotiationRepository.cs`, frontend negotiation pages |
| Feature — Supplier Products | `SupplierProductsPage.jsx`, `SupplierProductCard.jsx` |
| Feature — Marketplace | `MarketplacePage.jsx`, `ProductDetailPage.jsx` |
| Feature — RFQ/Award | Award endpoints, offer service extensions |

> **Note:** This commit bundles both deployment configuration and new feature work.
> From a code-correctness standpoint this is harmless, but auditors should be aware
> that reviewing "the deployment commit" means they also see substantial feature additions.
> **This is not a security or functional risk.**

### 1.2 Credentials Scan

| Item | Result |
|---|---|
| `appsettings.Production.json` — `JwtSettings.SecretKey` | `""` (empty placeholder) ✅ |
| `appsettings.Production.json` — `ConnectionStrings.DefaultConnection` | `""` (empty placeholder) ✅ |
| `appsettings.Production.json` — `SmtpSettings.Password` | `""` (empty placeholder) ✅ |
| `appsettings.Development.json` — `JwtSettings.SecretKey` | Dev key present (intentional, dev-only) ✅ |
| Git history scan for `password`, `secret`, `key`, `token` | All matches are placeholder strings or documentation ✅ |

**No real credentials are committed to the repository.**

### 1.3 Git State

```
Branch: main
HEAD: 7273516 (matches origin/main exactly)
Working tree: clean — nothing to commit
```

`.gitignore` correctly excludes:
- `*.env` / `.env` (secrets)
- `bin/` / `obj/` (build artifacts)
- `publish/` (deployment output)
- `private-storage/` (uploaded files)
- `node_modules/`

---

## 2. Backend Configuration Audit

### 2.1 web.config

**File:** `backend/src/DealZone.Api/web.config`

| Check | Result |
|---|---|
| Uses `AspNetCoreModuleV2` | ✅ |
| In-process hosting (`hostingModel="inprocess"`) | ✅ |
| `ASPNETCORE_ENVIRONMENT=Production` | ✅ |
| Request size limit 10 MB (matches `FormOptions` limit) | ✅ |
| `X-Powered-By` header removed | ✅ |
| `path="*"` — all requests route through ASP.NET Core | ✅ |

> **Tip:** `stdoutLogEnabled="false"` is correct for production. When debugging a failed startup
> on MonsterASP, temporarily set it to `true` with `stdoutLogFile=".\logs\stdout"`,
> then revert after diagnosis.

### 2.2 JWT Configuration Guard

The `DependencyInjection.cs` startup guard throws `InvalidOperationException` and **refuses to start** if any of these are true in Production:
- `JwtSettings.SecretKey` is empty or whitespace
- `SecretKey.Length < 32`
- `SecretKey` equals the development default value

✅ The app will not silently start with a broken or default JWT key.  
✅ HTTPS metadata is required in non-development environments.

**Required action:** Set `JwtSettings__SecretKey` as a MonsterASP environment variable with a strong random key (≥ 32 chars, never the dev default).

### 2.3 CORS Configuration

**File:** `backend/src/DealZone.Api/appsettings.Production.json`

```json
"CorsSettings": {
  "AllowedOrigins": ["https://dealzone.vercel.app"]
}
```

> ⚠️ **MEDIUM — Requires manual update before first use.**  
> `https://dealzone.vercel.app` is a placeholder. The real Vercel URL is assigned only after
> the first Vercel deployment. After deploying the frontend, update this via the
> `CorsSettings__AllowedOrigins__0` environment variable in MonsterASP, or update
> `appsettings.Production.json` and redeploy the backend.

CORS is code-enforced — no wildcard origin, no `*`. ✅

### 2.4 Exception Handler

**File:** `backend/src/DealZone.Api/Infrastructure/GlobalExceptionHandler.cs`

| Check | Result |
|---|---|
| Maps `ValidationException` → 400 | ✅ |
| Maps `NotFoundException` → 404 | ✅ |
| Maps `ForbiddenException` → 403 | ✅ |
| Maps `ConflictException` and `DbUpdateConcurrencyException` → 409 | ✅ |
| Maps `DomainException` → 400 | ✅ |
| Maps unhandled → 500 | ✅ |
| In Production: 500 detail = **generic message only** (no stack trace leaked) | ✅ |
| In Development: 500 detail = `exception.Message` | ✅ (dev only) |
| All errors returned as `application/problem+json` | ✅ |
| `traceId` included for log correlation | ✅ |

### 2.5 Security Headers

**File:** `backend/src/DealZone.Api/Infrastructure/SecurityHeadersMiddleware.cs`

| Header | Value | Status |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `X-Frame-Options` | `DENY` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | ✅ |
| `Content-Security-Policy` | `default-src 'none'; frame-ancestors 'none'` | ✅ |
| `X-Permitted-Cross-Domain-Policies` | `none` | ✅ |
| Auth endpoints: `Cache-Control: no-store` | Prevents token caching | ✅ |

### 2.6 Health Checks

**Endpoints:** `GET /health` and `GET /api/v1/health`

| Check | Result |
|---|---|
| `DatabaseHealthCheck` — calls `CanConnectAsync()` | ✅ |
| `FileStorageHealthCheck` — registered | ✅ |
| JSON response writer with status, duration, checks array | ✅ |
| Health endpoints accessible without authentication | ✅ (intentional for monitoring) |

**Smoke test:** After deployment, `GET /api/v1/health` must return:
```json
{ "status": "Healthy", "duration": <ms>, "checks": [ ... ] }
```

### 2.7 Swagger in Production

```json
"Swagger": { "Enabled": false }
```

✅ Swagger UI and OpenAPI spec are disabled in production. Set `Swagger__Enabled=true` only for temporary debugging.

---

## 3. Database Audit

### 3.1 Migrations

```
Total migrations: 17
EF Core tool version: 9.0.8
Runtime version: .NET 10.0.3
```

> **Note:** `dotnet ef` tool version 9.0.8 vs runtime 10.0.3 produces a tool-version warning
> during script generation. This does **not** affect the generated SQL or runtime behavior.
> Low priority; resolve with `dotnet tool update dotnet-ef` when convenient.

All 17 migrations are present, ordered, and chained correctly.

### 3.2 Generated Idempotent SQL Script

**File:** `backend/src/DealZone.Infrastructure/Persistence/Scripts/DealZone_Full_Idempotent_Migrations.sql`  
**Size:** 87,481 bytes

| Check | Result |
|---|---|
| `__EFMigrationsHistory` creation guarded with `IF NOT EXISTS` | ✅ |
| Each migration block wrapped in `IF NOT EXISTS` check | ✅ |
| No `DROP TABLE` statement | ✅ |
| No `DROP DATABASE` statement | ✅ |
| No `TRUNCATE TABLE` statement | ✅ |
| Safe to execute on a clean SQL Server database | ✅ |
| Safe to re-run on a database with existing migrations | ✅ (idempotent) |

### 3.3 Production Seeding Behavior

```csharp
// Program.cs
if (app.Environment.IsDevelopment())
{
    await AdminUserSeeder.SeedAsync(app.Services);   // dev only
    await CatalogSeeder.SeedAsync(app.Services);     // dev only
    await DemoDataSeeder.SeedAsync(app.Services);    // dev only
}
```

✅ **No data is auto-seeded in production.** `ASPNETCORE_ENVIRONMENT=Production` in `web.config` guarantees this guard is active.

> ⚠️ After running migrations in production, you must manually create the first admin user.
> See `MONSTERASP_DEPLOYMENT.md` for the SQL INSERT approach.

---

## 4. File Storage Security Audit

### 4.1 Architecture

**Service:** `LocalFileStorageService`  
**Configured path:** `private-storage/verification-documents` (relative, resolved with `Path.GetFullPath`)

Files are stored and retrieved **exclusively through the authorized controller layer:**

| Endpoint | Authorization |
|---|---|
| `POST /api/v1/verification/upload` | `[Authorize]` (authenticated user) |
| `GET /api/v1/admin/companies/{id}/documents/{key}` | `[Authorize(Policy = "SystemAdmin")]` |

### 4.2 Static File Exposure Risk — CLEARED

The `web.config` routes **all requests** (`path="*"`) to `AspNetCoreModuleV2`. IIS never intercepts any path as a static file — including `private-storage/`.

`Program.cs` does **not** call `app.UseStaticFiles()`.

**Conclusion:** `private-storage/` cannot be reached via a direct HTTP URL. All access is mediated exclusively by the authorized API controller. ✅

### 4.3 Path Traversal Protection

```csharp
var absolutePath = Path.GetFullPath(Path.Combine(_rootPath, normalized));
if (!absolutePath.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
    throw new InvalidOperationException("Storage key resolves outside the designated storage root.");
```

✅ Path traversal attacks via crafted storage keys are blocked.

### 4.4 MonsterASP Storage Concern

> ⚠️ **LOW-MEDIUM — Known limitation.**  
> `LocalFileStorageService` writes files to a relative path inside the published app directory
> (`/site/wwwroot/private-storage/...` on MonsterASP). MonsterASP's free plan provides
> persistent writable storage within `/site/wwwroot`. Files survive normal app restarts.
>
> However, the free plan does not guarantee persistence across full site resets or plan migrations.
> For a production deployment with real legal verification documents, plan an upgrade to
> Azure Blob Storage or equivalent cloud object storage.
>
> For the current pilot/beta launch, `LocalFileStorageService` is acceptable.

---

## 5. Background Services Audit

Three `IHostedService` workers are registered:

| Service | Default Interval | Toggle Flag |
|---|---|---|
| `OfferExpiryBackgroundService` | 60 seconds | `BackgroundJobs__EnableOfferExpiryJob` |
| `TenderClosingBackgroundService` | 60 seconds | `BackgroundJobs__EnableTenderClosingJob` |
| `TokenCleanupBackgroundService` | 24 hours | `BackgroundJobs__EnableTokenCleanupJob` |

Each service is independently toggleable via configuration, catches `OperationCanceledException` for graceful shutdown, and logs errors without crashing. ✅

> ⚠️ **MEDIUM — Free hosting known limitation.**  
> MonsterASP.NET free plan idles the application after ~15–20 minutes of inactivity, stopping
> all `IHostedService` workers. Expired offers and tenders may remain `Active` for up to the
> idle duration past their deadlines.
>
> **Mitigation options (pick one):**
> 1. Use UptimeRobot (free) to ping `/api/v1/health` every 10 minutes to prevent idle.
> 2. Set `BackgroundJobs__EnableOfferExpiryJob=false` and enforce expiry lazily on-read.
> 3. Upgrade to a paid MonsterASP plan that does not idle.
>
> Option 1 is the fastest fix and costs nothing.

---

## 6. Frontend Configuration Audit

### 6.1 vite.config.js

| Check | Result |
|---|---|
| Output dir is Vite default (`dist`) — no override | ✅ |
| No `server.proxy` config (dev-only) that could leak into build | ✅ |
| No hardcoded URLs or env references | ✅ |
| Code splitting: react, router, tanstack, icons | ✅ |
| `chunkSizeWarningLimit: 1000` — appropriate for the stack | ✅ |
| `@` alias resolves to `./src` | ✅ |

### 6.2 axios.js — API Base URL Resolution

```javascript
export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ||
  (import.meta.env?.PROD ? '/api/v1' : 'http://localhost:5023/api/v1')
```

| Scenario | Behavior |
|---|---|
| `VITE_API_BASE_URL` set on Vercel | ✅ All API calls go to the configured MonsterASP URL |
| `VITE_API_BASE_URL` **not set** on Vercel | ❌ Falls back to relative `/api/v1` → 404 on Vercel |
| Development (no env var) | ✅ Uses `http://localhost:5023/api/v1` |

> ⚠️ **HIGH — Required action before frontend launch.**  
> Add `VITE_API_BASE_URL=https://<your-monsterasp-domain>/api/v1` in Vercel project settings
> → Environment Variables → Production scope.
>
> Do **NOT** commit it to `.env` (which is in `.gitignore`). Set it only in the Vercel dashboard.
> Without this, the deployed frontend makes zero successful API calls.

**`.env.example` check:**

```env
# frontend/.env.example (safely committed as documentation)
VITE_API_BASE_URL=http://localhost:5023/api/v1
```

✅ `.env` is excluded by `.gitignore`. `.env.example` is committed as reference documentation only.

### 6.3 vercel.json

**File:** `frontend/vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [{
    "source": "/assets/(.*)",
    "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
  }]
}
```

| Check | Result |
|---|---|
| SPA fallback rewrite `/*` → `/index.html` | ✅ React Router 6 deep links work |
| Immutable cache for hashed `/assets/*` files | ✅ Optimal CDN caching |
| `index.html` has no aggressive cache header | ✅ Always fetches fresh app shell |
| No server-side API proxying | ✅ Correct for a static Vercel deploy |

---

## 7. MonsterASP.NET Compatibility

| Feature | Status | Notes |
|---|---|---|
| ASP.NET Core (.NET 10) | ✅ | Supported |
| In-process IIS hosting | ✅ | Configured in `web.config` |
| SQL Server | ✅ | MonsterASP provides MSSQL databases |
| Forwarded headers | ✅ | Configured in `Program.cs` |
| HSTS | ✅ | Enabled in production |
| IIS request size limit 10 MB | ✅ | Matches app `FormOptions` limit |
| FTP upload of publish output | ✅ | Supported |
| Persistent writable storage in `/site/wwwroot` | ✅ | Available on free plan |
| Background services | ⚠️ | Paused during app idle — see Section 5 |
| Remote SQL access | ✅ | Required for running migration script from SSMS |

---

## 8. Required Actions Before Deployment

These are **all configuration steps** — no code changes required.

### 8.1 MonsterASP — Environment Variables

Set in MonsterASP control panel → Environment Variables (or inside `web.config` `<environmentVariables>`):

| Variable | Value |
|---|---|
| `ConnectionStrings__DefaultConnection` | Your MonsterASP SQL Server connection string |
| `JwtSettings__SecretKey` | Strong random string ≥ 32 characters |
| `SmtpSettings__Host` | Your SMTP provider host (e.g. `smtp.gmail.com`) |
| `SmtpSettings__Port` | `587` (or `465` for SSL) |
| `SmtpSettings__Username` | Your SMTP username |
| `SmtpSettings__Password` | Your SMTP password |
| `SmtpSettings__FromEmail` | Sending address |
| `CorsSettings__AllowedOrigins__0` | `https://<your-actual-vercel-domain>` (update after Vercel deploy) |

### 8.2 Vercel — Environment Variable

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<your-monsterasp-domain>/api/v1` |

Set in Vercel Dashboard → Project → Settings → Environment Variables → Production.

### 8.3 Database Migration

Execute the idempotent script against the MonsterASP SQL Server:

```
backend/src/DealZone.Infrastructure/Persistence/Scripts/DealZone_Full_Idempotent_Migrations.sql
```

Via SQL Server Management Studio or the MonsterASP database management panel. The script is safe on a clean database and safe to re-run.

### 8.4 Admin User Creation

After migrations, create the first admin user manually using the SQL INSERT documented in `MONSTERASP_DEPLOYMENT.md`. The app does not auto-seed an admin in production.

### 8.5 CORS Update (Post-Frontend Deploy)

After the first Vercel deployment, your frontend URL is known. Update:
1. `CorsSettings__AllowedOrigins__0` in MonsterASP env vars.
2. Restart the application.

---

## 9. Findings Register

| # | Severity | Area | Finding | Required Action |
|---|---|---|---|---|
| F-01 | **HIGH** | Frontend | `VITE_API_BASE_URL` not set → all API calls fail (relative `/api/v1` on Vercel is 404) | Set env var in Vercel dashboard before launch |
| F-02 | **HIGH** | Backend | `JwtSettings__SecretKey` empty → app refuses to start by design | Set strong key in MonsterASP env vars |
| F-03 | **HIGH** | Backend | `ConnectionStrings__DefaultConnection` empty → app refuses to start | Set connection string in MonsterASP env vars |
| F-04 | **MEDIUM** | Backend | CORS `AllowedOrigins` has placeholder `dealzone.vercel.app` | Update to real Vercel domain post-deploy |
| F-05 | **MEDIUM** | Backend | Background services pause during IIS idle on free plan | Pin with UptimeRobot or disable + lazy expiry |
| F-06 | **MEDIUM** | Backend | `SmtpSettings` credentials empty → email features non-functional | Set SMTP credentials in env vars |
| F-07 | **LOW** | Storage | File storage in `/site/wwwroot` — no guarantee across full site resets | Acceptable for pilot; plan blob storage for production scale |
| F-08 | **LOW** | Database | EF tool 9.0.8 vs runtime 10.0.3 mismatch (warning only, no functional impact) | `dotnet tool update dotnet-ef` when convenient |
| F-09 | **LOW** | Git | Deployment commit also contains feature code (Negotiations, Marketplace) | Informational only — no action required |
| F-10 | **LOW** | Git | Dev JWT secret tracked in `appsettings.Development.json` | Intentional; production startup guard blocks reuse in production |

---

## 10. Smoke Test Checklist

Execute in order after deployment:

```
[ ] GET  https://<monsterasp-domain>/api/v1/health
      → HTTP 200, body: { "status": "Healthy", "checks": [...] }

[ ] POST https://<monsterasp-domain>/api/v1/auth/login  (admin credentials)
      → HTTP 200, response contains accessToken and refreshToken

[ ] GET  https://<vercel-domain>/
      → HTTP 200, React app loads with no console errors

[ ] Navigate to https://<vercel-domain>/marketplace
      → Page loads (not 404) — confirms SPA rewrite is active

[ ] Login through the frontend UI
      → Redirects to dashboard; JWT stored in localStorage

[ ] Admin dashboard → KPI data loads
      → Confirms CORS and VITE_API_BASE_URL are correct

[ ] Upload a verification document as a supplier
      → File stored without error

[ ] Download verification document as admin
      → File streams correctly, unauthorized download returns 403

[ ] Register a new user
      → Confirmation email received (SMTP configured)

[ ] Background health: wait 2 minutes, re-check /api/v1/health
      → Still Healthy (app not prematurely restarting)
```

---

## Final Verdict

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   READY AFTER MINOR FIXES (Configuration Only)                  ║
║                                                                  ║
║   No code defects block deployment.                              ║
║   No secrets committed. No destructive DB operations.           ║
║   No broken auth paths. No static file exposure.                ║
║                                                                  ║
║   All blocking items are environment variable configuration      ║
║   steps in MonsterASP and Vercel dashboards.                     ║
║                                                                  ║
║   Complete Section 8 in order, then run the Smoke Test.         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

*Generated by pre-deployment safety audit. Do not commit to production history without review.*

