# AGENTS.md - DealZone Engineering & Architecture Guide for AI Agents

## 1. Project Identity & Context
- **Name:** DealZone
- **Domain:** Egyptian B2B industrial raw-material marketplace.
- **Scope:** Backend-only Web API. Developed independently and handed over to a separate frontend developer.
- **Current Status:** Phase 9 (Notifications & Final Integration implemented and verified). All backend phases complete.

---

## 2. Technology Constraints & Stack
- **Language & Runtime:** C# / .NET 10 (Target Framework: `net10.0`)
- **API Framework:** ASP.NET Core Web API (Controllers-based, OpenAPI support)
- **Database:** Microsoft SQL Server
- **ORM:** Entity Framework Core (using SQL Server provider)
- **Architecture Pattern:** Clean Architecture within a Modular Monolith
- **Logging:** Serilog (structured console logging, correlation context)
- **Validation:** FluentValidation
- **Testing:** xUnit, Microsoft.NET.Test.Sdk, Microsoft.AspNetCore.Mvc.Testing
- **Version Control:** Git
- **Strictly Prohibited:**
  - No frontend / UI code (no React, Angular, Vue, Blazor, HTML/JS clients).
  - No alternative database engines (no PostgreSQL, SQLite, MySQL, MongoDB).
  - No external DB administration tools or containers unless explicitly requested (no DBeaver, no Docker requirement).
  - No speculative, unnecessary infrastructure or third-party dependencies.

---

## 3. Architecture Rules
1. **Dependency Direction (Clean Architecture):**
   - `DealZone.Domain` has NO dependencies on any project or external database libraries.
   - `DealZone.Application` depends ONLY on `DealZone.Domain`. It must NEVER reference `DealZone.Infrastructure` or `DealZone.Api`.
   - `DealZone.Infrastructure` depends on `DealZone.Application` and `DealZone.Domain`. It implements persistence, EF Core DbContext, and external interfaces defined in Application.
   - `DealZone.Api` depends on `DealZone.Application` and `DealZone.Infrastructure` (solely for dependency injection / service composition).
2. **Api Layer Responsibilities:**
   - Controllers must inherit from `ApiControllerBase` (`/api/v1/[controller]`) and remain thin entry points.
   - NO business logic in controllers.
   - Never expose EF Core entities directly through API endpoints.
   - Always expose DTOs (Data Transfer Objects) for request contracts and response contracts.
   - Centralized exception handling via `GlobalExceptionHandler` mapping exceptions to standard RFC 7807 ProblemDetails responses (`application/problem+json`).
3. **Domain & Application Boundaries:**
   - Business entities, value objects, domain exceptions (`DomainException`, `NotFoundException`, `ConflictException`, etc.), and domain events belong in `DealZone.Domain`.
   - Use cases, DTO definitions, application interfaces (`ICurrentUser`, `IDateTimeProvider`), and orchestrations belong in `DealZone.Application`.
   - Validation is implemented with FluentValidation; validation errors throw `ValidationException` resulting in standard 400 ProblemDetails responses with field error lists.
4. **Data Isolation & Multi-Tenancy / Security:**
   - Server-enforced authorization and company-level data isolation must be guaranteed on every query and mutation via `ICurrentUser.CompanyId`.
   - Private company contact details (`CompanyContactDetails`) must remain private and never be selected in public marketplace queries.
   - Never trust client-provided tenant or company identifiers blindly without validation against server-authenticated context.
5. **Simplicity & Anti-Patterns:**
   - Avoid unnecessary abstractions and speculative overengineering.
   - Do NOT create a generic repository (`IRepository<T>`) without a concrete justification. Prefer explicit repositories or direct DbContext usage via application interfaces where appropriate.

---

## 4. Coding Conventions
- **Language Features:** Nullable Reference Types (`<Nullable>enable</Nullable>`) and Implicit Usings (`<ImplicitUsings>enable</ImplicitUsings>`) must remain enabled across all projects.
- **Naming Conventions:**
  - PascalCase for classes, records, interfaces, methods, and public properties.
  - Prefix interfaces with `I` (e.g., `ICurrentUser`, `IDateTimeProvider`).
  - camelCase with leading underscore for private fields (e.g., `_logger`, `_context`).
- **Async Programming:** Use async/await end-to-end with `CancellationToken` support on I/O-bound operations.
- **Error Handling:** Standardized error responses using ProblemDetails (RFC 7807) format.

---

## 5. Security Expectations
- Enforce strict authentication and role/permission-based authorization on protected endpoints.
- Enforce company-level / tenant-level boundary checks on all entity interactions.
- Avoid exposing database internals, stack traces, or raw exception details in API responses.
- Store no secrets or credentials in repository files or configuration files.

---

## 6. Phase Governance & Operational Rules
- **No Unapproved Business Features:** Do not implement authentication, company onboarding API endpoints, RFQ workflows, offers, deals, or transactions until explicitly scheduled in subsequent phases.
- **Database Migrations:** Maintain migrations in `DealZone.Infrastructure/Persistence/Migrations` and SQL review scripts in `docs/migrations/`.
- **No Deployment Assumptions:** Do not make deployment or cloud hosting decisions.
- **Git Operations:**
  - Do NOT commit or push to GitHub without explicit user approval.
  - Maintain a clean working directory conforming to the designated solution structure.
- **Phase Boundary:** Complete only the tasks assigned to the current phase and stop for user review and approval before proceeding.
