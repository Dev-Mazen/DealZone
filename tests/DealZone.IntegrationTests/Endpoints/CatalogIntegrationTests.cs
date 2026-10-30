using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DealZone.Application.Auth.DTOs;
using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Common.Models;
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

        var userToken = await RegisterAndLoginAsync(client, "regular.user@dealzone.eg");
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

        var adminToken = await CreateAdminAndLoginAsync(factory, client, "catalog.admin@dealzone.eg");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        // 1. Create a Category
        var catReq = new CreateCategoryRequest(null, "CERAMICS", "سيراميك", "Ceramics", "مواد السيراميك والبورسلين", "Ceramic and porcelain materials", 5);
        var catRes = await client.PostAsJsonAsync("/api/v1/admin/catalog/categories", catReq);
        Assert.Equal(HttpStatusCode.Created, catRes.StatusCode);
        var createdCategory = await catRes.Content.ReadFromJsonAsync<CategoryDto>(JsonOptions);
        Assert.NotNull(createdCategory);
        Assert.Equal("CERAMICS", createdCategory.Code);

        // 2. Duplicate Category Code should return Conflict
        var dupCatRes = await client.PostAsJsonAsync("/api/v1/admin/catalog/categories", catReq);
        Assert.Equal(HttpStatusCode.Conflict, dupCatRes.StatusCode);

        // 3. Create a Unit
        var unitReq = new CreateUnitRequest("SQM", "متر مربع", "Square Meter", "م²", "m²", 4);
        var unitRes = await client.PostAsJsonAsync("/api/v1/admin/catalog/units", unitReq);
        Assert.Equal(HttpStatusCode.Created, unitRes.StatusCode);
        var createdUnit = await unitRes.Content.ReadFromJsonAsync<UnitOfMeasureDto>(JsonOptions);
        Assert.NotNull(createdUnit);
        Assert.Equal("sqm", createdUnit.Code);

        // 4. Create a Material
        var matReq = new CreateMaterialRequest(
            createdCategory.Id,
            createdUnit.Id,
            "CER-FLOOR-60X60",
            "بلاط سيراميك أرضيات 60×60",
            "Floor Ceramic Tiles 60x60",
            "بلاط سيراميك عالي التحمل",
            "Heavy-duty porcelain floor tile",
            "{\"dimensions_cm\":\"60x60\",\"finish\":\"matte\"}");

        var matRes = await client.PostAsJsonAsync("/api/v1/admin/catalog/materials", matReq);
        Assert.Equal(HttpStatusCode.Created, matRes.StatusCode);
        var createdMat = await matRes.Content.ReadFromJsonAsync<MaterialDto>(JsonOptions);
        Assert.NotNull(createdMat);
        Assert.Equal("CER-FLOOR-60X60", createdMat.Code);

        // 5. Delete (archive) Category
        var delRes = await client.DeleteAsync($"/api/v1/admin/catalog/categories/{createdCategory.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delRes.StatusCode);

        // 6. Verify category is archived
        var getCatRes = await client.GetAsync($"/api/v1/catalog/categories/{createdCategory.Id}");
        Assert.Equal(HttpStatusCode.OK, getCatRes.StatusCode);
        var fetchedCat = await getCatRes.Content.ReadFromJsonAsync<CategoryDto>(JsonOptions);
        Assert.NotNull(fetchedCat);
        Assert.True(fetchedCat.IsArchived);
    }
}
