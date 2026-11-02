using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Admin.DTOs;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Companies.DTOs;
using DealZone.Application.Verification.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Identity;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DealZone.IntegrationTests.Endpoints;

public class AdminVerificationIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private static readonly byte[] ValidPdfBytes = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37, 0x0A, 0x25];
    private static readonly byte[] ValidJpegBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46];

    private static async Task<string> RegisterAndLoginAsync(HttpClient client, string email)
    {
        var reg = new RegisterRequest(email, "StrongPassword2026!", "Test User", "+201099988877");
        await client.PostAsJsonAsync("/api/v1/auth/register", reg);

        var confirm = DevelopmentEmailService.SentEmails.Last(e => e.Email == email && e.Purpose == "EmailConfirmation");
        await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(email, confirm.Token));

        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "StrongPassword2026!"));
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return auth!.AccessToken;
    }

    private static async Task<string> CreateAdminAndLoginAsync(DealZoneWebApplicationFactory factory, HttpClient client, string email)
    {
        // 1. Register and confirm
        var reg = new RegisterRequest(email, "AdminPassword2026!", "Admin User", "+201011122233");
        await client.PostAsJsonAsync("/api/v1/auth/register", reg);

        var confirm = DevelopmentEmailService.SentEmails.Last(e => e.Email == email && e.Purpose == "EmailConfirmation");
        await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(email, confirm.Token));

        // 2. Set IsSystemAdmin = true in database
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var user = await db.Users.FirstAsync(u => u.Email == email);
            user.IsSystemAdmin = true;
            await db.SaveChangesAsync();
        }

        // 3. Login to get token with SystemAdmin role claim
        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "AdminPassword2026!"));
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return auth!.AccessToken;
    }

    private static async Task<CompanyResponse> CreateCompanyAndSubmitForReviewAsync(HttpClient client, string crn, string taxId)
    {
        var createRequest = new CreateCompanyRequest(
            LegalName: $"Alpha Industry {crn} SAE",
            TradeName: $"Alpha {crn}",
            IndustrySector: "Metals",
            City: "Suez",
            Governorate: "Suez",
            Description: "Steel and iron fabrication",
            Website: "https://alpha.eg",
            TaxIdNumber: taxId,
            CommercialRegistrationNumber: crn,
            CorporateEmail: $"contact@{crn}.eg",
            CorporatePhone: "+2062330040",
            AddressLine1: "Attaqa Free Zone, Area C",
            AddressLine2: null,
            PostalCode: "43511");

        var createRes = await client.PostAsJsonAsync("/api/v1/companies", createRequest);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var company = await createRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);

        // Upload CommercialRegister
        using var form1 = new MultipartFormDataContent();
        var pdfContent = new ByteArrayContent(ValidPdfBytes);
        pdfContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        form1.Add(pdfContent, "file", "cr.pdf");
        form1.Add(new StringContent("1"), "documentType");
        var res1 = await client.PostAsync("/api/v1/companies/me/verification-documents", form1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // Upload TaxCard
        using var form2 = new MultipartFormDataContent();
        var jpgContent = new ByteArrayContent(ValidJpegBytes);
        jpgContent.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        form2.Add(jpgContent, "file", "tax.jpg");
        form2.Add(new StringContent("2"), "documentType");
        var res2 = await client.PostAsync("/api/v1/companies/me/verification-documents", form2);
        Assert.Equal(HttpStatusCode.Created, res2.StatusCode);

        // Submit
        var submitRes = await client.PostAsync("/api/v1/companies/me/verification/submit", null);
        Assert.Equal(HttpStatusCode.NoContent, submitRes.StatusCode);

        return company!;
    }

    [Fact]
    public async Task AdminEndpoint_Unauthenticated_ShouldReturnUnauthorized()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/admin/verification/pending");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AdminEndpoint_NonAdminUser_ShouldReturnForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var token = await RegisterAndLoginAsync(client, "regular@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/v1/admin/verification/pending");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_ApproveCompany_EnablesCommercialActivities()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        // 1. Create company owner and submit
        var ownerToken = await RegisterAndLoginAsync(client, "owner.approve@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        var company = await CreateCompanyAndSubmitForReviewAsync(client, "CR-2001", "TAX-2001");

        // Verify company cannot perform commercial activities initially
        var meResBefore = await client.GetAsync("/api/v1/companies/me");
        var meBefore = await meResBefore.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);
        Assert.False(meBefore!.CanPerformCommercialActivities);

        // 2. Login as admin
        var adminToken = await CreateAdminAndLoginAsync(factory, client, "admin1@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        // 3. Pending list should include this company
        var pendingRes = await client.GetAsync("/api/v1/admin/verification/pending");
        Assert.Equal(HttpStatusCode.OK, pendingRes.StatusCode);
        var pendingList = await pendingRes.Content.ReadFromJsonAsync<List<PendingCompanyDto>>(JsonOptions);
        Assert.NotNull(pendingList);
        Assert.Contains(pendingList, p => p.CompanyId == company.Id);

        // 4. Admin approves
        var approveRes = await client.PostAsync($"/api/v1/admin/verification/{company.Id}/approve", null);
        Assert.Equal(HttpStatusCode.NoContent, approveRes.StatusCode);

        // 5. Verification details check
        var detailsRes = await client.GetAsync($"/api/v1/admin/verification/{company.Id}");
        Assert.Equal(HttpStatusCode.OK, detailsRes.StatusCode);
        var details = await detailsRes.Content.ReadFromJsonAsync<CompanyVerificationDetailDto>(JsonOptions);
        Assert.NotNull(details);
        Assert.Equal("Approved", details.VerificationStatus);
        Assert.Single(details.DecisionHistory);
        Assert.Equal("Approved", details.DecisionHistory[0].Decision);

        // 6. Verify owner now has CanPerformCommercialActivities == true
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        var meResAfter = await client.GetAsync("/api/v1/companies/me");
        var meAfter = await meResAfter.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);
        Assert.True(meAfter!.CanPerformCommercialActivities);
        Assert.Equal("Approved", meAfter.VerificationStatus);

        // 7. Verification email sent to owner
        Assert.Contains(DevelopmentEmailService.SentEmails,
            e => e.Email == "owner.approve@dealzone.eg" && e.Purpose == "VerificationDecision:Approved");
    }

    [Fact]
    public async Task Admin_RequestChanges_AllowsCompanyToResubmit()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        // 1. Company submits
        var ownerToken = await RegisterAndLoginAsync(client, "owner.changes@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        var company = await CreateCompanyAndSubmitForReviewAsync(client, "CR-3001", "TAX-3001");

        // 2. Admin requests changes
        var adminToken = await CreateAdminAndLoginAsync(factory, client, "admin2@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var requestBody = new RequestChangesRequest("Commercial register is blurred and unreadable. Please re-upload.");
        var changeRes = await client.PostAsJsonAsync($"/api/v1/admin/verification/{company.Id}/request-changes", requestBody);
        Assert.Equal(HttpStatusCode.NoContent, changeRes.StatusCode);

        // 3. Owner checks status: ChangesRequired
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        var statusRes = await client.GetAsync("/api/v1/companies/me/verification");
        var status = await statusRes.Content.ReadFromJsonAsync<VerificationStatusResponse>(JsonOptions);
        Assert.Equal("ChangesRequired", status!.CompanyVerificationStatus);

        // 4. Owner re-uploads CommercialRegister
        using var form = new MultipartFormDataContent();
        var pdfContent = new ByteArrayContent(ValidPdfBytes);
        pdfContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        form.Add(pdfContent, "file", "cr_clean.pdf");
        form.Add(new StringContent("1"), "documentType");
        var uploadRes = await client.PostAsync("/api/v1/companies/me/verification-documents", form);
        Assert.Equal(HttpStatusCode.Created, uploadRes.StatusCode);

        // 5. Owner re-submits
        var resubmitRes = await client.PostAsync("/api/v1/companies/me/verification/submit", null);
        Assert.Equal(HttpStatusCode.NoContent, resubmitRes.StatusCode);

        // Status is now UnderReview again
        var statusRes2 = await client.GetAsync("/api/v1/companies/me/verification");
        var status2 = await statusRes2.Content.ReadFromJsonAsync<VerificationStatusResponse>(JsonOptions);
        Assert.Equal("UnderReview", status2!.CompanyVerificationStatus);
    }

    [Fact]
    public async Task Admin_RejectCompany_TransitionsStatusToRejected()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var ownerToken = await RegisterAndLoginAsync(client, "owner.reject@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        var company = await CreateCompanyAndSubmitForReviewAsync(client, "CR-4001", "TAX-4001");

        var adminToken = await CreateAdminAndLoginAsync(factory, client, "admin3@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var rejectRequest = new RejectCompanyRequest("Fraudulent registration documents identified.");
        var rejectRes = await client.PostAsJsonAsync($"/api/v1/admin/verification/{company.Id}/reject", rejectRequest);
        Assert.Equal(HttpStatusCode.NoContent, rejectRes.StatusCode);

        // Verify status is Rejected
        var detailsRes = await client.GetAsync($"/api/v1/admin/verification/{company.Id}");
        var details = await detailsRes.Content.ReadFromJsonAsync<CompanyVerificationDetailDto>(JsonOptions);
        Assert.Equal("Rejected", details!.VerificationStatus);
        Assert.Equal("Fraudulent registration documents identified.", details.RejectionReason);

        // Notification email sent
        Assert.Contains(DevelopmentEmailService.SentEmails,
            e => e.Email == "owner.reject@dealzone.eg" && e.Purpose == "VerificationDecision:Rejected");
    }

    [Fact]
    public async Task Admin_DownloadDocument_StreamsFileContentDirectly()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var ownerToken = await RegisterAndLoginAsync(client, "owner.stream@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        var company = await CreateCompanyAndSubmitForReviewAsync(client, "CR-5001", "TAX-5001");

        var adminToken = await CreateAdminAndLoginAsync(factory, client, "admin4@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        // Get document ID
        var detailsRes = await client.GetAsync($"/api/v1/admin/verification/{company.Id}");
        var details = await detailsRes.Content.ReadFromJsonAsync<CompanyVerificationDetailDto>(JsonOptions);
        var doc = details!.Documents.First(d => d.DocumentType == "CommercialRegister");

        // Download document
        var downloadRes = await client.GetAsync($"/api/v1/admin/verification/{company.Id}/documents/{doc.Id}/download");
        Assert.Equal(HttpStatusCode.OK, downloadRes.StatusCode);
        Assert.Equal("application/pdf", downloadRes.Content.Headers.ContentType?.MediaType);

        var downloadedBytes = await downloadRes.Content.ReadAsByteArrayAsync();
        Assert.Equal(ValidPdfBytes, downloadedBytes);
    }
}
