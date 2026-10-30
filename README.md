# DealZone Backend

DealZone is an Egyptian B2B marketplace platform for industrial raw materials. This repository contains the backend Web API, built with .NET 10 following Clean Architecture and Modular Monolith principles.

## Architecture

The solution adheres to Clean Architecture with strict dependency boundaries:

```
DealZone.sln
├── src/
│   ├── DealZone.Domain/          # Core domain models, enums, exceptions, and business invariants
│   ├── DealZone.Application/     # Use cases, interfaces (ICurrentUser, IDateTimeProvider), validation, and DTOs
│   ├── DealZone.Infrastructure/  # EF Core SQL Server DbContext, entity configurations, migrations, and adapters
│   └── DealZone.Api/             # Web API controllers, middleware, Serilog logging, and error handling
├── tests/
│   ├── DealZone.UnitTests/       # Domain and application unit tests
│   └── DealZone.IntegrationTests/# Web API pipeline, model metadata, and EF Core configuration tests
└── docs/                         # Architecture documentation, specs, and SQL migration scripts
    ├── database_design.md        # Complete database schema and relationships specification
    └── migrations/
        └── initial_schema.sql    # Idempotent SQL Server review script
```

### Dependency Rules
- `DealZone.Domain` has no dependencies on other projects.
- `DealZone.Application` references `DealZone.Domain`.
- `DealZone.Infrastructure` references `DealZone.Application` and `DealZone.Domain`.
- `DealZone.Api` references `DealZone.Application` and `DealZone.Infrastructure`.
- `DealZone.UnitTests` references `DealZone.Domain` and `DealZone.Application`.
- `DealZone.IntegrationTests` references `DealZone.Api`.

## Technical Foundation (Phase 1)

- **API Routing**: Standard route prefix `/api/v1/[controller]` via `ApiControllerBase`.
- **Health Checks**:
  - `GET /health`: System health status.
  - `GET /api/v1/health`: API version-prefixed health check.
- **Centralized Error Handling**:
  - RFC 7807 ProblemDetails format (`application/problem+json`).
  - Automatic status code mapping (`ValidationException` -> 400, `UnauthorizedException` -> 401, `ForbiddenException` -> 403, `NotFoundException` -> 404, `ConflictException` -> 409).
  - Trace ID (`traceId`) included on all error responses.
  - Production sanitization: Internal server error details and stack traces are suppressed in non-development environments.
- **Logging**: Serilog structured logging configured with console sink, log context enrichment, and HTTP request logging.
- **Validation**: FluentValidation configured in the Application layer with standard `ValidationException` error dictionary mapping.
- **CORS**: Configured via application configuration (`CorsSettings:AllowedOrigins`), avoiding hardcoded origins.

## Database Foundation (Phase 2)

- **Database Engine**: Microsoft SQL Server with EF Core 10.
- **B2B Industrial Domain Entities**:
  - `Users` & `CompanyMembers`: Multi-user company governance with granular roles (Owner, Admin, Procurement, Sales, Member).
  - `Companies` & `CompanyContactDetails`: Unified buyer/supplier model with strict privacy separation for corporate legal tax and contact details.
  - `VerificationDocuments`: Admin-verified compliance artifacts for commercial qualification.
  - `MaterialCategories`: Hierarchical catalog with native Arabic and English bilingual taxonomy.
  - `Rfqs` & `RfqItems`: Structured quotation requests with high-precision raw material measurements (`decimal(18, 4)`).
  - `Offers` & `OfferItems`: Structured price/spec quotations with revision history lineage (`OriginalOfferId`, `RevisionNumber`).
  - `Deals` & `DealDisputes`: Binding transactions resulting from accepted offers, with dispute arbitration states.
  - `ShippingProviders` & `Shipments`: Logistics fulfillment tracking with Supplier or DealZone arrangements.
  - `Reviews`: Verified post-deal ratings and reviews with duplicate prevention (`DealId`, `ReviewerCompanyId`).
