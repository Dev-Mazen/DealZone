/**
 * Common Type Definitions and Enums
 * Maps to backend enums in DealZone.Domain
 */

// ============================================================================
// Company Enums (from DealZone.Domain.Companies.CompanyEnums)
// ============================================================================

export enum CompanyVerificationStatus {
  Pending = 0,
  UnderReview = 1,
  Approved = 2,
  Rejected = 3,
  ChangesRequired = 5,
}

export enum CompanyRole {
  Owner = 1,
  Admin = 2,
  ProcurementManager = 3,
  SalesManager = 4,
  Member = 5,
}

export enum VerificationDocumentType {
  CommercialRegister = 1,
  TaxCard = 2,
  IndustrialRegister = 3,
  QualityCertificate = 4,
  Other = 5,
}

export enum VerificationDocumentStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

// ============================================================================
// RFQ Enums (from DealZone.Domain.Rfqs.RfqEnums)
// ============================================================================

export enum RfqStatus {
  Draft = 0,
  Published = 1,
  Closed = 2,
  Cancelled = 3,
}

// ============================================================================
// Offer Enums (from DealZone.Domain.Offers.OfferEnums)
// ============================================================================

export enum OfferStatus {
  Submitted = 0,
  UnderReview = 1,
  Accepted = 2,
  Rejected = 3,
  Superseded = 4,
  Withdrawn = 5,
  Expired = 6,
}

// ============================================================================
// Deal Enums (from DealZone.Domain.Deals.DealEnums)
// ============================================================================

export enum DealStatus {
  AwaitingConfirmation = 0,
  PendingConfirmation = 0, // Alias
  Confirmed = 1,
  InProgress = 2,
  Disputed = 3,
  Completed = 4,
  Cancelled = 5,
}

export enum DisputeStatus {
  Open = 0,
  UnderReview = 1,
  Resolved = 2,
  Dismissed = 3,
}

export enum DisputeCategory {
  QualityDefect = 1,
  QuantityMismatch = 2,
  LateDelivery = 3,
  DamagedGoods = 4,
  NonDelivery = 5,
  TermsViolation = 6,
  Other = 99,
}

export enum DisputeResolutionAction {
  ResumeDeal = 1,
  CancelDeal = 2,
}

// ============================================================================
// Shipping Enums (from DealZone.Domain.Shipping.ShippingEnums)
// ============================================================================

export enum ShippingArrangement {
  SupplierArranged = 1,
  DealZoneArranged = 2,
}

export enum ShipmentStatus {
  Pending = 0,
  Draft = 0, // Alias
  Assigned = 1,
  ReadyForPickup = 1, // Alias
  PickedUp = 2,
  InTransit = 3,
  OutForDelivery = 4,
  Delivered = 5,
  Failed = 6,
  DeliveryFailed = 6, // Alias
  Cancelled = 7,
}
