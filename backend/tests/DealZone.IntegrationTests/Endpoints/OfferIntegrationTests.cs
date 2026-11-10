using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Companies.DTOs;
using DealZone.Application.Offers.DTOs;
using DealZone.Application.Rfqs.DTOs;
using DealZone.Domain.Companies;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class OfferIntegrationTests
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
            "Manufacturer description",
            "https://testcompany.eg",
            $"TAX-OFF-{uniqueNum}",
            $"CRN-OFF-{uniqueNum}",
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

    private static async Task<RfqDetailResponse> CreateAndPublishRfqAsync(
        HttpClient client,
        string buyerToken)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        var catRes = await client.GetAsync("/api/v1/catalog/categories");
        var categories = await catRes.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        var categoryId = categories!.First().Id;

        var rfqReq = new CreateRfqRequest(
            "Procurement of High Grade Steel",
            "Needed for factory expansion",
            categoryId,
            "Cairo",
            "Helwan",
            "Plot 15, Industrial Zone",
            DateTimeOffset.UtcNow.AddDays(10),
            DateTimeOffset.UtcNow.AddDays(20),
            1000000m,
            "EGP",
            "Standard delivery",
            PublishImmediately: true,
            Items: new List<CreateRfqItemRequest>
            {
                new(categoryId, null, "Structural Steel Beams HEB 200", "Grade S275JR", 20, null, 40000, "Mill test certs")
            });

        var rfqRes = await client.PostAsJsonAsync("/api/v1/rfqs", rfqReq);
        Assert.Equal(HttpStatusCode.Created, rfqRes.StatusCode);
        var rfq = await rfqRes.Content.ReadFromJsonAsync<RfqDetailResponse>(JsonOptions);
        Assert.NotNull(rfq);
        return rfq;
    }

    [Fact]
    public async Task UnverifiedSupplier_CannotSubmitOffer_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.unv@dealzone.eg", "Buyer Corp", "BuyerCorp");
        var rfq = await CreateAndPublishRfqAsync(client, buyerToken);

        // Create an unverified company
        var unvToken = await RegisterAndLoginAsync(client, "unv.supp@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", unvToken);

        var uniqueNum = Random.Shared.Next(100000, 999999).ToString();
        var compReq = new CreateCompanyRequest(
            "Unverified Supplier SAE",
            "UnvSupp",
            "Metals Trading",
            "Cairo",
            "Cairo",
            null,
            null,
            $"TAX-U-{uniqueNum}",
            $"CRN-U-{uniqueNum}",
            $"u.{uniqueNum}@dealzone.eg",
            "+201000000000",
            "Street 1",
            null,
            null);
        await client.PostAsJsonAsync("/api/v1/companies", compReq);

        var offerReq = new CreateOfferRequest(
            DeliveryLeadTimeDays: 7,
            ShippingIncluded: true,
            PaymentTerms: "Bank Transfer",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: null,
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 38000, 20, null, null)
            });

        var offerRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offerReq);
        Assert.Equal(HttpStatusCode.Forbidden, offerRes.StatusCode);
    }

    [Fact]
    public async Task Supplier_CannotOfferOnOwnRfq_ReturnsConflict()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.own@dealzone.eg", "Self Supplier SAE", "SelfSupp");
        var rfq = await CreateAndPublishRfqAsync(client, buyerToken);

        var offerReq = new CreateOfferRequest(
            DeliveryLeadTimeDays: 5,
            ShippingIncluded: false,
            PaymentTerms: "Immediate",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            Currency: "EGP",
            Notes: null,
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 39000, 20, null, null)
            });

        // Calling with the same buyer's token
        var offerRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offerReq);
        Assert.Equal(HttpStatusCode.Conflict, offerRes.StatusCode);
    }

    [Fact]
    public async Task ClosedRfq_CannotReceiveOffers_ReturnsConflict()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.closed@dealzone.eg", "Buyer Closed SAE", "BuyerClosed");
        var rfq = await CreateAndPublishRfqAsync(client, buyerToken);

        // Buyer closes the RFQ
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var closeRes = await client.PostAsync($"/api/v1/rfqs/{rfq.Id}/close", null);
        Assert.Equal(HttpStatusCode.OK, closeRes.StatusCode);

        // Supplier attempts to submit offer
        var (suppToken, _) = await CreateVerifiedCompanyAsync(factory, client, "supp.closed@dealzone.eg", "Supplier Closed SAE", "SuppClosed");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken);

        var offerReq = new CreateOfferRequest(
            DeliveryLeadTimeDays: 5,
            ShippingIncluded: false,
            PaymentTerms: "Cash",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(7),
            Currency: "EGP",
            Notes: null,
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 37000, 20, null, null)
            });

        var offerRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offerReq);
        Assert.Equal(HttpStatusCode.Conflict, offerRes.StatusCode);
    }

    [Fact]
    public async Task OfferItems_MustMatchRfqItems_InvalidItemReturnsValidationError()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.match@dealzone.eg", "Buyer Match SAE", "BuyerMatch");
        var rfq = await CreateAndPublishRfqAsync(client, buyerToken);

        var (suppToken, _) = await CreateVerifiedCompanyAsync(factory, client, "supp.match@dealzone.eg", "Supplier Match SAE", "SuppMatch");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken);

        // Offer contains a nonexistent RfqItemId
        var offerReq = new CreateOfferRequest(
            DeliveryLeadTimeDays: 7,
            ShippingIncluded: true,
            PaymentTerms: "Bank Transfer",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: null,
            Items: new List<CreateOfferItemRequest>
            {
                new(Guid.NewGuid(), 35000, 20, null, null)
            });

        var offerRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offerReq);
        Assert.Equal(HttpStatusCode.BadRequest, offerRes.StatusCode);
    }

    [Fact]
    public async Task Supplier_CannotReviseAnotherSupplierOffer_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.idor@dealzone.eg", "Buyer Idor SAE", "BuyerIdor");
        var rfq = await CreateAndPublishRfqAsync(client, buyerToken);

        // Supplier 1 submits offer
        var (supp1Token, _) = await CreateVerifiedCompanyAsync(factory, client, "supp1.idor@dealzone.eg", "Supplier 1 SAE", "Supp1");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supp1Token);

        var offerReq = new CreateOfferRequest(
            DeliveryLeadTimeDays: 10,
            ShippingIncluded: true,
            PaymentTerms: "Bank Transfer",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: null,
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 36000, 20, null, null)
            });

        var offerRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offerReq);
        Assert.Equal(HttpStatusCode.Created, offerRes.StatusCode);
        var createdOffer = await offerRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);

        // Supplier 2 attempts to revise Supplier 1's offer
        var (supp2Token, _) = await CreateVerifiedCompanyAsync(factory, client, "supp2.idor@dealzone.eg", "Supplier 2 SAE", "Supp2");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supp2Token);

        var reviseReq = new ReviseOfferRequest(
            DeliveryLeadTimeDays: 5,
            ShippingIncluded: true,
            PaymentTerms: "Cash",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: null,
            ChangeSummary: "Snoop discount",
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 34000, 20, null, null)
            });

        var reviseRes = await client.PostAsJsonAsync($"/api/v1/offers/{createdOffer!.Id}/revise", reviseReq);
        Assert.Equal(HttpStatusCode.Forbidden, reviseRes.StatusCode);
    }

    [Fact]
    public async Task Revision_PreservesPreviousValues_AndIncrementsRevisionNumber()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.rev@dealzone.eg", "Buyer Rev SAE", "BuyerRev");
        var rfq = await CreateAndPublishRfqAsync(client, buyerToken);

        var (suppToken, _) = await CreateVerifiedCompanyAsync(factory, client, "supp.rev@dealzone.eg", "Supplier Rev SAE", "SuppRev");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken);

        // 1. Initial Offer
        var initialReq = new CreateOfferRequest(
            DeliveryLeadTimeDays: 10,
            ShippingIncluded: false,
            PaymentTerms: "30 days net",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: "Initial quotation",
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 38000, 20, null, null)
            });

        var initRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", initialReq);
        Assert.Equal(HttpStatusCode.Created, initRes.StatusCode);
        var v1 = await initRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        Assert.NotNull(v1);
        Assert.Equal(1, v1.RevisionNumber);
        Assert.Equal("Submitted", v1.Status);
        Assert.Equal(760000m, v1.TotalAmount);

        // 2. Revise Offer
        var reviseReq = new ReviseOfferRequest(
            DeliveryLeadTimeDays: 7,
            ShippingIncluded: true,
            PaymentTerms: "50% advance, 50% on delivery",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(20),
            Currency: "EGP",
            Notes: "Updated terms with faster lead time",
            ChangeSummary: "Reduced lead time to 7 days and included shipping",
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 36000, 20, null, null)
            });

        var revRes = await client.PostAsJsonAsync($"/api/v1/offers/{v1.Id}/revise", reviseReq);
        Assert.Equal(HttpStatusCode.Created, revRes.StatusCode);
        var v2 = await revRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        Assert.NotNull(v2);
        Assert.Equal(2, v2.RevisionNumber);
        Assert.Equal("Submitted", v2.Status);
        Assert.Equal(720000m, v2.TotalAmount);
        Assert.Equal(v1.Id, v2.OriginalOfferId);
        Assert.Contains("-R2", v2.OfferNumber);

        // 3. Verify V1 is now Superseded and historical values are preserved
        var getV1Res = await client.GetAsync($"/api/v1/offers/{v1.Id}");
        Assert.Equal(HttpStatusCode.OK, getV1Res.StatusCode);
        var fetchedV1 = await getV1Res.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        Assert.NotNull(fetchedV1);
        Assert.Equal("Superseded", fetchedV1.Status);
        Assert.Equal(760000m, fetchedV1.TotalAmount);
        Assert.Equal(10, fetchedV1.DeliveryLeadTimeDays);

        // 4. Verify Revision lineage
        var lineageRes = await client.GetAsync($"/api/v1/offers/{v2.Id}/revisions");
        Assert.Equal(HttpStatusCode.OK, lineageRes.StatusCode);
        var revisions = await lineageRes.Content.ReadFromJsonAsync<List<OfferRevisionSummaryResponse>>(JsonOptions);
        Assert.NotNull(revisions);
        Assert.Equal(2, revisions.Count);
        Assert.Equal(1, revisions[0].RevisionNumber);
        Assert.Equal(2, revisions[1].RevisionNumber);
    }

    [Fact]
    public async Task Buyer_CannotViewAnotherCompanyRfqOffers_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerA, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.a.view@dealzone.eg", "Buyer A SAE", "BuyerA");
        var rfq = await CreateAndPublishRfqAsync(client, buyerA);

        var (buyerB, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.b.view@dealzone.eg", "Buyer B SAE", "BuyerB");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerB);

        var offersRes = await client.GetAsync($"/api/v1/rfqs/{rfq.Id}/offers");
        Assert.Equal(HttpStatusCode.Forbidden, offersRes.StatusCode);
    }

    [Fact]
    public async Task OnlyOwningBuyer_CanAcceptOffer_AndCompetingOffersAreRejected()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.accept@dealzone.eg", "Buyer Accept SAE", "BuyerAccept");
        var rfq = await CreateAndPublishRfqAsync(client, buyerToken);

        // Supplier 1 submits Offer 1
        var (supp1Token, _) = await CreateVerifiedCompanyAsync(factory, client, "supp1.comp@dealzone.eg", "Supplier 1 Comp SAE", "Supp1Comp");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supp1Token);

        var offer1Req = new CreateOfferRequest(
            DeliveryLeadTimeDays: 7,
            ShippingIncluded: true,
            PaymentTerms: "Bank Transfer",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: "Offer 1",
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 37000, 20, null, null)
            });

        var o1Res = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offer1Req);
        Assert.Equal(HttpStatusCode.Created, o1Res.StatusCode);
        var offer1 = await o1Res.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);

        // Supplier 2 submits Offer 2
        var (supp2Token, _) = await CreateVerifiedCompanyAsync(factory, client, "supp2.comp@dealzone.eg", "Supplier 2 Comp SAE", "Supp2Comp");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supp2Token);

        var offer2Req = new CreateOfferRequest(
            DeliveryLeadTimeDays: 5,
            ShippingIncluded: true,
            PaymentTerms: "Bank Transfer",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: "Offer 2",
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 35000, 20, null, null)
            });

        var o2Res = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offer2Req);
        Assert.Equal(HttpStatusCode.Created, o2Res.StatusCode);
        var offer2 = await o2Res.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);

        // Third-party buyer attempts to accept Offer 2 -> Forbidden
        var (thirdPartyToken, _) = await CreateVerifiedCompanyAsync(factory, client, "third.party@dealzone.eg", "Third Party SAE", "ThirdParty");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", thirdPartyToken);
        var unauthAcceptRes = await client.PostAsync($"/api/v1/offers/{offer2!.Id}/accept", null);
        Assert.Equal(HttpStatusCode.Forbidden, unauthAcceptRes.StatusCode);

        // Owning buyer accepts Offer 2
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var acceptRes = await client.PostAsync($"/api/v1/offers/{offer2.Id}/accept", null);
        Assert.Equal(HttpStatusCode.OK, acceptRes.StatusCode);
        var acceptedOffer = await acceptRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        Assert.NotNull(acceptedOffer);
        Assert.Equal("Accepted", acceptedOffer.Status);
        Assert.NotNull(acceptedOffer.AcceptedAtUtc);

        // Verify competing Offer 1 was automatically Rejected
        var getO1Res = await client.GetAsync($"/api/v1/offers/{offer1!.Id}");
        Assert.Equal(HttpStatusCode.OK, getO1Res.StatusCode);
        var rejectedO1 = await getO1Res.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        Assert.NotNull(rejectedO1);
        Assert.Equal("Rejected", rejectedO1.Status);
        Assert.Equal("Another offer was accepted for this RFQ.", rejectedO1.RejectionReason);

        // Attempting to accept Offer 1 now returns Conflict (RFQ is closed and offer is already rejected)
        var secondAcceptRes = await client.PostAsync($"/api/v1/offers/{offer1.Id}/accept", null);
        Assert.Equal(HttpStatusCode.Conflict, secondAcceptRes.StatusCode);
    }

    [Fact]
    public async Task OfferWithdrawal_LifecycleAndAuthorization_EnforcesAllInvariants()
    {
        var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.wth@dealzone.eg", "Buyer WTH SAE", "BuyerWth");
        var rfq = await CreateAndPublishRfqAsync(client, buyerToken);

        var (suppToken, _) = await CreateVerifiedCompanyAsync(factory, client, "supp.wth@dealzone.eg", "Supplier WTH SAE", "SuppWth");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken);

        var offerReq = new CreateOfferRequest(
            DeliveryLeadTimeDays: 7,
            ShippingIncluded: true,
            PaymentTerms: "Cash on delivery",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: "Withdrawal test offer",
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 32000, 10, null, null)
            });

        var createRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offerReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var createdOffer = await createRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        Assert.NotNull(createdOffer);

        // 1. Unauthorized supplier cannot withdraw another supplier's offer
        var (otherSuppToken, _) = await CreateVerifiedCompanyAsync(factory, client, "other.wth@dealzone.eg", "Other WTH SAE", "OtherWth");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", otherSuppToken);

        var unauthWithdraw = await client.PostAsJsonAsync($"/api/v1/offers/{createdOffer.Id}/withdraw", new WithdrawOfferRequest("Illegitimate"));
        Assert.Equal(HttpStatusCode.Forbidden, unauthWithdraw.StatusCode);

        // 2. Owning supplier successfully withdraws offer
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken);
        var withdrawRes = await client.PostAsJsonAsync($"/api/v1/offers/{createdOffer.Id}/withdraw", new WithdrawOfferRequest("Material stock sold to domestic partner"));
        Assert.Equal(HttpStatusCode.OK, withdrawRes.StatusCode);

        var withdrawnOffer = await withdrawRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        Assert.NotNull(withdrawnOffer);
        Assert.Equal("Withdrawn", withdrawnOffer.Status);
        Assert.Equal("Material stock sold to domestic partner", withdrawnOffer.WithdrawalReason);
        Assert.NotNull(withdrawnOffer.WithdrawnAtUtc);

        // 3. Duplicate withdrawal is idempotent and returns 200 OK
        var duplicateWithdraw = await client.PostAsJsonAsync($"/api/v1/offers/{createdOffer.Id}/withdraw", new WithdrawOfferRequest("Material stock sold to domestic partner"));
        Assert.Equal(HttpStatusCode.OK, duplicateWithdraw.StatusCode);

        // 4. Buyer cannot accept a withdrawn offer -> Conflict
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var acceptWithdrawnRes = await client.PostAsync($"/api/v1/offers/{createdOffer.Id}/accept", null);
        Assert.Equal(HttpStatusCode.Conflict, acceptWithdrawnRes.StatusCode);
    }

    [Fact]
    public async Task OfferWithdrawal_AfterAcceptanceAndSupersession_ReturnsConflict()
    {
        var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.supwth@dealzone.eg", "Buyer SupWth SAE", "BuyerSupWth");
        var rfq = await CreateAndPublishRfqAsync(client, buyerToken);

        var (suppToken, _) = await CreateVerifiedCompanyAsync(factory, client, "supp.supwth@dealzone.eg", "Supplier SupWth SAE", "SuppSupWth");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken);

        var offerReq = new CreateOfferRequest(
            DeliveryLeadTimeDays: 7,
            ShippingIncluded: true,
            PaymentTerms: "Bank Transfer",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: "Initial offer R1",
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 40000, 15, null, null)
            });

        var createRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offerReq);
        var offerR1 = await createRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);

        // Revise offer -> R1 becomes Superseded, R2 is created
        var reviseReq = new ReviseOfferRequest(
            DeliveryLeadTimeDays: 5,
            ShippingIncluded: true,
            PaymentTerms: "Bank Transfer",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: "Revised offer R2",
            ChangeSummary: "Lowered lead time",
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 39000, 15, null, null)
            });

        var reviseRes = await client.PostAsJsonAsync($"/api/v1/offers/{offerR1!.Id}/revise", reviseReq);
        Assert.Equal(HttpStatusCode.Created, reviseRes.StatusCode);
        var offerR2 = await reviseRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);

        // Attempt to withdraw superseded offer R1 -> Conflict
        var withdrawR1Res = await client.PostAsJsonAsync($"/api/v1/offers/{offerR1.Id}/withdraw", new WithdrawOfferRequest("Old offer"));
        Assert.Equal(HttpStatusCode.Conflict, withdrawR1Res.StatusCode);

        // Buyer accepts R2
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var acceptRes = await client.PostAsync($"/api/v1/offers/{offerR2!.Id}/accept", null);
        Assert.Equal(HttpStatusCode.OK, acceptRes.StatusCode);

        // Attempt to withdraw accepted offer R2 -> Conflict
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken);
        var withdrawR2Res = await client.PostAsJsonAsync($"/api/v1/offers/{offerR2.Id}/withdraw", new WithdrawOfferRequest("Accepted offer"));
        Assert.Equal(HttpStatusCode.Conflict, withdrawR2Res.StatusCode);
    }

    [Fact]
    public async Task OfferAcceptance_ExpiredOffer_ReturnsConflictAndDoesNotCreateDeal()
    {
        var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.exp@dealzone.eg", "Buyer Exp SAE", "BuyerExp");
        var rfq = await CreateAndPublishRfqAsync(client, buyerToken);

        var (suppToken, _) = await CreateVerifiedCompanyAsync(factory, client, "supp.exp@dealzone.eg", "Supplier Exp SAE", "SuppExp");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken);

        var offerReq = new CreateOfferRequest(
            DeliveryLeadTimeDays: 7,
            ShippingIncluded: true,
            PaymentTerms: "Letter of Credit",
            ValidityDateUtc: DateTimeOffset.UtcNow.AddDays(14),
            Currency: "EGP",
            Notes: "Will expire in DB directly",
            Items: new List<CreateOfferItemRequest>
            {
                new(rfq.Items.First().Id, 30000, 10, null, null)
            });

        var createRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", offerReq);
        var offer = await createRes.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);

        // Manually age the offer validity to the past in database
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var dbOffer = await db.Offers.FirstAsync(o => o.Id == offer!.Id);
            dbOffer.ValidityDateUtc = DateTimeOffset.UtcNow.AddDays(-1);
            await db.SaveChangesAsync();
        }

        // Buyer attempts to accept expired offer -> Conflict
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var acceptRes = await client.PostAsync($"/api/v1/offers/{offer!.Id}/accept", null);
        Assert.Equal(HttpStatusCode.Conflict, acceptRes.StatusCode);

        // Verify no Deal was created
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var dealExists = await db.Deals.AnyAsync(d => d.OfferId == offer.Id);
            Assert.False(dealExists);
        }
    }

    [Fact]
    public async Task OfferExpiryProcessor_BatchExpiresPastValidityOffers_LeavesActiveUntouched()
    {
        var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(factory, client, "buyer.batch@dealzone.eg", "Buyer Batch SAE", "BuyerBatch");
        var rfq = await CreateAndPublishRfqAsync(client, buyerToken);

        var (suppToken, _) = await CreateVerifiedCompanyAsync(factory, client, "supp.batch@dealzone.eg", "Supplier Batch SAE", "SuppBatch");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken);

        // Create 2 offers
        var req1 = new CreateOfferRequest(7, true, "Cash", DateTimeOffset.UtcNow.AddDays(14), "EGP", "Offer 1",
            new List<CreateOfferItemRequest> { new(rfq.Items.First().Id, 25000, 5, null, null) });
        var res1 = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", req1);
        var offer1 = await res1.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);

        var (suppToken2, _) = await CreateVerifiedCompanyAsync(factory, client, "supp.batch2@dealzone.eg", "Supplier Batch 2 SAE", "SuppBatch2");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken2);

        var req2 = new CreateOfferRequest(7, true, "Cash", DateTimeOffset.UtcNow.AddDays(14), "EGP", "Offer 2",
            new List<CreateOfferItemRequest> { new(rfq.Items.First().Id, 26000, 5, null, null) });
        var res2 = await client.PostAsJsonAsync($"/api/v1/rfqs/{rfq.Id}/offers", req2);
        res2.EnsureSuccessStatusCode();
        var offer2 = await res2.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);

        // Age offer1 in database
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var dbOffer1 = await db.Offers.FirstAsync(o => o.Id == offer1!.Id);
            dbOffer1.ValidityDateUtc = DateTimeOffset.UtcNow.AddHours(-2);
            await db.SaveChangesAsync();
        }

        // Run processor from factory scope
        using (var scope = factory.Services.CreateScope())
        {
            var processor = scope.ServiceProvider.GetRequiredService<DealZone.Application.Common.Interfaces.IOfferExpiryProcessor>();
            var expiredCount = await processor.ProcessExpiredOffersAsync();
            Assert.True(expiredCount >= 1);
        }

        // Verify offer 1 is Expired (as supplier 1) and offer 2 is still Submitted (as supplier 2)
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken);
        var getO1 = await client.GetAsync($"/api/v1/offers/{offer1!.Id}");
        getO1.EnsureSuccessStatusCode();
        var o1 = await getO1.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        Assert.Equal("Expired", o1!.Status);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", suppToken2);
        var getO2 = await client.GetAsync($"/api/v1/offers/{offer2!.Id}");
        getO2.EnsureSuccessStatusCode();
        var o2 = await getO2.Content.ReadFromJsonAsync<OfferDetailResponse>(JsonOptions);
        Assert.Equal("Submitted", o2!.Status);
    }
}

