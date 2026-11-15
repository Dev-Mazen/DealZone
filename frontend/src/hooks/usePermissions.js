import { useAuthStore } from '../store/authStore.js'

/**
 * Pure authorization evaluation based on actual backend role definitions and invariants.
 */
export function checkPermissions(user) {
  const company = user?.company

  const isSystemAdmin = user?.isSystemAdmin === true
  const role = company?.role
  const isVerified = company?.canPerformCommercialActivities === true
  const hasCompany = !!company

  // Company commercial capability type: authority directly from database
  const companyType = company?.companyType || 'Buyer'
  const isBuyer = companyType === 'Buyer'
  const isSupplier = companyType === 'Supplier'
  const isBuyerOnly = isBuyer
  const isSupplierOnly = isSupplier
  const hasBothCapabilities = false

  // Operating context directly matches company capability
  const canActAsBuyer = isBuyer
  const canActAsSupplier = isSupplier

  // Role checks within company
  const isOwner = role === 'Owner'
  const isAdmin = role === 'Admin'
  const isProcurementManager = role === 'ProcurementManager'
  const isSalesManager = role === 'SalesManager'
  const isMember = role === 'Member'

  // ── Buyer operations (RFQ creation, offer acceptance, Buy Now, Negotiations) ──
  const canManageRfqs =
    hasCompany &&
    isVerified &&
    canActAsBuyer &&
    (isOwner || isAdmin || isProcurementManager)

  const canBuyNow =
    hasCompany &&
    isVerified &&
    canActAsBuyer &&
    (isOwner || isAdmin || isProcurementManager)

  const canNegotiate =
    hasCompany &&
    isVerified &&
    canActAsBuyer &&
    (isOwner || isAdmin || isProcurementManager)

  // ── Supplier operations (offer submission, product listing) ──
  const canSubmitOffers =
    hasCompany &&
    isVerified &&
    canActAsSupplier &&
    (isOwner || isAdmin || isSalesManager)

  const canListProducts =
    hasCompany &&
    isVerified &&
    canActAsSupplier &&
    (isOwner || isAdmin || isSalesManager)

  // ── Deal management ──
  const canManageDeals =
    hasCompany &&
    isVerified &&
    (isOwner || isAdmin || isProcurementManager || isSalesManager)

  // ── Company profile management ──
  const canEditCompanyProfile = hasCompany && (isOwner || isAdmin)

  // ── Verification document management ──
  const canManageVerificationDocs = hasCompany && (isOwner || isAdmin)

  // ── Company member management ──
  const canManageCompanyMembers = hasCompany && (isOwner || isAdmin)

  // ── Shipment management ──
  const canManageShipments =
    hasCompany &&
    isVerified &&
    canActAsSupplier &&
    (isOwner || isAdmin || isSalesManager)

  // ── Read-only member ──
  const canViewCommercial = hasCompany && (isVerified || isMember)

  return {
    isSystemAdmin,
    hasCompany,
    isVerified,
    role,
    companyType,
    isBuyer,
    isSupplier,
    isBuyerOnly,
    isSupplierOnly,
    hasBothCapabilities,
    canActAsBuyer,
    canActAsSupplier,
    operatingRole: isBuyer ? 'Buyer' : (isSupplier ? 'Supplier' : null),
    isOwner,
    isAdmin,
    isProcurementManager,
    isSalesManager,
    isMember,
    canManageRfqs,
    canBuyNow,
    canNegotiate,
    canListProducts,
    canSubmitOffers,
    canManageDeals,
    canEditCompanyProfile,
    canManageVerificationDocs,
    canManageCompanyMembers,
    canManageShipments,
    canViewCommercial,
  }
}

/**
 * React hook accessing the current user permissions from store.
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user)
  const isAuthLoading = useAuthStore((s) => s.isLoading)
  return { ...checkPermissions(user), isAuthLoading }
}
