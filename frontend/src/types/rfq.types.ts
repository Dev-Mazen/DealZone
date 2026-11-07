/**
 * RFQ (Request for Quotation) Type Definitions
 * Maps to backend DTOs in DealZone.Application.Rfqs.DTOs
 */

import { RfqStatus } from './common.types';

// ============================================================================
// Request DTOs
// ============================================================================

export interface CreateRfqItemRequest {
  categoryId: string; // Guid
  materialId?: string | null; // Guid
  materialName: string;
  specifications: string;
  quantity: number; // decimal
  unitOfMeasureId?: string | null; // Guid
  targetPricePerUnit?: number | null; // decimal
  notes?: string | null;
}

export interface CreateRfqRequest {
  title: string;
  description?: string | null;
  targetCategoryId?: string | null; // Guid
  deliveryGovernorate: string;
  deliveryCity: string;
  deliveryAddress: string;
  closingDateUtc: string; // ISO datetime
  requiredDeliveryDateUtc?: string | null; // ISO datetime
  targetBudget?: number | null; // decimal
  currency?: string | null;
  notes?: string | null;
  publishImmediately: boolean;
  items: CreateRfqItemRequest[];
}

export interface UpdateRfqItemRequest {
  id?: string | null; // Guid
  categoryId: string; // Guid
  materialId?: string | null; // Guid
  materialName: string;
  specifications: string;
  quantity: number; // decimal
  unitOfMeasureId?: string | null; // Guid
  targetPricePerUnit?: number | null; // decimal
  notes?: string | null;
}

export interface UpdateRfqRequest {
  title: string;
  description?: string | null;
  targetCategoryId?: string | null; // Guid
  deliveryGovernorate: string;
  deliveryCity: string;
  deliveryAddress: string;
  closingDateUtc: string; // ISO datetime
  requiredDeliveryDateUtc?: string | null; // ISO datetime
  targetBudget?: number | null; // decimal
  currency?: string | null;
  notes?: string | null;
  items?: UpdateRfqItemRequest[] | null;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface RfqItemResponse {
  id: string; // Guid
  lineNumber: number;
  categoryId: string; // Guid
  categoryNameAr: string;
  categoryNameEn: string;
  materialId: string | null; // Guid
  materialCode: string | null;
  materialName: string;
  specifications: string;
  quantity: number; // decimal
  unitOfMeasureId: string | null; // Guid
  unitCode: string;
  unitNameAr: string;
  unitNameEn: string;
  targetPricePerUnit: number | null; // decimal
  notes: string | null;
}

export interface RfqDetailResponse {
  id: string; // Guid
  rfqNumber: string;
  buyerCompanyId: string; // Guid
  buyerCompanyName: string;
  buyerGovernorate: string;
  buyerCity: string;
  title: string;
  description: string | null;
  status: RfqStatus | string;
  targetCategoryId: string | null; // Guid
  targetCategoryNameAr: string | null;
  targetCategoryNameEn: string | null;
  deliveryGovernorate: string;
  deliveryCity: string;
  deliveryAddress: string;
  requiredDeliveryDateUtc: string | null; // ISO datetime
  closingDateUtc: string; // ISO datetime
  publishedAtUtc: string | null; // ISO datetime
  targetBudget: number | null; // decimal
  currency: string;
  notes: string | null;
  createdAtUtc: string; // ISO datetime
  isOwner: boolean;
  items: RfqItemResponse[];
}

export interface RfqSummaryResponse {
  id: string; // Guid
  rfqNumber: string;
  buyerCompanyId: string; // Guid
  buyerCompanyName: string;
  buyerGovernorate: string;
  buyerCity: string;
  title: string;
  status: RfqStatus | string;
  targetCategoryId: string | null; // Guid
  targetCategoryNameAr: string | null;
  targetCategoryNameEn: string | null;
  deliveryGovernorate: string;
  deliveryCity: string;
  itemCount: number;
  closingDateUtc: string; // ISO datetime
  publishedAtUtc: string | null; // ISO datetime
  createdAtUtc: string; // ISO datetime
}

// ============================================================================
// Filter DTOs
// ============================================================================

export interface RfqDiscoveryFilter {
  categoryId?: string | null; // Guid
  materialId?: string | null; // Guid
  governorate?: string | null;
  city?: string | null;
  searchTerm?: string | null;
  closingBeforeUtc?: string | null; // ISO datetime
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string | null;
  sortDescending?: boolean;
}

export interface MyRfqFilter {
  status?: string | null;
  categoryId?: string | null; // Guid
  searchTerm?: string | null;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string | null;
  sortDescending?: boolean;
}
