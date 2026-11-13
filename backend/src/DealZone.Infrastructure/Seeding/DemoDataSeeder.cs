using System.Text.Json;
using DealZone.Application.Common.Interfaces;
using DealZone.Domain.Catalog;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Identity;
using DealZone.Domain.Notifications;
using DealZone.Domain.Offers;
using DealZone.Domain.Purchasing;
using DealZone.Domain.Reviews;
using DealZone.Domain.Rfqs;
using DealZone.Domain.Shipping;
using DealZone.Domain.Tenders;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Seeding;

/// <summary>
/// Comprehensive, production-grade Demo Data Seeder for DealZone Egyptian Industrial B2B Marketplace.
/// Covers every supported business workflow, role, state transition, and exceptional edge case.
/// Idempotent, deterministic, and strictly restricted to development/demo environments.
/// All demo entities are clearly identifiable with the [Sample] prefix.
/// </summary>
public static class DemoDataSeeder
{
    // Deterministic Stable Identifiers for Demo Accounts & Companies
    public static readonly Guid AdminUserId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    public static readonly Guid Buyer1UserId = Guid.Parse("10000000-0000-0000-0000-000000000002");
    public static readonly Guid Buyer2UserId = Guid.Parse("10000000-0000-0000-0000-000000000003");
    public static readonly Guid BuyerMemberUserId = Guid.Parse("10000000-0000-0000-0000-000000000004");
    public static readonly Guid NewBuyerUserId = Guid.Parse("10000000-0000-0000-0000-000000000005");
    public static readonly Guid Supplier1UserId = Guid.Parse("10000000-0000-0000-0000-000000000006");
    public static readonly Guid Supplier2UserId = Guid.Parse("10000000-0000-0000-0000-000000000007");
    public static readonly Guid Supplier3UserId = Guid.Parse("10000000-0000-0000-0000-000000000008");
    public static readonly Guid NewSupplierUserId = Guid.Parse("10000000-0000-0000-0000-000000000009");
    public static readonly Guid DualUserId = Guid.Parse("10000000-0000-0000-0000-000000000010");
    public static readonly Guid PendingUserId = Guid.Parse("10000000-0000-0000-0000-000000000011");
    public static readonly Guid RejectedUserId = Guid.Parse("10000000-0000-0000-0000-000000000012");

    public static readonly Guid Buyer1CompanyId = Guid.Parse("20000000-0000-0000-0000-000000000001");
    public static readonly Guid Buyer2CompanyId = Guid.Parse("20000000-0000-0000-0000-000000000002");
    public static readonly Guid Supplier1CompanyId = Guid.Parse("20000000-0000-0000-0000-000000000003");
    public static readonly Guid Supplier2CompanyId = Guid.Parse("20000000-0000-0000-0000-000000000004");
    public static readonly Guid Supplier3CompanyId = Guid.Parse("20000000-0000-0000-0000-000000000005");
    public static readonly Guid DualCompanyId = Guid.Parse("20000000-0000-0000-0000-000000000006");
    public static readonly Guid NewBuyerCompanyId = Guid.Parse("20000000-0000-0000-0000-000000000007");
    public static readonly Guid NewSupplierCompanyId = Guid.Parse("20000000-0000-0000-0000-000000000008");
    public static readonly Guid PendingCompanyId = Guid.Parse("20000000-0000-0000-0000-000000000009");
    public static readonly Guid RejectedCompanyId = Guid.Parse("20000000-0000-0000-0000-000000000010");

    public static async Task SeedAsync(IServiceProvider serviceProvider, bool forceReset = false)
    {
        await using var scope = serviceProvider.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
        var logger = loggerFactory.CreateLogger("DealZone.Infrastructure.Seeding.DemoDataSeeder");
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        // Environment & Configuration Guard
        var seedDemo = configuration.GetValue<bool>("SeedDemoData") ||
                       string.Equals(Environment.GetEnvironmentVariable("DEALZONE_DEMO_SEED_ENABLED"), "true", StringComparison.OrdinalIgnoreCase);

        if (!seedDemo)
        {
            logger.LogDebug("DemoDataSeeder: Demo seeding disabled in configuration. Skipping.");
            return;
        }

        var shouldReset = forceReset || configuration.GetValue<bool>("ResetDemoData", false);
        if (shouldReset)
        {
            logger.LogInformation("DemoDataSeeder: Reset requested. Purging existing [Sample] demo records...");
            await PurgeSampleDataAsync(context, logger);
        }
        else if (await context.Companies.AnyAsync(c => c.TradeName.StartsWith("[Sample]")))
        {
            logger.LogInformation("DemoDataSeeder: Sample dataset already exists. Verifying baseline integrity.");
            return;
        }

        logger.LogInformation("DemoDataSeeder: Populating comprehensive DealZone Egyptian marketplace demo dataset...");

        // 1. Seed Users and resolve Admin User ID
        var adminUserId = await SeedUsersAsync(context, passwordHasher, logger);

        // 2. Seed Companies, Members, Contact Details
        await SeedCompaniesAsync(context, adminUserId, logger);

        // 3. Seed Verification Documents and Administrative Audit Decisions
        await SeedVerificationAsync(context, adminUserId, logger);

        // 4. Seed Catalog Products for Direct Purchasing (Textiles, Food, Metals)
        await SeedCatalogProductsAsync(context, logger);

        // 5. Seed RFQs and Supplier Offers (All statuses & revision lineages)
        await SeedRfqsAndOffersAsync(context, logger);

        // 6. Seed Tenders and Reverse Bidding Scenarios
        await SeedTendersAndBidsAsync(context, logger);

        // 7. Seed Direct Purchases and Commercial Deals
        await SeedDealsAndPurchasesAsync(context, logger);

        // 8. Seed Shipping Providers and Admin-Managed Shipments
        await SeedShippingAsync(context, logger);

        // 9. Seed Disputes and Deal Reviews
        await SeedDisputesAndReviewsAsync(context, adminUserId, logger);

        // 10. Seed Notifications
        await SeedNotificationsAsync(context, adminUserId, logger);

        await context.SaveChangesAsync();
        logger.LogInformation("DemoDataSeeder: Comprehensive DealZone demo dataset successfully persisted to SQL Server.");
    }

    private static async Task PurgeSampleDataAsync(DealZoneDbContext context, ILogger logger)
    {
        var sampleCompanyIds = await context.Companies
            .IgnoreQueryFilters()
            .Where(c => c.TradeName.Contains("[Sample]") || c.LegalName.Contains("[Sample]") || c.LegalName.Contains("Sample"))
            .Select(c => c.Id)
            .ToListAsync();

        var demoEmails = new[]
        {
            "demo.buyer@dealzone.eg", "demo.buyer2@dealzone.eg", "demo.procurement@dealzone.eg",
            "demo.newbuyer@dealzone.eg", "demo.supplier@dealzone.eg", "demo.supplier2@dealzone.eg",
            "demo.supplier3@dealzone.eg", "demo.newsupplier@dealzone.eg", "demo.dual@dealzone.eg",
            "demo.pending@dealzone.eg", "demo.rejected@dealzone.eg"
        };
        var demoUserIds = await context.Users
            .Where(u => demoEmails.Contains(u.Email) || u.Email.StartsWith("demo."))
            .Select(u => u.Id)
            .ToListAsync();

        // Include any primary contact user from sample companies
        var contactUserIds = await context.Companies
            .IgnoreQueryFilters()
            .Where(c => sampleCompanyIds.Contains(c.Id))
            .Select(c => c.PrimaryContactUserId)
            .ToListAsync();
        foreach (var uid in contactUserIds)
        {
            if (!demoUserIds.Contains(uid)) demoUserIds.Add(uid);
        }

        // 1. Purge Notifications
        await context.Notifications
            .IgnoreQueryFilters()
            .Where(n => demoUserIds.Contains(n.UserId) || (n.IdempotencyKey != null && n.IdempotencyKey.StartsWith("notif-adm-")))
            .ExecuteDeleteAsync();

        // 2. Purge Reviews
        await context.Reviews
            .IgnoreQueryFilters()
            .Where(r => sampleCompanyIds.Contains(r.ReviewerCompanyId) || sampleCompanyIds.Contains(r.TargetCompanyId))
            .ExecuteDeleteAsync();

        // 3. Purge Deal Disputes
        await context.DealDisputes
            .IgnoreQueryFilters()
            .Where(d => sampleCompanyIds.Contains(d.OpenedByCompanyId))
            .ExecuteDeleteAsync();

        // 4. Purge Shipments
        var sampleDealIds = await context.Deals
            .IgnoreQueryFilters()
            .Where(d => sampleCompanyIds.Contains(d.BuyerCompanyId) || sampleCompanyIds.Contains(d.SupplierCompanyId))
            .Select(d => d.Id)
            .ToListAsync();

        await context.Shipments
            .IgnoreQueryFilters()
            .Where(s => sampleDealIds.Contains(s.DealId))
            .ExecuteDeleteAsync();

        // 5. Purge Deals
        await context.Deals
            .IgnoreQueryFilters()
            .Where(d => sampleCompanyIds.Contains(d.BuyerCompanyId) || sampleCompanyIds.Contains(d.SupplierCompanyId))
            .ExecuteDeleteAsync();

        // 6. Purge Direct Purchases
        await context.DirectPurchases
            .IgnoreQueryFilters()
            .Where(p => sampleCompanyIds.Contains(p.BuyerCompanyId) || sampleCompanyIds.Contains(p.SupplierCompanyId))
            .ExecuteDeleteAsync();

        // 7. Purge Tender Bids & Line Items
        var sampleTenderIds = await context.Tenders
            .IgnoreQueryFilters()
            .Where(t => sampleCompanyIds.Contains(t.BuyerCompanyId))
            .Select(t => t.Id)
            .ToListAsync();

        var sampleBidIds = await context.Bids
            .IgnoreQueryFilters()
            .Where(b => sampleCompanyIds.Contains(b.SupplierCompanyId) || sampleTenderIds.Contains(b.TenderId))
            .Select(b => b.Id)
            .ToListAsync();

        await context.BidItems
            .IgnoreQueryFilters()
            .Where(bi => sampleBidIds.Contains(bi.BidId))
            .ExecuteDeleteAsync();

        await context.Bids
            .IgnoreQueryFilters()
            .Where(b => sampleBidIds.Contains(b.Id))
            .ExecuteDeleteAsync();

        await context.TenderItems
            .IgnoreQueryFilters()
            .Where(ti => sampleTenderIds.Contains(ti.TenderId))
            .ExecuteDeleteAsync();

        await context.Tenders
            .IgnoreQueryFilters()
            .Where(t => sampleTenderIds.Contains(t.Id))
            .ExecuteDeleteAsync();

        // 8. Purge RFQs, Offers, Items
        var sampleRfqIds = await context.Rfqs
            .IgnoreQueryFilters()
            .Where(r => sampleCompanyIds.Contains(r.BuyerCompanyId))
            .Select(r => r.Id)
            .ToListAsync();

        var sampleOfferIds = await context.Offers
            .IgnoreQueryFilters()
            .Where(o => sampleRfqIds.Contains(o.RfqId) || sampleCompanyIds.Contains(o.SupplierCompanyId))
            .Select(o => o.Id)
            .ToListAsync();

        await context.OfferItems
            .IgnoreQueryFilters()
            .Where(oi => sampleOfferIds.Contains(oi.OfferId))
            .ExecuteDeleteAsync();

        await context.Offers
            .IgnoreQueryFilters()
            .Where(o => sampleOfferIds.Contains(o.Id))
            .ExecuteDeleteAsync();

        await context.RfqItems
            .IgnoreQueryFilters()
            .Where(ri => sampleRfqIds.Contains(ri.RfqId))
            .ExecuteDeleteAsync();

        await context.Rfqs
            .IgnoreQueryFilters()
            .Where(r => sampleCompanyIds.Contains(r.BuyerCompanyId) || sampleRfqIds.Contains(r.Id))
            .ExecuteDeleteAsync();

        // 9. Purge Catalog Products
        await context.CatalogProducts
            .IgnoreQueryFilters()
            .Where(p => sampleCompanyIds.Contains(p.SupplierCompanyId))
            .ExecuteDeleteAsync();

        // 10. Purge Verification Decisions & Documents
        await context.VerificationDecisions
            .IgnoreQueryFilters()
            .Where(d => sampleCompanyIds.Contains(d.CompanyId))
            .ExecuteDeleteAsync();

        await context.VerificationDocuments
            .IgnoreQueryFilters()
            .Where(d => sampleCompanyIds.Contains(d.CompanyId))
            .ExecuteDeleteAsync();

        // 11. Purge Members & Contact Details
        await context.CompanyContactDetails
            .IgnoreQueryFilters()
            .Where(c => sampleCompanyIds.Contains(c.CompanyId))
            .ExecuteDeleteAsync();

        await context.CompanyMembers
            .IgnoreQueryFilters()
            .Where(m => sampleCompanyIds.Contains(m.CompanyId))
            .ExecuteDeleteAsync();

        // 12. Purge Companies
        await context.Companies
            .IgnoreQueryFilters()
            .Where(c => sampleCompanyIds.Contains(c.Id))
            .ExecuteDeleteAsync();

        // 13. Purge Demo Users & Refresh Tokens
        await context.RefreshTokens
            .IgnoreQueryFilters()
            .Where(t => demoUserIds.Contains(t.UserId))
            .ExecuteDeleteAsync();

        await context.Users
            .IgnoreQueryFilters()
            .Where(u => demoUserIds.Contains(u.Id))
            .ExecuteDeleteAsync();

        logger.LogInformation("DemoDataSeeder: Purge completed cleanly via atomic ExecuteDeleteAsync.");
    }

