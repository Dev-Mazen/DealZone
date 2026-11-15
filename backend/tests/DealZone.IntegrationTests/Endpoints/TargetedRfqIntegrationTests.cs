using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Common.Models;
using DealZone.Application.Companies.DTOs;
using DealZone.Application.Offers.DTOs;
using DealZone.Application.Rfqs.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Notifications;
using DealZone.Domain.Rfqs;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class TargetedRfqIntegrationTests
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
        string tradeName,
        string companyType = "Buyer",
        bool approve = true)
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
            "44629",
            companyType);

        var compRes = await client.PostAsJsonAsync("/api/v1/companies", compReq);
        Assert.Equal(HttpStatusCode.Created, compRes.StatusCode);
        var company = await compRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);

        if (approve)
        {
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

        return (token, company!.Id);
    }

    [Fact]
    public async Task SelfTargeting_And_UnverifiedOrNonSupplierTarget_Rejected()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, buyerCompId) = await CreateVerifiedCompanyAsync(factory, client, "target.buyer1@dealzone.eg", "Buyer Corp One", "BuyerCorp1", "Buyer");
        var (otherBuyerToken, otherBuyerCompId) = await CreateVerifiedCompanyAsync(factory, client, "target.buyer2@dealzone.eg", "Buyer Corp Two", "BuyerCorp2", "Buyer");
        var (unverifiedSupToken, unverifiedSupId) = await CreateVerifiedCompanyAsync(factory, client, "target.unsup@dealzone.eg", "Unverified Supplier", "Unsup", "Supplier", approve: false);

        var catRes = await client.GetAsync("/api/v1/catalog/categories");
        var categories = await catRes.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        var categoryId = categories!.First().Id;

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        // 1. Target self -> 400 Bad Request
        var selfTargetReq = new CreateRfqRequest(
            Title: "Target Self RFQ",
            Description: "Need materials",
            TargetCategoryId: categoryId,
            DeliveryGovernorate: "Sharqia",
            DeliveryCity: "10th of Ramadan",
            DeliveryAddress: "Industrial Zone Plot 1",
            ClosingDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            RequiredDeliveryDateUtc: null,
            TargetBudget: 50000m,
            Currency: "EGP",
            Notes: null,
            PublishImmediately: false,
            Items: [new CreateRfqItemRequest(categoryId, null, "Steel Rods", "Grade 60", 50, null, 1000m, null)],
            TargetSupplierCompanyId: buyerCompId);

        var selfRes = await client.PostAsJsonAsync("/api/v1/rfqs", selfTargetReq);
        Assert.Equal(HttpStatusCode.BadRequest, selfRes.StatusCode);

        // 2. Target another Buyer -> 400 Bad Request
        var buyerTargetReq = new CreateRfqRequest(
            Title: "Target Buyer RFQ",
            Description: "Need materials",
            TargetCategoryId: categoryId,
            DeliveryGovernorate: "Sharqia",
            DeliveryCity: "10th of Ramadan",
            DeliveryAddress: "Industrial Zone Plot 1",
            ClosingDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            RequiredDeliveryDateUtc: null,
            TargetBudget: 50000m,
            Currency: "EGP",
            Notes: null,
            PublishImmediately: false,
            Items: [new CreateRfqItemRequest(categoryId, null, "Steel Rods", "Grade 60", 50, null, 1000m, null)],
            TargetSupplierCompanyId: otherBuyerCompId);

        var buyerRes = await client.PostAsJsonAsync("/api/v1/rfqs", buyerTargetReq);
        Assert.Equal(HttpStatusCode.BadRequest, buyerRes.StatusCode);

        // 3. Target unverified Supplier -> 400 Bad Request
        var unverifiedTargetReq = new CreateRfqRequest(
            Title: "Target Unverified Supplier RFQ",
            Description: "Need materials",
            TargetCategoryId: categoryId,
            DeliveryGovernorate: "Sharqia",
            DeliveryCity: "10th of Ramadan",
            DeliveryAddress: "Industrial Zone Plot 1",
            ClosingDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            RequiredDeliveryDateUtc: null,
            TargetBudget: 50000m,
            Currency: "EGP",
            Notes: null,
            PublishImmediately: false,
            Items: [new CreateRfqItemRequest(categoryId, null, "Steel Rods", "Grade 60", 50, null, 1000m, null)],
            TargetSupplierCompanyId: unverifiedSupId);

        var unverifiedRes = await client.PostAsJsonAsync("/api/v1/rfqs", unverifiedTargetReq);
        Assert.Equal(HttpStatusCode.BadRequest, unverifiedRes.StatusCode);
    }

    [Fact]
    public async Task TargetedRfq_VisibilityIsolation_And_OfferSubmissionGuards()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, buyerCompId) = await CreateVerifiedCompanyAsync(factory, client, "t.buyer@dealzone.eg", "Targeted Buyer Ltd", "TgtBuyer", "Buyer");
        var (targetSupplierToken, targetSupplierCompId) = await CreateVerifiedCompanyAsync(factory, client, "t.supplier.a@dealzone.eg", "Supplier A Corp", "SupplierA", "Supplier");
        var (otherSupplierToken, otherSupplierCompId) = await CreateVerifiedCompanyAsync(factory, client, "t.supplier.b@dealzone.eg", "Supplier B Corp", "SupplierB", "Supplier");

        var catRes = await client.GetAsync("/api/v1/catalog/categories");
        var categories = await catRes.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        var categoryId = categories!.First().Id;

        // 1. Buyer creates targeted RFQ for Supplier A and publishes it
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var rfqReq = new CreateRfqRequest(
            Title: "Custom Industrial Pipes RFQ",
            Description: "Need PVC pipes",
            TargetCategoryId: categoryId,
            DeliveryGovernorate: "Sharqia",
            DeliveryCity: "10th of Ramadan",
            DeliveryAddress: "Plot 42 Industrial Park",
            ClosingDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            RequiredDeliveryDateUtc: null,
            TargetBudget: 25000m,
            Currency: "EGP",
            Notes: null,
            PublishImmediately: false,
            Items: [new CreateRfqItemRequest(categoryId, null, "Reinforced PVC Pipes", "Class 4", 100, null, 250m, null)],
            TargetSupplierCompanyId: targetSupplierCompId);

        var createRes = await client.PostAsJsonAsync("/api/v1/rfqs", rfqReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var rfq = await createRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);
        Assert.NotNull(rfq);

        var pubRes = await client.PostAsync($"/api/v1/rfqs/{rfq.Id}/publish", null);
        Assert.Equal(HttpStatusCode.OK, pubRes.StatusCode);

        // 2. Non-target Supplier B:
        // a) GET /rfqs/{id} -> 404 Not Found
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", otherSupplierToken);
        var nonTargetGetRes = await client.GetAsync($"/api/v1/rfqs/{rfq.Id}");
        Assert.Equal(HttpStatusCode.NotFound, nonTargetGetRes.StatusCode);

        // b) Discover feed GET /rfqs -> absent from results
        var nonTargetFeedRes = await client.GetAsync("/api/v1/rfqs");
        Assert.Equal(HttpStatusCode.OK, nonTargetFeedRes.StatusCode);
        var feedResult = await nonTargetFeedRes.Content.ReadFromJsonAsync<PagedResult<RfqSummaryResponse>>(JsonOptions);
        Assert.NotNull(feedResult);
        Assert.DoesNotContain(feedResult.Items, r => r.Id == rfq.Id);

        // c) Submit offer -> 404 Not Found
        var offerReq = new CreateOfferRequest(
            DeliveryLeadTimeDays: 7,
            ShippingIncluded: true,
            PaymentTerms: "Net 30",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: "Competitive offer",
            Items: [new CreateOfferItemRequest(rfq.Items[0].Id, 100, 240)]);

        var nonTargetOfferRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offerReq);
        Assert.Equal(HttpStatusCode.NotFound, nonTargetOfferRes.StatusCode);

        // 3. Target Supplier A:
        // a) Discover feed GET /rfqs -> present in results
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", targetSupplierToken);
        var targetFeedRes = await client.GetAsync("/api/v1/rfqs");
        Assert.Equal(HttpStatusCode.OK, targetFeedRes.StatusCode);
        var targetFeedResult = await targetFeedRes.Content.ReadFromJsonAsync<PagedResult<RfqSummaryResponse>>(JsonOptions);
        Assert.NotNull(targetFeedResult);
        Assert.Contains(targetFeedResult.Items, r => r.Id == rfq.Id);

        // b) GET /rfqs/{id} -> 200 OK
        var targetGetRes = await client.GetAsync($"/api/v1/rfqs/{rfq.Id}");
        Assert.Equal(HttpStatusCode.OK, targetGetRes.StatusCode);
        var targetDetail = await targetGetRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);
        Assert.NotNull(targetDetail);
        Assert.Equal(targetSupplierCompId, targetDetail.TargetSupplierCompanyId);

        // c) Target Supplier A submits offer -> 201 Created
        var targetOfferRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offerReq);
        Assert.Equal(HttpStatusCode.Created, targetOfferRes.StatusCode);
    }

    [Fact]
    public async Task PublishTargetedRfq_NotifiesOnlyTargetCompanyUsers_WithIdempotency()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "notif.buyer@dealzone.eg", "Buyer Notif Corp", "BuyerNotif", "Buyer");
        var (targetSupplierToken, targetSupplierCompId) = await CreateVerifiedCompanyAsync(factory, client, "notif.target@dealzone.eg", "Target Notif Corp", "TargetNotif", "Supplier");
        var (otherSupplierToken, otherSupplierCompId) = await CreateVerifiedCompanyAsync(factory, client, "notif.other@dealzone.eg", "Other Notif Corp", "OtherNotif", "Supplier");

        var catRes = await client.GetAsync("/api/v1/catalog/categories");
        var categories = await catRes.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        var categoryId = categories!.First().Id;

        // 1. Buyer creates targeted RFQ for Target Supplier
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var rfqReq = new CreateRfqRequest(
            Title: "Targeted Chemical Solvents RFQ",
            Description: "Solvents",
            TargetCategoryId: categoryId,
            DeliveryGovernorate: "Sharqia",
            DeliveryCity: "10th of Ramadan",
            DeliveryAddress: "Sector 5",
            ClosingDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            RequiredDeliveryDateUtc: null,
            TargetBudget: 300000m,
            Currency: "EGP",
            Notes: null,
            PublishImmediately: false,
            Items: [new CreateRfqItemRequest(categoryId, null, "Industrial Ethanol 99%", "Purity 99.5%", 20, null, 15000m, null)],
            TargetSupplierCompanyId: targetSupplierCompId);

        var createRes = await client.PostAsJsonAsync("/api/v1/rfqs", rfqReq);
        var rfq = await createRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);
        Assert.NotNull(rfq);

        // 2. Publish RFQ
        var pubRes = await client.PostAsync($"/api/v1/rfqs/{rfq.Id}/publish", null);
        Assert.Equal(HttpStatusCode.OK, pubRes.StatusCode);

        // 3. Inspect notifications in DB
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();

            // Target company members should have NotificationType.RfqReceived (19)
            var targetUserIds = await db.CompanyMembers
                .Where(m => m.CompanyId == targetSupplierCompId)
                .Select(m => m.UserId)
                .ToListAsync();

            var targetNotifications = await db.Notifications
                .Where(n => targetUserIds.Contains(n.UserId) && n.RelatedEntityId == rfq.Id)
                .ToListAsync();

            Assert.NotEmpty(targetNotifications);
            foreach (var notif in targetNotifications)
            {
                Assert.Equal(NotificationType.RfqReceived, notif.Type);
                Assert.StartsWith($"rfq-received:{rfq.Id}:", notif.IdempotencyKey);
            }

            // Non-target company members should have ZERO notifications for this RFQ
            var otherUserIds = await db.CompanyMembers
                .Where(m => m.CompanyId == otherSupplierCompId)
                .Select(m => m.UserId)
                .ToListAsync();

            var otherNotifications = await db.Notifications
                .Where(n => otherUserIds.Contains(n.UserId) && n.RelatedEntityId == rfq.Id)
                .ToListAsync();

            Assert.Empty(otherNotifications);
        }
    }

    [Fact]
    public async Task TargetedRfq_TargetImmutable_And_NotificationIdempotency()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "immut.buyer@dealzone.eg", "Immut Buyer Corp", "ImmutBuyer", "Buyer");
        var (targetSupplierToken, targetSupplierCompId) = await CreateVerifiedCompanyAsync(factory, client, "immut.target@dealzone.eg", "Immut Target Corp", "ImmutTarget", "Supplier");

        var catRes = await client.GetAsync("/api/v1/catalog/categories");
        var categories = await catRes.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        var categoryId = categories!.First().Id;

        // 1. Create targeted RFQ
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var rfqReq = new CreateRfqRequest(
            Title: "Immutable Target RFQ",
            Description: "Testing target immutability",
            TargetCategoryId: categoryId,
            DeliveryGovernorate: "Sharqia",
            DeliveryCity: "10th of Ramadan",
            DeliveryAddress: "Sector 12",
            ClosingDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            RequiredDeliveryDateUtc: null,
            TargetBudget: 100000m,
            Currency: "EGP",
            Notes: null,
            PublishImmediately: false,
            Items: [new CreateRfqItemRequest(categoryId, null, "Raw Copper Rods", "Grade A", 10, null, 10000m, null)],
            TargetSupplierCompanyId: targetSupplierCompId);

        var createRes = await client.PostAsJsonAsync("/api/v1/rfqs", rfqReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var rfq = await createRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);
        Assert.NotNull(rfq);
        Assert.Equal(targetSupplierCompId, rfq.TargetSupplierCompanyId);

        // 2. Publish RFQ
        var pubRes = await client.PostAsync($"/api/v1/rfqs/{rfq.Id}/publish", null);
        Assert.Equal(HttpStatusCode.OK, pubRes.StatusCode);

        // 3. Attempt to publish again -> Conflict (cannot publish already published RFQ)
        var repatPubRes = await client.PostAsync($"/api/v1/rfqs/{rfq.Id}/publish", null);
        Assert.Equal(HttpStatusCode.Conflict, repatPubRes.StatusCode);

        // 4. Update RFQ details (title, budget) and verify TargetSupplierCompanyId remains strictly immutable
        var updateReq = new UpdateRfqRequest(
            Title: "Immutable Target RFQ Updated Title",
            Description: "Updated description",
            TargetCategoryId: categoryId,
            DeliveryGovernorate: "Sharqia",
            DeliveryCity: "10th of Ramadan",
            DeliveryAddress: "Sector 12 Updated",
            ClosingDateUtc: DateTimeOffset.UtcNow.AddDays(8),
            RequiredDeliveryDateUtc: null,
            TargetBudget: 120000m,
            Currency: "EGP",
            Notes: "Updated notes",
            Items: null);

        var updateRes = await client.PutAsJsonAsync($"/api/v1/rfqs/{rfq.Id}", updateReq);
        Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);

        var getRes = await client.GetAsync($"/api/v1/rfqs/{rfq.Id}");
        var updatedDetail = await getRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);
        Assert.NotNull(updatedDetail);
        Assert.Equal(targetSupplierCompId, updatedDetail.TargetSupplierCompanyId);
        Assert.Equal("Immutable Target RFQ Updated Title", updatedDetail.Title);

        // 5. Verify notification count is exactly 1 per eligible user (idempotency key enforced)
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var targetNotifications = await db.Notifications
                .Where(n => n.RelatedEntityId == rfq.Id)
                .ToListAsync();

            Assert.NotEmpty(targetNotifications);
            var distinctKeys = targetNotifications.Select(n => n.IdempotencyKey).Distinct().Count();
            Assert.Equal(targetNotifications.Count, distinctKeys);
        }
    }
}
