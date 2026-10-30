using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealZone.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVerificationWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UploadedByUserId",
                table: "VerificationDocuments",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "VerificationDecisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReviewedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Decision = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    DecidedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VerificationDecisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VerificationDecisions_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VerificationDecisions_Users_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VerificationDocuments_UploadedByUserId",
                table: "VerificationDocuments",
                column: "UploadedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_VerificationDecisions_CompanyId",
                table: "VerificationDecisions",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_VerificationDecisions_ReviewedByUserId",
                table: "VerificationDecisions",
                column: "ReviewedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_VerificationDocuments_Users_UploadedByUserId",
                table: "VerificationDocuments",
                column: "UploadedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VerificationDocuments_Users_UploadedByUserId",
                table: "VerificationDocuments");

            migrationBuilder.DropTable(
                name: "VerificationDecisions");

            migrationBuilder.DropIndex(
                name: "IX_VerificationDocuments_UploadedByUserId",
                table: "VerificationDocuments");

            migrationBuilder.DropColumn(
                name: "UploadedByUserId",
                table: "VerificationDocuments");
        }
    }
}
