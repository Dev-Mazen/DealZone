/**
 * Review Type Definitions
 * Maps to backend DTOs in DealZone.Application.Reviews.DTOs
 */

import { PagedResult } from './pagination.types';

// ============================================================================
// Request DTOs
// ============================================================================

export interface CreateReviewRequest {
  rating: number; // 1-5
  comment: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface ReviewResponse {
  id: string; // Guid
  dealId: string; // Guid
  dealNumber: string;
  reviewerCompanyId: string; // Guid
  reviewerCompanyName: string;
  targetCompanyId: string; // Guid
  targetCompanyName: string;
  rating: number;
  comment: string;
  createdAtUtc: string; // ISO datetime
}

export interface CompanyReviewStatsDto {
  companyId: string; // Guid
  companyName: string;
  averageRating: number; // decimal
  totalReviews: number;
}

export interface CompanyReviewsResponse {
  stats: CompanyReviewStatsDto;
  reviews: PagedResult<ReviewResponse>;
}
