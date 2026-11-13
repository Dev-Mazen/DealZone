using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UnifiedMarketplaceAndProcurementRefactor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AwardRationale",
                table: "Rfqs",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "AwardedAtUtc",
                table: "Rfqs",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AwardedByUserId",
                table: "Rfqs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AwardedOfferId",
                table: "Rfqs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                table: "Rfqs",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ReopenedAtUtc",
                table: "Rfqs",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReopenedCount",
                table: "Rfqs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "ProductNegotiationId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "MaterialId",
                table: "CatalogProducts",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "CatalogProducts",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "ImageUrlsJson",
                table: "CatalogProducts",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PricingMode",
                table: "CatalogProducts",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "Specifications",
                table: "CatalogProducts",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "CatalogProducts",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "ton");

            migrationBuilder.CreateTable(
                name: "ProductNegotiations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NegotiationNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CatalogProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BuyerCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BuyerUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SupplierCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CurrentUnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CurrentTotalPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false, defaultValue: "EGP"),
                    DeliveryLeadTimeDays = table.Column<int>(type: "int", nullable: false),
                    DeliveryAddress = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    LastActionByCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LastActionByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RespondedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DealId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductNegotiations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductNegotiations_CatalogProducts_CatalogProductId",
                        column: x => x.CatalogProductId,
                        principalTable: "CatalogProducts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductNegotiations_Companies_BuyerCompanyId",
                        column: x => x.BuyerCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductNegotiations_Companies_SupplierCompanyId",
                        column: x => x.SupplierCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductNegotiations_Users_BuyerUserId",
                        column: x => x.BuyerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProductNegotiationRevisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NegotiationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RevisionNumber = table.Column<int>(type: "int", nullable: false),
                    ProposedByCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProposedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    DeliveryLeadTimeDays = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductNegotiationRevisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductNegotiationRevisions_ProductNegotiations_NegotiationId",
                        column: x => x.NegotiationId,
                        principalTable: "ProductNegotiations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Rfqs_AwardedOfferId",
                table: "Rfqs",
                column: "AwardedOfferId");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_ProductNegotiationId",
                table: "Deals",
                column: "ProductNegotiationId",
                unique: true,
                filter: "[ProductNegotiationId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogProducts_CategoryId",
                table: "CatalogProducts",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductNegotiationRevisions_NegotiationId",
                table: "ProductNegotiationRevisions",
                column: "NegotiationId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductNegotiations_BuyerCompanyId",
                table: "ProductNegotiations",
                column: "BuyerCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductNegotiations_BuyerUserId",
                table: "ProductNegotiations",
                column: "BuyerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductNegotiations_CatalogProductId",
                table: "ProductNegotiations",
                column: "CatalogProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductNegotiations_NegotiationNumber",
                table: "ProductNegotiations",
                column: "NegotiationNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductNegotiations_Status",
                table: "ProductNegotiations",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ProductNegotiations_SupplierCompanyId",
                table: "ProductNegotiations",
                column: "SupplierCompanyId");

            migrationBuilder.Sql(@"
                UPDATE cp
                SET cp.CategoryId = m.CategoryId
                FROM CatalogProducts cp
                INNER JOIN Materials m ON cp.MaterialId = m.Id
                WHERE cp.CategoryId = '00000000-0000-0000-0000-000000000000';

                UPDATE cp
                SET cp.CategoryId = (SELECT TOP 1 Id FROM MaterialCategories WHERE Code = 'METALS')
                FROM CatalogProducts cp
                WHERE cp.CategoryId = '00000000-0000-0000-0000-000000000000';
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_CatalogProducts_MaterialCategories_CategoryId",
                table: "CatalogProducts",
                column: "CategoryId",
                principalTable: "MaterialCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Deals_ProductNegotiations_ProductNegotiationId",
                table: "Deals",
                column: "ProductNegotiationId",
                principalTable: "ProductNegotiations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Rfqs_Offers_AwardedOfferId",
                table: "Rfqs",
                column: "AwardedOfferId",
                principalTable: "Offers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CatalogProducts_MaterialCategories_CategoryId",
                table: "CatalogProducts");

            migrationBuilder.DropForeignKey(
                name: "FK_Deals_ProductNegotiations_ProductNegotiationId",
                table: "Deals");

            migrationBuilder.DropForeignKey(
                name: "FK_Rfqs_Offers_AwardedOfferId",
                table: "Rfqs");

            migrationBuilder.DropTable(
                name: "ProductNegotiationRevisions");

            migrationBuilder.DropTable(
                name: "ProductNegotiations");

            migrationBuilder.DropIndex(
                name: "IX_Rfqs_AwardedOfferId",
                table: "Rfqs");

            migrationBuilder.DropIndex(
                name: "IX_Deals_ProductNegotiationId",
                table: "Deals");

            migrationBuilder.DropIndex(
                name: "IX_CatalogProducts_CategoryId",
                table: "CatalogProducts");

            migrationBuilder.DropColumn(
                name: "AwardRationale",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "AwardedAtUtc",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "AwardedByUserId",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "AwardedOfferId",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "CancellationReason",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "ReopenedAtUtc",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "ReopenedCount",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "ProductNegotiationId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "CatalogProducts");

            migrationBuilder.DropColumn(
                name: "ImageUrlsJson",
                table: "CatalogProducts");

            migrationBuilder.DropColumn(
                name: "PricingMode",
                table: "CatalogProducts");

            migrationBuilder.DropColumn(
                name: "Specifications",
                table: "CatalogProducts");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "CatalogProducts");

            migrationBuilder.AlterColumn<Guid>(
                name: "MaterialId",
                table: "CatalogProducts",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);
        }
    }
}
