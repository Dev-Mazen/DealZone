# DealZone — Production Deployment & Operational Runbook

> **Version:** 1.0 (Production Release)  
> **Target Environment:** Linux / Docker / Kubernetes / Azure App Service / AWS ECS  
> **Backend Runtime:** .NET 10.0 (ASP.NET Core)  
> **Database:** Microsoft SQL Server 2022+  
> **Frontend:** Static SPA (Vite / React 18) hosted on Nginx / Cloudflare Pages / AWS S3 + CloudFront  

---

## 1. Required Environment Variables

All sensitive values must be injected securely at runtime via environment variables, Kubernetes Secrets, Azure Key Vault, or AWS Secrets Manager. **Never commit secrets to source code or container images.**

### 1.1 Backend Configuration (`DealZone.Api`)

| Environment Variable | Required | Description | Example / Recommended Value |
|---|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | Yes | Hosting environment | `Production` |
| `ConnectionStrings__DefaultConnection` | Yes | SQL Server connection string | `Server=sql.prod.dealzone.internal;Database=DealZoneDb_Prod;User Id=dz_app;Password=<STRONG_SECRET>;TrustServerCertificate=False;Encrypt=True;` |
| `JwtSettings__SecretKey` | Yes | Cryptographic HMAC-SHA256 signing key (min 32 bytes / 256 bits) | `<GENERATE_64_CHAR_HEX_OR_BASE64_KEY>` |
| `JwtSettings__Issuer` | Yes | JWT issuer | `DealZone.Api` |
| `JwtSettings__Audience` | Yes | JWT audience | `DealZone.Clients` |
| `JwtSettings__AccessTokenExpirationMinutes` | No | Access token lifespan | `60` |
| `JwtSettings__RefreshTokenExpirationDays` | No | Refresh token lifespan | `30` |
| `CorsSettings__AllowedOrigins__0` | Yes | Trusted frontend production origin | `https://dealzone.eg` |
| `CorsSettings__AllowedOrigins__1` | No | Additional frontend origin | `https://www.dealzone.eg` |
| `FileStorage__RootPath` | Yes | Persistent volume mount path outside webroot | `/var/data/dealzone/verification-docs` (Linux) or `D:\DealZoneData\docs` (Windows) |
| `SmtpSettings__Host` | Yes | Production SMTP server host | `smtp.sendgrid.net` / `email-smtp.eu-west-1.amazonaws.com` |
| `SmtpSettings__Port` | Yes | SMTP TLS port | `587` |
| `SmtpSettings__Username` | Yes | SMTP authentication username | `apikey` |
| `SmtpSettings__Password` | Yes | SMTP authentication password/token | `<STRONG_SMTP_KEY>` |
| `SmtpSettings__EnableSsl` | No | Enable TLS/SSL encryption | `true` |
| `SmtpSettings__FromEmail` | Yes | Official platform transactional sender | `noreply@dealzone.eg` |
| `SmtpSettings__FromName` | No | Display sender name | `DealZone Marketplace` |
| `SmtpSettings__FrontendBaseUrl` | Yes | Base URL used in confirmation & password links | `https://dealzone.eg` |
| `RateLimiting__Enabled` | No | Enable authentication rate limiting | `true` |
| `RateLimiting__LoginPermitLimit` | No | Max login requests per IP per minute | `5` |
| `RateLimiting__RegisterPermitLimit` | No | Max register requests per IP per minute | `3` |
| `RateLimiting__PasswordResetPermitLimit` | No | Max password resets per IP per minute | `3` |
| `RateLimiting__WindowSeconds` | No | Rate limit window in seconds | `60` |
| `BackgroundJobs__EnableOfferExpiryJob` | No | Enable automated offer expiry worker | `true` |
| `BackgroundJobs__OfferExpiryIntervalSeconds` | No | Expiry check frequency | `60` |
| `BackgroundJobs__OfferExpiryBatchSize` | No | Batch size per expiry sweep | `50` |
| `BackgroundJobs__EnableTokenCleanupJob` | No | Enable refresh token purge worker | `true` |
| `BackgroundJobs__TokenCleanupIntervalHours` | No | Purge run frequency | `24` |
| `Swagger__Enabled` | No | Enable Swagger in production | `false` |

### 1.2 Frontend Configuration (`frontend`)

| Environment Variable | Required | Description | Example Value |
|---|---|---|---|
| `VITE_API_BASE_URL` | No | Backend API origin. If omitted in production build, defaults to `/api/v1` (ideal for same-domain or reverse-proxy routing) | `https://api.dealzone.eg/api/v1` |

---

## 2. Database Setup & Migration Procedure

### 2.1 Strategy: Idempotent Migration Script
In production environments, running automated migrations on app startup is dangerous due to potential permission elevation, concurrency locks during multi-instance rollout, and lack of DBA audit trail.

An idempotent, non-destructive SQL script has been generated for DealZone:
```
backend/deploy/migrate-production.sql
```

