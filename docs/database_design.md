# DealZone Database Architecture & Design Specification (Phase 2)

## 1. Executive Summary & Domain Context
DealZone is an Egyptian B2B industrial raw-material marketplace. The database architecture is built on Microsoft SQL Server and EF Core 10, adhering to Clean Architecture principles. It models the end-to-end commercial lifecycle: Company onboarding & compliance, multi-user membership, bilingual raw-material catalog, structured RFQs, structured offer revisions, contractual deals, shipping arrangements, and verified deal reviews.

---

## 2. Global Conventions & Standards
- **Primary Keys:** `uniqueidentifier` (GUID) generated via `SequentialGuid` or application-level `Guid.NewGuid()`.
- **String Types:** All textual columns use `nvarchar` with explicit length bounds to support Arabic (Egyptian market) and English without data truncation.
- **Decimal Precision:**
  - Monetary values: `decimal(18, 2)` in EGP.
  - Raw material quantities: `decimal(18, 4)` for high-precision bulk / chemical measurement.
- **Dates & Times:** All timestamps are `datetimeoffset` storing UTC values.
- **Concurrency:** Commercial transaction tables (`Companies`, `Rfqs`, `Offers`, `Deals`, `Shipments`) implement row-version concurrency tokens (`byte[] RowVersion`).
- **Audit & Soft Deletion:** Audited tables implement `CreatedAtUtc`, `CreatedBy`, `LastModifiedAtUtc`, `LastModifiedBy`, `IsDeleted`. Soft-deleted entities enforce global query filters (`e => !e.IsDeleted`).

---

## 3. Entity Specifications

### Module A: Identity & Company Management

#### 1. `Users`
- **Purpose:** System users, company members, and platform administrators.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `Email` (`nvarchar(256)`, Required, Unique index)
  - `FullName` (`nvarchar(150)`, Required)
  - `PhoneNumber` (`nvarchar(30)`, Optional)
  - `PasswordHash` (`nvarchar(500)`, Required)
  - `IsSystemAdmin` (`bit`, Required, Default: 0)
  - `IsActive` (`bit`, Required, Default: 1)
  - `CreatedAtUtc` (`datetimeoffset`, Required)
  - `LastLoginAtUtc` (`datetimeoffset`, Optional)
- **Relationships:**
  - Many-to-Many with `Companies` via `CompanyMembers`.

#### 2. `Companies`
- **Purpose:** Unified B2B company entity. Can act as both buyer and supplier.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `LegalName` (`nvarchar(200)`, Required)
  - `TradeName` (`nvarchar(200)`, Required)
  - `IndustrySector` (`nvarchar(100)`, Required)
  - `City` (`nvarchar(100)`, Required)
  - `Governorate` (`nvarchar(100)`, Required)
  - `Description` (`nvarchar(1000)`, Optional)
  - `Website` (`nvarchar(255)`, Optional)
  - `VerificationStatus` (`int`, Required: `Pending=0`, `UnderReview=1`, `Approved=2`, `Rejected=3`)
  - `VerifiedAtUtc` (`datetimeoffset`, Optional)
  - `VerifiedByUserId` (`uniqueidentifier`, Optional, FK to `Users`)
  - `RejectionReason` (`nvarchar(500)`, Optional)
  - `PrimaryContactUserId` (`uniqueidentifier`, Required, FK to `Users`)
  - `IsActive` (`bit`, Required, Default: 1)
  - `IsDeleted` (`bit`, Required, Default: 0)
  - `RowVersion` (`rowversion`, Required)
- **Indexes:**
  - `IX_Companies_VerificationStatus`
  - `IX_Companies_Governorate`

#### 3. `CompanyContactDetails` (Privacy Boundary)
- **Purpose:** Strictly isolates private legal registration and contact credentials from public marketplace discovery.
- **Columns:**
  - `CompanyId` (`uniqueidentifier`, PK, FK to `Companies`)
  - `TaxIdNumber` (`nvarchar(50)`, Required, Unique)
  - `CommercialRegistrationNumber` (`nvarchar(50)`, Required, Unique)
  - `CorporateEmail` (`nvarchar(256)`, Required)
  - `CorporatePhone` (`nvarchar(30)`, Required)
  - `AddressLine1` (`nvarchar(250)`, Required)
  - `AddressLine2` (`nvarchar(250)`, Optional)
  - `PostalCode` (`nvarchar(20)`, Optional)
  - `CreatedAtUtc` (`datetimeoffset`, Required)
  - `LastModifiedAtUtc` (`datetimeoffset`, Optional)
