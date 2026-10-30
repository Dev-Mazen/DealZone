# DealZone — Backend Technical Readiness & Architecture Guide

> **Document Version:** 1.0  
> **Target Audience:** Engineering Leads, DevOps, System Architects, Backend and Frontend Integrators  
> **Scope:** DealZone Backend Web API (Phases 0–9 Complete & Verified)  
> **Status:** Ready for Frontend Integration (not yet cleared for public production deployment — see [Section 9](#9-pre-production-checklist--hardening-backlog))  
> **Verification Date:** 2026-10-30  

---

## 1. Architecture & Design Principles

DealZone is designed as a **Modular Monolith** adhering to the principles of **Clean Architecture** and **Domain-Driven Design (DDD)**. The system enforces strict architectural layers and unidirectional dependency boundaries.

### Project Structure & Layer Dependencies
```
DealZone.sln
├── src/
│   ├── DealZone.Domain/          # Enterprise business logic, entities, value objects, domain enums, exceptions
│   ├── DealZone.Application/     # Application use cases, DTOs, interfaces (ICurrentUser, IEmailService), validators
│   ├── DealZone.Infrastructure/  # EF Core SQL Server DbContext, entity configurations, migrations, external adapters
│   └── DealZone.Api/             # ASP.NET Core presentation layer, controllers, middleware, ProblemDetails, OpenAPI
├── tests/
│   ├── DealZone.UnitTests/       # Domain and application layer isolated unit tests (xUnit)
│   └── DealZone.IntegrationTests/# ASP.NET Core WebApplicationFactory end-to-end integration tests (xUnit + SQL Server)
└── docs/                         # Handover documentation, specifications, and SQL review scripts
    ├── API_HANDOVER.md           # Frontend developer API handover guide
    ├── BACKEND_READINESS.md      # Backend technical readiness & architecture specification
    └── migrations/               # Idempotent SQL Server review scripts
```

### Dependency Direction Rules
1. `DealZone.Domain` has **zero dependencies** on external libraries, database engines, or other solution projects.
2. `DealZone.Application` references **only** `DealZone.Domain`. It contains use cases, interfaces, DTOs, and FluentValidation rules. It never references Infrastructure or Api.
3. `DealZone.Infrastructure` references `DealZone.Application` and `DealZone.Domain`. It implements persistence (`DealZoneDbContext`), security services (`AuthService`, `JwtTokenGenerator`), storage (`LocalFileStorageService`), and email adapters (`SmtpEmailService`, `DevelopmentEmailService`).
4. `DealZone.Api` references `DealZone.Application` and `DealZone.Infrastructure` strictly for Dependency Injection registration. Controllers are thin entry points that delegate directly to application services.

### Core Architecture Enforcements
- **No Generic Repositories:** Direct DbContext and targeted service orchestrations are used to prevent unnecessary repository abstractions.
- **Tenant Isolation:** Enforced on every database query and command via `ICurrentUser.CompanyId`. Private legal tax records (`CompanyContactDetails`) are strictly segregated from public queries.
- **Optimistic Concurrency:** All commercial entities (`Company`, `Rfq`, `Offer`, `Deal`, `Shipment`) declare `byte[] RowVersion` concurrency tokens (`IsRowVersion()`) mapped to SQL Server `ROWVERSION` columns.
- **Database Race Protection:** Filtered unique database indexes eliminate concurrency races in offer acceptance and deal creation.

---

## 2. Technology Stack & Dependencies

All dependencies use standard, current enterprise-grade packages targeting **.NET 10**:

| Component | Technology | Exact Version | Purpose |
|---|---|---|---|
| **Target Framework** | .NET 10 | `net10.0` | Runtime and SDK |
| **API Framework** | ASP.NET Core Web API | `10.0.3` (In-box) | Controller-based RESTful API |
| **Database Engine** | Microsoft SQL Server | 2019 / 2022 / Azure SQL | Relational database persistence |
| **ORM** | Entity Framework Core | `10.0.3` | SQL Server provider & migration tooling |
| **OpenAPI / Swagger** | `Microsoft.AspNetCore.OpenApi` | `10.0.9` | Built-in OpenAPI document generation |
| **OpenAPI Engine** | `Microsoft.OpenApi` | `2.7.5` | Document and operation schema transformers |
| **Swagger UI** | `Swashbuckle.AspNetCore.SwaggerUI` | `10.2.3` | Interactive API documentation UI |
| **Validation** | `FluentValidation` | `12.2.0` | Application request contract validation |
| **Logging** | `Serilog.AspNetCore` | `10.0.0` | Structured logging with console sink & enrichers |
| **JWT Authentication**| `Microsoft.AspNetCore.Authentication.JwtBearer` | `10.0.3` | Stateless Bearer token validation |
| **Password Hashing** | ASP.NET Core Identity | In-box (`IPasswordHasher<User>`) | Cryptographically salted PBKDF2 hashing |
| **Testing Engine** | `xUnit`, `Microsoft.NET.Test.Sdk` | `2.9.3` / `17.14.1` | Unit and integration test runners |
| **Test Host** | `Microsoft.AspNetCore.Mvc.Testing`| `10.0.3` | WebApplicationFactory test server |

---

## 3. Local Setup & Verification Guide

Follow these steps on Windows to configure and run the backend from source:

### 1. Prerequisites
- **.NET 10 SDK:** Install from [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/10.0). Verify via:
  ```powershell
  dotnet --version
  ```
- **Microsoft SQL Server:** Local SQL Server instance, SQL Server Express, or LocalDB running with Windows Authentication (`Trusted_Connection=True`).

### 2. Configuration Setup
The project reads settings from `src/DealZone.Api/appsettings.json` and `appsettings.Development.json`. By default, the development connection string points to:
```
Server=localhost;Database=DealZoneDb_Dev;Trusted_Connection=True;TrustServerCertificate=True;
```
If your SQL instance uses a named instance (e.g., `localhost\SQLEXPRESS`), adjust `DefaultConnection` in `src/DealZone.Api/appsettings.Development.json`.

### 3. Apply Database Migrations
Run the EF Core CLI migration tool targeting the development database:

**PowerShell:**
```powershell
dotnet ef database update --project src/DealZone.Infrastructure --startup-project src/DealZone.Api
```

**CMD:**
```cmd
dotnet ef database update --project src\DealZone.Infrastructure --startup-project src\DealZone.Api
```
*Result:* Creates the `DealZoneDb_Dev` database, generates all tables, indexes, constraints, and runs idempotent catalog seeders.

### 4. Build the Solution

**PowerShell / CMD:**
```
dotnet build DealZone.sln -p:UseSharedCompilation=false -m:1
```
*Expected Result:* 0 Errors, 0 Warnings.

### 5. Run the Test Suites
Run unit and integration tests:

**PowerShell / CMD:**
```
REM Run Unit Tests (153 tests)
dotnet test tests/DealZone.UnitTests/DealZone.UnitTests.csproj --no-build

REM Run Integration Tests (75 tests against SQL Server)
dotnet test tests/DealZone.IntegrationTests/DealZone.IntegrationTests.csproj --no-build
```
*Expected Result:* **228 passed**, 0 failed, 0 skipped.

### 6. Start the API

**PowerShell / CMD:**
```
dotnet run --project src/DealZone.Api
```
The API starts on the configured ports:
- **Swagger UI:** `http://localhost:5023/swagger` (or `https://localhost:7192/swagger`)
- **OpenAPI Schema:** `http://localhost:5023/openapi/v1.json`
- **Health Check:** `http://localhost:5023/health`

---

## 4. Configuration Reference

All application settings are managed via `IConfiguration` with hierarchical fallback.

| Key | Development Value | Production Requirement | Purpose |
|---|---|---|---|
| `ConnectionStrings:DefaultConnection` | `Server=localhost;Database=DealZoneDb_Dev;...` | Secure SQL Server Connection String | Primary database connection string |
| `JwtSettings:SecretKey` | `DealZoneEnterpriseSecretKeyForJwt...` | **MANDATORY SECRET:** Cryptographically random key $\ge 32$ bytes | HMAC-SHA256 signing secret for JWT access tokens |
| `JwtSettings:Issuer` | `DealZone.Api` | `DealZone.Api` (or custom domain) | Validated JWT token issuer |
| `JwtSettings:Audience` | `DealZone.Clients` | `DealZone.Clients` (or custom client ID) | Validated JWT token audience |
| `JwtSettings:AccessTokenExpirationMinutes`| `60` | `15` to `60` | Lifetime of stateless JWT access tokens |
| `JwtSettings:RefreshTokenExpirationDays`| `30` | `14` to `30` | Lifetime of rotated refresh tokens |
| `CorsSettings:AllowedOrigins` | `["http://localhost:3000", "http://localhost:5173"]`| Domain whitelist (e.g. `["https://dealzone.eg"]`)| Allowed origins for Cross-Origin Resource Sharing |
| `FileStorage:RootPath` | `private-storage/verification-documents` | Absolute mounted secure volume path | Filesystem directory for private verification uploads |
| `AdminSettings:SeedAdminEmail` | `""` (or dev admin email) | `""` (Disabled in production) | User email to promote to SystemAdmin upon startup |
| `SmtpSettings:Host` | `""` (Uses `DevelopmentEmailService`) | SMTP Server Hostname (e.g. `smtp.sendgrid.net`) | Outbound email relay server |
| `SmtpSettings:Port` | `587` | `587` or `465` | SMTP port |
| `SmtpSettings:Username` | `""` | SMTP Username / API Key | Authentication username for SMTP |
| `SmtpSettings:Password` | `""` | **MANDATORY SECRET:** SMTP Password | Authentication password for SMTP |
| `SmtpSettings:EnableSsl` | `true` | `true` | Enforces TLS encryption for email delivery |
| `SmtpSettings:FromEmail` | `noreply@dealzone.eg` | Verified sender email | From address in system emails |
| `SmtpSettings:FromName` | `DealZone Marketplace` | Sender display name | Friendly display name |
| `Swagger:Enabled` | `false` (Auto-enabled if dev) | Set `true` if public API docs are needed | Explicit override to enable Swagger UI in production |

> **Fail-Fast Security Validation:** In non-development environments, the backend verifies on startup that `JwtSettings:SecretKey` does **not** contain the development default string and is at least 32 bytes (256 bits). If invalid, startup halts immediately with `InvalidOperationException`.

---

## 5. Database Schema, Migrations & Concurrency

### Complete Migration History
The database schema is managed via Entity Framework Core migrations in `src/DealZone.Infrastructure/Persistence/Migrations`:

| Migration Name | Applied In Phase | Core Schema Changes |
|---|---|---|
| `20261030132349_InitialCreate` | Phase 2 | Users, CompanyMembers, Companies, CompanyContactDetails, VerificationDocuments, Categories, Rfqs, Offers, Deals, Shipments, Reviews |
| `20261030150059_AddAuthenticationAndRefreshTokens` | Phase 3 | RefreshTokens table, User email confirmation and password reset tokens |
| `20261030153545_AddCompanyVerification` | Phase 4 | VerificationDecisions audit table, Company verification state columns |
| `20261030161836_AddCatalog` | Phase 5 | UnitsOfMeasure, MaterialDefinitions, Category hierarchy relations |
| `20261030164627_AddRfqs` | Phase 6 | RfqNumber sequence, RfqItems measurement precisions, Delivery governorates |
| `20261030172535_AddOffers` | Phase 7 | Offer revisions lineage, OriginalOfferId self-referencing hierarchy |
| `20261030175024_AddDealsAndDisputes` | Phase 8 | DealDisputes table, deal confirmation timestamps, commercial terms snapshots |
| `20261030181534_AddShippingAndReviews`| Phase 8 | ShippingProviders table, ShipmentTrackingEvents table, Reviews rating constraints |
| `20261030183944_AddNotifications` | Phase 9 | Notifications table, user-level indexes, idempotency key unique index |
| `20261030194444_AddConcurrencyUniqueIndexes` | Audit | Filtered unique indexes on `Offers` (`Status = 2`) and `Deals` (`RfqId IS NOT NULL`)|

### SQL Review Scripts
Every migration has a corresponding idempotent SQL review script stored under `docs/migrations/`:
- `initial_schema.sql`
- `auth_and_tokens.sql`
- `verification_workflow.sql`
- `catalog_and_rfq.sql`
- `offers_and_negotiation.sql`
- `deals_and_disputes.sql`
- `shipping_and_reviews.sql`
- `notifications_and_integration.sql`
- `concurrency_unique_indexes.sql`

### Critical Indexes & Invariants
1. **Offer Acceptance Race Prevention:**
   `IX_Offers_RfqId_Accepted` — Unique filtered index on `Offers(RfqId) WHERE [Status] = 2` (Accepted). Eliminates race conditions where two concurrent requests could both accept offers for the same RFQ.
2. **Deal Single-Parent Guarantee:**
   `IX_Deals_RfqId` — Unique filtered index on `Deals(RfqId) WHERE [RfqId] IS NOT NULL`. Prevents duplicate deals from ever being linked to the same quotation request.
3. **Single Review Constraint:**
   `IX_Reviews_DealId_ReviewerCompanyId` — Unique composite index preventing duplicate reviews by the same party for a single deal.
4. **Notification Idempotency:**
   `IX_Notifications_IdempotencyKey` — Unique filtered index on `Notifications(IdempotencyKey) WHERE [IdempotencyKey] IS NOT NULL` preventing duplicate notification generation during retries.
5. **High-Precision Numeric Precision:**
   - Monetary values (`AgreedPrice`, `UnitPrice`, `TotalAmount`): `decimal(18, 2)`
   - Industrial raw material quantities: `decimal(18, 4)`

---

## 6. Security Architecture & Threat Mitigation

### 1. Authentication & Credentials
- **Password Storage:** Uses ASP.NET Core Identity `PasswordHasher<User>`, applying PBKDF2 with HMAC-SHA256, 128-bit per-user cryptographic salt, and 100,000 hash iterations.
- **JWT Signing:** Cryptographically signed using HMAC-SHA256 (`HmacSha256Signature`). Issuer, audience, and lifetime are validated on every request with `ClockSkew = TimeSpan.Zero`.
- **Refresh Token Security:** Refresh tokens are generated as 64-byte cryptographically secure random byte strings (`RandomNumberGenerator`). They are stored in the database exclusively as SHA-256 hashes (`SHA256.HashData`). Plaintext tokens are returned to the client once upon login and are never stored on the server.
- **Replay Attack Detection:** Refresh tokens track lineage (`ReplacedByTokenHash`). If a revoked token is presented, the backend detects a replay breach and invalidates the entire session family for that user.
- **Password Reset & Confirmation Tokens:** Generated using high-entropy random bytes, stored as SHA-256 hashes, enforce strict expiration windows (24h for confirmation, 2h for reset), and are single-use (cleared immediately upon consumption).

### 2. Authorization & Multi-Tenancy
- **No Client Tenant Blind Trust:** `ICurrentUser` resolves the authenticated caller's identity and company membership directly from claims. Controllers and application services enforce `ICurrentUser.CompanyId` on all database operations.
- **IDOR Protection:** Cross-company accesses return `404 Not Found` (to avoid information disclosure) or `403 Forbidden`.
- **Privilege Separation:** Platform administrators (`SystemAdmin`) are isolated from company roles (`Owner`, `Admin`, `ProcurementManager`, `SalesManager`, `Member`). Administrative endpoints are protected via `[Authorize(Policy = "SystemAdmin")]`.

### 3. File Upload & Storage Security
- **Path Traversal Guard:** `LocalFileStorageService` resolves physical file paths using `Path.GetFullPath` and enforces that the destination starts with the configured `_baseStorageDirectory`.
- **Validation Pipeline:** Uploaded documents are verified for:
  - Maximum size: 10 MB (`10 * 1024 * 1024` bytes).
  - Extension whitelist: `.pdf`, `.jpg`, `.jpeg`, `.png`.
  - Binary magic byte validation: verifies actual file signature (e.g. `%PDF-` for PDFs, `FF D8 FF` for JPEGs, `89 50 4E 47` for PNGs).
- **Private Storage:** Files are stored in a private directory outside the web root (`private-storage/`). Documents can only be retrieved via streaming through authenticated administrator endpoints (`DownloadDocument`).

---

## 7. Email & Notification Delivery

### Email Provider Selection
- **Development Environment (`Environments.Development`):**
  Uses `DevelopmentEmailService`, which records dispatched emails in an in-memory thread-safe collection (`ConcurrentBag<SentEmailRecord>`). Does not require SMTP credentials.
- **Production / Staging (`Environments.Production`):**
  Uses `SmtpEmailService` (`System.Net.Mail`), configured via `SmtpSettings`.
- **Fault-Tolerant Resilience:**
  All email dispatches in `SmtpEmailService` execute inside safe try-catch blocks with a 3-second timeout (`Timeout = 3000`). If the SMTP server is unreachable or fails, the error is logged as a warning and **never** causes the calling transactional business operation (such as offer acceptance or deal confirmation) to fail.

### Notification Generation
Notifications are persistent in-app records stored in the `Notifications` table. Application services emit notifications during significant business milestones (RFQ publication, offer submission/acceptance/rejection, deal confirmations, dispute actions, and shipment tracking updates).

---

## 8. Test Suite Verification

The repository contains two dedicated test projects with comprehensive coverage:

### 1. Unit Tests (`tests/DealZone.UnitTests`)
- **Total:** **153 Tests** (100% Pass)
- **Scope:** Domain entity rules, state transition invariants, FluentValidation rules, password validation, and token generator cryptographic logic.
- **Execution Time:** ~230 ms.

### 2. Integration Tests (`tests/DealZone.IntegrationTests`)
- **Total:** **75 Tests** (100% Pass)
- **Scope:** Full ASP.NET Core request pipeline tests using `WebApplicationFactory<Program>`:
  - Authentication lifecycle (register, confirm, login, refresh rotation, replay detection, logout, password reset).
  - Company onboarding and contact details privacy segregation.
  - Verification document upload, magic byte enforcement, and path traversal protection.
  - Admin verification workflows (approve, reject, request changes).
  - Catalog filtering, hierarchical trees, and bilingual queries.
  - RFQ draft, publish, discovery, and closing.
  - Offer bidding, revision histories, and acceptance race conditions.
  - Deal state machine, mutual confirmations, cancellations, and dispute arbitration.
  - Shipping arrangements, provider administration, and tracking timeline.
  - Post-deal review constraints and company reputation stats.
  - In-app notification creation, unread counts, and idempotency key uniqueness.
  - Error handling, RFC 7807 ProblemDetails mapping, trace ID propagation, and production detail sanitization.
  - Swagger UI and OpenAPI v1 endpoint contract verification.
- **Execution Time:** ~1 min 20 s (running against isolated live SQL Server test instances).

---

## 9. Pre-Production Checklist & Hardening Backlog

Before deploying DealZone to a public production environment, review the following checklist:

### Mandatory Pre-Production Tasks
- [ ] **Configure Production JWT Secret:** Set `JwtSettings:SecretKey` to a cryptographically secure 256-bit+ random string via environment variable or secret manager.
- [ ] **Configure Production Database:** Set `ConnectionStrings:DefaultConnection` to the production SQL Server instance and run `dotnet ef database update`.
- [ ] **Configure SMTP Credentials:** Set `SmtpSettings:Host`, `Username`, `Password`, and `Port` for production email dispatch.
- [ ] **Configure Production CORS:** Set `CorsSettings:AllowedOrigins` to the exact public frontend domain (e.g. `["https://app.dealzone.eg"]`).
- [ ] **Configure Private Storage Volume:** Mount a persistent private volume and set `FileStorage:RootPath`.
- [ ] **Enforce HTTPS:** Deploy behind a reverse proxy (e.g. Nginx, Azure App Service, Cloudflare) terminating TLS 1.3 with automatic HTTP-to-HTTPS redirection.

### Recommended Hardening Backlog (P2 / P3)
1. **Authentication Rate Limiting (P2):** Add ASP.NET Core `Microsoft.AspNetCore.RateLimiting` middleware to `/api/v1/auth/login` and `/api/v1/auth/register` (e.g. 5 requests per minute per IP) to mitigate brute-force attacks.
2. **Strict HTTPS Metadata (P2):** Configure `RequireHttpsMetadata = !environment.IsDevelopment()` in JWT bearer options.
3. **Database Sequence for RFQ Numbers (P2):** Replace `CountAsync + 1` with a SQL Server `SEQUENCE` (`CREATE SEQUENCE RfqNumberSeq`) to eliminate duplicate number risk under concurrent insertion (note: SQL `SEQUENCE` guarantees uniqueness and monotonicity but not gaplessness — gaps may occur from rolled-back transactions).
4. **Asynchronous Background Email Queue (P2):** Transition SMTP dispatch from inline execution to an asynchronous background worker using `System.Threading.Channels.Channel<T>` and `IHostedService`.
5. **Periodic Token & Notification Purge (P3):** Implement a daily scheduled job to purge revoked refresh tokens and read notifications older than 90 days.

---

## 10. Production Deployment Architecture

The DealZone backend is stateless (outside of the SQL Server database and mounted file storage volume) and container-ready.

```mermaid
graph TD
    Client["Frontend App (React / Next.js / Mobile)"] -->|HTTPS / WSS| CDN["CDN / Cloudflare (WAF & DDoS Protection)"]
    CDN -->|TLS Termination| Ingress["Reverse Proxy (Nginx / Cloud Load Balancer)"]
    Ingress -->|HTTP /api/v1/*| API["DealZone Web API (.NET 10 Kestrel)"]
    API -->|Port 1433 (Encrypted)| SQL[("Microsoft SQL Server (AlwaysOn / Azure SQL)")]
    API -->|Read/Write File Streams| Storage[("Mounted Private File Storage Volume")]
    API -->|Port 587 (TLS)| SMTP["SMTP Relay (SendGrid / Postmark / Mailgun)"]
```

### Health Monitoring
- Public liveness probe: `GET /health` (returns `{"status": "Healthy"}`).
- API-versioned probe: `GET /api/v1/health`.
- Serilog console output format is structured JSON / log context ready for ingestion into Datadog, Grafana Loki, or Azure Application Insights.

