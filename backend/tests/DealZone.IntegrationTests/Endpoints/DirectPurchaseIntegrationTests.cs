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
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Domain.Purchasing;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class DirectPurchaseIntegrationTests : IClassFixture<DealZoneWebApplicationFactory>
{
    private readonly DealZoneWebApplicationFactory _factory;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public DirectPurchaseIntegrationTests(DealZoneWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static async Task<string> RegisterAndLoginAsync(HttpClient client, string email)
    {
        var reg = new RegisterRequest(email, "StrongPassword2026!", "Purchase User", "+201099988877");
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
        string companyType = "Buyer")
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
            "https://testpurchase.eg",
            $"TAX-{uniqueNum}",
            $"CRN-{uniqueNum}",
            $"ops.{uniqueNum}@testpurchase.eg",
            "+201011112222",
            "12 Industrial St",
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

    private async Task<Guid> GetSeededMaterialIdAsync(HttpClient client)
    {
        var res = await client.GetAsync("/api/v1/catalog/materials");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var materials = await res.Content.ReadFromJsonAsync<PagedResult<MaterialDto>>(JsonOptions);
        Assert.NotNull(materials);
        Assert.NotEmpty(materials.Items);
        return materials.Items[0].Id;
    }

    [Fact]
    public async Task DirectPurchase_EndToEndFlow_CreatesDealAndUpdatesStatus()
    {
        var client = _factory.CreateClient();
        var suffix = Random.Shared.Next(10000, 99999);

        // 1. Setup Supplier
        var (supplierToken, supplierCompId) = await CreateVerifiedCompanyAsync(
            client, $"supplier.{suffix}@directtest.eg", $"Supplier Co {suffix}", "Supplier Trades", "Supplier");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);

        var materialId = await GetSeededMaterialIdAsync(client);

        // 2. Supplier creates a Catalog Product
        var createProductReq = new CreateCatalogProductRequest(
            materialId,
            $"SKU-DIR-{suffix}",
            "منتج مباشر نسيجي",
            "Direct Textile Product",
            "أقمشة قطنية عالية الجودة",
            "High quality cotton textile",
            120m, // Unit price
            "EGP",
            100m, // Stock
            5m,   // MOQ
            3);   // Lead time

        var createProdRes = await client.PostAsJsonAsync("/api/v1/catalog/products", createProductReq);
        var createProdBody = await createProdRes.Content.ReadAsStringAsync();
        Assert.True(createProdRes.StatusCode == HttpStatusCode.Created, $"CreateProduct failed with {createProdRes.StatusCode}: {createProdBody}");
        var product = await createProdRes.Content.ReadFromJsonAsync<CatalogProductResponse>(JsonOptions);
        Assert.NotNull(product);
        Assert.Equal(100m, product.AvailableQuantity);
        Assert.Equal(120m, product.UnitPrice);

        // 3. Setup Buyer
        var (buyerToken, buyerCompId) = await CreateVerifiedCompanyAsync(
            client, $"buyer.{suffix}@directtest.eg", $"Buyer Co {suffix}", "Buyer Trades");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        // 4. Buyer executes Direct Purchase (Quantity = 10 -> Total = 1200)
        var purchaseReq = new CreateDirectPurchaseRequest(
            product.Id,
            10m,
            "15 Industrial Zone, Cairo",
            "Deliver during morning shifts.");

        var purchaseRes = await client.PostAsJsonAsync("/api/v1/purchases/direct", purchaseReq);
        Assert.Equal(HttpStatusCode.Created, purchaseRes.StatusCode);
        var purchase = await purchaseRes.Content.ReadFromJsonAsync<DirectPurchaseResponse>(JsonOptions);

        Assert.NotNull(purchase);
        Assert.Equal(10m, purchase.Quantity);
        Assert.Equal(120m, purchase.UnitPrice);
        Assert.Equal(1200m, purchase.Subtotal);
        Assert.Equal(0.14m, purchase.VatRate);
        Assert.Equal(168m, purchase.VatAmount);
        Assert.Equal(1368m, purchase.TotalPrice);
        Assert.Equal("Submitted", purchase.Status);
        Assert.NotNull(purchase.DealId);
        Assert.NotNull(purchase.DealNumber);

        // 5. Verify Deal was atomically created in AwaitingConfirmation
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var dealRes = await client.GetAsync($"/api/v1/deals/{purchase.DealId}");
        Assert.Equal(HttpStatusCode.OK, dealRes.StatusCode);
        var deal = await dealRes.Content.ReadFromJsonAsync<DealDetailResponse>(JsonOptions);

        Assert.NotNull(deal);
        Assert.Equal("AwaitingConfirmation", deal.Status);
        Assert.Equal("DirectPurchase", deal.DealSource);
        Assert.Equal(1368m, deal.AgreedPrice);
        Assert.NotNull(deal.ConfirmedByBuyerAtUtc);
        Assert.Null(deal.ConfirmedBySupplierAtUtc);

        // 6. Verify Supplier Stock was decremented (100 - 10 = 90)
        var getProdRes = await client.GetAsync($"/api/v1/catalog/products/{product.Id}");
        Assert.Equal(HttpStatusCode.OK, getProdRes.StatusCode);
        var updatedProd = await getProdRes.Content.ReadFromJsonAsync<CatalogProductResponse>(JsonOptions);
        Assert.NotNull(updatedProd);
        Assert.Equal(90m, updatedProd.AvailableQuantity);

        // 7. Supplier confirms the deal -> Deal becomes Confirmed, DirectPurchase becomes Confirmed
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var confirmRes = await client.PostAsync($"/api/v1/deals/{deal.Id}/confirm", null);
        Assert.Equal(HttpStatusCode.OK, confirmRes.StatusCode);
        var confirmedDeal = await confirmRes.Content.ReadFromJsonAsync<DealDetailResponse>(JsonOptions);
        Assert.NotNull(confirmedDeal);
        Assert.Equal("Confirmed", confirmedDeal.Status);

        // 8. Verify DirectPurchase status transitioned to Confirmed
        var getPurchRes = await client.GetAsync($"/api/v1/purchases/{purchase.Id}");
        Assert.Equal(HttpStatusCode.OK, getPurchRes.StatusCode);
        var confirmedPurchase = await getPurchRes.Content.ReadFromJsonAsync<DirectPurchaseResponse>(JsonOptions);
        Assert.NotNull(confirmedPurchase);
        Assert.Equal("Confirmed", confirmedPurchase.Status);
    }

    [Fact]
    public async Task DirectPurchase_SelfPurchase_FailsWithConflictOrBadRequest()
    {
        var client = _factory.CreateClient();
        var suffix = Random.Shared.Next(10000, 99999);

        var (supplierToken, _) = await CreateVerifiedCompanyAsync(
            client, $"self.{suffix}@directtest.eg", $"Self Co {suffix}", "Self Trades", "Supplier");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);

        var materialId = await GetSeededMaterialIdAsync(client);

        var createProdRes = await client.PostAsJsonAsync("/api/v1/catalog/products", new CreateCatalogProductRequest(
            materialId,
            $"SKU-SELF-{suffix}",
            "منتج ذاتي",
            "Self Product",
            null,
            null,
            50m,
            "EGP",
            20m,
            1m,
            2));
        var product = await createProdRes.Content.ReadFromJsonAsync<CatalogProductResponse>(JsonOptions);

        // Supplier attempts to purchase their own product
        var purchaseReq = new CreateDirectPurchaseRequest(product!.Id, 5m, null, null);
        var purchaseRes = await client.PostAsJsonAsync("/api/v1/purchases/direct", purchaseReq);

        Assert.True(purchaseRes.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.Conflict or HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DirectPurchase_BelowMOQ_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        var suffix = Random.Shared.Next(10000, 99999);

        var (supplierToken, _) = await CreateVerifiedCompanyAsync(
            client, $"suppmoq.{suffix}@directtest.eg", $"MOQ Supp {suffix}", "MOQ Trades", "Supplier");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var materialId = await GetSeededMaterialIdAsync(client);

        var createProdRes = await client.PostAsJsonAsync("/api/v1/catalog/products", new CreateCatalogProductRequest(
            materialId,
            $"SKU-MOQ-{suffix}",
            "منتج حد أدنى",
            "MOQ Product",
            null,
            null,
            100m,
            "EGP",
            500m,
            25m, // MOQ is 25
            5));
        var product = await createProdRes.Content.ReadFromJsonAsync<CatalogProductResponse>(JsonOptions);

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(
            client, $"buymoq.{suffix}@directtest.eg", $"MOQ Buyer {suffix}", "MOQ Buyer Trades");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        // Attempt to purchase 10 (less than MOQ of 25)
        var purchaseReq = new CreateDirectPurchaseRequest(product!.Id, 10m, null, null);
        var purchaseRes = await client.PostAsJsonAsync("/api/v1/purchases/direct", purchaseReq);

        Assert.Equal(HttpStatusCode.BadRequest, purchaseRes.StatusCode);
    }

    [Fact]
    public async Task DirectPurchase_InsufficientStock_ReturnsBadRequest()
    {
        var client = _factory.CreateClient();
        var suffix = Random.Shared.Next(10000, 99999);

        var (supplierToken, _) = await CreateVerifiedCompanyAsync(
            client, $"stocksupp.{suffix}@directtest.eg", $"Stock Supp {suffix}", "Stock Trades", "Supplier");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var materialId = await GetSeededMaterialIdAsync(client);

        var createProdRes = await client.PostAsJsonAsync("/api/v1/catalog/products", new CreateCatalogProductRequest(
            materialId,
            $"SKU-STK-{suffix}",
            "منتج مخزون محدود",
            "Limited Stock Product",
            null,
            null,
            100m,
            "EGP",
            15m, // Only 15 available
            1m,
            3));
        var product = await createProdRes.Content.ReadFromJsonAsync<CatalogProductResponse>(JsonOptions);

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(
            client, $"stockbuyer.{suffix}@directtest.eg", $"Stock Buyer {suffix}", "Stock Buyer Trades");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        // Attempt to purchase 50 (more than available 15) -> returns Conflict (409)
        var purchaseReq = new CreateDirectPurchaseRequest(product!.Id, 50m, null, null);
        var purchaseRes = await client.PostAsJsonAsync("/api/v1/purchases/direct", purchaseReq);

        Assert.Equal(HttpStatusCode.Conflict, purchaseRes.StatusCode);
    }

    [Fact]
    public async Task DirectPurchase_CrossCompanyIsolation_ReturnsForbidden()
    {
        var client = _factory.CreateClient();
        var suffix = Random.Shared.Next(10000, 99999);

        // Supplier + Product
        var (supplierToken, _) = await CreateVerifiedCompanyAsync(
            client, $"isolsupp.{suffix}@directtest.eg", $"Isol Supp {suffix}", "Isol Trades", "Supplier");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var materialId = await GetSeededMaterialIdAsync(client);

        var createProdRes = await client.PostAsJsonAsync("/api/v1/catalog/products", new CreateCatalogProductRequest(
            materialId,
            $"SKU-ISOL-{suffix}",
            "منتج عزل",
            "Isolation Product",
            null,
            null,
            100m,
            "EGP",
            100m,
            1m,
            3));
        var product = await createProdRes.Content.ReadFromJsonAsync<CatalogProductResponse>(JsonOptions);

        // Buyer purchases
        var (buyerToken, _) = await CreateVerifiedCompanyAsync(
            client, $"isolbuyer.{suffix}@directtest.eg", $"Isol Buyer {suffix}", "Isol Buyer Trades");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        var purchaseRes = await client.PostAsJsonAsync("/api/v1/purchases/direct", new CreateDirectPurchaseRequest(product!.Id, 5m, null, null));
        var purchase = await purchaseRes.Content.ReadFromJsonAsync<DirectPurchaseResponse>(JsonOptions);

        // Third unrelated company tries to access purchase
        var (thirdToken, _) = await CreateVerifiedCompanyAsync(
            client, $"thirdparty.{suffix}@directtest.eg", $"Third Co {suffix}", "Third Trades");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", thirdToken);

        var getRes = await client.GetAsync($"/api/v1/purchases/{purchase!.Id}");
        Assert.True(getRes.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DirectPurchase_Anonymous_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = null;

        var purchaseRes = await client.PostAsJsonAsync("/api/v1/purchases/direct", new CreateDirectPurchaseRequest(Guid.NewGuid(), 10m, null, null));
        Assert.Equal(HttpStatusCode.Unauthorized, purchaseRes.StatusCode);

        var getRes = await client.GetAsync($"/api/v1/purchases/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.Unauthorized, getRes.StatusCode);

        var getMineRes = await client.GetAsync("/api/v1/purchases/mine");
        Assert.Equal(HttpStatusCode.Unauthorized, getMineRes.StatusCode);
    }

    [Fact]
    public async Task DirectPurchase_DoubleSubmit_IsIdempotentWithClientRequestId()
    {
        var client = _factory.CreateClient();
        var suffix = Random.Shared.Next(10000, 99999);

        var (supplierToken, _) = await CreateVerifiedCompanyAsync(
            client, $"idemsupp.{suffix}@directtest.eg", $"Idem Supp {suffix}", "Idem Trades", "Supplier");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var materialId = await GetSeededMaterialIdAsync(client);

        var createProdRes = await client.PostAsJsonAsync("/api/v1/catalog/products", new CreateCatalogProductRequest(
            materialId,
            $"SKU-IDEM-{suffix}",
            "منتج تكرار الطلب",
            "Idempotency Product",
            null,
            null,
            200m,
            "EGP",
            100m,
            1m,
            3));
        var product = await createProdRes.Content.ReadFromJsonAsync<CatalogProductResponse>(JsonOptions);

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(
            client, $"idembuyer.{suffix}@directtest.eg", $"Idem Buyer {suffix}", "Idem Buyer Trades");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        var clientRequestId = $"req-{Guid.NewGuid():N}";
        var purchaseReq = new CreateDirectPurchaseRequest(
            product!.Id,
            5m,
            "123 Street",
            "First submit",
            clientRequestId);

        // 1. First submission
        var res1 = await client.PostAsJsonAsync("/api/v1/purchases/direct", purchaseReq);
        Assert.Equal(HttpStatusCode.Created, res1.StatusCode);
        var purchase1 = await res1.Content.ReadFromJsonAsync<DirectPurchaseResponse>(JsonOptions);

        // 2. Second submission with the exact same clientRequestId
        var res2 = await client.PostAsJsonAsync("/api/v1/purchases/direct", purchaseReq);
        Assert.True(res2.StatusCode is HttpStatusCode.OK or HttpStatusCode.Created);
        var purchase2 = await res2.Content.ReadFromJsonAsync<DirectPurchaseResponse>(JsonOptions);

        // Idempotency check: Same purchase returned
        Assert.Equal(purchase1!.Id, purchase2!.Id);
        Assert.Equal(purchase1.PurchaseNumber, purchase2.PurchaseNumber);

        // Inventory check: Only decremented once (100 - 5 = 95)
        var getProd = await client.GetAsync($"/api/v1/catalog/products/{product.Id}");
        var prod = await getProd.Content.ReadFromJsonAsync<CatalogProductResponse>(JsonOptions);
        Assert.Equal(95m, prod!.AvailableQuantity);
    }

    [Fact]
    public async Task Marketplace_ProductWithUnverifiedSupplier_IsHiddenFromListingAndDetail()
    {
        var client = _factory.CreateClient();
        var suffix = Random.Shared.Next(10000, 99999);

        // Create supplier and create a product while approved
        var (supplierToken, supplierCompId) = await CreateVerifiedCompanyAsync(
            client, $"unver.{suffix}@directtest.eg", $"Unver Supp {suffix}", "Unver Trades", "Supplier");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var materialId = await GetSeededMaterialIdAsync(client);

        var createProdRes = await client.PostAsJsonAsync("/api/v1/catalog/products", new CreateCatalogProductRequest(
            materialId,
            $"SKU-UNVER-{suffix}",
            "منتج مورد غير موثق",
            "Unverified Supplier Product",
            null,
            null,
            150m,
            "EGP",
            50m,
            1m,
            3));
        var product = await createProdRes.Content.ReadFromJsonAsync<CatalogProductResponse>(JsonOptions);

        // Now set supplier company to Pending in database
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var comp = await db.Companies.FirstAsync(c => c.Id == supplierCompId);
            comp.VerificationStatus = CompanyVerificationStatus.Pending;
            await db.SaveChangesAsync();
        }

        // Anonymous or buyer calls Marketplace listing
        client.DefaultRequestHeaders.Authorization = null;
        var listRes = await client.GetAsync("/api/v1/catalog/products");
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);
        var paged = await listRes.Content.ReadFromJsonAsync<PagedResult<CatalogProductResponse>>(JsonOptions);
        Assert.DoesNotContain(paged!.Items, p => p.Id == product!.Id);

        // Detail endpoint returns 404
        var detailRes = await client.GetAsync($"/api/v1/catalog/products/{product!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, detailRes.StatusCode);
    }

    [Fact]
    public async Task LegacyMaterialPurchaseEndpoint_IsDeletedAndReturnsNotFound()
    {
        var client = _factory.CreateClient();
        var suffix = Random.Shared.Next(10000, 99999);

        var (buyerToken, _) = await CreateVerifiedCompanyAsync(
            client, $"legbuyer.{suffix}@directtest.eg", $"Leg Buyer {suffix}", "Leg Trades");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        var materialId = await GetSeededMaterialIdAsync(client);
        var legacyRes = await client.PostAsJsonAsync($"/api/v1/catalog/materials/{materialId}/purchase", new { quantity = 10 });
        Assert.Equal(HttpStatusCode.NotFound, legacyRes.StatusCode);
    }

    [Fact]
    public async Task Negotiation_CounterOffer_ShouldSucceedWithoutConcurrencyConflict()
    {
        var client = _factory.CreateClient();
        var suffix = Random.Shared.Next(10000, 99999);

        // 1. Setup supplier and product
        var (supplierToken, supplierCompanyId) = await CreateVerifiedCompanyAsync(
            client, $"negsupp.{suffix}@directtest.eg", $"Neg Supp {suffix}", "Neg Supp Trades", "Supplier");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var materialId = await GetSeededMaterialIdAsync(client);

        var createProdRes = await client.PostAsJsonAsync("/api/v1/catalog/products", new CreateCatalogProductRequest(
            materialId,
            $"SKU-NEG-{suffix}",
            "منتج تفاوض",
            "Negotiation Product",
            null,
            null,
            100m,
            "EGP",
            500m,
            1m,
            5));
        var product = await createProdRes.Content.ReadFromJsonAsync<CatalogProductResponse>(JsonOptions);

        // 2. Setup buyer and start negotiation
        var (buyerToken, _) = await CreateVerifiedCompanyAsync(
            client, $"negbuyer.{suffix}@directtest.eg", $"Neg Buyer {suffix}", "Neg Buyer Trades", "Buyer");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        var startNegRes = await client.PostAsJsonAsync("/api/v1/negotiations", new CreateProductNegotiationRequest(
            product!.Id,
            90m,
            10m,
            7,
            "123 Test St",
            "Initial offer"));
        Assert.Equal(HttpStatusCode.Created, startNegRes.StatusCode);
        var neg = await startNegRes.Content.ReadFromJsonAsync<ProductNegotiationResponse>(JsonOptions);
        Assert.NotNull(neg);

        // 3. Supplier counters
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);
        var counterRes = await client.PostAsJsonAsync($"/api/v1/negotiations/{neg.Id}/counter", new CounterNegotiationRequest(
            95m,
            10m,
            5,
            "Counter offer from supplier"));

        if (!counterRes.IsSuccessStatusCode)
        {
            var errorBody = await counterRes.Content.ReadAsStringAsync();
            throw new Exception($"Counter failed with status {counterRes.StatusCode}: {errorBody}");
        }

        Assert.Equal(HttpStatusCode.OK, counterRes.StatusCode);
        var countered = await counterRes.Content.ReadFromJsonAsync<ProductNegotiationResponse>(JsonOptions);
        Assert.NotNull(countered);
        Assert.Equal(95m, countered.CurrentUnitPrice);
    }
}
