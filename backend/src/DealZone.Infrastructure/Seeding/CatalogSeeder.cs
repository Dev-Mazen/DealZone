using DealZone.Domain.Catalog;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Seeding;

/// <summary>
/// Seeds essential industrial raw-material categories, standard units of measure,
/// and baseline material definitions for development and initial deployment.
/// Idempotent: checks for existing codes before adding.
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

        // 2. Seed Categories
        var metalsCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "METALS");
        if (metalsCategory == null)
        {
            metalsCategory = new MaterialCategory
            {
                Code = "METALS",
                NameAr = "المعادن والصلب",
                NameEn = "Metals & Steel",
                DescriptionAr = "منتجات الصلب والحديد والمعادن الصناعية",
                DescriptionEn = "Industrial steel, iron, and metal raw materials",
                DisplayOrder = 1,
                IsActive = true
            };
            context.MaterialCategories.Add(metalsCategory);
            await context.SaveChangesAsync();
        }

        var rebarCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "REBAR");
        if (rebarCategory == null)
        {
            rebarCategory = new MaterialCategory
            {
                ParentCategoryId = metalsCategory.Id,
                Code = "REBAR",
                NameAr = "حديد التسليح والصلب الإنشائي",
                NameEn = "Rebar & Structural Steel",
                DescriptionAr = "أسياخ حديد التسليح والقطاعات الإنشائية",
                DescriptionEn = "Steel reinforcing bars and structural sections",
                DisplayOrder = 1,
                IsActive = true
            };
            context.MaterialCategories.Add(rebarCategory);
            await context.SaveChangesAsync();
        }

        var polymersCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "POLYMERS");
        if (polymersCategory == null)
        {
            polymersCategory = new MaterialCategory
            {
                Code = "POLYMERS",
                NameAr = "البوليمرات والبلاستيك الصناعي",
                NameEn = "Polymers & Plastics",
                DescriptionAr = "حبيبات ومواد خام البلاستيك والبوليمرات",
                DescriptionEn = "Plastic resins, polymers, and raw plastic materials",
                DisplayOrder = 2,
                IsActive = true
            };
            context.MaterialCategories.Add(polymersCategory);
            await context.SaveChangesAsync();
        }

        var peCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "POLYETHYLENE");
        if (peCategory == null)
        {
            peCategory = new MaterialCategory
            {
                ParentCategoryId = polymersCategory.Id,
                Code = "POLYETHYLENE",
                NameAr = "بولي إيثيلين",
                NameEn = "Polyethylene (PE)",
                DescriptionAr = "حبيبات البولي إيثيلين عالي ومنخفض الكثافة",
                DescriptionEn = "High and low-density polyethylene resin grades",
                DisplayOrder = 1,
                IsActive = true
            };
            context.MaterialCategories.Add(peCategory);
            await context.SaveChangesAsync();
        }

        var chemicalsCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "CHEMICALS");
        if (chemicalsCategory == null)
        {
            chemicalsCategory = new MaterialCategory
            {
                Code = "CHEMICALS",
                NameAr = "الكيماويات والمذيبات الصناعية",
                NameEn = "Industrial Chemicals & Solvents",
                DescriptionAr = "الكيماويات والمذيبات والمواد الوسيطة الصناعية",
                DescriptionEn = "Industrial chemicals, solvents, and intermediates",
                DisplayOrder = 3,
                IsActive = true
            };
            context.MaterialCategories.Add(chemicalsCategory);
            await context.SaveChangesAsync();
        }

        var solventsCategory = await context.MaterialCategories.FirstOrDefaultAsync(c => c.Code == "SOLVENTS");
        if (solventsCategory == null)
        {
            solventsCategory = new MaterialCategory
            {
                ParentCategoryId = chemicalsCategory.Id,
                Code = "SOLVENTS",
                NameAr = "المذيبات الصناعية",
                NameEn = "Industrial Solvents",
                DescriptionAr = "المذيبات العضوية والصناعية",
                DescriptionEn = "Organic and industrial solvents",
                DisplayOrder = 1,
                IsActive = true
            };
            context.MaterialCategories.Add(solventsCategory);
            await context.SaveChangesAsync();
        }

        // 3. Seed Materials
        var tonUnit = await context.UnitsOfMeasure.FirstAsync(u => u.Code == "ton");
        var literUnit = await context.UnitsOfMeasure.FirstAsync(u => u.Code == "l");

        if (!await context.Materials.AnyAsync(m => m.Code == "STEEL-REBAR-B500D"))
        {
            context.Materials.Add(new Material
            {
                CategoryId = rebarCategory.Id,
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

        if (!await context.Materials.AnyAsync(m => m.Code == "HDPE-BLOW-5502"))
        {
            context.Materials.Add(new Material
            {
                CategoryId = peCategory.Id,
                DefaultUnitId = tonUnit.Id,
                Code = "HDPE-BLOW-5502",
                NameAr = "حبيبات بولي إيثيلين عالي الكثافة للنفخ",
                NameEn = "HDPE Blow Molding Resin Grade 5502",
                DescriptionAr = "حبيبات بلاستيك بولي إيثيلين لتصنيع العبوات والجالونات بالنفخ",
                DescriptionEn = "High-density polyethylene copolymer for blow-molded containers",
                AttributesJson = "{\"melt_flow_index\":\"0.35 g/10min\",\"density\":\"0.954 g/cm3\",\"application\":\"Blow Molding Bottles and Jerrycans\"}",
                IsActive = true
            });
        }

        if (!await context.Materials.AnyAsync(m => m.Code == "CHEM-ACETONE-995"))
        {
            context.Materials.Add(new Material
            {
                CategoryId = solventsCategory.Id,
                DefaultUnitId = literUnit.Id,
                Code = "CHEM-ACETONE-995",
                NameAr = "أسيتون صناعي نقي 99.5%",
                NameEn = "Technical Acetone Pure 99.5%",
                DescriptionAr = "مذيب كيميائي نقي للتطبيقات الصناعية ومصانع الدهانات واللدائن",
                DescriptionEn = "High-purity technical acetone solvent for coatings and chemical processing",
                AttributesJson = "{\"purity_percent\":99.5,\"form\":\"Colorless Liquid\",\"flash_point_c\":-20,\"un_number\":\"UN1090\"}",
                IsActive = true
            });
        }

        await context.SaveChangesAsync();
        logger.LogInformation("CatalogSeeder: Baseline catalog seed completed.");
    }
}

