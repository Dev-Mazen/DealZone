using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Companies.DTOs;
using DealZone.Application.Deals.DTOs;
using DealZone.Application.Offers.DTOs;
using DealZone.Application.Rfqs.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class DealIntegrationTests
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
            $"TAX-DL-{uniqueNum}",
            $"CRN-DL-{uniqueNum}",
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

    private static async Task<(RfqDetailResponse rfq, OfferDetailResponse offer)> CreatePublishedRfqAndOfferAsync(
        HttpClient client,
        string buyerToken,
        string supplierToken)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        var catRes = await client.GetAsync("/api/v1/catalog/categories");
        var categories = await catRes.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        var categoryId = categories!.First().Id;

        var rfqReq = new CreateRfqRequest(
            "High Tensile Steel Supply",
            "Required for infrastructure contract",
            categoryId,
            "Cairo",
            "Helwan",
            "Industrial Zone 3",
            DateTimeOffset.UtcNow.AddDays(7),
            DateTimeOffset.UtcNow.AddDays(14),
            500000m,
            "EGP",
            "Delivery to site",
            PublishImmediately: true,
            Items: new List<CreateRfqItemRequest>
            {
                new(categoryId, null, "Steel Rebar Grade 60", "Specification A", 10, null, 25000, "Prime quality")
            });

        var rfqRes = await client.PostAsJsonAsync("/api/v1/rfqs", rfqReq);
        Assert.Equal(HttpStatusCode.Created, rfqRes.StatusCode);
        var rfq = await rfqRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var offerReq = new CreateOfferRequest(
            DeliveryLeadTimeDays: 5,
            ShippingIncluded: true,
            PaymentTerms: "Net 30",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(10),
            Currency: "EGP",
            Notes: "Guaranteed prime quality with test certificates",
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq!.Items.First().Id, 24500, 10, null, null)
            });

        var offerRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offerReq);
        Assert.Equal(HttpStatusCode.Created, offerRes.StatusCode);
        var offer = await offerRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);

        return (rfq, offer!);
    }

    [Fact]
    public async Task OfferAcceptance_CreatesDeal_InAwaitingConfirmationStatus_WithFrozenTerms()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "deal.buyer1@dealzone.eg", "Deal Buyer Ltd", "DealBuyer");
        var (supplierToken, _) = await CreateVerifiedCompanyAsync(factory, client, "deal.supp1@dealzone.eg", "Deal Supplier SAE", "DealSupp");

        var (rfq, offer) = await CreatePublishedRfqAndOfferAsync(client, buyerToken, supplierToken);

        // Accept offer
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var acceptRes = await client.PostAsJsonAsync($"/api/v1/offers/{offer.Id}/accept", new AcceptOfferRequest());
        Assert.Equal(HttpStatusCode.OK, acceptRes.StatusCode);

        var acceptedOffer = await acceptRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        Assert.NotNull(acceptedOffer);
        Assert.NotNull(acceptedOffer.DealId);

        // Fetch the deal
        var dealRes = await client.GetAsync($"/api/v1/deals/{acceptedOffer.DealId}");
        Assert.Equal(HttpStatusCode.OK, dealRes.StatusCode);

        var deal = await dealRes.Content.ReadFromJsonAsync<DealDetailResponse>(JsonOptions);
        Assert.NotNull(deal);
        Assert.Equal("AwaitingConfirmation", deal.Status);
        Assert.Equal(offer.TotalAmount, deal.AgreedPrice);
        Assert.Equal("EGP", deal.Currency);
        Assert.False(deal.ConfirmedByBuyer);
        Assert.False(deal.ConfirmedBySupplier);
        Assert.NotNull(deal.CommercialTerms);
        Assert.Equal(offer.TotalAmount, deal.CommercialTerms.TotalAmount);
        Assert.Single(deal.CommercialTerms.Items);
        Assert.Equal(24500m, deal.CommercialTerms.Items[0].UnitPrice);
    }

    [Fact]
    public async Task NonParticipant_CannotAccessDeal_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "deal.buyer2@dealzone.eg", "Deal Buyer 2", "DealBuyer2");
        var (supplierToken, _) = await CreateVerifiedCompanyAsync(factory, client, "deal.supp2@dealzone.eg", "Deal Supplier 2", "DealSupp2");
        var (thirdPartyToken, _) = await CreateVerifiedCompanyAsync(factory, client, "deal.third@dealzone.eg", "Third Party SAE", "ThirdParty");

        var (rfq, offer) = await CreatePublishedRfqAndOfferAsync(client, buyerToken, supplierToken);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var acceptRes = await client.PostAsJsonAsync($"/api/v1/offers/{offer.Id}/accept", new AcceptOfferRequest());
        var acceptedOffer = await acceptRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);

        // 3rd party attempts to read deal
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", thirdPartyToken);
        var forbiddenRes = await client.GetAsync($"/api/v1/deals/{acceptedOffer!.DealId}");
        Assert.Equal(HttpStatusCode.Forbidden, forbiddenRes.StatusCode);
    }

    [Fact]
    public async Task Confirmation_RequiresBothParties_TransitionsToConfirmed()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "deal.buyer3@dealzone.eg", "Deal Buyer 3", "DealBuyer3");
        var (supplierToken, _) = await CreateVerifiedCompanyAsync(factory, client, "deal.supp3@dealzone.eg", "Deal Supplier 3", "DealSupp3");

        var (rfq, offer) = await CreatePublishedRfqAndOfferAsync(client, buyerToken, supplierToken);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var acceptRes = await client.PostAsJsonAsync($"/api/v1/offers/{offer.Id}/accept", new AcceptOfferRequest());
        var acceptedOffer = await acceptRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        var dealId = acceptedOffer!.DealId!.Value;

        // 1. Buyer confirms first
        var buyerConfirmRes = await client.PostAsync($"/api/v1/deals/{dealId}/confirm", null);
        Assert.Equal(HttpStatusCode.OK, buyerConfirmRes.StatusCode);
        var dealAfterBuyer = await buyerConfirmRes.Content.ReadFromJsonAsync<DealDetailResponse>(JsonOptions);
        Assert.Equal("AwaitingConfirmation", dealAfterBuyer!.Status);
        Assert.True(dealAfterBuyer.ConfirmedByBuyer);
        Assert.False(dealAfterBuyer.ConfirmedBySupplier);

        // 2. Supplier confirms second
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var suppConfirmRes = await client.PostAsync($"/api/v1/deals/{dealId}/confirm", null);
        Assert.Equal(HttpStatusCode.OK, suppConfirmRes.StatusCode);
        var dealAfterBoth = await suppConfirmRes.Content.ReadFromJsonAsync<DealDetailResponse>(JsonOptions);
        Assert.Equal("Confirmed", dealAfterBoth!.Status);
        Assert.True(dealAfterBoth.ConfirmedByBuyer);
        Assert.True(dealAfterBoth.ConfirmedBySupplier);
        Assert.NotNull(dealAfterBoth.ConfirmedAtUtc);
    }

    [Fact]
    public async Task DealLifecycle_StartAndComplete_TransitionsProperly()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "deal.buyer4@dealzone.eg", "Deal Buyer 4", "DealBuyer4");
        var (supplierToken, _) = await CreateVerifiedCompanyAsync(factory, client, "deal.supp4@dealzone.eg", "Deal Supplier 4", "DealSupp4");

        var (rfq, offer) = await CreatePublishedRfqAndOfferAsync(client, buyerToken, supplierToken);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var acceptRes = await client.PostAsJsonAsync($"/api/v1/offers/{offer.Id}/accept", new AcceptOfferRequest());
        var acceptedOffer = await acceptRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        var dealId = acceptedOffer!.DealId!.Value;

        // Confirm both
        await client.PostAsync($"/api/v1/deals/{dealId}/confirm", null);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        await client.PostAsync($"/api/v1/deals/{dealId}/confirm", null);

        // Supplier starts work
        var startRes = await client.PostAsync($"/api/v1/deals/{dealId}/start", null);
        Assert.Equal(HttpStatusCode.OK, startRes.StatusCode);
        var startedDeal = await startRes.Content.ReadFromJsonAsync<DealDetailResponse>(JsonOptions);
        Assert.Equal("InProgress", startedDeal!.Status);
        Assert.NotNull(startedDeal.StartedAtUtc);

        // Buyer completes work
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var completeRes = await client.PostAsync($"/api/v1/deals/{dealId}/complete", null);
        Assert.Equal(HttpStatusCode.OK, completeRes.StatusCode);
        var completedDeal = await completeRes.Content.ReadFromJsonAsync<DealDetailResponse>(JsonOptions);
        Assert.Equal("Completed", completedDeal!.Status);
        Assert.NotNull(completedDeal.CompletedAtUtc);

        // Cannot cancel completed deal
        var cancelRes = await client.PostAsJsonAsync($"/api/v1/deals/{dealId}/cancel", new CancelDealRequest("Attempt to cancel completed"));
        Assert.Equal(HttpStatusCode.Conflict, cancelRes.StatusCode);
    }

    [Fact]
    public async Task DisputeWorkflow_OpenDisputeAndAdminResolve_ResumesDeal()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var adminToken = await CreateAdminAndLoginAsync(factory, client, "deal.admin@dealzone.eg");
        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "deal.buyer5@dealzone.eg", "Deal Buyer 5", "DealBuyer5");
        var (supplierToken, _) = await CreateVerifiedCompanyAsync(factory, client, "deal.supp5@dealzone.eg", "Deal Supplier 5", "DealSupp5");

        var (rfq, offer) = await CreatePublishedRfqAndOfferAsync(client, buyerToken, supplierToken);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var acceptRes = await client.PostAsJsonAsync($"/api/v1/offers/{offer.Id}/accept", new AcceptOfferRequest());
        var acceptedOffer = await acceptRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        var dealId = acceptedOffer!.DealId!.Value;

        // Confirm both and start work
        await client.PostAsync($"/api/v1/deals/{dealId}/confirm", null);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        await client.PostAsync($"/api/v1/deals/{dealId}/confirm", null);
        await client.PostAsync($"/api/v1/deals/{dealId}/start", null);

        // Buyer opens a dispute
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var disputeReq = new CreateDisputeRequest(DisputeCategory.QualityDefect, "Material received does not meet Grade 60 standard.");
        var disputeRes = await client.PostAsJsonAsync($"/api/v1/deals/{dealId}/disputes", disputeReq);
        Assert.Equal(HttpStatusCode.Created, disputeRes.StatusCode);
        var dispute = await disputeRes.Content.ReadFromJsonAsync<DisputeDetailResponse>(JsonOptions);
        Assert.NotNull(dispute);
        Assert.Equal("Open", dispute.Status);

        // Verify Deal is now Disputed
        var dealRes = await client.GetAsync($"/api/v1/deals/{dealId}");
        var disputedDeal = await dealRes.Content.ReadFromJsonAsync<DealDetailResponse>(JsonOptions);
        Assert.Equal("Disputed", disputedDeal!.Status);

        // Unauthorized user cannot resolve
        var unauthResolve = await client.PostAsJsonAsync($"/api/v1/admin/disputes/{dispute.Id}/resolve",
            new ResolveDisputeRequest(DisputeResolutionAction.ResumeDeal, "Attempted resolution without admin role"));
        Assert.Equal(HttpStatusCode.Forbidden, unauthResolve.StatusCode);

        // System Admin resolves dispute with ResumeDeal
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var adminResolveRes = await client.PostAsJsonAsync($"/api/v1/admin/disputes/{dispute.Id}/resolve",
            new ResolveDisputeRequest(DisputeResolutionAction.ResumeDeal, "Inspection conducted and material verified compliant. Resuming deal."));
        Assert.Equal(HttpStatusCode.OK, adminResolveRes.StatusCode);

        // Verify Deal is resumed to InProgress
        var resumedDealRes = await client.GetAsync($"/api/v1/deals/{dealId}");
        var resumedDeal = await resumedDealRes.Content.ReadFromJsonAsync<DealDetailResponse>(JsonOptions);
        Assert.Equal("InProgress", resumedDeal!.Status);
    }
}

