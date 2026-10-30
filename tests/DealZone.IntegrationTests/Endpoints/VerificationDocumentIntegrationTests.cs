using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Companies.DTOs;
using DealZone.Application.Verification.DTOs;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;

namespace DealZone.IntegrationTests.Endpoints;

public class VerificationDocumentIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private static async Task<string> RegisterAndLoginAsync(HttpClient client, string email)
    {
        var reg = new RegisterRequest(email, "CompanyOwnerPassword2026!", "Owner User", "+201099988877");
        await client.PostAsJsonAsync("/api/v1/auth/register", reg);

        var confirm = DevelopmentEmailService.SentEmails.Last(e => e.Email == email && e.Purpose == "EmailConfirmation");
        await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(email, confirm.Token));

        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "CompanyOwnerPassword2026!"));
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return auth!.AccessToken;
    }

    private static async Task CreateCompanyAsync(HttpClient client, string taxId, string crn)
    {
        var createRequest = new CreateCompanyRequest(
            LegalName: "Test Chemicals SAE",
            TradeName: "Test Chem",
            IndustrySector: "Chemicals",
            City: "Alexandria",
            Governorate: "Alexandria",
            Description: "Raw chemical manufacturer",
            Website: "https://testchem.eg",
            TaxIdNumber: taxId,
            CommercialRegistrationNumber: crn,
            CorporateEmail: "info@testchem.eg",
            CorporatePhone: "+2033700100",
            AddressLine1: "Industrial Zone B4",
            AddressLine2: null,
            PostalCode: "21500");

        var response = await client.PostAsJsonAsync("/api/v1/companies", createRequest);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private static MultipartFormDataContent CreateFileContent(byte[] bytes, string fileName, string contentType, int documentType)
    {
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(bytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(fileContent, "file", fileName);
        content.Add(new StringContent(documentType.ToString()), "documentType");
        return content;
    }

    // Valid file signatures:
    // PDF: %PDF (0x25, 0x50, 0x44, 0x46)
    private static readonly byte[] ValidPdfBytes = [0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37, 0x0A, 0x25];
    // JPEG: 0xFF, 0xD8, 0xFF
    private static readonly byte[] ValidJpegBytes = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46];
    // Invalid magic bytes
    private static readonly byte[] InvalidBytes = [0x50, 0x4B, 0x03, 0x04, 0x00, 0x00]; // ZIP header

    [Fact]
    public async Task UploadDocument_Unauthenticated_ShouldReturnUnauthorized()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        using var form = CreateFileContent(ValidPdfBytes, "cr.pdf", "application/pdf", 1);
        var response = await client.PostAsync("/api/v1/companies/me/verification-documents", form);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UploadDocument_ValidPdf_ShouldSucceedAndPersist()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var token = await RegisterAndLoginAsync(client, "docs1@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        await CreateCompanyAsync(client, "111-222-333", "CR-1001");

        // Upload CommercialRegister (type 1)
        using var form = CreateFileContent(ValidPdfBytes, "cr.pdf", "application/pdf", 1);
        var uploadRes = await client.PostAsync("/api/v1/companies/me/verification-documents", form);
        Assert.Equal(HttpStatusCode.Created, uploadRes.StatusCode);

        var uploadData = await uploadRes.Content.ReadFromJsonAsync<UploadDocumentResponse>(JsonOptions);
        Assert.NotNull(uploadData);
        Assert.Equal("CommercialRegister", uploadData.DocumentType);
        Assert.Equal("cr.pdf", uploadData.FileName);
        Assert.Equal("Pending", uploadData.Status);

        // Verify status endpoint reflects uploaded document
        var statusRes = await client.GetAsync("/api/v1/companies/me/verification");
        Assert.Equal(HttpStatusCode.OK, statusRes.StatusCode);
        var statusData = await statusRes.Content.ReadFromJsonAsync<VerificationStatusResponse>(JsonOptions);
        Assert.NotNull(statusData);
        Assert.Equal("Pending", statusData.CompanyVerificationStatus);
        Assert.Single(statusData.Documents);
        Assert.Equal("CommercialRegister", statusData.Documents[0].DocumentType);
    }

    [Fact]
    public async Task UploadDocument_InvalidFileSignature_ShouldReturnBadRequest()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var token = await RegisterAndLoginAsync(client, "docs2@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        await CreateCompanyAsync(client, "111-222-334", "CR-1002");

        // Disguised file: .pdf extension with ZIP magic bytes
        using var form = CreateFileContent(InvalidBytes, "fake.pdf", "application/pdf", 1);
        var response = await client.PostAsync("/api/v1/companies/me/verification-documents", form);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UploadDocument_DisallowedExtension_ShouldReturnBadRequest()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var token = await RegisterAndLoginAsync(client, "docs3@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        await CreateCompanyAsync(client, "111-222-335", "CR-1003");

        using var form = CreateFileContent(ValidPdfBytes, "script.exe", "application/octet-stream", 1);
        var response = await client.PostAsync("/api/v1/companies/me/verification-documents", form);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DeleteDocument_InPendingStatus_ShouldSucceed()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var token = await RegisterAndLoginAsync(client, "docs4@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        await CreateCompanyAsync(client, "111-222-336", "CR-1004");

        // Upload
        using var form = CreateFileContent(ValidPdfBytes, "cr.pdf", "application/pdf", 1);
        var uploadRes = await client.PostAsync("/api/v1/companies/me/verification-documents", form);
        var uploadData = await uploadRes.Content.ReadFromJsonAsync<UploadDocumentResponse>(JsonOptions);

        // Delete
        var deleteRes = await client.DeleteAsync($"/api/v1/companies/me/verification-documents/{uploadData!.DocumentId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);

        // Verify status has 0 documents
        var statusRes = await client.GetAsync("/api/v1/companies/me/verification");
        var statusData = await statusRes.Content.ReadFromJsonAsync<VerificationStatusResponse>(JsonOptions);
        Assert.Empty(statusData!.Documents);
    }

    [Fact]
    public async Task SubmitForReview_WithoutRequiredDocuments_ShouldReturnBadRequest()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var token = await RegisterAndLoginAsync(client, "docs5@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        await CreateCompanyAsync(client, "111-222-337", "CR-1005");

        // Submit without any documents
        var response = await client.PostAsync("/api/v1/companies/me/verification/submit", null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CompleteSubmissionFlow_TransitionsToUnderReview_AndLocksModifications()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var token = await RegisterAndLoginAsync(client, "docs6@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        await CreateCompanyAsync(client, "111-222-338", "CR-1006");

        // 1. Upload CommercialRegister (type 1)
        using var form1 = CreateFileContent(ValidPdfBytes, "cr.pdf", "application/pdf", 1);
        var res1 = await client.PostAsync("/api/v1/companies/me/verification-documents", form1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);
        var doc1 = await res1.Content.ReadFromJsonAsync<UploadDocumentResponse>(JsonOptions);

        // 2. Upload TaxCard (type 2)
        using var form2 = CreateFileContent(ValidJpegBytes, "tax.jpg", "image/jpeg", 2);
        var res2 = await client.PostAsync("/api/v1/companies/me/verification-documents", form2);
        Assert.Equal(HttpStatusCode.Created, res2.StatusCode);

        // 3. Submit for review
        var submitRes = await client.PostAsync("/api/v1/companies/me/verification/submit", null);
        Assert.Equal(HttpStatusCode.NoContent, submitRes.StatusCode);

        // 4. Verify company status is UnderReview
        var statusRes = await client.GetAsync("/api/v1/companies/me/verification");
        var status = await statusRes.Content.ReadFromJsonAsync<VerificationStatusResponse>(JsonOptions);
        Assert.Equal("UnderReview", status!.CompanyVerificationStatus);

        // 5. While UnderReview, document upload is rejected with Conflict
        using var form3 = CreateFileContent(ValidPdfBytes, "quality.pdf", "application/pdf", 4);
        var uploadBlocked = await client.PostAsync("/api/v1/companies/me/verification-documents", form3);
        Assert.Equal(HttpStatusCode.Conflict, uploadBlocked.StatusCode);

        // 6. While UnderReview, document deletion is rejected with Conflict
        var deleteBlocked = await client.DeleteAsync($"/api/v1/companies/me/verification-documents/{doc1!.DocumentId}");
        Assert.Equal(HttpStatusCode.Conflict, deleteBlocked.StatusCode);
    }
}

