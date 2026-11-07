/**
 * Deal Type Definitions
 * Maps to backend DTOs in DealZone.Application.Deals.DTOs
 */

import { DealStatus, DisputeStatus, DisputeCategory, DisputeResolutionAction } from './common.types';

// ============================================================================
// Request DTOs
// ============================================================================

export interface CancelDealRequest {
  reason: string;
}

export interface CreateDisputeRequest {
  category: DisputeCategory;
  description: string;
}

export interface ResolveDisputeRequest {
  action: DisputeResolutionAction;
  resolutionNotes: string;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface DealItemSnapshot {
  rfqItemId: string; // Guid
  materialName: string;
  unitPrice: number; // decimal
  offeredQuantity: number; // decimal
  totalPrice: number; // decimal
  materialSpecifications: string | null;
  notes: string | null;
}

export interface DealCommercialTermsSnapshot {
  offerId: string; // Guid
  offerRevisionNumber: number;
  offerNumber: string;
  rfqId: string; // Guid
  rfqNumber: string;
  rfqTitle: string;
  totalAmount: number; // decimal
  currency: string;
  deliveryLeadTimeDays: number;
  shippingIncluded: boolean;
  paymentTerms: string;
  deliveryTerms: string | null;
  estimatedDeliveryDateUtc: string | null; // ISO datetime
  validityDateUtc: string; // ISO datetime
  notes: string | null;
  items: DealItemSnapshot[];
}

export interface DisputeSummaryResponse {
  id: string; // Guid
  dealId: string; // Guid
  dealNumber: string;
  openedByCompanyId: string; // Guid
  openedByCompanyName: string;
  category: DisputeCategory | string;
  reason: string;
  description: string;
  status: DisputeStatus | string;
  openedAtUtc: string; // ISO datetime
  resolvedAtUtc: string | null; // ISO datetime
  resolutionNotes: string | null;
}

export interface DisputeDetailResponse {
  id: string; // Guid
  dealId: string; // Guid
  dealNumber: string;
  openedByCompanyId: string; // Guid
  openedByCompanyName: string;
  category: DisputeCategory | string;
  reason: string;
  description: string;
  status: DisputeStatus | string;
  resolutionAction: DisputeResolutionAction | string | null;
  resolutionNotes: string | null;
  resolvedByUserId: string | null; // Guid
  openedAtUtc: string; // ISO datetime
  resolvedAtUtc: string | null; // ISO datetime
  deal: DealSummaryResponse | null;
}

export interface DealSummaryResponse {
  id: string; // Guid
  dealNumber: string;
  rfqId: string; // Guid
  rfqNumber: string;
  rfqTitle: string;
  offerId: string; // Guid
  offerNumber: string;
  buyerCompanyId: string; // Guid
  buyerCompanyName: string;
  supplierCompanyId: string; // Guid
  supplierCompanyName: string;
  agreedPrice: number; // decimal
  currency: string;
  status: DealStatus | string;
  createdAtUtc: string; // ISO datetime
  confirmedAtUtc: string | null; // ISO datetime
  completedAtUtc: string | null; // ISO datetime
  cancelledAtUtc: string | null; // ISO datetime
}

export interface DealDetailResponse {
  id: string; // Guid
  dealNumber: string;
  rfqId: string; // Guid
  rfqNumber: string;
  rfqTitle: string;
  offerId: string; // Guid
  offerNumber: string;
  offerRevisionNumber: number;
  buyerCompanyId: string; // Guid
  buyerCompanyName: string;
  supplierCompanyId: string; // Guid
  supplierCompanyName: string;
  agreedPrice: number; // decimal
  currency: string;
  status: DealStatus | string;
  confirmedByBuyer: boolean;
  confirmedByBuyerAtUtc: string | null; // ISO datetime
  confirmedBySupplier: boolean;
  confirmedBySupplierAtUtc: string | null; // ISO datetime
  confirmedAtUtc: string | null; // ISO datetime
  startedAtUtc: string | null; // ISO datetime
  completedAtUtc: string | null; // ISO datetime
  cancelledAtUtc: string | null; // ISO datetime
  cancellationReason: string | null;
  cancellationRequestedByCompanyId: string | null; // Guid
  cancellationRequestReason: string | null;
  deliveryTerms: string | null;
  estimatedDeliveryDateUtc: string | null; // ISO datetime
  createdAtUtc: string; // ISO datetime
  commercialTerms: DealCommercialTermsSnapshot | null;
  disputes: DisputeSummaryResponse[];
}
