using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CompanyTypeBuyerOrSupplierOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Update any existing legacy "Both" records to "Supplier"
            migrationBuilder.Sql("UPDATE [Companies] SET [CompanyType] = 'Supplier' WHERE [CompanyType] = 'Both';");

            // 2. Alter column default
            migrationBuilder.AlterColumn<string>(
                name: "CompanyType",
                table: "Companies",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Buyer",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Both");

            // 3. Add CHECK constraint: only 'Buyer' and 'Supplier' allowed
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Companies_CompanyType')
                BEGIN
                    ALTER TABLE [Companies] ADD CONSTRAINT [CK_Companies_CompanyType] CHECK ([CompanyType] IN ('Buyer', 'Supplier'));
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Companies_CompanyType')
                BEGIN
                    ALTER TABLE [Companies] DROP CONSTRAINT [CK_Companies_CompanyType];
                END
            ");

            migrationBuilder.AlterColumn<string>(
                name: "CompanyType",
                table: "Companies",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Both",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Buyer");
        }
    }
}