### 2.2 Execution Steps
1. **Take a full pre-deployment backup:**
   ```sql
   BACKUP DATABASE [DealZoneDb_Prod]
   TO DISK = '/var/opt/mssql/backups/DealZoneDb_Prod_PreDeploy.bak'
   WITH FORMAT, COMPRESSION, STATS = 10;
   ```
2. **Apply the migration script via SQLCMD / Azure Data Studio / SSMS:**
   ```bash
   sqlcmd -S sql.prod.dealzone.internal -d DealZoneDb_Prod -U dz_dba -P "$DBA_PASSWORD" -i backend/deploy/migrate-production.sql
   ```
3. **Verify applied migrations:**
   ```sql
   SELECT [MigrationId], [ProductVersion] FROM [__EFMigrationsHistory] ORDER BY [MigrationId];
   ```
   *Expected latest migration:* `20261109235010_AddOfferWithdrawalAndRfqSequence`.

---

## 3. Persistent File Storage Setup

Verification documents (Commercial Registration and Tax Cards) contain sensitive company data and must remain private and unexposed to public web traffic.

### 3.1 Architecture
- Documents are saved using `IFileStorageService` (`LocalFileStorageService`).
- Files are placed strictly inside `FileStorage:RootPath`, outside the application wwwroot.
- Access to files is mediated by authorized endpoints (`GET /api/v1/companies/me/verification-documents/{id}/download` and Admin review endpoints) which stream files using authorized `ICurrentUser` checks.
- Files cannot be accessed directly via static file serving.

### 3.2 Host Configuration
1. **Docker / Kubernetes volume mount:**
   ```yaml
   volumeMounts:
     - name: verification-docs-storage
       mountPath: /var/data/dealzone/verification-docs
   ```
2. **Permissions:**
   Ensure the ASP.NET Core process user (`appuser` or `UID 1000`) has read/write permissions:
   ```bash
   chown -R 1000:1000 /var/data/dealzone/verification-docs
   chmod -R 750 /var/data/dealzone/verification-docs
   ```
3. **Storage Health Check:**
   The API exposes a storage health check at `/health` (`file-storage`) which verifies write/read permissions continuously.

---

## 4. Reverse Proxy & HTTPS Configuration

The API must always run behind a TLS-terminating reverse proxy (Nginx, Caddy, Cloudflare, AWS ALB, or Azure Front Door).

### 4.1 Sample Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name api.dealzone.eg;

    ssl_certificate /etc/letsencrypt/live/api.dealzone.eg/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.dealzone.eg/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 12M; # Accommodates 10 MB document uploads

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The application's `app.UseForwardedHeaders()` middleware reads `X-Forwarded-For` and `X-Forwarded-Proto` to preserve real client IPs for authentication rate limiting and audit logs.

---

## 5. Health Checks & Observability

### 5.1 Health Endpoints
- `GET /health` or `GET /api/v1/health`
- Returns HTTP 200 `Healthy` or HTTP 503 `Unhealthy` with RFC 7807 problem details.
- Sample output:
  ```json
  {
    "status": "Healthy",
    "duration": 4.12,
    "checks": [
      {
        "name": "database",
        "status": "Healthy",
        "description": "Database connection is healthy.",
        "duration": 2.15
      },
      {
        "name": "file-storage",
        "status": "Healthy",
        "description": "Storage root '/var/data/dealzone/verification-docs' is accessible and writable.",
        "duration": 1.28
      }
    ]
  }
  ```

### 5.2 Logging
- Configured via Serilog to output structured logs.
- Sensitive credentials, JWT secrets, passwords, and tokens are never logged.
- Failed authentication attempts, authorization violations, and rate-limit violations are logged with client IP and request trace ID.

---

## 6. Pre-Deployment Verification Checklist

Before opening the platform to commercial Egyptian users:

- [ ] `ASPNETCORE_ENVIRONMENT` is set to `Production`.
- [ ] `JwtSettings:SecretKey` is generated using a secure random generator (min 256 bits) and injected via secret store.
- [ ] Database backup taken and `migrate-production.sql` applied.
- [ ] Persistent storage volume mounted with appropriate filesystem permissions.
- [ ] `SmtpSettings` configured with valid credentials; test email confirmation delivered.
- [ ] Production CORS configured with explicit allowed frontend domain(s) (no wildcards).
- [ ] Rate limiting is active on `/api/v1/auth/*`.
- [ ] Security headers verified (`X-Content-Type-Options`, `X-Frame-Options`, `CSP`, `Referrer-Policy`).
- [ ] `/health` returns 200 OK with `database` and `file-storage` checks `Healthy`.
- [ ] Frontend built using `npx vite build` without development URLs.
- [ ] Swagger disabled (`Swagger:Enabled: false`).

---

## 7. Rollback Considerations

1. **Application Rollback:** Revert container image to the previous release tag.
2. **Database Rollback:**
   - All migrations applied in Phases A–D are non-destructive (adding tables, sequences, columns).
   - Reverting the application to an earlier build does not break database queries because added columns (`WithdrawalReason`, `WithdrawnAtUtc`) are nullable.
   - If a full schema rollback is necessary, restore from the pre-deployment backup created in Step 2.2.