- **Unique Constraints:**
  - `IX_CompanyContactDetails_TaxIdNumber` (Unique)
  - `IX_CompanyContactDetails_CommercialRegistrationNumber` (Unique)

#### 4. `CompanyMembers`
- **Purpose:** Multi-user company governance supporting roles (Owner, Admin, ProcurementManager, SalesManager, Member).
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `CompanyId` (`uniqueidentifier`, Required, FK to `Companies`)
  - `UserId` (`uniqueidentifier`, Required, FK to `Users`)
  - `Role` (`int`, Required: `Owner=1`, `Admin=2`, `ProcurementManager=3`, `SalesManager=4`, `Member=5`)
  - `IsPrimary` (`bit`, Required, Default: 0)
  - `IsActive` (`bit`, Required, Default: 1)
  - `JoinedAtUtc` (`datetimeoffset`, Required)
- **Unique Constraints:** `IX_CompanyMembers_CompanyId_UserId` (Unique)

#### 5. `VerificationDocuments`
- **Purpose:** Company registration documents manually reviewed by administrators.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `CompanyId` (`uniqueidentifier`, Required, FK to `Companies`)
  - `DocumentType` (`int`, Required: `CommercialRegister=1`, `TaxCard=2`, `IndustrialRegister=3`, `QualityCertificate=4`, `Other=5`)
  - `FileName` (`nvarchar(255)`, Required)
  - `StorageKey` (`nvarchar(500)`, Required)
  - `ContentType` (`nvarchar(100)`, Required)
  - `FileSizeBytes` (`bigint`, Required)
  - `UploadedAtUtc` (`datetimeoffset`, Required)
  - `Status` (`int`, Required: `Pending=0`, `Approved=1`, `Rejected=2`)
  - `RejectionReason` (`nvarchar(500)`, Optional)
  - `ReviewedAtUtc` (`datetimeoffset`, Optional)
  - `ReviewedByUserId` (`uniqueidentifier`, Optional, FK to `Users`)

---

### Module B: Catalog

#### 6. `MaterialCategories`
- **Purpose:** Standardized hierarchical raw-material classification supporting Arabic and English.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `ParentCategoryId` (`uniqueidentifier`, Optional, Self FK)
  - `Code` (`nvarchar(50)`, Required, Unique)
  - `NameAr` (`nvarchar(150)`, Required)
  - `NameEn` (`nvarchar(150)`, Required)
  - `DescriptionAr` (`nvarchar(500)`, Optional)
  - `DescriptionEn` (`nvarchar(500)`, Optional)
  - `DisplayOrder` (`int`, Required, Default: 0)
  - `IsActive` (`bit`, Required, Default: 1)
  - `CreatedAtUtc` (`datetimeoffset`, Required)
- **Unique Constraints:** `IX_MaterialCategories_Code` (Unique)

---

### Module C: RFQs & Offers

#### 7. `Rfqs`
- **Purpose:** Request for Quotation created by approved buyers.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `RfqNumber` (`nvarchar(30)`, Required, Unique)
  - `BuyerCompanyId` (`uniqueidentifier`, Required, FK to `Companies`)
  - `Title` (`nvarchar(200)`, Required)
  - `Description` (`nvarchar(2000)`, Optional)
  - `Status` (`int`, Required: `Draft=0`, `Published=1`, `Closed=2`, `Cancelled=3`)
  - `DeliveryGovernorate` (`nvarchar(100)`, Required)
  - `DeliveryAddress` (`nvarchar(300)`, Required)
  - `TargetCategoryId` (`uniqueidentifier`, Optional, FK to `MaterialCategories`)
  - `RequiredDeliveryDateUtc` (`datetimeoffset`, Optional)
  - `ClosingDateUtc` (`datetimeoffset`, Required)
  - `PublishedAtUtc` (`datetimeoffset`, Optional)
  - `IsDeleted` (`bit`, Required, Default: 0)
  - `RowVersion` (`rowversion`, Required)