- **Data Integrity & Concurrency**:
  - High-precision bulk unit measurements (`decimal(18, 4)`) and monetary precision (`decimal(18, 2)` in EGP).
  - RowVersion concurrency tokens on commercial entities (`Company`, `Rfq`, `Offer`, `Deal`, `Shipment`).
  - Automated audit timestamps (`CreatedAtUtc`, `LastModifiedAtUtc`) and soft-deletion (`IsDeleted`) with global query filters.
- **Initial Migration & SQL Script**:
  - EF Core migration: `InitialCreate` in `DealZone.Infrastructure/Persistence/Migrations`.
  - Idempotent SQL Server review script: `docs/migrations/initial_schema.sql`.

## Authentication & Company Accounts (Phase 3)

- **Authentication Architecture**:
  - ASP.NET Core Identity password hashing (`IPasswordHasher<User>`).
  - Cryptographically signed JWT access tokens with validated issuer, audience, and lifetime.
  - Cryptographically random refresh tokens stored as SHA-256 hashes with automatic rotation and revocation.
  - Refresh-token replay attack detection with session lineage invalidation.
  - Email confirmation workflow required before normal commercial access.
  - Time-limited, single-use password reset tokens with immediate active token revocation.
- **Authentication Endpoints (`/api/v1/auth`)**:
  - `POST /api/v1/auth/register`: Register new user, dispatch confirmation email.
  - `POST /api/v1/auth/confirm-email`: Confirm user email using dispatched token.
  - `POST /api/v1/auth/resend-confirmation`: Resend confirmation token.
  - `POST /api/v1/auth/login`: Authenticate verified credentials and return JWT & refresh token.
  - `POST /api/v1/auth/refresh`: Exchange refresh token for a newly rotated token pair.
  - `POST /api/v1/auth/logout`: Revoke active session tokens.
  - `POST /api/v1/auth/forgot-password`: Dispatch password reset token.
  - `POST /api/v1/auth/reset-password`: Single-use reset of password using token.
  - `GET /api/v1/auth/me`: Authenticated user profile, company details, and role.
- **Company Profile Endpoints (`/api/v1/companies`)**:
  - `POST /api/v1/companies`: Register company profile (creator automatically assigned as `Owner`).
  - `GET /api/v1/companies/me`: Public company profile (returns public fields; never leaks private tax/contact info).
  - `PUT /api/v1/companies/me`: Update permitted public company fields (Owner/Admin only).
  - `GET /api/v1/companies/me/contact-details`: Restricted endpoint for private corporate contact & tax details.
- **EF Core Migration & Script**:
  - Migration: `20261030150059_AddAuthenticationAndRefreshTokens`.
  - Review script: `docs/migrations/auth_and_tokens.sql`.

## Company Verification & Admin Management (Phase 4)

- **Admin Identity and Authorization**:
  - System-level administrator authorization separated strictly from `CompanyRole`. Company owners and members never inherit administrative rights.
  - Authorization policy `SystemAdmin` enforces `ClaimTypes.Role == "SystemAdmin"` or claim `is_system_admin == "true"`.
  - Development seeder (`AdminUserSeeder`) provisions admin access from configuration (`AdminSettings:SeedAdminEmail`).
- **File Storage**:
  - Private file storage abstraction (`IFileStorageService` -> `LocalFileStorageService`), storing documents outside the web root (`private-storage/verification-documents`).
  - Strict magic-byte / file-signature verification for PDF, JPEG, and PNG formats (rejects masquerading or corrupted files).
  - Configurable upload limits (10 MB request limit and file size verification).
- **Company Verification Workflow**:
  - `POST /api/v1/companies/me/verification-documents`: Uploads verification documents (CommercialRegister, TaxCard, IndustrialRegister, QualityCertificate).
  - `GET /api/v1/companies/me/verification`: Queries verification status and document list.
  - `DELETE /api/v1/companies/me/verification-documents/{documentId}`: Deletes documents prior to review.
  - `POST /api/v1/companies/me/verification/submit`: Submits application once mandatory documents (CommercialRegister and TaxCard) are present, locking modifications.
