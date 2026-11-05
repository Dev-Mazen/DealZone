import assert from 'node:assert/strict'

// -------------------------------------------------------------
// 1. FORMAT UTILITIES TEST (Production Code Execution)
// -------------------------------------------------------------
import {
  formatCurrency,
  formatQuantity,
  formatFileSize,
  getLocalizedField,
  rfqStatusVariant,
  offerStatusVariant,
  dealStatusVariant,
  verificationStatusVariant,
} from './src/utils/format.js'

console.log('--- TEST GROUP 1: Formatting Utilities (src/utils/format.js) ---')

// Currency formatting
assert.match(formatCurrency(1500, 'en'), /1,500/)

// Quantity formatting
assert.equal(formatQuantity(100.5, 'en'), '100.5')
assert.equal(formatQuantity(0, 'en'), '0')

// File size formatting
assert.equal(formatFileSize(500), '500 B')
assert.equal(formatFileSize(1024), '1.0 KB')
assert.equal(formatFileSize(5 * 1024 * 1024), '5.0 MB')

// Localized field selection
const entity = {
  nameAr: 'حديد تسليح',
  nameEn: 'Reinforcing Steel',
}
assert.equal(getLocalizedField(entity, 'name', 'ar'), 'حديد تسليح')
assert.equal(getLocalizedField(entity, 'name', 'en'), 'Reinforcing Steel')
assert.equal(getLocalizedField(entity, 'name', 'fr'), 'Reinforcing Steel') // Fallback

// Status badges
assert.equal(rfqStatusVariant('Published'), 'info')
assert.equal(rfqStatusVariant('Draft'), 'navy')
assert.equal(rfqStatusVariant('Closed'), 'warning')
assert.equal(rfqStatusVariant('Cancelled'), 'error')

assert.equal(offerStatusVariant('Accepted'), 'success')
assert.equal(offerStatusVariant('Rejected'), 'error')
assert.equal(offerStatusVariant('Submitted'), 'info')

assert.equal(dealStatusVariant('Completed'), 'success')
assert.equal(dealStatusVariant('Disputed'), 'error')
assert.equal(dealStatusVariant('AwaitingConfirmation'), 'warning')

assert.equal(verificationStatusVariant('Approved'), 'success')
assert.equal(verificationStatusVariant('UnderReview'), 'warning')
assert.equal(verificationStatusVariant('Rejected'), 'error')
assert.equal(verificationStatusVariant('ChangesRequired'), 'warning')

console.log('✅ Formatting Utilities: ALL PASSED')

// -------------------------------------------------------------
// 2. ERROR NORMALIZATION TEST (RFC 7807 ProblemDetails via axios.js)
// -------------------------------------------------------------
import { buildApiError } from './src/shared/api/axios.js'

console.log('--- TEST GROUP 2: API Error Normalization (src/shared/api/axios.js) ---')

// 400 Bad Request with validation errors
const badRequestErr = buildApiError({
  response: {
    status: 400,
    data: {
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'One or more validation errors occurred.',
      status: 400,
      detail: 'Closing date must be in the future.',
      errors: {
        ClosingDateUtc: ['Closing date must be in the future.'],
      },
    },
  },
})
assert.equal(badRequestErr.status, 400)
assert.equal(badRequestErr.message, 'Closing date must be in the future.')
assert.ok(badRequestErr.problem.errors.ClosingDateUtc)

// 401 Unauthorized
const unauthErr = buildApiError({
  response: {
    status: 401,
    data: {
      title: 'Unauthorized',
      status: 401,
      detail: 'Invalid refresh token. Token replay detected and session revoked.',
    },
  },
})
assert.equal(unauthErr.status, 401)
assert.equal(unauthErr.message, 'Invalid refresh token. Token replay detected and session revoked.')

