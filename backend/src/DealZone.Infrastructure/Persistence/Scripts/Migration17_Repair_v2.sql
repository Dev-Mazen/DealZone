/*
    DealZone - Repair Migration (Fixed)
    Migration: 20261111180118_UnifiedMarketplaceAndProcurementRefactor
    EF Core ProductVersion: 10.0.3

    Fix history:
    v2 - Wrapped all direct references to newly-added columns of existing tables
         inside sp_executesql to avoid SQL Server compile-time name resolution errors.
         Affected:
           - CategoryId validation EXISTS query (Section 5)
           - CREATE INDEX on CatalogProducts(CategoryId) (Section 8)
           - CREATE INDEX on Rfqs(AwardedOfferId)        (Section 8)
           - CREATE UNIQUE INDEX on Deals(ProductNegotiationId) WHERE ... (Section 8)
           - FK on CatalogProducts(CategoryId)           (Section 9)
           - FK on Deals(ProductNegotiationId)           (Section 9)
           - FK on Rfqs(AwardedOfferId)                  (Section 9)
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @MigrationId NVARCHAR(150) =
    N'20261111180118_UnifiedMarketplaceAndProcurementRefactor';

IF EXISTS (
    SELECT 1
    FROM dbo.__EFMigrationsHistory
    WHERE MigrationId = @MigrationId
)
BEGIN
    PRINT 'Migration already recorded. Nothing to do.';
    RETURN;
END;

IF OBJECT_ID(N'dbo.Rfqs',               N'U') IS NULL
OR OBJECT_ID(N'dbo.Deals',              N'U') IS NULL
OR OBJECT_ID(N'dbo.CatalogProducts',    N'U') IS NULL
OR OBJECT_ID(N'dbo.Materials',          N'U') IS NULL
OR OBJECT_ID(N'dbo.MaterialCategories', N'U') IS NULL
OR OBJECT_ID(N'dbo.Companies',          N'U') IS NULL
OR OBJECT_ID(N'dbo.Users',              N'U') IS NULL
OR OBJECT_ID(N'dbo.Offers',             N'U') IS NULL
BEGIN
    THROW 51000, 'A required existing table is missing. Repair aborted.', 1;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    /* ================================================================
       1. Rfqs columns
       ================================================================ */

    IF COL_LENGTH('dbo.Rfqs', 'AwardRationale') IS NULL
        ALTER TABLE dbo.Rfqs ADD AwardRationale NVARCHAR(1000) NULL;

    IF COL_LENGTH('dbo.Rfqs', 'AwardedAtUtc') IS NULL
        ALTER TABLE dbo.Rfqs ADD AwardedAtUtc DATETIMEOFFSET NULL;

    IF COL_LENGTH('dbo.Rfqs', 'AwardedByUserId') IS NULL
        ALTER TABLE dbo.Rfqs ADD AwardedByUserId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH('dbo.Rfqs', 'AwardedOfferId') IS NULL
        ALTER TABLE dbo.Rfqs ADD AwardedOfferId UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH('dbo.Rfqs', 'CancellationReason') IS NULL
        ALTER TABLE dbo.Rfqs ADD CancellationReason NVARCHAR(500) NULL;

    IF COL_LENGTH('dbo.Rfqs', 'ReopenedAtUtc') IS NULL
        ALTER TABLE dbo.Rfqs ADD ReopenedAtUtc DATETIMEOFFSET NULL;

    IF COL_LENGTH('dbo.Rfqs', 'ReopenedCount') IS NULL
        ALTER TABLE dbo.Rfqs
            ADD ReopenedCount INT NOT NULL
            CONSTRAINT DF_Rfqs_ReopenedCount_Repair DEFAULT (0);

    /* ================================================================
       2. Deals column
       ================================================================ */

    IF COL_LENGTH('dbo.Deals', 'ProductNegotiationId') IS NULL
        ALTER TABLE dbo.Deals ADD ProductNegotiationId UNIQUEIDENTIFIER NULL;

    /* ================================================================
       3. CatalogProducts.MaterialId → nullable
       ================================================================ */

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id  = OBJECT_ID(N'dbo.CatalogProducts')
          AND name        = N'MaterialId'
          AND is_nullable = 0
    )
    BEGIN
        DECLARE @MaterialDefault NVARCHAR(300);

        SELECT @MaterialDefault = QUOTENAME(dc.name)
        FROM   sys.default_constraints dc
        JOIN   sys.columns c
               ON  c.object_id = dc.parent_object_id
               AND c.column_id = dc.parent_column_id
        WHERE  dc.parent_object_id = OBJECT_ID(N'dbo.CatalogProducts')
          AND  c.name = N'MaterialId';

        IF @MaterialDefault IS NOT NULL
            EXEC(N'ALTER TABLE dbo.CatalogProducts DROP CONSTRAINT ' + @MaterialDefault);

        ALTER TABLE dbo.CatalogProducts ALTER COLUMN MaterialId UNIQUEIDENTIFIER NULL;
    END;

    /* ================================================================
       4. CatalogProducts new columns
       ================================================================ */

    IF COL_LENGTH('dbo.CatalogProducts', 'CategoryId') IS NULL
        ALTER TABLE dbo.CatalogProducts
            ADD CategoryId UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_CatalogProducts_CategoryId_Repair
            DEFAULT ('00000000-0000-0000-0000-000000000000');

    IF COL_LENGTH('dbo.CatalogProducts', 'ImageUrlsJson') IS NULL
        ALTER TABLE dbo.CatalogProducts ADD ImageUrlsJson NVARCHAR(4000) NULL;

    IF COL_LENGTH('dbo.CatalogProducts', 'PricingMode') IS NULL
        ALTER TABLE dbo.CatalogProducts
            ADD PricingMode INT NOT NULL
            CONSTRAINT DF_CatalogProducts_PricingMode_Repair DEFAULT (1);

    IF COL_LENGTH('dbo.CatalogProducts', 'Specifications') IS NULL
        ALTER TABLE dbo.CatalogProducts ADD Specifications NVARCHAR(2000) NULL;

    IF COL_LENGTH('dbo.CatalogProducts', 'Unit') IS NULL
        ALTER TABLE dbo.CatalogProducts
            ADD Unit NVARCHAR(50) NOT NULL
            CONSTRAINT DF_CatalogProducts_Unit_Repair DEFAULT (N'ton');

    /* ================================================================
       5. Populate CategoryId — all references to the new column are in
          sp_executesql to bypass compile-time name resolution.
       ================================================================ */

    -- Step 5a: copy CategoryId from Materials where MaterialId is set
    EXEC sys.sp_executesql N'
        UPDATE cp
        SET    cp.CategoryId = m.CategoryId
        FROM   dbo.CatalogProducts  cp
        JOIN   dbo.Materials        m  ON m.Id = cp.MaterialId
        WHERE  cp.CategoryId = ''00000000-0000-0000-0000-000000000000''
          AND  m.CategoryId IS NOT NULL;
    ';

    -- Step 5b: fallback — assign METALS category to any remaining zero-GUID rows
    DECLARE @MetalsCategoryId UNIQUEIDENTIFIER;
    SELECT TOP (1) @MetalsCategoryId = Id
    FROM   dbo.MaterialCategories
    WHERE  Code = N'METALS';

    IF @MetalsCategoryId IS NOT NULL
        EXEC sys.sp_executesql
            N'UPDATE dbo.CatalogProducts
              SET    CategoryId = @Cat
              WHERE  CategoryId = ''00000000-0000-0000-0000-000000000000'';',
            N'@Cat UNIQUEIDENTIFIER',
            @Cat = @MetalsCategoryId;

    -- Step 5c: validate — no rows should remain with an invalid CategoryId
    --          (direct column reference wrapped in sp_executesql)
    DECLARE @BadCategoryRows INT = 0;

    EXEC sys.sp_executesql
        N'SELECT @n = COUNT(*)
          FROM   dbo.CatalogProducts  cp
          LEFT   JOIN dbo.MaterialCategories mc ON mc.Id = cp.CategoryId
          WHERE  mc.Id IS NULL;',
        N'@n INT OUTPUT',
        @n = @BadCategoryRows OUTPUT;

    IF @BadCategoryRows > 0
        THROW 51001, 'Some CatalogProducts have no valid CategoryId. Migration aborted.', 1;

    /* ================================================================
       6. ProductNegotiations table
       ================================================================ */

    IF OBJECT_ID(N'dbo.ProductNegotiations', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.ProductNegotiations (
            Id                    UNIQUEIDENTIFIER  NOT NULL,
            NegotiationNumber     NVARCHAR(30)      NOT NULL,
            CatalogProductId      UNIQUEIDENTIFIER  NOT NULL,
            BuyerCompanyId        UNIQUEIDENTIFIER  NOT NULL,
            BuyerUserId           UNIQUEIDENTIFIER  NOT NULL,
            SupplierCompanyId     UNIQUEIDENTIFIER  NOT NULL,
            CurrentUnitPrice      DECIMAL(18,2)     NOT NULL,
            Quantity              DECIMAL(18,2)     NOT NULL,
            CurrentTotalPrice     DECIMAL(18,2)     NOT NULL,
            Currency              NVARCHAR(3)       NOT NULL
                CONSTRAINT DF_ProductNegotiations_Currency DEFAULT (N'EGP'),
            DeliveryLeadTimeDays  INT               NOT NULL,
            DeliveryAddress       NVARCHAR(500)     NULL,
            Notes                 NVARCHAR(1000)    NULL,
            Status                INT               NOT NULL,
            LastActionByCompanyId UNIQUEIDENTIFIER  NOT NULL,
            LastActionByUserId    UNIQUEIDENTIFIER  NOT NULL,
            RespondedAtUtc        DATETIMEOFFSET    NULL,
            RejectionReason       NVARCHAR(500)     NULL,
            DealId                UNIQUEIDENTIFIER  NULL,
            RowVersion            ROWVERSION        NOT NULL,
            CreatedAtUtc          DATETIMEOFFSET    NOT NULL,
            CreatedBy             NVARCHAR(100)     NULL,
            LastModifiedAtUtc     DATETIMEOFFSET    NULL,
            LastModifiedBy        NVARCHAR(100)     NULL,

            CONSTRAINT PK_ProductNegotiations PRIMARY KEY (Id),

            CONSTRAINT FK_ProductNegotiations_CatalogProducts_CatalogProductId
                FOREIGN KEY (CatalogProductId)
                REFERENCES dbo.CatalogProducts(Id) ON DELETE NO ACTION,

            CONSTRAINT FK_ProductNegotiations_Companies_BuyerCompanyId
                FOREIGN KEY (BuyerCompanyId)
                REFERENCES dbo.Companies(Id) ON DELETE NO ACTION,

            CONSTRAINT FK_ProductNegotiations_Companies_SupplierCompanyId
                FOREIGN KEY (SupplierCompanyId)
                REFERENCES dbo.Companies(Id) ON DELETE NO ACTION,

            CONSTRAINT FK_ProductNegotiations_Users_BuyerUserId
                FOREIGN KEY (BuyerUserId)
                REFERENCES dbo.Users(Id) ON DELETE NO ACTION
        );
    END;

    /* ================================================================
       7. ProductNegotiationRevisions table
       ================================================================ */

    IF OBJECT_ID(N'dbo.ProductNegotiationRevisions', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.ProductNegotiationRevisions (
            Id                  UNIQUEIDENTIFIER  NOT NULL,
            NegotiationId       UNIQUEIDENTIFIER  NOT NULL,
            RevisionNumber      INT               NOT NULL,
            ProposedByCompanyId UNIQUEIDENTIFIER  NOT NULL,
            ProposedByUserId    UNIQUEIDENTIFIER  NOT NULL,
            UnitPrice           DECIMAL(18,2)     NOT NULL,
            Quantity            DECIMAL(18,2)     NOT NULL,
            TotalPrice          DECIMAL(18,2)     NOT NULL,
            DeliveryLeadTimeDays INT              NOT NULL,
            Notes               NVARCHAR(1000)    NULL,
            CreatedAtUtc        DATETIMEOFFSET    NOT NULL,

            CONSTRAINT PK_ProductNegotiationRevisions PRIMARY KEY (Id),

            CONSTRAINT FK_ProductNegotiationRevisions_ProductNegotiations_NegotiationId
                FOREIGN KEY (NegotiationId)
                REFERENCES dbo.ProductNegotiations(Id) ON DELETE CASCADE
        );
    END;

    /* ================================================================
       8. Indexes
       All indexes on NEW columns of EXISTING tables use sp_executesql
       to avoid compile-time "Invalid column name" errors.
       Indexes on NEW tables (ProductNegotiations, Revisions) are safe
       as plain DDL because those tables were just created above.
       ================================================================ */

    -- NEW table indexes (safe as plain DDL)
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.ProductNegotiationRevisions') AND name = N'IX_ProductNegotiationRevisions_NegotiationId')
        CREATE INDEX IX_ProductNegotiationRevisions_NegotiationId
            ON dbo.ProductNegotiationRevisions(NegotiationId);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.ProductNegotiations') AND name = N'IX_ProductNegotiations_BuyerCompanyId')
        CREATE INDEX IX_ProductNegotiations_BuyerCompanyId
            ON dbo.ProductNegotiations(BuyerCompanyId);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.ProductNegotiations') AND name = N'IX_ProductNegotiations_BuyerUserId')
        CREATE INDEX IX_ProductNegotiations_BuyerUserId
            ON dbo.ProductNegotiations(BuyerUserId);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.ProductNegotiations') AND name = N'IX_ProductNegotiations_CatalogProductId')
        CREATE INDEX IX_ProductNegotiations_CatalogProductId
            ON dbo.ProductNegotiations(CatalogProductId);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.ProductNegotiations') AND name = N'IX_ProductNegotiations_NegotiationNumber')
        CREATE UNIQUE INDEX IX_ProductNegotiations_NegotiationNumber
            ON dbo.ProductNegotiations(NegotiationNumber);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.ProductNegotiations') AND name = N'IX_ProductNegotiations_Status')
        CREATE INDEX IX_ProductNegotiations_Status
            ON dbo.ProductNegotiations(Status);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.ProductNegotiations') AND name = N'IX_ProductNegotiations_SupplierCompanyId')
        CREATE INDEX IX_ProductNegotiations_SupplierCompanyId
            ON dbo.ProductNegotiations(SupplierCompanyId);

    -- EXISTING table indexes → new columns → sp_executesql required

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Rfqs') AND name = N'IX_Rfqs_AwardedOfferId')
        EXEC sys.sp_executesql N'
            CREATE INDEX IX_Rfqs_AwardedOfferId
                ON dbo.Rfqs(AwardedOfferId);';

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.CatalogProducts') AND name = N'IX_CatalogProducts_CategoryId')
        EXEC sys.sp_executesql N'
            CREATE INDEX IX_CatalogProducts_CategoryId
                ON dbo.CatalogProducts(CategoryId);';

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Deals') AND name = N'IX_Deals_ProductNegotiationId')
        EXEC sys.sp_executesql N'
            CREATE UNIQUE INDEX IX_Deals_ProductNegotiationId
                ON dbo.Deals(ProductNegotiationId)
                WHERE ProductNegotiationId IS NOT NULL;';

    /* ================================================================
       9. Foreign keys on existing tables → sp_executesql required
       ================================================================ */

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_CatalogProducts_MaterialCategories_CategoryId')
        EXEC sys.sp_executesql N'
            ALTER TABLE dbo.CatalogProducts
                ADD CONSTRAINT FK_CatalogProducts_MaterialCategories_CategoryId
                FOREIGN KEY (CategoryId)
                REFERENCES dbo.MaterialCategories(Id) ON DELETE NO ACTION;';

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Deals_ProductNegotiations_ProductNegotiationId')
        EXEC sys.sp_executesql N'
            ALTER TABLE dbo.Deals
                ADD CONSTRAINT FK_Deals_ProductNegotiations_ProductNegotiationId
                FOREIGN KEY (ProductNegotiationId)
                REFERENCES dbo.ProductNegotiations(Id) ON DELETE NO ACTION;';

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Rfqs_Offers_AwardedOfferId')
        EXEC sys.sp_executesql N'
            ALTER TABLE dbo.Rfqs
                ADD CONSTRAINT FK_Rfqs_Offers_AwardedOfferId
                FOREIGN KEY (AwardedOfferId)
                REFERENCES dbo.Offers(Id) ON DELETE NO ACTION;';

    /* ================================================================
       10. Final verification before recording the migration
       ================================================================ */

    IF    COL_LENGTH('dbo.CatalogProducts', 'CategoryId')           IS NULL
       OR COL_LENGTH('dbo.Deals',           'ProductNegotiationId') IS NULL
       OR COL_LENGTH('dbo.Rfqs',            'AwardedOfferId')       IS NULL
       OR OBJECT_ID(N'dbo.ProductNegotiations',         N'U') IS NULL
       OR OBJECT_ID(N'dbo.ProductNegotiationRevisions', N'U') IS NULL
    BEGIN
        THROW 51002, 'Final migration verification failed. Check error log.', 1;
    END;

    INSERT INTO dbo.__EFMigrationsHistory (MigrationId, ProductVersion)
    VALUES (@MigrationId, N'10.0.3');

    COMMIT TRANSACTION;

    PRINT 'SUCCESS: Migration 20261111180118 repair completed.';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT 'MIGRATION REPAIR FAILED. Transaction rolled back.';
    THROW;
END CATCH;

