using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Common.Models;
using DealZone.Application.Companies.DTOs;
using DealZone.Application.Deals.DTOs;
using DealZone.Application.Purchasing.DTOs;
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

public class Batch4Part1IntegrationTests : IClassFixture<DealZoneWebApplicationFactory>
{
    private readonly DealZoneWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public Batch4Part1IntegrationTests(DealZoneWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static async Task<string> RegisterAndLoginAsync(HttpClient client, string email)
    {
        var reg = new RegisterRequest(email, "StrongPassword2026!", "Batch4 User", "+201099988877");
        await client.PostAsJsonAsync("/api/v1/auth/register", reg);

        var confirm = DevelopmentEmailService.SentEmails.Last(e => e.Email == email && e.Purpose == "EmailConfirmation");
        await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(email, confirm.Token));

        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "StrongPassword2026!"));
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return auth!.AccessToken;
    }

    private async Task<(string token, Guid companyId)> CreateVerifiedCompanyAsync(
        HttpClient client,
        string email,
        string legalName,
        string tradeName,
        string companyType)
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
            "Manufacturer and supplier enterprise",
            "https://batch4test.eg",
            $"TAX-{uniqueNum}",
            $"CRN-{uniqueNum}",
            $"ops.{uniqueNum}@batch4test.eg",
            "+201011112222",
            "Plot 5, Industrial Area",
            null,
            "44629",
            companyType);

        var compRes = await client.PostAsJsonAsync("/api/v1/companies", compReq);
        Assert.Equal(HttpStatusCode.Created, compRes.StatusCode);
        var company = await compRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var comp = await db.Companies.FirstAsync(c => c.Id == company!.Id);
            comp.VerificationStatus = CompanyVerificationStatus.Approved;
            comp.VerifiedAtUtc = DateTimeOffset.UtcNow;
            if (Enum.TryParse<CompanyType>(companyType, true, out var parsedType))
            {
                comp.CompanyType = parsedType;
            }
            await db.SaveChangesAsync();
        }

        var reLoginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "StrongPassword2026!"));
        var reAuth = await reLoginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return (reAuth!.AccessToken, company!.Id);
    }

    [Fact]
    public async Task SupplierCannotPerformBuyerActions_ShouldReturnForbidden()
    {
        var client = _factory.CreateClient();
        var email = $"supplier.nobuy.{Guid.NewGuid():N}@test.eg";
        var (token, _) = await CreateVerifiedCompanyAsync(client, email, "Supplier Corp SAE", "Supplier Corp", "Supplier");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // 1. Direct purchase attempt
        var directPurchaseRes = await client.PostAsJsonAsync("/api/v1/purchasing/direct", new CreateDirectPurchaseRequest(
            CatalogProductId: Guid.NewGuid(),
            Quantity: 10,
            DeliveryAddress: "Delivery Address 123",
            ClientRequestId: Guid.NewGuid().ToString()));
        Assert.Equal(HttpStatusCode.Forbidden, directPurchaseRes.StatusCode);

        // 2. Start negotiation attempt
        var negotiationRes = await client.PostAsJsonAsync("/api/v1/negotiations", new CreateProductNegotiationRequest(
            CatalogProductId: Guid.NewGuid(),
            ProposedUnitPrice: 100m,
            Quantity: 10,
            Notes: "Negotiation attempt"));
        Assert.Equal(HttpStatusCode.Forbidden, negotiationRes.StatusCode);

        // 3. Create RFQ attempt
        var dummyCatId = Guid.NewGuid();
        var rfqRes = await client.PostAsJsonAsync("/api/v1/rfqs", new CreateRfqRequest(
            Title: "Illegal RFQ by Supplier",
            Description: "Should be rejected",
            TargetCategoryId: dummyCatId,
            DeliveryGovernorate: "Cairo",
            DeliveryCity: "Cairo",
            DeliveryAddress: "Industrial Zone",
            ClosingDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            RequiredDeliveryDateUtc: null,
            TargetBudget: null,
            Currency: "EGP",
            Notes: null,
            PublishImmediately: false,
            Items: [
                new CreateRfqItemRequest(
                    CategoryId: dummyCatId,
                    MaterialId: null,
                    MaterialName: "Copper",
                    Specifications: "Standard purity",
                    Quantity: 10,
                    UnitOfMeasureId: null)
            ]));
        Assert.Equal(HttpStatusCode.Forbidden, rfqRes.StatusCode);
    }

    [Fact]
    public async Task BuyerProfileVisibility_ShouldEnforceStrictSupplierOnlyAccess()
    {
        var client = _factory.CreateClient();

        // 1. Create a verified Buyer company
        var buyerEmail = $"buyer.profile.{Guid.NewGuid():N}@test.eg";
        var (_, buyerCompId) = await CreateVerifiedCompanyAsync(client, buyerEmail, "Buyer Enterprise SAE", "Buyer Enterprise", "Buyer");

        // Create a verified supplier to be the target of targeted RFQ
        var targetSupplierEmail = $"target.supp.{Guid.NewGuid():N}@test.eg";
        var (_, targetSuppCompId) = await CreateVerifiedCompanyAsync(client, targetSupplierEmail, "Target Supplier SAE", "Target Supplier", "Supplier");

        // Seed a public RFQ and a targeted RFQ for the buyer
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var category = await db.MaterialCategories.FirstAsync();

            var publicRfq = new Rfq
            {
                Id = Guid.NewGuid(),
                RfqNumber = $"RFQ-PUB-{Guid.NewGuid():N}"[..12],
                BuyerCompanyId = buyerCompId,
                Title = "Public Open RFQ Test",
                Status = RfqStatus.Published,
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(10),
                TargetCategoryId = category.Id,
                DeliveryAddress = "Site 1",
                DeliveryCity = "Cairo",
                DeliveryGovernorate = "Cairo"
            };
            publicRfq.Items.Add(new RfqItem
            {
                Id = Guid.NewGuid(),
                RfqId = publicRfq.Id,
                CategoryId = category.Id,
                MaterialName = "Steel Plate",
                Specifications = "Specs",
                Quantity = 50,
                Unit = MaterialUnit.MetricTon
            });
            db.Rfqs.Add(publicRfq);

            var targetedRfq = new Rfq
            {
                Id = Guid.NewGuid(),
                RfqNumber = $"RFQ-TGT-{Guid.NewGuid():N}"[..12],
                BuyerCompanyId = buyerCompId,
                Title = "Targeted Private RFQ Test",
                Status = RfqStatus.Published,
                ClosingDateUtc = DateTimeOffset.UtcNow.AddDays(10),
                TargetCategoryId = category.Id,
                TargetSupplierCompanyId = targetSuppCompId,
                DeliveryAddress = "Site 2",
                DeliveryCity = "Alex",
                DeliveryGovernorate = "Alexandria"
            };
            targetedRfq.Items.Add(new RfqItem
            {
                Id = Guid.NewGuid(),
                RfqId = targetedRfq.Id,
                CategoryId = category.Id,
                MaterialName = "Copper Wire",
                Specifications = "Specs",
                Quantity = 20,
                Unit = MaterialUnit.MetricTon
            });
            db.Rfqs.Add(targetedRfq);
            await db.SaveChangesAsync();
        }

        // 2. Anonymous request -> 404
        client.DefaultRequestHeaders.Authorization = null;
        var anonRes = await client.GetAsync($"/api/v1/companies/{buyerCompId}/profile");
        Assert.Equal(HttpStatusCode.NotFound, anonRes.StatusCode);

        // 3. Another buyer request -> 404
        var otherBuyerEmail = $"other.buyer.{Guid.NewGuid():N}@test.eg";
        var (otherBuyerToken, _) = await CreateVerifiedCompanyAsync(client, otherBuyerEmail, "Other Buyer SAE", "Other Buyer", "Buyer");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", otherBuyerToken);
        var otherBuyerRes = await client.GetAsync($"/api/v1/companies/{buyerCompId}/profile");
        Assert.Equal(HttpStatusCode.NotFound, otherBuyerRes.StatusCode);

        // 4. Verified Supplier request -> 200 OK
        var supplierEmail = $"supplier.viewer.{Guid.NewGuid():N}@test.eg";
        var (supplierToken, _) = await CreateVerifiedCompanyAsync(client, supplierEmail, "Supplier Viewer SAE", "Supplier Viewer", "Supplier");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var supplierRes = await client.GetAsync($"/api/v1/companies/{buyerCompId}/profile");
        Assert.Equal(HttpStatusCode.OK, supplierRes.StatusCode);

        var profile = await supplierRes.Content.ReadFromJsonAsync<PublicCompanyProfileResponse>(JsonOptions);
        Assert.NotNull(profile);
        Assert.Equal("Buyer Enterprise", profile.TradeName);
        Assert.Equal("Buyer", profile.CompanyType);
        Assert.True(profile.IsVerified);
        Assert.NotNull(profile.OpenPublicRfqs);

        // Ensure targeted RFQ is NOT in OpenPublicRfqs
        Assert.Contains(profile.OpenPublicRfqs, r => r.Title == "Public Open RFQ Test");
        Assert.DoesNotContain(profile.OpenPublicRfqs, r => r.Title == "Targeted Private RFQ Test");
    }

    [Fact]
    public async Task StatusQueryFilters_ShouldValidateEnumAndNarrowResults()
    {
        var client = _factory.CreateClient();
        var buyerEmail = $"buyer.filter.{Guid.NewGuid():N}@test.eg";
        var (token, _) = await CreateVerifiedCompanyAsync(client, buyerEmail, "Filter Buyer SAE", "Filter Buyer", "Buyer");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // 1. Deals invalid status filter -> 400
        var badDealRes = await client.GetAsync("/api/v1/deals/mine?status=BogusStatus");
        var raw = await badDealRes.Content.ReadAsStringAsync();
        Assert.True(badDealRes.StatusCode == HttpStatusCode.BadRequest, $"Expected 400 for deals/mine but got {badDealRes.StatusCode}. Body: {raw}");

        // 2. Deals valid status filter -> 200
        var goodDealRes = await client.GetAsync("/api/v1/deals/mine?status=Completed");
        Assert.Equal(HttpStatusCode.OK, goodDealRes.StatusCode);

        // 3. Offers received (as Buyer) invalid status filter -> 400
        var badOfferRes = await client.GetAsync("/api/v1/offers/received?status=FakeStatus");
        Assert.Equal(HttpStatusCode.BadRequest, badOfferRes.StatusCode);

        // 4. Offers received (as Buyer) valid status filter -> 200
        var goodOfferRes = await client.GetAsync("/api/v1/offers/received?status=Submitted");
        Assert.Equal(HttpStatusCode.OK, goodOfferRes.StatusCode);

        // 5. RFQs invalid status filter -> 400
        var badRfqRes = await client.GetAsync("/api/v1/rfqs/mine?status=NonExistentStatus");
        Assert.Equal(HttpStatusCode.BadRequest, badRfqRes.StatusCode);

        // 6. RFQs valid status filter -> 200
        var goodRfqRes = await client.GetAsync("/api/v1/rfqs/mine?status=Published");
        Assert.Equal(HttpStatusCode.OK, goodRfqRes.StatusCode);

        // 7. Offers mine (as Supplier) invalid status filter -> 400
        var supplierEmail = $"supp.filter.{Guid.NewGuid():N}@test.eg";
        var (suppToken, _) = await CreateVerifiedCompanyAsync(client, supplierEmail, "Filter Supplier SAE", "Filter Supplier", "Supplier");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken);

        var badSuppOfferRes = await client.GetAsync("/api/v1/offers/mine?status=FakeStatus");
        Assert.Equal(HttpStatusCode.BadRequest, badSuppOfferRes.StatusCode);

        var goodSuppOfferRes = await client.GetAsync("/api/v1/offers/mine?status=Submitted");
        Assert.Equal(HttpStatusCode.OK, goodSuppOfferRes.StatusCode);
    }
}
