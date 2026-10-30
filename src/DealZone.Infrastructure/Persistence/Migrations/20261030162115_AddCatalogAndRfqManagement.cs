using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogAndRfqManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Rfqs",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "EGP");

            migrationBuilder.AddColumn<string>(
                name: "DeliveryCity",
                table: "Rfqs",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Rfqs",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TargetBudget",
                table: "Rfqs",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "MaterialId",
                table: "RfqItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "RfqItems",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UnitOfMeasureId",
                table: "RfqItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "MaterialCategories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "UnitsOfMeasure",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    NameAr = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NameEn = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SymbolAr = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SymbolEn = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitsOfMeasure", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Materials",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DefaultUnitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    NameAr = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DescriptionAr = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DescriptionEn = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    AttributesJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    IsArchived = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LastModifiedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Materials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Materials_MaterialCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "MaterialCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Materials_UnitsOfMeasure_DefaultUnitId",
                        column: x => x.DefaultUnitId,
                        principalTable: "UnitsOfMeasure",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Rfqs_DeliveryGovernorate_DeliveryCity",
                table: "Rfqs",
                columns: new[] { "DeliveryGovernorate", "DeliveryCity" });

            migrationBuilder.CreateIndex(
                name: "IX_RfqItems_MaterialId",
                table: "RfqItems",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_RfqItems_UnitOfMeasureId",
                table: "RfqItems",
                column: "UnitOfMeasureId");

            migrationBuilder.CreateIndex(
                name: "IX_Materials_CategoryId",
                table: "Materials",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Materials_Code",
                table: "Materials",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Materials_DefaultUnitId",
                table: "Materials",
                column: "DefaultUnitId");

            migrationBuilder.CreateIndex(
                name: "IX_Materials_IsActive_IsArchived",
                table: "Materials",
                columns: new[] { "IsActive", "IsArchived" });

            migrationBuilder.CreateIndex(
                name: "IX_UnitsOfMeasure_Code",
                table: "UnitsOfMeasure",
                column: "Code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_RfqItems_Materials_MaterialId",
                table: "RfqItems",
                column: "MaterialId",
                principalTable: "Materials",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RfqItems_UnitsOfMeasure_UnitOfMeasureId",
                table: "RfqItems",
                column: "UnitOfMeasureId",
                principalTable: "UnitsOfMeasure",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RfqItems_Materials_MaterialId",
                table: "RfqItems");

            migrationBuilder.DropForeignKey(
                name: "FK_RfqItems_UnitsOfMeasure_UnitOfMeasureId",
                table: "RfqItems");

            migrationBuilder.DropTable(
                name: "Materials");

            migrationBuilder.DropTable(
                name: "UnitsOfMeasure");

            migrationBuilder.DropIndex(
                name: "IX_Rfqs_DeliveryGovernorate_DeliveryCity",
                table: "Rfqs");

            migrationBuilder.DropIndex(
                name: "IX_RfqItems_MaterialId",
                table: "RfqItems");

            migrationBuilder.DropIndex(
                name: "IX_RfqItems_UnitOfMeasureId",
                table: "RfqItems");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "DeliveryCity",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "TargetBudget",
                table: "Rfqs");

            migrationBuilder.DropColumn(
                name: "MaterialId",
                table: "RfqItems");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "RfqItems");

            migrationBuilder.DropColumn(
                name: "UnitOfMeasureId",
                table: "RfqItems");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "MaterialCategories");
        }
    }
}
