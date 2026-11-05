# DealZone — Technical Analysis, Frontend Architecture & Rebranding Master Specification

---

## 1. Project Overview

DealZone is an enterprise B2B industrial raw materials marketplace and procurement platform engineered specifically for the Egyptian industrial sector (chemicals, metals, polymers, packaging, minerals, etc.).

### Core Problem & Business Mission
The industrial procurement space in the region has historically suffered from fragmented supplier discovery, non-standard specifications, manual and unverified counterparty qualification, opaque negotiation cycles, and lack of fulfillment traceability. DealZone solves this by providing:
- **Verified Enterprise Identities:** Comprehensive business verification (Commercial Registration & Tax Card vetting).
- **Industrial Raw Material Taxonomy:** Standardized bilingual (Arabic/English) hierarchical catalog with high precision measurement units (MT, kg, L, etc.).
- **Structured RFQ Workflow:** Formal Request for Quotation publishing, discovery, and quotation intake.
- **Reverse Bidding & Offer Negotiation:** Suppliers submit structured proposals with line-by-line pricing and terms. Revisions create immutable audit trails.
- **Contractual Binding Deals:** Atomic deal formation upon offer acceptance with frozen commercial snapshots.
- **Fulfillment & Logistics Management:** Multi-modal shipping arrangements (Supplier-Arranged vs. DealZone-Arranged) with milestone tracking.
- **Dispute Escalation & System Admin Arbitration:** Built-in dispute handling with administrative resolution.
- **Closed-Loop Verified Reviews:** Reputation tracking restricted exclusively to completed deal counterparties.

---

## 2. Backend Architecture Analysis

