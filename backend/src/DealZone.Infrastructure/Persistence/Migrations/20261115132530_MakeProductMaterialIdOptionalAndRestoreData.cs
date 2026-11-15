using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MakeProductMaterialIdOptionalAndRestoreData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "MaterialId",
                table: "CatalogProducts",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM CatalogProducts WHERE Id = '6F6470C1-3C2F-4355-8B12-1504211AA560')
                BEGIN
                    UPDATE CatalogProducts SET MaterialId = NULL WHERE Id = '6F6470C1-3C2F-4355-8B12-1504211AA560';
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DECLARE @DefaultMaterialId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM Materials);
                IF @DefaultMaterialId IS NOT NULL
                BEGIN
                    UPDATE CatalogProducts SET MaterialId = @DefaultMaterialId WHERE MaterialId IS NULL;
                END
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
        }
    }
}
