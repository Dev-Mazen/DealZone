/**
 * Formatting utilities for DealZone
 * - EGP currency (decimal 18,2)
 * - Material quantities (decimal 18,4)
 * - Dates in ar-EG / en-US
 * - Status labels
 */

// ============================================================
// Currency
// ============================================================

export function formatCurrency(amount, lang = 'en') {
  if (amount == null || amount === '') return '—'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '—'

  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

// ============================================================
// Quantities (up to 4 decimal places, no trailing zeros)
// ============================================================

export function formatQuantity(value, lang = 'en') {
  if (value == null || value === '') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'

  return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(num)
}

// ============================================================
// Dates
// ============================================================

export function formatDate(iso, lang = 'en') {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function formatDateTime(iso, lang = 'en') {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function formatRelativeTime(iso, lang = 'en') {
  if (!iso) return '—'
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days = Math.floor(diff / 86_400_000)

    const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { numeric: 'auto' })

    if (minutes < 1) return lang === 'ar' ? 'الآن' : 'just now'
    if (minutes < 60) return rtf.format(-minutes, 'minute')
    if (hours < 24) return rtf.format(-hours, 'hour')
    return rtf.format(-days, 'day')
  } catch {
    return formatDate(iso, lang)
  }
}

// ============================================================
// File size
// ============================================================

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

// ============================================================
// Localized field helper (bilingual backend fields)
// ============================================================

export function getLocalizedField(obj, fieldBase, lang) {
  if (!obj) return ''
  const primary = lang === 'ar' ? `${fieldBase}Ar` : `${fieldBase}En`
  const fallback = lang === 'ar' ? `${fieldBase}En` : `${fieldBase}Ar`
  return obj[primary] || obj[fallback] || obj[fieldBase] || ''
}

// ============================================================
// Status label maps
// ============================================================

export const rfqStatusColors = {
  Draft: 'badge-navy',
  Published: 'badge-info',
  Closed: 'badge-warning',
  Cancelled: 'badge-error',
}

export const offerStatusColors = {
  Submitted: 'badge-info',
  UnderReview: 'badge-warning',
  Accepted: 'badge-success',
  Rejected: 'badge-error',
  Superseded: 'badge-navy',
  Withdrawn: 'badge-navy',
  Expired: 'badge-warning',
}

export const dealStatusColors = {
  AwaitingConfirmation: 'badge-warning',
  Confirmed: 'badge-info',
  InProgress: 'badge-cyan',
  Disputed: 'badge-error',
  Completed: 'badge-success',
  Cancelled: 'badge-error',
}

export const verificationStatusColors = {
  Pending: 'badge-navy',
  UnderReview: 'badge-warning',
  Approved: 'badge-success',
  Rejected: 'badge-error',
  ChangesRequired: 'badge-warning',
}

export const shipmentStatusColors = {
  Pending: 'badge-navy',
  Assigned: 'badge-info',
  PickedUp: 'badge-cyan',
  InTransit: 'badge-cyan',
  OutForDelivery: 'badge-info',
  Delivered: 'badge-success',
  Failed: 'badge-error',
  Cancelled: 'badge-error',
}

export const disputeStatusColors = {
  Open: 'badge-error',
  UnderReview: 'badge-warning',
  Resolved: 'badge-success',
  Dismissed: 'badge-navy',
}

export function rfqStatusVariant(status) {
  return { Draft: 'navy', Published: 'info', Closed: 'warning', Cancelled: 'error' }[status] ?? 'gray'
}

export function offerStatusVariant(status) {
  return {
    Submitted: 'info',
    UnderReview: 'warning',
    Accepted: 'success',
    Rejected: 'error',
    Superseded: 'gray',
    Withdrawn: 'gray',
    Expired: 'warning',
  }[status] ?? 'gray'
}

export function dealStatusVariant(status) {
  return {
    AwaitingConfirmation: 'warning',
    Confirmed: 'info',
    InProgress: 'cyan',
    Disputed: 'error',
    Completed: 'success',
    Cancelled: 'error',
  }[status] ?? 'gray'
}

export function verificationStatusVariant(status) {
  return {
    Pending: 'navy',
    UnderReview: 'warning',
    Approved: 'success',
    Rejected: 'error',
    ChangesRequired: 'warning',
  }[status] ?? 'gray'
}

export function shipmentStatusVariant(status) {
  return {
    Pending: 'navy',
    Assigned: 'info',
    PickedUp: 'cyan',
    InTransit: 'cyan',
    OutForDelivery: 'info',
    Delivered: 'success',
    Failed: 'error',
    Cancelled: 'error',
  }[status] ?? 'gray'
}

export function disputeStatusVariant(status) {
  return {
    Open: 'error',
    UnderReview: 'warning',
    Resolved: 'success',
    Dismissed: 'gray',
  }[status] ?? 'gray'
}

export function tenderStatusVariant(status) {
  return {
    Draft: 'navy',
    Published: 'success',
    Closed: 'warning',
    Awarded: 'info',
    Cancelled: 'error',
    NoAward: 'gray',
  }[status] ?? 'gray'
}

export function bidStatusVariant(status) {
  return {
    Submitted: 'info',
    UnderReview: 'warning',
    Accepted: 'success',
    Rejected: 'error',
    Withdrawn: 'gray',
    Superseded: 'navy',
  }[status] ?? 'gray'
}