    private static async Task<Guid> SeedUsersAsync(DealZoneDbContext context, IPasswordHasher hasher, ILogger logger)
    {
        var users = new List<User>
        {
            new() { Id = AdminUserId, Email = "admin@dealzone.eg", FullName = "مدير المنصة الرئيسي (DealZone Admin)", PhoneNumber = "+201000000001", IsSystemAdmin = true, IsActive = true, IsEmailConfirmed = true },
            new() { Id = Buyer1UserId, Email = "demo.buyer@dealzone.eg", FullName = "م. أحمد مصطفى (مدير المشتريات)", PhoneNumber = "+201011122233", IsSystemAdmin = false, IsActive = true, IsEmailConfirmed = true },
            new() { Id = Buyer2UserId, Email = "demo.buyer2@dealzone.eg", FullName = "أ. شريف المهدي (مدير التوريدات الغذائية)", PhoneNumber = "+201011122234", IsSystemAdmin = false, IsActive = true, IsEmailConfirmed = true },
            new() { Id = BuyerMemberUserId, Email = "demo.procurement@dealzone.eg", FullName = "أ. عمر كمال (مسؤول العقود والمشتريات)", PhoneNumber = "+201011122235", IsSystemAdmin = false, IsActive = true, IsEmailConfirmed = true },
            new() { Id = NewBuyerUserId, Email = "demo.newbuyer@dealzone.eg", FullName = "م. يوسف النجار (مدير مصنع الفتح)", PhoneNumber = "+201011122236", IsSystemAdmin = false, IsActive = true, IsEmailConfirmed = true },
            new() { Id = Supplier1UserId, Email = "demo.supplier@dealzone.eg", FullName = "أ. طارق عبد الرحمن (مدير المبيعات والتوريد)", PhoneNumber = "+201022233344", IsSystemAdmin = false, IsActive = true, IsEmailConfirmed = true },
            new() { Id = Supplier2UserId, Email = "demo.supplier2@dealzone.eg", FullName = "م. إبراهيم رضوان (مدير مبيعات الغزل)", PhoneNumber = "+201022233345", IsSystemAdmin = false, IsActive = true, IsEmailConfirmed = true },
            new() { Id = Supplier3UserId, Email = "demo.supplier3@dealzone.eg", FullName = "أ. كمال الصياد (مدير قطاع السلع التموينية)", PhoneNumber = "+201022233346", IsSystemAdmin = false, IsActive = true, IsEmailConfirmed = true },
            new() { Id = NewSupplierUserId, Email = "demo.newsupplier@dealzone.eg", FullName = "أ. سامح المنياوي (مورد غير موثق)", PhoneNumber = "+201022233347", IsSystemAdmin = false, IsActive = true, IsEmailConfirmed = true },
            new() { Id = DualUserId, Email = "demo.dual@dealzone.eg", FullName = "م. حازم القاضي (المدير التجاري المشترك)", PhoneNumber = "+201033344455", IsSystemAdmin = false, IsActive = true, IsEmailConfirmed = true },
            new() { Id = PendingUserId, Email = "demo.pending@dealzone.eg", FullName = "م. فؤاد خليل (المدير التنفيذي - قيد المراجعة)", PhoneNumber = "+201044455566", IsSystemAdmin = false, IsActive = true, IsEmailConfirmed = true },
            new() { Id = RejectedUserId, Email = "demo.rejected@dealzone.eg", FullName = "أ. وجدي عيسى (طلب توثيق مرفوض)", PhoneNumber = "+201055566677", IsSystemAdmin = false, IsActive = true, IsEmailConfirmed = true }
        };

        foreach (var u in users)
        {
            var existing = await context.Users.FirstOrDefaultAsync(x => x.Id == u.Id || x.Email == u.Email);
            if (existing is null)
            {
                u.PasswordHash = hasher.HashPassword(u, "DealZone@2026");
                context.Users.Add(u);
            }
            else
            {
                // Ensure existing demo/admin account has proper admin and activation flags
                if (u.IsSystemAdmin && !existing.IsSystemAdmin) existing.IsSystemAdmin = true;
                if (!existing.IsActive) existing.IsActive = true;
                if (!existing.IsEmailConfirmed) existing.IsEmailConfirmed = true;
            }
        }
        await context.SaveChangesAsync();
        logger.LogDebug("DemoDataSeeder: Users seeded.");

        // Dynamically resolve the authoritative Admin User ID from the database
        var adminUser = await context.Users
            .FirstOrDefaultAsync(u => u.Email == "admin@dealzone.eg" || u.Id == AdminUserId || u.IsSystemAdmin);

        return adminUser?.Id ?? AdminUserId;
    }

    private static async Task SeedCompaniesAsync(DealZoneDbContext context, Guid adminUserId, ILogger logger)
    {
        var companies = new List<Company>
        {
            // 1. Verified Buyer: Heavy Engineering & Metals Manufacturer
            new()
            {
                Id = Buyer1CompanyId,
                LegalName = "[Sample] الشركة المصرية للصناعات الهندسية والمعدنية ش.م.م",
                TradeName = "[Sample] المصرية للصناعات الهندسية",
                IndustrySector = "Metals & Steel",
                CompanyType = CompanyType.Buyer,
                City = "العاشر من رمضان",
                Governorate = "الشرقية",
                Description = "مصنع صلب وهياكل معدنية بالمنطقة الصناعية الثالثة B3 بالعاشر من رمضان.",
                Website = "https://demo-engineering.eg",
                VerificationStatus = CompanyVerificationStatus.Approved,
                VerifiedAtUtc = DateTimeOffset.UtcNow.AddDays(-60),
                VerifiedByUserId = adminUserId,
                PrimaryContactUserId = Buyer1UserId,
                IsActive = true
            },
            // 2. Verified Buyer: Food & Confectionery Manufacturing
            new()
            {
                Id = Buyer2CompanyId,
                LegalName = "[Sample] شركة مصر للحلويات والتصنيع الغذائي ش.م.م",
                TradeName = "[Sample] مصر للحلويات والأغذية الصناعية",
                IndustrySector = "Food Processing",
                CompanyType = CompanyType.Buyer,
                City = "السادس من أكتوبر",
                Governorate = "الجيزة",
                Description = "مجمع مصانع للأغذية والحلويات بالمنطقة الصناعية الأولى بأكتوبر.",
                Website = "https://demo-misr-food.eg",
                VerificationStatus = CompanyVerificationStatus.Approved,
                VerifiedAtUtc = DateTimeOffset.UtcNow.AddDays(-45),
                VerifiedByUserId = adminUserId,
                PrimaryContactUserId = Buyer2UserId,
                IsActive = true
            },
            // 3. Verified Supplier: Industrial Steel Supplier
            new()
            {
                Id = Supplier1CompanyId,
                LegalName = "[Sample] شركة الأهرام لتوريد وتجارة خامات الصلب والمعادن ذ.م.م",
                TradeName = "[Sample] الأهرام لتوريدات الصلب",
                IndustrySector = "Metals & Steel",
                CompanyType = CompanyType.Supplier,
                City = "السادس من أكتوبر",
                Governorate = "الجيزة",
                Description = "وكيل ومورد معتمد لحديد التسليح والبيليت والقطاعات الصناعية بالمنطقة الصناعية الرابعة بأكتوبر.",
                Website = "https://demo-ahram-steel.eg",
                VerificationStatus = CompanyVerificationStatus.Approved,
                VerifiedAtUtc = DateTimeOffset.UtcNow.AddDays(-50),
                VerifiedByUserId = adminUserId,
                PrimaryContactUserId = Supplier1UserId,
                IsActive = true
            },
            // 4. Verified Supplier: Textiles & Cotton Yarns
            new()
            {
                Id = Supplier2CompanyId,
                LegalName = "[Sample] شركة المحلة الحديثة لغزل القطن والألياف الصناعية ش.م.م",
                TradeName = "[Sample] المحلة للغزول والمنسوجات الحديثة",
                IndustrySector = "Textiles",
                CompanyType = CompanyType.Supplier,
                City = "المحلة الكبرى",
                Governorate = "الغربية",
                Description = "مورد رئيسي لخيوط الغزل القطني المصري وألياف البوليستر الصناعية بالمحلة الكبرى.",
                Website = "https://demo-mahalla-yarn.eg",
                VerificationStatus = CompanyVerificationStatus.Approved,
                VerifiedAtUtc = DateTimeOffset.UtcNow.AddDays(-40),
                VerifiedByUserId = adminUserId,
                PrimaryContactUserId = Supplier2UserId,
                IsActive = true
            },
            // 5. Verified Supplier: Refined Sugar and Industrial Food Ingredients
            new()
            {
                Id = Supplier3CompanyId,
                LegalName = "[Sample] شركة الدلتا لتجارة وتوزيع السلع التموينية والغذائية ش.م.م",
                TradeName = "[Sample] الدلتا لتجارة وتكرير السكر",
                IndustrySector = "Food Commodities",
                CompanyType = CompanyType.Supplier,
                City = "مدينة السادات",
                Governorate = "المنوفية",
                Description = "مستودعات توزيع معتمدة للسكر المكرر الصناعي وزيوت الطعام السائبة بمدينة السادات.",
                Website = "https://demo-delta-sugar.eg",
                VerificationStatus = CompanyVerificationStatus.Approved,
                VerifiedAtUtc = DateTimeOffset.UtcNow.AddDays(-35),
                VerifiedByUserId = adminUserId,
                PrimaryContactUserId = Supplier3UserId,
                IsActive = true
            },
            // 6. Verified Dual Enterprise (Buyer & Supplier)
            new()
            {
                Id = DualCompanyId,
                LegalName = "[Sample] شركة الإسكندرية للتجارة والتصنيع المشترك ش.م.م",
                TradeName = "[Sample] الإسكندرية للتجارة والتصنيع المشترك",
                IndustrySector = "Textiles & Food",
                CompanyType = CompanyType.Both,
                City = "برج العرب",
                Governorate = "الإسكندرية",
                Description = "منشأة صناعية وتجارية متكاملة تشتري المواد الخام وتورد المنتجات النصف مصنعة ببرج العرب.",
                Website = "https://demo-alex-trade.eg",
                VerificationStatus = CompanyVerificationStatus.Approved,
                VerifiedAtUtc = DateTimeOffset.UtcNow.AddDays(-30),
                VerifiedByUserId = adminUserId,
                PrimaryContactUserId = DualUserId,
                IsActive = true
            },
            // 7. Verified New / Empty Buyer Account (Zero transactions to test fresh onboarding)
            new()
            {
                Id = NewBuyerCompanyId,
                LegalName = "[Sample] ورشة الفتح للصناعات الخفيفة وتشكيل الصاج ذ.م.م",
                TradeName = "[Sample] الفتح للمشغولات وتشكيل المعادن",
                IndustrySector = "Metals",
                CompanyType = CompanyType.Buyer,
                City = "حلوان",
                Governorate = "القاهرة",
                Description = "ورشة ومصنع صغير لتشكيل الصاج والمعادن، حساب حديث التوثيق بدون معاملات سابقة.",
                Website = "https://demo-fateh-metals.eg",
                VerificationStatus = CompanyVerificationStatus.Approved,
                VerifiedAtUtc = DateTimeOffset.UtcNow.AddDays(-2),
                VerifiedByUserId = adminUserId,
                PrimaryContactUserId = NewBuyerUserId,
                IsActive = true
            },
            // 8. New Supplier (Pending Onboarding, no docs)
            new()
            {
                Id = NewSupplierCompanyId,
                LegalName = "[Sample] شركة الصعيد لتجارة الخردة وصهر المعادن",
                TradeName = "[Sample] الصعيد لصهر ودرفلة المعادن",
                IndustrySector = "Metals",
                CompanyType = CompanyType.Supplier,
                City = "بني سويف",
                Governorate = "بني سويف",
                Description = "مورد جديد قيد إنشاء الحساب ولم يرفع مستندات التوثيق بعد.",
                VerificationStatus = CompanyVerificationStatus.Pending,
                PrimaryContactUserId = NewSupplierUserId,
                IsActive = true
            },
            // 9. Pending Verification Company (Under Review with uploaded documents in Admin queue)
            new()
            {
                Id = PendingCompanyId,
                LegalName = "[Sample] مصانع النيل لصباغة وتجهيز المنسوجات والأقمشة ش.م.م",
                TradeName = "[Sample] النيل للنسيج وتجهيز الأقمشة",
                IndustrySector = "Textiles",
                CompanyType = CompanyType.Supplier,
                City = "قليوب",
                Governorate = "القليوبية",
                Description = "مصنع نسيج تقدم بأوراق التوثيق الرسمية وموجود حالياً في طابور مراجعة إدارة المنصة.",
                Website = "https://demo-nile-textiles.eg",
                VerificationStatus = CompanyVerificationStatus.UnderReview,
                PrimaryContactUserId = PendingUserId,
                IsActive = true
            },
            // 10. Rejected Verification Company (Rejected with administrative reason)
            new()
            {
                Id = RejectedCompanyId,
                LegalName = "[Sample] مؤسسة الأمل للتجارة العامة والتوريدات غير المعتمدة",
                TradeName = "[Sample] مؤسسة الأمل التجارية للتوريدات",
                IndustrySector = "General Supplies",
                CompanyType = CompanyType.Supplier,
                City = "بورسعيد",
                Governorate = "بورسعيد",
                Description = "حساب تم رفض توثيقه بسبب انتهاء صلاحية السجل التجاري وعدم مطابقة النشاط.",
                VerificationStatus = CompanyVerificationStatus.Rejected,
                RejectionReason = "السجل التجاري منتهي الصلاحية والبطاقة الضريبية لا تتطابق مع النشاط الصناعي المصرح به.",
                PrimaryContactUserId = RejectedUserId,
                IsActive = true
            }
        };

        foreach (var c in companies)
        {
            if (!await context.Companies.AnyAsync(x => x.Id == c.Id))
            {
                context.Companies.Add(c);
            }
        }
        await context.SaveChangesAsync();

        // Seed Company Memberships
        var members = new List<CompanyMember>
        {
            new() { CompanyId = Buyer1CompanyId, UserId = Buyer1UserId, Role = CompanyRole.Owner, IsPrimary = true },
            new() { CompanyId = Buyer1CompanyId, UserId = BuyerMemberUserId, Role = CompanyRole.ProcurementManager, IsPrimary = false },
            new() { CompanyId = Buyer2CompanyId, UserId = Buyer2UserId, Role = CompanyRole.Owner, IsPrimary = true },
            new() { CompanyId = Supplier1CompanyId, UserId = Supplier1UserId, Role = CompanyRole.Owner, IsPrimary = true },
            new() { CompanyId = Supplier2CompanyId, UserId = Supplier2UserId, Role = CompanyRole.Owner, IsPrimary = true },
            new() { CompanyId = Supplier3CompanyId, UserId = Supplier3UserId, Role = CompanyRole.Owner, IsPrimary = true },
            new() { CompanyId = DualCompanyId, UserId = DualUserId, Role = CompanyRole.Owner, IsPrimary = true },
            new() { CompanyId = NewBuyerCompanyId, UserId = NewBuyerUserId, Role = CompanyRole.Owner, IsPrimary = true },
            new() { CompanyId = NewSupplierCompanyId, UserId = NewSupplierUserId, Role = CompanyRole.Owner, IsPrimary = true },
            new() { CompanyId = PendingCompanyId, UserId = PendingUserId, Role = CompanyRole.Owner, IsPrimary = true },
            new() { CompanyId = RejectedCompanyId, UserId = RejectedUserId, Role = CompanyRole.Owner, IsPrimary = true }
        };

        foreach (var m in members)
        {
            if (!await context.CompanyMembers.AnyAsync(x => x.CompanyId == m.CompanyId && x.UserId == m.UserId))
            {
                context.CompanyMembers.Add(m);
            }
        }

        // Seed Contact Details
        var contacts = new List<CompanyContactDetails>
        {
            new() { CompanyId = Buyer1CompanyId, TaxIdNumber = "DEMO-TAX-10042", CommercialRegistrationNumber = "DEMO-CR-10042", CorporateEmail = "procurement@demo-engineering.eg", CorporatePhone = "+2015333444", AddressLine1 = "القطعة 42، المنطقة الصناعية الثالثة B3", PostalCode = "44629" },
            new() { CompanyId = Buyer2CompanyId, TaxIdNumber = "DEMO-TAX-10043", CommercialRegistrationNumber = "DEMO-CR-10043", CorporateEmail = "purchasing@demo-misr-food.eg", CorporatePhone = "+2023833445", AddressLine1 = "المنطقة الصناعية الأولى، قطعة 15", PostalCode = "12566" },
            new() { CompanyId = Supplier1CompanyId, TaxIdNumber = "DEMO-TAX-20088", CommercialRegistrationNumber = "DEMO-CR-20088", CorporateEmail = "sales@demo-ahram-steel.eg", CorporatePhone = "+2023888999", AddressLine1 = "مجمع الصناعات المعدنية، المنطقة الصناعية الرابعة", PostalCode = "12566" },
            new() { CompanyId = Supplier2CompanyId, TaxIdNumber = "DEMO-TAX-20089", CommercialRegistrationNumber = "DEMO-CR-20089", CorporateEmail = "sales@demo-mahalla-yarn.eg", CorporatePhone = "+2040222333", AddressLine1 = "طريق المحلة طنطا الزراعي، مجمع الغزل", PostalCode = "31951" },
            new() { CompanyId = Supplier3CompanyId, TaxIdNumber = "DEMO-TAX-20090", CommercialRegistrationNumber = "DEMO-CR-20090", CorporateEmail = "trade@demo-delta-sugar.eg", CorporatePhone = "+20482600200", AddressLine1 = "المنطقة الصناعية الثانية، مجمع التوزيع الغذائي", PostalCode = "32897" },
            new() { CompanyId = DualCompanyId, TaxIdNumber = "DEMO-TAX-30015", CommercialRegistrationNumber = "DEMO-CR-30015", CorporateEmail = "trade@demo-alex-trade.eg", CorporatePhone = "+2034591000", AddressLine1 = "المنطقة الصناعية الأولى، مدينة برج العرب الجديدة", PostalCode = "21934" },
            new() { CompanyId = NewBuyerCompanyId, TaxIdNumber = "DEMO-TAX-40001", CommercialRegistrationNumber = "DEMO-CR-40001", CorporateEmail = "info@demo-fateh-metals.eg", CorporatePhone = "+2022718000", AddressLine1 = "كوتسيكا، المنطقة الحرفية الصناعية", PostalCode = "11728" },
            new() { CompanyId = PendingCompanyId, TaxIdNumber = "DEMO-TAX-50001", CommercialRegistrationNumber = "DEMO-CR-50001", CorporateEmail = "admin@demo-nile-textiles.eg", CorporatePhone = "+2013215000", AddressLine1 = "طريق مصر إسكندرية الزراعي، كفر أبو جمعة", PostalCode = "13745" },
            new() { CompanyId = RejectedCompanyId, TaxIdNumber = "DEMO-TAX-60001", CommercialRegistrationNumber = "DEMO-CR-60001", CorporateEmail = "info@demo-amal-trading.eg", CorporatePhone = "+2066324000", AddressLine1 = "حي الشرق، شارع التجاريين", PostalCode = "42511" }
        };

        foreach (var c in contacts)
        {
            if (!await context.CompanyContactDetails.AnyAsync(x => x.CompanyId == c.CompanyId))
            {
                context.CompanyContactDetails.Add(c);
            }
        }

        await context.SaveChangesAsync();
        logger.LogDebug("DemoDataSeeder: Companies and contacts seeded.");
    }

