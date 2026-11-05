import { useAuthStore } from '../store/authStore.js'

/**
 * Pure authorization evaluation based on actual backend role definitions and invariants.
 */
export function checkPermissions(user) {
  const company = user?.company

  const isSystemAdmin = user?.isSystemAdmin === true
  const role = company?.role
  const isVerified = company?.canPerformCommercialActivities === true

  // Role checks
  const isOwner = role === 'Owner'
  const isAdmin = role === 'Admin'
  const isProcurementManager = role === 'ProcurementManager'
  const isSalesManager = role === 'SalesManager'
  const isMember = role === 'Member'

  const hasCompany = !!company

  // ── Buyer operations (RFQ creation, offer acceptance) ──
  const canManageRfqs =
    isVerified && (isOwner || isAdmin || isProcurementManager)

  // ── Supplier operations (offer submission) ──
  const canSubmitOffers =
    isVerified && (isOwner || isAdmin || isSalesManager)

  // ── Deal management ──
  const canManageDeals =
    isVerified &&
    (isOwner || isAdmin || isProcurementManager || isSalesManager)

  // ── Company profile management ──
  const canEditCompanyProfile = isOwner || isAdmin

  // ── Verification document management ──
  const canManageVerificationDocs = isOwner || isAdmin

  // ── Shipment management ──
  const canManageShipments =
    isVerified && (isOwner || isAdmin || isSalesManager)

  // ── Read-only member ──
  const canViewCommercial = isVerified || isMember

  return {
    isSystemAdmin,
    hasCompany,
    isVerified,
    role,
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
  return checkPermissions(user)
}

