using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CompanyTypeStrictRequiredAndDataCorrection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Data correction: Company 20000000-0000-0000-0000-000000000006 was converted from Both to Supplier,
            // but its commercial trading profile consists of RFQs and Buyer Deals (0 catalog products).
            // We clean up its unaccepted demo offer OFF-2026-00102 and convert it to Buyer.
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM [OfferItems] WHERE [OfferId] = '00DACFE9-F431-4836-A287-4CEBE296BEEB')
                BEGIN
                    DELETE FROM [OfferItems] WHERE [OfferId] = '00DACFE9-F431-4836-A287-4CEBE296BEEB';
                END

                IF EXISTS (SELECT 1 FROM [Offers] WHERE [Id] = '00DACFE9-F431-4836-A287-4CEBE296BEEB')
                BEGIN
                    DELETE FROM [Offers] WHERE [Id] = '00DACFE9-F431-4836-A287-4CEBE296BEEB';
                END

                IF EXISTS (SELECT 1 FROM [Companies] WHERE [Id] = '20000000-0000-0000-0000-000000000006')
                BEGIN
                    UPDATE [Companies] SET [CompanyType] = 'Buyer' WHERE [Id] = '20000000-0000-0000-0000-000000000006';
                END
            ");

            migrationBuilder.AlterColumn<string>(
                name: "CompanyType",
                table: "Companies",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Buyer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "CompanyType",
                table: "Companies",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Buyer",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM [Companies] WHERE [Id] = '20000000-0000-0000-0000-000000000006')
                BEGIN
                    UPDATE [Companies] SET [CompanyType] = 'Supplier' WHERE [Id] = '20000000-0000-0000-0000-000000000006';
                END
            ");
        }
    }
}
