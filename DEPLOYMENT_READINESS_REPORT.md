# DealZone — Comprehensive Deployment Readiness Report

**Document Date:** 2026-11-13  
**Target Environments:**
- **Backend:** MonsterASP.NET (Free Windows / IIS Hosting Plan)
- **Database:** Microsoft SQL Server (MonsterASP.NET Hosted)
- **Frontend:** Vercel (Edge Network / Static SPA)
- **Source Control:** GitHub (`origin: https://github.com/Dev-Mazen/DealZone.git`)

---

## 1. Executive Summary

A comprehensive pre-deployment audit of the DealZone architecture was executed. The application is a modern Egyptian B2B raw-material marketplace built with a .NET 10 Clean Architecture API and a React 19 / Vite 8 SPA.

**Readiness Assessment:** **READY FOR DEPLOYMENT WITH IDENTIFIED ENVIRONMENT CONFIGURATIONS.**

The code is strictly decoupled from development-only seeds in production mode, all 17 EF Core migrations are verified, and an idempotent SQL deployment script has been generated. The frontend SPA has been configured for Vercel with clean client-side routing rewrites (`vercel.json`).

---

## 2. Infrastructure & Hosting Analysis

### 2.1 Backend: MonsterASP.NET Free Plan Compatibility

| Attribute | MonsterASP.NET Free Tier Limit | DealZone Requirement | Feasibility & Mitigation |
|---|---|---|---|
| **.NET Runtime** | Supports .NET 6, 7, 8, 9, 10 (Selectable in Control Panel) | .NET 10.0 (ASP.NET Core Web API) | **Fully Supported**. Must select `.NET 10.x` in the Website Settings. |
| **Hosting Model** | IIS with `AspNetCoreModuleV2` (In-Process) | In-Process IIS hosting | **Configured**. Custom `web.config` created with `AspNetCoreModuleV2`, InProcess model, and request length limits. |
| **RAM / Memory Limit** | Typically 256 MB – 512 MB on Free Plan | ~120 MB idle / ~250 MB under moderate load | **Compatible**. EF Core uses `AsNoTracking` for queries; background jobs run bounded batches. |
| **Application Idle Timeout** | Free sites spin down after 15–20 minutes of inactivity | Host cold-starts on subsequent incoming HTTP requests | **Acceptable for staging/pilot**. Cold start takes ~3–5s due to .NET 10 tier-1 JIT. |
| **Storage Limit** | 1 GB SSD on Web, 1 GB on MSSQL | Application binaries: ~60 MB; DB schema: < 20 MB | **Fully Compatible**. Ample headroom. |
| **Web Deploy / FTP** | Web Deploy & FTPS enabled | Automated or manual zip / FTP deployment | **Fully Compatible**. Published via `dotnet publish -c Release`. |

### 2.2 Database: MonsterASP.NET Hosted SQL Server

- **Engine:** Microsoft SQL Server 2019 / 2022.
- **Access:** External IP / hostname provided in MonsterASP dashboard; accessible via SQL Server Management Studio (SSMS) over port 1433.
- **Migration Strategy:** Idempotent migration script `DealZone_Full_Idempotent_Migrations.sql` generated using EF Core CLI. It creates `__EFMigrationsHistory` if missing and applies only unapplied migrations safely.

### 2.3 Frontend: Vercel Hosting

- **Framework:** React 19 + Vite 8.
- **Output:** Client-side SPA (`frontend/dist`).
- **Routing:** Handled via client-side React Router. Added `frontend/vercel.json` with wildcard rewrites to `/index.html` to eliminate 404s on route refresh.
- **API Connectivity:** Configured via `VITE_API_BASE_URL`.

---

## 3. Configuration & Security Audit

### 3.1 Secrets and Environment Separation
- **No hardcoded secrets in version control:** `appsettings.Production.json` contains empty placeholders for sensitive connection strings and JWT keys.
- **Startup Enforcement:** In non-development environments, `DependencyInjection.cs` strictly enforces that `JwtSettings:SecretKey` is at least 256 bits (32 bytes) and rejects development default secrets with an `InvalidOperationException`.
- **CORS Configuration:** Production CORS policy does not allow wildcard `*`. It restricts access to the trusted frontend domain (e.g. `https://dealzone.vercel.app`).
- **Swagger / OpenAPI:** Disabled by default in production (`Swagger:Enabled: false`). Can be temporarily enabled via environment variable if testing is needed.

### 3.2 File Storage
- Document verification uploads are saved to `private-storage/verification-documents/`.
- In IIS, this folder will reside in the virtual directory on MonsterASP. Write permissions must be granted to the IIS Application Pool identity.

---

## 4. Required Project Owner Actions (Checklist)

1. **MonsterASP.NET Account & Web Site Creation:**
   - Create a website (e.g. `dealzone-api.monsterasp.net`).
   - In Website Configuration, set ASP.NET Version to **.NET 10.0 (or .NET Core)**.
   - Note FTP or Web Deploy credentials from the control panel.

2. **MonsterASP.NET SQL Server Database Creation:**
   - Create a new MSSQL Database (e.g. `dealzone_prod_db`).
   - Note Server Name, Database Name, User ID, and Password.
   - Run `DealZone_Full_Idempotent_Migrations.sql` in SSMS against this database.

3. **Backend Environment Variables on MonsterASP.NET:**
   In the MonsterASP control panel (under Application Settings or `web.config`):
   - `ConnectionStrings__DefaultConnection`: `<MonsterASP_SQL_Connection_String>`
   - `JwtSettings__SecretKey`: `<Generate-A-Secure-Random-64-Character-String>`
   - `CorsSettings__AllowedOrigins__0`: `https://your-dealzone-app.vercel.app`

4. **Vercel Project Setup:**
   - Import the GitHub repository `Dev-Mazen/DealZone`.
   - Set Root Directory to `frontend`.
   - Add Environment Variable: `VITE_API_BASE_URL` = `https://<your-monsterasp-domain>/api/v1`
   - Deploy.
