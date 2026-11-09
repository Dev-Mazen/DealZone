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

  // Company commercial capability type
  const companyType = company?.companyType || 'Both'
  const isBuyer = companyType === 'Buyer' || companyType === 'Both'
  const isSupplier = companyType === 'Supplier' || companyType === 'Both'
  const isBuyerOnly = companyType === 'Buyer'
  const isSupplierOnly = companyType === 'Supplier'
  const hasBothCapabilities = companyType === 'Both'

  // Role checks within company
  const isOwner = role === 'Owner'
  const isAdmin = role === 'Admin'
  const isProcurementManager = role === 'ProcurementManager'
  const isSalesManager = role === 'SalesManager'
  const isMember = role === 'Member'

  // ── Buyer operations (RFQ creation, offer acceptance) ──
  const canManageRfqs =
    hasCompany &&
    isVerified &&
    isBuyer &&
    (isOwner || isAdmin || isProcurementManager)

  // ── Supplier operations (offer submission) ──
  const canSubmitOffers =
    hasCompany &&
    isVerified &&
    isSupplier &&
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

  // ── Shipment management ──
  const canManageShipments =
    hasCompany &&
    isVerified &&
    isSupplier &&
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
    isOwner,
    isAdmin,
    isProcurementManager,
    isSalesManager,
    isMember,
    canManageRfqs,
    canSubmitOffers,
    canManageDeals,
    canEditCompanyProfile,
    canManageVerificationDocs,
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
