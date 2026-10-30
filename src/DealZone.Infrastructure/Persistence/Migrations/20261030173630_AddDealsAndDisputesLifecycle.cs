using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDealsAndDisputesLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CancellationRequestReason",
                table: "Deals",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CancellationRequestedAtUtc",
                table: "Deals",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CancellationRequestedByCompanyId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CancellationRequestedByUserId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CancelledByCompanyId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CancelledByUserId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CommercialTermsSnapshotJson",
                table: "Deals",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "CompletedByUserId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ConfirmedByBuyerAtUtc",
                table: "Deals",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ConfirmedByBuyerUserId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ConfirmedBySupplierAtUtc",
                table: "Deals",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ConfirmedBySupplierUserId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryTerms",
                table: "Deals",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EstimatedDeliveryDateUtc",
                table: "Deals",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OfferRevisionNumber",
                table: "Deals",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PreviousStatus",
                table: "Deals",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "StartedAtUtc",
                table: "Deals",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "StartedByUserId",
                table: "Deals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Category",
                table: "DealDisputes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ResolutionAction",
                table: "DealDisputes",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DealDisputes_Status",
                table: "DealDisputes",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DealDisputes_Status",
                table: "DealDisputes");

            migrationBuilder.DropColumn(
                name: "CancellationRequestReason",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "CancellationRequestedAtUtc",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "CancellationRequestedByCompanyId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "CancellationRequestedByUserId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "CancelledByCompanyId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "CancelledByUserId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "CommercialTermsSnapshotJson",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "CompletedByUserId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "ConfirmedByBuyerAtUtc",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "ConfirmedByBuyerUserId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "ConfirmedBySupplierAtUtc",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "ConfirmedBySupplierUserId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "DeliveryTerms",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "EstimatedDeliveryDateUtc",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "OfferRevisionNumber",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "PreviousStatus",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "StartedAtUtc",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "StartedByUserId",
                table: "Deals");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "DealDisputes");

            migrationBuilder.DropColumn(
                name: "ResolutionAction",
                table: "DealDisputes");
        }
    }
}
