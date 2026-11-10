# DealZone — Demo Data Seeder Architectural & Audit Report

> **Architecture:** EF Core 10 / Microsoft SQL Server  
> **Target Database:** `DealZoneDb` on `localhost\SQL2025`  
> **Safety Guard:** Disabled by default in production. Activated via configuration flags.

---

## 1. Safety & Idempotency Architecture

The demo seeding engine is built into `backend/src/DealZone.Infrastructure/Seeding/DemoDataSeeder.cs` and features strict production safety guarantees:

### 1.1 Activation Guards
Demo data seeding will **NEVER** run unless explicitly enabled in configuration:
```json
{
  "SeedDemoData": true,
  "ResetDemoData": false
}
```
Or via the environment variable:
```bash
DEALZONE_DEMO_SEED_ENABLED=true
```

### 1.2 Isolated Sample Namespace
- All generated company entities are prefixed with `[Sample]`.
- All demo user emails belong strictly to the `@dealzone.eg` domain (e.g. `demo.*@dealzone.eg`).
- Commercial registration numbers are uniquely prefixed `DEMO-CR-XXXXX`.
- No real-world customer or vendor data can be affected by the seeder.

### 1.3 Safe Reset Mechanism (`PurgeSampleDataAsync`)
When `"ResetDemoData": true` is specified, the seeder uses high-performance, atomic EF Core `ExecuteDeleteAsync()` statements that respect foreign key hierarchies in exact reverse dependency order:
1. `Notifications`
2. `Reviews`
3. `DealDisputes`
4. `Shipments`
5. `Deals`
6. `DirectPurchases`
7. `BidItems` & `Bids`
8. `TenderItems` & `Tenders`
9. `OfferItems` & `Offers`
10. `RfqItems` & `Rfqs`
11. `CatalogProducts`
12. `VerificationDecisions` & `VerificationDocuments`
13. `CompanyContactDetails` & `CompanyMembers`
14. `Companies` (Soft-deleted and active records via `.IgnoreQueryFilters()`)
15. `RefreshTokens` & `Users`

This ensures 100% clean resets with zero conceptual null exceptions or circular dependency locks.

---

## 2. Seed Execution Log & Validation Results

```text
================== DEALZONE SEED VERIFICATION ==================
Companies (Total):          10
Companies ([Sample]):       10
Users (Demo & Admin):       12
Material Categories:        3
Materials (Total Active):   8
Catalog Products:           9
RFQs (Total):               6
Offers (Total):             7
Tenders (Total):            5
Bids (Total):               5
Deals (Total):              7
Direct Purchases (Total):   1
Shipping Providers:         3
Shipments (Total):          4
Deal Disputes (Total):      2
Reviews (Total):            2
Notifications (Total):      13
================================================================
```

### 2.1 Arabic Typography & Encoding Fix
- All raw material records (`Materials`) in the database were sanitized and repaired.
- Eliminated mojibake corruption (`ù^Ø§Ø...`) on `COTTON-YARN-GIZA`, `FOOD-SUGAR-REFINED`, `FOOD-PALM-OLEIN`, `STEEL-BILLET-3SP`, and `POLY-FIBER-PSF`.
- Deactivated non-official materials (`HDPE-BLOW-5502`, `CHEM-ACETONE-995`) from legacy unapproved categories.

---

## 3. How to Run & Reset Demo Data

### Run Demo Seeding (Idempotent update without deleting):
```powershell
dotnet run --project backend/src/DealZone.Api/DealZone.Api.csproj --no-build
```

### Force Complete Clean Reset & Re-Seed:
In `backend/src/DealZone.Api/appsettings.Development.json`:
```json
{
  "SeedDemoData": true,
  "ResetDemoData": true
}
```
Run the application for 10 seconds:
```powershell
dotnet run --project backend/src/DealZone.Api/DealZone.Api.csproj --no-build
```
Then revert `"ResetDemoData": false`.
