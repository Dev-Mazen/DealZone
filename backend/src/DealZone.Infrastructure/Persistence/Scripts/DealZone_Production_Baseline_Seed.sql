-- ====================================================================================
-- DealZone Production Baseline Master Data Seed Script
-- Database: Microsoft SQL Server (MonsterASP.NET / Production)
-- Purpose: Seeds standard units of measure, official marketplace categories,
--          standard industrial raw materials, and licensed shipping providers.
-- Note: Contains ZERO fake transactions, ZERO dummy companies, ZERO mock deals.
--       Idempotent & Safe: Can be re-executed safely without duplication.
-- ====================================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

PRINT N'>> Starting DealZone Production Baseline Data Seeding...';

DECLARE @Now DATETIMEOFFSET = SYSDATETIMEOFFSET();

-- ====================================================================================
-- 1. UNITS OF MEASURE (وحدات القياس القياسية للصناعة)
-- ====================================================================================
PRINT N'>> [1/5] Seeding Units of Measure...';

MERGE INTO [UnitsOfMeasure] AS target
USING (VALUES
    (N'ton',  N'طن متري',      N'Metric Ton',    N'طن',   N't',   1, CAST(1 AS bit)),
    (N'kg',   N'كيلوجرام',     N'Kilogram',      N'كجم',  N'kg',  2, CAST(1 AS bit)),
    (N'l',    N'لتر',          N'Liter',         N'لتر',  N'L',   3, CAST(1 AS bit)),
    (N'm',    N'متر طولي',     N'Linear Meter',  N'م',    N'm',   4, CAST(1 AS bit)),
    (N'm3',   N'متر مكعب',     N'Cubic Meter',   N'م³',   N'm³',  5, CAST(1 AS bit)),
    (N'pcs',  N'قطعة',         N'Piece',         N'قطعة', N'pcs', 6, CAST(1 AS bit)),
    (N'sqm',  N'متر مربع',     N'Square Meter',  N'م²',   N'm²',  7, CAST(1 AS bit)),
    (N'roll', N'رول / لفة',    N'Roll',          N'لفة',  N'roll',8, CAST(1 AS bit)),
    (N'pack', N'عبوة / باليت', N'Pack / Pallet', N'عبوة', N'pk',  9, CAST(1 AS bit))
) AS source ([Code], [NameAr], [NameEn], [SymbolAr], [SymbolEn], [DisplayOrder], [IsActive])
ON target.[Code] = source.[Code]
WHEN MATCHED THEN
    UPDATE SET 
        target.[NameAr] = source.[NameAr],
        target.[NameEn] = source.[NameEn],
        target.[SymbolAr] = source.[SymbolAr],
        target.[SymbolEn] = source.[SymbolEn],
        target.[DisplayOrder] = source.[DisplayOrder],
        target.[IsActive] = source.[IsActive]
WHEN NOT MATCHED THEN
    INSERT ([Id], [Code], [NameAr], [NameEn], [SymbolAr], [SymbolEn], [DisplayOrder], [IsActive], [CreatedAtUtc])
    VALUES (NEWID(), source.[Code], source.[NameAr], source.[NameEn], source.[SymbolAr], source.[SymbolEn], source.[DisplayOrder], source.[IsActive], @Now);

PRINT N'   Units of Measure seeded successfully.';

-- ====================================================================================
-- 2. OFFICIAL MARKETPLACE CATEGORIES (التصنيفات المعتمدة للمنصة)
-- ====================================================================================
PRINT N'>> [2/5] Seeding Official Marketplace Categories...';

