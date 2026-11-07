/**
 * Shipment and Shipping Provider Type Definitions
 * Maps to backend DTOs in DealZone.Application.Shipping.DTOs
 */

import { ShippingArrangement, ShipmentStatus } from './common.types';

// ============================================================================
// Request DTOs
// ============================================================================

export interface CreateShipmentRequest {
  arrangement: ShippingArrangement;
  pickupAddress: string;
  deliveryAddress: string;
  carrierName?: string | null;
  trackingNumber?: string | null;
  estimatedDeliveryDateUtc?: string | null; // ISO datetime
  notes?: string | null;
}

export interface UpdateTrackingRequest {
  trackingNumber?: string | null;
  carrierName?: string | null;
  location?: string | null;
  description?: string | null;
}

export interface UpdateShipmentStatusRequest {
  status: ShipmentStatus;
  location?: string | null;
  description?: string | null;
}

export interface AssignShippingProviderRequest {
  shippingProviderId: string; // Guid
  trackingNumber?: string | null;
  estimatedDeliveryDateUtc?: string | null; // ISO datetime
  notes?: string | null;
}

export interface CreateShippingProviderRequest {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  supportedGovernorates?: string | null;
}

export interface UpdateShippingProviderRequest {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  supportedGovernorates?: string | null;
  isActive?: boolean;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface ShipmentTrackingEventDto {
  status: ShipmentStatus | string;
  location: string | null;
  description: string | null;
  timestampUtc: string; // ISO datetime
  updatedBy: string;
}

export interface ShippingProviderResponse {
  id: string; // Guid
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  supportedGovernorates: string | null;
  isActive: boolean;
  createdAtUtc: string; // ISO datetime
}

export interface ShipmentResponse {
  id: string; // Guid
  shipmentNumber: string;
  dealId: string; // Guid
  dealNumber: string;
  arrangement: ShippingArrangement | string;
  shippingProviderId: string | null; // Guid
  shippingProviderName: string | null;
  carrierName: string | null;
  trackingNumber: string | null;
  pickupAddress: string;
  deliveryAddress: string;
  status: ShipmentStatus | string;
  pickupDateUtc: string | null; // ISO datetime
  estimatedDeliveryDateUtc: string | null; // ISO datetime
  actualDeliveryDateUtc: string | null; // ISO datetime
  notes: string | null;
  createdAtUtc: string; // ISO datetime
  trackingEvents: ShipmentTrackingEventDto[];
}

// Legacy alias for backward compatibility
export type ShipmentDetailResponse = ShipmentResponse;
