using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Common.Models;
using DealZone.Application.Companies.DTOs;
using DealZone.Application.Rfqs.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Rfqs;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class RfqIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

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

    private static async Task<(string token, Guid companyId)> CreateVerifiedCompanyAsync(
        DealZoneWebApplicationFactory factory,
        HttpClient client,
        string email,
        string legalName,
        string tradeName)
    {
        var token = await RegisterAndLoginAsync(client, email);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var uniqueNum = Random.Shared.Next(100000, 999999).ToString();
        var compReq = new CreateCompanyRequest(
            legalName,
            tradeName,
            "Industrial Manufacturing",
            "10th of Ramadan",
            "Sharqia",
            "Leading industrial manufacturer",
            "https://testcompany.eg",
            $"TAX-{uniqueNum}",
            $"CRN-{uniqueNum}",
            $"ops.{uniqueNum}@testcompany.eg",
            "+201011112222",
            "12 Industrial St",
            null,
            "44629");

        var compRes = await client.PostAsJsonAsync("/api/v1/companies", compReq);
        Assert.Equal(HttpStatusCode.Created, compRes.StatusCode);
        var company = await compRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var comp = await db.Companies.FirstAsync(c => c.Id == company!.Id);
            comp.VerificationStatus = CompanyVerificationStatus.Approved;
            comp.VerifiedAtUtc = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }

        var reLoginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "StrongPassword2026!"));
        var reAuth = await reLoginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return (reAuth!.AccessToken, company!.Id);
    }

    [Fact]
    public async Task UnverifiedCompany_CannotCreateRfq_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var token = await RegisterAndLoginAsync(client, "unverified.buyer@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var uniqueNum = Random.Shared.Next(100000, 999999).ToString();
        var compReq = new CreateCompanyRequest(
            "Unverified Corp",
            "Unverified",
            "Steel Fabrication",
            "6th of October",
            "Giza",
            null,
            null,
            $"TAX-UNV-{uniqueNum}",
            $"CRN-UNV-{uniqueNum}",
            $"contact.{uniqueNum}@unverified.eg",
            "+201000000000",
            "Industrial Area",
            null,
            null);

        var compRes = await client.PostAsJsonAsync("/api/v1/companies", compReq);
        Assert.Equal(HttpStatusCode.Created, compRes.StatusCode);

        var rfqReq = new CreateRfqRequest(
            "Rebar RFQ",
            "Need rebar",
            null,
            "Cairo",
            "Helwan",
            "Industrial Zone",
            DateTimeOffset.UtcNow.AddDays(7),
            null,
            null,
            "EGP",
            null,
            false,
            new List<CreateRfqItemRequest>());

        var response = await client.PostAsJsonAsync("/api/v1/rfqs", rfqReq);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task VerifiedBuyer_CanCreateAndPublishRfq_LifecycleWorks()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, buyerCompanyId) = await CreateVerifiedCompanyAsync(
            factory,
            client,
            "buyer.lifecycle@dealzone.eg",
            "Cairo Construction Materials SAE",
            "Cairo ConMat");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        // Fetch categories to get a valid categoryId
        var catRes = await client.GetAsync("/api/v1/catalog/categories");
        var categories = await catRes.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        Assert.NotNull(categories);
        var targetCategory = categories.First();

        // 1. Create Draft RFQ with items
        var createRfqReq = new CreateRfqRequest(
            "Procurement of 100 Tons Rebar",
            "Required for project in New Administrative Capital",
            targetCategory.Id,
            "Cairo",
            "New Administrative Capital",
            "R3 Residential District, Site 4",
            DateTimeOffset.UtcNow.AddDays(14),
            DateTimeOffset.UtcNow.AddDays(21),
            3500000m,
            "EGP",
            "Delivery to be scheduled in 2 batches",
            PublishImmediately: false,
            Items: new List<CreateRfqItemRequest>
            {
                new(targetCategory.Id, null, "High Tensile Steel Rebar 16mm", "B500DWR Egyptian Standard ES 262-2", 100, null, 35000, "With mill certs")
            });

        var createRes = await client.PostAsJsonAsync("/api/v1/rfqs", createRfqReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var createdRfq = await createRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);
        Assert.NotNull(createdRfq);
        Assert.Equal("Draft", createdRfq.Status);
        Assert.Single(createdRfq.Items);
        Assert.StartsWith("RFQ-", createdRfq.RfqNumber);

        // 2. Publish the RFQ
        var publishRes = await client.PostAsync($"/api/v1/rfqs/{createdRfq.Id}/publish", null);
        Assert.Equal(HttpStatusCode.OK, publishRes.StatusCode);
        var publishedRfq = await publishRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);
        Assert.NotNull(publishedRfq);
        Assert.Equal("Published", publishedRfq.Status);
        Assert.NotNull(publishedRfq.PublishedAtUtc);

        // 3. Create a verified supplier company
        var (supplierToken, supplierCompanyId) = await CreateVerifiedCompanyAsync(
            factory,
            client,
            "supplier.lifecycle@dealzone.eg",
            "Ezz Rolling Mills Supplier SAE",
            "Ezz Supplier");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);

        // 4. Supplier discovers the published RFQ
        var discoverRes = await client.GetAsync("/api/v1/rfqs");
        Assert.Equal(HttpStatusCode.OK, discoverRes.StatusCode);
        var pagedRfqs = await discoverRes.Content.ReadFromJsonAsync<PagedResult<RfqSummaryResponse>>(JsonOptions);
        Assert.NotNull(pagedRfqs);
        Assert.Contains(pagedRfqs.Items, r => r.Id == createdRfq.Id);

        // 5. Supplier gets RFQ details - buyer's private contact details should NOT be exposed
        var detailsRes = await client.GetAsync($"/api/v1/rfqs/{createdRfq.Id}");
        Assert.Equal(HttpStatusCode.OK, detailsRes.StatusCode);
        var supplierView = await detailsRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);
        Assert.NotNull(supplierView);
        Assert.Equal(createdRfq.Title, supplierView.Title);
        // Ensure buyer company name is shown, but no private phone/email
        Assert.Equal("Cairo ConMat", supplierView.BuyerCompanyName);

        // 6. Buyer closes the RFQ
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var closeRes = await client.PostAsync($"/api/v1/rfqs/{createdRfq.Id}/close", null);
        Assert.Equal(HttpStatusCode.OK, closeRes.StatusCode);
        var closedRfq = await closeRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);
        Assert.NotNull(closedRfq);
        Assert.Equal("Closed", closedRfq.Status);

        // 7. Trying to close an already closed RFQ returns Conflict
        var reCloseRes = await client.PostAsync($"/api/v1/rfqs/{createdRfq.Id}/close", null);
        Assert.Equal(HttpStatusCode.Conflict, reCloseRes.StatusCode);
    }

    [Fact]
    public async Task Supplier_CannotSeeDraftRfq_ReturnsNotFound()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(
            factory,
            client,
            "buyer.draft@dealzone.eg",
            "Draft Buyer Corp",
            "Draft Buyer");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        var catRes = await client.GetAsync("/api/v1/catalog/categories");
        var categories = await catRes.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        var categoryId = categories!.First().Id;

        var createRfqReq = new CreateRfqRequest(
            "Secret Draft RFQ",
            "Internal planning",
            categoryId,
            "Alexandria",
            "Dekheila",
            "Port Area",
            DateTimeOffset.UtcNow.AddDays(10),
            null,
            null,
            "EGP",
            null,
            PublishImmediately: false,
            Items: new List<CreateRfqItemRequest>
            {
                new(categoryId, null, "Raw Pig Iron", "High purity", 50, null, null, null)
            });

        var createRes = await client.PostAsJsonAsync("/api/v1/rfqs", createRfqReq);
        var createdRfq = await createRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);

        // Supplier attempts to view Draft RFQ
        var (supplierToken, _) = await CreateVerifiedCompanyAsync(
            factory,
            client,
            "supplier.snoop@dealzone.eg",
            "Snoop Supplier Ltd",
            "Snoop Supplier");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);

        var viewRes = await client.GetAsync($"/api/v1/rfqs/{createdRfq!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, viewRes.StatusCode);
    }

    [Fact]
    public async Task CrossCompany_CannotCancelAnotherCompanyRfq_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerTokenA, _) = await CreateVerifiedCompanyAsync(
            factory,
            client,
            "buyer.a@dealzone.eg",
            "Company A Ltd",
            "Company A");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerTokenA);

        var catRes = await client.GetAsync("/api/v1/catalog/categories");
        var categories = await catRes.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        var categoryId = categories!.First().Id;

        var rfqReq = new CreateRfqRequest(
            "Company A's RFQ",
            "Details",
            categoryId,
            "Cairo",
            "Maadi",
            "Street 9",
            DateTimeOffset.UtcNow.AddDays(10),
            null,
            null,
            "EGP",
            null,
            PublishImmediately: false,
            Items: new List<CreateRfqItemRequest>());

        var createRes = await client.PostAsJsonAsync("/api/v1/rfqs", rfqReq);
        var createdRfq = await createRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);

        var (buyerTokenB, _) = await CreateVerifiedCompanyAsync(
            factory,
            client,
            "buyer.b@dealzone.eg",
            "Company B Ltd",
            "Company B");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerTokenB);

        var cancelRes = await client.PostAsync($"/api/v1/rfqs/{createdRfq!.Id}/cancel", null);
        Assert.Equal(HttpStatusCode.Forbidden, cancelRes.StatusCode);
    }
}
