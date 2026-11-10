# DealZone — Comprehensive Demo Guide & Product Demonstration Playbook

> **Platform Version:** DealZone Enterprise Egyptian B2B Raw Materials Marketplace  
> **Environment:** Demo & Staging Demonstration Dataset  
> **Master Demo Password for all accounts:** `DealZone@2026`

---

## 1. Demo Accounts & Personas Directory

All demo accounts are pre-configured with active business roles, enterprise affiliations, and clean verifiable Egyptian industrial credentials.

| Role | Email | Company | Verification | Focus Scenarios |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | `admin@dealzone.eg` | DealZone Platform Ops | Superadmin | Verification Queue, Disputes, Shipping, Audit Logs |
| **Buyer 1 (Lead)** | `demo.buyer@dealzone.eg` | [Sample] المصرية للصناعات الهندسية (العاشر من رمضان) | Approved | RFQs, Tenders, Live Bidding, Deal Negotiation, Orders |
| **Buyer 2 (Food)** | `demo.buyer2@dealzone.eg` | [Sample] مصر للحلويات والأغذية الصناعية (أكتوبر) | Approved | Food Sourcing, Closed Tenders, Direct Purchases |
| **Procurement Specialist** | `demo.procurement@dealzone.eg` | [Sample] المصرية للصناعات الهندسية | Approved | Multi-user company workflows, RFQ Drafting |
| **New Buyer** | `demo.newbuyer@dealzone.eg` | [Sample] الفتح للمشغولات وتشكيل المعادن (حلوان) | Approved | Fresh empty state exploration, first RFQ creation |
| **Supplier 1 (Metals)** | `demo.supplier@dealzone.eg` | [Sample] الأهرام لتوريدات الصلب (أكتوبر) | Approved | Catalog Seller, RFQ Offers, Live Reverse Bidding Leader |
| **Supplier 2 (Textiles)** | `demo.supplier2@dealzone.eg` | [Sample] المحلة للغزول والمنسوجات (المحلة الكبرى) | Approved | Tender Winning Bid, In-Transit Shipments, Reviews |
| **Supplier 3 (Food/Sugar)** | `demo.supplier3@dealzone.eg` | [Sample] الدلتا لتجارة وتكرير السكر (السادات) | Approved | Bulk Sugar Supply, Direct Orders, Offer Withdrawal |
| **Dual Role Enterprise** | `demo.dual@dealzone.eg` | [Sample] الإسكندرية للتجارة والتصنيع المشترك (برج العرب) | Approved | Dual Mode Switching (Buyer ↔ Supplier in Header) |
| **Pending Verification** | `demo.pending@dealzone.eg` | [Sample] النيل للنسيج وتجهيز الأقمشة (قليوب) | Under Review | 3 Official Documents in Admin Verification Queue |
| **Unverified Supplier** | `demo.newsupplier@dealzone.eg` | [Sample] الصعيد لصهر ودرفلة المعادن (بني سويف) | Pending | Unverified Banner, Restricted Action Triggers |
| **Rejected Supplier** | `demo.rejected@dealzone.eg` | [Sample] مؤسسة الأمل التجارية للتوريدات (بورسعيد) | Rejected | Rejection banner with administrative reasons |

---

## 2. Curated Product Demonstration & Video Recording Paths

### Path A: The 2-Minute Executive Investor Pitch
1. **Landing Page (`/`):**
   - Showcase modern industrial branding, metrics (100% Egyptian raw materials), 3 official categories (Metals, Textiles, Food).
   - Click "تصفح الكتالوج" to browse 9 catalog offerings with active MOQ, pricing in EGP, and stock levels.
2. **Login as Dual Role Enterprise (`demo.dual@dealzone.eg`):**
   - Showcase seamless **Role Switcher** in the banner: Switch from **"لوحة المشتري"** (Procurement KPIs) to **"لوحة المورد"** (Sales & Offers KPIs) with one click.
3. **Live Reverse Bidding (`/tenders`):**
   - Open Tender `TND-2026-00201` ("مناقصة توريد 200 طن صلب تسليح وبيليت").
   - Highlight competing bids, lowest bid indicator, and price reduction revision lineage.
4. **Order Tracking & Shipment Details (`/shipments`):**
   - View Shipment `DZ-SHP-2026-00042` with live Egyptian checkpoint updates on the Cairo-Alex desert highway.

---

### Path B: The 5-Minute Buyer Journey (RFQ to Deal)
1. **Log in as Buyer 1 (`demo.buyer@dealzone.eg`):**
   - View active Buyer Dashboard showing sourcing volume and category distribution.
