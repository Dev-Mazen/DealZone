using DealZone.Application.Catalog.DTOs;
using DealZone.Application.Common.Interfaces;
using DealZone.Application.Common.Models;
using DealZone.Domain.Catalog;
using DealZone.Domain.Exceptions;
using DealZone.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DealZone.Infrastructure.Services;

public class CatalogService : ICatalogService
{
    private readonly DealZoneDbContext _context;
    private readonly ILogger<CatalogService> _logger;

    public CatalogService(DealZoneDbContext context, ILogger<CatalogService> logger)
    {
        _context = context;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // Categories
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var query = _context.MaterialCategories.AsNoTracking();

        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive && !c.IsArchived);
        }

        var allCategories = await query
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.NameEn)
            .ToListAsync(cancellationToken);

        // Build tree: root categories first
        var rootCategories = allCategories
            .Where(c => c.ParentCategoryId == null)
            .Select(c => MapCategoryTree(c, allCategories))
            .ToList();

        return rootCategories;
    }

    public async Task<CategoryDto> GetCategoryByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await _context.MaterialCategories
            .AsNoTracking()
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Material category {id} was not found.");

        return MapCategory(category);
    }

    public async Task<CategoryDto> CreateCategoryAsync(
        CreateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var codeNormalized = request.Code.Trim().ToUpperInvariant();

        var codeExists = await _context.MaterialCategories
            .AnyAsync(c => c.Code == codeNormalized, cancellationToken);

        if (codeExists)
        {
            throw new ConflictException($"Category with code '{codeNormalized}' already exists.");
        }

        if (request.ParentCategoryId.HasValue)
        {
            var parentExists = await _context.MaterialCategories
                .AnyAsync(c => c.Id == request.ParentCategoryId.Value, cancellationToken);

            if (!parentExists)
            {
                throw new NotFoundException($"Parent category {request.ParentCategoryId.Value} not found.");
            }
        }

        var category = new MaterialCategory
        {
            ParentCategoryId = request.ParentCategoryId,
            Code = codeNormalized,
            NameAr = request.NameAr.Trim(),
            NameEn = request.NameEn.Trim(),
            DescriptionAr = request.DescriptionAr?.Trim(),
            DescriptionEn = request.DescriptionEn?.Trim(),
            DisplayOrder = request.DisplayOrder,
            IsActive = true,
            IsArchived = false,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.MaterialCategories.Add(category);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created material category {CategoryCode} ({CategoryId})", category.Code, category.Id);

        return MapCategory(category);
    }

    public async Task<CategoryDto> UpdateCategoryAsync(
        Guid id,
        UpdateCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var category = await _context.MaterialCategories
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Material category {id} was not found.");

        var codeNormalized = request.Code.Trim().ToUpperInvariant();
        if (!string.Equals(category.Code, codeNormalized, StringComparison.OrdinalIgnoreCase))
        {
            var codeExists = await _context.MaterialCategories
                .AnyAsync(c => c.Code == codeNormalized && c.Id != id, cancellationToken);

            if (codeExists)
            {
                throw new ConflictException($"Category with code '{codeNormalized}' already exists.");
            }
            category.Code = codeNormalized;
        }

        if (request.ParentCategoryId.HasValue && request.ParentCategoryId.Value != category.ParentCategoryId)
        {
            if (request.ParentCategoryId.Value == id)
            {
                throw new ConflictException("Category cannot be its own parent.");
            }

            var parentExists = await _context.MaterialCategories
                .AnyAsync(c => c.Id == request.ParentCategoryId.Value, cancellationToken);

            if (!parentExists)
            {
                throw new NotFoundException($"Parent category {request.ParentCategoryId.Value} not found.");
            }
        }

        category.ParentCategoryId = request.ParentCategoryId;
        category.NameAr = request.NameAr.Trim();
        category.NameEn = request.NameEn.Trim();
        category.DescriptionAr = request.DescriptionAr?.Trim();
        category.DescriptionEn = request.DescriptionEn?.Trim();
        category.DisplayOrder = request.DisplayOrder;
        category.IsActive = request.IsActive;
        category.IsArchived = request.IsArchived;

        await _context.SaveChangesAsync(cancellationToken);

        return MapCategory(category);
    }

    public async Task DeleteCategoryAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await _context.MaterialCategories
            .Include(c => c.SubCategories)
            .Include(c => c.Materials)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Material category {id} was not found.");

        category.IsArchived = true;
        category.IsActive = false;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Archived material category {CategoryCode} ({CategoryId})", category.Code, id);
    }

    // -------------------------------------------------------------------------
    // Units of Measure
    // -------------------------------------------------------------------------

    public async Task<IReadOnlyList<UnitOfMeasureDto>> GetUnitsAsync(
        bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var query = _context.UnitsOfMeasure.AsNoTracking();

        if (!includeInactive)
        {
            query = query.Where(u => u.IsActive);
        }

        return await query
            .OrderBy(u => u.DisplayOrder)
            .ThenBy(u => u.Code)
            .Select(u => new UnitOfMeasureDto(
                u.Id,
                u.Code,
                u.NameAr,
                u.NameEn,
                u.SymbolAr,
                u.SymbolEn,
                u.IsActive,
                u.DisplayOrder))
            .ToListAsync(cancellationToken);
    }

    public async Task<UnitOfMeasureDto> GetUnitByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var unit = await _context.UnitsOfMeasure
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Unit of measure {id} was not found.");

        return new UnitOfMeasureDto(
            unit.Id,
            unit.Code,
            unit.NameAr,
            unit.NameEn,
            unit.SymbolAr,
            unit.SymbolEn,
            unit.IsActive,
            unit.DisplayOrder);
    }

    public async Task<UnitOfMeasureDto> CreateUnitAsync(
        CreateUnitRequest request,
        CancellationToken cancellationToken = default)
    {
        var codeNormalized = request.Code.Trim().ToLowerInvariant();

        var codeExists = await _context.UnitsOfMeasure
            .AnyAsync(u => u.Code == codeNormalized, cancellationToken);

        if (codeExists)
        {
            throw new ConflictException($"Unit with code '{codeNormalized}' already exists.");
        }

        var unit = new UnitOfMeasure
        {
            Code = codeNormalized,
            NameAr = request.NameAr.Trim(),
            NameEn = request.NameEn.Trim(),
            SymbolAr = request.SymbolAr.Trim(),
            SymbolEn = request.SymbolEn.Trim(),
            DisplayOrder = request.DisplayOrder,
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        _context.UnitsOfMeasure.Add(unit);
        await _context.SaveChangesAsync(cancellationToken);

        return new UnitOfMeasureDto(
            unit.Id,
            unit.Code,
            unit.NameAr,
            unit.NameEn,
            unit.SymbolAr,
            unit.SymbolEn,
            unit.IsActive,
            unit.DisplayOrder);
    }

    public async Task<UnitOfMeasureDto> UpdateUnitAsync(
        Guid id,
        UpdateUnitRequest request,
        CancellationToken cancellationToken = default)
    {
        var unit = await _context.UnitsOfMeasure
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Unit of measure {id} was not found.");

        var codeNormalized = request.Code.Trim().ToLowerInvariant();
        if (!string.Equals(unit.Code, codeNormalized, StringComparison.OrdinalIgnoreCase))
        {
            var codeExists = await _context.UnitsOfMeasure
                .AnyAsync(u => u.Code == codeNormalized && u.Id != id, cancellationToken);

            if (codeExists)
            {
                throw new ConflictException($"Unit with code '{codeNormalized}' already exists.");
            }
            unit.Code = codeNormalized;
        }

        unit.NameAr = request.NameAr.Trim();
        unit.NameEn = request.NameEn.Trim();
        unit.SymbolAr = request.SymbolAr.Trim();
        unit.SymbolEn = request.SymbolEn.Trim();
        unit.IsActive = request.IsActive;
        unit.DisplayOrder = request.DisplayOrder;

        await _context.SaveChangesAsync(cancellationToken);

        return new UnitOfMeasureDto(
            unit.Id,
            unit.Code,
            unit.NameAr,
            unit.NameEn,
            unit.SymbolAr,
            unit.SymbolEn,
            unit.IsActive,
            unit.DisplayOrder);
    }

    public async Task DeleteUnitAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var unit = await _context.UnitsOfMeasure
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Unit of measure {id} was not found.");

        unit.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);
    }

    // -------------------------------------------------------------------------
    // Materials
    // -------------------------------------------------------------------------

    public async Task<PagedResult<MaterialDto>> GetMaterialsAsync(
        CatalogMaterialFilter filter,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Materials
            .AsNoTracking()
            .Include(m => m.Category)
            .Include(m => m.DefaultUnit)
            .AsQueryable();

        if (filter.ActiveOnly == true)
        {
            query = query.Where(m => m.IsActive && !m.IsArchived);
        }

        if (filter.CategoryId.HasValue)
        {
            // Category or any descendant category
            var subCategoryIds = await _context.MaterialCategories
                .Where(c => c.ParentCategoryId == filter.CategoryId.Value)
                .Select(c => c.Id)
                .ToListAsync(cancellationToken);

            subCategoryIds.Add(filter.CategoryId.Value);

            query = query.Where(m => subCategoryIds.Contains(m.CategoryId));
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(m =>
                m.NameEn.ToLower().Contains(search) ||
                m.NameAr.ToLower().Contains(search) ||
                m.Code.ToLower().Contains(search) ||
                (m.DescriptionEn != null && m.DescriptionEn.ToLower().Contains(search)) ||
                (m.DescriptionAr != null && m.DescriptionAr.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "name" or "nameen" => filter.SortDescending ? query.OrderByDescending(m => m.NameEn) : query.OrderBy(m => m.NameEn),
            "namear" => filter.SortDescending ? query.OrderByDescending(m => m.NameAr) : query.OrderBy(m => m.NameAr),
            "code" => filter.SortDescending ? query.OrderByDescending(m => m.Code) : query.OrderBy(m => m.Code),
            _ => filter.SortDescending ? query.OrderByDescending(m => m.CreatedAtUtc) : query.OrderBy(m => m.NameEn)
        };

        var pageNumber = Math.Max(1, filter.PageNumber);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(m => MapMaterial(m))
            .ToListAsync(cancellationToken);

        return PagedResult<MaterialDto>.Create(items, pageNumber, pageSize, totalCount);
    }

    public async Task<MaterialDto> GetMaterialByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var material = await _context.Materials
            .AsNoTracking()
            .Include(m => m.Category)
            .Include(m => m.DefaultUnit)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Material {id} was not found.");

        return MapMaterial(material);
    }

    public async Task<MaterialDto> CreateMaterialAsync(
        CreateMaterialRequest request,
        CancellationToken cancellationToken = default)
    {
        var category = await _context.MaterialCategories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.IsActive && !c.IsArchived, cancellationToken)
            ?? throw new NotFoundException($"Active category {request.CategoryId} was not found.");

        var unit = await _context.UnitsOfMeasure
            .FirstOrDefaultAsync(u => u.Id == request.DefaultUnitId && u.IsActive, cancellationToken)
            ?? throw new NotFoundException($"Active unit of measure {request.DefaultUnitId} was not found.");

        var codeNormalized = request.Code.Trim().ToUpperInvariant();
        var codeExists = await _context.Materials
            .AnyAsync(m => m.Code == codeNormalized, cancellationToken);

        if (codeExists)
        {
            throw new ConflictException($"Material with code '{codeNormalized}' already exists.");
        }

        var material = new Material
        {
            CategoryId = category.Id,
            DefaultUnitId = unit.Id,
            Code = codeNormalized,
            NameAr = request.NameAr.Trim(),
            NameEn = request.NameEn.Trim(),
            DescriptionAr = request.DescriptionAr?.Trim(),
            DescriptionEn = request.DescriptionEn?.Trim(),
            AttributesJson = request.AttributesJson?.Trim(),
            IsActive = true,
            IsArchived = false
        };

        _context.Materials.Add(material);
        await _context.SaveChangesAsync(cancellationToken);

        material.Category = category;
        material.DefaultUnit = unit;

        _logger.LogInformation("Created industrial material {MaterialCode} ({MaterialId})", material.Code, material.Id);

        return MapMaterial(material);
    }

    public async Task<MaterialDto> UpdateMaterialAsync(
        Guid id,
        UpdateMaterialRequest request,
        CancellationToken cancellationToken = default)
    {
        var material = await _context.Materials
            .Include(m => m.Category)
            .Include(m => m.DefaultUnit)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Material {id} was not found.");

        var category = await _context.MaterialCategories
            .FirstOrDefaultAsync(c => c.Id == request.CategoryId, cancellationToken)
            ?? throw new NotFoundException($"Category {request.CategoryId} was not found.");

        var unit = await _context.UnitsOfMeasure
            .FirstOrDefaultAsync(u => u.Id == request.DefaultUnitId, cancellationToken)
            ?? throw new NotFoundException($"Unit of measure {request.DefaultUnitId} was not found.");

        var codeNormalized = request.Code.Trim().ToUpperInvariant();
        if (!string.Equals(material.Code, codeNormalized, StringComparison.OrdinalIgnoreCase))
        {
            var codeExists = await _context.Materials
                .AnyAsync(m => m.Code == codeNormalized && m.Id != id, cancellationToken);

            if (codeExists)
            {
                throw new ConflictException($"Material with code '{codeNormalized}' already exists.");
            }
            material.Code = codeNormalized;
        }

        material.CategoryId = category.Id;
        material.DefaultUnitId = unit.Id;
        material.NameAr = request.NameAr.Trim();
        material.NameEn = request.NameEn.Trim();
        material.DescriptionAr = request.DescriptionAr?.Trim();
        material.DescriptionEn = request.DescriptionEn?.Trim();
        material.AttributesJson = request.AttributesJson?.Trim();
        material.IsActive = request.IsActive;
        material.IsArchived = request.IsArchived;

        await _context.SaveChangesAsync(cancellationToken);

        material.Category = category;
        material.DefaultUnit = unit;

        return MapMaterial(material);
    }

    public async Task DeleteMaterialAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var material = await _context.Materials
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken)
            ?? throw new NotFoundException($"Material {id} was not found.");

        material.IsArchived = true;
        material.IsActive = false;

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Archived industrial material {MaterialCode} ({MaterialId})", material.Code, id);
    }

    // -------------------------------------------------------------------------
    // Mapping Helpers
    // -------------------------------------------------------------------------

    private static CategoryDto MapCategoryTree(MaterialCategory category, List<MaterialCategory> all)
    {
        var subCategories = all
            .Where(c => c.ParentCategoryId == category.Id)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.NameEn)
            .Select(c => MapCategoryTree(c, all))
            .ToList();

        return new CategoryDto(
            category.Id,
            category.ParentCategoryId,
            category.Code,
            category.NameAr,
            category.NameEn,
            category.DescriptionAr,
            category.DescriptionEn,
            category.DisplayOrder,
            category.IsActive,
            category.IsArchived,
            subCategories);
    }

    private static CategoryDto MapCategory(MaterialCategory category)
    {
        var subCategories = category.SubCategories?
            .Select(MapCategory)
            .ToList() ?? [];

        return new CategoryDto(
            category.Id,
            category.ParentCategoryId,
            category.Code,
            category.NameAr,
            category.NameEn,
            category.DescriptionAr,
            category.DescriptionEn,
            category.DisplayOrder,
            category.IsActive,
            category.IsArchived,
            subCategories);
    }

    private static MaterialDto MapMaterial(Material material)
    {
        return new MaterialDto(
            material.Id,
            material.CategoryId,
            material.Category?.NameAr ?? string.Empty,
            material.Category?.NameEn ?? string.Empty,
            material.Category?.Code ?? string.Empty,
            material.DefaultUnitId,
            material.DefaultUnit?.Code ?? string.Empty,
            material.DefaultUnit?.NameAr ?? string.Empty,
            material.DefaultUnit?.NameEn ?? string.Empty,
            material.Code,
            material.NameAr,
            material.NameEn,
            material.DescriptionAr,
            material.DescriptionEn,
            material.AttributesJson,
            material.IsActive,
            material.IsArchived,
            material.CreatedAtUtc);
    }
}