- **Admin Review Workflow**:
  - `GET /api/v1/admin/verification/pending`: Lists companies awaiting admin review.
  - `GET /api/v1/admin/verification/{companyId}`: Retrieves company application details, document list, and decision history.
  - `POST /api/v1/admin/verification/{companyId}/approve`: Approves company, enabling `CanPerformCommercialActivities`.
  - `POST /api/v1/admin/verification/{companyId}/reject`: Rejects company application with reason.
  - `POST /api/v1/admin/verification/{companyId}/request-changes`: Requests changes with reason, allowing company to re-upload and resubmit.
  - `GET /api/v1/admin/verification/{companyId}/documents/{documentId}/download`: Streams documents directly from private storage.
- **EF Core Migration & Script**:
  - Migration: `20261030155237_AddVerificationWorkflow`.
  - Review script: `docs/migrations/verification_workflow.sql`.

## Material Catalog & RFQ Management (Phase 5)

- **Industrial Raw Material Catalog**:
  - Hierarchical categories (`MaterialCategory`) with parent-child nesting and Arabic/English bilingual taxonomy.
  - Standardized units of measurement (`UnitOfMeasure`) with bilingual display names and ISO codes (`ton`, `kg`, `l`, `m`, `m3`, `pcs`).
  - Raw material definitions (`Material`) with flexible, material-type-specific JSON attributes (`AttributesJson`, max 4000 characters).
  - Seeded catalog with standard baseline industrial units, categories (Metals, Polymers, Chemicals, etc.), and materials.
  - Public read-only catalog endpoints and administrative CRUD endpoints with soft-archiving (`IsArchived`).
- **Catalog Endpoints**:
  - `GET /api/v1/catalog/categories`: Public list of hierarchical categories.
  - `GET /api/v1/catalog/categories/{id}`: Public category details.
  - `GET /api/v1/catalog/materials`: Public search, filter, and pagination for materials.
  - `GET /api/v1/catalog/materials/{id}`: Public material details.
  - `GET /api/v1/catalog/units`: Public list of active units of measure.
  - `GET /api/v1/catalog/units/{id}`: Public unit of measure details.
- **Admin Catalog Management Endpoints (`/api/v1/admin/catalog`)**:
  - `POST /api/v1/admin/catalog/categories`: Create category (SystemAdmin).
  - `PUT /api/v1/admin/catalog/categories/{id}`: Update category (SystemAdmin).
  - `DELETE /api/v1/admin/catalog/categories/{id}`: Archive category (SystemAdmin).
  - `POST /api/v1/admin/catalog/units`: Create unit of measure (SystemAdmin).
  - `PUT /api/v1/admin/catalog/units/{id}`: Update unit of measure (SystemAdmin).
  - `DELETE /api/v1/admin/catalog/units/{id}`: Deactivate unit of measure (SystemAdmin).
  - `POST /api/v1/admin/catalog/materials`: Create material specification (SystemAdmin).
  - `PUT /api/v1/admin/catalog/materials/{id}`: Update material specification (SystemAdmin).
  - `DELETE /api/v1/admin/catalog/materials/{id}`: Archive material (SystemAdmin).
- **Request for Quotation (RFQ) Lifecycle**:
  - Commercial activity gating: Only companies approved through verification (`CanPerformCommercialActivities == true`) can create or participate in RFQs.
  - Lifecycle state machine: `Draft` -> `Published` -> `Closed` or `Cancelled`.
  - Privacy preservation: Published RFQ marketplace queries sanitize buyer company private contact and tax details.
  - Human-readable RFQ numbering (`RFQ-YYYYMM-XXXX`) generated per sequence.
  - Line-item specification with high-precision quantities (`decimal(18, 4)`) and unit prices.
- **RFQ Endpoints (`/api/v1/rfqs`)**:
  - `POST /api/v1/rfqs`: Create Draft RFQ or publish immediately.
  - `GET /api/v1/rfqs/{id}`: Get RFQ details (owner sees drafts & details; verified suppliers see published RFQs).
  - `GET /api/v1/rfqs/mine`: List buyer company's own RFQs with status filtering and pagination.
  - `GET /api/v1/rfqs`: Discover published RFQs across the marketplace with category, material, governorate, and text search filters.
  - `PUT /api/v1/rfqs/{id}`: Update RFQ details (full edit for drafts; delivery/notes edit for published).
  - `POST /api/v1/rfqs/{id}/publish`: Publish a draft RFQ (requires at least one line item and future closing date).
  - `POST /api/v1/rfqs/{id}/close`: Close a published RFQ, preventing any new offers.
  - `POST /api/v1/rfqs/{id}/cancel`: Cancel an RFQ.
