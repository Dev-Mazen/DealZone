using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Companies.DTOs;
using DealZone.Application.Purchasing.DTOs;
using DealZone.Application.Rfqs.DTOs;
using DealZone.Domain.Companies;
using DealZone.Domain.Deals;
using DealZone.Infrastructure.Options;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class AuthorizationPoliciesIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private static async Task<string> RegisterAndLoginAsync(HttpClient client, string email)
    {
        var phone = $"+2010{Random.Shared.Next(10000000, 99999999)}";
        var reg = new RegisterRequest(email, "StrongPassword2026!", "Test User", phone);
        await client.PostAsJsonAsync("/api/v1/auth/register", reg);

        var confirm = DevelopmentEmailService.SentEmails.Last(e => e.Email == email && e.Purpose == "EmailConfirmation");
        await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(email, confirm.Token));

        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "StrongPassword2026!"));
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return auth!.AccessToken;
    }

    private static async Task<(string token, Guid companyId, Guid userId)> CreateCompanyAsync(
        DealZoneWebApplicationFactory factory,
        HttpClient client,
        string email,
        string legalName,
        string tradeName,
        string companyType,
        bool isVerified = true)
    {
        var token = await RegisterAndLoginAsync(client, email);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var suffix = Guid.NewGuid().ToString("N")[..8];
        var compReq = new CreateCompanyRequest(
            $"{legalName} {suffix}",
            $"{tradeName} {suffix}",
            "Heavy Manufacturing",
            "Cairo",
            "Cairo",
            "Description",
            $"https://dealzone-{suffix}.eg",
            $"TAX-{suffix}",
            $"CRN-{suffix}",
            $"contact.{suffix}@dealzone.eg",
            $"+2010{Random.Shared.Next(10000000, 99999999)}",
            "123 Industrial St",
            null,
            null,
            companyType);

        var compRes = await client.PostAsJsonAsync("/api/v1/companies", compReq);
        Assert.Equal(HttpStatusCode.Created, compRes.StatusCode);
        var company = await compRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);

        Guid userId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var comp = await db.Companies.FirstAsync(c => c.Id == company!.Id);
            if (isVerified)
            {
                comp.VerificationStatus = CompanyVerificationStatus.Approved;
                comp.VerifiedAtUtc = DateTimeOffset.UtcNow;
            }
            await db.SaveChangesAsync();

            var user = await db.Users.FirstAsync(u => u.Email == email);
            userId = user.Id;
        }

        var reLoginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "StrongPassword2026!"));
        var reAuth = await reLoginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return (reAuth!.AccessToken, company!.Id, userId);
    }

    [Fact]
    public async Task BuyerCompany_BlockedFromSupplierSalesEndpoints_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, _, _) = await CreateCompanyAsync(
            factory, client, $"auth.buyer.{Guid.NewGuid():N}@dealzone.eg", "Buyer Alpha SAE", "Buyer Alpha", "Buyer", isVerified: true);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);

        // Buyer attempts to submit an offer -> SupplierSales required -> 403 Forbidden
        var submitRes = await client.PostAsJsonAsync($"/api/v1/rfqs/{Guid.NewGuid()}/offers", new
        {
            TotalOfferPrice = 1000m,
            Currency = "EGP",
            ValidityPeriodDays = 30,
            DeliveryLeadTimeDays = 5,
            Items = new object[] { }
        });

        Assert.Equal(HttpStatusCode.Forbidden, submitRes.StatusCode);

        // Buyer attempts to create catalog product -> SupplierSales required -> 403 Forbidden
        var createProdRes = await client.PostAsJsonAsync("/api/v1/catalog/products", new
        {
            MaterialId = Guid.NewGuid(),
            Sku = "SKU-BUYER-TEST",
            ProductNameAr = "منتج تجريبي",
            ProductNameEn = "Test Product",
            UnitPrice = 500m,
            UnitCode = "TON",
            MinOrderQuantity = 1m
        });

        Assert.Equal(HttpStatusCode.Forbidden, createProdRes.StatusCode);
    }

    [Fact]
    public async Task SupplierCompany_BlockedFromBuyerProcurementEndpoints_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (supplierToken, _, _) = await CreateCompanyAsync(
            factory, client, $"auth.supplier.{Guid.NewGuid():N}@dealzone.eg", "Supplier Beta SAE", "Supplier Beta", "Supplier", isVerified: true);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);

        // Supplier attempts to create RFQ -> BuyerProcurement required -> 403 Forbidden
        var createRfqRes = await client.PostAsJsonAsync("/api/v1/rfqs", new
        {
            Title = "Supplier RFQ",
            DeliveryGovernorate = "Cairo",
            DeliveryCity = "Maadi",
            DeliveryAddress = "Street 9",
            ExpectedDeliveryDate = DateTimeOffset.UtcNow.AddDays(14),
            Currency = "EGP",
            Items = new object[] { }
        });

        Assert.Equal(HttpStatusCode.Forbidden, createRfqRes.StatusCode);

        // Supplier attempts to create direct purchase -> BuyerProcurement required -> 403 Forbidden
        var purchaseRes = await client.PostAsJsonAsync("/api/v1/purchases/direct", new
        {
            CatalogProductId = Guid.NewGuid(),
            Quantity = 10m
        });

        Assert.Equal(HttpStatusCode.Forbidden, purchaseRes.StatusCode);
    }

    [Fact]
    public async Task UnverifiedCompany_BlockedFromCommercialActivities_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (unverifiedBuyerToken, _, _) = await CreateCompanyAsync(
            factory, client, $"unverified.buyer.{Guid.NewGuid():N}@dealzone.eg", "Unverified Buyer SAE", "Unverified Buyer", "Buyer", isVerified: false);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", unverifiedBuyerToken);

        // Unverified buyer cannot create RFQ -> VerifiedCompany required -> 403 Forbidden
        var rfqRes = await client.PostAsJsonAsync("/api/v1/rfqs", new
        {
            Title = "Unverified RFQ",
            DeliveryGovernorate = "Cairo",
            DeliveryCity = "Maadi",
            DeliveryAddress = "Street 9",
            ExpectedDeliveryDate = DateTimeOffset.UtcNow.AddDays(14),
            Currency = "EGP",
            Items = new object[] { }
        });

        Assert.Equal(HttpStatusCode.Forbidden, rfqRes.StatusCode);

        // Unverified supplier cannot create product
        var (unverifiedSupplierToken, _, _) = await CreateCompanyAsync(
            factory, client, $"unverified.supp.{Guid.NewGuid():N}@dealzone.eg", "Unverified Supp SAE", "Unverified Supp", "Supplier", isVerified: false);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", unverifiedSupplierToken);

        var prodRes = await client.PostAsJsonAsync("/api/v1/catalog/products", new
        {
            MaterialId = Guid.NewGuid(),
            Sku = "SKU-UNVERIFIED",
            ProductNameAr = "منتج",
            ProductNameEn = "Product",
            UnitPrice = 100m,
            UnitCode = "TON",
            MinOrderQuantity = 1m
        });

        Assert.Equal(HttpStatusCode.Forbidden, prodRes.StatusCode);
    }

    [Fact]
    public async Task DeactivatedUserMembership_ImmediatelyBlockedOnNextRequest_WithoutWaitingForTokenExpiry()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (token, companyId, userId) = await CreateCompanyAsync(
            factory, client, $"deactivated.member.{Guid.NewGuid():N}@dealzone.eg", "Deactivation Test SAE", "Deact Test", "Buyer", isVerified: true);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Request 1 works normally
        var meRes = await client.GetAsync("/api/v1/companies/me");
        Assert.Equal(HttpStatusCode.OK, meRes.StatusCode);

        // Deactivate user in database directly (simulating membership revocation or account deactivation)
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var member = await db.CompanyMembers.FirstAsync(m => m.UserId == userId && m.CompanyId == companyId);
            member.IsActive = false;
            await db.SaveChangesAsync();
        }

        // Request 2 with the EXACT same token: immediately rejected because authority is evaluated live against DB
        var nextMeRes = await client.GetAsync("/api/v1/companies/me");
        Assert.Equal(HttpStatusCode.NotFound, nextMeRes.StatusCode); // Or Forbidden/NotFound since company membership is gone
    }

    [Fact]
    public async Task SpoofedAdminToken_OnNonAdminUserInDb_IsRejectedWithForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (token, _, userId) = await CreateCompanyAsync(
            factory, client, $"spoof.user.{Guid.NewGuid():N}@dealzone.eg", "Spoof Test SAE", "Spoof Test", "Buyer", isVerified: true);

        // Forge a token carrying spoofed admin claims for this non-admin user
        string spoofedAdminToken;
        using (var scope = factory.Services.CreateScope())
        {
            var jwtOptions = scope.ServiceProvider.GetRequiredService<IOptions<JwtSettings>>().Value;
            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new(ClaimTypes.NameIdentifier, userId.ToString()),
                new(ClaimTypes.Role, "SystemAdmin"),
                new("UserRole", "SystemAdmin"),
                new("is_system_admin", "true")
            };
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey));
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(30),
                Issuer = jwtOptions.Issuer,
                Audience = jwtOptions.Audience,
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            };
            var handler = new JwtSecurityTokenHandler();
            spoofedAdminToken = handler.WriteToken(handler.CreateToken(tokenDescriptor));
        }

        // Send request to an admin-only endpoint
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", spoofedAdminToken);
        var adminRes = await client.GetAsync("/api/v1/admin/analytics");

        // SystemAdminAuthorizationHandler checks ICurrentCompanyContext, which queries _dbContext.Users directly.
        // User in DB is NOT SystemAdmin -> returns 403 Forbidden!
        Assert.Equal(HttpStatusCode.Forbidden, adminRes.StatusCode);
    }

    [Fact]
    public async Task UnverifiedParticipant_CannotConfirmDeal_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, buyerCompId, buyerUserId) = await CreateCompanyAsync(
            factory, client, $"deal.unver.buyer.{Guid.NewGuid():N}@dealzone.eg", "Deal Unver Buyer", "UnverBuyer", "Buyer", isVerified: true);
        var (suppToken, suppCompId, _) = await CreateCompanyAsync(
            factory, client, $"deal.unver.supp.{Guid.NewGuid():N}@dealzone.eg", "Deal Unver Supp", "UnverSupp", "Supplier", isVerified: true);

        Guid dealId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var deal = new Deal
            {
                DealNumber = $"DZ-DEAL-{Guid.NewGuid():N}"[..18],
                BuyerCompanyId = buyerCompId,
                SupplierCompanyId = suppCompId,
                AgreedPrice = 50000m,
                Currency = "EGP",
                Status = DealStatus.AwaitingConfirmation,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };
            db.Deals.Add(deal);
            await db.SaveChangesAsync();
            dealId = deal.Id;

            // Unverify the buyer company in the database
            var buyerComp = await db.Companies.FirstAsync(c => c.Id == buyerCompId);
            buyerComp.VerificationStatus = CompanyVerificationStatus.Pending;
            buyerComp.VerifiedAtUtc = null;
            await db.SaveChangesAsync();
        }

        // Unverified buyer attempts to confirm deal -> 403 Forbidden
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var confirmRes = await client.PostAsync($"/api/v1/deals/{dealId}/confirm", null);
        Assert.Equal(HttpStatusCode.Forbidden, confirmRes.StatusCode);
    }

    [Fact]
    public async Task PlainMember_CannotConfirmDeal_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, buyerCompId, buyerUserId) = await CreateCompanyAsync(
            factory, client, $"deal.plain.buyer.{Guid.NewGuid():N}@dealzone.eg", "Deal Plain Buyer", "PlainBuyer", "Buyer", isVerified: true);
        var (suppToken, suppCompId, _) = await CreateCompanyAsync(
            factory, client, $"deal.plain.supp.{Guid.NewGuid():N}@dealzone.eg", "Deal Plain Supp", "PlainSupp", "Supplier", isVerified: true);

        Guid dealId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var deal = new Deal
            {
                DealNumber = $"DZ-DEAL-{Guid.NewGuid():N}"[..18],
                BuyerCompanyId = buyerCompId,
                SupplierCompanyId = suppCompId,
                AgreedPrice = 50000m,
                Currency = "EGP",
                Status = DealStatus.AwaitingConfirmation,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };
            db.Deals.Add(deal);

            // Change buyer user's role to Member (plain employee without procurement permissions)
            var member = await db.CompanyMembers.FirstAsync(m => m.UserId == buyerUserId && m.CompanyId == buyerCompId);
            member.Role = CompanyRole.Member;
            await db.SaveChangesAsync();
            dealId = deal.Id;
        }

        // Plain Member attempts to confirm deal -> 403 Forbidden
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", buyerToken);
        var confirmRes = await client.PostAsync($"/api/v1/deals/{dealId}/confirm", null);
        Assert.Equal(HttpStatusCode.Forbidden, confirmRes.StatusCode);
    }

    [Fact]
    public async Task NonParticipant_CannotConfirmDeal_ReturnsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var (buyerToken, buyerCompId, _) = await CreateCompanyAsync(
            factory, client, $"deal.part.buyer.{Guid.NewGuid():N}@dealzone.eg", "Deal Part Buyer", "PartBuyer", "Buyer", isVerified: true);
        var (suppToken, suppCompId, _) = await CreateCompanyAsync(
            factory, client, $"deal.part.supp.{Guid.NewGuid():N}@dealzone.eg", "Deal Part Supp", "PartSupp", "Supplier", isVerified: true);
        var (thirdPartyToken, _, _) = await CreateCompanyAsync(
            factory, client, $"deal.third.buyer.{Guid.NewGuid():N}@dealzone.eg", "Deal Third Buyer", "ThirdBuyer", "Buyer", isVerified: true);

        Guid dealId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var deal = new Deal
            {
                DealNumber = $"DZ-DEAL-{Guid.NewGuid():N}"[..18],
                BuyerCompanyId = buyerCompId,
                SupplierCompanyId = suppCompId,
                AgreedPrice = 50000m,
                Currency = "EGP",
                Status = DealStatus.AwaitingConfirmation,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };
            db.Deals.Add(deal);
            await db.SaveChangesAsync();
            dealId = deal.Id;
        }

        // Third-party company attempts to confirm deal -> 403 Forbidden
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", thirdPartyToken);
        var confirmRes = await client.PostAsync($"/api/v1/deals/{dealId}/confirm", null);
        Assert.Equal(HttpStatusCode.Forbidden, confirmRes.StatusCode);
    }
}
