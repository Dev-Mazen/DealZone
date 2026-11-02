using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOffersAndNegotiation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "AcceptedAtUtc",
                table: "Offers",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AcceptedByUserId",
                table: "Offers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChangeSummary",
                table: "Offers",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "RejectedAtUtc",
                table: "Offers",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RejectedByUserId",
                table: "Offers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Offers",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptedAtUtc",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "AcceptedByUserId",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "ChangeSummary",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "RejectedAtUtc",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "RejectedByUserId",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Offers");
        }
    }
}
