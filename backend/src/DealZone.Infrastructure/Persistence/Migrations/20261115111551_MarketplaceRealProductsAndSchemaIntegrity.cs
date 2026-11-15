using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MarketplaceRealProductsAndSchemaIntegrity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Unit",
                table: "CatalogProducts");

            migrationBuilder.AddColumn<string>(
                name: "ClientRequestId",
                table: "DirectPurchases",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Subtotal",
                table: "DirectPurchases",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "VatAmount",
                table: "DirectPurchases",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "VatRate",
                table: "DirectPurchases",
                type: "decimal(5,4)",
                precision: 5,
                scale: 4,
                nullable: false,
                defaultValue: 0.14m);

            // Data repair for existing dev data before altering MaterialId to NOT NULL:
            migrationBuilder.Sql(@"
                DECLARE @DefaultMaterialId uniqueidentifier = (SELECT TOP 1 Id FROM Materials WHERE Code = 'STEEL-REBAR-B500D');
                IF @DefaultMaterialId IS NULL
                    SET @DefaultMaterialId = (SELECT TOP 1 Id FROM Materials);
                IF @DefaultMaterialId IS NOT NULL
                    EXEC(N'UPDATE CatalogProducts SET MaterialId = ''' + CAST(@DefaultMaterialId AS nvarchar(36)) + ''' WHERE MaterialId IS NULL');
            ");

            migrationBuilder.AlterColumn<Guid>(
                name: "MaterialId",
                table: "CatalogProducts",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UnitId",
                table: "CatalogProducts",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            // Data repair: Populate UnitId with ton unit before adding foreign key constraint
            migrationBuilder.Sql(@"
                DECLARE @DefaultUnitId uniqueidentifier = (SELECT TOP 1 Id FROM UnitsOfMeasure WHERE Code = 'ton');
                IF @DefaultUnitId IS NULL
                    SET @DefaultUnitId = (SELECT TOP 1 Id FROM UnitsOfMeasure);
                IF @DefaultUnitId IS NOT NULL
                    EXEC(N'UPDATE CatalogProducts SET UnitId = ''' + CAST(@DefaultUnitId AS nvarchar(36)) + ''' WHERE UnitId IS NULL OR UnitId = ''00000000-0000-0000-0000-000000000000''');

                -- Backfill existing DirectPurchases subtotal and VAT
                EXEC(N'UPDATE DirectPurchases
                SET VatRate = 0.14,
                    Subtotal = ROUND(TotalPrice / 1.14, 2),
                    VatAmount = ROUND(TotalPrice - (TotalPrice / 1.14), 2)
                WHERE Subtotal = 0 AND TotalPrice > 0');
            ");

            migrationBuilder.CreateIndex(
                name: "IX_DirectPurchases_BuyerCompanyId_ClientRequestId",
                table: "DirectPurchases",
                columns: new[] { "BuyerCompanyId", "ClientRequestId" },
                unique: true,
                filter: "[ClientRequestId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_CatalogProducts_IsActive_MaterialId_SupplierCompanyId",
                table: "CatalogProducts",
                columns: new[] { "IsActive", "MaterialId", "SupplierCompanyId" });

            migrationBuilder.CreateIndex(
                name: "IX_CatalogProducts_UnitId",
                table: "CatalogProducts",
                column: "UnitId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_CatalogProducts_MinOrderQty",
                table: "CatalogProducts",
                sql: "[MinimumOrderQuantity] > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_CatalogProducts_UnitPrice",
                table: "CatalogProducts",
                sql: "[UnitPrice] IS NULL OR [UnitPrice] > 0");

            migrationBuilder.AddForeignKey(
                name: "FK_CatalogProducts_UnitsOfMeasure_UnitId",
                table: "CatalogProducts",
                column: "UnitId",
                principalTable: "UnitsOfMeasure",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CatalogProducts_UnitsOfMeasure_UnitId",
                table: "CatalogProducts");

            migrationBuilder.DropIndex(
                name: "IX_DirectPurchases_BuyerCompanyId_ClientRequestId",
                table: "DirectPurchases");

            migrationBuilder.DropIndex(
                name: "IX_CatalogProducts_IsActive_MaterialId_SupplierCompanyId",
                table: "CatalogProducts");

            migrationBuilder.DropIndex(
                name: "IX_CatalogProducts_UnitId",
                table: "CatalogProducts");

            migrationBuilder.DropCheckConstraint(
                name: "CK_CatalogProducts_MinOrderQty",
                table: "CatalogProducts");

            migrationBuilder.DropCheckConstraint(
                name: "CK_CatalogProducts_UnitPrice",
                table: "CatalogProducts");

            migrationBuilder.DropColumn(
                name: "ClientRequestId",
                table: "DirectPurchases");

            migrationBuilder.DropColumn(
                name: "Subtotal",
                table: "DirectPurchases");

            migrationBuilder.DropColumn(
                name: "VatAmount",
                table: "DirectPurchases");

            migrationBuilder.DropColumn(
                name: "VatRate",
                table: "DirectPurchases");

            migrationBuilder.DropColumn(
                name: "UnitId",
                table: "CatalogProducts");

            migrationBuilder.AlterColumn<Guid>(
                name: "MaterialId",
                table: "CatalogProducts",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "CatalogProducts",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "ton");
        }
    }
}