- **EF Core Migration & Review Script**:
  - Migration: `20261030162115_AddCatalogAndRfqManagement`.
  - Review script: `docs/migrations/catalog_and_rfq.sql`.

## Offers & Negotiation (Phase 6)

- **Supplier Offer Submission**:
  - Only members of an **approved, active supplier company** with the `Owner`, `Admin`, or `SalesManager` role may submit offers.
  - The target RFQ must be in `Published` status and within its closing-date window.
  - A supplier cannot submit an offer to its own company's RFQ (self-bidding prevention).
  - **One active offer per supplier per RFQ** — a supplier must revise, not re-submit, to change a pending offer.
  - Offers carry structured `OfferItems` matching the RFQ line items (quantity, unit price, delivery terms, validity date).
- **Revision Workflow (Immutable Snapshots)**:
  - Each revision creates a **new `Offer` row** with an incremented `RevisionNumber` and an `OriginalOfferId` pointer back to the root offer.
  - The previous revision is set to `Superseded` status — it is never overwritten.
  - Revision numbers are human-readable: `OFFER-YYYYMM-XXXXXX` for the initial offer, `OFFER-YYYYMM-XXXXXX-R2`, `-R3`, etc. for subsequent revisions.
  - The full audit trail is queryable via `GET /api/v1/offers/{offerId}/revisions`.
- **Buyer Acceptance / Rejection (Atomic)**:
  - Acceptance is a single atomic operation: the accepted offer is set to `Accepted`, **all competing offers** from other suppliers on the same RFQ are automatically set to `Rejected`, and the RFQ is set to `Closed`.
  - Rejection records a reason and preserves full offer history; the supplier may revise and resubmit while the RFQ remains open.
  - Only company members with `Owner`, `Admin`, or `ProcurementManager` roles may accept or reject offers.
- **Privacy Guardrails**:
  - Buyer private contact details are never exposed in offer or RFQ marketplace responses.
  - Competing supplier details are never cross-exposed to other suppliers.
- **Offer Endpoints**:
  - `POST /api/v1/rfqs/{rfqId}/offers`: Submit an offer for a published RFQ.
  - `GET /api/v1/rfqs/{rfqId}/offers/mine`: Supplier views their own offers on an RFQ.
  - `GET /api/v1/rfqs/{rfqId}/offers`: Buyer views all received offers on their RFQ.
  - `GET /api/v1/offers/{id}`: Authorized offer detail (buyer or owning supplier).
  - `GET /api/v1/offers/mine`: Current supplier's submitted offers with pagination.
  - `POST /api/v1/offers/{id}/revise`: Submit a revised offer (creates immutable snapshot).
  - `GET /api/v1/offers/{id}/revisions`: Full revision history for an offer lineage.
  - `POST /api/v1/offers/{id}/accept`: Buyer accepts an offer (atomic: competing offers rejected, RFQ closed).
  - `POST /api/v1/offers/{id}/reject`: Buyer rejects an offer with reason.
- **EF Core Migration & Review Script**:
  - Migration: `20261030170921_AddOffersAndNegotiation`.
  - Review script: `docs/migrations/offers_and_negotiation.sql`.

## Deals & Disputes (Phase 7)

- **Atomic Deal Creation**:
  - Accepting an offer atomically creates exactly one `Deal` row in the same database transaction as offer acceptance, competing offer rejection, and RFQ closure.
  - Unique database constraints (`OfferId` unique index) guarantee that duplicate deals cannot be created even under retries or concurrent requests.
  - **Frozen Commercial Terms Snapshot**: Commercial terms (items, quantities, unit prices, totals, currency, lead time, delivery terms, estimated delivery date, validity date, notes) are captured in an immutable JSON snapshot (`CommercialTermsSnapshotJson`) that can never be altered by subsequent offer or RFQ revisions.
