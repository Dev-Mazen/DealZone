/**
 * Catalog Type Definitions (Categories, Materials, Units)
 * Maps to backend DTOs in DealZone.Application.Catalog.DTOs
 */

// ============================================================================
// Category DTOs
// ============================================================================

export interface CategoryDto {
  id: string; // Guid
  parentCategoryId: string | null; // Guid
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  displayOrder: number;
  isActive: boolean;
  isArchived: boolean;
  subCategories: CategoryDto[];
}

export interface CategorySummaryDto {
  id: string; // Guid
  parentCategoryId: string | null; // Guid
  code: string;
  nameAr: string;
  nameEn: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  parentCategoryId?: string | null; // Guid
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  displayOrder?: number;
}

export interface UpdateCategoryRequest {
  parentCategoryId?: string | null; // Guid
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  displayOrder: number;
  isActive: boolean;
  isArchived: boolean;
}

// ============================================================================
// Unit of Measure DTOs
// ============================================================================

export interface UnitOfMeasureDto {
  id: string; // Guid
  code: string;
  nameAr: string;
  nameEn: string;
  symbolAr: string;
  symbolEn: string;
  isActive: boolean;
  displayOrder: number;
}

export interface CreateUnitRequest {
  code: string;
  nameAr: string;
  nameEn: string;
  symbolAr: string;
  symbolEn: string;
  displayOrder?: number;
}

export interface UpdateUnitRequest {
  code: string;
  nameAr: string;
  nameEn: string;
  symbolAr: string;
  symbolEn: string;
  isActive: boolean;
  displayOrder: number;
}

// ============================================================================
// Material DTOs
// ============================================================================

export interface MaterialDto {
  id: string; // Guid
  categoryId: string; // Guid
  categoryNameAr: string;
  categoryNameEn: string;
  categoryCode: string;
  defaultUnitId: string; // Guid
  defaultUnitCode: string;
  defaultUnitNameAr: string;
  defaultUnitNameEn: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  attributesJson: string | null;
  isActive: boolean;
  isArchived: boolean;
  createdAtUtc: string; // ISO datetime
}

export interface CreateMaterialRequest {
  categoryId: string; // Guid
  defaultUnitId: string; // Guid
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  attributesJson?: string | null;
}

export interface UpdateMaterialRequest {
  categoryId: string; // Guid
  defaultUnitId: string; // Guid
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  attributesJson?: string | null;
  isActive: boolean;
  isArchived: boolean;
}

// ============================================================================
// Filter DTOs
// ============================================================================

export interface CatalogMaterialFilter {
  categoryId?: string | null; // Guid
  searchTerm?: string | null;
  activeOnly?: boolean | null;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string | null;
  sortDescending?: boolean;
}