    private static async Task SeedVerificationAsync(DealZoneDbContext context, Guid adminUserId, ILogger logger)
    {
        // 1. Pending Verification Company Documents (UnderReview in Admin Queue)
        if (!await context.VerificationDocuments.AnyAsync(d => d.CompanyId == PendingCompanyId))
        {
            context.VerificationDocuments.AddRange(
                new VerificationDocument
                {
                    CompanyId = PendingCompanyId,
                    DocumentType = VerificationDocumentType.CommercialRegister,
                    FileName = "commercial_register_nile_textiles_2026.pdf",
                    StorageKey = "demo/verification/nile_cr.pdf",
                    ContentType = "application/pdf",
                    FileSizeBytes = 2_450_000,
                    UploadedByUserId = PendingUserId,
                    Status = VerificationDocumentStatus.Pending,
                    UploadedAtUtc = DateTimeOffset.UtcNow.AddDays(-1)
                },
                new VerificationDocument
                {
                    CompanyId = PendingCompanyId,
                    DocumentType = VerificationDocumentType.TaxCard,
                    FileName = "tax_card_nile_textiles.pdf",
                    StorageKey = "demo/verification/nile_tax.pdf",
                    ContentType = "application/pdf",
                    FileSizeBytes = 1_820_000,
                    UploadedByUserId = PendingUserId,
                    Status = VerificationDocumentStatus.Pending,
                    UploadedAtUtc = DateTimeOffset.UtcNow.AddDays(-1)
                },
                new VerificationDocument
                {
                    CompanyId = PendingCompanyId,
                    DocumentType = VerificationDocumentType.IndustrialRegister,
                    FileName = "industrial_license_qalyub_factory.pdf",
                    StorageKey = "demo/verification/nile_industrial.pdf",
                    ContentType = "application/pdf",
                    FileSizeBytes = 3_150_000,
                    UploadedByUserId = PendingUserId,
                    Status = VerificationDocumentStatus.Pending,
                    UploadedAtUtc = DateTimeOffset.UtcNow.AddDays(-1)
                }
            );
        }

        // 2. Rejected Verification Decisions (Audit record in Admin Portal)
        if (!await context.VerificationDecisions.AnyAsync(d => d.CompanyId == RejectedCompanyId))
        {
            context.VerificationDecisions.Add(new VerificationDecision
            {
                CompanyId = RejectedCompanyId,
                ReviewedByUserId = adminUserId,
                Decision = CompanyVerificationStatus.Rejected,
                Reason = "السجل التجاري المقدم منتهي الصلاحية منذ 6 أشهر، والبطاقة الضريبية لا تتطابق مع النشاط الصناعي.",
                DecidedAtUtc = DateTimeOffset.UtcNow.AddDays(-10)
            });
        }

        // 3. Approved Verification Decisions for Approved Companies
        var approvedCompanies = new[] { Buyer1CompanyId, Buyer2CompanyId, Supplier1CompanyId, Supplier2CompanyId, Supplier3CompanyId, DualCompanyId };
        foreach (var cid in approvedCompanies)
        {
            if (!await context.VerificationDecisions.AnyAsync(d => d.CompanyId == cid))
            {
                context.VerificationDecisions.Add(new VerificationDecision
                {
                    CompanyId = cid,
                    ReviewedByUserId = adminUserId,
                    Decision = CompanyVerificationStatus.Approved,
                    Reason = "تم التحقق الكامل من السجل التجاري والبطاقة الضريبية والسجل الصناعي الصادر عن الهيئة العامة للتنمية الصناعية.",
                    DecidedAtUtc = DateTimeOffset.UtcNow.AddDays(-30)
                });
            }
        }

        await context.SaveChangesAsync();
        logger.LogDebug("DemoDataSeeder: Verification documents and decisions seeded.");
    }