- **Indexes:**
  - `IX_Rfqs_BuyerCompanyId`
  - `IX_Rfqs_Status_ClosingDateUtc`

#### 8. `RfqItems`
- **Purpose:** Line items within an RFQ detailing requested materials.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `RfqId` (`uniqueidentifier`, Required, FK to `Rfqs`)
  - `CategoryId` (`uniqueidentifier`, Required, FK to `MaterialCategories`)
  - `MaterialName` (`nvarchar(200)`, Required)
  - `Specifications` (`nvarchar(1500)`, Required)
  - `Quantity` (`decimal(18, 4)`, Required)
  - `Unit` (`int`, Required: `MetricTon=1`, `Kilogram=2`, `Gram=3`, `Liter=4`, `CubicMeter=5`, `Piece=6`, `Barrel=7`)
  - `TargetPricePerUnit` (`decimal(18, 2)`, Optional)
  - `LineNumber` (`int`, Required)

#### 9. `Offers`
- **Purpose:** Structured quotation submitted by an approved supplier, with revision history tracking.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `OfferNumber` (`nvarchar(30)`, Required, Unique)
  - `RfqId` (`uniqueidentifier`, Required, FK to `Rfqs`)
  - `SupplierCompanyId` (`uniqueidentifier`, Required, FK to `Companies`)
  - `OriginalOfferId` (`uniqueidentifier`, Optional, Self FK for revision lineage)
  - `RevisionNumber` (`int`, Required, Default: 1)
  - `Status` (`int`, Required: `Submitted=0`, `UnderReview=1`, `Accepted=2`, `Rejected=3`, `Superseded=4`, `Withdrawn=5`, `Expired=6`)
  - `TotalAmount` (`decimal(18, 2)`, Required)
  - `Currency` (`nvarchar(3)`, Required, Default: "EGP")
  - `ValidityDateUtc` (`datetimeoffset`, Required)
  - `DeliveryLeadTimeDays` (`int`, Required)
  - `ShippingIncluded` (`bit`, Required, Default: 0)
  - `PaymentTerms` (`nvarchar(250)`, Required)
  - `Notes` (`nvarchar(1000)`, Optional)
  - `SubmittedAtUtc` (`datetimeoffset`, Required)
  - `RowVersion` (`rowversion`, Required)
- **Unique Constraints:** `IX_Offers_RfqId_SupplierCompanyId_RevisionNumber` (Unique)

#### 10. `OfferItems`
- **Purpose:** Individual priced lines corresponding to RFQ items.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `OfferId` (`uniqueidentifier`, Required, FK to `Offers`)
  - `RfqItemId` (`uniqueidentifier`, Required, FK to `RfqItems`)
  - `UnitPrice` (`decimal(18, 2)`, Required)
  - `OfferedQuantity` (`decimal(18, 4)`, Required)
  - `TotalPrice` (`decimal(18, 2)`, Required)
  - `MaterialSpecifications` (`nvarchar(1500)`, Optional)
  - `Notes` (`nvarchar(500)`, Optional)

---

### Module D: Deals, Shipping & Reviews

#### 11. `Deals`
- **Purpose:** Binding contractual transaction formed when a buyer accepts an offer.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `DealNumber` (`nvarchar(30)`, Required, Unique)
  - `RfqId` (`uniqueidentifier`, Required, FK to `Rfqs`)
  - `OfferId` (`uniqueidentifier`, Required, FK to `Offers`, Unique)
  - `BuyerCompanyId` (`uniqueidentifier`, Required, FK to `Companies`)
  - `SupplierCompanyId` (`uniqueidentifier`, Required, FK to `Companies`)
  - `AgreedPrice` (`decimal(18, 2)`, Required)
  - `Currency` (`nvarchar(3)`, Required, Default: "EGP")
  - `Status` (`int`, Required: `PendingConfirmation=0`, `Confirmed=1`, `InProgress=2`, `Disputed=3`, `Completed=4`, `Cancelled=5`)
  - `ConfirmedAtUtc` (`datetimeoffset`, Optional)
  - `CompletedAtUtc` (`datetimeoffset`, Optional)
  - `CancelledAtUtc` (`datetimeoffset`, Optional)
  - `CancellationReason` (`nvarchar(500)`, Optional)
  - `CreatedAtUtc` (`datetimeoffset`, Required)
  - `RowVersion` (`rowversion`, Required)