2. **Review Existing RFQs (`/rfqs`):**
   - Inspect `DZ-RFQ-2026-00101` (4 competing offers, 1 revised price cut, 1 withdrawn).
   - Compare item breakdown: Rebar B500D (16mm & 20mm).
3. **Accept Winning Offer (`/offers`):**
   - Review Offer `OFF-2026-00101-R2` from Al-Ahram Steel (discounted from 3.9M to 3.75M EGP).
   - Accept the offer to atomically generate Deal `DZ-DEAL-2026-0050`.
4. **Post New RFQ (`/rfqs/create`):**
   - Create a new RFQ for 50 tons of Egyptian Cotton Yarn.
   - Set specifications, target delivery date in 10th of Ramadan, and publish to the marketplace.

---

### Path C: The 5-Minute Supplier Journey (Catalog & Reverse Bidding)
1. **Log in as Supplier 1 (`demo.supplier@dealzone.eg`):**
   - View Supplier Dashboard: "استعراض طلبات الأسعار" and "إدارة عروضي".
2. **Browse Open RFQs (`/rfqs`):**
   - Filter by Metals & Steel sector. Open open requests and submit competitive bids.
3. **Join Reverse Bidding Tender (`/tenders`):**
   - Open `TND-2026-00201`. Note current leader `BID-2026-00201-A` with revision 2 at 7,100,000 EGP.
   - Show how suppliers can cut margins or revise delivery lead times to win tenders.
4. **Direct Catalog Sales:**
   - Review catalog products inventory (`SKU-MET-REBAR-B500D`) and fulfillment pipeline.

---

### Path D: The 5-Minute Administrative & Compliance Journey
1. **Log in as Admin (`admin@dealzone.eg`):**
   - Instant redirect to Admin Analytics and Compliance Command Center.
2. **Review Verification Queue (`/admin/verifications`):**
   - Inspect pending company `[Sample] مصانع النيل لصباغة وتجهيز المنسوجات والأقمشة`.
   - Review 3 uploaded documents: Commercial Registration (السجل التجاري), Tax Card (البطاقة الضريبية), Industrial Registry (السجل الصناعي).
   - Showcase one-click approval or rejection with audit reasons.
3. **Dispute Resolution (`/admin/disputes`):**
   - View Open Dispute `DSP-2026-0001` on Deal `DZ-DEAL-2026-0053` (Moisture variance in sugar batch).
   - Review supplier/buyer arguments and demonstrate administrative resolution actions.
4. **Shipping & Logistics Directory (`/admin/shipping`):**
   - Review 3 registered Egyptian logistics carriers (النيل للشحن، مصر للخدمات اللوجستية، أليكس للشحن والتفريغ).

---

## 3. Supported Scenarios & Edge Cases

| Scenario | Tested Entity | Verification Steps |
| :--- | :--- | :--- |
| **Mojibake-Free Arabic** | All Materials | Verify Arabic typography in Catalog, RFQs, and Tenders renders clearly without question marks or corrupted characters. |
| **Strict 3 Categories** | Materials & Catalog | Only `معادن`, `منسوجات`, and `أغذية` exist in navigation and filters. Deactivated legacy categories do not appear. |
| **RTL Brand Legibility** | Logo Header | English "DealZone" duplicate is hidden in Arabic view; logo emblem displays subtle dual-depth shadow. |
| **Secondary Button Contrast** | Dashboard Hero | "إدارة عروضي" and "تصفح الكتالوج" render with white frosted glass border and crisp white text. |
| **Scrollbar Cleanliness** | Main Layout | No secondary vertical scrollbar appears on the left; page scrolling is completely unified. |
| **Offer Revision Lineage** | RFQ 101 / Offers | Offer `OFF-2026-00101` shows Original (R1) at 3,900,000 EGP and Revision (R2) at 3,750,000 EGP. |
| **Withdrawn Offer/Bid** | Offer 107 / Bid 201-C | Shows `Withdrawn` badge with historical audit reason and timestamp. |
| **Live Reverse Auction** | Tender 201 | Shows 3 competing bidders with reference price 7,500,000 EGP and active leader at 7,100,000 EGP. |
| **Delivered Deal & Reviews** | Deal 0052 | Shows Completed deal with 5-star and 4-star mutual counterparty reviews and comments. |
| **Dispute Under Review** | Dispute DSP-0001 | Deal status transitions to `Disputed`, blocking confirmation until admin adjudication. |