    private static async Task SeedCatalogProductsAsync(DealZoneDbContext context, ILogger logger)
    {
        var metalsCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "METALS");
        var textilesCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "TEXTILES");
        var foodCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "FOOD");

        var tonUnit = await context.UnitsOfMeasure.FirstOrDefaultAsync(u => u.Code == "ton");
        var kgUnit = await context.UnitsOfMeasure.FirstOrDefaultAsync(u => u.Code == "kg");

        // 1. Repair or create materials for Metals
        var steelRebar = await context.Materials.FirstOrDefaultAsync(m => m.Code == "STEEL-REBAR-B500D");
        if (steelRebar == null)
        {
            steelRebar = new Material { CategoryId = metalsCategory!.Id, DefaultUnitId = tonUnit!.Id, Code = "STEEL-REBAR-B500D", NameAr = "حديد تسليح عالي المقاومة B500D", NameEn = "High-Tensile Steel Rebar Grade B500D", DescriptionAr = "أسياخ صلب تسليح عالي المقاومة ES 262", DescriptionEn = "High-tensile steel rebar ES 262", IsActive = true, IsArchived = false };
            context.Materials.Add(steelRebar);
        }
        else
        {
            steelRebar.CategoryId = metalsCategory!.Id;
            steelRebar.NameAr = "حديد تسليح عالي المقاومة B500D";
            steelRebar.IsActive = true;
            steelRebar.IsArchived = false;
        }

        var steelBillet = await context.Materials.FirstOrDefaultAsync(m => m.Code == "STEEL-BILLET-3SP");
        if (steelBillet == null)
        {
            steelBillet = new Material { CategoryId = metalsCategory!.Id, DefaultUnitId = tonUnit!.Id, Code = "STEEL-BILLET-3SP", NameAr = "مربعات صلب بيليت 150×150 مم كود 3SP", NameEn = "Prime Continuous Cast Steel Billets 150x150mm (3SP/5SP)", DescriptionAr = "خام بيليت مطابق للمواصفة القياسية المصرية لدرفلة حديد التسليح", DescriptionEn = "Continuous cast square billets", IsActive = true, IsArchived = false };
            context.Materials.Add(steelBillet);
        }
        else
        {
            steelBillet.CategoryId = metalsCategory!.Id;
            steelBillet.NameAr = "مربعات صلب بيليت 150×150 مم كود 3SP";
            steelBillet.DescriptionAr = "خام بيليت مطابق للمواصفة القياسية المصرية لدرفلة حديد التسليح";
            steelBillet.IsActive = true;
            steelBillet.IsArchived = false;
        }

        // 2. Repair or create materials for Textiles
        var cottonYarn = await context.Materials.FirstOrDefaultAsync(m => m.Code == "COTTON-YARN-GIZA");
        if (cottonYarn == null)
        {
            cottonYarn = new Material { CategoryId = textilesCategory!.Id, DefaultUnitId = tonUnit!.Id, Code = "COTTON-YARN-GIZA", NameAr = "غزل قطن مصري 100% جيزة ممشط", NameEn = "100% Egyptian Combed Cotton Yarn Giza", DescriptionAr = "خيوط قطن غزل ممشط نمرة 30/1 للصناعات النسيجية والتريكو", DescriptionEn = "Combed cotton ring-spun yarn", IsActive = true, IsArchived = false };
            context.Materials.Add(cottonYarn);
        }
        else
        {
            cottonYarn.CategoryId = textilesCategory!.Id;
            cottonYarn.NameAr = "غزل قطن مصري 100% جيزة ممشط";
            cottonYarn.DescriptionAr = "خيوط قطن غزل ممشط نمرة 30/1 للصناعات النسيجية والتريكو";
            cottonYarn.IsActive = true;
            cottonYarn.IsArchived = false;
        }

        var polyFiber = await context.Materials.FirstOrDefaultAsync(m => m.Code == "POLY-FIBER-PSF");
        if (polyFiber == null)
        {
            polyFiber = new Material { CategoryId = textilesCategory!.Id, DefaultUnitId = tonUnit!.Id, Code = "POLY-FIBER-PSF", NameAr = "ألياف بوليستر قصيرة للمنسوجات (PSF)", NameEn = "Polyester Staple Fiber (PSF) Semi-Dull", DescriptionAr = "ألياف بوليستر نصف لامعة لخلط الغزول والأقمشة غير المنسوجة", DescriptionEn = "Polyester staple fibers for spinning", IsActive = true, IsArchived = false };
            context.Materials.Add(polyFiber);
        }
        else
        {
            polyFiber.CategoryId = textilesCategory!.Id;
            polyFiber.NameAr = "ألياف بوليستر قصيرة للمنسوجات (PSF)";
            polyFiber.DescriptionAr = "ألياف بوليستر نصف لامعة لخلط الغزول والأقمشة غير المنسوجة";
            polyFiber.IsActive = true;
            polyFiber.IsArchived = false;
        }

        // 3. Repair or create materials for Food
        var refinedSugar = await context.Materials.FirstOrDefaultAsync(m => m.Code == "FOOD-SUGAR-REFINED");
        if (refinedSugar == null)
        {
            refinedSugar = new Material { CategoryId = foodCategory!.Id, DefaultUnitId = tonUnit!.Id, Code = "FOOD-SUGAR-REFINED", NameAr = "سكر أبيض مكرر درجة تصنيع غذائي ICUMSA 45", NameEn = "Refined White Sugar Industrial Grade ICUMSA 45", DescriptionAr = "سكر ناصع البياض عالي النقاوة مطابق للمواصفات الغذائية للصناعات الغذائية والمشروبات", DescriptionEn = "Refined white sugar ICUMSA 45", IsActive = true, IsArchived = false };
            context.Materials.Add(refinedSugar);
        }
        else
        {
            refinedSugar.CategoryId = foodCategory!.Id;
            refinedSugar.NameAr = "سكر أبيض مكرر درجة تصنيع غذائي ICUMSA 45";
            refinedSugar.DescriptionAr = "سكر ناصع البياض عالي النقاوة مطابق للمواصفات الغذائية للصناعات الغذائية والمشروبات";
            refinedSugar.IsActive = true;
            refinedSugar.IsArchived = false;
        }

        var palmOlein = await context.Materials.FirstOrDefaultAsync(m => m.Code == "FOOD-PALM-OLEIN");
        if (palmOlein == null)
        {
            palmOlein = new Material { CategoryId = foodCategory!.Id, DefaultUnitId = tonUnit!.Id, Code = "FOOD-PALM-OLEIN", NameAr = "زيت أولين النخيل الغذائي المكرر CP8", NameEn = "RBD Palm Olein Edible Oil CP8", DescriptionAr = "زيت أولين نخيل مكرر ومبيض ومنزوع الرائحة لصناعة الأغذية والمقرمشات", DescriptionEn = "RBD palm olein edible cooking oil CP8", IsActive = true, IsArchived = false };
            context.Materials.Add(palmOlein);
        }
        else
        {
            palmOlein.CategoryId = foodCategory!.Id;
            palmOlein.NameAr = "زيت أولين النخيل الغذائي المكرر CP8";
            palmOlein.DescriptionAr = "زيت أولين نخيل مكرر ومبيض ومنزوع الرائحة لصناعة الأغذية والمقرمشات";
            palmOlein.IsActive = true;
            palmOlein.IsArchived = false;
        }

        // 4. Safely deactivate unsupported legacy materials (e.g. polymers, chemicals)
        var unsupportedMaterials = await context.Materials
            .Where(m => m.Code == "HDPE-BLOW-5502" || m.Code == "CHEM-ACETONE-995")
            .ToListAsync();
        foreach (var unp in unsupportedMaterials)
        {
            unp.IsActive = false;
            unp.IsArchived = true;
        }

        await context.SaveChangesAsync();

        var catalogProducts = new List<CatalogProduct>
        {
            // --- METALS (Supplier 1: Al-Ahram Steel) ---
            new()
            {
                MaterialId = steelRebar!.Id,
                CategoryId = metalsCategory!.Id,
                SupplierCompanyId = Supplier1CompanyId,
                Sku = "SKU-MET-REBAR-B500D",
                NameAr = "حديد تسليح عالي المقاومة B500D أطوال 12 متر",
                NameEn = "High-Tensile Steel Rebar Grade B500D 12m Lengths",
                DescriptionAr = "أسياخ صلب تسليح عالي المقاومة ES 262-2 مع إمكانية التوريد الفوري من مستودعات أكتوبر مع شهادات الجودة.",
                DescriptionEn = "High-tensile deformed reinforcing bars conforming to ES 262-2 with mill test certificates.",
                Specifications = "ES 262-2 / 2015, Grade B500D, 12m lengths, High yield strength",
                PricingMode = ProductPricingMode.Fixed,
                UnitPrice = 38500m,
                Currency = "EGP",
                Unit = "ton",
                AvailableQuantity = 500m,
                MinimumOrderQuantity = 10m,
                DeliveryLeadTimeDays = 3,
                IsActive = true
            },
            new()
            {
                MaterialId = steelBillet!.Id,
                CategoryId = metalsCategory!.Id,
                SupplierCompanyId = Supplier1CompanyId,
                Sku = "SKU-MET-BILLET-150",
                NameAr = "مربعات صلب بيليت 150×150 مم صب مستمر",
                NameEn = "Prime Continuous Cast Steel Billets 150x150mm",
                DescriptionAr = "خام بيليت مطابق للمواصفة 3SP/5SP لدرفلة حديد التسليح والقطاعات والأسلاك بمصانع الدرفلة.",
                DescriptionEn = "Prime continuous casting carbon steel square billets suitable for rebar and wire rod rolling mills.",
                Specifications = "Prime 3SP/5SP, 150x150mm section, 6m/12m length",
                PricingMode = ProductPricingMode.Fixed,
                UnitPrice = 32000m,
                Currency = "EGP",
                Unit = "ton",
                AvailableQuantity = 250m,
                MinimumOrderQuantity = 25m,
                DeliveryLeadTimeDays = 5,
                IsActive = true
            },
            new()
            {
                MaterialId = steelRebar!.Id,
                CategoryId = metalsCategory!.Id,
                SupplierCompanyId = Supplier1CompanyId,
                Sku = "SKU-MET-WIRE-ROD",
                NameAr = "لفائف أسلاك صلب منخفض الكربون SAE 1008 (مخزون محدود)",
                NameEn = "Low Carbon Wire Rods in Coils Grade SAE 1008 (Low Stock)",
                DescriptionAr = "لفائف أسلاك صلب قطر 5.5 مم لسحب الأسلاك وشبك التسليح - متبقي كمية محدودة للشحن الفوري.",
                DescriptionEn = "Prime quality wire rods 5.5mm in compact coils for wire drawing and welded wire mesh.",
                Specifications = "SAE 1008, 5.5mm diameter, in coils ~2 tons each",
                PricingMode = ProductPricingMode.Negotiable,
                UnitPrice = 39200m,
                Currency = "EGP",
                Unit = "ton",
                AvailableQuantity = 8m,
                MinimumOrderQuantity = 5m,
                DeliveryLeadTimeDays = 2,
                IsActive = true
            },

            // --- TEXTILES (Supplier 2: Mahalla Modern Yarns) ---
            new()
            {
                MaterialId = cottonYarn!.Id,
                CategoryId = textilesCategory!.Id,
                SupplierCompanyId = Supplier2CompanyId,
                Sku = "SKU-TEX-YARN-30-1",
                NameAr = "غزل قطن مصري 100% جيزة 94 مشط تمشيط Ne 30/1",
                NameEn = "100% Egyptian Combed Cotton Yarn Giza 94 Ne 30/1",
                DescriptionAr = "غزل حلقي ممشط فاخر تريكو ونسيج خالي من العقد ومنخفض الشوائب معيار Uster 5%.",
                DescriptionEn = "Premium ring-spun combed cotton yarn for high-end circular knitting and fine weaving.",
                Specifications = "Giza 94, Ne 30/1, Combed Ring Spun, Uster 5%",
                PricingMode = ProductPricingMode.Fixed,
                UnitPrice = 145000m,
                Currency = "EGP",
                Unit = "ton",
                AvailableQuantity = 120m,
                MinimumOrderQuantity = 2m,
                DeliveryLeadTimeDays = 7,
                IsActive = true
            },
            new()
            {
                MaterialId = cottonYarn!.Id,
                CategoryId = textilesCategory!.Id,
                SupplierCompanyId = Supplier2CompanyId,
                Sku = "SKU-TEX-YARN-24-1",
                NameAr = "غزل قطن مسرح طرف مفتوح Open-End Ne 24/1",
                NameEn = "Carded Open-End Cotton Yarn Ne 24/1",
                DescriptionAr = "غزل قطني عالي المتانة لأقمشة الجينز والملابس الثقيلة والمنسوجات المنزلية.",
                DescriptionEn = "Rotor spun carded cotton yarn optimized for denim, heavy apparel, and industrial fabrics.",
                Specifications = "100% Cotton, Open-End Carded, Ne 24/1",
                PricingMode = ProductPricingMode.Negotiable,
                UnitPrice = 110000m,
                Currency = "EGP",
                Unit = "ton",
                AvailableQuantity = 80m,
                MinimumOrderQuantity = 3m,
                DeliveryLeadTimeDays = 5,
                IsActive = true
            },
            new()
            {
                MaterialId = polyFiber!.Id,
                CategoryId = textilesCategory!.Id,
                SupplierCompanyId = Supplier2CompanyId,
                Sku = "SKU-TEX-FIBER-PSF",
                NameAr = "ألياف بوليستر قصيرة 1.4 دنيير × 38 مم نصف معتم (مخزون محدود)",
                NameEn = "Polyester Staple Fiber PSF 1.4D x 38mm Semi-Dull (Low Stock)",
                DescriptionAr = "ألياف بوليستر نقية 100% للغزل والخلط مع القطن أو تصنيع الأقمشة غير المنسوجة.",
                DescriptionEn = "Virgin semi-dull polyester staple fiber for ring spinning and non-woven fabric production.",
                Specifications = "1.4 Denier x 38mm, Semi-Dull, Virgin Polyester",
                PricingMode = ProductPricingMode.Fixed,
                UnitPrice = 68000m,
                Currency = "EGP",
                Unit = "ton",
                AvailableQuantity = 4m,
                MinimumOrderQuantity = 2m,
                DeliveryLeadTimeDays = 4,
                IsActive = true
            },

            // --- FOOD (Supplier 3: Delta Sugar & Commodities) ---
            new()
            {
                MaterialId = refinedSugar!.Id,
                CategoryId = foodCategory!.Id,
                SupplierCompanyId = Supplier3CompanyId,
                Sku = "SKU-FOOD-SUGAR-45",
                NameAr = "سكر أبيض مكرر درجة تصنيع غذائي ICUMSA 45 أكياس 50 كجم",
                NameEn = "Refined White Granulated Cane Sugar ICUMSA 45 (50kg Bags)",
                DescriptionAr = "سكر صناعي مكرر فائق النقاوة مطابق للمواصفة القياسية المصرية EOS 358 لمصانع الأغذية والمشروبات.",
                DescriptionEn = "High-purity industrial grade white crystal cane sugar for beverage, confectionery, and dairy production.",
                Specifications = "ICUMSA 45, Polarization 99.8% min, EOS 358, 50kg polypropylene bags",
                PricingMode = ProductPricingMode.Fixed,
                UnitPrice = 29500m,
                Currency = "EGP",
                Unit = "ton",
                AvailableQuantity = 1000m,
                MinimumOrderQuantity = 25m,
                DeliveryLeadTimeDays = 4,
                IsActive = true
            },
            new()
            {
                MaterialId = palmOlein!.Id,
                CategoryId = foodCategory!.Id,
                SupplierCompanyId = Supplier3CompanyId,
                Sku = "SKU-FOOD-PALM-OLEIN-CP8",
                NameAr = "زيت أولين النخيل الغذائي المكرر RBD CP8 صهاريج فلكسي تانك",
                NameEn = "RBD Palm Olein Edible Oil CP8 Bulk / Flexitank",
                DescriptionAr = "زيت طعام صناعي نقي مكرر ومبيض ومزال الرائحة مطابق لمواصفات الكودكس للصناعات الغذائية والقلي.",
                DescriptionEn = "Refined bleached deodorized palm olein cloud point 8 deg C in bulk tankers and food flexitanks.",
                Specifications = "RBD Palm Olein CP8, FFA 0.1% max, IV 56 min",
                PricingMode = ProductPricingMode.Negotiable,
                UnitPrice = 52000m,
                Currency = "EGP",
                Unit = "ton",
                AvailableQuantity = 300m,
                MinimumOrderQuantity = 10m,
                DeliveryLeadTimeDays = 3,
                IsActive = true
            },
            new()
            {
                MaterialId = refinedSugar!.Id,
                CategoryId = foodCategory!.Id,
                SupplierCompanyId = Supplier3CompanyId,
                Sku = "SKU-FOOD-SUGAR-LIQUID",
                NameAr = "شراب سكر مكرر سائل للمصانع الغذائية (غير متوفر حالياً)",
                NameEn = "Industrial Liquid Invert Sugar Syrup (Currently Out of Stock)",
                DescriptionAr = "محلول سكري عالي التركيز للمخابز والمشروبات الصناعية - غير متاح حالياً للتسليم الفوري.",
                DescriptionEn = "Liquid sucrose syrup 67 Brix for beverage bottling plants, confectionery, and dairy manufacturing.",
                Specifications = "67 Brix, Invert Sugar Liquid Syrup, Food Grade",
                PricingMode = ProductPricingMode.Fixed,
                UnitPrice = 34000m,
                Currency = "EGP",
                Unit = "ton",
                AvailableQuantity = 0m,
                MinimumOrderQuantity = 5m,
                DeliveryLeadTimeDays = 14,
                IsActive = true
            }
        };

        foreach (var p in catalogProducts)
        {
            var existing = await context.CatalogProducts.FirstOrDefaultAsync(x => x.Sku == p.Sku);
            if (existing == null)
            {
                context.CatalogProducts.Add(p);
            }
            else
            {
                existing.CategoryId = p.CategoryId;
                existing.PricingMode = p.PricingMode;
                existing.Unit = p.Unit;
                existing.Specifications = p.Specifications;
                existing.UnitPrice = p.UnitPrice;
                existing.AvailableQuantity = p.AvailableQuantity;
                existing.MinimumOrderQuantity = p.MinimumOrderQuantity;
                existing.DeliveryLeadTimeDays = p.DeliveryLeadTimeDays;
                existing.IsActive = p.IsActive;
            }
        }
        await context.SaveChangesAsync();
        logger.LogDebug("DemoDataSeeder: Catalog products seeded.");
    }

    private static async Task SeedRfqsAndOffersAsync(DealZoneDbContext context, ILogger logger)
    {
        var metalsCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "METALS");
        var textilesCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "TEXTILES");
        var foodCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "FOOD");
        var tonUnit = await context.UnitsOfMeasure.FirstOrDefaultAsync(u => u.Code == "ton");

        var steelRebar = await context.Materials.FirstOrDefaultAsync(m => m.Code == "STEEL-REBAR-B500D");
        var cottonYarn = await context.Materials.FirstOrDefaultAsync(m => m.Code == "COTTON-YARN-GIZA");
        var refinedSugar = await context.Materials.FirstOrDefaultAsync(m => m.Code == "FOOD-SUGAR-REFINED");
        var palmOlein = await context.Materials.FirstOrDefaultAsync(m => m.Code == "FOOD-PALM-OLEIN");
        var polyFiber = await context.Materials.FirstOrDefaultAsync(m => m.Code == "POLY-FIBER-PSF");

        // 1. RFQ 101: Steel Rebar (Published, has 2 competing offers + 1 withdrawn offer)
        var rfq101 = await context.Rfqs.Include(r => r.Items).FirstOrDefaultAsync(r => r.RfqNumber == "RFQ-2026-00101");
        if (rfq101 == null)
        {
            rfq101 = new Rfq
            {
                RfqNumber = "RFQ-2026-00101",
                BuyerCompanyId = Buyer1CompanyId,
                Title = "توريد 120 طن حديد تسليح عالي المقاومة B500D لموقع مصنع العاشر",
                Description = "مطلوب توريد صلب تسليح أقطار 16 مم و 20 مم أطوال 12 متراً مطابق للمواصفة القياسية المصرية ES 262-2 مع إرفاق شهادة الفحص المعملي للمصنع.",
                Status = RfqStatus.Published,
                DeliveryGovernorate = "الشرقية",
                DeliveryCity = "العاشر من رمضان",
                DeliveryAddress = "موقع المصنع، القطعة 42 المنطقة الصناعية B3",
                TargetCategoryId = metalsCategory?.Id,
                RequiredDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(14),
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(5),
                PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-2),
                TargetBudget = 4600000m,
                Currency = "EGP"
            };
            rfq101.Items.Add(new RfqItem { CategoryId = metalsCategory!.Id, MaterialId = steelRebar?.Id, MaterialName = "حديد تسليح B500D (16 مم)", Specifications = "صلب عالي المقاومة ES 262-2 أطوال 12م", Quantity = 70, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit!.Id, TargetPricePerUnit = 38500m, LineNumber = 1 });
            rfq101.Items.Add(new RfqItem { CategoryId = metalsCategory.Id, MaterialId = steelRebar?.Id, MaterialName = "حديد تسليح B500D (20 مم)", Specifications = "صلب عالي المقاومة ES 262-2 أطوال 12م", Quantity = 50, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit.Id, TargetPricePerUnit = 38500m, LineNumber = 2 });
            context.Rfqs.Add(rfq101);
            await context.SaveChangesAsync();
        }

        // 2. RFQ 102: Cotton Yarn (Published, single offer from Mahalla)
        var rfq102 = await context.Rfqs.Include(r => r.Items).FirstOrDefaultAsync(r => r.RfqNumber == "RFQ-2026-00102");
        if (rfq102 == null)
        {
            rfq102 = new Rfq
            {
                RfqNumber = "RFQ-2026-00102",
                BuyerCompanyId = DualCompanyId,
                Title = "توريد 25 طن غزل قطن مصري 100% جيزة مشط تمشيط Ne 30/1",
                Description = "مطلوب توريد كونات غزل حلقي لمصنع المنسوجات مع خلوها من العقد ومطابقتها لمعايير Uster العالمية.",
                Status = RfqStatus.Published,
                DeliveryGovernorate = "الإسكندرية",
                DeliveryCity = "برج العرب",
                DeliveryAddress = "مجمع النسيج، المنطقة الصناعية الأولى",
                TargetCategoryId = textilesCategory?.Id,
                RequiredDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(20),
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(7),
                PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
                TargetBudget = 2450000m,
                Currency = "EGP"
            };
            rfq102.Items.Add(new RfqItem { CategoryId = textilesCategory!.Id, MaterialId = cottonYarn?.Id, MaterialName = "غزل قطن مصري 100% جيزة 94", Specifications = "نمرة 30/1 تمشيط خالي من الشوائب", Quantity = 25, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit!.Id, TargetPricePerUnit = 98000m, LineNumber = 1 });
            context.Rfqs.Add(rfq102);
            await context.SaveChangesAsync();
        }

        // 3. RFQ 103: Refined Sugar (Published, Expiring Soon, Zero offers yet)
        var rfq103 = await context.Rfqs.Include(r => r.Items).FirstOrDefaultAsync(r => r.RfqNumber == "RFQ-2026-00103");
        if (rfq103 == null)
        {
            rfq103 = new Rfq
            {
                RfqNumber = "RFQ-2026-00103",
                BuyerCompanyId = Buyer2CompanyId,
                Title = "توريد 50 طن سكر أبيض مكرر درجة تصنيع غذائي ICUMSA 45 (فرصة توريد مفتوحة)",
                Description = "توريد سكر صناعي معبأ بأجولة 50 كجم لمصانع الأغذية مع مطابقة المواصفة القياسية المصرية EOS 358.",
                Status = RfqStatus.Published,
                DeliveryGovernorate = "الجيزة",
                DeliveryCity = "السادس من أكتوبر",
                DeliveryAddress = "المنطقة الصناعية الأولى، مجمع الصناعات الغذائية",
                TargetCategoryId = foodCategory?.Id,
                RequiredDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(10),
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(2), // Expiring in 2 days
                PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-3),
                TargetBudget = 1500000m,
                Currency = "EGP"
            };
            rfq103.Items.Add(new RfqItem { CategoryId = foodCategory!.Id, MaterialId = refinedSugar?.Id, MaterialName = "سكر أبيض مكرر ICUMSA 45", Specifications = "أجولة 50 كجم نقاوة 99.8%", Quantity = 50, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit!.Id, TargetPricePerUnit = 30000m, LineNumber = 1 });
            context.Rfqs.Add(rfq103);
            await context.SaveChangesAsync();
        }

        // 4. RFQ 104: Draft RFQ (Created by Buyer, not yet published)
        if (!await context.Rfqs.AnyAsync(r => r.RfqNumber == "RFQ-2026-00104"))
        {
            var rfq104 = new Rfq
            {
                RfqNumber = "RFQ-2026-00104",
                BuyerCompanyId = Buyer1CompanyId,
                Title = "مسودة طلب سعر: توريد 40 طن خامات بيليت صلب درفلة",
                Description = "مسودة إعداد طلب سعر لبيليت الصلب قيد المراجعة الفنية من قسم المشتريات.",
                Status = RfqStatus.Draft,
                DeliveryGovernorate = "الشرقية",
                DeliveryCity = "العاشر من رمضان",
                DeliveryAddress = "المصنع الرئيسي، العاشر من رمضان",
                TargetCategoryId = metalsCategory?.Id,
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(15),
                TargetBudget = 1300000m,
                Currency = "EGP"
            };
            rfq104.Items.Add(new RfqItem { CategoryId = metalsCategory!.Id, MaterialName = "بيليت صلب 150 مم", Specifications = "3SP درفلة", Quantity = 40, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit!.Id, TargetPricePerUnit = 32500m, LineNumber = 1 });
            context.Rfqs.Add(rfq104);
        }

        // 5. RFQ 105: Closed RFQ (Evaluated and Accepted - Led to Deal 2026-0042)
        var rfq105 = await context.Rfqs.Include(r => r.Items).FirstOrDefaultAsync(r => r.RfqNumber == "RFQ-2026-00105");
        if (rfq105 == null)
        {
            rfq105 = new Rfq
            {
                RfqNumber = "RFQ-2026-00105",
                BuyerCompanyId = Buyer2CompanyId,
                Title = "توريد 40 طن زيت أولين نخيل غذائي RBD CP8 لمصنع الأغذية بأكتوبر",
                Description = "طلب توريد زيت طعام صناعي سائل للمصانع، تم إغلاقه وترسية العرض الفائز.",
                Status = RfqStatus.Closed,
                DeliveryGovernorate = "الجيزة",
                DeliveryCity = "السادس من أكتوبر",
                DeliveryAddress = "مستودعات مصانع مصر للأغذية بأكتوبر",
                TargetCategoryId = foodCategory?.Id,
                RequiredDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(5),
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(-2),
                PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-10),
                TargetBudget = 2100000m,
                Currency = "EGP"
            };
            rfq105.Items.Add(new RfqItem { CategoryId = foodCategory!.Id, MaterialId = palmOlein?.Id, MaterialName = "زيت أولين نخيل CP8", Specifications = "فلكسي تانك معقم", Quantity = 40, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit!.Id, TargetPricePerUnit = 52500m, LineNumber = 1 });
            context.Rfqs.Add(rfq105);
            await context.SaveChangesAsync();
        }

        // 6. RFQ 106: Cancelled RFQ
        if (!await context.Rfqs.AnyAsync(r => r.RfqNumber == "RFQ-2026-00106"))
        {
            var rfq106 = new Rfq
            {
                RfqNumber = "RFQ-2026-00106",
                BuyerCompanyId = DualCompanyId,
                Title = "طلب توريد 30 طن ألياف بوليستر قصيرة PSF (تم الإلغاء)",
                Description = "تم إلغاء الطلب رسمياً بناءً على تعديل خطة الإنتاج وتوافر مخزون كافي بالمستودعات.",
                Status = RfqStatus.Cancelled,
                DeliveryGovernorate = "الإسكندرية",
                DeliveryCity = "برج العرب",
                DeliveryAddress = "مخازن برج العرب",
                TargetCategoryId = textilesCategory?.Id,
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(-5),
                PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-15),
                TargetBudget = 2000000m,
                Currency = "EGP"
            };
            rfq106.Items.Add(new RfqItem { CategoryId = textilesCategory!.Id, MaterialId = polyFiber?.Id, MaterialName = "ألياف بوليستر قصيرة", Specifications = "1.4D x 38mm", Quantity = 30, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit!.Id, TargetPricePerUnit = 67000m, LineNumber = 1 });
            context.Rfqs.Add(rfq106);
        }
        await context.SaveChangesAsync();

        // --- Seed Offers on RFQs ---
        // Offer 1 on RFQ 101 from Supplier 1 (Al-Ahram): Submitted
        if (!await context.Offers.AnyAsync(o => o.OfferNumber == "OFF-2026-00101"))
        {
            var o1 = new Offer
            {
                OfferNumber = "OFF-2026-00101",
                RfqId = rfq101.Id,
                SupplierCompanyId = Supplier1CompanyId,
                Status = OfferStatus.Submitted,
                TotalAmount = 4560000m,
                Currency = "EGP",
                ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(10),
                DeliveryLeadTimeDays = 7,
                ShippingIncluded = true,
                PaymentTerms = "اعتماد مستندي أو سداد بنكي 50% مقدم و 50% عند الاستلام والفحص",
                Notes = "الخامات متوفرة بمستودعات أكتوبر وجاهزة للشحن الفوري بشاحنات مسطحة مع شهادات الفحص.",
                SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
                RevisionNumber = 1
            };
            foreach (var item in rfq101.Items)
            {
                o1.Items.Add(new OfferItem { RfqItemId = item.Id, UnitPrice = 38000m, OfferedQuantity = item.Quantity, TotalPrice = 38000m * item.Quantity, MaterialSpecifications = item.Specifications });
            }
            context.Offers.Add(o1);
        }

        // Offer 2 on RFQ 101 from Dual Company (Alexandria Trade): Competing Offer
        if (!await context.Offers.AnyAsync(o => o.OfferNumber == "OFF-2026-00102"))
        {
            var o2 = new Offer
            {
                OfferNumber = "OFF-2026-00102",
                RfqId = rfq101.Id,
                SupplierCompanyId = DualCompanyId,
                Status = OfferStatus.Submitted,
                TotalAmount = 4584000m,
                Currency = "EGP",
                ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(8),
                DeliveryLeadTimeDays = 5, // Faster delivery
                ShippingIncluded = true,
                PaymentTerms = "سداد نقدي بخصم 1% أو تحويل بنكي خلال 14 يوماً من الفحص",
                Notes = "توريد من مصانع الإسكندرية مع تسليم مباشر على ظهر الشاحنة بموقع المشتري.",
                SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-1).AddHours(4),
                RevisionNumber = 1
            };
            foreach (var item in rfq101.Items)
            {
                o2.Items.Add(new OfferItem { RfqItemId = item.Id, UnitPrice = 38200m, OfferedQuantity = item.Quantity, TotalPrice = 38200m * item.Quantity, MaterialSpecifications = "صلب تسليح B500D عالي الجودة" });
            }
            context.Offers.Add(o2);
        }

        // Offer 3 on RFQ 102 from Mahalla Yarns: Revised Offer with Revision Lineage
        var origOffer3 = await context.Offers.FirstOrDefaultAsync(o => o.OfferNumber == "OFF-2026-00103-R1");
        if (origOffer3 == null)
        {
            origOffer3 = new Offer
            {
                OfferNumber = "OFF-2026-00103-R1",
                RfqId = rfq102.Id,
                SupplierCompanyId = Supplier2CompanyId,
                Status = OfferStatus.Superseded, // Replaced by R2
                TotalAmount = 2500000m,
                Currency = "EGP",
                ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(10),
                DeliveryLeadTimeDays = 10,
                ShippingIncluded = false,
                PaymentTerms = "تحويل بنكي 100% قبل الشحن",
                Notes = "العرض المبدئي قبل مراجعة تكلفة النقل.",
                SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-2),
                RevisionNumber = 1
            };
            foreach (var item in rfq102.Items)
            {
                origOffer3.Items.Add(new OfferItem { RfqItemId = item.Id, UnitPrice = 100000m, OfferedQuantity = item.Quantity, TotalPrice = 100000m * item.Quantity, MaterialSpecifications = item.Specifications });
            }
            context.Offers.Add(origOffer3);
            await context.SaveChangesAsync();

            // Active Revision 2
            var revOffer3 = new Offer
            {
                OfferNumber = "OFF-2026-00103",
                RfqId = rfq102.Id,
                SupplierCompanyId = Supplier2CompanyId,
                OriginalOfferId = origOffer3.Id,
                RevisionNumber = 2,
                Status = OfferStatus.Submitted,
                TotalAmount = 2425000m, // Competitive price reduction
                Currency = "EGP",
                ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(12),
                DeliveryLeadTimeDays = 7,
                ShippingIncluded = true,
                PaymentTerms = "سداد 50% تعاقد و 50% بعد الفحص والاستلام",
                Notes = "تعديل رسمي للأسعار مع تحمل تكاليف الشحن من المحلة إلى برج العرب.",
                SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-1)
            };
            foreach (var item in rfq102.Items)
            {
                revOffer3.Items.Add(new OfferItem { RfqItemId = item.Id, UnitPrice = 97000m, OfferedQuantity = item.Quantity, TotalPrice = 97000m * item.Quantity, MaterialSpecifications = "غزل قطن مصري 100% جيزة مشط شامل الشحن" });
            }
            context.Offers.Add(revOffer3);
        }

        // Offer 4 on RFQ 105: Accepted Offer (Led to Deal 2026-0042)
        if (!await context.Offers.AnyAsync(o => o.OfferNumber == "OFF-2026-00105"))
        {
            var o4 = new Offer
            {
                OfferNumber = "OFF-2026-00105",
                RfqId = rfq105.Id,
                SupplierCompanyId = Supplier3CompanyId,
                Status = OfferStatus.Accepted,
                TotalAmount = 2080000m,
                Currency = "EGP",
                ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(5),
                DeliveryLeadTimeDays = 3,
                ShippingIncluded = true,
                PaymentTerms = "سداد بنكي فوري عند التسليم والفحص الفني",
                Notes = "تم اعتماد العرض والتعاقد الرسمي عبر المنصة.",
                SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-6),
                AcceptedAtUtc = DateTimeOffset.UtcNow.AddDays(-5),
                RevisionNumber = 1
            };
            foreach (var item in rfq105.Items)
            {
                o4.Items.Add(new OfferItem { RfqItemId = item.Id, UnitPrice = 52000m, OfferedQuantity = item.Quantity, TotalPrice = 52000m * item.Quantity, MaterialSpecifications = item.Specifications });
            }
            context.Offers.Add(o4);
        }

        // Offer 5 on RFQ 105: Rejected Offer
        if (!await context.Offers.AnyAsync(o => o.OfferNumber == "OFF-2026-00106"))
        {
            var o5 = new Offer
            {
                OfferNumber = "OFF-2026-00106",
                RfqId = rfq105.Id,
                SupplierCompanyId = Supplier1CompanyId,
                Status = OfferStatus.Rejected,
                TotalAmount = 2160000m,
                Currency = "EGP",
                ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(5),
                DeliveryLeadTimeDays = 6,
                ShippingIncluded = false,
                PaymentTerms = "سداد 100% مقدماً",
                Notes = "تم الرفض لارتفاع السعر وعدم شمول الشحن.",
                SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-7),
                RejectedAtUtc = DateTimeOffset.UtcNow.AddDays(-5),
                RevisionNumber = 1
            };
            foreach (var item in rfq105.Items)
            {
                o5.Items.Add(new OfferItem { RfqItemId = item.Id, UnitPrice = 54000m, OfferedQuantity = item.Quantity, TotalPrice = 54000m * item.Quantity, MaterialSpecifications = item.Specifications });
            }
            context.Offers.Add(o5);
        }

        // Offer 6 on RFQ 101: Withdrawn Offer
        if (!await context.Offers.AnyAsync(o => o.OfferNumber == "OFF-2026-00107"))
        {
            var o6 = new Offer
            {
                OfferNumber = "OFF-2026-00107",
                RfqId = rfq101.Id,
                SupplierCompanyId = Supplier3CompanyId,
                Status = OfferStatus.Withdrawn,
                TotalAmount = 4700000m,
                Currency = "EGP",
                ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(5),
                DeliveryLeadTimeDays = 14,
                ShippingIncluded = false,
                PaymentTerms = "سداد نقدي",
                Notes = "تم سحب العرض نظراً لارتباط خط الإنتاج بطلبيات تعاقدية مسبقة.",
                SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-3),
                WithdrawnAtUtc = DateTimeOffset.UtcNow.AddDays(-2),
                WithdrawalReason = "عدم توفر مخزون كافي للشحن الفوري والتزام الشاحنات بعقود أخرى.",
                RevisionNumber = 1
            };
            foreach (var item in rfq101.Items)
            {
                o6.Items.Add(new OfferItem { RfqItemId = item.Id, UnitPrice = 39166m, OfferedQuantity = item.Quantity, TotalPrice = 39166m * item.Quantity, MaterialSpecifications = item.Specifications });
            }
            context.Offers.Add(o6);
        }

        await context.SaveChangesAsync();
        logger.LogDebug("DemoDataSeeder: RFQs and offers seeded.");
    }

    private static async Task SeedTendersAndBidsAsync(DealZoneDbContext context, ILogger logger)
    {
        var metalsCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "METALS");
        var textilesCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "TEXTILES");
        var foodCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "FOOD");
        var tonUnit = await context.UnitsOfMeasure.FirstOrDefaultAsync(u => u.Code == "ton");

        var steelRebar = await context.Materials.FirstOrDefaultAsync(m => m.Code == "STEEL-REBAR-B500D");
        var steelBillet = await context.Materials.FirstOrDefaultAsync(m => m.Code == "STEEL-BILLET-3SP");
        var cottonYarn = await context.Materials.FirstOrDefaultAsync(m => m.Code == "COTTON-YARN-GIZA");
        var refinedSugar = await context.Materials.FirstOrDefaultAsync(m => m.Code == "FOOD-SUGAR-REFINED");

        // 1. TENDER 201: Active Live Reverse Bidding (Published, 3 suppliers competing, price reductions & revisions!)
        var t201 = await context.Tenders.Include(t => t.Items).Include(t => t.Bids).FirstOrDefaultAsync(t => t.TenderNumber == "TND-2026-00201");
        if (t201 == null)
        {
            t201 = new Tender
            {
                TenderNumber = "TND-2026-00201",
                BuyerCompanyId = Buyer1CompanyId,
                Title = "مناقصة عكسية: توريد 200 طن صلب تسليح وبيليت إنشائي - مجمع العاشر من رمضان",
                Description = "مناقصة مفتوحة للموردين المعتمدين لتوريد 150 طن حديد تسليح B500D و 50 طن بيليت درفلة مع اشتراط أدنى سعر منافس وتأمين ابتدائي.",
                Status = TenderStatus.Published,
                DeliveryGovernorate = "الشرقية",
                DeliveryCity = "العاشر من رمضان",
                DeliveryAddress = "موقع مصنع العاشر B3، الشرقية",
                TargetCategoryId = metalsCategory?.Id,
                RequiredDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(25),
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(5), // Active live tender
                PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-3),
                ReferencePrice = 7500000m,
                Currency = "EGP",
                Notes = "يتم التقييم آلياً وفقاً لأقل إجمالي عطاء مطابق للمواصفات الفنية."
            };
            t201.Items.Add(new TenderItem { CategoryId = metalsCategory!.Id, MaterialId = steelRebar?.Id, MaterialName = "حديد تسليح B500D عالي المقاومة", Specifications = "أقطار 16 مم و 20 مم أطوال 12م ES 262-2", Quantity = 150, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit!.Id, LineNumber = 1 });
            t201.Items.Add(new TenderItem { CategoryId = metalsCategory.Id, MaterialId = steelBillet?.Id, MaterialName = "مربعات صلب بيليت 150×150 مم", Specifications = "صب مستمر 3SP درفلة", Quantity = 50, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit.Id, LineNumber = 2 });
            context.Tenders.Add(t201);
            await context.SaveChangesAsync();
        }

        // Bids on Tender 201:
        // Bid 1 (Supplier 1: Al-Ahram Steel) - Revised Bid stealing the lead!
        var t201Item1 = t201.Items.First(i => i.LineNumber == 1);
        var t201Item2 = t201.Items.First(i => i.LineNumber == 2);

        var origBid1 = await context.Bids.FirstOrDefaultAsync(b => b.BidNumber == "BID-2026-00201-R1");
        if (origBid1 == null)
        {
            origBid1 = new Bid
            {
                BidNumber = "BID-2026-00201-R1",
                TenderId = t201.Id,
                SupplierCompanyId = Supplier1CompanyId,
                Status = BidStatus.Superseded,
                TotalAmount = 7350000m,
                Currency = "EGP",
                ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(15),
                DeliveryLeadTimeDays = 7,
                ShippingIncluded = true,
                PaymentTerms = "اعتماد مستندي أو سداد بنكي 50% مقدم و 50% عند الفحص",
                Notes = "العطاء الأولي من الأهرام للصلب.",
                SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-2),
                RevisionNumber = 1
            };
            origBid1.Items.Add(new BidItem { TenderItemId = t201Item1.Id, UnitPrice = 38000m, Quantity = 150, TotalPrice = 5700000m, Notes = "B500D مصري مطابق" });
            origBid1.Items.Add(new BidItem { TenderItemId = t201Item2.Id, UnitPrice = 33000m, Quantity = 50, TotalPrice = 1650000m, Notes = "بيليت 150 مم صب مستمر" });
            context.Bids.Add(origBid1);
            await context.SaveChangesAsync();

            // Bid 1 Revision 2 (Active Leader: 7,100,000 EGP!)
            var revBid1 = new Bid
            {
                BidNumber = "BID-2026-00201-A",
                TenderId = t201.Id,
                SupplierCompanyId = Supplier1CompanyId,
                OriginalBidId = origBid1.Id,
                RevisionNumber = 2,
                Status = BidStatus.Submitted,
                TotalAmount = 7100000m, // Lowest Active Bid!
                Currency = "EGP",
                ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(15),
                DeliveryLeadTimeDays = 5,
                ShippingIncluded = true,
                PaymentTerms = "سداد بنكي بعد الفحص والاستلام بموقع العاشر",
                Notes = "عطاء منافس مخفض في جولة المزايدة العكسية لانتزاع الصدارة.",
                ChangeSummary = "تخفيض سعر طن التسليح إلى 37,000 ج.م وسعر البيليت إلى 31,000 ج.م مع تقليص مدة التوريد إلى 5 أيام.",
                SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-1)
            };
            revBid1.Items.Add(new BidItem { TenderItemId = t201Item1.Id, UnitPrice = 37000m, Quantity = 150, TotalPrice = 5550000m, Notes = "B500D مصري معتمد" });
            revBid1.Items.Add(new BidItem { TenderItemId = t201Item2.Id, UnitPrice = 31000m, Quantity = 50, TotalPrice = 1550000m, Notes = "بيليت 150 مم صب مستمر" });
            context.Bids.Add(revBid1);
        }

        // Bid 2 (Supplier 6: Alexandria Dual Enterprise) - Competing Bid (7,250,000 EGP)
        if (!await context.Bids.AnyAsync(b => b.BidNumber == "BID-2026-00201-B"))
        {
            var bid2 = new Bid
            {
                BidNumber = "BID-2026-00201-B",
                TenderId = t201.Id,
                SupplierCompanyId = DualCompanyId,
                Status = BidStatus.Submitted,
                TotalAmount = 7250000m,
                Currency = "EGP",
                ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(12),
                DeliveryLeadTimeDays = 6,
                ShippingIncluded = true,
                PaymentTerms = "سداد 100% خلال 14 يوماً من الاستلام",
                Notes = "عطاء توريد منافس من شركة الإسكندرية المشتركة.",
                SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-1).AddHours(2),
                RevisionNumber = 1
            };
            bid2.Items.Add(new BidItem { TenderItemId = t201Item1.Id, UnitPrice = 37500m, Quantity = 150, TotalPrice = 5625000m, Notes = "حديد تسليح B500D معتمد" });
            bid2.Items.Add(new BidItem { TenderItemId = t201Item2.Id, UnitPrice = 32500m, Quantity = 50, TotalPrice = 1625000m, Notes = "بيليت صلب درفلة" });
            context.Bids.Add(bid2);
        }

        // Bid 3 (Withdrawn Bid by Supplier 2)
        if (!await context.Bids.AnyAsync(b => b.BidNumber == "BID-2026-00201-C"))
        {
            var bid3 = new Bid
            {
                BidNumber = "BID-2026-00201-C",
                TenderId = t201.Id,
                SupplierCompanyId = Supplier2CompanyId,
                Status = BidStatus.Withdrawn,
                TotalAmount = 7500000m,
                Currency = "EGP",
                ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(10),
                DeliveryLeadTimeDays = 12,
                ShippingIncluded = false,
                PaymentTerms = "سداد نقدي",
                Notes = "تم الانسحاب رسمياً لتغير تكلفة مدخلات الإنتاج.",
                SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-2).AddHours(2),
                WithdrawnAtUtc = DateTimeOffset.UtcNow.AddDays(-1).AddHours(6),
                WithdrawalReason = "تذبذب أسعار الخامات العالمية وعدم التمكن من تثبيت سعر الصرف للشحن البحري.",
                RevisionNumber = 1
            };
            bid3.Items.Add(new BidItem { TenderItemId = t201Item1.Id, UnitPrice = 39000m, Quantity = 150, TotalPrice = 5850000m, Notes = "صلب تسليح" });
            bid3.Items.Add(new BidItem { TenderItemId = t201Item2.Id, UnitPrice = 33000m, Quantity = 50, TotalPrice = 1650000m, Notes = "بيليت درفلة" });
            context.Bids.Add(bid3);
        }

        // 2. TENDER 202: Awarded Tender (Led to Deal 2026-0051)
        var t202 = await context.Tenders.Include(t => t.Items).Include(t => t.Bids).FirstOrDefaultAsync(t => t.TenderNumber == "TND-2026-00202");
        if (t202 == null)
        {
            t202 = new Tender
            {
                TenderNumber = "TND-2026-00202",
                BuyerCompanyId = DualCompanyId,
                Title = "مناقصة توريد 60 طن غزل قطن ممشط جيزة 94 لمصانع برج العرب (تمت الترسية)",
                Description = "مناقصة لتوريد غزل قطني ممتاز، تم استلام العطاءات وترسيتها على العطاء الأفضل فنياً ومالياً.",
                Status = TenderStatus.Awarded,
                DeliveryGovernorate = "الإسكندرية",
                DeliveryCity = "برج العرب",
                DeliveryAddress = "مجمع النسيج، برج العرب الجديدة",
                TargetCategoryId = textilesCategory?.Id,
                RequiredDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(15),
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(-3),
                PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-14),
                ReferencePrice = 6000000m,
                Currency = "EGP",
                AwardedAtUtc = DateTimeOffset.UtcNow.AddDays(-2),
                AwardedByUserId = DualUserId,
                AwardRationale = "تمت الترسية على شركة المحلة للغزول لتقديمها أقل سعر مطابق للمواصفة القياسية مع شهادة فحص الجودة Uster."
            };
            var t202Item = new TenderItem { CategoryId = textilesCategory!.Id, MaterialId = cottonYarn?.Id, MaterialName = "غزل قطن مصري جيزة 94 ممشط 30/1", Specifications = "كونات معقمة معيار Uster 5%", Quantity = 60, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit!.Id, LineNumber = 1 };
            t202.Items.Add(t202Item);

            var winningBid = new Bid
            {
                BidNumber = "BID-2026-00202-WIN",
                Tender = t202,
                SupplierCompanyId = Supplier2CompanyId,
                Status = BidStatus.Accepted,
                TotalAmount = 5700000m,
                Currency = "EGP",
                ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(10),
                DeliveryLeadTimeDays = 7,
                ShippingIncluded = true,
                PaymentTerms = "اعتماد مستندي بنكي معزز",
                Notes = "العطاء الفائز بمناقصة توريد الغزل.",
                SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-8),
                AcceptedAtUtc = DateTimeOffset.UtcNow.AddDays(-2),
                RevisionNumber = 1
            };
            winningBid.Items.Add(new BidItem { TenderItem = t202Item, UnitPrice = 95000m, Quantity = 60, TotalPrice = 5700000m, Notes = "غزل قطن مصري مطابق 100%" });
            t202.Bids.Add(winningBid);

            context.Tenders.Add(t202);
            await context.SaveChangesAsync();

            t202.AwardedBidId = winningBid.Id;
            await context.SaveChangesAsync();
        }

        // 3. TENDER 203: Closed Tender (Evaluating bids)
        if (!await context.Tenders.AnyAsync(t => t.TenderNumber == "TND-2026-00203"))
        {
            var t203 = new Tender
            {
                TenderNumber = "TND-2026-00203",
                BuyerCompanyId = Buyer2CompanyId,
                Title = "مناقصة توريد 100 طن سكر نقي وزيوت صناعية لمصانع أكتوبر (مغلقة - قيد التقييم)",
                Description = "انتهت فترة تقديم العطاءات وحالياً تجري لجنة المشتريات تقييم عروض التوريد.",
                Status = TenderStatus.Closed,
                DeliveryGovernorate = "الجيزة",
                DeliveryCity = "السادس من أكتوبر",
                DeliveryAddress = "المنطقة الصناعية الأولى، أكتوبر",
                TargetCategoryId = foodCategory?.Id,
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(-1),
                PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-10),
                ReferencePrice = 3500000m,
                Currency = "EGP"
            };
            t203.Items.Add(new TenderItem { CategoryId = foodCategory!.Id, MaterialId = refinedSugar?.Id, MaterialName = "سكر أبيض مكرر 50 كجم", Specifications = "ICUMSA 45", Quantity = 100, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit!.Id, LineNumber = 1 });
            context.Tenders.Add(t203);
        }

        // 4. TENDER 204: NoAward Tender (Bids exceeded reference budget)
        if (!await context.Tenders.AnyAsync(t => t.TenderNumber == "TND-2026-00204"))
        {
            var t204 = new Tender
            {
                TenderNumber = "TND-2026-00204",
                BuyerCompanyId = Buyer1CompanyId,
                Title = "مناقصة توريد قطاعات صلب ثقيلة مستوردة (عدم ترسية - تجاوز الميزانية)",
                Description = "تقرر إلغاء الترسية نظراً لتجاوز جميع العروض المقدمة الميزانية التقديرية المعتمدة للمشروع.",
                Status = TenderStatus.NoAward,
                DeliveryGovernorate = "الشرقية",
                DeliveryCity = "العاشر من رمضان",
                DeliveryAddress = "موقع العاشر",
                TargetCategoryId = metalsCategory?.Id,
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(-8),
                PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-20),
                ReferencePrice = 2800000m,
                Currency = "EGP",
                AwardRationale = "جميع العروض المقدمة تجاوزت السعر المرجعي المعتمد بنسبة تزيد عن 25%، وسيتم إعادة طرح المناقصة بمواصفات معدلة."
            };
            t204.Items.Add(new TenderItem { CategoryId = metalsCategory!.Id, MaterialName = "كمرات صلب ثقيلة HEB", Specifications = "صلب أوروبي مستورد", Quantity = 40, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit!.Id, LineNumber = 1 });
            context.Tenders.Add(t204);
        }

        // 5. TENDER 205: Cancelled Tender
        if (!await context.Tenders.AnyAsync(t => t.TenderNumber == "TND-2026-00205"))
        {
            var t205 = new Tender
            {
                TenderNumber = "TND-2026-00205",
                BuyerCompanyId = Buyer2CompanyId,
                Title = "مناقصة توريد 50 طن نشا ذرة غذائي (ملغاة من المشتري)",
                Description = "تم إلغاء المناقصة من قِبل إدارة المشتريات لتأجيل تشغيل خط الإنتاج المخصص.",
                Status = TenderStatus.Cancelled,
                DeliveryGovernorate = "الجيزة",
                DeliveryCity = "السادس من أكتوبر",
                DeliveryAddress = "مجمع مصانع الأغذية بأكتوبر",
                TargetCategoryId = foodCategory?.Id,
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(-4),
                PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-12),
                ReferencePrice = 1200000m,
                Currency = "EGP",
                CancelledAtUtc = DateTimeOffset.UtcNow.AddDays(-5),
                CancelledByUserId = Buyer2UserId,
                CancellationReason = "إعادة هيكلة خطوط الإنتاج الغذائي وتأجيل التشغيل إلى الربع الثاني من العام المالي."
            };
            t205.Items.Add(new TenderItem { CategoryId = foodCategory!.Id, MaterialName = "نشا ذرة غذائي معبأ", Specifications = "نقاوة 99.5%", Quantity = 50, Unit = MaterialUnit.MetricTon, UnitOfMeasureId = tonUnit!.Id, LineNumber = 1 });
            context.Tenders.Add(t205);
        }

        await context.SaveChangesAsync();
        logger.LogDebug("DemoDataSeeder: Tenders and reverse bidding scenarios seeded.");
    }

    private static async Task SeedDealsAndPurchasesAsync(DealZoneDbContext context, ILogger logger)
    {
        var rfq105 = await context.Rfqs.FirstOrDefaultAsync(r => r.RfqNumber == "RFQ-2026-00105");
        var offer105 = await context.Offers.FirstOrDefaultAsync(o => o.OfferNumber == "OFF-2026-00105");
        var tender202 = await context.Tenders.FirstOrDefaultAsync(t => t.TenderNumber == "TND-2026-00202");
        var bid202 = await context.Bids.FirstOrDefaultAsync(b => b.BidNumber == "BID-2026-00202-WIN");
        var catalogSugar = await context.CatalogProducts.FirstOrDefaultAsync(p => p.Sku == "SKU-FOOD-SUGAR-45");

        // 1. Deal 1: Sourced from Tender 202 (AwaitingConfirmation - Tender Award)
        if (!await context.Deals.AnyAsync(d => d.DealNumber == "DZ-DEAL-2026-0051"))
        {
            var deal1 = new Deal
            {
                DealNumber = "DZ-DEAL-2026-0051",
                Source = DealSource.Tender,
                TenderId = tender202?.Id,
                BidId = bid202?.Id,
                BidRevisionNumber = 1,
                BuyerCompanyId = DualCompanyId,
                SupplierCompanyId = Supplier2CompanyId,
                AgreedPrice = 5700000m,
                Currency = "EGP",
                Status = DealStatus.AwaitingConfirmation,
                DeliveryTerms = "تسليم مصانع المشتري ببرج العرب، شامل النقل والتفريغ والفحص المعملي.",
                EstimatedDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(15),
                CommercialTermsSnapshotJson = JsonSerializer.Serialize(new
                {
                    item = "غزل قطن مصري جيزة 94 ممشط 30/1",
                    quantity = "60 طن",
                    unitPrice = "95,000 ج.م/طن",
                    total = "5,700,000 ج.م",
                    tenderNumber = "TND-2026-00202"
                })
            };
            context.Deals.Add(deal1);
        }

        // 2. Deal 2: Sourced from RFQ 105 (Confirmed - Awaiting Execution)
        if (!await context.Deals.AnyAsync(d => d.DealNumber == "DZ-DEAL-2026-0052"))
        {
            var deal2 = new Deal
            {
                DealNumber = "DZ-DEAL-2026-0052",
                Source = DealSource.Rfq,
                RfqId = rfq105?.Id,
                OfferId = offer105?.Id,
                OfferRevisionNumber = 1,
                BuyerCompanyId = Buyer2CompanyId,
                SupplierCompanyId = Supplier3CompanyId,
                AgreedPrice = 2080000m,
                Currency = "EGP",
                Status = DealStatus.Confirmed,
                ConfirmedByBuyerAtUtc = DateTimeOffset.UtcNow.AddDays(-4),
                ConfirmedByBuyerUserId = Buyer2UserId,
                ConfirmedBySupplierAtUtc = DateTimeOffset.UtcNow.AddDays(-4),
                ConfirmedBySupplierUserId = Supplier3UserId,
                ConfirmedAtUtc = DateTimeOffset.UtcNow.AddDays(-4),
                DeliveryTerms = "توريد 40 طن زيت أولين نخيل صهاريج فلكسي تانك لمستودعات أكتوبر.",
                EstimatedDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(5),
                CommercialTermsSnapshotJson = JsonSerializer.Serialize(new
                {
                    item = "زيت أولين نخيل غذائي RBD CP8",
                    quantity = "40 طن",
                    unitPrice = "52,000 ج.م/طن",
                    total = "2,080,000 ج.م",
                    rfqNumber = "RFQ-2026-00105"
                })
            };
            context.Deals.Add(deal2);
        }

        // 3. Deal 3: Sourced from RFQ (InProgress - Shipment en route!)
        var deal3 = await context.Deals.FirstOrDefaultAsync(d => d.DealNumber == "DZ-DEAL-2026-0042");
        if (deal3 == null)
        {
            deal3 = new Deal
            {
                DealNumber = "DZ-DEAL-2026-0042",
                Source = DealSource.Rfq,
                BuyerCompanyId = Buyer1CompanyId,
                SupplierCompanyId = Supplier1CompanyId,
                AgreedPrice = 1900000m,
                Currency = "EGP",
                Status = DealStatus.InProgress,
                ConfirmedByBuyerAtUtc = DateTimeOffset.UtcNow.AddDays(-5),
                ConfirmedByBuyerUserId = Buyer1UserId,
                ConfirmedBySupplierAtUtc = DateTimeOffset.UtcNow.AddDays(-5),
                ConfirmedBySupplierUserId = Supplier1UserId,
                ConfirmedAtUtc = DateTimeOffset.UtcNow.AddDays(-5),
                StartedAtUtc = DateTimeOffset.UtcNow.AddDays(-3),
                StartedByUserId = Supplier1UserId,
                DeliveryTerms = "توريد 50 طن حديد تسليح B500D تريلات مسطحة لموقع مصنع العاشر.",
                EstimatedDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(2),
                CommercialTermsSnapshotJson = JsonSerializer.Serialize(new
                {
                    item = "حديد تسليح B500D (20 مم)",
                    quantity = "50 طن",
                    unitPrice = "38,000 ج.م/طن",
                    total = "1,900,000 ج.م"
                })
            };
            context.Deals.Add(deal3);
        }
        else
        {
            deal3.Status = DealStatus.InProgress;
        }

        // 4. Deal 4: Completed Deal (Delivered & Reviewed with 5 Stars!)
        if (!await context.Deals.AnyAsync(d => d.DealNumber == "DZ-DEAL-2026-0030"))
        {
            var deal4 = new Deal
            {
                DealNumber = "DZ-DEAL-2026-0030",
                Source = DealSource.Rfq,
                BuyerCompanyId = Buyer1CompanyId,
                SupplierCompanyId = Supplier1CompanyId,
                AgreedPrice = 2660000m,
                Currency = "EGP",
                Status = DealStatus.Completed,
                ConfirmedByBuyerAtUtc = DateTimeOffset.UtcNow.AddDays(-20),
                ConfirmedByBuyerUserId = Buyer1UserId,
                ConfirmedBySupplierAtUtc = DateTimeOffset.UtcNow.AddDays(-20),
                ConfirmedBySupplierUserId = Supplier1UserId,
                ConfirmedAtUtc = DateTimeOffset.UtcNow.AddDays(-20),
                StartedAtUtc = DateTimeOffset.UtcNow.AddDays(-18),
                StartedByUserId = Supplier1UserId,
                CompletedAtUtc = DateTimeOffset.UtcNow.AddDays(-10),
                CompletedByUserId = Buyer1UserId,
                DeliveryTerms = "توريد 70 طن صلب تسليح 16 مم - تم الاستلام والفحص بالكامل.",
                CommercialTermsSnapshotJson = JsonSerializer.Serialize(new
                {
                    item = "حديد تسليح B500D (16 مم)",
                    quantity = "70 طن",
                    unitPrice = "38,000 ج.م/طن",
                    total = "2,660,000 ج.م"
                })
            };
            context.Deals.Add(deal4);
        }

        // 5. Deal 5: Disputed Deal (Active Dispute under Admin Review!)
        var deal5 = await context.Deals.FirstOrDefaultAsync(d => d.DealNumber == "DZ-DEAL-2026-0035");
        if (deal5 == null)
        {
            deal5 = new Deal
            {
                DealNumber = "DZ-DEAL-2026-0035",
                Source = DealSource.Rfq,
                BuyerCompanyId = Buyer1CompanyId,
                SupplierCompanyId = Supplier1CompanyId,
                AgreedPrice = 1140000m,
                Currency = "EGP",
                Status = DealStatus.Disputed,
                PreviousStatus = DealStatus.InProgress,
                ConfirmedByBuyerAtUtc = DateTimeOffset.UtcNow.AddDays(-12),
                ConfirmedByBuyerUserId = Buyer1UserId,
                ConfirmedBySupplierAtUtc = DateTimeOffset.UtcNow.AddDays(-12),
                ConfirmedBySupplierUserId = Supplier1UserId,
                ConfirmedAtUtc = DateTimeOffset.UtcNow.AddDays(-12),
                StartedAtUtc = DateTimeOffset.UtcNow.AddDays(-10),
                StartedByUserId = Supplier1UserId,
                DeliveryTerms = "توريد 30 طن زوايا صلب إنشائية - شحنة تحت النزاع الفني.",
                CommercialTermsSnapshotJson = JsonSerializer.Serialize(new
                {
                    item = "زوايا صلب إنشائية 100×10 مم",
                    quantity = "30 طن",
                    unitPrice = "38,000 ج.م/طن",
                    total = "1,140,000 ج.م"
                })
            };
            context.Deals.Add(deal5);
        }

        // 6. Deal 6: Cancelled Deal
        if (!await context.Deals.AnyAsync(d => d.DealNumber == "DZ-DEAL-2026-0020"))
        {
            var deal6 = new Deal
            {
                DealNumber = "DZ-DEAL-2026-0020",
                Source = DealSource.Rfq,
                BuyerCompanyId = DualCompanyId,
                SupplierCompanyId = Supplier2CompanyId,
                AgreedPrice = 850000m,
                Currency = "EGP",
                Status = DealStatus.Cancelled,
                ConfirmedByBuyerAtUtc = DateTimeOffset.UtcNow.AddDays(-30),
                ConfirmedByBuyerUserId = DualUserId,
                ConfirmedBySupplierAtUtc = DateTimeOffset.UtcNow.AddDays(-30),
                ConfirmedBySupplierUserId = Supplier2UserId,
                ConfirmedAtUtc = DateTimeOffset.UtcNow.AddDays(-30),
                CancelledAtUtc = DateTimeOffset.UtcNow.AddDays(-25),
                CancelledByUserId = DualUserId,
                CancelledByCompanyId = DualCompanyId,
                CancellationReason = "إلغاء باتفاق الطرفين لعدم مطابقة عينة الفحص الأولية لمواصفات الغزل المطلوبة.",
                CommercialTermsSnapshotJson = JsonSerializer.Serialize(new { note = "صفقة ملغاة باتفاق الطرفين" })
            };
            context.Deals.Add(deal6);
        }

        // 7. Direct Catalog Purchase Deal (Source = DirectPurchase)
        if (catalogSugar != null && !await context.DirectPurchases.AnyAsync(p => p.PurchaseNumber == "DZ-PO-2026-00088"))
        {
            var directPurchase = new DirectPurchase
            {
                PurchaseNumber = "DZ-PO-2026-00088",
                BuyerCompanyId = Buyer2CompanyId,
                BuyerUserId = Buyer2UserId,
                SupplierCompanyId = Supplier3CompanyId,
                CatalogProductId = catalogSugar.Id,
                Quantity = 30, // 30 tons
                UnitPrice = 29500m,
                TotalPrice = 885000m,
                Currency = "EGP",
                DeliveryLeadTimeDays = 4,
                EstimatedDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(4),
                DeliveryAddress = "مجمع مصانع مصر للأغذية، السادس من أكتوبر",
                Notes = "طلب شراء مباشر فوري من الكتالوج الصناعي مع طلب شحن سريع.",
                Status = DirectPurchaseStatus.Confirmed,
                ProductSnapshotJson = JsonSerializer.Serialize(new
                {
                    sku = catalogSugar.Sku,
                    name = catalogSugar.NameAr,
                    unit = "طن",
                    unitPrice = 29500,
                    supplier = "الدلتا لتجارة وتكرير السكر"
                })
            };
            context.DirectPurchases.Add(directPurchase);
            await context.SaveChangesAsync();

            var directDeal = new Deal
            {
                DealNumber = "DZ-DEAL-2026-0088",
                Source = DealSource.DirectPurchase,
                DirectPurchaseId = directPurchase.Id,
                BuyerCompanyId = Buyer2CompanyId,
                SupplierCompanyId = Supplier3CompanyId,
                AgreedPrice = 885000m,
                Currency = "EGP",
                Status = DealStatus.Confirmed,
                ConfirmedByBuyerAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
                ConfirmedByBuyerUserId = Buyer2UserId,
                ConfirmedBySupplierAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
                ConfirmedBySupplierUserId = Supplier3UserId,
                ConfirmedAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
                DeliveryTerms = "تسليم مستودعات السادس من أكتوبر خلال 4 أيام عمل.",
                EstimatedDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(4),
                CommercialTermsSnapshotJson = directPurchase.ProductSnapshotJson
            };
            context.Deals.Add(directDeal);
        }

        await context.SaveChangesAsync();
        logger.LogDebug("DemoDataSeeder: Deals and direct purchases seeded.");
    }

    private static async Task SeedShippingAsync(DealZoneDbContext context, ILogger logger)
    {
        // 1. Seed 3 Specialized Egyptian Industrial Shipping Providers
        var carrier1 = await context.ShippingProviders.FirstOrDefaultAsync(p => p.Name == "النيل للشحن اللوجستي الصناعي");
        if (carrier1 == null)
        {
            carrier1 = new ShippingProvider { Name = "النيل للشحن اللوجستي الصناعي", ContactPerson = "م. عصام فوزي", Phone = "+201200044455", Email = "logistics@nile-freight.eg", SupportedGovernorates = "القاهرة, الجيزة, الشرقية, القليوبية, الإسكندرية", IsActive = true };
            context.ShippingProviders.Add(carrier1);
        }

        var carrier2 = await context.ShippingProviders.FirstOrDefaultAsync(p => p.Name == "السويس للنقل الثقيل وتفريغ الحاويات");
        if (carrier2 == null)
        {
            carrier2 = new ShippingProvider { Name = "السويس للنقل الثقيل وتفريغ الحاويات", ContactPerson = "أ. محمود الجابري", Phone = "+201200055566", Email = "ops@suez-heavy-transport.eg", SupportedGovernorates = "السويس, بورسعيد, الإسماعيلية, البحر الأحمر, الجيزة", IsActive = true };
            context.ShippingProviders.Add(carrier2);
        }

        var carrier3 = await context.ShippingProviders.FirstOrDefaultAsync(p => p.Name == "مصر لخدمات النقل المبرد والمغطى");
        if (carrier3 == null)
        {
            carrier3 = new ShippingProvider { Name = "مصر لخدمات النقل المبرد والمغطى", ContactPerson = "م. هاني شاكر", Phone = "+201200066677", Email = "dispatch@misr-logistics.eg", SupportedGovernorates = "الغربية, المنوفية, الدقهلية, البحيرة, الإسكندرية", IsActive = true };
            context.ShippingProviders.Add(carrier3);
        }
        await context.SaveChangesAsync();

        // 2. Seed Shipments across different statuses
        var dealInProgress = await context.Deals.FirstOrDefaultAsync(d => d.DealNumber == "DZ-DEAL-2026-0042");
        var dealConfirmed = await context.Deals.FirstOrDefaultAsync(d => d.DealNumber == "DZ-DEAL-2026-0052");
        var dealCompleted = await context.Deals.FirstOrDefaultAsync(d => d.DealNumber == "DZ-DEAL-2026-0030");
        var dealDisputed = await context.Deals.FirstOrDefaultAsync(d => d.DealNumber == "DZ-DEAL-2026-0035");

        // Shipment 1: InTransit (on Deal 2026-0042)
        if (dealInProgress != null && !await context.Shipments.AnyAsync(s => s.ShipmentNumber == "DZ-SHP-2026-00042"))
        {
            var s1 = new Shipment
            {
                ShipmentNumber = "DZ-SHP-2026-00042",
                DealId = dealInProgress.Id,
                Arrangement = ShippingArrangement.DealZoneArranged,
                ShippingProviderId = carrier1!.Id,
                CarrierName = carrier1.Name,
                TrackingNumber = "DZ-TRK-EGY-9042",
                PickupAddress = "مستودعات الأهرام للصلب، المنطقة الصناعية الرابعة بأكتوبر",
                DeliveryAddress = "موقع مصنع العاشر B3، الشرقية",
                Status = ShipmentStatus.InTransit,
                PickupDateUtc = DateTimeOffset.UtcNow.AddDays(-2),
                EstimatedDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(1),
                Notes = "نقل 50 طن صلب تسليح عبر 3 تريلات مسطحة مجهزة بحواجز أمان وشهادات وزن الميزان البسكول.",
                TrackingEventsJson = JsonSerializer.Serialize(new[]
                {
                    new { timestamp = DateTimeOffset.UtcNow.AddDays(-2).ToString("O"), status = "PickedUp", location = "السادس من أكتوبر", descriptionAr = "تم فحص حمولة الشاحنات واستلام أذون الصرف من المستودع", descriptionEn = "Cargo inspected and dispatch permits signed" },
                    new { timestamp = DateTimeOffset.UtcNow.AddDays(-1).ToString("O"), status = "InTransit", location = "الطريق الدائري الأوسطي", descriptionAr = "الشاحنات في طريقها إلى مدينة العاشر من رمضان", descriptionEn = "En route via Middle Ring Corridor" }
                })
            };
            context.Shipments.Add(s1);
        }

        // Shipment 2: Assigned (on Deal 2026-0052)
        if (dealConfirmed != null && !await context.Shipments.AnyAsync(s => s.ShipmentNumber == "DZ-SHP-2026-00052"))
        {
            var s2 = new Shipment
            {
                ShipmentNumber = "DZ-SHP-2026-00052",
                DealId = dealConfirmed.Id,
                Arrangement = ShippingArrangement.DealZoneArranged,
                ShippingProviderId = carrier3!.Id,
                CarrierName = carrier3.Name,
                TrackingNumber = "DZ-TRK-EGY-9052",
                PickupAddress = "مستودعات الدلتا للسلع الغذائية، مدينة السادات",
                DeliveryAddress = "مجمع مصانع مصر للأغذية، السادس من أكتوبر",
                Status = ShipmentStatus.Assigned,
                EstimatedDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(4),
                Notes = "تم تعيين الناقل وجاري حجز صهاريج الفلكسي تانك المخصصة لنقل زيت الطعام.",
                TrackingEventsJson = JsonSerializer.Serialize(new[]
                {
                    new { timestamp = DateTimeOffset.UtcNow.AddHours(-12).ToString("O"), status = "Assigned", location = "مدينة السادات", descriptionAr = "تم إسناد الشحنة رسمياً إلى شركة مصر للنقل المبرد والمغطى", descriptionEn = "Carrier officially assigned for dispatch" }
                })
            };
            context.Shipments.Add(s2);
        }

        // Shipment 3: Delivered (on Completed Deal 2026-0030)
        if (dealCompleted != null && !await context.Shipments.AnyAsync(s => s.ShipmentNumber == "DZ-SHP-2026-00030"))
        {
            var s3 = new Shipment
            {
                ShipmentNumber = "DZ-SHP-2026-00030",
                DealId = dealCompleted.Id,
                Arrangement = ShippingArrangement.SupplierArranged,
                ShippingProviderId = carrier2!.Id,
                CarrierName = carrier2.Name,
                TrackingNumber = "DZ-TRK-EGY-9030",
                PickupAddress = "مستودعات أكتوبر الصناعية",
                DeliveryAddress = "موقع مصنع العاشر B3، الشرقية",
                Status = ShipmentStatus.Delivered,
                PickupDateUtc = DateTimeOffset.UtcNow.AddDays(-15),
                EstimatedDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(-10),
                ActualDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(-10),
                Notes = "تم التسليم بنجاح وتوقيع بوليصة الشحن ومحضر الفحص والاستلام بدون أي ملاحظات.",
                TrackingEventsJson = JsonSerializer.Serialize(new[]
                {
                    new { timestamp = DateTimeOffset.UtcNow.AddDays(-15).ToString("O"), status = "PickedUp", location = "السادس من أكتوبر", descriptionAr = "تم تحميل وتأمين 70 طن حديد تسليح", descriptionEn = "70 tons rebar secured" },
                    new { timestamp = DateTimeOffset.UtcNow.AddDays(-10).ToString("O"), status = "Delivered", location = "العاشر من رمضان", descriptionAr = "تم تفريغ الشحنة بالكامل وتوقيع الاستلام", descriptionEn = "Delivered and accepted at factory" }
                })
            };
            context.Shipments.Add(s3);
        }

        // Shipment 4: Delayed (on Disputed Deal 2026-0035)
        if (dealDisputed != null && !await context.Shipments.AnyAsync(s => s.ShipmentNumber == "DZ-SHP-2026-00035"))
        {
            var s4 = new Shipment
            {
                ShipmentNumber = "DZ-SHP-2026-00035",
                DealId = dealDisputed.Id,
                Arrangement = ShippingArrangement.SupplierArranged,
                ShippingProviderId = carrier1!.Id,
                CarrierName = carrier1.Name,
                TrackingNumber = "DZ-TRK-EGY-9035",
                PickupAddress = "مستودعات أكتوبر",
                DeliveryAddress = "موقع مصنع العاشر",
                Status = ShipmentStatus.Failed, // DeliveryFailed / Delayed
                PickupDateUtc = DateTimeOffset.UtcNow.AddDays(-8),
                EstimatedDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(-4),
                Notes = "تم إيقاف الشحنة وإثبات حالة تلف جزئي ونقص في الأوزان مما أدى لفتح نزاع فني.",
                TrackingEventsJson = JsonSerializer.Serialize(new[]
                {
                    new { timestamp = DateTimeOffset.UtcNow.AddDays(-8).ToString("O"), status = "PickedUp", location = "أكتوبر", descriptionAr = "تحميل الشحنة", descriptionEn = "Loaded" },
                    new { timestamp = DateTimeOffset.UtcNow.AddDays(-5).ToString("O"), status = "Delayed", location = "كمين العاشر من رمضان", descriptionAr = "تأخير في إجراءات التفتيش وفحص الأوزان", descriptionEn = "Delayed at highway checkpoint" }
                })
            };
            context.Shipments.Add(s4);
        }

        await context.SaveChangesAsync();
        logger.LogDebug("DemoDataSeeder: Shipping providers and shipments seeded.");
    }

    private static async Task SeedDisputesAndReviewsAsync(DealZoneDbContext context, Guid adminUserId, ILogger logger)
    {
        var dealDisputed = await context.Deals.FirstOrDefaultAsync(d => d.DealNumber == "DZ-DEAL-2026-0035");
        var dealCompleted = await context.Deals.FirstOrDefaultAsync(d => d.DealNumber == "DZ-DEAL-2026-0030");

        // 1. Open Dispute under Admin Review (on Deal 2026-0035)
        if (dealDisputed != null && !await context.DealDisputes.AnyAsync(d => d.DealId == dealDisputed.Id))
        {
            var dispute1 = new DealDispute
            {
                DealId = dealDisputed.Id,
                OpenedByCompanyId = Buyer1CompanyId,
                OpenedByUserId = Buyer1UserId,
                Category = DisputeCategory.QuantityMismatch,
                Reason = "نقص 3 أطنان في وزن صلب الزوايا وتلف جزئي بالربطات",
                Description = "عند تفريغ الشحنة وفحص ميزان البسكول بموقع مصنع العاشر، تبيّن أن الوزن الفعلي 27 طناً بدلاً من 30 طناً المتفق عليها بالفاتورة والبوليصة، بالإضافة إلى وجود انحناء وتلف في 4 ربطات حديد.",
                Status = DisputeStatus.UnderReview,
                OpenedAtUtc = DateTimeOffset.UtcNow.AddDays(-3)
            };
            context.DealDisputes.Add(dispute1);
        }

        // 2. Historical Resolved Dispute (on Deal 2026-0030)
        if (dealCompleted != null && !await context.DealDisputes.AnyAsync(d => d.DealId == dealCompleted.Id))
        {
            var dispute2 = new DealDispute
            {
                DealId = dealCompleted.Id,
                OpenedByCompanyId = Buyer1CompanyId,
                OpenedByUserId = Buyer1UserId,
                Category = DisputeCategory.LateDelivery,
                Reason = "تأخر وصول الشاحنات عن الموعد المحدد بيومين",
                Description = "تأخرت التريلات عن موعد التفريغ المجدول مع ونش الموقع.",
                Status = DisputeStatus.Resolved,
                ResolutionAction = DisputeResolutionAction.ResumeDeal,
                ResolutionNotes = "تم التراضي الودي بين المشتري والمورد، وخصم تكلفة إيجار الونش الإضافي بقيمة 15,000 ج.م واستكمال الصفقة وتسليم البضاعة.",
                ResolvedByUserId = adminUserId,
                OpenedAtUtc = DateTimeOffset.UtcNow.AddDays(-14),
                ResolvedAtUtc = DateTimeOffset.UtcNow.AddDays(-12)
            };
            context.DealDisputes.Add(dispute2);
        }

        // 3. Reviews on Completed Deal (Deal 2026-0030)
        if (dealCompleted != null && !await context.Reviews.AnyAsync(r => r.DealId == dealCompleted.Id))
        {
            // Buyer Review of Supplier (5 Stars)
            var r1 = Review.Create(
                dealCompleted,
                Buyer1CompanyId,
                Supplier1CompanyId,
                5,
                "التزام ممتاز بالمواصفات القياسية المصرية ES 262-2 وسرعة في استخراج شهادات الفحص المعملي للمصنع. الخامات مطابقة ودقة تامة في أوزان البسكول."
            );
            context.Reviews.Add(r1);

            // Supplier Review of Buyer (4 Stars)
            var r2 = Review.Create(
                dealCompleted,
                Supplier1CompanyId,
                Buyer1CompanyId,
                4,
                "تعامل احترافي وسرعة في إتمام إجراءات الفحص والاستلام وتسهيل دخول الشاحنات والتفريغ بونش المصنع بالعاشر، وسداد بنكي منتظم."
            );
            context.Reviews.Add(r2);
        }

        await context.SaveChangesAsync();
        logger.LogDebug("DemoDataSeeder: Disputes and reviews seeded.");
    }

    private static async Task SeedNotificationsAsync(DealZoneDbContext context, Guid adminUserId, ILogger logger)
    {
        if (await context.Notifications.AnyAsync(n => n.UserId == Buyer1UserId || n.UserId == Supplier1UserId || n.UserId == adminUserId))
        {
            return;
        }

        var notifications = new List<Notification>
        {
            // Buyer Notifications
            Notification.Create(Buyer1UserId, NotificationType.OfferSubmitted, "عرض سعر جديد مستلم", "قدمت شركة الأهرام لتوريدات الصلب عرض سعر رسمي على طلب التسعير RFQ-2026-00101 بقيمة 4,560,000 ج.م.", "Rfq", Guid.Empty, "notif-b1-1", DateTimeOffset.UtcNow.AddDays(-1)),
            Notification.Create(Buyer1UserId, NotificationType.OfferSubmitted, "عرض سعر منافس مستلم", "قدمت شركة الإسكندرية للتجارة والتصنيع عرض سعر على طلب التسعير RFQ-2026-00101 بقيمة 4,584,000 ج.م.", "Rfq", Guid.Empty, "notif-b1-2", DateTimeOffset.UtcNow.AddHours(-18)),
            Notification.Create(Buyer1UserId, NotificationType.BidSubmitted, "عطاء منافس جديد في المناقصة العكسية", "قدمت شركة الأهرام لتوريدات الصلب عطاءً مخفضاً بقيمة 7,100,000 ج.م لانتزاع الصدارة في مناقصة TND-2026-00201.", "Tender", Guid.Empty, "notif-b1-3", DateTimeOffset.UtcNow.AddHours(-12)),
            Notification.Create(Buyer1UserId, NotificationType.ShipmentStatusChanged, "تحديث تتبع الشحنة", "الشحنة رقم DZ-SHP-2026-00042 في طريقها الآن إلى موقع العاشر من رمضان عبر الطريق الدائري الأوسطي.", "Shipment", Guid.Empty, "notif-b1-4", DateTimeOffset.UtcNow.AddHours(-6)),
            Notification.Create(Buyer1UserId, NotificationType.DealDisputeOpened, "تسجيل نزاع تجاري", "تم تسجيل النزاع الفني رقم DSP-35 بخصوص نقص أوزان شحنة الزوايا الصناعية وجاري مراجعته من الإدارة.", "Dispute", Guid.Empty, "notif-b1-5", DateTimeOffset.UtcNow.AddDays(-3)),

            // Supplier Notifications
            Notification.Create(Supplier1UserId, NotificationType.RfqPublished, "طلب تسعير جديد مؤهل في قطاع المعادن", "طرحت الشركة المصرية للصناعات الهندسية طلب سعر جديد RFQ-2026-00101 لتوريد 120 طن حديد تسليح.", "Rfq", Guid.Empty, "notif-s1-1", DateTimeOffset.UtcNow.AddDays(-2)),
            Notification.Create(Supplier1UserId, NotificationType.TenderPublished, "مناقصة عكسية جديدة متاحة للمزايدة", "تم فتح باب التقديم في مناقصة توريد 200 طن صلب تسليح وبيليت بميزانية تقديرية 7.5 مليون ج.م.", "Tender", Guid.Empty, "notif-s1-2", DateTimeOffset.UtcNow.AddDays(-3)),
            Notification.Create(Supplier1UserId, NotificationType.DealStarted, "بدء تنفيذ الصفقة DZ-DEAL-2026-0042", "تم اعتماد الصفقة رسمياً وإسناد الشحن تمهيداً للتسليم بموقع المشتري.", "Deal", Guid.Empty, "notif-s1-3", DateTimeOffset.UtcNow.AddDays(-3)),
            Notification.Create(Supplier1UserId, NotificationType.ReviewReceived, "تقييم جديد 5 نجوم من المشتري!", "أضافت الشركة المصرية للصناعات الهندسية تقييماً ممتازاً (5/5) على الصفقة المكتملة DZ-DEAL-2026-0030.", "Review", Guid.Empty, "notif-s1-4", DateTimeOffset.UtcNow.AddDays(-9)),

            // Dual Enterprise Notifications
            Notification.Create(DualUserId, NotificationType.TenderAwarded, "تمت ترسية المناقصة بنجاح", "تمت ترسية مناقصة الغزل TND-2026-00202 على شركة المحلة وجاري انتظار تأكيد الصفقة DZ-DEAL-2026-0051.", "Tender", Guid.Empty, "notif-d1-1", DateTimeOffset.UtcNow.AddDays(-2)),
            Notification.Create(DualUserId, NotificationType.OfferRevisionSubmitted, "تعديل عرض سعر رسمي", "قدمت شركة المحلة للغزول تعديلاً مخفضاً على عرض السعر OFF-2026-00103 شامل تكاليف الشحن.", "Offer", Guid.Empty, "notif-d1-2", DateTimeOffset.UtcNow.AddDays(-1)),

            // Admin Notifications
            Notification.Create(adminUserId, NotificationType.CompanyVerificationSubmitted, "طلب توثيق شركة جديد في قائمة الانتظار", "قدمت شركة 'مصانع النيل لصباغة وتجهيز المنسوجات' طلب توثيق رسمي مع 3 مستندات معتمدة.", "Verification", PendingCompanyId, "notif-adm-1", DateTimeOffset.UtcNow.AddDays(-1)),
            Notification.Create(adminUserId, NotificationType.DealDisputeOpened, "طلب تدخل وفض نزاع تجاري", "تم فتح نزاع تجاري على الصفقة DZ-DEAL-2026-0035 بسبب تلف جزئي ونقص أوزان في شحنة العاشر.", "Dispute", Guid.Empty, "notif-adm-2", DateTimeOffset.UtcNow.AddDays(-3))
        };

        // Mark some as read
        notifications[0].MarkAsRead(DateTimeOffset.UtcNow.AddHours(-10));
        notifications[1].MarkAsRead(DateTimeOffset.UtcNow.AddHours(-5));
        notifications[5].MarkAsRead(DateTimeOffset.UtcNow.AddDays(-1));
        notifications[7].MarkAsRead(DateTimeOffset.UtcNow.AddDays(-2));

        context.Notifications.AddRange(notifications);
        await context.SaveChangesAsync();
        logger.LogDebug("DemoDataSeeder: Notifications seeded.");
    }
}
