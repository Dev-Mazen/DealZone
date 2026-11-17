using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Companies.DTOs;
using DealZone.Application.Common.Models;
using DealZone.Domain.Companies;
using DealZone.Infrastructure.Persistence;
using DealZone.Infrastructure.Services;
using DealZone.IntegrationTests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DealZone.IntegrationTests.Endpoints;

public class CatalogIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private static async Task<string> RegisterAndLoginAsync(HttpClient client, string email)
    {
        var reg = new RegisterRequest(email, "StrongPassword2026!", "Regular User", "+201099988877");
        await client.PostAsJsonAsync("/api/v1/auth/register", reg);

        var confirm = DevelopmentEmailService.SentEmails.Last(e => e.Email == email && e.Purpose == "EmailConfirmation");
        await client.PostAsJsonAsync("/api/v1/auth/confirm-email", new ConfirmEmailRequest(email, confirm.Token));

        var loginRes = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(email, "StrongPassword2026!"));
        var auth = await loginRes.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return auth!.AccessToken;
    }

    private static async Task<string> CreateAdminAndLoginAsync(DealZoneWebApplicationFactory factory, HttpClient client, string email)
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

    [Fact]
    public async Task GetCategories_Anonymous_ReturnsCategoriesList()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/catalog/categories");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var categories = await response.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        Assert.NotNull(categories);
        Assert.NotEmpty(categories);
    }

    [Fact]
    public async Task GetUnits_Anonymous_ReturnsUnitsList()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/catalog/units");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var units = await response.Content.ReadFromJsonAsync<List<UnitOfMeasureDto>>(JsonOptions);
        Assert.NotNull(units);
        Assert.NotEmpty(units);
        Assert.Contains(units, u => u.Code.Equals("ton", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GetMaterials_Anonymous_ReturnsPagedMaterials()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/catalog/materials?pageNumber=1&pageSize=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var paged = await response.Content.ReadFromJsonAsync<PagedResult<MaterialDto>>(JsonOptions);
        Assert.NotNull(paged);
        Assert.NotEmpty(paged.Items);
    }

    [Fact]
    public async Task AdminCatalog_NonAdminUser_IsForbidden()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var userToken = await RegisterAndLoginAsync(client, $"regular.user.{Guid.NewGuid():N}@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", userToken);

        var request = new CreateCategoryRequest(null, "TEXTILES", "منسوجات", "Textiles", null, null, 10);
        var response = await client.PostAsJsonAsync("/api/v1/admin/catalog/categories", request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AdminCatalog_SystemAdmin_CanCreateCategoryAndMaterial()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var adminToken = await CreateAdminAndLoginAsync(factory, client, $"catalog.admin.{Guid.NewGuid():N}@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var catCode = $"C_{Guid.NewGuid():N}"[..8].ToUpperInvariant();
        var customCatReq = new CreateCategoryRequest(null, catCode, "سيراميك", "Ceramics", "مواد السيراميك والبورسلين", "Ceramic and porcelain materials", 5);
        var customCatRes = await client.PostAsJsonAsync("/api/v1/admin/catalog/categories", customCatReq);
        Assert.Equal(HttpStatusCode.Created, customCatRes.StatusCode);
        var createdCustomCat = await customCatRes.Content.ReadFromJsonAsync<CategoryDto>(JsonOptions);
        Assert.NotNull(createdCustomCat);

        // 2. Attempting to duplicate an existing Category should return Conflict
        var dupCatReq = new CreateCategoryRequest(null, "TEXTILES", "منسوجات", "Textiles", null, null, 1);
        var dupCatRes = await client.PostAsJsonAsync("/api/v1/admin/catalog/categories", dupCatReq);
        Assert.Equal(HttpStatusCode.Conflict, dupCatRes.StatusCode);

        // 3. Fetch existing supported category
        var getCategoriesRes = await client.GetAsync("/api/v1/catalog/categories");
        Assert.Equal(HttpStatusCode.OK, getCategoriesRes.StatusCode);
        var categories = await getCategoriesRes.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        Assert.NotNull(categories);
        var targetCategory = categories.First(c => c.Code == "TEXTILES");

        // 4. Create a Unit
        var unitReq = new CreateUnitRequest("SQM", "متر مربع", "Square Meter", "م²", "m²", 4);
        var unitRes = await client.PostAsJsonAsync("/api/v1/admin/catalog/units", unitReq);
        Assert.Equal(HttpStatusCode.Created, unitRes.StatusCode);
        var createdUnit = await unitRes.Content.ReadFromJsonAsync<UnitOfMeasureDto>(JsonOptions);
        Assert.NotNull(createdUnit);
        Assert.Equal("sqm", createdUnit.Code);

        // 5. Create a Material under the supported Category
        var matReq = new CreateMaterialRequest(
            targetCategory.Id,
            createdUnit.Id,
            "TEX-COTTON-FABRIC-100",
            "قماش قطن مصري 100%",
            "Egyptian Cotton Fabric 100%",
            "أقمشة قطنية عالية الجودة للغزل والنسيج",
            "High grade 100% Egyptian cotton fabric",
            "{\"thread_count\":\"400\",\"width_cm\":\"150\"}");

        var matRes = await client.PostAsJsonAsync("/api/v1/admin/catalog/materials", matReq);
        Assert.Equal(HttpStatusCode.Created, matRes.StatusCode);
        var createdMat = await matRes.Content.ReadFromJsonAsync<MaterialDto>(JsonOptions);
        Assert.NotNull(createdMat);
        Assert.Equal("TEX-COTTON-FABRIC-100", createdMat.Code);

        // 6. Delete (archive) Custom Category
        var delRes = await client.DeleteAsync($"/api/v1/admin/catalog/categories/{createdCustomCat.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delRes.StatusCode);

        // 7. Verify category is archived
        var getCatRes = await client.GetAsync($"/api/v1/catalog/categories/{createdCustomCat.Id}");
        Assert.Equal(HttpStatusCode.OK, getCatRes.StatusCode);
        var fetchedCat = await getCatRes.Content.ReadFromJsonAsync<CategoryDto>(JsonOptions);
        Assert.NotNull(fetchedCat);
        Assert.True(fetchedCat.IsArchived);
    }

    [Fact]
    public async Task Supplier_CreateProduct_WithUnitKgAndNoMaterial_ReturnsUnitKg()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var suffix = Guid.NewGuid().ToString("N")[..8];
        var supplierEmail = $"supplier.{suffix}@dealzone.eg";

        // Register supplier and create approved company
        var supplierToken = await RegisterAndLoginAsync(client, supplierEmail);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", supplierToken);

        var compReq = new CreateCompanyRequest(
            $"Supplier Company {suffix}",
            $"Supplier {suffix}",
            "Textiles & Garments",
            "Cairo",
            "Cairo",
            "Textiles supplier",
            $"https://supplier-{suffix}.eg",
            $"TAX-{suffix}",
            $"CRN-{suffix}",
            supplierEmail,
            $"+2010{Random.Shared.Next(10000000, 99999999)}",
            "123 Industrial Area",
            null,
            null,
            "Supplier");

        var compRes = await client.PostAsJsonAsync("/api/v1/companies", compReq);
        Assert.Equal(HttpStatusCode.Created, compRes.StatusCode);
        var company = await compRes.Content.ReadFromJsonAsync<CompanyResponse>(JsonOptions);
        Assert.NotNull(company);

        // Approve company in database
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DealZoneDbContext>();
            var comp = await db.Companies.FirstAsync(c => c.Id == company.Id);
            comp.VerificationStatus = CompanyVerificationStatus.Approved;
            comp.VerifiedAtUtc = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }

        // Fetch categories to get TEXTILES category
        var catRes = await client.GetAsync("/api/v1/catalog/categories");
        Assert.Equal(HttpStatusCode.OK, catRes.StatusCode);
        var categories = await catRes.Content.ReadFromJsonAsync<List<CategoryDto>>(JsonOptions);
        Assert.NotNull(categories);
        var textilesCategory = categories.First(c => c.Code == "TEXTILES");

        // Supplier creates product with Unit = "kg" and MaterialId = null
        var createProductReq = new CreateCatalogProductRequest(
            CategoryId: textilesCategory.Id,
            MaterialId: null,
            Sku: $"SKU-TEST-KG-{suffix}".ToUpperInvariant(),
            NameAr: "غزل قطن ممشط بالكيلوجرام",
            NameEn: "Combed Cotton Yarn In Kilograms",
            DescriptionAr: "منتج قطني للبيع بوحدة الكيلوجرام بدون ربط بمادة مسبقة",
            DescriptionEn: "Cotton product sold in kg unit with no material selector",
            Specifications: "Count: 30/1, 100% Cotton",
            PricingMode: 1,
            UnitPrice: 180m,
            Currency: "EGP",
            Unit: "kg",
            AvailableQuantity: 5000m,
            MinimumOrderQuantity: 50m,
            DeliveryLeadTimeDays: 5);

        var createRes = await client.PostAsJsonAsync("/api/v1/catalog/products", createProductReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var createdProduct = await createRes.Content.ReadFromJsonAsync<CatalogProductResponse>(JsonOptions);
        Assert.NotNull(createdProduct);
        Assert.Null(createdProduct.MaterialId);
        Assert.Equal("kg", createdProduct.Unit, ignoreCase: true);
        Assert.Equal(180m, createdProduct.UnitPrice);
        Assert.Equal(textilesCategory.Id, createdProduct.CategoryId);

        // Fetch by id
        var getProductRes = await client.GetAsync($"/api/v1/catalog/products/{createdProduct.Id}");
        Assert.Equal(HttpStatusCode.OK, getProductRes.StatusCode);
        var fetchedProduct = await getProductRes.Content.ReadFromJsonAsync<CatalogProductResponse>(JsonOptions);
        Assert.NotNull(fetchedProduct);
        Assert.Null(fetchedProduct.MaterialId);
        Assert.Equal("kg", fetchedProduct.Unit, ignoreCase: true);
    }

    [Fact]
    public async Task GetProducts_AsSystemAdminWithNoCompany_ReturnsOk()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var adminEmail = $"admin-nocompany-{Guid.NewGuid():N}@dealzone.eg";
        var token = await CreateAdminAndLoginAsync(factory, client, adminEmail);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/v1/catalog/products");

        var content = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == HttpStatusCode.OK, $"Expected OK but got {response.StatusCode}. Body: {content}");
    }

    [Fact]
    public async Task GetAdminProducts_AsSystemAdminWithNoCompany_Returns200WithPagedResult()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var adminEmail = $"admin-products-{Guid.NewGuid():N}@dealzone.eg";
        var token = await CreateAdminAndLoginAsync(factory, client, adminEmail);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/v1/admin/catalog/products?pageNumber=1&pageSize=10");
        var content = await response.Content.ReadAsStringAsync();

        Assert.True(
            response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 OK but got {response.StatusCode}. Body: {content}");

        var paged = await System.Text.Json.JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync());

        // Must have paged-result shape: items array + totalCount
        Assert.True(paged.RootElement.TryGetProperty("items", out var items), "Response must contain 'items'.");
        Assert.Equal(System.Text.Json.JsonValueKind.Array, items.ValueKind);
        Assert.True(paged.RootElement.TryGetProperty("totalCount", out _), "Response must contain 'totalCount'.");
    }

    [Fact]
    public async Task GetAdminProducts_AsAnonymous_Returns401()
    {
        await using var factory = new DealZoneWebApplicationFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/admin/catalog/products");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