- **Deal Lifecycle & State Machine**:
  - Initial State: `AwaitingConfirmation`.
  - Lifecycle States: `AwaitingConfirmation` -> `Confirmed` -> `InProgress` -> `Completed` (or `Cancelled` / `Disputed`).
  - **Mutual Confirmation**: Both buyer and supplier must confirm independently (`ConfirmedByBuyerAtUtc`, `ConfirmedBySupplierAtUtc`). The deal transitions to `Confirmed` only when both confirmations exist.
  - `InProgress` requires `Confirmed` (initiated by supplier).
  - `Completed` requires `InProgress` (fulfillment verified). Completed deals become eligible for reviews in Phase 8.
- **Controlled Cancellation**:
  - Unilateral cancellation is allowed while in `AwaitingConfirmation` (with mandatory reason).
  - Once in `Confirmed` or `InProgress`, cancellation requires mutual agreement (a cancellation request is placed and must be confirmed by the other party).
  - Cancellation is strictly prohibited once the deal is `Completed` or `Cancelled`.
- **Dispute Resolution & Admin Arbitration**:
  - Participants (buyer or supplier) can open formal disputes (`POST /api/v1/deals/{id}/disputes`) with a structured category (`QualityDefect`, `QuantityMismatch`, `LateDelivery`, etc.) and description.
  - Opening a dispute transitions the deal to `Disputed` and preserves its prior status in `PreviousStatus`.
  - Only platform **System Administrators** can resolve disputes (`POST /api/v1/admin/disputes/{id}/resolve`) with either:
    - `ResumeDeal`: Restores the deal back to its prior lifecycle status.
    - `CancelDeal`: Formally cancels the deal with recorded administrative audit notes.
- **Deal & Dispute Endpoints**:
  - `GET /api/v1/deals/mine`: List authenticated company's deals (as buyer or supplier) with pagination and status filters.
  - `GET /api/v1/deals/{id}`: Detailed deal view with frozen snapshot and dispute history (participants or system admins only).
  - `POST /api/v1/deals/{id}/confirm`: Confirm deal participation (Owner, Admin, or Procurement/Sales Manager).
  - `POST /api/v1/deals/{id}/start`: Start fulfillment (Supplier Owner, Admin, or Sales Manager).
  - `POST /api/v1/deals/{id}/complete`: Mark fulfillment completed (authorized participant roles).
  - `POST /api/v1/deals/{id}/cancel`: Request or agree to deal cancellation with mandatory reason.
  - `POST /api/v1/deals/{id}/disputes`: Open formal dispute on an active deal.
  - `GET /api/v1/deals/{id}/disputes`: View all disputes associated with a deal.
  - `GET /api/v1/admin/disputes`: Administrative listing of all marketplace disputes (SystemAdmin).
  - `GET /api/v1/admin/disputes/{id}`: Detailed administrative view of a dispute (SystemAdmin).
  - `POST /api/v1/admin/disputes/{id}/resolve`: Resolve dispute with ResumeDeal or CancelDeal (SystemAdmin).
- **EF Core Migration & Review Script**:
  - Migration: `20261030173630_AddDealsAndDisputesLifecycle`.
  - Review script: `docs/migrations/deals_and_disputes.sql`.

## Shipping & Reviews (Phase 8)

- **Shipping Arrangements**:
  - **Supplier-Arranged**: Supplier creates the shipment, provides carrier name, tracking number, and updates tracking status through the shipment lifecycle.
  - **DealZone-Arranged**: Admin assigns an active `ShippingProvider` to the deal's shipment, manages provider details, and updates tracking.
- **Shipment Lifecycle & Status Transitions**:
  - `Pending` → `Assigned` → `PickedUp` → `InTransit` → `OutForDelivery` → `Delivered`
  - `Failed` from `InTransit`, `OutForDelivery`, or `PickedUp`.
  - `Cancelled` from `Pending` or `Assigned`.
  - Centralized transition validation with admin-only gating for provider assignment.
  - Creating a shipment for a `Confirmed` deal auto-transitions the deal to `InProgress`.
  - Shipment `Delivered` does **not** auto-complete the Deal — deal completion remains a separate business action.
