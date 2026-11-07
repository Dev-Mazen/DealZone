/**
 * Offer Type Definitions
 * Maps to backend DTOs in DealZone.Application.Offers.DTOs
 */

import { OfferStatus } from './common.types';

// ============================================================================
// Request DTOs
// ============================================================================

export interface CreateOfferItemRequest {
  rfqItemId: string; // Guid
  unitPrice: number; // decimal
  offeredQuantity: number; // decimal
  materialSpecifications?: string | null;
  notes?: string | null;
}

export interface CreateOfferRequest {
  deliveryLeadTimeDays: number;
  shippingIncluded: boolean;
  paymentTerms: string;
  validityDateUtc: string; // ISO datetime
  currency?: string | null;
  notes?: string | null;
  items: CreateOfferItemRequest[];
}

export interface ReviseOfferRequest {
  deliveryLeadTimeDays: number;
  shippingIncluded: boolean;
  paymentTerms: string;
  validityDateUtc: string; // ISO datetime
  currency?: string | null;
  notes?: string | null;
  changeSummary?: string | null;
  items: CreateOfferItemRequest[];
}

export interface AcceptOfferRequest {
  notes?: string | null;
}

export interface RejectOfferRequest {
  reason: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface OfferItemResponse {
  id: string; // Guid
  rfqItemId: string; // Guid
  rfqItemMaterialName: string;
  unitPrice: number; // decimal
  offeredQuantity: number; // decimal
  totalPrice: number; // decimal
  materialSpecifications: string | null;
  notes: string | null;
}

export interface OfferDetailResponse {
  id: string; // Guid
  offerNumber: string;
  rfqId: string; // Guid
  rfqNumber: string;
  rfqTitle: string;
  supplierCompanyId: string; // Guid
  supplierCompanyName: string;
  supplierGovernorate: string;
  supplierCity: string;
  originalOfferId: string | null; // Guid
  revisionNumber: number;
  status: OfferStatus | string;
  totalAmount: number; // decimal
  currency: string;
  validityDateUtc: string; // ISO datetime
  deliveryLeadTimeDays: number;
  shippingIncluded: boolean;
  paymentTerms: string;
  notes: string | null;
  changeSummary: string | null;
  rejectionReason: string | null;
  submittedAtUtc: string; // ISO datetime
  acceptedAtUtc: string | null; // ISO datetime
  rejectedAtUtc: string | null; // ISO datetime
  isOwner: boolean;
  items: OfferItemResponse[];
  dealId?: string | null; // Guid
}

export interface OfferSummaryResponse {
  id: string; // Guid
  offerNumber: string;
  rfqId: string; // Guid
  rfqNumber: string;
  rfqTitle: string;
  supplierCompanyId: string; // Guid
  supplierCompanyName: string;
  revisionNumber: number;
  status: OfferStatus | string;
  totalAmount: number; // decimal
  currency: string;
  validityDateUtc: string; // ISO datetime
  deliveryLeadTimeDays: number;
  shippingIncluded: boolean;
  itemCount: number;
  submittedAtUtc: string; // ISO datetime
}

export interface OfferRevisionSummaryResponse {
  id: string; // Guid
  offerNumber: string;
  revisionNumber: number;
  status: OfferStatus | string;
  totalAmount: number; // decimal
  currency: string;
  validityDateUtc: string; // ISO datetime
  deliveryLeadTimeDays: number;
  shippingIncluded: boolean;
  paymentTerms: string;
  changeSummary: string | null;
  submittedAtUtc: string; // ISO datetime
}

// ============================================================================
// Filter DTOs
// ============================================================================

export interface OfferFilter {
  rfqId?: string | null; // Guid
  status?: string | null;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string | null;
  sortDescending?: boolean;
}
