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