- **Tracking History**:
  - Immutable JSON array of tracking events (`TrackingEventsJson`) appended on every status change or tracking update.
  - Each event records status, location, notes, actor user ID, and UTC timestamp.
  - Unique `ShipmentNumber` (`SHP-YYYYMM-XXXXXX`) generated per shipment.
- **Shipping Provider Administration (SystemAdmin Only)**:
  - Full CRUD with activate/deactivate lifecycle (soft deactivation over hard deletion).
  - Providers referenced by existing shipments cannot be deleted.
  - Validation of provider names and contact information.
- **Shipment Endpoints**:
  - `POST /api/v1/deals/{dealId}/shipments`: Create a shipment for a deal (supplier or admin).
  - `GET /api/v1/deals/{dealId}/shipments`: List shipments for a deal (participants or admin).
  - `GET /api/v1/shipments/{id}`: View shipment details with tracking history.
  - `PUT /api/v1/shipments/{id}/tracking`: Update tracking information (carrier, tracking number, notes).
  - `POST /api/v1/shipments/{id}/status`: Transition shipment status with validation.
- **Admin Shipping Endpoints (`/api/v1/admin`)**:
  - `POST /api/v1/admin/shipping-providers`: Create shipping provider.
  - `GET /api/v1/admin/shipping-providers`: List providers with pagination and status filter.
  - `GET /api/v1/admin/shipping-providers/{id}`: View provider details.
  - `PUT /api/v1/admin/shipping-providers/{id}`: Update provider details.
  - `POST /api/v1/admin/shipping-providers/{id}/activate`: Activate provider.
  - `POST /api/v1/admin/shipping-providers/{id}/deactivate`: Deactivate provider.
  - `POST /api/v1/admin/shipments/{id}/assign-provider`: Assign provider to a DealZone-arranged shipment.
- **Reviews for Completed Deals**:
  - Only participants of a `Completed` deal may leave a review.
  - One review per company per deal (enforced by unique database index on `DealId` + `ReviewerCompanyId`).
  - Rating scale: 1–5 with optional comment (max 2000 characters).
  - No self-review: reviewer and target company are automatically derived from the deal's buyer/supplier roles.
  - Reviews are immutable once submitted.
- **Company Reputation**:
  - Average rating and review count computed per company from all received reviews.
  - Publicly accessible company review listing with pagination.
- **Review Endpoints**:
  - `POST /api/v1/deals/{dealId}/reviews`: Submit a review for a completed deal.
  - `GET /api/v1/deals/{dealId}/reviews`: List reviews for a deal.
  - `GET /api/v1/companies/{companyId}/reviews`: Public company reviews with average rating stats.
  - `GET /api/v1/companies/me/reviews`: Authenticated company's received reviews.
- **EF Core Migration & Review Script**:
  - Migration: `20261030175518_AddShippingAndReviews`.
  - Review script: `docs/migrations/shipping_and_reviews.sql`.

## Notifications & Final Integration (Phase 9)

- **Persistent In-App Notification System**:
  - `Notification` domain entity scoped strictly to individual users (`UserId`), never companies.
  - User-level authorization and IDOR prevention: users can only view and update their own notifications.
  - Idempotency deduplication via unique filtered database index on `(UserId, IdempotencyKey) WHERE IdempotencyKey IS NOT NULL`.
  - Performance indexes on `(UserId, IsRead)` and `(UserId, CreatedAtUtc DESC)`.
  - Rich `NotificationType` enum with 28 structured event types across all marketplace lifecycle domains.
- **Business Event Notifications**:
  - **Verification**: Company verification submitted (user), approved/rejected/changes requested (all company admins).
  - **RFQs**: New published RFQs broadcast safely to active approved supplier companies (capped at 50 to prevent unbounded volume), RFQ closed/cancelled to participating suppliers.
  - **Offers**: Offer submitted (buyer), offer revision submitted (buyer), offer accepted (supplier), offer rejected (supplier), deal created on acceptance.
  - **Deals & Disputes**: Deal confirmation received, deal fully confirmed, deal started, deal completed, cancellation requested/cancelled, dispute opened, dispute resolved.
  - **Shipping & Reviews**: Shipment created, tracking updated, shipment status changed, post-deal review received.
