
using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTenderAndReverseBidding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Deals_OfferId",
                table: "Deals");

            migrationBuilder.DropIndex(
                name: "IX_Deals_RfqId",
                table: "Deals");

            migrationBuilder.CreateSequence(
                name: "BidNumberSequence",
                startValue: 1000L);

            migrationBuilder.CreateSequence(
                name: "TenderNumberSequence",
                startValue: 1000L);

            migrationBuilder.AlterColumn<Guid>(
                name: "RfqId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_RfqId",
                table: "Deals",
                column: "RfqId");

            migrationBuilder.AlterColumn<int>(
                name: "OfferRevisionNumber",
                table: "Deals",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<Guid>(
                name: "OfferId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

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

            migrationBuilder.AddColumn<int>(
                name: "Source",
                table: "Deals",
                type: "int",
                nullable: false,
                defaultValue: 1);

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
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
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
                    BidNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    TenderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SupplierCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OriginalBidId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RevisionNumber = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false, defaultValue: "EGP"),
                    ValidityDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DeliveryLeadTimeDays = table.Column<int>(type: "int", nullable: false),
                    ShippingIncluded = table.Column<bool>(type: "bit", nullable: false),
                    PaymentTerms = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ChangeSummary = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SubmittedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    AcceptedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    AcceptedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RejectedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RejectedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    WithdrawnAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    WithdrawnByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    WithdrawalReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
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
                    TenderNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    BuyerCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    DeliveryGovernorate = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DeliveryCity = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DeliveryAddress = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    TargetCategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RequiredDeliveryDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ClosingDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    PublishedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ReferencePrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false, defaultValue: "EGP"),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AwardedBidId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AwardedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    AwardedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AwardRationale = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ReopenedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ReopenedCount = table.Column<int>(type: "int", nullable: false),
                    CancelledAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CancelledByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CancellationReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
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
                    TenderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MaterialId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    MaterialName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Specifications = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    Unit = table.Column<int>(type: "int", nullable: false),
                    UnitOfMeasureId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TargetPricePerUnit = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    LineNumber = table.Column<int>(type: "int", nullable: false)
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
                name: "IX_Deals_OfferId",
                table: "Deals",
                column: "OfferId",
                unique: true,
                filter: "[OfferId] IS NOT NULL");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Deals_Bids_BidId",
                table: "Deals");

            migrationBuilder.DropForeignKey(
                name: "FK_Deals_Tenders_TenderId",
                table: "Deals");

            migrationBuilder.DropForeignKey(
                name: "FK_Tenders_Bids_AwardedBidId",
                table: "Tenders");

            migrationBuilder.DropTable(
                name: "BidItems");

            migrationBuilder.DropTable(
                name: "TenderItems");

            migrationBuilder.DropTable(
                name: "Bids");

            migrationBuilder.DropTable(
                name: "Tenders");

            migrationBuilder.DropIndex(
                name: "IX_Deals_BidId",
                table: "Deals");

            migrationBuilder.DropIndex(
                name: "IX_Deals_OfferId",
                table: "Deals");

            migrationBuilder.DropIndex(
                name: "IX_Deals_TenderId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "BidId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "BidRevisionNumber",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "TenderId",
                table: "Deals");

            migrationBuilder.DropSequence(
                name: "BidNumberSequence");

            migrationBuilder.DropSequence(
                name: "TenderNumberSequence");

            migrationBuilder.DropIndex(
                name: "IX_Deals_RfqId",
                table: "Deals");

            migrationBuilder.AlterColumn<Guid>(
                name: "RfqId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Deals_RfqId",
                table: "Deals",
                column: "RfqId");

            migrationBuilder.AlterColumn<int>(
                name: "OfferRevisionNumber",
                table: "Deals",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "OfferId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_OfferId",
                table: "Deals",
                column: "OfferId",
                unique: true);
        }
    }
}