- **Unique Constraints:**
  - `IX_Deals_DealNumber` (Unique)
  - `IX_Deals_OfferId` (Unique)

#### 12. `DealDisputes`
- **Purpose:** Formal dispute arbitration records for contested deals.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `DealId` (`uniqueidentifier`, Required, FK to `Deals`)
  - `OpenedByCompanyId` (`uniqueidentifier`, Required, FK to `Companies`)
  - `OpenedByUserId` (`uniqueidentifier`, Required, FK to `Users`)
  - `Reason` (`nvarchar(200)`, Required)
  - `Description` (`nvarchar(2000)`, Required)
  - `Status` (`int`, Required: `Open=0`, `UnderReview=1`, `ResolvedInBuyerFavor=2`, `ResolvedInSupplierFavor=3`, `Dismissed=4`)
  - `ResolutionNotes` (`nvarchar(2000)`, Optional)
  - `ResolvedByUserId` (`uniqueidentifier`, Optional, FK to `Users`)
  - `OpenedAtUtc` (`datetimeoffset`, Required)
  - `ResolvedAtUtc` (`datetimeoffset`, Optional)

#### 13. `ShippingProviders`
- **Purpose:** Administrator-managed third-party transport and freight carriers.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `Name` (`nvarchar(150)`, Required, Unique)
  - `ContactPerson` (`nvarchar(100)`, Required)
  - `Phone` (`nvarchar(30)`, Required)
  - `Email` (`nvarchar(256)`, Required)
  - `SupportedGovernorates` (`nvarchar(500)`, Optional)
  - `IsActive` (`bit`, Required, Default: 1)
  - `CreatedAtUtc` (`datetimeoffset`, Required)

#### 14. `Shipments`
- **Purpose:** Physical fulfillment tracking for raw material deliveries.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `DealId` (`uniqueidentifier`, Required, FK to `Deals`)
  - `Arrangement` (`int`, Required: `SupplierArranged=1`, `DealZoneArranged=2`)
  - `ShippingProviderId` (`uniqueidentifier`, Optional, FK to `ShippingProviders`)
  - `TrackingNumber` (`nvarchar(100)`, Optional)
  - `PickupAddress` (`nvarchar(300)`, Required)
  - `DeliveryAddress` (`nvarchar(300)`, Required)
  - `Status` (`int`, Required: `Draft=0`, `ReadyForPickup=1`, `PickedUp=2`, `InTransit=3`, `Delivered=4`, `DeliveryFailed=5`)
  - `PickupDateUtc` (`datetimeoffset`, Optional)
  - `EstimatedDeliveryDateUtc` (`datetimeoffset`, Optional)
  - `ActualDeliveryDateUtc` (`datetimeoffset`, Optional)
  - `Notes` (`nvarchar(1000)`, Optional)
  - `CreatedAtUtc` (`datetimeoffset`, Required)
  - `RowVersion` (`rowversion`, Required)

#### 15. `Reviews`
- **Purpose:** Bilateral ratings and verified reviews permitted exclusively after deal completion.
- **Columns:**
  - `Id` (`uniqueidentifier`, PK)
  - `DealId` (`uniqueidentifier`, Required, FK to `Deals`)
  - `ReviewerCompanyId` (`uniqueidentifier`, Required, FK to `Companies`)
  - `TargetCompanyId` (`uniqueidentifier`, Required, FK to `Companies`)
  - `Rating` (`int`, Required, Range: 1 to 5)
  - `Comment` (`nvarchar(1000)`, Required)
  - `CreatedAtUtc` (`datetimeoffset`, Required)
  - `IsDeleted` (`bit`, Required, Default: 0)
- **Unique Constraints:** `IX_Reviews_DealId_ReviewerCompanyId` (Unique)
- **Business Invariant:** Deal state must be `Completed` prior to review creation.

