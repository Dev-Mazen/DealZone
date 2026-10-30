IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [MaterialCategories] (
        [Id] uniqueidentifier NOT NULL,
        [ParentCategoryId] uniqueidentifier NULL,
        [Code] nvarchar(50) NOT NULL,
        [NameAr] nvarchar(150) NOT NULL,
        [NameEn] nvarchar(150) NOT NULL,
        [DescriptionAr] nvarchar(500) NULL,
        [DescriptionEn] nvarchar(500) NULL,
        [DisplayOrder] int NOT NULL DEFAULT 0,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAtUtc] datetimeoffset NOT NULL,
        CONSTRAINT [PK_MaterialCategories] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MaterialCategories_MaterialCategories_ParentCategoryId] FOREIGN KEY ([ParentCategoryId]) REFERENCES [MaterialCategories] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [ShippingProviders] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(150) NOT NULL,
        [ContactPerson] nvarchar(100) NOT NULL,
        [Phone] nvarchar(30) NOT NULL,
        [Email] nvarchar(256) NOT NULL,
        [SupportedGovernorates] nvarchar(500) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAtUtc] datetimeoffset NOT NULL,
        CONSTRAINT [PK_ShippingProviders] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] uniqueidentifier NOT NULL,
        [Email] nvarchar(256) NOT NULL,
        [FullName] nvarchar(150) NOT NULL,
        [PhoneNumber] nvarchar(30) NULL,
        [PasswordHash] nvarchar(500) NOT NULL,
        [IsSystemAdmin] bit NOT NULL DEFAULT CAST(0 AS bit),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAtUtc] datetimeoffset NOT NULL,
        [LastLoginAtUtc] datetimeoffset NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [Companies] (
        [Id] uniqueidentifier NOT NULL,
        [LegalName] nvarchar(200) NOT NULL,
        [TradeName] nvarchar(200) NOT NULL,
        [IndustrySector] nvarchar(100) NOT NULL,
        [City] nvarchar(100) NOT NULL,
        [Governorate] nvarchar(100) NOT NULL,
        [Description] nvarchar(1000) NULL,
        [Website] nvarchar(255) NULL,
        [VerificationStatus] int NOT NULL,
        [VerifiedAtUtc] datetimeoffset NULL,
        [VerifiedByUserId] uniqueidentifier NULL,
        [RejectionReason] nvarchar(500) NULL,
        [PrimaryContactUserId] uniqueidentifier NOT NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetimeoffset NULL,
        [DeletedBy] nvarchar(100) NULL,
        [RowVersion] rowversion NOT NULL,
        [CreatedAtUtc] datetimeoffset NOT NULL,
        [CreatedBy] nvarchar(100) NULL,
        [LastModifiedAtUtc] datetimeoffset NULL,
        [LastModifiedBy] nvarchar(100) NULL,
        CONSTRAINT [PK_Companies] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Companies_Users_PrimaryContactUserId] FOREIGN KEY ([PrimaryContactUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Companies_Users_VerifiedByUserId] FOREIGN KEY ([VerifiedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [CompanyContactDetails] (
        [CompanyId] uniqueidentifier NOT NULL,
        [TaxIdNumber] nvarchar(50) NOT NULL,
        [CommercialRegistrationNumber] nvarchar(50) NOT NULL,
        [CorporateEmail] nvarchar(256) NOT NULL,
        [CorporatePhone] nvarchar(30) NOT NULL,
        [AddressLine1] nvarchar(250) NOT NULL,
        [AddressLine2] nvarchar(250) NULL,
        [PostalCode] nvarchar(20) NULL,
        [CreatedAtUtc] datetimeoffset NOT NULL,
        [LastModifiedAtUtc] datetimeoffset NULL,
        CONSTRAINT [PK_CompanyContactDetails] PRIMARY KEY ([CompanyId]),
        CONSTRAINT [FK_CompanyContactDetails_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [CompanyMembers] (
        [Id] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Role] int NOT NULL,
        [IsPrimary] bit NOT NULL DEFAULT CAST(0 AS bit),
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [JoinedAtUtc] datetimeoffset NOT NULL,
        CONSTRAINT [PK_CompanyMembers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CompanyMembers_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CompanyMembers_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [Rfqs] (
        [Id] uniqueidentifier NOT NULL,
        [RfqNumber] nvarchar(30) NOT NULL,
        [BuyerCompanyId] uniqueidentifier NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Description] nvarchar(2000) NULL,
        [Status] int NOT NULL,
        [DeliveryGovernorate] nvarchar(100) NOT NULL,
        [DeliveryAddress] nvarchar(300) NOT NULL,
        [TargetCategoryId] uniqueidentifier NULL,
        [RequiredDeliveryDateUtc] datetimeoffset NULL,
        [ClosingDateUtc] datetimeoffset NOT NULL,
        [PublishedAtUtc] datetimeoffset NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetimeoffset NULL,
        [DeletedBy] nvarchar(100) NULL,
        [RowVersion] rowversion NOT NULL,
        [CreatedAtUtc] datetimeoffset NOT NULL,
        [CreatedBy] nvarchar(100) NULL,
        [LastModifiedAtUtc] datetimeoffset NULL,
        [LastModifiedBy] nvarchar(100) NULL,
        CONSTRAINT [PK_Rfqs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Rfqs_Companies_BuyerCompanyId] FOREIGN KEY ([BuyerCompanyId]) REFERENCES [Companies] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Rfqs_MaterialCategories_TargetCategoryId] FOREIGN KEY ([TargetCategoryId]) REFERENCES [MaterialCategories] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [VerificationDocuments] (
        [Id] uniqueidentifier NOT NULL,
        [CompanyId] uniqueidentifier NOT NULL,
        [DocumentType] int NOT NULL,
        [FileName] nvarchar(255) NOT NULL,
        [StorageKey] nvarchar(500) NOT NULL,
        [ContentType] nvarchar(100) NOT NULL,
        [FileSizeBytes] bigint NOT NULL,
        [UploadedAtUtc] datetimeoffset NOT NULL,
        [Status] int NOT NULL,
        [RejectionReason] nvarchar(500) NULL,
        [ReviewedAtUtc] datetimeoffset NULL,
        [ReviewedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_VerificationDocuments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_VerificationDocuments_Companies_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Companies] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_VerificationDocuments_Users_ReviewedByUserId] FOREIGN KEY ([ReviewedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [Offers] (
        [Id] uniqueidentifier NOT NULL,
        [OfferNumber] nvarchar(30) NOT NULL,
        [RfqId] uniqueidentifier NOT NULL,
        [SupplierCompanyId] uniqueidentifier NOT NULL,
        [OriginalOfferId] uniqueidentifier NULL,
        [RevisionNumber] int NOT NULL DEFAULT 1,
        [Status] int NOT NULL,
        [TotalAmount] decimal(18,2) NOT NULL,
        [Currency] nvarchar(3) NOT NULL DEFAULT N'EGP',
        [ValidityDateUtc] datetimeoffset NOT NULL,
        [DeliveryLeadTimeDays] int NOT NULL,
        [ShippingIncluded] bit NOT NULL DEFAULT CAST(0 AS bit),
        [PaymentTerms] nvarchar(250) NOT NULL,
        [Notes] nvarchar(1000) NULL,
        [SubmittedAtUtc] datetimeoffset NOT NULL,
        [RowVersion] rowversion NOT NULL,
        [CreatedAtUtc] datetimeoffset NOT NULL,
        [CreatedBy] nvarchar(100) NULL,
        [LastModifiedAtUtc] datetimeoffset NULL,
        [LastModifiedBy] nvarchar(100) NULL,
        CONSTRAINT [PK_Offers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Offers_Companies_SupplierCompanyId] FOREIGN KEY ([SupplierCompanyId]) REFERENCES [Companies] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Offers_Offers_OriginalOfferId] FOREIGN KEY ([OriginalOfferId]) REFERENCES [Offers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Offers_Rfqs_RfqId] FOREIGN KEY ([RfqId]) REFERENCES [Rfqs] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [RfqItems] (
        [Id] uniqueidentifier NOT NULL,
        [RfqId] uniqueidentifier NOT NULL,
        [CategoryId] uniqueidentifier NOT NULL,
        [MaterialName] nvarchar(200) NOT NULL,
        [Specifications] nvarchar(1500) NOT NULL,
        [Quantity] decimal(18,4) NOT NULL,
        [Unit] int NOT NULL,
        [TargetPricePerUnit] decimal(18,2) NULL,
        [LineNumber] int NOT NULL,
        CONSTRAINT [PK_RfqItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RfqItems_MaterialCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [MaterialCategories] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_RfqItems_Rfqs_RfqId] FOREIGN KEY ([RfqId]) REFERENCES [Rfqs] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [Deals] (
        [Id] uniqueidentifier NOT NULL,
        [DealNumber] nvarchar(30) NOT NULL,
        [RfqId] uniqueidentifier NOT NULL,
        [OfferId] uniqueidentifier NOT NULL,
        [BuyerCompanyId] uniqueidentifier NOT NULL,
        [SupplierCompanyId] uniqueidentifier NOT NULL,
        [AgreedPrice] decimal(18,2) NOT NULL,
        [Currency] nvarchar(3) NOT NULL DEFAULT N'EGP',
        [Status] int NOT NULL,
        [ConfirmedAtUtc] datetimeoffset NULL,
        [CompletedAtUtc] datetimeoffset NULL,
        [CancelledAtUtc] datetimeoffset NULL,
        [CancellationReason] nvarchar(500) NULL,
        [RowVersion] rowversion NOT NULL,
        [CreatedAtUtc] datetimeoffset NOT NULL,
        [CreatedBy] nvarchar(100) NULL,
        [LastModifiedAtUtc] datetimeoffset NULL,
        [LastModifiedBy] nvarchar(100) NULL,
        CONSTRAINT [PK_Deals] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Deals_Companies_BuyerCompanyId] FOREIGN KEY ([BuyerCompanyId]) REFERENCES [Companies] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Deals_Companies_SupplierCompanyId] FOREIGN KEY ([SupplierCompanyId]) REFERENCES [Companies] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Deals_Offers_OfferId] FOREIGN KEY ([OfferId]) REFERENCES [Offers] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Deals_Rfqs_RfqId] FOREIGN KEY ([RfqId]) REFERENCES [Rfqs] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [OfferItems] (
        [Id] uniqueidentifier NOT NULL,
        [OfferId] uniqueidentifier NOT NULL,
        [RfqItemId] uniqueidentifier NOT NULL,
        [UnitPrice] decimal(18,2) NOT NULL,
        [OfferedQuantity] decimal(18,4) NOT NULL,
        [TotalPrice] decimal(18,2) NOT NULL,
        [MaterialSpecifications] nvarchar(1500) NULL,
        [Notes] nvarchar(500) NULL,
        CONSTRAINT [PK_OfferItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OfferItems_Offers_OfferId] FOREIGN KEY ([OfferId]) REFERENCES [Offers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_OfferItems_RfqItems_RfqItemId] FOREIGN KEY ([RfqItemId]) REFERENCES [RfqItems] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [DealDisputes] (
        [Id] uniqueidentifier NOT NULL,
        [DealId] uniqueidentifier NOT NULL,
        [OpenedByCompanyId] uniqueidentifier NOT NULL,
        [OpenedByUserId] uniqueidentifier NOT NULL,
        [Reason] nvarchar(200) NOT NULL,
        [Description] nvarchar(2000) NOT NULL,
        [Status] int NOT NULL,
        [ResolutionNotes] nvarchar(2000) NULL,
        [ResolvedByUserId] uniqueidentifier NULL,
        [OpenedAtUtc] datetimeoffset NOT NULL,
        [ResolvedAtUtc] datetimeoffset NULL,
        CONSTRAINT [PK_DealDisputes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DealDisputes_Companies_OpenedByCompanyId] FOREIGN KEY ([OpenedByCompanyId]) REFERENCES [Companies] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_DealDisputes_Deals_DealId] FOREIGN KEY ([DealId]) REFERENCES [Deals] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_DealDisputes_Users_OpenedByUserId] FOREIGN KEY ([OpenedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_DealDisputes_Users_ResolvedByUserId] FOREIGN KEY ([ResolvedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [Reviews] (
        [Id] uniqueidentifier NOT NULL,
        [DealId] uniqueidentifier NOT NULL,
        [ReviewerCompanyId] uniqueidentifier NOT NULL,
        [TargetCompanyId] uniqueidentifier NOT NULL,
        [Rating] int NOT NULL,
        [Comment] nvarchar(1000) NOT NULL,
        [CreatedAtUtc] datetimeoffset NOT NULL,
        [IsDeleted] bit NOT NULL DEFAULT CAST(0 AS bit),
        [DeletedAtUtc] datetimeoffset NULL,
        [DeletedBy] nvarchar(100) NULL,
        CONSTRAINT [PK_Reviews] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Reviews_Companies_ReviewerCompanyId] FOREIGN KEY ([ReviewerCompanyId]) REFERENCES [Companies] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Reviews_Companies_TargetCompanyId] FOREIGN KEY ([TargetCompanyId]) REFERENCES [Companies] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Reviews_Deals_DealId] FOREIGN KEY ([DealId]) REFERENCES [Deals] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE TABLE [Shipments] (
        [Id] uniqueidentifier NOT NULL,
        [DealId] uniqueidentifier NOT NULL,
        [Arrangement] int NOT NULL,
        [ShippingProviderId] uniqueidentifier NULL,
        [TrackingNumber] nvarchar(100) NULL,
        [PickupAddress] nvarchar(300) NOT NULL,
        [DeliveryAddress] nvarchar(300) NOT NULL,
        [Status] int NOT NULL,
        [PickupDateUtc] datetimeoffset NULL,
        [EstimatedDeliveryDateUtc] datetimeoffset NULL,
        [ActualDeliveryDateUtc] datetimeoffset NULL,
        [Notes] nvarchar(1000) NULL,
        [RowVersion] rowversion NOT NULL,
        [CreatedAtUtc] datetimeoffset NOT NULL,
        [CreatedBy] nvarchar(100) NULL,
        [LastModifiedAtUtc] datetimeoffset NULL,
        [LastModifiedBy] nvarchar(100) NULL,
        CONSTRAINT [PK_Shipments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Shipments_Deals_DealId] FOREIGN KEY ([DealId]) REFERENCES [Deals] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Shipments_ShippingProviders_ShippingProviderId] FOREIGN KEY ([ShippingProviderId]) REFERENCES [ShippingProviders] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Companies_Governorate] ON [Companies] ([Governorate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Companies_PrimaryContactUserId] ON [Companies] ([PrimaryContactUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Companies_VerificationStatus] ON [Companies] ([VerificationStatus]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Companies_VerifiedByUserId] ON [Companies] ([VerifiedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CompanyContactDetails_CommercialRegistrationNumber] ON [CompanyContactDetails] ([CommercialRegistrationNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CompanyContactDetails_TaxIdNumber] ON [CompanyContactDetails] ([TaxIdNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CompanyMembers_CompanyId_UserId] ON [CompanyMembers] ([CompanyId], [UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_CompanyMembers_UserId] ON [CompanyMembers] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DealDisputes_DealId] ON [DealDisputes] ([DealId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DealDisputes_OpenedByCompanyId] ON [DealDisputes] ([OpenedByCompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DealDisputes_OpenedByUserId] ON [DealDisputes] ([OpenedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_DealDisputes_ResolvedByUserId] ON [DealDisputes] ([ResolvedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Deals_BuyerCompanyId] ON [Deals] ([BuyerCompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Deals_DealNumber] ON [Deals] ([DealNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Deals_OfferId] ON [Deals] ([OfferId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Deals_RfqId] ON [Deals] ([RfqId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Deals_Status] ON [Deals] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Deals_SupplierCompanyId] ON [Deals] ([SupplierCompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MaterialCategories_Code] ON [MaterialCategories] ([Code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MaterialCategories_ParentCategoryId] ON [MaterialCategories] ([ParentCategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OfferItems_OfferId] ON [OfferItems] ([OfferId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_OfferItems_RfqItemId] ON [OfferItems] ([RfqItemId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Offers_OfferNumber] ON [Offers] ([OfferNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Offers_OriginalOfferId] ON [Offers] ([OriginalOfferId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Offers_RfqId_SupplierCompanyId_RevisionNumber] ON [Offers] ([RfqId], [SupplierCompanyId], [RevisionNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Offers_Status] ON [Offers] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Offers_SupplierCompanyId] ON [Offers] ([SupplierCompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Reviews_DealId_ReviewerCompanyId] ON [Reviews] ([DealId], [ReviewerCompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Reviews_ReviewerCompanyId] ON [Reviews] ([ReviewerCompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Reviews_TargetCompanyId] ON [Reviews] ([TargetCompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RfqItems_CategoryId] ON [RfqItems] ([CategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_RfqItems_RfqId] ON [RfqItems] ([RfqId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Rfqs_BuyerCompanyId] ON [Rfqs] ([BuyerCompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Rfqs_RfqNumber] ON [Rfqs] ([RfqNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Rfqs_Status_ClosingDateUtc] ON [Rfqs] ([Status], [ClosingDateUtc]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Rfqs_TargetCategoryId] ON [Rfqs] ([TargetCategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Shipments_DealId] ON [Shipments] ([DealId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Shipments_ShippingProviderId] ON [Shipments] ([ShippingProviderId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ShippingProviders_Name] ON [ShippingProviders] ([Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_VerificationDocuments_CompanyId] ON [VerificationDocuments] ([CompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_VerificationDocuments_ReviewedByUserId] ON [VerificationDocuments] ([ReviewedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261030143637_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261030143637_InitialCreate', N'10.0.3');
END;

COMMIT;
GO

