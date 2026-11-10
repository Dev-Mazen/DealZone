using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDirectCatalogPurchasingAndRestrictedCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "DirectPurchaseId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CatalogProducts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MaterialId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SupplierCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Sku = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NameAr = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DescriptionAr = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DescriptionEn = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false, defaultValue: "EGP"),
                    AvailableQuantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MinimumOrderQuantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false, defaultValue: 1m),
                    DeliveryLeadTimeDays = table.Column<int>(type: "int", nullable: false, defaultValue: 7),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CatalogProducts_Companies_SupplierCompanyId",
                        column: x => x.SupplierCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CatalogProducts_Materials_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "Materials",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DirectPurchases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PurchaseNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    BuyerCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BuyerUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SupplierCompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CatalogProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false, defaultValue: "EGP"),
                    DeliveryLeadTimeDays = table.Column<int>(type: "int", nullable: false),
                    EstimatedDeliveryDateUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeliveryAddress = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ProductSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DirectPurchases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DirectPurchases_CatalogProducts_CatalogProductId",
                        column: x => x.CatalogProductId,
                        principalTable: "CatalogProducts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DirectPurchases_Companies_BuyerCompanyId",
                        column: x => x.BuyerCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DirectPurchases_Companies_SupplierCompanyId",
                        column: x => x.SupplierCompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DirectPurchases_Users_BuyerUserId",
                        column: x => x.BuyerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Deals_DirectPurchaseId",
                table: "Deals",
                column: "DirectPurchaseId",
                unique: true,
                filter: "[DirectPurchaseId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogProducts_IsActive_IsArchived",
                table: "CatalogProducts",
                columns: new[] { "IsActive", "IsArchived" });

            migrationBuilder.CreateIndex(
                name: "IX_CatalogProducts_MaterialId",
                table: "CatalogProducts",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogProducts_Sku",
                table: "CatalogProducts",
                column: "Sku");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogProducts_SupplierCompanyId",
                table: "CatalogProducts",
                column: "SupplierCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_DirectPurchases_BuyerCompanyId",
                table: "DirectPurchases",
                column: "BuyerCompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_DirectPurchases_BuyerUserId",
                table: "DirectPurchases",
                column: "BuyerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DirectPurchases_CatalogProductId",
                table: "DirectPurchases",
                column: "CatalogProductId");

            migrationBuilder.CreateIndex(
                name: "IX_DirectPurchases_PurchaseNumber",
                table: "DirectPurchases",
                column: "PurchaseNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DirectPurchases_Status",
                table: "DirectPurchases",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_DirectPurchases_SupplierCompanyId",
                table: "DirectPurchases",
                column: "SupplierCompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Deals_DirectPurchases_DirectPurchaseId",
                table: "Deals",
                column: "DirectPurchaseId",
                principalTable: "DirectPurchases",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Deals_DirectPurchases_DirectPurchaseId",
                table: "Deals");

            migrationBuilder.DropTable(
                name: "DirectPurchases");

            migrationBuilder.DropTable(
                name: "CatalogProducts");

            migrationBuilder.DropIndex(
                name: "IX_Deals_DirectPurchaseId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "DirectPurchaseId",
                table: "Deals");
        }
    }
}
