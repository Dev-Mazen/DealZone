using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MaterialCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ParentCategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NameAr = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    NameEn = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    DescriptionAr = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DescriptionEn = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterialCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaterialCategories_MaterialCategories_ParentCategoryId",
                        column: x => x.ParentCategoryId,
                        principalTable: "MaterialCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ShippingProviders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ContactPerson = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    SupportedGovernorates = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShippingProviders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    PasswordHash = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsSystemAdmin = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    LastLoginAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Companies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LegalName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TradeName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    IndustrySector = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Governorate = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Website = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    VerificationStatus = table.Column<int>(type: "int", nullable: false),
                    VerifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    VerifiedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PrimaryContactUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Companies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Companies_Users_PrimaryContactUserId",
                        column: x => x.PrimaryContactUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Companies_Users_VerifiedByUserId",
                        column: x => x.VerifiedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CompanyContactDetails",
                columns: table => new
                {
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TaxIdNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CommercialRegistrationNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CorporateEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    CorporatePhone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AddressLine1 = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    AddressLine2 = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    PostalCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyContactDetails", x => x.CompanyId);
                    table.ForeignKey(
                        name: "FK_CompanyContactDetails_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CompanyMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    JoinedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompanyMembers_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompanyMembers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Rfqs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RfqNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    BuyerCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    DeliveryGovernorate = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DeliveryAddress = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    TargetCategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RequiredDeliveryDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ClosingDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    PublishedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rfqs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Rfqs_Companies_BuyerCompanyId",
                        column: x => x.BuyerCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Rfqs_MaterialCategories_TargetCategoryId",
                        column: x => x.TargetCategoryId,
                        principalTable: "MaterialCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VerificationDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentType = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    StorageKey = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    UploadedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ReviewedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ReviewedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VerificationDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VerificationDocuments_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VerificationDocuments_Users_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Offers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OfferNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    RfqId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SupplierCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OriginalOfferId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RevisionNumber = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false, defaultValue: "EGP"),
                    ValidityDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeliveryLeadTimeDays = table.Column<int>(type: "int", nullable: false),
                    ShippingIncluded = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    PaymentTerms = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SubmittedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Offers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Offers_Companies_SupplierCompanyId",
                        column: x => x.SupplierCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Offers_Offers_OriginalOfferId",
                        column: x => x.OriginalOfferId,
                        principalTable: "Offers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Offers_Rfqs_RfqId",
                        column: x => x.RfqId,
                        principalTable: "Rfqs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RfqItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RfqId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MaterialName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Specifications = table.Column<string>(type: "nvarchar(1500)", maxLength: 1500, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Unit = table.Column<int>(type: "int", nullable: false),
                    TargetPricePerUnit = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    LineNumber = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RfqItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RfqItems_MaterialCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "MaterialCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RfqItems_Rfqs_RfqId",
                        column: x => x.RfqId,
                        principalTable: "Rfqs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Deals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    RfqId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OfferId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BuyerCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SupplierCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AgreedPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false, defaultValue: "EGP"),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ConfirmedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CompletedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CancelledAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CancellationReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Deals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Deals_Companies_BuyerCompanyId",
                        column: x => x.BuyerCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Deals_Companies_SupplierCompanyId",
                        column: x => x.SupplierCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Deals_Offers_OfferId",
                        column: x => x.OfferId,
                        principalTable: "Offers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Deals_Rfqs_RfqId",
                        column: x => x.RfqId,
                        principalTable: "Rfqs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OfferItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OfferId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RfqItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    OfferedQuantity = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MaterialSpecifications = table.Column<string>(type: "nvarchar(1500)", maxLength: 1500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfferItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OfferItems_Offers_OfferId",
                        column: x => x.OfferId,
                        principalTable: "Offers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OfferItems_RfqItems_RfqItemId",
                        column: x => x.RfqItemId,
                        principalTable: "RfqItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DealDisputes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OpenedByCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OpenedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ResolutionNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ResolvedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    OpenedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ResolvedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DealDisputes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DealDisputes_Companies_OpenedByCompanyId",
                        column: x => x.OpenedByCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DealDisputes_Deals_DealId",
                        column: x => x.DealId,
                        principalTable: "Deals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DealDisputes_Users_OpenedByUserId",
                        column: x => x.OpenedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DealDisputes_Users_ResolvedByUserId",
                        column: x => x.ResolvedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReviewerCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TargetCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DeletedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reviews_Companies_ReviewerCompanyId",
                        column: x => x.ReviewerCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reviews_Companies_TargetCompanyId",
                        column: x => x.TargetCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reviews_Deals_DealId",
                        column: x => x.DealId,
                        principalTable: "Deals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Shipments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Arrangement = table.Column<int>(type: "int", nullable: false),
                    ShippingProviderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TrackingNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PickupAddress = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    DeliveryAddress = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    PickupDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    EstimatedDeliveryDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ActualDeliveryDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shipments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Shipments_Deals_DealId",
                        column: x => x.DealId,
                        principalTable: "Deals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Shipments_ShippingProviders_ShippingProviderId",
                        column: x => x.ShippingProviderId,
                        principalTable: "ShippingProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Companies_Governorate",
                table: "Companies",
                column: "Governorate");

            migrationBuilder.CreateIndex(
                name: "IX_Companies_PrimaryContactUserId",
                table: "Companies",
                column: "PrimaryContactUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Companies_VerificationStatus",
                table: "Companies",
                column: "VerificationStatus");

            migrationBuilder.CreateIndex(
                name: "IX_Companies_VerifiedByUserId",
                table: "Companies",
                column: "VerifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyContactDetails_CommercialRegistrationNumber",
                table: "CompanyContactDetails",
                column: "CommercialRegistrationNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompanyContactDetails_TaxIdNumber",
                table: "CompanyContactDetails",
                column: "TaxIdNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompanyMembers_CompanyId_UserId",
                table: "CompanyMembers",
                columns: new[] { "CompanyId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CompanyMembers_UserId",
                table: "CompanyMembers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DealDisputes_DealId",
                table: "DealDisputes",
                column: "DealId");

            migrationBuilder.CreateIndex(
                name: "IX_DealDisputes_OpenedByCompanyId",
                table: "DealDisputes",
                column: "OpenedByCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_DealDisputes_OpenedByUserId",
                table: "DealDisputes",
                column: "OpenedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DealDisputes_ResolvedByUserId",
                table: "DealDisputes",
                column: "ResolvedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_BuyerCompanyId",
                table: "Deals",
                column: "BuyerCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_DealNumber",
                table: "Deals",
                column: "DealNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Deals_OfferId",
                table: "Deals",
                column: "OfferId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Deals_RfqId",
                table: "Deals",
                column: "RfqId");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_Status",
                table: "Deals",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_SupplierCompanyId",
                table: "Deals",
                column: "SupplierCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialCategories_Code",
                table: "MaterialCategories",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MaterialCategories_ParentCategoryId",
                table: "MaterialCategories",
                column: "ParentCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_OfferItems_OfferId",
                table: "OfferItems",
                column: "OfferId");

            migrationBuilder.CreateIndex(
                name: "IX_OfferItems_RfqItemId",
                table: "OfferItems",
                column: "RfqItemId");

            migrationBuilder.CreateIndex(
                name: "IX_Offers_OfferNumber",
                table: "Offers",
                column: "OfferNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Offers_OriginalOfferId",
                table: "Offers",
                column: "OriginalOfferId");

            migrationBuilder.CreateIndex(
                name: "IX_Offers_RfqId_SupplierCompanyId_RevisionNumber",
                table: "Offers",
                columns: new[] { "RfqId", "SupplierCompanyId", "RevisionNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Offers_Status",
                table: "Offers",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Offers_SupplierCompanyId",
                table: "Offers",
                column: "SupplierCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_DealId_ReviewerCompanyId",
                table: "Reviews",
                columns: new[] { "DealId", "ReviewerCompanyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_ReviewerCompanyId",
                table: "Reviews",
                column: "ReviewerCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_TargetCompanyId",
                table: "Reviews",
                column: "TargetCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_RfqItems_CategoryId",
                table: "RfqItems",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_RfqItems_RfqId",
                table: "RfqItems",
                column: "RfqId");

            migrationBuilder.CreateIndex(
                name: "IX_Rfqs_BuyerCompanyId",
                table: "Rfqs",
                column: "BuyerCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Rfqs_RfqNumber",
                table: "Rfqs",
                column: "RfqNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rfqs_Status_ClosingDateUtc",
                table: "Rfqs",
                columns: new[] { "Status", "ClosingDateUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Rfqs_TargetCategoryId",
                table: "Rfqs",
                column: "TargetCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_DealId",
                table: "Shipments",
                column: "DealId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_ShippingProviderId",
                table: "Shipments",
                column: "ShippingProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_ShippingProviders_Name",
                table: "ShippingProviders",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VerificationDocuments_CompanyId",
                table: "VerificationDocuments",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_VerificationDocuments_ReviewedByUserId",
                table: "VerificationDocuments",
                column: "ReviewedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompanyContactDetails");

            migrationBuilder.DropTable(
                name: "CompanyMembers");

            migrationBuilder.DropTable(
                name: "DealDisputes");

            migrationBuilder.DropTable(
                name: "OfferItems");

            migrationBuilder.DropTable(
                name: "Reviews");

            migrationBuilder.DropTable(
                name: "Shipments");

            migrationBuilder.DropTable(
                name: "VerificationDocuments");

            migrationBuilder.DropTable(
                name: "RfqItems");

            migrationBuilder.DropTable(
                name: "Deals");

            migrationBuilder.DropTable(
                name: "ShippingProviders");

            migrationBuilder.DropTable(
                name: "Offers");

            migrationBuilder.DropTable(
                name: "Rfqs");

            migrationBuilder.DropTable(
                name: "Companies");

            migrationBuilder.DropTable(
                name: "MaterialCategories");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
