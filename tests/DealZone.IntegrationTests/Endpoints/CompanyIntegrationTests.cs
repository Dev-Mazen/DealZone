using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Companies.DTOs;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;

namespace DealZone.IntegrationTests.Endpoints;

public class CompanyIntegrationTests
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

    [Fact]
    public async Task CompanyCreationAndPrivacySeparation_ShouldSucceed()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        var token = await RegisterAndLoginAsync(client, "ceo@nilechemicals.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // 1. Create company profile
        var createRequest = new CreateCompanyRequest(
            LegalName: "Nile Petrochemicals SAE",
            TradeName: "Nile Chem",
            IndustrySector: "Petrochemicals",
            City: "Cairo",
            Governorate: "Cairo",
            Description: "Manufacturer of industrial polymers",
            Website: "https://nilechem.eg",
            TaxIdNumber: "555-123-999",
            CommercialRegistrationNumber: "8881234",
            CorporateEmail: "info@nilechem.eg",
            CorporatePhone: "+2022700100",
            AddressLine1: "Plot 12, Industrial Area, 10th of Ramadan",
            AddressLine2: null,
            PostalCode: "44629");

        var createRes = await client.PostAsJsonAsync("/api/v1/companies", createRequest);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);

        var company = await createRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);
        Assert.NotNull(company);
        Assert.Equal("Nile Petrochemicals SAE", company.LegalName);
        Assert.Equal("Pending", company.VerificationStatus);
        Assert.False(company.CanPerformCommercialActivities); // Unverified cannot perform commercial operations

        // Invariant: CompanyResponse MUST NOT expose private contact/tax details
        var jsonRaw = await createRes.Content.ReadAsStringAsync();
        Assert.DoesNotContain("555-123-999", jsonRaw);
        Assert.DoesNotContain("8881234", jsonRaw);
        Assert.DoesNotContain("Plot 12, Industrial Area", jsonRaw);

        // 2. Fetch company profile via GET /api/v1/companies/me
        var getRes = await client.GetAsync("/api/v1/companies/me");
        Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);
        var fetchedCompany = await getRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);
        Assert.Equal(company.Id, fetchedCompany!.Id);
        Assert.Equal("Nile Chem", fetchedCompany.TradeName);

        // 3. Update permitted profile fields via PUT /api/v1/companies/me
        var updateRequest = new UpdateCompanyProfileRequest(
            TradeName: "Nile Chem Global",
            City: "10th of Ramadan",
            Governorate: "Sharqia",
            Description: "Updated industrial polymer supplier",
            Website: "https://global.nilechem.eg");

        var updateRes = await client.PutAsJsonAsync("/api/v1/companies/me", updateRequest);
        Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);

        var updatedCompany = await updateRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);
        Assert.Equal("Nile Chem Global", updatedCompany!.TradeName);
        Assert.Equal("Sharqia", updatedCompany.Governorate);

        // 4. Access private contact details via dedicated endpoint
        var contactRes = await client.GetAsync("/api/v1/companies/me/contact-details");
        Assert.Equal(HttpStatusCode.OK, contactRes.StatusCode);

        var contact = await contactRes.Content.ReadFromJsonAsync<CompanyContactDetailsResponse>(JsonOptions);
        Assert.NotNull(contact);
        Assert.Equal("555-123-999", contact.TaxIdNumber);
        Assert.Equal("8881234", contact.CommercialRegistrationNumber);
        Assert.Equal("Plot 12, Industrial Area, 10th of Ramadan", contact.AddressLine1);

        // 5. User cannot create a second company
        var duplicateCompanyRes = await client.PostAsJsonAsync("/api/v1/companies", createRequest);
        Assert.Equal(HttpStatusCode.Conflict, duplicateCompanyRes.StatusCode);
    }

    [Fact]
    public async Task CreateCompany_WithDuplicateTaxIdOrCRN_ShouldReturn409Conflict()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        // User 1 creates company
        var token1 = await RegisterAndLoginAsync(client, "user1@company.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);

        var comp1 = new CreateCompanyRequest(
            LegalName: "First Company Ltd",
            TradeName: "FirstCo",
            IndustrySector: "Metals",
            City: "Cairo",
            Governorate: "Cairo",
            Description: null,
            Website: null,
            TaxIdNumber: "TAX-999",
            CommercialRegistrationNumber: "CRN-999",
            CorporateEmail: "info@firstco.eg",
            CorporatePhone: "+2010000001",
            AddressLine1: "Address 1",
            AddressLine2: null,
            PostalCode: null);

        var res1 = await client.PostAsJsonAsync("/api/v1/companies", comp1);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);

        // User 2 attempts to create company with same TaxId / CRN
        var token2 = await RegisterAndLoginAsync(client, "user2@company.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        var comp2 = new CreateCompanyRequest(
            LegalName: "Second Company Ltd",
            TradeName: "SecondCo",
            IndustrySector: "Chemicals",
            City: "Alexandria",
            Governorate: "Alexandria",
            Description: null,
            Website: null,
            TaxIdNumber: "TAX-999", // Duplicate
            CommercialRegistrationNumber: "CRN-999", // Duplicate
            CorporateEmail: "info@secondco.eg",
            CorporatePhone: "+2010000002",
            AddressLine1: "Address 2",
            AddressLine2: null,
            PostalCode: null);

        var res2 = await client.PostAsJsonAsync("/api/v1/companies", comp2);
        Assert.Equal(HttpStatusCode.Conflict, res2.StatusCode);
    }

    [Fact]
    public async Task CompanyEndpoints_Unauthenticated_ShouldReturn401()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var getRes = await client.GetAsync("/api/v1/companies/me");
        Assert.Equal(HttpStatusCode.Unauthorized, getRes.StatusCode);

        var contactRes = await client.GetAsync("/api/v1/companies/me/contact-details");
        Assert.Equal(HttpStatusCode.Unauthorized, contactRes.StatusCode);
    }
}