The backend is built with **.NET 10 (C#)** adhering strictly to **Clean Architecture** within a **Modular Monolith**:

```
backend/
├── src/
│   ├── DealZone.Domain/          # Core entities, value objects, domain enums, domain exceptions
│   ├── DealZone.Application/     # Application services, DTOs, FluentValidation, interfaces (ICurrentUser, etc.)
│   ├── DealZone.Infrastructure/  # EF Core SQL Server DbContext, configurations, security, migrations, adapters
│   └── DealZone.Api/             # ASP.NET Core presentation layer, controllers, ProblemDetails, OpenAPI
├── tests/
│   ├── DealZone.UnitTests/       # 153 tests (100% pass)
│   └── DealZone.IntegrationTests/# 75 tests against SQL Server (100% pass)
└── docs/                         # API Handover and Database design specifications
```

### Architectural & Operational Characteristics
- **Multi-Tenant Isolation:** Enforced on every database query and command via `ICurrentUser.CompanyId`. Private legal tax records (`CompanyContactDetails`) are isolated behind a protected endpoint (`/api/v1/companies/me/contact-details`) and never exposed in marketplace feeds.
- **Concurrency & Race Condition Prevention:** All transactional entities implement `byte[] RowVersion` concurrency tokens. Critical invariants (e.g. only one accepted offer per RFQ, one deal per RFQ) are enforced with database-level filtered unique indexes (`IX_Offers_RfqId_Accepted`, `IX_Deals_RfqId`).
- **Precision:** Financial amounts use `decimal(18, 2)` (EGP currency standard). Material quantities use `decimal(18, 4)`.
- **Stateless Authentication:** JWT Bearer access tokens (60-minute lifetime) paired with cryptographically secure rotated refresh tokens (30-day lifetime, stored as SHA-256 hashes with replay breach detection).
- **Error Response Standard:** Strict adherence to **RFC 7807 ProblemDetails** (`application/problem+json`) with validation error dictionaries and request correlation `traceId`.
- **Communication Scope:** REST HTTP API only. There are **no WebSockets or SignalR hubs**, **no online payment gateways/escrow holdings**, and **no external carrier APIs**.

---

## 3. Complete API Endpoints Inventory

The backend exposes **84 documented operations** (80 distinct controller actions, 82 mapped routes including legacy aliases, and 4 system/health endpoints), all prefixed with `/api/v1/`:

### A. Authentication (`/api/v1/auth`)
| Method | Route | Auth | Roles/Policy | Request Body / Params | Response / Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Anon | None | `RegisterRequest` (`email`, `password`, `fullName`, `phoneNumber`) | 201 Created (`userId`, `email`, message) |
| `POST` | `/api/v1/auth/confirm-email` | Anon | None | `ConfirmEmailRequest` (`email`, `token`) | 200 OK (message) |
| `POST` | `/api/v1/auth/resend-confirmation` | Anon | None | `ResendConfirmationRequest` (`email`) | 200 OK (message) |
| `POST` | `/api/v1/auth/login` | Anon | None | `LoginRequest` (`email`, `password`) | 200 OK (`accessToken`, `refreshToken`, `expiresIn`, `tokenType`) |
| `POST` | `/api/v1/auth/refresh` | Anon | None | `RefreshTokenRequest` (`refreshToken`) | 200 OK (new token pair) |
| `POST` | `/api/v1/auth/logout` | Anon | None | `RefreshTokenRequest?` (`refreshToken`) | 200 OK (message) |
| `POST` | `/api/v1/auth/forgot-password` | Anon | None | `ForgotPasswordRequest` (`email`) | 200 OK (message) |
| `POST` | `/api/v1/auth/reset-password` | Anon | None | `ResetPasswordRequest` (`email`, `token`, `newPassword`) | 200 OK (message) |
| `GET` | `/api/v1/auth/me` | JWT | Authenticated | None | 200 OK (`UserProfileResponse` with embedded company info) |

### B. Company Management & Verification (`/api/v1/companies`, `/api/v1/verification`)
| Method | Route | Auth | Roles/Policy | Request Body / Params | Response / Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/companies` | JWT | Authenticated | `CreateCompanyRequest` (LegalName, TradeName, Sector, City, Governorate, TaxId, RegNumber, etc.) | 201 Created (`CompanyResponse`) |
| `GET` | `/api/v1/companies/me` | JWT | Company Member | None | 200 OK (`CompanyResponse`) |
| `PUT` | `/api/v1/companies/me` | JWT | Owner, Admin | `UpdateCompanyProfileRequest` (TradeName, City, Governorate, Description, Website) | 200 OK (`CompanyResponse`) |
| `GET` | `/api/v1/companies/me/contact-details` | JWT | Company Member | None | 200 OK (`CompanyContactDetailsResponse` - Tax ID, Reg Number, Phone, Address) |
| `POST` | `/api/v1/companies/me/verification-documents` | JWT | Owner, Admin | `multipart/form-data`: `documentType` (int: 1-5), `file` (max 10MB) | 201 Created (`UploadDocumentResponse`) |
| `GET` | `/api/v1/companies/me/verification` | JWT | Company Member | None | 200 OK (`CompanyVerificationStatusResponse` + documents list) |
| `DELETE` | `/api/v1/companies/me/verification-documents/{documentId}` | JWT | Owner, Admin | `documentId: Guid` | 204 No Content |
| `POST` | `/api/v1/companies/me/verification/submit` | JWT | Owner, Admin | None (Requires CommercialRegister & TaxCard) | 204 No Content |

### C. Admin Verification (`/api/v1/admin/verification`)
| Method | Route | Auth | Policy | Request Body / Params | Response / Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/admin/verification/pending` | JWT | SystemAdmin | None | 200 OK (List of pending companies) |
| `GET` | `/api/v1/admin/verification/{companyId}` | JWT | SystemAdmin | `companyId: Guid` | 200 OK (Company profile, documents & audit history) |
| `POST` | `/api/v1/admin/verification/{companyId}/approve` | JWT | SystemAdmin | `companyId: Guid` | 204 No Content |
| `POST` | `/api/v1/admin/verification/{companyId}/reject` | JWT | SystemAdmin | `RejectCompanyRequest` (`reason`) | 204 No Content |
| `POST` | `/api/v1/admin/verification/{companyId}/request-changes` | JWT | SystemAdmin | `RequestChangesRequest` (`reason`) | 204 No Content |
| `GET` | `/api/v1/admin/verification/{companyId}/documents/{documentId}/download` | JWT | SystemAdmin | `companyId`, `documentId` | 200 OK (Binary stream) |

### D. Public Catalog & Admin Catalog (`/api/v1/catalog`, `/api/v1/admin/catalog`)
| Method | Route | Auth | Roles/Policy | Request Body / Params | Response / Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/catalog/categories` | Anon | Public | None | 200 OK (Hierarchical bilingual tree) |
| `GET` | `/api/v1/catalog/categories/{id}` | Anon | Public | `id: Guid` | 200 OK (`CategoryDto`) |
| `GET` | `/api/v1/catalog/materials` | Anon | Public | Query: `categoryId`, `searchTerm`, `activeOnly`, pagination | 200 OK (`PagedResult<MaterialDto>`) |
| `GET` | `/api/v1/catalog/materials/{id}` | Anon | Public | `id: Guid` | 200 OK (`MaterialDto`) |
| `GET` | `/api/v1/catalog/units` | Anon | Public | None | 200 OK (List of units: MT, kg, L, m³, pc, etc.) |
| `GET` | `/api/v1/catalog/units/{id}` | Anon | Public | `id: Guid` | 200 OK (`UnitOfMeasureDto`) |
| `POST` | `/api/v1/admin/catalog/categories` | JWT | SystemAdmin | `CreateCategoryRequest` | 201 Created |
| `PUT` | `/api/v1/admin/catalog/categories/{id}` | JWT | SystemAdmin | `UpdateCategoryRequest` | 200 OK |
| `DELETE` | `/api/v1/admin/catalog/categories/{id}` | JWT | SystemAdmin | `id: Guid` | 204 No Content (Archives category) |
| `POST` | `/api/v1/admin/catalog/materials` | JWT | SystemAdmin | `CreateMaterialRequest` | 201 Created |
| `PUT` | `/api/v1/admin/catalog/materials/{id}` | JWT | SystemAdmin | `UpdateMaterialRequest` | 200 OK |
| `DELETE` | `/api/v1/admin/catalog/materials/{id}` | JWT | SystemAdmin | `id: Guid` | 204 No Content (Archives material) |
| `POST` | `/api/v1/admin/catalog/units` | JWT | SystemAdmin | `CreateUnitRequest` | 201 Created |
| `PUT` | `/api/v1/admin/catalog/units/{id}` | JWT | SystemAdmin | `UpdateUnitRequest` | 200 OK |
| `DELETE` | `/api/v1/admin/catalog/units/{id}` | JWT | SystemAdmin | `id: Guid` | 204 No Content |

### E. RFQ Management (`/api/v1/rfqs`)
| Method | Route | Auth | Roles/Policy | Request Body / Params | Response / Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/rfqs` | JWT | Approved Buyer (Owner, Admin, Procurement) | `CreateRfqRequest` (title, targetCategoryId, governorate, city, address, closingDateUtc, items[]) | 201 Created (`RfqDetailResponse`) |
| `GET` | `/api/v1/rfqs/{id}` | JWT | Buyer or Supplier | `id: Guid` | 200 OK (`RfqDetailResponse`) |
| `GET` | `/api/v1/rfqs/mine` | JWT | Approved Buyer | Query: `status`, pagination | 200 OK (`PagedResult<RfqSummaryResponse>`) |
| `GET` | `/api/v1/rfqs` | JWT | Approved Supplier | Query: `categoryId`, `materialId`, `governorate`, `city`, `searchTerm`, pagination | 200 OK (`PagedResult<RfqDiscoveryResponse>`) |
| `PUT` | `/api/v1/rfqs/{id}` | JWT | Owning Buyer (Owner, Admin, Procurement) | `UpdateRfqRequest` | 200 OK (`RfqDetailResponse`) |
| `POST` | `/api/v1/rfqs/{id}/publish` | JWT | Owning Buyer (Owner, Admin, Procurement) | `id: Guid` | 200 OK (`RfqDetailResponse`) |
| `POST` | `/api/v1/rfqs/{id}/close` | JWT | Owning Buyer (Owner, Admin, Procurement) | `id: Guid` | 200 OK (`RfqDetailResponse`) |
| `POST` | `/api/v1/rfqs/{id}/cancel` | JWT | Owning Buyer (Owner, Admin, Procurement) | `id: Guid` | 200 OK (`RfqDetailResponse`) |

### F. Offers & Negotiation (`/api/v1/offers`, `/api/v1/rfqs/{rfqId}/offers`)
| Method | Route | Auth | Roles/Policy | Request Body / Params | Response / Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/rfqs/{rfqId}/offers` | JWT | Approved Supplier (Owner, Admin, Sales) | `CreateOfferRequest` (deliveryLeadTimeDays, shippingIncluded, paymentTerms, validityDateUtc, items[]) | 201 Created (`OfferDetailResponse`) |
| `GET` | `/api/v1/rfqs/{rfqId}/offers/mine` | JWT | Approved Supplier | `rfqId: Guid` | 200 OK (Supplier's active offer) |
| `GET` | `/api/v1/rfqs/{rfqId}/offers` | JWT | Owning Buyer | `rfqId: Guid` | 200 OK (List of incoming offers) |
| `GET` | `/api/v1/offers/{id}` | JWT | Buyer or Supplier | `id: Guid` | 200 OK (`OfferDetailResponse`) |
| `GET` | `/api/v1/offers/mine` | JWT | Approved Supplier | Query: `status`, pagination | 200 OK (`PagedResult<OfferSummaryResponse>`) |
| `POST` | `/api/v1/offers/{id}/revise` | JWT | Owning Supplier (Owner, Admin, Sales) | `ReviseOfferRequest` (new terms + `changeSummary`) | 201 Created (`OfferDetailResponse` - R2, R3...) |
| `GET` | `/api/v1/offers/{id}/revisions` | JWT | Buyer or Supplier | `id: Guid` | 200 OK (Revision lineage list) |
| `POST` | `/api/v1/offers/{id}/accept` | JWT | Owning Buyer (Owner, Admin, Procurement) | `AcceptOfferRequest?` | 200 OK (Atomically creates Deal, rejects competitors, closes RFQ) |
| `POST` | `/api/v1/offers/{id}/reject` | JWT | Owning Buyer (Owner, Admin, Procurement) | `RejectOfferRequest` (`reason`) | 200 OK |

### G. Deals & Disputes (`/api/v1/deals`, `/api/v1/admin/disputes`)
| Method | Route | Auth | Roles/Policy | Request Body / Params | Response / Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/deals/mine` | JWT | Deal Participant | Query: `status`, pagination | 200 OK (`PagedResult<DealSummaryResponse>`) |
| `GET` | `/api/v1/deals/{id}` | JWT | Participant or SystemAdmin | `id: Guid` | 200 OK (`DealDetailResponse` with snapshot terms) |
| `POST` | `/api/v1/deals/{id}/confirm` | JWT | Buyer (Procurement) or Supplier (Sales) / Owner / Admin | `id: Guid` | 200 OK (Transitions to `Confirmed` once both confirm) |
| `POST` | `/api/v1/deals/{id}/start` | JWT | Supplier (Owner, Admin, Sales) | `id: Guid` | 200 OK (Transitions to `InProgress`) |
| `POST` | `/api/v1/deals/{id}/complete` | JWT | Authorized Participant Roles | `id: Guid` | 200 OK (Transitions to `Completed`, enables reviews) |
| `POST` | `/api/v1/deals/{id}/cancel` | JWT | Authorized Participant Roles | `CancelDealRequest` (`reason`) | 200 OK (Unilateral if AwaitingConfirmation; mutual if Confirmed/InProgress) |
| `POST` | `/api/v1/deals/{id}/disputes` | JWT | Authorized Participant Roles | `CreateDisputeRequest` (`category`, `description`) | 201 Created (Transitions deal to `Disputed`) |
| `GET` | `/api/v1/deals/{id}/disputes` | JWT | Participant or SystemAdmin | `id: Guid` | 200 OK (Disputes history list) |
| `GET` | `/api/v1/admin/disputes` | JWT | SystemAdmin | Query: `status`, pagination | 200 OK (`PagedResult<DisputeSummaryResponse>`) |
| `GET` | `/api/v1/admin/disputes/{id}` | JWT | SystemAdmin | `id: Guid` | 200 OK (`DisputeDetailResponse`) |
| `POST` | `/api/v1/admin/disputes/{id}/resolve` | JWT | SystemAdmin | `ResolveDisputeRequest` (`resolutionAction`: ResumeDeal / CancelDeal, notes) | 200 OK |

### H. Shipping & Logistics (`/api/v1/shipments`, `/api/v1/admin/shipments`, `/api/v1/admin/shipping-providers`)
| Method | Route | Auth | Roles/Policy | Request Body / Params | Response / Status |
|---|---|---|---|---|---|
| `POST` | `/api/v1/deals/{dealId}/shipments` | JWT | Supplier (Owner, Admin, Sales) | `CreateShipmentRequest` (arrangement, carrier, pickupAddress, deliveryAddress) | 201 Created (`ShipmentResponse`) |
| `GET` | `/api/v1/deals/{dealId}/shipments` | JWT | Deal Participant / Admin | `dealId: Guid` | 200 OK (List of shipments for deal) |
| `GET` | `/api/v1/shipments/{id}` | JWT | Deal Participant / Admin | `id: Guid` | 200 OK (`ShipmentResponse` + full `trackingEvents` timeline) |
| `PUT` | `/api/v1/shipments/{id}/tracking` | JWT | Supplier / Admin | `UpdateTrackingRequest` (trackingNumber, carrier, notes) | 200 OK |
| `POST` | `/api/v1/shipments/{id}/status` | JWT | Supplier / Admin | `UpdateShipmentStatusRequest` (new status, location, notes) | 200 OK |
| `POST` | `/api/v1/admin/shipping-providers` | JWT | SystemAdmin | `CreateShippingProviderRequest` | 201 Created |
| `GET` | `/api/v1/admin/shipping-providers` | JWT | SystemAdmin | Query: `isActive`, pagination | 200 OK |
| `GET` | `/api/v1/admin/shipping-providers/{id}` | JWT | SystemAdmin | `id: Guid` | 200 OK |
| `PUT` | `/api/v1/admin/shipping-providers/{id}` | JWT | SystemAdmin | `UpdateShippingProviderRequest` | 200 OK |
| `POST` | `/api/v1/admin/shipping-providers/{id}/activate` | JWT | SystemAdmin | `id: Guid` | 200 OK |
| `POST` | `/api/v1/admin/shipping-providers/{id}/deactivate` | JWT | SystemAdmin | `id: Guid` | 200 OK |
| `DELETE` | `/api/v1/admin/shipping-providers/{id}` | JWT | SystemAdmin | `id: Guid` | 204 No Content |
| `GET` | `/api/v1/admin/shipments` | JWT | SystemAdmin | Query: `status`, pagination | 200 OK |
| `POST` | `/api/v1/admin/shipments/{id}/assign-provider` | JWT | SystemAdmin | `AssignShippingProviderRequest` (`providerId`) | 200 OK |
| `POST` | `/api/v1/admin/shipments/{id}/status` | JWT | SystemAdmin | `UpdateShipmentStatusRequest` | 200 OK |

### I. Reputation & Reviews (`/api/v1/reviews`, `/api/v1/companies/{companyId}/reviews`, `/api/v1/deals/{dealId}/reviews`)
| Method | Route | Auth | Roles/Policy | Request Body / Params | Response / Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/companies/{companyId}/reviews` | Anon | Public | `companyId`, pagination | 200 OK (`CompanyReputationResponse` with avg rating, count & reviews) |
| `GET` | `/api/v1/companies/me/reviews` | JWT | Authenticated Company | pagination | 200 OK (Company's received reviews) |
| `POST` | `/api/v1/deals/{dealId}/reviews` | JWT | Deal Participant of Completed Deal | `CreateReviewRequest` (`rating`: 1-5, `comment`) | 201 Created (`ReviewResponse`) |
| `GET` | `/api/v1/deals/{dealId}/reviews` | JWT | Authenticated User | `dealId: Guid` | 200 OK (Reviews for this deal) |

### J. In-App Notifications (`/api/v1/notifications`)
| Method | Route | Auth | Roles/Policy | Request Body / Params | Response / Status |
|---|---|---|---|---|---|
| `GET` | `/api/v1/notifications` | JWT | Authenticated User | Query: `isRead`, pagination | 200 OK (`PagedResult<NotificationResponse>`) |
| `GET` | `/api/v1/notifications/unread-count` | JWT | Authenticated User | None | 200 OK (`{ "unreadCount": int }`) |
| `POST` | `/api/v1/notifications/{id}/read` | JWT | Notification Owner | `id: Guid` | 200 OK |
| `POST` | `/api/v1/notifications/read-all` | JWT | Authenticated User | None | 200 OK (`{ "markedAsReadCount": int }`) |

### K. System & Health
- `GET /health` and `GET /api/v1/health`: Returns `{ "status": "Healthy" }`
- `GET /swagger` and `GET /openapi/v1.json`: OpenAPI v1 specification

---

## 4. Authentication, Authorization & User Roles Analysis

### Identity Matrix
1. **System Administrator (`isSystemAdmin: true`):**
   - Has platform governance authority.
   - Access to `/api/v1/admin/*` endpoints (verification approvals, catalog management, shipping provider operations, dispute arbitration).
   - Independent of company membership.
2. **Company Entities & Membership:**
   - A `User` belongs to a single `Company` via `CompanyMembers`.
   - The company has a verification state: `Pending (0)`, `UnderReview (1)`, `Approved (2)`, `Rejected (3)`, `ChangesRequired (5)`.
   - **Crucial Rule:** Commercial endpoints (RFQs, Offers, Deals) require `verificationStatus === "Approved"` (`canPerformCommercialActivities === true`).

### Role-Based Access Control (RBAC)
| Role | Enum | Scope & Capabilities | Prohibitions |
|---|---|---|---|
| **Owner** | 1 | Full governance of company profile, documents, and all commercial operations (buyer and supplier). | Cannot access SystemAdmin endpoints. |
| **Admin** | 2 | Updates company profile, manages verification documents, and executes commercial actions. | Cannot reassign company ownership. |
| **ProcurementManager** | 3 | **Buyer Operations:** Create, edit, publish, close, cancel RFQs; view, accept, reject offers; confirm, complete, cancel deals; open disputes; review suppliers. | Cannot edit company profile, upload KYC documents, submit offers, or manage shipments. |
| **SalesManager** | 4 | **Supplier Operations:** Discover RFQs; submit and revise offers; confirm, start, complete, cancel deals; manage shipments; open disputes; review buyers. | Cannot edit company profile, upload KYC documents, or create/manage RFQs. |
| **Member** | 5 | Read-only access to company profile, RFQs, offers, deals, shipments, disputes, and reviews. | Cannot perform mutations or status transitions. |

---

## 5. Database & Entity Relationships

The relational model is built on SQL Server with GUID primary keys:

```
[Users] ──(1:N)──< [CompanyMembers] >──(N:1)── [Companies]
                                                    │
             ┌──────────────────────────────────────┼──────────────────────────────────────┐
             │ (1:1 Private)                        │ (1:N)                                │ (1:N)
             ▼                                      ▼                                      ▼
[CompanyContactDetails]                  [VerificationDocuments]                        [Rfqs]
(Tax ID, Reg No, Phone)                  (Commercial Reg, Tax Card)                       │ (1:N)
                                                                                          ▼
                                                                                     [RfqItems]
                                                                                          ▲
                                                                                          │ (Reference)
[Companies (Supplier)] ──(1:N)──< [Offers] >──(1:N)── [OfferItems] ───────────────────────┘
                                     │ (Lineage: OriginalOfferId)
                                     │ (Accepted)
                                     ▼
                                  [Deals] ──(1:1 Frozen Snapshot)
                                     │
             ┌───────────────────────┼───────────────────────┐
             │ (1:N)                 │ (1:N)                 │ (1:2 Max)
             ▼                       ▼                       ▼
      [DealDisputes]            [Shipments]              [Reviews]
                                     │ (1:N)
                                     ▼
                          [ShipmentTrackingEvents]
```

---

## 6. Business Logic & Workflow Analysis

### 1. Onboarding & Compliance Workflow
1. User registers via `POST /auth/register` and confirms email via `POST /auth/confirm-email`.
2. User authenticates via `POST /auth/login` receiving an Access Token and Refresh Token.
3. User registers company details via `POST /companies`. The user is assigned the `Owner` role. The company begins in `Pending` verification status.
4. Company uploads mandatory verification documents (Commercial Register and Tax Card) via `POST /companies/me/verification-documents`.
5. Company submits for review via `POST /companies/me/verification/submit`, transitioning to `UnderReview`.
6. System Admin reviews company via `/admin/verification/*`. Admin approves, rejects, or requests changes. Once approved, `canPerformCommercialActivities` becomes `true`.

### 2. RFQ & Bidding Workflow
1. Approved Buyer creates RFQ (Draft) via `POST /rfqs`. Line items include industrial category, material, quantity (`decimal(18, 4)`), target unit price, and specifications.
2. Buyer publishes RFQ via `POST /rfqs/{id}/publish`.
3. Approved Suppliers discover published RFQs via `GET /rfqs`.
4. Supplier submits structured bid via `POST /rfqs/{rfqId}/offers` (lead time, shipping included flag, payment terms, validity date, unit price per item).
5. Supplier can negotiate and revise via `POST /offers/{id}/revise`. Each revision supersedes the old offer and increments `revisionNumber` creating an immutable audit trail (`GET /offers/{id}/revisions`).

### 3. Commercial Deal Formation & Execution
1. Buyer accepts winning offer via `POST /offers/{id}/accept`.
2. Atomic backend execution:
   - Sets selected offer to `Accepted`.
   - Creates binding commercial `Deal` with frozen commercial terms snapshot.
   - Automatically marks all competing offers as `Rejected`.
   - Automatically closes parent RFQ.
3. Deal begins in `AwaitingConfirmation`. Both parties independently confirm via `POST /deals/{id}/confirm`. Once both confirm, deal advances to `Confirmed`.
4. Supplier starts fulfillment via `POST /deals/{id}/start`, advancing status to `InProgress`.
5. Either party can complete deal via `POST /deals/{id}/complete` once fulfilled.

### 4. Shipping & Logistics Workflow
1. For confirmed/in-progress deals, Supplier creates shipment via `POST /deals/{dealId}/shipments` (Supplier-Arranged or DealZone-Arranged).
2. For DealZone-Arranged shipments, System Admin assigns a carrier provider via `POST /admin/shipments/{id}/assign-provider`.
3. Tracking milestones (Pending -> Assigned -> PickedUp -> InTransit -> OutForDelivery -> Delivered) are recorded via `/shipments/{id}/status`, building an immutable timeline.

### 5. Disputes & Administrative Resolution
1. Prior to completion, either party may open a dispute via `POST /deals/{id}/disputes` (categories: QualityDefect, QuantityMismatch, LateDelivery, DamagedGoods, NonDelivery, TermsViolation). Deal status becomes `Disputed`.
2. System Admin arbitrates via `POST /admin/disputes/{id}/resolve` choosing either `ResumeDeal` (restores previous confirmed status) or `CancelDeal`.

### 6. Post-Deal Bilateral Reviews
1. Once deal status is `Completed`, Buyer and Supplier may review each other via `POST /deals/{dealId}/reviews` (rating 1-5 and comments).
2. Reviews update public company reputation stats (`GET /companies/{id}/reviews`). Exactly one review per counterparty per deal is enforced.

---

## 7. Visual Identity & Design System Analysis

Extracted directly from the brand guidelines and design identity mockups:

### Brand Archetype & Philosophy
- **Identity:** DealZone represents the **Swift Tern (طائر الخطاف)** — an agile maritime seabird symbolizing speed, long-range navigation, security, and return to safety.
- **Brand Slogan:** *"Trade Smarter. Grow Faster."* / *منصة التجارة الذكية التي تربطك بالفرص*
- **Visual Style:** High-trust enterprise B2B SaaS. Crisp geometry, uncluttered navigation, deep navy foundations balanced by vibrant action cyans, rounded pill accents, and card elevation.

### Color Palette

| Category | Token Name | Hex Code | Purpose / Application |
|---|---|---|---|
| **Primary** | DealZone Navy | `#06245B` | Navbar, footer, headings, hero containers, brand structure |
| **Primary** | DealZone Cyan | `#00D9F5` | Primary CTAs, conversion buttons, active highlights, key metrics |
| **Primary** | Growth Blue | `#1266D6` | Interactive links, secondary icons, badge accents, hover states |
| **Primary** | Pure White | `#FFFFFF` | Card backgrounds, pure white text on dark surfaces |
| **Secondary** | Ice Blue | `#EAF4FF` | Section backgrounds, card tint, badge fills, active row highlights |
| **Secondary** | Cloud Gray | `#F4F7FB` | Main application canvas background, table alternating fills |
| **Secondary** | Slate Gray | `#64748B` | Secondary text, data labels, table headers, captions |
| **Secondary** | Deep Blue | `#123878` | Gradient anchor, dark hover states, deep card borders |
| **Status** | Success Green | `#10B981` | Approved badges, confirmed deals, delivered shipments |
| **Status** | Warning Amber | `#F59E0B` | Pending verification, awaiting confirmation, revision notices |
| **Status** | Error Red | `#EF4444` | Rejected offers, disputes, failed shipments, form errors |
| **Status** | Info Blue | `#3B82F6` | Informational callouts, in-transit shipping events |

### Gradients
- **DealZone Digital (Hero / Marketing):** `linear-gradient(135deg, #06245B 0%, #1266D6 50%, #00D9F5 100%)`
- **DealZone Trust (Dark Surfaces / Cards):** `linear-gradient(180deg, #041638 0%, #06245B 60%, #164B91 100%)`

### Typography Scale (Cairo for Arabic, Inter for Latin)
- **H1 (Hero / Page Title):** Bold 32px / line-height 40px
- **H2 (Section Header / Card Header):** Semibold 24px / line-height 32px
- **H3 (Sub-header / Modal Title):** Semibold 20px / line-height 28px
- **Body Text:** Regular 16px / line-height 24px
- **Small / Meta / Captions:** Regular/Medium 14px / line-height 20px
- **Micro / Badges:** Medium 12px / line-height 16px

### UI Conventions & Spacing
- **Border Radii:** `rounded-lg` (8px) for inputs/cards, `rounded-xl` (12px) for modals/containers, `rounded-full` (9999px) for pill buttons & badges.
- **Elevation Shadows:** Soft, diffuse shadows (`0 4px 20px -2px rgba(6, 36, 91, 0.08)`).
- **60-30-10 Color Rule:** 60% Canvas/White (`#F4F7FB` & `#FFFFFF`), 30% Brand Navy/Slate (`#06245B` & `#64748B`), 10% Cyan/Action Accent (`#00D9F5`).

---

## 8. Current Technology Assessment (Legacy Frontend vs. Modern Requirements)

### Existing Frontend Findings (from `src.zip`)
1. **Architecture:** Flat prototype structure without domain feature boundaries (`src/pages/`, `src/components/`).
2. **State & Data Flow:** Monolithic `AppContext.jsx` holding all state in memory and syncing with mock `localStorage`. No actual backend API calls.
3. **Discrepancies with Backend:**
   - Mentions online escrow credit card payments (`EscrowPayment.jsx`), whereas the backend handles contract terms with off-platform/invoice settlement.
   - Uses generic "auctions" terminology (`CreateTenderPage.jsx`, `auctions.placeBid`) instead of the backend's structured `Rfqs` and `Offers` revision domain.
   - Mentions a static products catalog managed by suppliers (`MyProducts.jsx`), whereas the backend uses a platform-wide centralized raw material taxonomy (`MaterialCategory` & `MaterialDefinition`) that suppliers bid on.
   - Role management is simplified to a string `user.type === 'manufacturer' | 'supplier' | 'admin'` rather than granular roles (`Owner`, `Admin`, `ProcurementManager`, `SalesManager`, `Member`).
4. **Visuals:** Uses old generic Tailwind styling (`#1A73E8` Google blue) rather than the official DealZone Navy (`#06245B`) and Cyan (`#00D9F5`) visual identity.

---

## 9. Recommended Modern Frontend Stack

| Layer / Concern | Recommended Technology | Justification |
|---|---|---|
| **Framework / Runtime** | **React 19 + Vite 6** | Fastest build tool, HMR, lightweight bundle size, standard in enterprise SPAs. |
| **Language** | **TypeScript 5.7+** | Essential for B2B data integrity. Generates type safety directly from backend DTOs. |
| **Routing** | **React Router v7** | Standard declarative routing with nested layout routes, loaders, and action protections. |
| **Server State & Caching** | **TanStack Query v5** | Industry standard for API query caching, optimistic mutations, background polling, and cache invalidation. |
| **Client State** | **Zustand** | Minimalist, unopinionated store for UI state (theme, drawer toggles, active tenant metadata). |
| **HTTP Client** | **Axios** | Robust request/response interceptors for JWT bearer token attachment, automatic token rotation on 401, and ProblemDetails extraction. |
| **Forms & Validation** | **React Hook Form + Zod** | Uncontrolled high-performance forms with declarative Zod schemas matching backend FluentValidation rules. |
| **UI Components & Styling** | **Tailwind CSS v4 + Radix UI Primitives** | Headless accessible components (Dialog, DropdownMenu, Tabs, Tooltip) with the exact DealZone design system. |
| **Icons** | **Lucide React** | Consistent, modern icon set aligned with the brand design guidelines. |
| **Charts & Analytics** | **Recharts** | Lightweight SVG-based chart library for dashboard analytics (spend, deal volumes, rating trends). |
| **Internationalization** | **i18next + react-i18next** | Enterprise localization supporting Arabic (RTL) and English (LTR) with dynamic font family switching (Cairo / Inter). |

---

## 10. Proposed Frontend Folder Structure

```
frontend/
├── public/
│   ├── assets/
│   │   ├── brand/               # Official DealZone logo variations, favicon, icon marks
│   │   └── images/              # Hero banners, shipping illustrations, empty states
│   └── locales/
│       ├── ar/                  # Arabic translations (namespaces: common, auth, rfq, deals...)
│       └── en/                  # English translations
├── src/
│   ├── app/                     # Application entry, router, global providers
│   │   ├── providers/           # QueryClientProvider, AuthProvider, ThemeProvider, DirectionProvider
│   │   ├── router/              # AppRouter, route definitions, RoleRouteGuard
│   │   ├── App.tsx              # Root component
│   │   └── main.tsx             # Entry script
│   │
│   ├── assets/                  # Bundled SVGs and styles
│   │   └── styles/
│   │       ├── globals.css      # Tailwind directives & CSS variables
│   │       └── fonts.css        # Cairo & Inter font-face declarations
│   │
│   ├── shared/                  # Reusable across all features
│   │   ├── api/                 # Axios instance, interceptors, error parsers
│   │   ├── components/          # Design system components
│   │   │   ├── ui/              # Button, Input, Select, Badge, Card, Modal, Table, Tabs, Dropdown
│   │   │   ├── feedback/        # SkeletonLoader, EmptyState, ErrorAlert, Toast
│   │   │   └── layout/          # Navbar, Sidebar, PageContainer, Header, Footer
│   │   ├── hooks/               # useDebounce, useDirection, useMediaQuery, useDisclosure
│   │   ├── types/               # Common backend types (PagedResult, ProblemDetails, ApiResult)
│   │   └── utils/               # Currency formatters (EGP), unit formatters (MT/kg), date helpers
│   │
│   └── features/                # Domain-driven feature modules
│       ├── auth/                # Login, Register, ConfirmEmail, ForgotPassword, ResetPassword
│       │   ├── api/             # authQueries, authMutations
│       │   ├── components/      # LoginForm, RegisterForm, PasswordStrengthMeter
│       │   ├── hooks/           # useAuth
│       │   ├── types/           # Auth DTOs
│       │   └── pages/           # LoginPage, RegisterPage, EmailVerificationPage
│       │
│       ├── company/             # Company profile, members, KYC verification
│       │   ├── api/             # companyQueries, uploadVerificationDoc
│       │   ├── components/      # DocumentUploader, VerificationStatusBadge, CompanyDetailsCard
│       │   └── pages/           # CompanyProfilePage, VerificationPage
│       │
│       ├── catalog/             # Public hierarchical raw materials taxonomy
│       │   ├── api/             # catalogQueries
│       │   ├── components/      # CategoryTree, MaterialCard, UnitBadge
│       │   └── pages/           # CatalogExplorePage, MaterialDetailPage
│       │
│       ├── rfqs/                # Buyer RFQ creation, editing, closing, discovery feed
│       │   ├── api/             # rfqQueries, rfqMutations
│       │   ├── components/      # RfqItemRow, RfqStatusBadge, RfqFilterBar, CreateRfqModal
│       │   └── pages/           # BuyerRfqsPage, SupplierDiscoveryPage, RfqDetailPage
│       │
│       ├── offers/              # Supplier bidding, revision lineage, buyer acceptance/rejection
│       │   ├── api/             # offerQueries, offerMutations
│       │   ├── components/      # OfferRevisionTimeline, OfferItemPriceInput, AcceptOfferModal
│       │   └── pages/           # SupplierOffersPage, ReceivedOffersPage, OfferDetailPage
│       │
│       ├── deals/               # Contract deals, mutual confirmation, cancellation, disputes
│       │   ├── api/             # dealQueries, dealMutations
│       │   ├── components/      # DealStatusStepper, TermsSnapshotView, DisputeModal
│       │   └── pages/           # DealsListPage, DealDetailPage
│       │
│       ├── shipping/            # Logistics arrangements, tracking timeline, provider assignments
│       │   ├── api/             # shippingQueries, shippingMutations
│       │   ├── components/      # TrackingEventTimeline, CreateShipmentModal, CarrierBadge
│       │   └── pages/           # ShipmentsListPage, ShipmentDetailPage
│       │
│       ├── reviews/             # Verified post-deal ratings & public reputation
│       │   ├── api/             # reviewQueries, reviewMutations
│       │   ├── components/      # StarRating, ReviewCard, ReputationSummary
│       │   └── pages/           # CompanyReviewsPage
│       │
│       ├── notifications/       # User notification drawer, badge counters
│       │   ├── api/             # notificationQueries
│       │   └── components/      # NotificationBell, NotificationList, NotificationItem
│       │
│       └── admin/               # SystemAdmin portal (verification, catalog, disputes, shipping)
│           ├── api/             # adminQueries
│           ├── components/      # PendingCompanyRow, DisputeResolutionModal
│           └── pages/           # AdminVerificationPage, AdminDisputesPage, AdminCatalogPage
```

---

## 11. API Integration Strategy

### Axios & Token Lifecycle Management
1. **Request Interceptor:**
   - Reads `accessToken` from secure in-memory state.
   - Appends `Authorization: Bearer <token>` to all protected calls.
   - Adds `Accept-Language: ar` or `en` header to assist content negotiation.
2. **Response Interceptor & Token Rotation:**
   - Detects `401 Unauthorized` responses.
   - Enqueues concurrent failing requests.
   - Invokes `POST /api/v1/auth/refresh` using the stored `refreshToken`.
   - On refresh success: Updates tokens and replays the original queued requests with the new bearer token.
   - On refresh failure (or token replay breach): Clears local authentication state and redirects to `/login`.
3. **RFC 7807 ProblemDetails Normalization:**
   - Automatically maps `400 Bad Request` validation error dictionaries (`errors: { Field: ["error message"] }`) directly into React Hook Form error states.
   - Extracts `traceId` for presentation on error toasts.
   - On `403 Forbidden`: Displays an accessible *"Verification Required"* or *"Unauthorized Role"* modal without logging the user out.
   - On `409 Conflict`: Identifies optimistic concurrency conflicts and triggers query invalidation to refresh the latest database state.

### TanStack Query Conventions
- **Structured Query Keys:**
  - `['rfqs', 'mine', { status, page }]`
  - `['rfqs', 'discovery', { categoryId, searchTerm, page }]`
  - `['offers', 'by-rfq', rfqId]`
  - `['deals', dealId]`
  - `['notifications', 'unread-count']`
- **Cache Invalidation:**
  - Accepting an offer invalidates `['offers', 'by-rfq', rfqId]`, `['rfqs', rfqId]`, and `['deals']`.
  - Confirming a deal invalidates `['deals', dealId]`.

---

## 12. State Management Strategy

### Separation of Concerns
1. **Server State (TanStack Query):**
   - Handles all remote API entity data, caching, pagination, deduplication, and refetching.
2. **Global Client State (Zustand):**
   - `authStore`: User identity, company reference, roles, authentication status.
   - `uiStore`: Sidebar collapsed state, active notification popover, modal disclosure states.
3. **Local Component State (React `useState` / `useReducer`):**
   - Transient form inputs, tab selection, modal internal step index.

---

## 13. Routing & Role-Based Access Strategy

```
/
├── (Public Layout)
│   ├── /                          # Modern Landing Page (Visual Identity)
│   ├── /about                     # Platform Mission & Trust Framework
│   ├── /catalog                   # Public Raw Material Taxonomy
│   ├── /login                     # Authentication
│   ├── /register                  # Account Creation
│   ├── /confirm-email             # Email Token Validation
│   ├── /forgot-password           # Password Reset Request
│   └── /reset-password            # Password Reset Completion
│
├── (Authenticated App Layout)
│   ├── /onboarding/company        # Create Company Profile (if user.company == null)
│   ├── /onboarding/verification   # Upload KYC Docs & Submit (if status != Approved)
│   │
│   ├── (Commercial Routes - Require Approved Verification Status)
│   │   ├── /dashboard             # Role-specific Dashboard (Buyer or Supplier metrics)
│   │   │
│   │   ├── /rfqs                  # Buyer: My RFQs / Supplier: Discovery Feed
│   │   ├── /rfqs/create           # Buyer: Create RFQ (Owner, Admin, ProcurementManager)
│   │   ├── /rfqs/:id              # RFQ Details & Incoming / Submitted Offers
│   │   │
│   │   ├── /offers                # Supplier: My Submitted Offers
│   │   ├── /offers/:id/revisions  # Offer Revision History
│   │   │
│   │   ├── /deals                 # Active Deals List
│   │   ├── /deals/:id             # Deal Tracking, Status Stepper & Disputes
│   │   │
│   │   ├── /shipments/:id         # Shipment Tracking & Milestone Timeline
│   │   ├── /companies/:id/reviews # Public Reputation View
│   │   └── /settings              # Profile & Company Settings
│   │
│   └── (SystemAdmin Layout - Policy: SystemAdmin)
│       ├── /admin/verification    # Company Approval / Changes Queue
│       ├── /admin/catalog         # Categories & Material Master Data
│       ├── /admin/disputes        # Arbitration Portal (Resume / Cancel)
│       └── /admin/shipping        # Shipping Providers & DealZone Logistics
```

---

## 14. Internationalization & RTL/LTR Strategy

- **Dual-Language Foundation:** Full native Arabic (`ar-EG`) and English (`en-US`) support.
- **Direction Switching:** Toggling language sets `document.documentElement.dir = 'rtl' | 'ltr'` and `document.documentElement.lang = 'ar' | 'en'`.
- **Dynamic Font Switching:**
  - Latin (`en`): `Inter, -apple-system, sans-serif`
  - Arabic (`ar`): `Cairo, Tahoma, sans-serif`
- **Tailwind Logical Properties:** Use logical padding and margins (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) instead of directional classes (`ml-*`, `mr-*`, `left-*`, `right-*`) to ensure seamless mirrored layouts in RTL.
- **Bilingual Backend Models:** The backend returns bilingual catalog properties (`nameAr` / `nameEn`, `descriptionAr` / `descriptionEn`). The frontend automatically renders the active locale's string with automatic fallback.

---

## 15. Dark/Light Theme Strategy

- **Default Theme:** Crisp Light Theme (`#F4F7FB` canvas with `#FFFFFF` elevated cards and `#06245B` brand navy structure), matching the primary brand design guidelines.
- **Contrast Ratios:** All text tokens comply with WCAG 2.1 AA (minimum 4.5:1 contrast against surfaces).
- **CSS Variable Mapping:** All color tokens are defined as CSS variables with HSL/Hex equivalents in `globals.css` to allow smooth dark theme switching in the future without hardcoded styling debt.

---

## 16. Security Considerations

1. **Token Security:**
   - Access tokens kept in memory / React Context.
   - Refresh tokens stored securely. No tokens exposed in URLs or logged to console in production.
2. **XSS Mitigation:**
   - All server-provided text sanitized via React's JSX escaping.
   - Material specification fields and notes rendered as safe text without raw `dangerouslySetInnerHTML`.
3. **Private Data Isolation:**
   - Tax ID and commercial registration numbers are restricted to `/companies/me/contact-details` and never displayed to other marketplace participants.
4. **Idempotency & Concurrency:**
   - Critical action buttons (Confirm Deal, Accept Offer, Submit Bid) automatically disable and display loading spinners upon first click to prevent accidental double-posts.
   - Optimistic concurrency collisions (HTTP 409) prompt the user with a notification to refresh and view the updated record.

---

## 17. Performance Considerations

1. **Route-Based Code Splitting:**
   - All major feature views loaded asynchronously using `React.lazy()` and `Suspense` with skeleton fallback loaders.
2. **Numeric & High Precision Formatting:**
   - Quantities formatted up to 4 decimal places (`decimal(18, 4)`) using localized number formatters without roundoff distortion.
3. **Virtualization for Long Lists:**
   - Paged results for catalog materials and marketplace feeds maintain small, responsive DOM sizes.
4. **Asset Optimization:**
   - Brand SVG vector graphics for all logos and emblems to maintain sharpness on high-DPI displays without payload bloat.

---

## 18. Potential Integration Challenges & Mitigations

| Challenge | Risk | Mitigation Strategy |
|---|---|---|
| **Terminology Mismatch** | Old frontend uses "Auctions" & "Escrow Payment"; backend uses "RFQs", "Offer Revisions" & "Contract Deals". | Normalize frontend UI to match backend reality: rename Auctions to RFQs/Tenders, replace simulated escrow credit card checkouts with formal Commercial Agreement milestones. |
| **B2B Multi-Role Permissions** | Five distinct company roles plus SystemAdmin with granular operation rights. | Implement an authoritative `usePermission` hook verifying role capabilities before rendering mutation buttons (e.g. only `SalesManager` can submit offer). |
| **Two-Phase Company Verification** | Unverified companies cannot perform commercial actions. | Global application banner and route guard redirecting unverified users to `/onboarding/verification` before accessing RFQs. |
| **Bilingual Data Fallback** | Backend returns dual Arabic/English fields for catalog, but user input is freeform. | Create a helper utility `getLocalizedField(item, 'name', language)` ensuring smooth rendering even if one language is omitted. |

---

## 19. Frontend Modernization & Migration Roadmap

The migration from the existing prototype to the modern enterprise application will proceed in structured stages:

```
Phase 1: Project Scaffolding & Design System Foundation
  ├── Initialize Vite + React 19 + TypeScript + Tailwind CSS
  ├── Configure Cairo & Inter typography, DealZone Navy/Cyan color tokens
  ├── Build core shared UI library (Button, Badge, Card, Table, Modal, Toast)
  └── Establish Axios client with ProblemDetails parser & JWT token interceptor

Phase 2: Authentication & Company Onboarding
  ├── Implement Login, Register, Email Confirmation, and Password Reset
  ├── Build Company Profile setup and KYC Document Uploader (Commercial Register / Tax Card)
  └── Create Verification Status tracking view

Phase 3: Public Catalog & RFQ Management
  ├── Hierarchical bilingual Raw Material Catalog browsing
  ├── Buyer RFQ Creation form (with multi-item decimal quantity inputs)
  ├── Buyer "My RFQs" management dashboard
  └── Supplier Marketplace Discovery feed with category/location filters

Phase 4: Offers, Bidding & Deal Formation
  ├── Supplier Offer submission and Revision lineage (R1, R2, R3)
  ├── Buyer Offer evaluation, rejection, and atomic acceptance
  └── Deal creation view with frozen commercial terms snapshot

Phase 5: Logistics, Disputes & Reviews
  ├── Mutual Deal Confirmation workflow
  ├── Shipping arrangement (Supplier-Arranged vs DealZone-Arranged) & Tracking timeline
  ├── Dispute opening and SystemAdmin resolution view
  └── Bilateral post-deal review submission & public company reputation

Phase 6: In-App Notifications, Polish & Verification
  ├── Real-time notification drawer and unread badge counters
  ├── Full RTL/LTR layout verification in Arabic and English
  └── End-to-end integration testing against the live backend API
```

---

## Conclusion & Readiness

The backend architecture is complete, verified by 228 passing tests, and ready for integration. The visual identity has been extracted into a cohesive design system centered on DealZone Navy and Cyan. We are fully prepared to inspect the old frontend codebase and begin the modernization phase.

