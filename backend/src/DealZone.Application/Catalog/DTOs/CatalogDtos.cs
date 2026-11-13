using System.Text.Json.Serialization;

namespace DealZone.Application.Catalog.DTOs;

public record CategoryDto(
    Guid Id,
    Guid? ParentCategoryId,
    string Code,
    string NameAr,
    string NameEn,
    string? DescriptionAr,
    string? DescriptionEn,
    int DisplayOrder,
    bool IsActive,
    bool IsArchived,
    IReadOnlyList<CategoryDto> SubCategories);

public record CategorySummaryDto(
    Guid Id,
    Guid? ParentCategoryId,
    string Code,
    string NameAr,
    string NameEn,
    int DisplayOrder,
    bool IsActive);

public record CreateCategoryRequest(
    Guid? ParentCategoryId,
    string Code,
    string NameAr,
    string NameEn,
    string? DescriptionAr,
    string? DescriptionEn,
    int DisplayOrder = 0);

public record UpdateCategoryRequest(
    Guid? ParentCategoryId,
    string Code,
    string NameAr,
    string NameEn,
    string? DescriptionAr,
    string? DescriptionEn,
    int DisplayOrder,
    bool IsActive,
    bool IsArchived);

public record UnitOfMeasureDto(
    Guid Id,
    string Code,
    string NameAr,
    string NameEn,
    string SymbolAr,
    string SymbolEn,
    bool IsActive,
    int DisplayOrder);

public record CreateUnitRequest(
    string Code,
    string NameAr,
    string NameEn,
    string SymbolAr,
    string SymbolEn,
    int DisplayOrder = 0);

public record UpdateUnitRequest(
    string Code,
    string NameAr,
    string NameEn,
    string SymbolAr,
    string SymbolEn,
    bool IsActive,
    int DisplayOrder);

public record MaterialDto(
    Guid Id,
    Guid CategoryId,
    string CategoryNameAr,
    string CategoryNameEn,
    string CategoryCode,
    Guid DefaultUnitId,
    string DefaultUnitCode,
    string DefaultUnitNameAr,
    string DefaultUnitNameEn,
    string Code,
    string NameAr,
    string NameEn,
    string? DescriptionAr,
    string? DescriptionEn,
    string? AttributesJson,
    bool IsActive,
    bool IsArchived,
    DateTimeOffset CreatedAtUtc);

public record CreateMaterialRequest(
    Guid CategoryId,
    Guid DefaultUnitId,
    string Code,
    string NameAr,
    string NameEn,
    string? DescriptionAr,
    string? DescriptionEn,
    string? AttributesJson);

public record UpdateMaterialRequest(
    Guid CategoryId,
    Guid DefaultUnitId,
    string Code,
    string NameAr,
    string NameEn,
    string? DescriptionAr,
    string? DescriptionEn,
    string? AttributesJson,
    bool IsActive,
    bool IsArchived);

public record CatalogMaterialFilter(
    Guid? CategoryId = null,
    string? SearchTerm = null,
    bool? ActiveOnly = true,
    int PageNumber = 1,
    int PageSize = 20,
    string? SortBy = null,
    bool SortDescending = false);

// -----------------------------------------------------------------------------
// Direct Purchase & Marketplace Catalog Products
// -----------------------------------------------------------------------------

public record CatalogProductResponse(
    Guid Id,
    Guid? MaterialId,
    string? MaterialCode,
    string? MaterialNameAr,
    string? MaterialNameEn,
    Guid CategoryId,
    string CategoryCode,
    string CategoryNameAr,
    string CategoryNameEn,
    string Unit,
    Guid SupplierCompanyId,
    string SupplierCompanyName,
    string Sku,
    string NameAr,
    string NameEn,
    string? DescriptionAr,
    string? DescriptionEn,
    string? Specifications,
    int PricingMode,
    decimal UnitPrice,
    string Currency,
    decimal AvailableQuantity,
    decimal MinimumOrderQuantity,
    int DeliveryLeadTimeDays,
    string? ImageUrlsJson,
    bool IsActive,
    DateTimeOffset CreatedAtUtc);

[method: JsonConstructor]
public record CreateCatalogProductRequest(
    Guid CategoryId,
    Guid? MaterialId,
    string? Sku,
    string NameAr,
    string? NameEn = null,
    string? DescriptionAr = null,
    string? DescriptionEn = null,
    string? Specifications = null,
    int PricingMode = 1,
    decimal UnitPrice = 0,
    string? Currency = "EGP",
    string? Unit = "ton",
    decimal AvailableQuantity = 0,
    decimal MinimumOrderQuantity = 1,
    int DeliveryLeadTimeDays = 7,
    string? ImageUrlsJson = null)
{
    public CreateCatalogProductRequest(
        Guid materialId,
        string sku,
        string nameAr,
        string nameEn,
        string? descriptionAr,
        string? descriptionEn,
        decimal unitPrice,
        string currency,
        decimal availableQuantity,
        decimal minimumOrderQuantity,
        int deliveryLeadTimeDays)
        : this(
            materialId,
            materialId,
            sku,
            nameAr,
            nameEn,
            descriptionAr,
            descriptionEn,
            null,
            1,
            unitPrice,
            currency,
            "ton",
            availableQuantity,
            minimumOrderQuantity,
            deliveryLeadTimeDays,
            null)
    {
    }
}

[method: JsonConstructor]
public record UpdateCatalogProductRequest(
    string NameAr,
    string? NameEn = null,
    string? DescriptionAr = null,
    string? DescriptionEn = null,
    string? Specifications = null,
    int PricingMode = 1,
    decimal UnitPrice = 0,
    string? Currency = "EGP",
    string? Unit = "ton",
    decimal AvailableQuantity = 0,
    decimal MinimumOrderQuantity = 1,
    int DeliveryLeadTimeDays = 7,
    string? ImageUrlsJson = null,
    bool IsActive = true)
{
    public UpdateCatalogProductRequest(
        string nameAr,
        string nameEn,
        string? descriptionAr,
        string? descriptionEn,
        decimal unitPrice,
        string currency,
        decimal availableQuantity,
        decimal minimumOrderQuantity,
        int deliveryLeadTimeDays,
        bool isActive)
        : this(
            nameAr,
            nameEn,
            descriptionAr,
            descriptionEn,
            null,
            1,
            unitPrice,
            currency,
            "ton",
            availableQuantity,
            minimumOrderQuantity,
            deliveryLeadTimeDays,
            null,
            isActive)
    {
    }
}

public record CatalogProductFilter(
    Guid? CategoryId = null,
    Guid? MaterialId = null,
    Guid? SupplierCompanyId = null,
    int? PricingMode = null,
    string? SearchTerm = null,
    bool? ActiveOnly = true,
    int PageNumber = 1,
    int PageSize = 20,
    string? SortBy = null,
    bool SortDescending = false);


