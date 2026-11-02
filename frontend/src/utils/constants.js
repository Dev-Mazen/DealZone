// Shared enums matching the backend domain exactly

// ── Verification Status ──────────────────────────────────────────────────────
export const VerificationStatus = {
  Pending:         0,
  UnderReview:     1,
  Approved:        2,
  Rejected:        3,
  ChangesRequired: 5,
};

export const VerificationStatusLabel = {
  0: 'Pending',
  1: 'Under Review',
  2: 'Approved',
  3: 'Rejected',
  5: 'Changes Required',
};

// ── Document Types ────────────────────────────────────────────────────────────
export const DocumentType = {
  CommercialRegister:  1,
  TaxCard:             2,
  IndustrialRegister:  3,
  QualityCertificate:  4,
  Other:               5,
};

export const DocumentTypeLabel = {
  1: 'Commercial Register',
  2: 'Tax Card',
  3: 'Industrial Register',
  4: 'Quality Certificate',
  5: 'Other',
};

// ── Company Roles ─────────────────────────────────────────────────────────────
export const CompanyRole = {
  Owner:               'Owner',
  Admin:               'Admin',
  ProcurementManager:  'ProcurementManager',
  SalesManager:        'SalesManager',
  Member:              'Member',
};

// ── RFQ Status ────────────────────────────────────────────────────────────────
export const RfqStatus = {
  Draft:     0,
  Published: 1,
  Closed:    2,
  Cancelled: 3,
};

export const RfqStatusLabel = {
  0: 'Draft',
  1: 'Published',
  2: 'Closed',
  3: 'Cancelled',
};

// ── Offer Status ──────────────────────────────────────────────────────────────
export const OfferStatus = {
  Submitted:   0,
  UnderReview: 1,
  Accepted:    2,
  Rejected:    3,
  Superseded:  4,
  Withdrawn:   5,
  Expired:     6,
};

export const OfferStatusLabel = {
  0: 'Submitted',
  1: 'Under Review',
  2: 'Accepted',
  3: 'Rejected',
  4: 'Superseded',
  5: 'Withdrawn',
  6: 'Expired',
};

// ── Deal Status ───────────────────────────────────────────────────────────────
export const DealStatus = {
  AwaitingConfirmation: 0,
  Confirmed:            1,
  InProgress:           2,
  Completed:            3,
  Disputed:             4,
  Cancelled:            5,
};

export const DealStatusLabel = {
  0: 'Awaiting Confirmation',
  1: 'Confirmed',
  2: 'In Progress',
  3: 'Completed',
  4: 'Disputed',
  5: 'Cancelled',
};

// ── Shipment Status ───────────────────────────────────────────────────────────
export const ShipmentStatus = {
  Pending:        0,
  Assigned:       1,
  PickedUp:       2,
  InTransit:      3,
  OutForDelivery: 4,
  Delivered:      5,
  Failed:         6,
  Cancelled:      7,
};

export const ShipmentStatusLabel = {
  0: 'Pending',
  1: 'Assigned',
  2: 'Picked Up',
  3: 'In Transit',
  4: 'Out for Delivery',
  5: 'Delivered',
  6: 'Failed',
  7: 'Cancelled',
};

// ── Dispute Categories ────────────────────────────────────────────────────────
export const DisputeCategory = {
  QualityDefect:    1,
  QuantityMismatch: 2,
  LateDelivery:     3,
  DamagedGoods:     4,
  NonDelivery:      5,
  TermsViolation:   6,
  Other:            99,
};

export const DisputeCategoryLabel = {
  1:  'Quality Defect',
  2:  'Quantity Mismatch',
  3:  'Late Delivery',
  4:  'Damaged Goods',
  5:  'Non-Delivery',
  6:  'Terms Violation',
  99: 'Other',
};

// ── Dispute Resolve Actions ───────────────────────────────────────────────────
export const ResolveAction = {
  ResumeDeal: 1,
  CancelDeal: 2,
};

// ── Shipment Arrangement ──────────────────────────────────────────────────────
export const ShipmentArrangement = {
  SupplierArranged:  1,
  DealZoneArranged:  2,
};