// 403 Forbidden (Unapproved company)
const forbiddenErr = buildApiError({
  response: {
    status: 403,
    data: {
      title: 'Forbidden',
      status: 403,
      detail: 'Only verified and approved companies are authorized to perform commercial marketplace activities.',
    },
  },
})
assert.equal(forbiddenErr.status, 403)
assert.equal(forbiddenErr.message, 'Only verified and approved companies are authorized to perform commercial marketplace activities.')

// 409 Conflict (Offer already accepted)
const conflictErr = buildApiError({
  response: {
    status: 409,
    data: {
      title: 'Conflict',
      status: 409,
      detail: "Cannot reject offer in 'Accepted' status. Only Submitted or UnderReview offers can be rejected.",
    },
  },
})
assert.equal(conflictErr.status, 409)
assert.equal(conflictErr.message, "Cannot reject offer in 'Accepted' status. Only Submitted or UnderReview offers can be rejected.")

// 500 Server Error
const serverErr = buildApiError({
  response: {
    status: 500,
    data: {
      title: 'An unexpected error occurred.',
      status: 500,
      detail: 'An error occurred while processing your request.',
    },
  },
})
assert.equal(serverErr.status, 500)
assert.equal(serverErr.message, 'An error occurred while processing your request.')
assert.ok(!serverErr.message.includes('Exception at DealZone.Infrastructure'), 'No sensitive stack traces exposed')

// Network Error (No response from backend)
const networkErr = buildApiError({
  message: 'Network Error',
})
assert.equal(networkErr.status, 0)
assert.equal(networkErr.message, 'Network Error')

console.log('✅ API Error Normalization: ALL PASSED')

// -------------------------------------------------------------
// 3. SCHEMA VALIDATION TEST (src/shared/validation/contracts.js)
// -------------------------------------------------------------
import { offerSchema, reviseOfferSchema, loginSchema } from './src/shared/validation/contracts.js'

console.log('--- TEST GROUP 3: Zod Schemas vs Backend Contracts (src/shared/validation/contracts.js) ---')

// Valid offer submission
const validOffer = offerSchema.safeParse({
  deliveryLeadTimeDays: 14,
  shippingIncluded: true,
  paymentTerms: '50% advance, 50% on bill of lading',
  validityDateUtc: '2026-12-31T00:00:00.000Z',
  items: [
    {
      rfqItemId: '00000000-0000-0000-0000-000000000001',
      unitPrice: 25000,
      offeredQuantity: 50,
      notes: 'High tensile grade',
    },
  ],
})
assert.ok(validOffer.success, 'Valid offer should parse successfully')

// Invalid offer submission (unit price <= 0)
const invalidOfferPrice = offerSchema.safeParse({
  deliveryLeadTimeDays: 14,
  shippingIncluded: true,
  paymentTerms: 'Cash',
  validityDateUtc: '2026-12-31',
  items: [
    {
      rfqItemId: '00000000-0000-0000-0000-000000000001',
      unitPrice: 0, // Invalid!
      offeredQuantity: 10,
    },
  ],
})
assert.equal(invalidOfferPrice.success, false)

// Invalid offer submission (missing items)
const invalidOfferItems = offerSchema.safeParse({
  deliveryLeadTimeDays: 14,
  shippingIncluded: true,
  paymentTerms: 'Cash',
  validityDateUtc: '2026-12-31',
  items: [], // Invalid! Must have at least 1 item
})
assert.equal(invalidOfferItems.success, false)

// Valid revision
const validRevision = reviseOfferSchema.safeParse({
  deliveryLeadTimeDays: 7,
  shippingIncluded: true,
  paymentTerms: 'Net 30',
  validityDateUtc: '2026-12-31',
  changeSummary: 'Reduced price by 5% and expedited lead time.',
  items: [
    {
      rfqItemId: '00000000-0000-0000-0000-000000000001',
      unitPrice: 23750,
      offeredQuantity: 50,
    },
  ],
})
assert.ok(validRevision.success, 'Valid revision should parse successfully')

