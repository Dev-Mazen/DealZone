const META = {
  rfq: {
    Draft: { ar: 'مسودة', en: 'Draft', variant: 'navy' },
    Published: { ar: 'منشور', en: 'Published', variant: 'success' },
    Closed: { ar: 'مغلق', en: 'Closed', variant: 'warning' },
    Cancelled: { ar: 'ملغي', en: 'Cancelled', variant: 'error' },
    Awarded: { ar: 'تمت الترسية', en: 'Awarded', variant: 'success' },
  },
  offer: {
    Submitted: { ar: 'مقدَّم', en: 'Submitted', variant: 'info' },
    UnderReview: { ar: 'قيد المراجعة', en: 'Under review', variant: 'warning' },
    Accepted: { ar: 'مقبول', en: 'Accepted', variant: 'success' },
    Rejected: { ar: 'مرفوض', en: 'Rejected', variant: 'error' },
    Superseded: { ar: 'تم استبداله', en: 'Superseded', variant: 'navy' },
    Withdrawn: { ar: 'مسحوب', en: 'Withdrawn', variant: 'navy' },
    Expired: { ar: 'منتهي', en: 'Expired', variant: 'error' },
  },
  deal: {
    AwaitingConfirmation: { ar: 'بانتظار التأكيد', en: 'Awaiting confirmation', variant: 'warning' },
    Confirmed: { ar: 'مؤكدة', en: 'Confirmed', variant: 'info' },
    InProgress: { ar: 'قيد التنفيذ', en: 'In progress', variant: 'info' },
    Completed: { ar: 'مكتملة', en: 'Completed', variant: 'success' },
    Cancelled: { ar: 'ملغاة', en: 'Cancelled', variant: 'error' },
    Disputed: { ar: 'متنازع عليها', en: 'Disputed', variant: 'error' },
  },
  negotiation: {
    PendingSupplierResponse: { ar: 'بانتظار رد المورد', en: 'Awaiting supplier', variant: 'warning' },
    CounterofferPendingBuyerResponse: { ar: 'عرض مضاد بانتظار المشتري', en: 'Counteroffer awaiting buyer', variant: 'info' },
    Accepted: { ar: 'تم الاتفاق', en: 'Accepted', variant: 'success' },
    Rejected: { ar: 'مرفوض', en: 'Rejected', variant: 'error' },
    Cancelled: { ar: 'ملغي', en: 'Cancelled', variant: 'navy' },
    Expired: { ar: 'منتهي', en: 'Expired', variant: 'navy' },
  },
}

// Map numeric negotiation status codes to their string names
const NEGOTIATION_CODE_MAP = {
  0: 'PendingSupplierResponse',
  1: 'CounterofferPendingBuyerResponse',
  2: 'Accepted',
  3: 'Rejected',
  4: 'Expired',
  5: 'Cancelled',
}

/** statusMeta('negotiation', 2, isAr) or statusMeta('negotiation', 'Accepted', isAr) -> { label, variant } */
export function statusMeta(kind, status, isAr) {
  let key = status
  if (kind === 'negotiation' && (typeof status === 'number' || (typeof status === 'string' && /^\d+$/.test(status)))) {
    key = NEGOTIATION_CODE_MAP[Number(status)] ?? status
  }
  const m = META[kind]?.[key]
  if (!m) return { label: String(status ?? ''), variant: 'navy' }
  return { label: isAr ? m.ar : m.en, variant: m.variant }
}