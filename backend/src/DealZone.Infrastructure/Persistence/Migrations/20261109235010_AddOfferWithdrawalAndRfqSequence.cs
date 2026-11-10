using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOfferWithdrawalAndRfqSequence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "RfqNumberSequence",
                startValue: 1000L);

            migrationBuilder.AddColumn<string>(
                name: "WithdrawalReason",
                table: "Offers",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "WithdrawnAtUtc",
                table: "Offers",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "WithdrawnByUserId",
                table: "Offers",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WithdrawalReason",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "WithdrawnAtUtc",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "WithdrawnByUserId",
                table: "Offers");

            migrationBuilder.DropSequence(
                name: "RfqNumberSequence");
        }
    }
}