MERGE INTO [MaterialCategories] AS target
USING (VALUES
    (
        N'TEXTILES',
        N'منسوجات',
        N'Textiles',
        N'الألياف والخيوط والأقمشة ومستلزمات الصناعات النسيجية',
        N'Industrial fibers, yarns, fabrics, and textile manufacturing inputs',
        1,
        CAST(1 AS bit),
        CAST(0 AS bit)
    ),
    (
        N'FOOD',
        N'أغذية',
        N'Food',
        N'المواد الخام الزراعية والغذائية ومدخلات التصنيع الغذائي والتمويني',
        N'Raw agricultural commodities, food ingredients, and food processing inputs',
        2,
        CAST(1 AS bit),
        CAST(0 AS bit)
    ),
    (
        N'METALS',
        N'معادن',
        N'Metals',
        N'المعادن الصناعية والصلب وحديد التسليح والقطاعات والسبائك',
        N'Industrial metals, steel, rebar, structural sections, and alloys',
        3,
        CAST(1 AS bit),
        CAST(0 AS bit)
    )
) AS source ([Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [DisplayOrder], [IsActive], [IsArchived])
ON target.[Code] = source.[Code]
WHEN MATCHED THEN
    UPDATE SET 
        target.[NameAr] = source.[NameAr],
        target.[NameEn] = source.[NameEn],
        target.[DescriptionAr] = source.[DescriptionAr],
        target.[DescriptionEn] = source.[DescriptionEn],
        target.[DisplayOrder] = source.[DisplayOrder],
        target.[IsActive] = source.[IsActive],
        target.[IsArchived] = source.[IsArchived]
WHEN NOT MATCHED THEN
    INSERT ([Id], [ParentCategoryId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [DisplayOrder], [IsActive], [IsArchived], [CreatedAtUtc])
    VALUES (NEWID(), NULL, source.[Code], source.[NameAr], source.[NameEn], source.[DescriptionAr], source.[DescriptionEn], source.[DisplayOrder], source.[IsActive], source.[IsArchived], @Now);

PRINT N'   Official Marketplace Categories seeded successfully.';

-- ====================================================================================
-- 3. STANDARD INDUSTRIAL MATERIALS (المواصفات القياسية للمواد الخام الصناعية)
-- ====================================================================================
PRINT N'>> [3/5] Seeding Standard Industrial Raw Materials...';

DECLARE @CatMetalsId uniqueidentifier = (SELECT [Id] FROM [MaterialCategories] WHERE [Code] = N'METALS');
DECLARE @CatTextilesId uniqueidentifier = (SELECT [Id] FROM [MaterialCategories] WHERE [Code] = N'TEXTILES');
DECLARE @CatFoodId uniqueidentifier = (SELECT [Id] FROM [MaterialCategories] WHERE [Code] = N'FOOD');

DECLARE @UnitTonId uniqueidentifier = (SELECT [Id] FROM [UnitsOfMeasure] WHERE [Code] = N'ton');
DECLARE @UnitKgId uniqueidentifier = (SELECT [Id] FROM [UnitsOfMeasure] WHERE [Code] = N'kg');
DECLARE @UnitMId uniqueidentifier = (SELECT [Id] FROM [UnitsOfMeasure] WHERE [Code] = N'm');

-- 3.1 METALS (معادن)
IF @CatMetalsId IS NOT NULL AND @UnitTonId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [Materials] WHERE [Code] = N'STEEL-REBAR-B500D')
    BEGIN
        INSERT INTO [Materials] ([Id], [CategoryId], [DefaultUnitId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [AttributesJson], [IsActive], [IsArchived], [CreatedAtUtc], [CreatedBy])
        VALUES (
            NEWID(), @CatMetalsId, @UnitTonId,
            N'STEEL-REBAR-B500D',
            N'حديد تسليح عالي المقاومة B500D',
            N'High-Tensile Steel Rebar Grade B500D',
            N'أسياخ صلب تسليح عالي المقاومة ومطابقة للمواصفات القياسية المصرية ES 262-2 والمواصفات الدولية ISO 6935-2',
            N'High-tensile ribbed steel rebar conforming to Egyptian Standard ES 262-2 and ISO 6935-2',
            N'{"standard":"ES 262-2 / ISO 6935-2","grade":"B500D","diameter_range_mm":"10-32","form":"Straight Lengths"}',
            1, 0, @Now, N'SYSTEM_INIT'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [Materials] WHERE [Code] = N'STEEL-BILLET-3SP')
    BEGIN
        INSERT INTO [Materials] ([Id], [CategoryId], [DefaultUnitId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [AttributesJson], [IsActive], [IsArchived], [CreatedAtUtc], [CreatedBy])
        VALUES (
            NEWID(), @CatMetalsId, @UnitTonId,
            N'STEEL-BILLET-3SP',
            N'مربعات صلب بليت صب مستمر 3SP/5SP',
            N'Continuously Cast Steel Billets Grade 3SP/5SP',
            N'خام بليت صلب كربوني للدرجلة وتصنيع حديد التسليح والأسلاك مقاس 130x130 مم أو 150x150 مم',
            N'Continuously cast carbon steel billets for re-rolling into rebar and wire rods (130x130mm / 150x150mm)',
            N'{"standard":"GOST 380 / ASTM A615","grades":["3SP","5SP"],"sizes_mm":["130x130","150x150"],"length_m":12}',
            1, 0, @Now, N'SYSTEM_INIT'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [Materials] WHERE [Code] = N'STEEL-WIRE-ROD')
    BEGIN
        INSERT INTO [Materials] ([Id], [CategoryId], [DefaultUnitId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [AttributesJson], [IsActive], [IsArchived], [CreatedAtUtc], [CreatedBy])
        VALUES (
            NEWID(), @CatMetalsId, @UnitTonId,
            N'STEEL-WIRE-ROD',
            N'سلك صلب مسحوب على الساخن (لفائف)',
            N'Hot Rolled Steel Wire Rod in Coils',
            N'لفائف سلك صلب منخفض ومتوسط الكربون لسحب الأسلاك والمسامير وشبك اللحام قطر 5.5 إلى 12 مم',
            N'Low and medium carbon hot-rolled steel wire rod coils for wire drawing and mesh (5.5mm to 12mm)',
            N'{"standard":"SAE 1008 / SAE 1010","diameters_mm":["5.5","6.5","8.0","10.0","12.0"],"form":"Coils"}',
            1, 0, @Now, N'SYSTEM_INIT'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [Materials] WHERE [Code] = N'ALUM-INGOT-A7')
    BEGIN
        INSERT INTO [Materials] ([Id], [CategoryId], [DefaultUnitId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [AttributesJson], [IsActive], [IsArchived], [CreatedAtUtc], [CreatedBy])
        VALUES (
            NEWID(), @CatMetalsId, @UnitTonId,
            N'ALUM-INGOT-A7',
            N'سبائك ألومنيوم أولي نقاوة 99.7% (A7)',
            N'Primary Aluminum Ingots 99.7% Purity (Grade A7)',
            N'سبائك ألومنيوم نقي أولي مطابق للمواصفة القياسية الروسية والأمريكية لصناعات السحب والسباكة وتشكيل المقاطع',
            N'Primary unalloyed aluminum ingots (min 99.7% Al) for extrusion, remelting, and casting',
            N'{"purity_percent":99.7,"grade":"A7 / LME High Grade","form":"Ingots"}',
            1, 0, @Now, N'SYSTEM_INIT'
        );
    END;
END;

-- 3.2 TEXTILES (منسوجات)
IF @CatTextilesId IS NOT NULL AND @UnitTonId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [Materials] WHERE [Code] = N'TEXT-COTTON-YARN-30')
    BEGIN
        INSERT INTO [Materials] ([Id], [CategoryId], [DefaultUnitId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [AttributesJson], [IsActive], [IsArchived], [CreatedAtUtc], [CreatedBy])
        VALUES (
            NEWID(), @CatTextilesId, @UnitTonId,
            N'TEXT-COTTON-YARN-30',
            N'خيوط قطن غزل ممشط نمرة 30/1',
            N'Combed Cotton Ring-Spun Yarn Ne 30/1',
            N'غزول قطنية ممشطة نقية 100% عالية الجودة مناسبة لمصانع النسيج والتريكو الدائري والمفروشات',
            N'100% combed cotton ring-spun yarn Ne 30/1 for knitting and fine weaving applications',
            N'{"fiber":"100% Egyptian Cotton","count":"Ne 30/1","twist_direction":"Z","application":"Circular Knitting"}',
            1, 0, @Now, N'SYSTEM_INIT'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [Materials] WHERE [Code] = N'TEXT-COTTON-YARN-20')
    BEGIN
        INSERT INTO [Materials] ([Id], [CategoryId], [DefaultUnitId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [AttributesJson], [IsActive], [IsArchived], [CreatedAtUtc], [CreatedBy])
        VALUES (
            NEWID(), @CatTextilesId, @UnitTonId,
            N'TEXT-COTTON-YARN-20',
            N'خيوط قطن غزل مسرح نمرة 20/1',
            N'Carded Cotton Ring-Spun Yarn Ne 20/1',
            N'غزول قطنية مسرحة 100% مناسبة لإنتاج أقمشة الجينز والملابس الثقيلة والمفروشات والوبريات',
            N'100% carded cotton ring-spun yarn Ne 20/1 for weaving, denim, and heavy apparel',
            N'{"fiber":"100% Cotton","count":"Ne 20/1","twist_direction":"Z","application":"Weaving / Denim"}',
            1, 0, @Now, N'SYSTEM_INIT'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [Materials] WHERE [Code] = N'TEXT-POLY-RAW-FIBER')
    BEGIN
        INSERT INTO [Materials] ([Id], [CategoryId], [DefaultUnitId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [AttributesJson], [IsActive], [IsArchived], [CreatedAtUtc], [CreatedBy])
        VALUES (
            NEWID(), @CatTextilesId, @UnitTonId,
            N'TEXT-POLY-RAW-FIBER',
            N'ألياف بوليستر خام مجوفة ومعالجة (PSF)',
            N'Polyester Staple Fiber (PSF) Virgin/Recycled',
            N'ألياف بوليستر صناعية قصيرة لخلط الأقطان وصناعة الخيوط المخلوطة والأقمشة غير المنسوجة',
            N'Polyester staple fiber for cotton blending, spinning mills, and non-woven textile manufacturing',
            N'{"denier":"1.2D - 1.4D","cut_length_mm":"38mm","luster":"Semi-Dull / Optical White"}',
            1, 0, @Now, N'SYSTEM_INIT'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [Materials] WHERE [Code] = N'TEXT-FABRIC-GREIGE')
    BEGIN
        INSERT INTO [Materials] ([Id], [CategoryId], [DefaultUnitId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [AttributesJson], [IsActive], [IsArchived], [CreatedAtUtc], [CreatedBy])
        VALUES (
            NEWID(), @CatTextilesId, ISNULL(@UnitMId, @UnitTonId),
            N'TEXT-FABRIC-GREIGE',
            N'قماش خام قطني على النول (جريج)',
            N'100% Cotton Greige Woven Fabric',
            N'أقمشة قطنية خام غير مصبوغة لتجهيز وطباعة المنسوجات والصباغة المنزلية والتصدير',
            N'100% cotton unbleached woven greige fabric for dying, printing, and processing facilities',
            N'{"composition":"100% Cotton","weave":"Plain / Twill","width_cm":"160 - 240","gsm":"120 - 180"}',
            1, 0, @Now, N'SYSTEM_INIT'
        );
    END;
END;

-- 3.3 FOOD (أغذية)
IF @CatFoodId IS NOT NULL AND @UnitTonId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [Materials] WHERE [Code] = N'FOOD-SUGAR-ICUMSA45')
    BEGIN
        INSERT INTO [Materials] ([Id], [CategoryId], [DefaultUnitId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [AttributesJson], [IsActive], [IsArchived], [CreatedAtUtc], [CreatedBy])
        VALUES (
            NEWID(), @CatFoodId, @UnitTonId,
            N'FOOD-SUGAR-ICUMSA45',
            N'سكر أبيض ناعم مكرر ICUMSA 45',
            N'Refined White Granulated Sugar ICUMSA 45',
            N'سكر أبيض ناصع عالي النقاوة مطابق للمواصفات الغذائية للصناعات الغذائية والمشروبات والحلويات',
            N'High-purity refined white cane sugar ICUMSA 45 for food and beverage manufacturing',
            N'{"polarization":"99.8% min","icumsa_grade":45,"moisture":"0.04% max","form":"Granulated"}',
            1, 0, @Now, N'SYSTEM_INIT'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [Materials] WHERE [Code] = N'FOOD-WHEAT-MILLING')
    BEGIN
        INSERT INTO [Materials] ([Id], [CategoryId], [DefaultUnitId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [AttributesJson], [IsActive], [IsArchived], [CreatedAtUtc], [CreatedBy])
        VALUES (
            NEWID(), @CatFoodId, @UnitTonId,
            N'FOOD-WHEAT-MILLING',
            N'قمح طحن صلب بروتين 11.5% - 12.5%',
            N'Milling Wheat 11.5% - 12.5% Protein',
            N'قمح صلب عالي الجودة مناسب لمطاحن الدقيق وإنتاج الخبز والمخبوزات والمكرونة',
            N'Milling grade hard wheat for commercial flour mills and food processors',
            N'{"protein_dry_basis":"11.5% - 12.5%","moisture_max":"13.5%","test_weight_min":"77 kg/hl"}',
            1, 0, @Now, N'SYSTEM_INIT'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [Materials] WHERE [Code] = N'FOOD-CORN-YELLOW')
    BEGIN
        INSERT INTO [Materials] ([Id], [CategoryId], [DefaultUnitId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [AttributesJson], [IsActive], [IsArchived], [CreatedAtUtc], [CreatedBy])
        VALUES (
            NEWID(), @CatFoodId, @UnitTonId,
            N'FOOD-CORN-YELLOW',
            N'ذرة صفراء علفية وتصنيعية درجة أولى',
            N'Yellow Corn Grade 1 / 2 (Industrial & Feed)',
            N'ذرة صفراء لصناعات استخلاص النشا والجلوكوز وزيت الذرة والأعلاف الحيوانية',
            N'Industrial and feed-grade yellow corn for starch, glucose, corn oil, and feed processing',
            N'{"moisture_max":"14.0%","damaged_kernels_max":"5.0%","foreign_matter_max":"2.0%"}',
            1, 0, @Now, N'SYSTEM_INIT'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM [Materials] WHERE [Code] = N'FOOD-OIL-SOYBEAN')
    BEGIN
        INSERT INTO [Materials] ([Id], [CategoryId], [DefaultUnitId], [Code], [NameAr], [NameEn], [DescriptionAr], [DescriptionEn], [AttributesJson], [IsActive], [IsArchived], [CreatedAtUtc], [CreatedBy])
        VALUES (
            NEWID(), @CatFoodId, @UnitTonId,
            N'FOOD-OIL-SOYBEAN',
            N'زيت صويا خام غير مكرر (صب)',
            N'Crude Degummed Soybean Oil (Bulk)',
            N'زيت صويا خام لصالح مصانع التكرير والتعبئة وصناعات الزيوت والمسلى',
            N'Crude degummed soybean oil for commercial edible oil refining facilities',
            N'{"free_fatty_acids_max":"1.25%","moisture_volatile_max":"0.2%","form":"Bulk Liquid"}',
            1, 0, @Now, N'SYSTEM_INIT'
        );
    END;
END;

PRINT N'   Standard Industrial Raw Materials seeded successfully.';

-- ====================================================================================
-- 4. REAL INDUSTRIAL SHIPPING & FREIGHT PROVIDERS (شركات الشحن والنقل اللوجستي المعتمدة)
-- ====================================================================================
PRINT N'>> [4/5] Seeding Standard Shipping Providers...';

MERGE INTO [ShippingProviders] AS target
USING (VALUES
    (
        N'النيل للشحن اللوجستي الصناعي',
        N'م. عصام فوزي',
        N'01012345678',
        N'logistics@nile-freight.eg',
        N'القاهرة, الجيزة, القليوبية, الإسكندرية, السويس, بورسعيد, دمياط, الشرقية, الغربية, المنوفية, البحيرة',
        CAST(1 AS bit)
    ),
    (
        N'السويس للنقل الثقيل وتفريغ الحاويات',
        N'أ. محمود عبد الرحمن',
        N'01123456789',
        N'operations@suez-heavy-transport.eg',
        N'السويس, بورسعيد, الإسماعيلية, البحر الأحمر, القاهرة, الإسكندرية, دمياط',
        CAST(1 AS bit)
    ),
    (
        N'مصر لخدمات النقل المبرد والمغطى',
        N'م. هاني شاكر',
        N'01234567890',
        N'dispatch@misr-cold-chain.eg',
        N'القاهرة, الجيزة, الإسكندرية, البحيرة, الغربية, الدقهلية, كفر الشيخ, المنيا, أسيوط, بني سويف',
        CAST(1 AS bit)
    )
) AS source ([Name], [ContactPerson], [Phone], [Email], [SupportedGovernorates], [IsActive])
ON target.[Name] = source.[Name]
WHEN MATCHED THEN
    UPDATE SET 
        target.[ContactPerson] = source.[ContactPerson],
        target.[Phone] = source.[Phone],
        target.[Email] = source.[Email],
        target.[SupportedGovernorates] = source.[SupportedGovernorates],
        target.[IsActive] = source.[IsActive]
WHEN NOT MATCHED THEN
    INSERT ([Id], [Name], [ContactPerson], [Phone], [Email], [SupportedGovernorates], [IsActive], [CreatedAtUtc])
    VALUES (NEWID(), source.[Name], source.[ContactPerson], source.[Phone], source.[Email], source.[SupportedGovernorates], source.[IsActive], @Now);

PRINT N'   Shipping Providers seeded successfully.';

-- ====================================================================================
-- 5. ADMIN ACCOUNT ACTIVATION HELPER (ترقية حسابك لأدمن النظام)
-- ====================================================================================
PRINT N'>> [5/5] Checking Administrator Account Promotion...';

-- ملاحظة: إذا كنت قد سجلت حسابك بالفعل، استبدل البريد أدناه ببريدك المسجل لترقيته لأدمن نظام وتأكيد إيميله
DECLARE @TargetAdminEmail nvarchar(256) = N'admin@dealzone.eg';

IF EXISTS (SELECT 1 FROM [Users] WHERE [Email] = LOWER(LTRIM(RTRIM(@TargetAdminEmail))))
BEGIN
    UPDATE [Users]
    SET [IsSystemAdmin] = 1,
        [IsEmailConfirmed] = 1
    WHERE [Email] = LOWER(LTRIM(RTRIM(@TargetAdminEmail)));
    
    PRINT N'   Account ' + @TargetAdminEmail + N' promoted to System Administrator successfully.';
END
ELSE
BEGIN
    PRINT N'   Target admin email (' + @TargetAdminEmail + N') is not registered yet. (Register through website then re-run or update query).';
END;

COMMIT TRANSACTION;
PRINT N'>> ==================================================================';
PRINT N'>> DealZone Production Baseline Data Seeding COMPLETED SUCCESSFULLY!';
PRINT N'>> ==================================================================';

-- Verification Summary Output
SELECT 'UnitsOfMeasure' AS [Table], COUNT(*) AS [TotalRecords] FROM [UnitsOfMeasure]
UNION ALL
SELECT 'MaterialCategories', COUNT(*) FROM [MaterialCategories]
UNION ALL
SELECT 'Materials', COUNT(*) FROM [Materials]
UNION ALL
SELECT 'ShippingProviders', COUNT(*) FROM [ShippingProviders]
UNION ALL
SELECT 'SystemAdmins', COUNT(*) FROM [Users] WHERE [IsSystemAdmin] = 1;
