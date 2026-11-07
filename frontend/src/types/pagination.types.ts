/**
 * Pagination Type Definitions
 * Maps to backend DTOs in DealZone.Application.Common.Models
 */

// ============================================================================
// PagedResult<T> - Generic paginated response wrapper
// ============================================================================

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// ============================================================================
// Pagination Parameters - Common query parameters for paginated requests
// ============================================================================

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string | null;
  sortDescending?: boolean;
}

/**
 * Helper function to create default pagination params
 */
export const createDefaultPaginationParams = (
  overrides?: Partial<PaginationParams>
): PaginationParams => ({
  pageNumber: 1,
  pageSize: 20,
  sortBy: null,
  sortDescending: false,
  ...overrides,
});

/**
 * Helper function to calculate total pages
 */
export const calculateTotalPages = (totalCount: number, pageSize: number): number => {
  if (pageSize <= 0) return 0;
  return Math.ceil(totalCount / pageSize);
};

/**
 * Helper function to check if there's a next page
 */
export const hasNextPage = (pageNumber: number, totalPages: number): boolean => {
  return pageNumber < totalPages;
};

/**
 * Helper function to check if there's a previous page
 */
export const hasPreviousPage = (pageNumber: number): boolean => {
  return pageNumber > 1;
};
