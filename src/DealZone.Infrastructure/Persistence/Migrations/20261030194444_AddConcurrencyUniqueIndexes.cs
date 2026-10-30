using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddConcurrencyUniqueIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Deals_RfqId",
                table: "Deals");

            migrationBuilder.CreateIndex(
                name: "IX_Offers_RfqId",
                table: "Offers",
                column: "RfqId",
                unique: true,
                filter: "[Status] = 2");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_RfqId",
                table: "Deals",
                column: "RfqId",
                unique: true,
                filter: "[RfqId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Offers_RfqId",
                table: "Offers");

            migrationBuilder.DropIndex(
                name: "IX_Deals_RfqId",
                table: "Deals");

            migrationBuilder.CreateIndex(
                name: "IX_Deals_RfqId",
                table: "Deals",
                column: "RfqId");
        }
    }
}