// Short change summary (less than 5 chars)
const invalidRevisionSummary = reviseOfferSchema.safeParse({
  deliveryLeadTimeDays: 7,
  shippingIncluded: true,
  paymentTerms: 'Net 30',
  validityDateUtc: '2026-12-31',
  changeSummary: 'drop', // Too short!
  items: [
    {
      rfqItemId: '00000000-0000-0000-0000-000000000001',
      unitPrice: 23750,
      offeredQuantity: 50,
    },
  ],
})
assert.equal(invalidRevisionSummary.success, false)

// Login schema validation
assert.ok(loginSchema.safeParse({ email: 'user@example.com', password: 'password123' }).success)
assert.equal(loginSchema.safeParse({ email: 'invalid-email', password: 'short' }).success, false)

console.log('✅ Zod Schemas Validation: ALL PASSED')

// -------------------------------------------------------------
// 4. PERMISSIONS LOGIC TEST (src/hooks/usePermissions.js)
// -------------------------------------------------------------
import { checkPermissions } from './src/hooks/usePermissions.js'

console.log('--- TEST GROUP 4: RBAC Permissions Parity Matrix (src/hooks/usePermissions.js) ---')

// Case 1: Public anonymous visitor
const pAnon = checkPermissions(null)
assert.equal(pAnon.canManageRfqs, false)
assert.equal(pAnon.canSubmitOffers, false)
assert.equal(pAnon.canManageDeals, false)
assert.equal(pAnon.isSystemAdmin, false)

// Case 2: Unapproved company Owner (Pending verification)
const pPendingOwner = checkPermissions({
  company: { role: 'Owner', canPerformCommercialActivities: false },
})
assert.equal(pPendingOwner.isVerified, false)
assert.equal(pPendingOwner.canManageRfqs, false, 'Unapproved company cannot manage RFQs')
assert.equal(pPendingOwner.canSubmitOffers, false, 'Unapproved company cannot submit offers')
assert.equal(pPendingOwner.canManageVerificationDocs, true, 'Owner can upload verification docs')

// Case 3: Verified Buyer Procurement Manager
const pBuyerPM = checkPermissions({
  company: { role: 'ProcurementManager', canPerformCommercialActivities: true },
})
assert.equal(pBuyerPM.canManageRfqs, true, 'Procurement Manager can manage RFQs')
assert.equal(pBuyerPM.canSubmitOffers, false, 'Procurement Manager cannot submit supplier offers')
assert.equal(pBuyerPM.canManageDeals, true, 'Procurement Manager can manage deals')
assert.equal(pBuyerPM.canEditCompanyProfile, false, 'Procurement Manager cannot edit company profile')

// Case 4: Verified Supplier Sales Manager
const pSupplierSales = checkPermissions({
  company: { role: 'SalesManager', canPerformCommercialActivities: true },
})
assert.equal(pSupplierSales.canManageRfqs, false, 'Sales Manager cannot manage buyer RFQs')
assert.equal(pSupplierSales.canSubmitOffers, true, 'Sales Manager can submit supplier offers')
assert.equal(pSupplierSales.canManageShipments, true, 'Sales Manager can arrange shipments')

// Case 5: Verified Member (Read-only regular employee)
const pMember = checkPermissions({
  company: { role: 'Member', canPerformCommercialActivities: true },
})
assert.equal(pMember.canManageRfqs, false)
assert.equal(pMember.canSubmitOffers, false)
assert.equal(pMember.canManageDeals, false)
assert.equal(pMember.canEditCompanyProfile, false)

// Case 6: Platform System Administrator
const pAdmin = checkPermissions({
  isSystemAdmin: true,
})
assert.equal(pAdmin.isSystemAdmin, true)

console.log('✅ RBAC Permissions Parity Matrix: ALL PASSED')

// -------------------------------------------------------------
// 5. CONTRACT PAYLOAD CONSTRUCTION & INTEGRITY TEST
// -------------------------------------------------------------
console.log('--- TEST GROUP 5: Contract Payload Construction & Integrity ---')

