using DealZone.Domain.Catalog;
using DealZone.Domain.Companies;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Seeding;

/// <summary>
/// Seeds essential industrial raw-material categories restricted to the three official
/// marketplace categories: Textiles (TEXTILES), Food (FOOD), and Metals (METALS),
/// standard units of measure, baseline materials, and purchasable catalog offerings.
/// Idempotent and safe: preserves referential integrity and safely archives legacy records.
/// </summary>
public static class CatalogSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        await using var scope = serviceProvider.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
        var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
        var logger = loggerFactory.CreateLogger("DealZone.Infrastructure.Seeding.CatalogSeeder");

        // 1. Seed Units of Measure
        var standardUnits = new List<UnitOfMeasure>
        {
            new() { Code = "ton", NameAr = "طن متري", NameEn = "Metric Ton", SymbolAr = "طن", SymbolEn = "t", DisplayOrder = 1 },
            new() { Code = "kg", NameAr = "كيلوجرام", NameEn = "Kilogram", SymbolAr = "كجم", SymbolEn = "kg", DisplayOrder = 2 },
            new() { Code = "l", NameAr = "لتر", NameEn = "Liter", SymbolAr = "لتر", SymbolEn = "L", DisplayOrder = 3 },
            new() { Code = "m", NameAr = "متر طولي", NameEn = "Linear Meter", SymbolAr = "م", SymbolEn = "m", DisplayOrder = 4 },
            new() { Code = "m3", NameAr = "متر مكعب", NameEn = "Cubic Meter", SymbolAr = "م³", SymbolEn = "m³", DisplayOrder = 5 },
            new() { Code = "pcs", NameAr = "قطعة", NameEn = "Piece", SymbolAr = "قطعة", SymbolEn = "pcs", DisplayOrder = 6 }
        };

        foreach (var u in standardUnits)
        {
            if (!await context.UnitsOfMeasure.AnyAsync(x => x.Code == u.Code))
            {
                context.UnitsOfMeasure.Add(u);
            }
        }
        await context.SaveChangesAsync();

        // 2. Ensure Official 3 Marketplace Categories: Textiles, Food, Metals
        var textilesCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == MarketplaceCategories.Textiles);
        if (textilesCategory == null)
        {
            textilesCategory = new MaterialCategory
            {
                Code = MarketplaceCategories.Textiles,
                NameAr = "منسوجات",
                NameEn = "Textiles",
                DescriptionAr = "الألياف والخيوط والأقمشة ومستلزمات الصناعات النسيجية",
                DescriptionEn = "Industrial fibers, yarns, fabrics, and textile manufacturing inputs",
                DisplayOrder = 1,
                IsActive = true,
                IsArchived = false
            };
            context.MaterialCategories.Add(textilesCategory);
        }
        else
        {
            textilesCategory.NameAr = "منسوجات";
            textilesCategory.NameEn = "Textiles";
            textilesCategory.IsActive = true;
            textilesCategory.IsArchived = false;
        }

        var foodCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == MarketplaceCategories.Food);
        if (foodCategory == null)
        {
            foodCategory = new MaterialCategory
            {
                Code = MarketplaceCategories.Food,
                NameAr = "أغذية",
                NameEn = "Food",
                DescriptionAr = "المواد الخام الزراعية والغذائية ومدخلات التصنيع الغذائي والتمويني",
                DescriptionEn = "Raw agricultural commodities, food ingredients, and food processing inputs",
                DisplayOrder = 2,
                IsActive = true,
                IsArchived = false
            };
            context.MaterialCategories.Add(foodCategory);
        }
        else
        {
            foodCategory.NameAr = "أغذية";
            foodCategory.NameEn = "Food";
            foodCategory.IsActive = true;
            foodCategory.IsArchived = false;
        }

        var metalsCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == MarketplaceCategories.Metals);
        if (metalsCategory == null)
        {
            metalsCategory = new MaterialCategory
            {
                Code = MarketplaceCategories.Metals,
                NameAr = "معادن",
                NameEn = "Metals",
                DescriptionAr = "المعادن الصناعية والصلب وحديد التسليح والقطاعات والسبائك",
                DescriptionEn = "Industrial metals, steel, rebar, structural sections, and alloys",
                DisplayOrder = 3,
                IsActive = true,
                IsArchived = false
            };
            context.MaterialCategories.Add(metalsCategory);
        }
        else
        {
            metalsCategory.NameAr = "معادن";
            metalsCategory.NameEn = "Metals";
            metalsCategory.IsActive = true;
            metalsCategory.IsArchived = false;
        }

        await context.SaveChangesAsync();

        // 3. Handle legacy unsupported categories safely (preserve referential integrity)
        var rebarCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "REBAR");
        if (rebarCategory != null)
        {
            // Remap any materials under REBAR to METALS
            var rebarMaterials = await context.Materials.Where(m => m.CategoryId == rebarCategory.Id).ToListAsync();
            foreach (var m in rebarMaterials)
            {
                m.CategoryId = metalsCategory.Id;
            }
            rebarCategory.IsActive = false;
            rebarCategory.IsArchived = true;
        }

        var legacyCategories = await context.MaterialCategories
            .Where(c => c.Code == "POLYMERS" || c.Code == "POLYETHYLENE" || c.Code == "CHEMICALS" || c.Code == "SOLVENTS" || c.Code == "PACKAGING")
            .ToListAsync();

        foreach (var leg in legacyCategories)
        {
            leg.IsActive = false;
            leg.IsArchived = true;
        }
        await context.SaveChangesAsync();

        // 4. Seed Standard Materials for the 3 Categories
        var tonUnit = await context.UnitsOfMeasure.FirstAsync(u => u.Code == "ton");
        var kgUnit = await context.UnitsOfMeasure.FirstAsync(u => u.Code == "kg");

        // Metals material
        var steelRebar = await context.Materials.FirstOrDefaultAsync(m => m.Code == "STEEL-REBAR-B500D");
        if (steelRebar == null)
        {
            steelRebar = new Material
            {
                CategoryId = metalsCategory.Id,
                DefaultUnitId = tonUnit.Id,
                Code = "STEEL-REBAR-B500D",
                NameAr = "حديد تسليح عالي المقاومة B500D",
                NameEn = "High-Tensile Steel Rebar Grade B500D",
                DescriptionAr = "أسياخ صلب تسليح عالي المقاومة مطابقة للمواصفات القياسية المصرية",
                DescriptionEn = "High-tensile ribbed steel rebar conforming to Egyptian and ISO standards",
                AttributesJson = "{\"standard\":\"ES 262-2 / ISO 6935-2\",\"grade\":\"B500D\",\"diameter_range_mm\":\"10-32\",\"form\":\"Straight Lengths\"}",
                IsActive = true,
                IsArchived = false
            };
            context.Materials.Add(steelRebar);
        }
        else
        {
            steelRebar.CategoryId = metalsCategory.Id;
            steelRebar.IsActive = true;
            steelRebar.IsArchived = false;
        }

        // Textiles material
        var cottonYarn = await context.Materials.FirstOrDefaultAsync(m => m.Code == "TEXT-COTTON-YARN-30");
        if (cottonYarn == null)
        {
            cottonYarn = new Material
            {
                CategoryId = textilesCategory.Id,
                DefaultUnitId = tonUnit.Id,
                Code = "TEXT-COTTON-YARN-30",
                NameAr = "خيوط قطن غزل ممشط نمرة 30/1",
                NameEn = "Combed Cotton Ring-Spun Yarn Ne 30/1",
                DescriptionAr = "غزول قطنية ممشطة نقية 100% مناسبة لمصانع النسيج والتريكو",
                DescriptionEn = "100% combed cotton ring-spun yarn Ne 30/1 for knitting and weaving",
                AttributesJson = "{\"fiber\":\"100% Egyptian Cotton\",\"count\":\"Ne 30/1\",\"twist_direction\":\"Z\",\"application\":\"Circular Knitting\"}",
                IsActive = true,
                IsArchived = false
            };
            context.Materials.Add(cottonYarn);
        }
        else
        {
            cottonYarn.CategoryId = textilesCategory.Id;
            cottonYarn.IsActive = true;
            cottonYarn.IsArchived = false;
        }

        // Food material
        var refinedSugar = await context.Materials.FirstOrDefaultAsync(m => m.Code == "FOOD-SUGAR-ICUMSA45");
        if (refinedSugar == null)
        {
            refinedSugar = new Material
            {
                CategoryId = foodCategory.Id,
                DefaultUnitId = tonUnit.Id,
                Code = "FOOD-SUGAR-ICUMSA45",
                NameAr = "سكر أبيض ناعم مكرر ICUMSA 45",
                NameEn = "Refined White Granulated Sugar ICUMSA 45",
                DescriptionAr = "سكر أبيض ناصع عالي النقاوة مطابق للمواصفات الغذائية للصناعات الغذائية والمشروبات",
                DescriptionEn = "High-purity refined white cane sugar ICUMSA 45 for food and beverage processing",
                AttributesJson = "{\"polarization\":\"99.8% min\",\"icumsa_grade\":45,\"moisture\":\"0.04% max\",\"form\":\"Granulated\"}",
                IsActive = true,
                IsArchived = false
            };
            context.Materials.Add(refinedSugar);
        }
        else
        {
            refinedSugar.CategoryId = foodCategory.Id;
            refinedSugar.IsActive = true;
            refinedSugar.IsArchived = false;
        }

        await context.SaveChangesAsync();

        // 5. Seed Catalog Products for Direct Purchasing if an approved supplier company exists
        var sampleSupplier = await context.Companies
            .FirstOrDefaultAsync(c => c.IsActive && !c.IsDeleted && c.VerificationStatus == CompanyVerificationStatus.Approved && (c.CompanyType == CompanyType.Supplier || c.CompanyType == CompanyType.Both));

        if (sampleSupplier != null)
        {
            if (!await context.CatalogProducts.AnyAsync(p => p.Sku == "SKU-MET-REBAR-B500D"))
            {
                context.CatalogProducts.Add(new CatalogProduct
                {
                    MaterialId = steelRebar.Id,
                    SupplierCompanyId = sampleSupplier.Id,
                    Sku = "SKU-MET-REBAR-B500D",
                    NameAr = "حديد تسليح B500D أطوال 12 متر",
                    NameEn = "Steel Rebar Grade B500D 12m Lengths",
                    DescriptionAr = "توريد فوري من المخازن - مطابق للمواصفات القياسية المصرية ES 262",
                    DescriptionEn = "Immediate warehouse dispatch - Conforms to Egyptian Standard ES 262",
                    UnitPrice = 38500m,
                    Currency = "EGP",
                    AvailableQuantity = 500m,
                    MinimumOrderQuantity = 10m,
                    DeliveryLeadTimeDays = 3,
                    IsActive = true
                });
            }

            if (!await context.CatalogProducts.AnyAsync(p => p.Sku == "SKU-TEX-YARN-30-1"))
            {
                context.CatalogProducts.Add(new CatalogProduct
                {
                    MaterialId = cottonYarn.Id,
                    SupplierCompanyId = sampleSupplier.Id,
                    Sku = "SKU-TEX-YARN-30-1",
                    NameAr = "غزل قطن ممشط 30/1 تريكو",
                    NameEn = "Combed Cotton Ring-Spun Yarn 30/1 Knitting",
                    DescriptionAr = "شحن مباشر من مصانع الغزل والنسيج بالمحلة الكبرى",
                    DescriptionEn = "Direct delivery from textile spinning mills in Mahalla",
                    UnitPrice = 145000m,
                    Currency = "EGP",
                    AvailableQuantity = 150m,
                    MinimumOrderQuantity = 2m,
                    DeliveryLeadTimeDays = 7,
                    IsActive = true
                });
            }

            if (!await context.CatalogProducts.AnyAsync(p => p.Sku == "SKU-FOOD-SUGAR-45"))
            {
                context.CatalogProducts.Add(new CatalogProduct
                {
                    MaterialId = refinedSugar.Id,
                    SupplierCompanyId = sampleSupplier.Id,
                    Sku = "SKU-FOOD-SUGAR-45",
                    NameAr = "سكر مكرر ICUMSA 45 أكياس 50 كجم",
                    NameEn = "Refined White Cane Sugar ICUMSA 45 (50kg Sacks)",
                    DescriptionAr = "توريد تعاقدي للمصانع الغذائية مع تسليم مستودعات السادس من أكتوبر",
                    DescriptionEn = "Bulk delivery for food processing facilities, warehouse 6th October",
                    UnitPrice = 29500m,
                    Currency = "EGP",
                    AvailableQuantity = 1000m,
                    MinimumOrderQuantity = 25m,
                    DeliveryLeadTimeDays = 4,
                    IsActive = true
                });
            }

            await context.SaveChangesAsync();
        }

        logger.LogInformation("CatalogSeeder: Restricted 3-category catalog and direct purchasing seeding completed.");
    }
}
