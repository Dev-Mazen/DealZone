using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Common.Models;
using DealZone.Application.Companies.DTOs;
using DealZone.Domain.Companies;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace DealZone.IntegrationTests.Endpoints;

public class CompanyIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private static async Task<string> RegisterAndLoginAsync(HttpClient client, string email)
    {
        var reg = new RegisterRequest(email, "CompanyOwnerPassword2026!", "Owner User", "+201099988877");
        await client.PostAsJsonAsync("/api/v1/auth/register", reg);

        var confirm = DevelopmentEmailService.SentEmails.Last(e =>
            string.Equals(e.Email, email, StringComparison.OrdinalIgnoreCase) && e.Purpose == "EmailConfirmation");
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

    // ─── Phase B: Company Member Management Tests ────────────────────────────

    [Fact]
    public async Task CompanyMemberManagement_FullLifecycle_EnforcesSecurityAndInvariants()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        // 1. Owner registers and creates Company A
        var ownerToken = await RegisterAndLoginAsync(client, "owner.companyA@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);

        var compReq = new CreateCompanyRequest(
            LegalName: "Company A Industries SAE",
            TradeName: "Company A",
            IndustrySector: "Metals & Steel",
            City: "Cairo",
            Governorate: "Cairo",
            Description: "Primary steel producer",
            Website: "https://comp-a.eg",
            TaxIdNumber: "TAX-COMP-A-01",
            CommercialRegistrationNumber: "CRN-COMP-A-01",
            CorporateEmail: "info@comp-a.eg",
            CorporatePhone: "+2021111111",
            AddressLine1: "Zone 1",
            AddressLine2: null,
            PostalCode: null);

        var compRes = await client.PostAsJsonAsync("/api/v1/companies", compReq);
        Assert.Equal(HttpStatusCode.Created, compRes.StatusCode);

        // 2. Register candidate user (User B) without a company
        await RegisterAndLoginAsync(client, "candidate.b@dealzone.eg");

        // 3. Register candidate user (User C) who belongs to Company B
        var otherOwnerToken = await RegisterAndLoginAsync(client, "owner.companyB@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", otherOwnerToken);

        var compBReq = new CreateCompanyRequest(
            LegalName: "Company B Polymers SAE",
            TradeName: "Company B",
            IndustrySector: "Chemicals",
            City: "Alexandria",
            Governorate: "Alexandria",
            Description: null,
            Website: null,
            TaxIdNumber: "TAX-COMP-B-02",
            CommercialRegistrationNumber: "CRN-COMP-B-02",
            CorporateEmail: "info@comp-b.eg",
            CorporatePhone: "+2022222222",
            AddressLine1: "Zone 2",
            AddressLine2: null,
            PostalCode: null);
        await client.PostAsJsonAsync("/api/v1/companies", compBReq);

        // Switch back to Owner of Company A
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);

        // Test 3a: Adding a non-existent email -> 404
        var addNonExistentRes = await client.PostAsJsonAsync("/api/v1/companies/me/members",
            new AddCompanyMemberRequest("nonexistent@nobody.eg", CompanyRole.ProcurementManager));
        Assert.Equal(HttpStatusCode.NotFound, addNonExistentRes.StatusCode);

        // Test 3b: Adding a user who already belongs to another active company -> 409 Conflict
        var addDuplicateCompanyRes = await client.PostAsJsonAsync("/api/v1/companies/me/members",
            new AddCompanyMemberRequest("owner.companyB@dealzone.eg", CompanyRole.Member));
        Assert.Equal(HttpStatusCode.Conflict, addDuplicateCompanyRes.StatusCode);

        // Test 3c: Successfully add candidate User B as ProcurementManager -> 201 Created
        var addMemberRes = await client.PostAsJsonAsync("/api/v1/companies/me/members",
            new AddCompanyMemberRequest("candidate.b@dealzone.eg", CompanyRole.ProcurementManager));
        Assert.Equal(HttpStatusCode.Created, addMemberRes.StatusCode);

        var addedMember = await addMemberRes.Content.ReadFromJsonAsync<CompanyMemberResponse>(JsonOptions);
        Assert.NotNull(addedMember);
        Assert.Equal("candidate.b@dealzone.eg", addedMember!.Email);
        Assert.Equal("ProcurementManager", addedMember.Role);

        // Test 3d: List members -> both Owner and ProcurementManager are present
        var listRes = await client.GetAsync("/api/v1/companies/me/members");
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);

        var members = await listRes.Content.ReadFromJsonAsync<List<CompanyMemberResponse>>(JsonOptions);
        Assert.NotNull(members);
        Assert.Equal(2, members!.Count);
        Assert.Contains(members, m => m.Role == "Owner");
        Assert.Contains(members, m => m.Email == "candidate.b@dealzone.eg");

        // Test 3e: Cross-company isolation -> Owner of Company B cannot see Company A's members
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", otherOwnerToken);
        var otherListRes = await client.GetAsync("/api/v1/companies/me/members");
        Assert.Equal(HttpStatusCode.OK, otherListRes.StatusCode);
        var otherMembers = await otherListRes.Content.ReadFromJsonAsync<List<CompanyMemberResponse>>(JsonOptions);
        Assert.NotNull(otherMembers);
        Assert.Single(otherMembers!);
        Assert.Equal("owner.companyb@dealzone.eg", otherMembers[0].Email);

        // Switch back to Owner of Company A
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);

        // Test 3f: Update role of User B to Admin -> 200 OK
        var updateRoleRes = await client.PutAsJsonAsync($"/api/v1/companies/me/members/{addedMember.UserId}/role",
            new UpdateCompanyMemberRoleRequest(CompanyRole.Admin));
        Assert.Equal(HttpStatusCode.OK, updateRoleRes.StatusCode);
        var updatedMember = await updateRoleRes.Content.ReadFromJsonAsync<CompanyMemberResponse>(JsonOptions);
        Assert.Equal("Admin", updatedMember!.Role);

        // Test 3g: Owner protection -> Attempt to demote the sole Owner of Company A -> 400 Bad Request
        var ownerMember = members.First(m => m.Role == "Owner");
        var demoteOwnerRes = await client.PutAsJsonAsync($"/api/v1/companies/me/members/{ownerMember.UserId}/role",
            new UpdateCompanyMemberRoleRequest(CompanyRole.Member));
        Assert.Equal(HttpStatusCode.BadRequest, demoteOwnerRes.StatusCode);

        // Test 3h: Owner protection -> Attempt to remove the sole Owner of Company A -> 400 Bad Request
        var removeOwnerRes = await client.DeleteAsync($"/api/v1/companies/me/members/{ownerMember.UserId}");
        Assert.Equal(HttpStatusCode.BadRequest, removeOwnerRes.StatusCode);

        // Test 3i: Successfully remove User B -> 204 NoContent
        var removeMemberRes = await client.DeleteAsync($"/api/v1/companies/me/members/{addedMember.UserId}");
        Assert.Equal(HttpStatusCode.NoContent, removeMemberRes.StatusCode);

        // Verify member list now only contains the Owner
        var finalListRes = await client.GetAsync("/api/v1/companies/me/members");
        var finalMembers = await finalListRes.Content.ReadFromJsonAsync<List<CompanyMemberResponse>>(JsonOptions);
        Assert.Single(finalMembers!);
    }

    // ─── Phase B: Supplier Directory & Public Company Profile Tests ──────────

    [Fact]
    public async Task SupplierDirectoryAndPublicProfile_FilteringVisibilityAndPrivacy()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();
        DevelopmentEmailService.Clear();

        // 1. Create Verified Supplier (Alexandria, Metals & Steel)
        var suppToken = await RegisterAndLoginAsync(client, "supplier.metals@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken);

        var suppReq = new CreateCompanyRequest(
            LegalName: "Alexandria Metalworks SAE",
            TradeName: "Alex Metals",
            IndustrySector: "Metals & Steel",
            City: "Alexandria",
            Governorate: "Alexandria",
            Description: "Prime structural steel billets supplier",
            Website: "https://alexmetals.eg",
            TaxIdNumber: "TAX-ALX-01",
            CommercialRegistrationNumber: "CRN-ALX-01",
            CorporateEmail: "info@alexmetals.eg",
            CorporatePhone: "+2039999999",
            AddressLine1: "Industrial Area 1",
            AddressLine2: null,
            PostalCode: null,
            CompanyType: "Supplier");

        var suppRes = await client.PostAsJsonAsync("/api/v1/companies", suppReq);
        Assert.Equal(HttpStatusCode.Created, suppRes.StatusCode);
        var suppCompany = await suppRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);

        // 2. Create Verified Both (Cairo, Polymers & Plastics)
        var bothToken = await RegisterAndLoginAsync(client, "cairo.polymers@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", bothToken);

        var bothReq = new CreateCompanyRequest(
            LegalName: "Cairo Polymers SAE",
            TradeName: "Cairo Polymers",
            IndustrySector: "Polymers & Plastics",
            City: "Cairo",
            Governorate: "Cairo",
            Description: "HDPE and LDPE polymer resin supplier",
            Website: "https://cairopoly.eg",
            TaxIdNumber: "TAX-CAI-02",
            CommercialRegistrationNumber: "CRN-CAI-02",
            CorporateEmail: "sales@cairopoly.eg",
            CorporatePhone: "+2028888888",
            AddressLine1: "10th of Ramadan",
            AddressLine2: null,
            PostalCode: null,
            CompanyType: "Both");

        var bothRes = await client.PostAsJsonAsync("/api/v1/companies", bothReq);
        Assert.Equal(HttpStatusCode.Created, bothRes.StatusCode);
        var bothCompany = await bothRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);

        // 3. Create Verified Buyer-only (Giza, Manufacturing)
        var buyerToken = await RegisterAndLoginAsync(client, "giza.fab@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        var buyerReq = new CreateCompanyRequest(
            LegalName: "Giza Heavy Fabricators SAE",
            TradeName: "Giza Fab",
            IndustrySector: "Industrial Manufacturing",
            City: "6th of October",
            Governorate: "Giza",
            Description: "Industrial metal fabrication plant",
            Website: null,
            TaxIdNumber: "TAX-GIZ-03",
            CommercialRegistrationNumber: "CRN-GIZ-03",
            CorporateEmail: "procurement@gizafab.eg",
            CorporatePhone: "+2027777777",
            AddressLine1: "Industrial Zone 4",
            AddressLine2: null,
            PostalCode: null,
            CompanyType: "Buyer");

        var buyerRes = await client.PostAsJsonAsync("/api/v1/companies", buyerReq);
        Assert.Equal(HttpStatusCode.Created, buyerRes.StatusCode);
        var buyerCompany = await buyerRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);

        // 4. Create Unverified (Pending) Supplier
        var unverifiedToken = await RegisterAndLoginAsync(client, "unverified@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", unverifiedToken);

        var unverifiedReq = new CreateCompanyRequest(
            LegalName: "Unverified Chem SAE",
            TradeName: "Unverified Chem",
            IndustrySector: "Chemicals & Solvents",
            City: "Suez",
            Governorate: "Suez",
            Description: null,
            Website: null,
            TaxIdNumber: "TAX-UNV-04",
            CommercialRegistrationNumber: "CRN-UNV-04",
            CorporateEmail: "info@unverified.eg",
            CorporatePhone: "+2026666666",
            AddressLine1: "Attaka Zone",
            AddressLine2: null,
            PostalCode: null,
            CompanyType: "Supplier");

        var unverifiedRes = await client.PostAsJsonAsync("/api/v1/companies", unverifiedReq);
        Assert.Equal(HttpStatusCode.Created, unverifiedRes.StatusCode);
        var unverifiedCompany = await unverifiedRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);

        // Approve Company 1, 2, and 3 via direct DB context (admin verification approval)
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var c1 = await db.Companies.FirstAsync(c => c.Id == suppCompany!.Id);
            c1.VerificationStatus = CompanyVerificationStatus.Approved;
            c1.VerifiedAtUtc = DateTimeOffset.UtcNow;

            var c2 = await db.Companies.FirstAsync(c => c.Id == bothCompany!.Id);
            c2.VerificationStatus = CompanyVerificationStatus.Approved;
            c2.VerifiedAtUtc = DateTimeOffset.UtcNow;

            var c3 = await db.Companies.FirstAsync(c => c.Id == buyerCompany!.Id);
            c3.VerificationStatus = CompanyVerificationStatus.Approved;
            c3.VerifiedAtUtc = DateTimeOffset.UtcNow;

            // Company 4 remains CompanyVerificationStatus.Pending

            await db.SaveChangesAsync();
        }

        // Drop auth header to test public anonymous access
        client.DefaultRequestHeaders.Authorization = null;

        // ── Test Directory Endpoint (GET /api/v1/companies) ──

        var directoryRes = await client.GetAsync("/api/v1/companies");
        Assert.Equal(HttpStatusCode.OK, directoryRes.StatusCode);

        var page = await directoryRes.Content.ReadFromJsonAsync<PagedResult<PublicSupplierSummaryResponse>>(JsonOptions);
        Assert.NotNull(page);

        // MUST contain Approved Supplier and Approved Both
        Assert.Contains(page!.Items, s => s.Id == suppCompany!.Id);
        Assert.Contains(page.Items, s => s.Id == bothCompany!.Id);

        // MUST NOT contain Buyer-only company
        Assert.DoesNotContain(page.Items, s => s.Id == buyerCompany!.Id);

        // MUST NOT contain Unverified (Pending) supplier
        Assert.DoesNotContain(page.Items, s => s.Id == unverifiedCompany!.Id);

        // Search Filter: search by "Polymers"
        var searchRes = await client.GetAsync("/api/v1/companies?search=Polymers");
        var searchPage = await searchRes.Content.ReadFromJsonAsync<PagedResult<PublicSupplierSummaryResponse>>(JsonOptions);
        Assert.Single(searchPage!.Items);
        Assert.Equal(bothCompany!.Id, searchPage.Items[0].Id);

        // Governorate Filter: filter by "Alexandria"
        var govRes = await client.GetAsync("/api/v1/companies?governorate=Alexandria");
        var govPage = await govRes.Content.ReadFromJsonAsync<PagedResult<PublicSupplierSummaryResponse>>(JsonOptions);
        Assert.Single(govPage!.Items);
        Assert.Equal(suppCompany!.Id, govPage.Items[0].Id);

        // ── Test Public Company Profile (GET /api/v1/companies/{id}) ──

        // Verified profile query succeeds
        var profileRes = await client.GetAsync($"/api/v1/companies/{suppCompany!.Id}");
        Assert.Equal(HttpStatusCode.OK, profileRes.StatusCode);

        var profile = await profileRes.Content.ReadFromJsonAsync<PublicCompanyProfileResponse>(JsonOptions);
        Assert.NotNull(profile);
        Assert.Equal("Alex Metals", profile!.TradeName);
        Assert.Equal("Alexandria Metalworks SAE", profile.LegalName);
        Assert.Equal("Metals & Steel", profile.IndustrySector);
        Assert.True(profile.IsVerified);

        // Invariant: Profile response must NEVER expose private tax ID, CRN, or address
        var rawJson = await profileRes.Content.ReadAsStringAsync();
        Assert.DoesNotContain("TAX-ALX-01", rawJson);
        Assert.DoesNotContain("CRN-ALX-01", rawJson);
        Assert.DoesNotContain("Industrial Area 1", rawJson);
        Assert.DoesNotContain("+2039999999", rawJson);
        Assert.DoesNotContain("info@alexmetals.eg", rawJson);

        // Unverified company profile query MUST return 404 Not Found
        var unverifiedProfileRes = await client.GetAsync($"/api/v1/companies/{unverifiedCompany!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, unverifiedProfileRes.StatusCode);

        // Non-existent company profile query returns 404 Not Found
        var nonExistentRes = await client.GetAsync($"/api/v1/companies/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, nonExistentRes.StatusCode);
    }
}

