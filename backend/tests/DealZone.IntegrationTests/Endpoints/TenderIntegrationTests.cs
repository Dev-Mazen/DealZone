using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Common.Models;
using DealZone.Application.Companies.DTOs;
using DealZone.Application.Deals.DTOs;
using DealZone.Application.Tenders.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Rfqs;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class TenderIntegrationTests : IClassFixture<DealZoneWebApplicationFactory>
{
    private readonly DealZoneWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public TenderIntegrationTests(DealZoneWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static async Task<string> RegisterAndLoginAsync(HttpClient client, string email)
    {
        var reg = new RegisterRequest(email, "StrongPassword2026!", "Tender User", "+201099988877");
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

        using (var scope = _factory.Services.CreateScope())
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

    private async Task<Guid> EnsureCategoryExistsAsync(HttpClient client)
    {
        var res = await client.GetAsync("/api/v1/catalog/categories");
        if (res.IsSuccessStatusCode)
        {
            var cats = await res.Content.ReadFromJsonAsync<IReadOnlyList<CategoryDto>>(JsonOptions);
            if (cats != null && cats.Count > 0)
            {
                return cats[0].Id;
            }
        }

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
        var existing = await db.MaterialCategories.FirstOrDefaultAsync();
        if (existing != null) return existing.Id;

        var cat = new DealZone.Domain.Catalog.MaterialCategory
        {
            NameEn = "Raw Metals",
            NameAr = "المعادن الخام",
            DescriptionEn = "Raw metals and alloys",
            IsActive = true
        };
        db.MaterialCategories.Add(cat);
        await db.SaveChangesAsync();
        return cat.Id;
    }

    [Fact]
    public async Task CompleteTenderReverseBiddingLifecycle_SucceedsEndToEnd()
    {
        var buyerClient = _factory.CreateClient();
        var supplier1Client = _factory.CreateClient();
        var supplier2Client = _factory.CreateClient();

        var rand = Guid.NewGuid().ToString("N")[..8];
        var (buyerToken, buyerCompanyId) = await CreateVerifiedCompanyAsync(
            buyerClient, $"buyer_{rand}@test.com", $"Buyer Corp {rand}", $"Buyer {rand}");

        var (supp1Token, supp1CompanyId) = await CreateVerifiedCompanyAsync(
            supplier1Client, $"supp1_{rand}@test.com", $"Supplier One {rand}", $"Supp1 {rand}");

        var (supp2Token, supp2CompanyId) = await CreateVerifiedCompanyAsync(
            supplier2Client, $"supp2_{rand}@test.com", $"Supplier Two {rand}", $"Supp2 {rand}");

        buyerClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        supplier1Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supp1Token);
        supplier2Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supp2Token);

        var categoryId = await EnsureCategoryExistsAsync(buyerClient);

        // 1. Buyer creates tender (Draft)
        var createReq = new CreateTenderRequest(
            Title: $"Tender Test {rand}",
            Description: "Procurement of high grade rebar",
            TargetCategoryId: categoryId,
            DeliveryGovernorate: "Cairo",
            DeliveryCity: "Helwan",
            DeliveryAddress: "Factory #12",
            RequiredDeliveryDateUtc: DateTimeOffset.UtcNow.AddDays(30),
            ClosingDateUtc: DateTimeOffset.UtcNow.AddDays(5),
            ReferencePrice: 1000000m,
            Notes: "Reverse bidding tender",
            Items: new List<CreateTenderItemRequest>
            {
                new(
                    CategoryId: categoryId,
                    MaterialId: null,
                    MaterialName: "Steel B500D",
                    Specifications: "Standard Grade",
                    Quantity: 100,
                    Unit: MaterialUnit.MetricTon,
                    UnitOfMeasureId: null,
                    TargetPricePerUnit: 10000m,
                    Notes: null)
            });

        var createRes = await buyerClient.PostAsJsonAsync("/api/v1/tenders", createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var tender = await createRes.Content.ReadFromJsonAsync<TenderDetailResponse>(JsonOptions);
        Assert.NotNull(tender);
        Assert.Equal("Draft", tender.Status);
        var tenderId = tender.Id;
        var tenderItemId = tender.Items[0].Id;

        // 2. Buyer publishes tender
        var pubRes = await buyerClient.PostAsync($"/api/v1/tenders/{tenderId}/publish", null);
        Assert.Equal(HttpStatusCode.OK, pubRes.StatusCode);
        var pubTender = await pubRes.Content.ReadFromJsonAsync<TenderDetailResponse>(JsonOptions);
        Assert.Equal("Published", pubTender!.Status);

        // 3. Supplier 1 submits initial bid (100 tons * 9,000 EGP = 900,000 EGP)
        var bid1Req = new SubmitBidRequest(
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(15),
            DeliveryLeadTimeDays: 7,
            ShippingIncluded: true,
            PaymentTerms: "Net 30",
            Notes: "Initial competitive bid",
            Items: new List<SubmitBidItemRequest>
            {
                new(tenderItemId, 9000m, null)
            });

        var bid1Res = await supplier1Client.PostAsJsonAsync($"/api/v1/tenders/{tenderId}/bids", bid1Req);
        Assert.Equal(HttpStatusCode.Created, bid1Res.StatusCode);
        var bid1 = await bid1Res.Content.ReadFromJsonAsync<BidDetailResponse>(JsonOptions);
        Assert.NotNull(bid1);
        Assert.Equal(900000m, bid1.TotalAmount);
        Assert.True(bid1.IsLowest);

        // 4. Supplier 2 submits competing lower bid (100 tons * 8,500 EGP = 850,000 EGP)
        var bid2Req = new SubmitBidRequest(
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(15),
            DeliveryLeadTimeDays: 5,
            ShippingIncluded: true,
            PaymentTerms: "Net 15",
            Notes: "Lower competing bid",
            Items: new List<SubmitBidItemRequest>
            {
                new(tenderItemId, 8500m, null)
            });

        var bid2Res = await supplier2Client.PostAsJsonAsync($"/api/v1/tenders/{tenderId}/bids", bid2Req);
        Assert.Equal(HttpStatusCode.Created, bid2Res.StatusCode);
        var bid2 = await bid2Res.Content.ReadFromJsonAsync<BidDetailResponse>(JsonOptions);
        Assert.NotNull(bid2);
        Assert.Equal(850000m, bid2.TotalAmount);
        Assert.True(bid2.IsLowest);

        // 5. Supplier 1 revises bid to beat Supplier 2 (100 tons * 8,200 EGP = 820,000 EGP)
        var reviseReq = new ReviseBidRequest(
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(15),
            DeliveryLeadTimeDays: 6,
            ShippingIncluded: true,
            PaymentTerms: "Net 30",
            Notes: "Counter-offer lower bid",
            ChangeSummary: "Reduced unit price from 9000 to 8200",
            Items: new List<SubmitBidItemRequest>
            {
                new(tenderItemId, 8200m, null)
            });

        var reviseRes = await supplier1Client.PutAsJsonAsync($"/api/v1/tenders/bids/{bid1.Id}/revise", reviseReq);
        Assert.Equal(HttpStatusCode.Created, reviseRes.StatusCode);
        var revisedBid1 = await reviseRes.Content.ReadFromJsonAsync<BidDetailResponse>(JsonOptions);
        Assert.NotNull(revisedBid1);
        Assert.Equal(820000m, revisedBid1.TotalAmount);
        Assert.Equal(2, revisedBid1.RevisionNumber);
        Assert.True(revisedBid1.IsLowest);

        // 6. Close the tender early (Buyer operation)
        var closeRes = await buyerClient.PostAsync($"/api/v1/tenders/{tenderId}/close", null);
        Assert.Equal(HttpStatusCode.OK, closeRes.StatusCode);

        // 7. Buyer inspects bids
        var bidsRes = await buyerClient.GetAsync($"/api/v1/tenders/{tenderId}/bids");
        Assert.Equal(HttpStatusCode.OK, bidsRes.StatusCode);
        var bidsList = await bidsRes.Content.ReadFromJsonAsync<IReadOnlyList<BidSummaryResponse>>(JsonOptions);
        Assert.NotNull(bidsList);
        Assert.True(bidsList.Count >= 2);

        // 8. Buyer awards tender to revisedBid1 (creating Deal at AwaitingConfirmation)
        var awardReq = new AwardTenderRequest(
            BidId: revisedBid1.Id,
            Rationale: "Lowest price with acceptable lead time");

        var awardRes = await buyerClient.PostAsJsonAsync($"/api/v1/tenders/{tenderId}/award", awardReq);
        Assert.Equal(HttpStatusCode.OK, awardRes.StatusCode);
        var deal = await awardRes.Content.ReadFromJsonAsync<DealDetailResponse>(JsonOptions);
        Assert.NotNull(deal);
        Assert.Equal(DealStatus.AwaitingConfirmation.ToString(), deal.Status);
        Assert.Equal(tenderId, deal.TenderId);
        Assert.Equal(revisedBid1.Id, deal.BidId);
        Assert.Equal(820000m, deal.AgreedPrice);
    }
}
