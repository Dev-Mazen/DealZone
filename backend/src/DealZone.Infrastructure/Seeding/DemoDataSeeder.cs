using DealZone.Application.Common.Interfaces;
using DealZone.Domain.Catalog;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Identity;
using DealZone.Domain.Offers;
using DealZone.Domain.Rfqs;
using DealZone.Domain.Shipping;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Seeding;

/// <summary>
/// Repeatable, idempotent database seeder that populates realistic Egyptian B2B marketplace records
/// exclusively for development and controlled demonstration environments.
/// Clearly tags all records as [Sample] to ensure zero confusion with genuine customer accounts.
/// </summary>
public static class DemoDataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        await using var scope = serviceProvider.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
        var logger = loggerFactory.CreateLogger("DealZone.Infrastructure.Seeding.DemoDataSeeder");

        // Environment & Configuration Guard
        var seedDemo = configuration.GetValue<bool>("SeedDemoData");
        if (!seedDemo)
        {
            logger.LogDebug("DemoDataSeeder: 'SeedDemoData' is false or omitted. Skipping demo seeding.");
            return;
        }

        // Idempotency check: Skip if sample companies already exist
        if (await context.Companies.AnyAsync(c => c.TradeName.StartsWith("[Sample]")))
        {
            logger.LogDebug("DemoDataSeeder: Sample demo data already exists. Skipping.");
            return;
        }

        logger.LogInformation("DemoDataSeeder: Seeding realistic Egyptian B2B marketplace demo dataset...");

        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        // 1. Seed Demo Users
        var buyerUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "demo.buyer@dealzone.eg");
        if (buyerUser == null)
        {
            buyerUser = new User
            {
                Email = "demo.buyer@dealzone.eg",
                FullName = "م. أحمد مصطفى (مدير المشتريات)",
                PhoneNumber = "+201011122233",
                IsEmailConfirmed = true,
                IsActive = true,
                IsSystemAdmin = false
            };
            buyerUser.PasswordHash = passwordHasher.HashPassword(buyerUser, "DealZone@2026");
            context.Users.Add(buyerUser);
        }

        var supplierUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "demo.supplier@dealzone.eg");
        if (supplierUser == null)
        {
            supplierUser = new User
            {
                Email = "demo.supplier@dealzone.eg",
                FullName = "أ. طارق عبد الرحمن (مدير المبيعات والتوريد)",
                PhoneNumber = "+201022233344",
                IsEmailConfirmed = true,
                IsActive = true,
                IsSystemAdmin = false
            };
            supplierUser.PasswordHash = passwordHasher.HashPassword(supplierUser, "DealZone@2026");
            context.Users.Add(supplierUser);
        }

        var dualUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "demo.dual@dealzone.eg");
        if (dualUser == null)
        {
            dualUser = new User
            {
                Email = "demo.dual@dealzone.eg",
                FullName = "م. حازم القاضي (المدير التجاري)",
                PhoneNumber = "+201033344455",
                IsEmailConfirmed = true,
                IsActive = true,
                IsSystemAdmin = false
            };
            dualUser.PasswordHash = passwordHasher.HashPassword(dualUser, "DealZone@2026");
            context.Users.Add(dualUser);
        }

        await context.SaveChangesAsync();

        // 2. Seed Verified Demo Companies
        // 2.1 Demo Buyer
        var buyerCompany = new Company
        {
            LegalName = "[Sample] الشركة المصرية للصناعات الهندسية والمعدنية ش.م.م",
            TradeName = "[Sample] المصرية للصناعات الهندسية",
            IndustrySector = "Metals & Steel",
            CompanyType = CompanyType.Buyer,
            City = "العاشر من رمضان",
            Governorate = "الشرقية",
            Description = "مصنع صناعات هندسية وهياكل معدنية بالمنطقة الصناعية الثالثة B3 بالعاشر من رمضان.",
            Website = "https://demo-engineering.eg",
            VerificationStatus = CompanyVerificationStatus.Approved,
            VerifiedAtUtc = DateTimeOffset.UtcNow.AddDays(-30),
            PrimaryContactUserId = buyerUser.Id,
            IsActive = true
        };
        context.Companies.Add(buyerCompany);

        // 2.2 Demo Supplier
        var supplierCompany = new Company
        {
            LegalName = "[Sample] شركة الأهرام لتوريد وتجارة خامات الصلب والمعادن ذ.م.م",
            TradeName = "[Sample] الأهرام لتوريدات الصلب",
            IndustrySector = "Metals & Steel",
            CompanyType = CompanyType.Supplier,
            City = "السادس من أكتوبر",
            Governorate = "الجيزة",
            Description = "وكيل ومورد معتمد لحديد التسليح والقطاعات والصلب المدلفن بالمنطقة الصناعية الرابعة بأكتوبر.",
            Website = "https://demo-ahram-steel.eg",
            VerificationStatus = CompanyVerificationStatus.Approved,
            VerifiedAtUtc = DateTimeOffset.UtcNow.AddDays(-25),
            PrimaryContactUserId = supplierUser.Id,
            IsActive = true
        };
        context.Companies.Add(supplierCompany);

        // 2.3 Demo Dual Enterprise
        var dualCompany = new Company
        {
            LegalName = "[Sample] شركة الدلتا لتجارة الغزول والصناعات الغذائية ش.م.م",
            TradeName = "[Sample] الدلتا للتجارة والتوريد",
            IndustrySector = "Textiles & Industrial Fibers",
            CompanyType = CompanyType.Both,
            City = "مدينة السادات",
            Governorate = "المنوفية",
            Description = "مؤسسة تصنيع وتوريد منتجات القطن والغزول ومواد التجهيز الغذائي بمدينة السادات.",
            Website = "https://demo-delta-trading.eg",
            VerificationStatus = CompanyVerificationStatus.Approved,
            VerifiedAtUtc = DateTimeOffset.UtcNow.AddDays(-20),
            PrimaryContactUserId = dualUser.Id,
            IsActive = true
        };
        context.Companies.Add(dualCompany);

        await context.SaveChangesAsync();

        // Add Company Memberships
        context.CompanyMembers.Add(new CompanyMember
        {
            CompanyId = buyerCompany.Id,
            UserId = buyerUser.Id,
            Role = CompanyRole.Owner,
            IsPrimary = true
        });
        context.CompanyMembers.Add(new CompanyMember
        {
            CompanyId = supplierCompany.Id,
            UserId = supplierUser.Id,
            Role = CompanyRole.Owner,
            IsPrimary = true
        });
        context.CompanyMembers.Add(new CompanyMember
        {
            CompanyId = dualCompany.Id,
            UserId = dualUser.Id,
            Role = CompanyRole.Owner,
            IsPrimary = true
        });

        // Contact details
        context.CompanyContactDetails.Add(new CompanyContactDetails
        {
            CompanyId = buyerCompany.Id,
            TaxIdNumber = "DEMO-TAX-10042",
            CommercialRegistrationNumber = "DEMO-CR-10042",
            CorporateEmail = "procurement@demo-engineering.eg",
            CorporatePhone = "+2015333444",
            AddressLine1 = "القطعة 42، المنطقة الصناعية الثالثة B3",
            PostalCode = "44629"
        });
        context.CompanyContactDetails.Add(new CompanyContactDetails
        {
            CompanyId = supplierCompany.Id,
            TaxIdNumber = "DEMO-TAX-20088",
            CommercialRegistrationNumber = "DEMO-CR-20088",
            CorporateEmail = "sales@demo-ahram-steel.eg",
            CorporatePhone = "+2023888999",
            AddressLine1 = "مجمع الصناعات المعدنية، المنطقة الصناعية الرابعة",
            PostalCode = "12566"
        });
        context.CompanyContactDetails.Add(new CompanyContactDetails
        {
            CompanyId = dualCompany.Id,
            TaxIdNumber = "DEMO-TAX-30015",
            CommercialRegistrationNumber = "DEMO-CR-30015",
            CorporateEmail = "trade@demo-delta.eg",
            CorporatePhone = "+20482600100",
            AddressLine1 = "المنطقة الصناعية الثانية، طريق مصر الإسكندرية الصحراوي",
            PostalCode = "32897"
        });

        await context.SaveChangesAsync();

        // 3. Look up Catalog Categories and Units
        var metalsCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "METALS");
        var textilesCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "TEXTILES");
        var foodCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "FOOD");
        var tonUnit = await context.UnitsOfMeasure.FirstOrDefaultAsync(u => u.Code == "ton");

        var steelRebarMaterial = await context.Materials.FirstOrDefaultAsync(m => m.Code == "STEEL-REBAR-B500D");
        var cottonMaterial = await context.Materials.FirstOrDefaultAsync(m => m.Code == "COTTON-YARN-GIZA");
        var sugarMaterial = await context.Materials.FirstOrDefaultAsync(m => m.Code == "FOOD-SUGAR-REFINED");

        // 4. Seed Realistic RFQs
        // RFQ 1: Steel Rebar (Metals)
        var rfq1 = new Rfq
        {
            RfqNumber = "RFQ-2026-00101",
            BuyerCompanyId = buyerCompany.Id,
            Title = "توريد 120 طن حديد تسليح عالي المقاومة B500D لموقع مصنع العاشر",
            Description = "مطلوب توريد حديد تسليح أقطار 16 مم و 20 مم أطوال 12 متراً مطابق للمواصفة القياسية المصرية ES 262-2 مع إرفاق شهادة الفحص المعملي للمصنع.",
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
        if (metalsCategory != null && tonUnit != null)
        {
            rfq1.Items.Add(new RfqItem
            {
                CategoryId = metalsCategory.Id,
                MaterialId = steelRebarMaterial?.Id,
                MaterialName = "حديد تسليح B500D (أقطار 16 مم)",
                Specifications = "صلب تسليح عالي المقاومة ES 262-2، أطوال 12م",
                Quantity = 70,
                Unit = MaterialUnit.MetricTon,
                UnitOfMeasureId = tonUnit.Id,
                TargetPricePerUnit = 38500m,
                LineNumber = 1
            });
            rfq1.Items.Add(new RfqItem
            {
                CategoryId = metalsCategory.Id,
                MaterialId = steelRebarMaterial?.Id,
                MaterialName = "حديد تسليح B500D (أقطار 20 مم)",
                Specifications = "صلب تسليح عالي المقاومة ES 262-2، أطوال 12م",
                Quantity = 50,
                Unit = MaterialUnit.MetricTon,
                UnitOfMeasureId = tonUnit.Id,
                TargetPricePerUnit = 38500m,
                LineNumber = 2
            });
        }
        context.Rfqs.Add(rfq1);

        // RFQ 2: Egyptian Cotton Yarn (Textiles)
        var rfq2 = new Rfq
        {
            RfqNumber = "RFQ-2026-00102",
            BuyerCompanyId = dualCompany.Id,
            Title = "توريد 25 طن غزل قطن مصري 100% جيزة مشط تمشيط Ne 30/1",
            Description = "مطلوب توريد كونات غزل حلقي لمصنع المنسوجات مع خلوها من العقد ومطابقتها لمعايير Uster العالمية.",
            Status = RfqStatus.Published,
            DeliveryGovernorate = "المنوفية",
            DeliveryCity = "مدينة السادات",
            DeliveryAddress = "مجمع النسيج، المنطقة الصناعية الثانية",
            TargetCategoryId = textilesCategory?.Id,
            RequiredDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(20),
            ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(7),
            PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
            TargetBudget = 2450000m,
            Currency = "EGP"
        };
        if (textilesCategory != null && tonUnit != null)
        {
            rfq2.Items.Add(new RfqItem
            {
                CategoryId = textilesCategory.Id,
                MaterialId = cottonMaterial?.Id,
                MaterialName = "غزل قطن مصري 100% جيزة 94",
                Specifications = "نمرة 30/1 تمشيط خالي من الشوائب",
                Quantity = 25,
                Unit = MaterialUnit.MetricTon,
                UnitOfMeasureId = tonUnit.Id,
                TargetPricePerUnit = 98000m,
                LineNumber = 1
            });
        }
        context.Rfqs.Add(rfq2);

        // RFQ 3: Industrial Refined Sugar (Food)
        var rfq3 = new Rfq
        {
            RfqNumber = "RFQ-2026-00103",
            BuyerCompanyId = buyerCompany.Id,
            Title = "توريد 50 طن سكر أبيض مكرر درجة تصنيع غذائي ICUMSA 45",
            Description = "توريد سكر صناعي معبأ بأجولة 50 كجم لمصانع الأغذية مع مطابقة المواصفة القياسية المصرية EOS 358.",
            Status = RfqStatus.Published,
            DeliveryGovernorate = "الجيزة",
            DeliveryCity = "السادس من أكتوبر",
            DeliveryAddress = "المنطقة الصناعية الأولى، مجمع الصناعات الغذائية",
            TargetCategoryId = foodCategory?.Id,
            RequiredDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(10),
            ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(3),
            PublishedAtUtc = DateTimeOffset.UtcNow.AddDays(-3),
            TargetBudget = 1600000m,
            Currency = "EGP"
        };
        if (foodCategory != null && tonUnit != null)
        {
            rfq3.Items.Add(new RfqItem
            {
                CategoryId = foodCategory.Id,
                MaterialId = sugarMaterial?.Id,
                MaterialName = "سكر أبيض مكرر ICUMSA 45",
                Specifications = "أجولة 50 كجم، نقاوة 99.8% كحد أدنى",
                Quantity = 50,
                Unit = MaterialUnit.MetricTon,
                UnitOfMeasureId = tonUnit.Id,
                TargetPricePerUnit = 32000m,
                LineNumber = 1
            });
        }
        context.Rfqs.Add(rfq3);

        await context.SaveChangesAsync();

        // 5. Seed Realistic Offer on RFQ 1 from Supplier
        var offer1 = new Offer
        {
            OfferNumber = "OFF-2026-00101",
            RfqId = rfq1.Id,
            SupplierCompanyId = supplierCompany.Id,
            Status = OfferStatus.Submitted,
            TotalAmount = 4560000m,
            Currency = "EGP",
            ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(10),
            DeliveryLeadTimeDays = 7,
            ShippingIncluded = true,
            PaymentTerms = "اعتماد مستندي أو سداد بنكي 50% مقدم و 50% عند الاستلام والفحص",
            Notes = "الخامات متوفرة بالمستودعات جاهزة للشحن الفوري بشاحنات مسطحة مع شهادات الاختبار.",
            SubmittedAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
            RevisionNumber = 1
        };
        var rfq1Item1 = rfq1.Items.FirstOrDefault(i => i.LineNumber == 1);
        var rfq1Item2 = rfq1.Items.FirstOrDefault(i => i.LineNumber == 2);
        if (rfq1Item1 != null)
        {
            offer1.Items.Add(new OfferItem
            {
                RfqItemId = rfq1Item1.Id,
                UnitPrice = 38000m,
                OfferedQuantity = 70,
                TotalPrice = 2660000m,
                MaterialSpecifications = "صلب تسليح B500D (16 مم) مصانع الدرفلة المصرية مطابق للمواصفة ES 262-2",
                Notes = "متوفر بالمستودعات للشحن الفوري"
            });
        }
        if (rfq1Item2 != null)
        {
            offer1.Items.Add(new OfferItem
            {
                RfqItemId = rfq1Item2.Id,
                UnitPrice = 38000m,
                OfferedQuantity = 50,
                TotalPrice = 1900000m,
                MaterialSpecifications = "صلب تسليح B500D (20 مم) مصانع الدرفلة المصرية مطابق للمواصفة ES 262-2",
                Notes = "متوفر بالمستودعات للشحن الفوري"
            });
        }
        context.Offers.Add(offer1);
        await context.SaveChangesAsync();

        // 6. Seed Realistic Deal between Dual Company and Supplier
        var deal1 = new Deal
        {
            DealNumber = "DZ-DEAL-2026-0042",
            Source = DealSource.Rfq,
            BuyerCompanyId = dualCompany.Id,
            SupplierCompanyId = supplierCompany.Id,
            AgreedPrice = 1900000m,
            Currency = "EGP",
            Status = DealStatus.Confirmed,
            ConfirmedByBuyerAtUtc = DateTimeOffset.UtcNow.AddDays(-5),
            ConfirmedByBuyerUserId = dualUser.Id,
            ConfirmedBySupplierAtUtc = DateTimeOffset.UtcNow.AddDays(-5),
            ConfirmedBySupplierUserId = supplierUser.Id,
            ConfirmedAtUtc = DateTimeOffset.UtcNow.AddDays(-5),
            StartedAtUtc = DateTimeOffset.UtcNow.AddDays(-3),
            StartedByUserId = supplierUser.Id
        };
        context.Deals.Add(deal1);
        await context.SaveChangesAsync();

        // 7. Seed Shipping Provider & Shipment for Deal
        var carrier = await context.ShippingProviders.FirstOrDefaultAsync(p => p.Name == "النيل للشحن اللوجستي الصناعي");
        if (carrier == null)
        {
            carrier = new ShippingProvider
            {
                Name = "النيل للشحن اللوجستي الصناعي",
                ContactPerson = "م. عصام فوزي",
                Phone = "+201200044455",
                Email = "logistics@nile-freight.eg",
                IsActive = true
            };
            context.ShippingProviders.Add(carrier);
            await context.SaveChangesAsync();
        }

        var shipment1 = new Shipment
        {
            ShipmentNumber = "DZ-SHP-2026-00042",
            DealId = deal1.Id,
            Arrangement = ShippingArrangement.SupplierArranged,
            ShippingProviderId = carrier.Id,
            CarrierName = carrier.Name,
            TrackingNumber = "DZ-EGY-2026-9042",
            PickupAddress = "مستودعات الأهرام للصلب، المنطقة الصناعية الرابعة بأكتوبر",
            DeliveryAddress = "مجمع النسيج، المنطقة الصناعية الثانية بالسادات",
            Status = ShipmentStatus.InTransit,
            PickupDateUtc = DateTimeOffset.UtcNow.AddDays(-2),
            EstimatedDeliveryDateUtc = DateTimeOffset.UtcNow.AddDays(2),
            Notes = "نقل 50 طن لفائف حديد عبر تريلات مسطحة مجهزة بحواجز أمان.",
            TrackingEventsJson = "[{\"timestamp\":\"" + DateTimeOffset.UtcNow.AddDays(-2).ToString("O") + "\",\"status\":\"PickedUp\",\"location\":\"السادس من أكتوبر\",\"descriptionAr\":\"تم تحميل البضاعة وفحص أوزان التريلات\",\"descriptionEn\":\"Cargo loaded and weighbridge verified\"},{\"timestamp\":\"" + DateTimeOffset.UtcNow.AddDays(-1).ToString("O") + "\",\"status\":\"InTransit\",\"location\":\"طريق مصر إسكندرية الصحراوي\",\"descriptionAr\":\"الشاحنات في طريقها إلى مدينة السادات\",\"descriptionEn\":\"In transit via Cairo-Alex desert corridor\"}]"
        };
        context.Shipments.Add(shipment1);
        await context.SaveChangesAsync();

        logger.LogInformation("DemoDataSeeder: Successfully seeded realistic Egyptian B2B marketplace demo dataset.");
    }
}
