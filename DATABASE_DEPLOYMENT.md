# Database Deployment & Migration Guide — SQL Server

This guide provides instructions for deploying and migrating the **DealZone** Microsoft SQL Server database for production on **MonsterASP.NET** or any hosted SQL Server instance.

---

## 1. Overview of EF Core Migrations

The DealZone database schema is fully managed via Entity Framework Core migrations. All 17 migration steps are recorded sequentially:

1. `20261030143637_InitialCreate` — Core tables (Users, Companies, Roles)
2. `20261030150059_AddAuthenticationAndRefreshTokens`
3. `20261030155236_AddVerificationWorkflow` — Document verification
4. `20261030162115_AddCatalogAndRfqManagement` — Material taxonomy & RFQ entities
5. `20261030170921_AddOffersAndNegotiation` — Offer submissions
6. `20261030173630_AddDealsAndDisputesLifecycle` — Commercial agreements & disputes
7. `20261030175518_AddShippingAndReviews` — Shipments & provider reviews
8. `20261030183944_AddNotifications` — In-app notifications
9. `20261030194444_AddConcurrencyUniqueIndexes` — RowVersion tokens & index constraints
10. `20261108204006_AddCompanyTypeToCompany` — Buyer, Supplier, Both distinctions
11. `20261108210735_UserRoles`
12. `20261109235010_AddOfferWithdrawalAndRfqSequence` — Downward revision & sequence generator
13. `20261110010129_AddTenderAndReverseBidding` — Reverse bidding schema
14. `20261110015941_Tenders`
15. `20261110020729_Tenders2`
16. `20261110180936_AddDirectCatalogPurchasingAndRestrictedCategories` — Buy Now flow & 3-category restriction
17. `20261111180118_UnifiedMarketplaceAndProcurementRefactor` — Free-text catalog, Product Negotiations, and RFQ award consolidation

---

## 2. Deployment Script: `DealZone_Full_Idempotent_Migrations.sql`

We have generated an **idempotent SQL migration script** located at:
`backend/src/DealZone.Infrastructure/Persistence/Scripts/DealZone_Full_Idempotent_Migrations.sql`

### What "Idempotent" Means:
- The script checks the `[__EFMigrationsHistory]` table before applying any migration.
- If run against a completely **fresh database**, it builds the entire schema from scratch.
- If run against an **existing database**, it safely applies only the migrations that haven't been applied yet.
- It will **never destroy, drop, or duplicate** existing data.

---

## 3. How to Execute the Script via SSMS

1. Open **SQL Server Management Studio (SSMS)**.
2. Connect to your MonsterASP SQL Server instance:
   - **Server name:** e.g., `mssqlX.monsterasp.net,1433`
   - **Authentication:** `SQL Server Authentication`
   - **Login:** Your MonsterASP database username
   - **Password:** Your MonsterASP database password
3. In Object Explorer, locate your assigned database (e.g. `dealzone_db`).
4. Click **New Query** (ensure the database dropdown is set to your database, NOT `master`).
5. Open or paste the contents of `DealZone_Full_Idempotent_Migrations.sql`.
6. Click **Execute** (or press `F5`).
7. Confirm that the query executes successfully with `Commands completed successfully.`

---

## 4. Production Baseline Seed Data

In production (`ASPNETCORE_ENVIRONMENT=Production`):
- `DemoDataSeeder.cs` is **disabled automatically**. Dummy demo companies and transactions are **never** injected into the production database.
- Initial baseline material categories (`Textiles`, `Food`, `Metals`) and standard units of measurement can be seeded safely via `CatalogSeeder.cs` or admin endpoints.
- An initial platform Administrator account can be seeded via the environment variable:
  `AdminSettings__SeedAdminEmail=admin@dealzone.eg`

---

## 5. Backup & Recovery Strategy

1. **MonsterASP Automated Backups:**
   - MonsterASP provides daily backup snapshots in their control panel under **MS SQL Databases** > **Backups**.
2. **Manual On-Demand Backups:**
   - In SSMS, you can generate a complete data and schema export (`.bacpac` or `.sql` script with data) before major platform updates:
     - Right-click Database > **Tasks** > **Generate Scripts...**
     - Select "Schema and Data" under Advanced Scripting Options.
