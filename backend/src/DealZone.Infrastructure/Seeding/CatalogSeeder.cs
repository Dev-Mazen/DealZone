using DealZone.Domain.Catalog;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Seeding;

/// <summary>
/// Seeds essential industrial raw-material categories, standard units of measure,
/// and baseline material definitions for development and initial deployment.
/// Restricted strictly to the 3 approved marketplace categories: Textiles, Food, Metals.
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

        // 2. Seed the 3 Approved Marketplace Categories: Metals, Textiles, Food
        // Deactivate unsupported categories
        var unsupported = await context.MaterialCategories
            .Where(c => c.Code != "METALS" && c.Code != "TEXTILES" && c.Code != "FOOD")
            .ToListAsync();
        foreach (var u in unsupported)
        {
            u.IsActive = false;
        }

        // 2.1 Metals (معادن)
        var metalsCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "METALS");
        if (metalsCategory == null)
        {
            metalsCategory = new MaterialCategory
            {
                Code = "METALS",
                NameAr = "معادن",
                NameEn = "Metals",
                DescriptionAr = "منتجات الصلب والحديد والمعادن الصناعية",
                DescriptionEn = "Industrial steel, iron, and metal raw materials",
                DisplayOrder = 1,
                IsActive = true
            };
            context.MaterialCategories.Add(metalsCategory);
        }
        else
        {
            metalsCategory.NameAr = "معادن";
            metalsCategory.NameEn = "Metals";
            metalsCategory.IsActive = true;
            metalsCategory.DisplayOrder = 1;
        }

        // 2.2 Textiles (منسوجات)
        var textilesCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "TEXTILES");
        if (textilesCategory == null)
        {
            textilesCategory = new MaterialCategory
            {
                Code = "TEXTILES",
                NameAr = "منسوجات",
                NameEn = "Textiles",
                DescriptionAr = "خامات الغزل والنسيج والألياف الصناعية والقطنية",
                DescriptionEn = "Textile yarns, fibers, cotton, and woven fabrics",
                DisplayOrder = 2,
                IsActive = true
            };
            context.MaterialCategories.Add(textilesCategory);
        }
        else
        {
            textilesCategory.NameAr = "منسوجات";
            textilesCategory.NameEn = "Textiles";
            textilesCategory.IsActive = true;
            textilesCategory.DisplayOrder = 2;
        }

        // 2.3 Food (أغذية)
        var foodCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "FOOD");
        if (foodCategory == null)
        {
            foodCategory = new MaterialCategory
            {
                Code = "FOOD",
                NameAr = "أغذية",
                NameEn = "Food",
                DescriptionAr = "المواد الخام للصناعات الغذائية والتصنيع الزراعي",
                DescriptionEn = "Food industry raw materials, agricultural processing ingredients",
                DisplayOrder = 3,
                IsActive = true
            };
            context.MaterialCategories.Add(foodCategory);
        }
        else
        {
            foodCategory.NameAr = "أغذية";
            foodCategory.NameEn = "Food";
            foodCategory.IsActive = true;
            foodCategory.DisplayOrder = 3;
        }

        await context.SaveChangesAsync();

        // 3. Seed Materials for the 3 Categories
        var tonUnit = await context.UnitsOfMeasure.FirstAsync(u => u.Code == "ton");

        // Metals: Rebar & Billets
        if (!await context.Materials.AnyAsync(m => m.Code == "STEEL-REBAR-B500D"))
        {
            context.Materials.Add(new Material
            {
                CategoryId = metalsCategory.Id,
                DefaultUnitId = tonUnit.Id,
                Code = "STEEL-REBAR-B500D",
                NameAr = "حديد تسليح عالي المقاومة B500D",
                NameEn = "High-Tensile Steel Rebar Grade B500D",
                DescriptionAr = "أسياخ صلب تسليح عالي المقاومة مطابقة للمواصفات القياسية المصرية",
                DescriptionEn = "High-tensile ribbed steel rebar conforming to Egyptian and ISO standards",
                AttributesJson = "{\"standard\":\"ES 262-2 / ISO 6935-2\",\"grade\":\"B500D\",\"diameter_range_mm\":\"10-32\",\"form\":\"Straight Lengths\"}",
                IsActive = true
            });
        }

        if (!await context.Materials.AnyAsync(m => m.Code == "STEEL-BILLET-3SP"))
        {
            context.Materials.Add(new Material
            {
                CategoryId = metalsCategory.Id,
                DefaultUnitId = tonUnit.Id,
                Code = "STEEL-BILLET-3SP",
                NameAr = "مربعات صلب بليت 150x150 مم كود 3SP",
                NameEn = "Prime Continuous Cast Steel Billets 150x150mm (3SP/5SP)",
                DescriptionAr = "مربعات صلب نصف مصنعة لدرفلة حديد التسليح والقطاعات",
                DescriptionEn = "Continuous cast steel billets for rebar and wire rod re-rolling mills",
                AttributesJson = "{\"standard\":\"GOST 380 / ASTM A615\",\"grade\":\"3SP/5SP\",\"cross_section\":\"150x150 mm\",\"length\":\"12 m\"}",
                IsActive = true
            });
        }

        // Textiles: Cotton Yarn & Polyester Fiber
        if (!await context.Materials.AnyAsync(m => m.Code == "COTTON-YARN-GIZA"))
        {
            context.Materials.Add(new Material
            {
                CategoryId = textilesCategory.Id,
                DefaultUnitId = tonUnit.Id,
                Code = "COTTON-YARN-GIZA",
                NameAr = "غزل قطن مصري 100% جيزة مشط تمشيط",
                NameEn = "100% Egyptian Combed Cotton Yarn Giza",
                DescriptionAr = "غزل قطن مصري فاخر للمصانع والنسيج عالي الجودة",
                DescriptionEn = "Premium combed Egyptian Giza cotton yarn for high-grade textile manufacturing",
                AttributesJson = "{\"standard\":\"ISO 2060\",\"count\":\"Ne 30/1\",\"fiber_length\":\"34mm\",\"origin\":\"Egypt\"}",
                IsActive = true
            });
        }

        if (!await context.Materials.AnyAsync(m => m.Code == "POLY-FIBER-PSF"))
        {
            context.Materials.Add(new Material
            {
                CategoryId = textilesCategory.Id,
                DefaultUnitId = tonUnit.Id,
                Code = "POLY-FIBER-PSF",
                NameAr = "ألياف بوليستر قصيرة للمنسوجات (PSF)",
                NameEn = "Polyester Staple Fiber (PSF) Semi-Dull",
                DescriptionAr = "ألياف بوليستر نقية لصناعة الغزل والأقمشة المنسوجة وغير المنسوجة",
                DescriptionEn = "Semi-dull virgin polyester staple fiber for spinning and non-woven manufacturing",
                AttributesJson = "{\"denier\":\"1.4D\",\"cut_length\":\"38mm\",\"tenacity\":\">6.5 g/denier\"}",
                IsActive = true
            });
        }

        // Food: Sugar & Palm Olein
        if (!await context.Materials.AnyAsync(m => m.Code == "FOOD-SUGAR-REFINED"))
        {
            context.Materials.Add(new Material
            {
                CategoryId = foodCategory.Id,
                DefaultUnitId = tonUnit.Id,
                Code = "FOOD-SUGAR-REFINED",
                NameAr = "سكر أبيض مكرر درجة تصنيع غذائي",
                NameEn = "Refined White Sugar Industrial Grade ICUMSA 45",
                DescriptionAr = "سكر مكرر نقي للصناعات الغذائية والمشروبات والحلويات",
                DescriptionEn = "High-purity refined crystal white sugar for confectionery and beverage manufacturing",
                AttributesJson = "{\"standard\":\"EOS 358 / ICUMSA 45\",\"polarization\":\"99.8% min\",\"moisture\":\"0.04% max\"}",
                IsActive = true
            });
        }

        if (!await context.Materials.AnyAsync(m => m.Code == "FOOD-PALM-OLEIN"))
        {
            context.Materials.Add(new Material
            {
                CategoryId = foodCategory.Id,
                DefaultUnitId = tonUnit.Id,
                Code = "FOOD-PALM-OLEIN",
                NameAr = "زيت أولين النخيل الغذائي المكرر CP8",
                NameEn = "RBD Palm Olein Edible Oil CP8",
                DescriptionAr = "زيت طعام صناعي مكرر ومبيض ومزال الرائحة للقلي والتصنيع الغذائي",
                DescriptionEn = "Refined bleached and deodorized palm olein for food processing and frying industries",
                AttributesJson = "{\"standard\":\"Codex Stan 210\",\"cloud_point\":\"8°C max\",\"free_fatty_acids\":\"0.1% max\"}",
                IsActive = true
            });
        }

        await context.SaveChangesAsync();
        logger.LogInformation("CatalogSeeder: Baseline 3-category marketplace catalog seed completed.");
    }
}