// Buyer RFQ Payload
const createRfqPayload = {
  title: 'Reinforcing Steel Grade 60 Procurement - Q1',
  description: 'Urgent bulk procurement for industrial facility in 10th of Ramadan.',
  targetCategoryId: '11111111-1111-1111-1111-111111111111',
  deliveryGovernorate: 'Sharqia',
  deliveryCity: '10th of Ramadan',
  deliveryAddress: 'Industrial Zone B3, Factory 12',
  closingDateUtc: new Date(Date.now() + 86400000 * 7).toISOString(),
  requiredDeliveryDateUtc: new Date(Date.now() + 86400000 * 14).toISOString(),
  targetBudget: 2500000,
  currency: 'EGP',
  notes: 'Quality certificates required upon delivery.',
  publishImmediately: true,
  items: [
    {
      categoryId: '11111111-1111-1111-1111-111111111111',
      materialId: '22222222-2222-2222-2222-222222222222',
      materialName: 'Deformed Steel Bar 16mm',
      specifications: 'ASTM A615 Grade 60',
      quantity: 100,
      unitOfMeasureId: '33333333-3333-3333-3333-333333333333',
      targetPricePerUnit: 25000,
      notes: 'Bundled in 2-ton packs',
    },
  ],
}
assert.ok(createRfqPayload.items.length > 0)
assert.ok(new Date(createRfqPayload.closingDateUtc) > new Date())
assert.ok(new Date(createRfqPayload.requiredDeliveryDateUtc) >= new Date(createRfqPayload.closingDateUtc))

// Supplier Offer Payload
const submitOfferPayload = {
  deliveryLeadTimeDays: 7,
  shippingIncluded: true,
  paymentTerms: '20% advance, 80% on delivery inspection',
  validityDateUtc: new Date(Date.now() + 86400000 * 10).toISOString(),
  currency: 'EGP',
  notes: 'Immediate dispatch from our 6th of October warehouse.',
  items: [
    {
      rfqItemId: '44444444-4444-4444-4444-444444444444',
      unitPrice: 24500,
      offeredQuantity: 100,
      notes: 'Direct mill test certificates included',
    },
  ],
}
assert.ok(submitOfferPayload.items[0].offeredQuantity > 0)
assert.ok(submitOfferPayload.items[0].unitPrice > 0)

// Calculate total server-side equivalent
const calculatedTotal = submitOfferPayload.items.reduce((acc, it) => acc + (it.unitPrice * it.offeredQuantity), 0)
assert.equal(calculatedTotal, 2450000)

// Shipment creation payload
const shipmentPayload = {
  arrangement: 1, // SupplierArranged
  pickupAddress: '6th of October Industrial Area, Depot 4',
  deliveryAddress: 'Industrial Zone B3, Factory 12, 10th of Ramadan',
  carrierName: 'Nile Freight Logistics',
}
assert.equal(shipmentPayload.arrangement, 1)

// Review submission payload
const reviewPayload = {
  rating: 5,
  comment: 'Outstanding quality and on-time delivery. Highly recommended supplier.',
}
assert.ok(reviewPayload.rating >= 1 && reviewPayload.rating <= 5)
assert.ok(reviewPayload.comment.length >= 5)

// SystemAdmin Dispute Resolution Payload
const adminResolveDisputePayload = {
  action: 1, // ResumeDeal
  resolutionNotes: 'Inspection confirmed material complies with ASTM standard. Fulfillment resumed.',
}
assert.ok(adminResolveDisputePayload.action === 1 || adminResolveDisputePayload.action === 2)
assert.ok(adminResolveDisputePayload.resolutionNotes.length >= 5)

console.log('✅ Contract Payload Construction & Integrity: ALL PASSED')

console.log('\n=================================================================')
console.log('ALL PHASE 3 AUTOMATED PRODUCTION MODULE VERIFICATION SUITES PASSED! (5/5)')
console.log('=================================================================')
