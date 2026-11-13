# DealZone — Egyptian B2B Industrial Raw-Material Marketplace

DealZone is an enterprise-grade digital procurement platform and marketplace tailored for Egyptian manufacturers, industrial raw-material suppliers, and mills. It bridges the gap between verified factories and certified suppliers through streamlined direct purchasing, structured price negotiations, competitive RFQ tenders, and transparent commercial deal tracking.

---

## Architecture & Technology Stack

```
+-----------------------------------------------------------------------------------+
|                                  DEALZONE PLATFORM                                |
+-----------------------------------------------------------------------------------+
|  FRONTEND (Vercel)                                                                |
|  - React 19, Vite 8, Tailwind CSS 4, shadcn/ui, Motion, Lucide Icons              |
|  - Zustand, TanStack Query v5, Axios with Token Auto-Refresh Interceptor          |
|  - Full Arabic (RTL) & English (LTR) Localization with i18next                    |
+-----------------------------------------------------------------------------------+
                                         |
                                         | RESTful JSON APIs (HTTPS)
                                         v
+-----------------------------------------------------------------------------------+
|  BACKEND WEB API (MonsterASP.NET / IIS)                                           |
|  - .NET 10.0, ASP.NET Core Web API, C# Clean Architecture                         |
|  - Domain-Driven Design (Domain -> Application -> Infrastructure -> Api)         |
|  - Entity Framework Core 10, MS SQL Server, Concurrency Tokens                    |
|  - JWT Bearer Authentication, Granular RBAC Permissions                          |
|  - Rate Limiting, Centralized ProblemDetails, Serilog Structured Logging           |
+-----------------------------------------------------------------------------------+
                                         |
                                         | ADO.NET / Port 1433
                                         v
+-----------------------------------------------------------------------------------+
|  DATABASE (Microsoft SQL Server)                                                  |
|  - 17 Versioned EF Core Migrations (Idempotent Deployments)                      |
|  - Restricted to 3 Major Industrial Sectors: Textiles, Food, Metals              |
+-----------------------------------------------------------------------------------+
```

---

## Core Business Capabilities

1. **Marketplace Direct Purchasing ("Buy Now"):**
   - Verified buyers purchase fixed-price materials and products directly with trusted server-side total calculations.
   - Automatically issues a commercial `Deal` in `AwaitingConfirmation`.
2. **Structured Product Negotiations ("Make an Offer"):**
   - Direct price proposal and counter-offer negotiation engine between buyers and suppliers.
   - Multi-round revision timeline with atomic deal generation upon terms acceptance.
3. **Consolidated Procurement RFQs:**
   - Unified procurement bidding engine with sealed-bid privacy, multi-item line quotes, downward-only revisions, and official contract awards.
4. **Supplier Product Management:**
   - Dedicated portal for suppliers to publish custom raw materials with either Fixed or Negotiable pricing.
5. **Egyptian Industrial Compliance:**
   - Strict 3-category taxonomy: **منسوجات (Textiles)**, **أغذية (Food)**, and **معادن (Metals)**.
   - Company verification workflow adhering to Egyptian commercial registry requirements.

---

## Repository Structure

```
DealZone/
├── backend/
│   ├── src/
│   │   ├── DealZone.Domain/          # Core entities, enums, domain rules
│   │   ├── DealZone.Application/     # DTOs, interfaces, FluentValidation validators
│   │   ├── DealZone.Infrastructure/  # EF Core DbContext, migrations, services, background jobs
│   │   └── DealZone.Api/             # Controllers, middleware, rate-limiting, web.config
│   └── tests/
│       ├── DealZone.UnitTests/       # 226 xUnit unit test suites
│       └── DealZone.IntegrationTests/# 108 Testcontainers SQL Server integration test suites
├── frontend/
│   ├── src/                          # React components, pages, hooks, state stores
│   ├── public/                       # Static branding assets & icons
│   ├── vercel.json                   # Vercel SPA routing rewrite rules
│   └── vite.config.js                # Vite build configuration
├── DEPLOYMENT_READINESS_REPORT.md     # Pre-flight deployment audit report
├── DEPLOYMENT_GUIDE.md                # Comprehensive deployment walkthrough
├── MONSTERASP_DEPLOYMENT.md           # MonsterASP.NET IIS configuration guide
├── VERCEL_DEPLOYMENT.md               # Vercel deployment instructions
└── DATABASE_DEPLOYMENT.md             # SQL Server SSMS migration execution guide
```

---

## Getting Started Locally

### Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com)
- [Node.js 20+](https://nodejs.org)
- [Microsoft SQL Server](https://www.microsoft.com/sql-server) or Docker

### 1. Backend Setup
```bash
cd backend/src/DealZone.Api
dotnet run
```
API runs locally on `http://localhost:5023`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs locally on `http://localhost:5173`.

### 3. Running Test Suites
```bash
# Unit Tests
dotnet test backend/tests/DealZone.UnitTests/DealZone.UnitTests.csproj

# Integration Tests (Requires Docker for Testcontainers)
dotnet test backend/tests/DealZone.IntegrationTests/DealZone.IntegrationTests.csproj

# Frontend Tests
npm --prefix frontend test
```

---

## Deployment Guides

Detailed, project-specific deployment documentation is available in the repository root:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) — Master deployment walkthrough
- [MONSTERASP_DEPLOYMENT.md](MONSTERASP_DEPLOYMENT.md) — Windows / IIS hosting on MonsterASP.NET
- [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) — Vercel SPA frontend deployment
- [DATABASE_DEPLOYMENT.md](DATABASE_DEPLOYMENT.md) — SQL Server idempotent schema migration guide
- [DEPLOYMENT_READINESS_REPORT.md](DEPLOYMENT_READINESS_REPORT.md) — Deployment audit and readiness status

---

## License
Proprietary — All rights reserved © 2026 DealZone.
