using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Common.Models;

namespace DealZone.Application.Common.Interfaces;

public interface ICatalogService
{
    Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<CategoryDto> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<PagedResult<MaterialDto>> GetMaterialsAsync(CatalogMaterialFilter filter, CancellationToken cancellationToken = default);
    Task<MaterialDto> GetMaterialByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UnitOfMeasureDto>> GetUnitsAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<UnitOfMeasureDto> GetUnitByIdAsync(Guid id, CancellationToken cancellationToken = default);

    // Admin CRUD
    Task<CategoryDto> CreateCategoryAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default);
    Task<CategoryDto> UpdateCategoryAsync(Guid id, UpdateCategoryRequest request, CancellationToken cancellationToken = default);
    Task DeleteCategoryAsync(Guid id, CancellationToken cancellationToken = default);

    Task<MaterialDto> CreateMaterialAsync(CreateMaterialRequest request, CancellationToken cancellationToken = default);
    Task<MaterialDto> UpdateMaterialAsync(Guid id, UpdateMaterialRequest request, CancellationToken cancellationToken = default);
    Task DeleteMaterialAsync(Guid id, CancellationToken cancellationToken = default);

    Task<UnitOfMeasureDto> CreateUnitAsync(CreateUnitRequest request, CancellationToken cancellationToken = default);
    Task<UnitOfMeasureDto> UpdateUnitAsync(Guid id, UpdateUnitRequest request, CancellationToken cancellationToken = default);
    Task DeleteUnitAsync(Guid id, CancellationToken cancellationToken = default);

    // Purchasable Catalog Products
    Task<PagedResult<CatalogProductResponse>> GetProductsAsync(CatalogProductFilter filter, CancellationToken cancellationToken = default);
    Task<CatalogProductResponse> GetProductByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CatalogProductResponse> CreateProductAsync(CreateCatalogProductRequest request, CancellationToken cancellationToken = default);
    Task<CatalogProductResponse> UpdateProductAsync(Guid id, UpdateCatalogProductRequest request, CancellationToken cancellationToken = default);
    Task DeleteProductAsync(Guid id, CancellationToken cancellationToken = default);
}

