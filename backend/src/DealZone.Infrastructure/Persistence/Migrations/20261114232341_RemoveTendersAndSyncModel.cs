using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveTendersAndSyncModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF OBJECT_ID(N'[FK_Deals_Bids_BidId]', 'F') IS NOT NULL ALTER TABLE [Deals] DROP CONSTRAINT [FK_Deals_Bids_BidId];
                IF OBJECT_ID(N'[FK_Deals_Tenders_TenderId]', 'F') IS NOT NULL ALTER TABLE [Deals] DROP CONSTRAINT [FK_Deals_Tenders_TenderId];
                IF OBJECT_ID(N'[FK_Tenders_Bids_AwardedBidId]', 'F') IS NOT NULL ALTER TABLE [Tenders] DROP CONSTRAINT [FK_Tenders_Bids_AwardedBidId];

                DROP TABLE IF EXISTS [BidItems];
                DROP TABLE IF EXISTS [TenderItems];
                DROP TABLE IF EXISTS [Bids];
                DROP TABLE IF EXISTS [Tenders];

                IF EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_Deals_BidId' AND object_id = OBJECT_ID(N'[Deals]'))
                    DROP INDEX [IX_Deals_BidId] ON [Deals];

                IF EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_Deals_TenderId' AND object_id = OBJECT_ID(N'[Deals]'))
                    DROP INDEX [IX_Deals_TenderId] ON [Deals];

                IF COL_LENGTH(N'Deals', N'BidId') IS NOT NULL
                    ALTER TABLE [Deals] DROP COLUMN [BidId];

                IF COL_LENGTH(N'Deals', N'BidRevisionNumber') IS NOT NULL
                    ALTER TABLE [Deals] DROP COLUMN [BidRevisionNumber];

                IF COL_LENGTH(N'Deals', N'TenderId') IS NOT NULL
                    ALTER TABLE [Deals] DROP COLUMN [TenderId];

                DROP SEQUENCE IF EXISTS [BidNumberSequence];
                DROP SEQUENCE IF EXISTS [TenderNumberSequence];

                IF COL_LENGTH(N'Rfqs', N'TargetSupplierCompanyId') IS NULL
                BEGIN
                    ALTER TABLE [Rfqs] ADD [TargetSupplierCompanyId] uniqueidentifier NULL;
                END

                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_Rfqs_TargetSupplierCompanyId' AND object_id = OBJECT_ID(N'[Rfqs]'))
                BEGIN
                    CREATE INDEX [IX_Rfqs_TargetSupplierCompanyId] ON [Rfqs] ([TargetSupplierCompanyId]);
                END

                IF OBJECT_ID(N'[FK_Rfqs_Companies_TargetSupplierCompanyId]', 'F') IS NULL
                BEGIN
                    ALTER TABLE [Rfqs] ADD CONSTRAINT [FK_Rfqs_Companies_TargetSupplierCompanyId] 
                    FOREIGN KEY ([TargetSupplierCompanyId]) REFERENCES [Companies] ([Id]);
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Rfqs_Companies_TargetSupplierCompanyId",
                table: "Rfqs");

            migrationBuilder.DropIndex(
                name: "IX_Rfqs_TargetSupplierCompanyId",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "TargetSupplierCompanyId",
                table: "Rfqs");

            migrationBuilder.CreateSequence(
                name: "BidNumberSequence",
                startValue: 1000L);

            migrationBuilder.CreateSequence(
                name: "TenderNumberSequence",
                startValue: 1000L);

            migrationBuilder.AddColumn<Guid>(
                name: "BidId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BidRevisionNumber",
                table: "Deals",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TenderId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BidItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BidId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenderItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BidItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Bids",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OriginalBidId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    SupplierCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AcceptedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    AcceptedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    BidNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ChangeSummary = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false, defaultValue: "EGP"),
                    DeliveryLeadTimeDays = table.Column<int>(type: "int", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    PaymentTerms = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RejectedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RejectedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RevisionNumber = table.Column<int>(type: "int", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    ShippingIncluded = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SubmittedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ValidityDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    WithdrawalReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    WithdrawnAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    WithdrawnByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bids", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bids_Bids_OriginalBidId",
                        column: x => x.OriginalBidId,
                        principalTable: "Bids",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bids_Companies_SupplierCompanyId",
                        column: x => x.SupplierCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Tenders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AwardedBidId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    BuyerCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TargetCategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AwardRationale = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    AwardedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    AwardedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CancellationReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CancelledAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CancelledByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ClosingDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false, defaultValue: "EGP"),
                    DeletedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DeliveryAddress = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    DeliveryCity = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DeliveryGovernorate = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    PublishedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ReferencePrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    ReopenedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ReopenedCount = table.Column<int>(type: "int", nullable: false),
                    RequiredDeliveryDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TenderNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tenders_Bids_AwardedBidId",
                        column: x => x.AwardedBidId,
                        principalTable: "Bids",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tenders_Companies_BuyerCompanyId",
                        column: x => x.BuyerCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tenders_MaterialCategories_TargetCategoryId",
                        column: x => x.TargetCategoryId,
                        principalTable: "MaterialCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TenderItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MaterialId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TenderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UnitOfMeasureId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LineNumber = table.Column<int>(type: "int", nullable: false),
                    MaterialName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Specifications = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    TargetPricePerUnit = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Unit = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenderItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenderItems_MaterialCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "MaterialCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TenderItems_Materials_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "Materials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_TenderItems_Tenders_TenderId",
                        column: x => x.TenderId,
                        principalTable: "Tenders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TenderItems_UnitsOfMeasure_UnitOfMeasureId",
                        column: x => x.UnitOfMeasureId,
                        principalTable: "UnitsOfMeasure",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Deals_BidId",
                table: "Deals",
                column: "BidId",
                unique: true,
                filter: "[BidId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_TenderId",
                table: "Deals",
                column: "TenderId",
                unique: true,
                filter: "[TenderId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_BidItems_BidId",
                table: "BidItems",
                column: "BidId");

            migrationBuilder.CreateIndex(
                name: "IX_BidItems_TenderItemId",
                table: "BidItems",
                column: "TenderItemId");

            migrationBuilder.CreateIndex(
                name: "IX_Bids_BidNumber",
                table: "Bids",
                column: "BidNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bids_OriginalBidId",
                table: "Bids",
                column: "OriginalBidId");

            migrationBuilder.CreateIndex(
                name: "IX_Bids_Status",
                table: "Bids",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Bids_SupplierCompanyId",
                table: "Bids",
                column: "SupplierCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Bids_TenderId",
                table: "Bids",
                column: "TenderId");

            migrationBuilder.CreateIndex(
                name: "IX_Bids_TenderId_SupplierCompanyId_RevisionNumber",
                table: "Bids",
                columns: new[] { "TenderId", "SupplierCompanyId", "RevisionNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_TenderItems_CategoryId",
                table: "TenderItems",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_TenderItems_MaterialId",
                table: "TenderItems",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_TenderItems_TenderId",
                table: "TenderItems",
                column: "TenderId");

            migrationBuilder.CreateIndex(
                name: "IX_TenderItems_UnitOfMeasureId",
                table: "TenderItems",
                column: "UnitOfMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_Tenders_AwardedBidId",
                table: "Tenders",
                column: "AwardedBidId");

            migrationBuilder.CreateIndex(
                name: "IX_Tenders_BuyerCompanyId",
                table: "Tenders",
                column: "BuyerCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_Tenders_ClosingDateUtc",
                table: "Tenders",
                column: "ClosingDateUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Tenders_Status",
                table: "Tenders",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Tenders_TargetCategoryId",
                table: "Tenders",
                column: "TargetCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Tenders_TenderNumber",
                table: "Tenders",
                column: "TenderNumber",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Deals_Bids_BidId",
                table: "Deals",
                column: "BidId",
                principalTable: "Bids",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Deals_Tenders_TenderId",
                table: "Deals",
                column: "TenderId",
                principalTable: "Tenders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_BidItems_Bids_BidId",
                table: "BidItems",
                column: "BidId",
                principalTable: "Bids",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BidItems_TenderItems_TenderItemId",
                table: "BidItems",
                column: "TenderItemId",
                principalTable: "TenderItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Bids_Tenders_TenderId",
                table: "Bids",
                column: "TenderId",
                principalTable: "Tenders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