- **Email Service Integration**:
  - Environment-aware DI registration: `DevelopmentEmailService` (in-memory logger) in Development; `SmtpEmailService` (`System.Net.Mail`) in Production.
  - Configurable via `SmtpSettings` section in configuration.
  - Resilient dispatch: all email delivery exceptions are logged safely and never break the calling transactional business operation.
  - Expanded `IEmailService` contract: email confirmations, password resets, verification decisions, offer accepted/rejected notices, deal confirmed notices, dispute resolution notices.
- **Notification Endpoints (`/api/v1/notifications`)**:
  - `GET /api/v1/notifications`: Paginated listing of current user's notifications (supports `unreadOnly` filter).
  - `GET /api/v1/notifications/unread-count`: Instant badge count of unread notifications for current user.
  - `POST /api/v1/notifications/{id}/read`: Mark single notification as read (returns 404 for IDOR attempts).
  - `POST /api/v1/notifications/read-all`: Mark all notifications as read for current user.
- **Security & Dependency Hardening**:
  - Resolved `NU1903` security advisory vulnerability by upgrading `Microsoft.OpenApi` to `2.7.5`.
  - Zero compiler warnings (`-warnaserror` compatible build).
- **EF Core Migration & Review Script**:
  - Migration: `20261030183944_AddNotifications`.
  - Review script: `docs/migrations/notifications_and_integration.sql`.

## Swagger & OpenAPI Documentation

- **Swagger UI**: Interactive developer documentation available at `/swagger` (enabled by default in Development, or configurable via `"Swagger": { "Enabled": true }` in `appsettings.json`).
- **OpenAPI v1 Specification**: Machine-readable JSON contract available at `/openapi/v1.json`.
- **JWT Bearer Authentication**: Integrated `Authorize` button supporting `Bearer {token}` authorization headers automatically mapped to all `[Authorize]` endpoints.
- **Categorization**: 17 domain controllers grouped into clear logical tags: `Authentication`, `Companies`, `Company Verification`, `Admin Verification`, `Admin Catalog`, `Admin Disputes`, `Catalog`, `RFQs`, `Offers`, `Deals`, `Shipping`, `Shipping Providers`, `Reviews`, `Notifications`.

## Concurrency Hardening & Audit Fixes

- **Database-Enforced Race Prevention**:
  - Filtered unique index `IX_Offers_RfqId_Accepted` on `Offers(RfqId) WHERE [Status] = 2` preventing duplicate accepted offers during concurrent requests.
  - Filtered unique index `IX_Deals_RfqId` on `Deals(RfqId) WHERE [RfqId] IS NOT NULL` preventing duplicate deals for the same RFQ.
- **EF Core Concurrency Handling**:
  - `DbUpdateConcurrencyException` explicitly mapped to HTTP 409 Conflict ProblemDetails.
- **Production Secret Validation**:
  - Startup assertion enforcing that non-development environments configure a strong custom cryptographic key (>= 32 bytes) and never run with the development default.
- **EF Core Migration & Review Script**:
  - Migration: `20261030194444_AddConcurrencyUniqueIndexes`.
  - Review script: `docs/migrations/concurrency_unique_indexes.sql`.

## Prerequisites
- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Microsoft SQL Server](https://www.microsoft.com/sql-server) (local instance or SQL Server Express)

## Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd DealZone
```

### 2. Restore dependencies
```bash
dotnet restore
```

### 3. Build the solution
```bash
dotnet build
```

### 4. Run tests
```bash
dotnet test
```

### 5. Generate / Apply Migrations
```bash
# Generate SQL review script
dotnet ef migrations script --project src/DealZone.Infrastructure --startup-project src/DealZone.Api --idempotent --output docs/migrations/initial_schema.sql

# Update database (when connecting to local SQL Server instance)
dotnet ef database update --project src/DealZone.Infrastructure --startup-project src/DealZone.Api
```

## Guidelines for Development
Refer to [AGENTS.md](AGENTS.md) for architectural rules, coding standards, and operational guidelines.
