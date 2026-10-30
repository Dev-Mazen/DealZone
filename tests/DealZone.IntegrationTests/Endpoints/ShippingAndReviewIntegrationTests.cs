using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Companies.DTOs;
using DealZone.Application.Deals.DTOs;
using DealZone.Application.Offers.DTOs;
using DealZone.Application.Reviews.DTOs;
using DealZone.Application.Rfqs.DTOs;
using DealZone.Application.Shipping.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Shipping;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class ShippingAndReviewIntegrationTests
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

    private static async Task<string> CreateAdminAndLoginAsync(
        DealZoneWebApplicationFactory factory,
        HttpClient client,
        string email)
    {
        var reg = new RegisterRequest(email, "AdminPassword2026!", "Admin User", "+201011122233");
        await client.PostAsJsonAsync("/api/v1/auth/register", reg);

        var confirm = DevelopmentEmailService.SentEmails.Last(e => e.Email == email && e.Purpose == "EmailConfirmation");
        await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(email, confirm.Token));

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var user = await db.Users.FirstAsync(u => u.Email == email);
            user.IsSystemAdmin = true;
            await db.SaveChangesAsync();
        }

        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "AdminPassword2026!"));
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
            "Manufacturer description",
            "https://testcompany.eg",
            $"TAX-SR-{uniqueNum}",
            $"CRN-SR-{uniqueNum}",
            $"contact.{uniqueNum}@testcompany.eg",
            "+201011112222",
            "Industrial Area",
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

    private static async Task<(Guid dealId, string buyerToken, string supplierToken)> CreateConfirmedDealAsync(
        DealZoneWebApplicationFactory factory,
        HttpClient client,
        string prefix)
    {
        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, $"{prefix}.buyer@dealzone.eg", $"{prefix} Buyer Ltd", $"{prefix}Buyer");
        var (supplierToken, _) = await CreateVerifiedCompanyAsync(factory, client, $"{prefix}.supp@dealzone.eg", $"{prefix} Supplier SAE", $"{prefix}Supp");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var catRes = await client.GetAsync("/api/v1/catalog/categories");
        var categories = await catRes.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        var categoryId = categories!.First().Id;

        var rfqReq = new CreateRfqRequest(
            "Raw Steel Procurement",
            "Description",
            categoryId,
            "Cairo",
            "Helwan",
            "Zone 5",
            DateTimeOffset.UtcNow.AddDays(7),
            DateTimeOffset.UtcNow.AddDays(14),
            200000m,
            "EGP",
            "Standard terms",
            PublishImmediately: true,
            Items: new List<CreateRfqItemRequest>
            {
                new(categoryId, null, "Raw Steel Plates", "Spec", 5, null, 40000, "Notes")
            });

        var rfqRes = await client.PostAsJsonAsync("/api/v1/rfqs", rfqReq);
        var rfq = await rfqRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var offerReq = new CreateOfferRequest(
            DeliveryLeadTimeDays: 7,
            ShippingIncluded: false,
            PaymentTerms: "Net 30",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(10),
            Currency: "EGP",
            Notes: null,
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq!.Items.First().Id, 39000, 5, null, null)
            });

        var offerRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offerReq);
        var offer = await offerRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);

        // Buyer accepts offer -> Deal created in AwaitingConfirmation
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var acceptRes = await client.PostAsJsonAsync($"/api/v1/offers/{offer!.Id}/accept", new AcceptOfferRequest());
        var acceptedOffer = await acceptRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        var dealId = acceptedOffer!.DealId!.Value;

        // Mutual confirmations -> Confirmed
        await client.PostAsync($"/api/v1/deals/{dealId}/confirm", null);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        await client.PostAsync($"/api/v1/deals/{dealId}/confirm", null);

        return (dealId, buyerToken, supplierToken);
    }

    [Fact]
    public async Task Shipment_Workflow_And_DeliveredDoesNotCompleteDeal()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (dealId, buyerToken, supplierToken) = await CreateConfirmedDealAsync(factory, client, "ship1");

        // Supplier creates shipment
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var shipReq = new CreateShipmentRequest(
            ShippingArrangement.SupplierArranged,
            "Warehouse 14, 10th of Ramadan",
            "Helwan Plant Site",
            CarrierName: "Nile Cargo Transport",
            TrackingNumber: "TRK-2026-999");

        var createShipRes = await client.PostAsJsonAsync($"/api/v1/deals/{dealId}/shipments", shipReq);
        Assert.Equal(HttpStatusCode.Created, createShipRes.StatusCode);
        var shipment = await createShipRes.Content.ReadFromJsonAsync<ShipmentResponse>(JsonOptions);
        Assert.NotNull(shipment);
        Assert.Equal("Pending", shipment.Status);

        // Progress status: Pending -> PickedUp -> InTransit -> Delivered
        await client.PostAsJsonAsync($"/api/v1/shipments/{shipment.Id}/status", new UpdateShipmentStatusRequest(ShipmentStatus.PickedUp, "Warehouse 14", "Driver arrived"));
        await client.PostAsJsonAsync($"/api/v1/shipments/{shipment.Id}/status", new UpdateShipmentStatusRequest(ShipmentStatus.InTransit, "Cairo Ring Road", "En route"));
        var delRes = await client.PostAsJsonAsync($"/api/v1/shipments/{shipment.Id}/status", new UpdateShipmentStatusRequest(ShipmentStatus.Delivered, "Helwan Site", "Delivered to receiving dock"));
        Assert.Equal(HttpStatusCode.OK, delRes.StatusCode);

        var deliveredShipment = await delRes.Content.ReadFromJsonAsync<ShipmentResponse>(JsonOptions);
        Assert.Equal("Delivered", deliveredShipment!.Status);
        Assert.NotNull(deliveredShipment.ActualDeliveryDateUtc);

        // CRITICAL CHECK: Deal must NOT be automatically Completed!
        var dealRes = await client.GetAsync($"/api/v1/deals/{dealId}");
        var deal = await dealRes.Content.ReadFromJsonAsync<DealDetailResponse>(JsonOptions);
        Assert.Equal("InProgress", deal!.Status);
        Assert.Null(deal.CompletedAtUtc);
    }

    [Fact]
    public async Task NonParticipant_CannotAccessShipment_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (dealId, _, supplierToken) = await CreateConfirmedDealAsync(factory, client, "ship2");
        var (thirdPartyToken, _) = await CreateVerifiedCompanyAsync(factory, client, "third.ship@dealzone.eg", "Third Party Cargo", "ThirdCargo");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var shipReq = new CreateShipmentRequest(
            ShippingArrangement.SupplierArranged,
            "Pickup Loc",
            "Delivery Loc");
        var shipRes = await client.PostAsJsonAsync($"/api/v1/deals/{dealId}/shipments", shipReq);
        var shipment = await shipRes.Content.ReadFromJsonAsync<ShipmentResponse>(JsonOptions);

        // 3rd party tries to access shipment
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", thirdPartyToken);
        var getRes = await client.GetAsync($"/api/v1/shipments/{shipment!.Id}");
        Assert.Equal(HttpStatusCode.Forbidden, getRes.StatusCode);
    }

    [Fact]
    public async Task Supplier_CannotAssignDealZoneProvider_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (dealId, _, supplierToken) = await CreateConfirmedDealAsync(factory, client, "ship3");

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var shipReq = new CreateShipmentRequest(
            ShippingArrangement.DealZoneArranged,
            "Pickup Loc",
            "Delivery Loc");
        var shipRes = await client.PostAsJsonAsync($"/api/v1/deals/{dealId}/shipments", shipReq);
        var shipment = await shipRes.Content.ReadFromJsonAsync<ShipmentResponse>(JsonOptions);

        // Supplier tries to assign provider directly via admin route
        var assignReq = new AssignShippingProviderRequest(Guid.NewGuid());
        var assignRes = await client.PostAsJsonAsync($"/api/v1/admin/shipments/{shipment!.Id}/assign-provider", assignReq);
        Assert.Equal(HttpStatusCode.Forbidden, assignRes.StatusCode);
    }

    [Fact]
    public async Task Review_Workflow_Guards_And_DuplicatePrevention()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (dealId, buyerToken, supplierToken) = await CreateConfirmedDealAsync(factory, client, "rev1");
        var (thirdPartyToken, _) = await CreateVerifiedCompanyAsync(factory, client, "third.rev@dealzone.eg", "Third Reviewer SAE", "ThirdRev");

        // 1. Cannot review before deal is Completed (deal is currently Confirmed)
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var prematureRev = await client.PostAsJsonAsync($"/api/v1/deals/{dealId}/reviews", new CreateReviewRequest(5, "Excellent service"));
        Assert.Equal(HttpStatusCode.Conflict, prematureRev.StatusCode);

        // 2. Start and Complete the deal
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        await client.PostAsync($"/api/v1/deals/{dealId}/start", null);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var compRes = await client.PostAsync($"/api/v1/deals/{dealId}/complete", null);
        Assert.Equal(HttpStatusCode.OK, compRes.StatusCode);

        // 3. Non-participant cannot review the completed deal
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", thirdPartyToken);
        var nonPartRes = await client.PostAsJsonAsync($"/api/v1/deals/{dealId}/reviews", new CreateReviewRequest(5, "I was not in this deal"));
        Assert.Equal(HttpStatusCode.Forbidden, nonPartRes.StatusCode);

        // 4. Buyer successfully submits review
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var validRev = await client.PostAsJsonAsync($"/api/v1/deals/{dealId}/reviews", new CreateReviewRequest(5, "Delivered on schedule with mill test certs."));
        Assert.Equal(HttpStatusCode.Created, validRev.StatusCode);
        var review = await validRev.Content.ReadFromJsonAsync<ReviewResponse>(JsonOptions);
        Assert.NotNull(review);
        Assert.Equal(5, review.Rating);

        // 5. Duplicate review by same buyer company is prevented
        var dupRev = await client.PostAsJsonAsync($"/api/v1/deals/{dealId}/reviews", new CreateReviewRequest(4, "Second review attempt"));
        Assert.Equal(HttpStatusCode.Conflict, dupRev.StatusCode);

        // 6. Supplier can also submit its review
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var suppRev = await client.PostAsJsonAsync($"/api/v1/deals/{dealId}/reviews", new CreateReviewRequest(5, "Professional buyer, prompt payment."));
        Assert.Equal(HttpStatusCode.Created, suppRev.StatusCode);

        // 7. Verify both reviews are queryable
        var listRes = await client.GetAsync($"/api/v1/deals/{dealId}/reviews");
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);
        var reviews = await listRes.Content.ReadFromJsonAsync<List<ReviewResponse>>(JsonOptions);
        Assert.Equal(2, reviews!.Count);
    }
}

