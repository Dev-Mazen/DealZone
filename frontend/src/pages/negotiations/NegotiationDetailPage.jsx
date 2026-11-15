import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Handshake, Clock, Building2, Calendar, MapPin, AlertCircle } from 'lucide-react'
import { negotiationService } from '../../shared/api/services/negotiationService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../../hooks/useToast'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { NumberField } from '../../components/ui/FormControls'
import { formatDateTime } from '../../utils/format'

// The API returns BOTH a numeric `status` and a string `statusName`. Always use the name.
const TERMINAL = ['Accepted', 'Rejected', 'Cancelled']

const STATUS_META = {
  PendingSupplierResponse: { ar: 'بانتظار رد المورد', en: 'Pending supplier response', variant: 'warning' },
  CounterofferPendingBuyerResponse: { ar: 'عرض مضاد بانتظار رد المشتري', en: 'Counteroffer pending buyer', variant: 'info' },
  Accepted: { ar: 'تم القبول', en: 'Accepted', variant: 'success' },
  Rejected: { ar: 'مرفوض', en: 'Rejected', variant: 'error' },
  Cancelled: { ar: 'ملغي من المشتري', en: 'Cancelled by buyer', variant: 'navy' },
}

function ActionModal({ isOpen, title, onClose, error, isAr, confirmLabel, confirmVariant = 'primary', pending, confirmDisabled, onConfirm, children }) {
  return (
    <Modal isOpen={isOpen} onClose={pending ? () => {} : onClose} title={title}>
      <div className="space-y-4 text-xs" dir={isAr ? 'rtl' : 'ltr'}>
        {error && <Alert variant="danger">{error}</Alert>}
        {children}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={pending}>
            {isAr ? 'تراجع' : 'Back'}
          </Button>
          <Button variant={confirmVariant} size="sm" loading={pending} disabled={pending || confirmDisabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function NegotiationDetailPage() {
  const { negotiationId } = useParams()
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const t = (ar, en) => (isAr ? ar : en)
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { isSupplier } = usePermissions()

  const [actionType, setActionType] = useState(null) // 'counter' | 'accept' | 'reject' | 'cancel'
  const [counterPrice, setCounterPrice] = useState('')
  const [counterQty, setCounterQty] = useState('')
  const [counterNotes, setCounterNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [actionError, setActionError] = useState(null)

  const { data: neg, isLoading, error } = useQuery({
    queryKey: ['negotiations', negotiationId],
    queryFn: () => negotiationService.getById(negotiationId),
    enabled: !!negotiationId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['negotiations', negotiationId] })
    queryClient.invalidateQueries({ queryKey: ['negotiations', 'mine'] })
  }

  // 409 = the negotiation changed under us: close the dialog, reload, tell the user.
  const onActionError = (fallback) => (err) => {
    const detail = err?.problem?.detail || err?.message || fallback
    if (err?.status === 409) {
      setActionType(null)
      toast.error(t('تم تحديث هذا التفاوض. راجع آخر حالة ثم حاول مرة أخرى.', 'This negotiation was updated. Review the latest state and try again.'))
      invalidate()
    } else {
      setActionError(detail)
    }
  }

  const done = (message, kind = 'success') => {
    toast[kind](message)
    setActionType(null)
    invalidate()
  }

  const counterMutation = useMutation({
    mutationFn: () =>
      // Field names match backend CounterNegotiationRequest DTO: ProposedUnitPrice, Quantity, DeliveryLeadTimeDays, Notes
      negotiationService.counter(negotiationId, {
        proposedUnitPrice: Number(counterPrice),
        quantity: Number(counterQty) || neg?.quantity,
        deliveryLeadTimeDays: neg?.deliveryLeadTimeDays,
        notes: counterNotes.trim() || null,
      }),
    onSuccess: () => done(t('تم إرسال العرض المضاد', 'Counteroffer sent')),
    onError: onActionError('Failed to submit counteroffer'),
  })

  const acceptMutation = useMutation({
    mutationFn: () => negotiationService.accept(negotiationId),
    onSuccess: (res) => {
      // Use ONLY dealId. `res.id` is the negotiation's id, not the deal's.
      const dealId = res?.dealId
      done(t('تم قبول العرض وإنشاء الصفقة', 'Offer accepted and deal created'))
      if (dealId) navigate(`/deals/${dealId}`)
    },
    onError: onActionError('Failed to accept offer'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => negotiationService.reject(negotiationId, { reason: rejectReason.trim() || null }),
    onSuccess: () => done(t('تم رفض العرض', 'Offer rejected'), 'info'),
    onError: onActionError('Failed to reject offer'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => negotiationService.cancel(negotiationId),
    onSuccess: () => done(t('تم إلغاء التفاوض', 'Negotiation cancelled'), 'info'),
    onError: onActionError('Failed to cancel negotiation'),
  })

  if (isLoading) return <PageSpinner />

  if (error || !neg) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-800">{t('لم يتم العثور على التفاوض', 'Negotiation not found')}</h2>
        <Button as={Link} to="/negotiations" variant="outline" size="sm" className="mt-4">
          {t('العودة للمفاوضات', 'Back to negotiations')}
        </Button>
      </div>
    )
  }

  /* ---------- derived state (all from the real API fields) ---------- */
  const statusKey = neg.statusName || String(neg.status)
  const statusInfo = STATUS_META[statusKey] || { ar: statusKey, en: statusKey, variant: 'navy' }
  const isTerminal = TERMINAL.includes(statusKey)

  // Whose turn: the side that did NOT make the last action.
  const lastWasBuyer = neg.lastActionByCompanyId === neg.buyerCompanyId
  const isMyTurn = !isTerminal && (isSupplier ? lastWasBuyer : !lastWasBuyer)
  const canCancel = !isTerminal && !isSupplier // buyer only

  const price = neg.currentUnitPrice
  const qty = neg.quantity
  const total = neg.currentTotalPrice ?? (price || 0) * (qty || 0)
  const unit = neg.productUnit || neg.unit || ''
  const round = neg.revisions?.length || 1
  const prodName = isAr ? neg.productNameAr || neg.productNameEn : neg.productNameEn || neg.productNameAr

  const busy = counterMutation.isPending || acceptMutation.isPending || rejectMutation.isPending || cancelMutation.isPending
  const open = (type) => {
    setActionError(null)
    setActionType(type)
  }
  const openCounter = () => {
    setCounterPrice(price ?? '')
    setCounterQty(qty ?? '')
    setCounterNotes('')
    open('counter')
  }
  const close = () => setActionType(null)

  const waitingText = isMyTurn
    ? t('دورك الآن: يمكنك القبول أو الرفض أو تقديم عرض مضاد.', 'Your turn: accept, reject or send a counteroffer.')
    : t('بانتظار رد الطرف الآخر.', 'Waiting for the other party.')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/negotiations" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1266D6] hover:text-[#06245B] transition-colors">
          {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{t('العودة للمفاوضات', 'Back to negotiations')}</span>
        </Link>

        {neg.dealId ? (
          <Button as={Link} to={`/deals/${neg.dealId}`} variant="primary" size="sm" icon={<Handshake size={14} />}>
            {t('عرض الصفقة', 'View deal')}
          </Button>
        ) : (
          neg.dealNumber && <span className="text-xs font-mono font-bold text-slate-500">{neg.dealNumber}</span>
        )}
      </div>

      {/* Overview */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-slate-400">{neg.negotiationNumber}</span>
              <Badge variant={statusInfo.variant}>{isAr ? statusInfo.ar : statusInfo.en}</Badge>
              <span className="text-xs text-slate-500 font-medium">{t(`الجولة ${round}`, `Round ${round}`)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B]">{prodName}</h1>
            {neg.productSku && <p className="text-xs text-slate-400 font-mono mt-1">SKU: {neg.productSku}</p>}
          </div>

          <div className="bg-[#EAF4FF]/60 rounded-2xl p-4 border border-[#1266D6]/20 text-start sm:text-end shrink-0">
            <span className="text-xs text-slate-500 block">{t('السعر الحالي', 'Current price')}</span>
            <span className="text-xl font-extrabold text-[#06245B]">
              {price?.toLocaleString()} {neg.currency}
              {unit && <span className="text-xs font-normal text-slate-400"> / {unit}</span>}
            </span>
            <span className="text-xs font-semibold text-slate-600 block mt-0.5">
              {t('الكمية:', 'Qty:')} {qty?.toLocaleString()} {unit}
            </span>
            <span className="text-xs font-bold text-[#1266D6] block mt-1">
              {t('الإجمالي:', 'Total:')} {total.toLocaleString()} {neg.currency}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">{t('المشتري', 'Buyer')}</span>
            <span className="font-bold text-[#06245B] text-sm flex items-center gap-1.5">
              <Building2 size={14} className="text-[#1266D6]" />
              {neg.buyerCompanyName}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">{t('المورد', 'Supplier')}</span>
            <span className="font-bold text-[#06245B] text-sm flex items-center gap-1.5">
              <Building2 size={14} className="text-emerald-600" />
              {neg.supplierCompanyName}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">{t('مدة التوريد', 'Lead time')}</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              {neg.deliveryLeadTimeDays ? t(`${neg.deliveryLeadTimeDays} يوم`, `${neg.deliveryLeadTimeDays} days`) : t('غير محددة', 'Not specified')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">{t('عنوان التسليم', 'Delivery address')}</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-400" />
              {neg.deliveryAddress || t('حسب الاتفاق', 'To be agreed')}
            </span>
          </div>
        </div>

        {neg.rejectionReason && (
          <p className="mt-4 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
            <strong>{t('سبب الرفض: ', 'Rejection reason: ')}</strong>
            {neg.rejectionReason}
          </p>
        )}

        {/* Actions only while the negotiation is open */}
        {!isTerminal && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl">
            <div className="text-xs font-medium text-slate-600">{waitingText}</div>
            <div className="flex flex-wrap items-center gap-2">
              {isMyTurn && (
                <>
                  <Button variant="outline" size="sm" onClick={openCounter} disabled={busy}>
                    {t('عرض مضاد', 'Counteroffer')}
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => open('accept')} disabled={busy}>
                    {t('قبول العرض', 'Accept offer')}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => open('reject')} disabled={busy}>
                    {t('رفض', 'Reject')}
                  </Button>
                </>
              )}
              {canCancel && (
                <Button variant="ghost" size="sm" onClick={() => open('cancel')} disabled={busy}>
                  {t('إلغاء التفاوض', 'Cancel negotiation')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-extrabold text-[#06245B] text-lg flex items-center gap-2">
          <Clock size={18} className="text-[#1266D6]" />
          <span>{t('سجل الجولات', 'Negotiation history')}</span>
        </h3>

        <div className="space-y-4 pt-2">
          {neg.revisions?.map((rev) => {
            const byBuyer = rev.proposedByCompanyId === neg.buyerCompanyId
            const revTotal = rev.totalPrice ?? (rev.unitPrice || 0) * (rev.quantity || 0)
            return (
              <div
                key={rev.revisionNumber}
                className={`p-4 rounded-2xl border space-y-2.5 ${byBuyer ? 'bg-[#F4F7FB]/70 border-blue-100' : 'bg-emerald-50/50 border-emerald-100'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#06245B] px-2 py-0.5 rounded bg-white border border-slate-200">
                      {t(`الجولة ${rev.revisionNumber}`, `Round ${rev.revisionNumber}`)}
                    </span>
                    <span className="font-semibold text-slate-700">{byBuyer ? t('المشتري', 'Buyer') : t('المورد', 'Supplier')}</span>
                  </div>
                  <span className="text-slate-400 font-mono">{formatDateTime(rev.createdAtUtc)}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block">{t('سعر الوحدة', 'Unit price')}</span>
                    <strong className="text-slate-800 text-sm">{rev.unitPrice?.toLocaleString()} {neg.currency}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{t('الكمية', 'Quantity')}</span>
                    <strong className="text-slate-800 text-sm">{rev.quantity?.toLocaleString()} {unit}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{t('الإجمالي', 'Total')}</span>
                    <strong className="text-[#1266D6] text-sm">{revTotal.toLocaleString()} {neg.currency}</strong>
                  </div>
                </div>

                {rev.notes && (
                  <p className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-100">
                    <strong>{t('ملاحظات: ', 'Notes: ')}</strong>
                    {rev.notes}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modals */}
      <ActionModal
        isOpen={actionType === 'counter'}
        title={t('تقديم عرض مضاد', 'Submit counteroffer')}
        onClose={close}
        error={actionError}
        isAr={isAr}
        pending={counterMutation.isPending}
        confirmDisabled={!(Number(counterPrice) > 0) || !(Number(counterQty) > 0)}
        confirmLabel={t('إرسال العرض المضاد', 'Send counteroffer')}
        onConfirm={() => counterMutation.mutate()}
      >
        <div>
          <label className="block font-bold text-[#06245B] mb-1">
            {t('سعر الوحدة الجديد', 'New unit price')} ({neg.currency})
          </label>
          <NumberField value={counterPrice} onChange={setCounterPrice} min={0.01} step={1} decimals={2} suffix={neg.currency} />
        </div>
        <div>
          <label className="block font-bold text-[#06245B] mb-1">{t('الكمية', 'Quantity')} {unit && `(${unit})`}</label>
          <NumberField value={counterQty} onChange={setCounterQty} min={1} step={1} decimals={2} suffix={unit} />
        </div>
        <div>
          <label className="block font-bold text-[#06245B] mb-1">{t('ملاحظات (اختياري)', 'Notes (optional)')}</label>
          <textarea rows={2} value={counterNotes} onChange={(e) => setCounterNotes(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300" />
        </div>
      </ActionModal>

      <ActionModal
        isOpen={actionType === 'accept'}
        title={t('تأكيد قبول العرض', 'Confirm acceptance')}
        onClose={close}
        error={actionError}
        isAr={isAr}
        pending={acceptMutation.isPending}
        confirmLabel={t('تأكيد القبول', 'Confirm accept')}
        onConfirm={() => acceptMutation.mutate()}
      >
        <p className="text-slate-600 leading-relaxed">
          {t(
            `سيتم قبول العرض بسعر ${price?.toLocaleString()} ${neg.currency} للكمية ${qty} وإنشاء صفقة ملزمة. هل تريد المتابعة؟`,
            `You are accepting ${price?.toLocaleString()} ${neg.currency} × ${qty}. This creates a binding deal. Continue?`
          )}
        </p>
      </ActionModal>

      <ActionModal
        isOpen={actionType === 'reject'}
        title={t('رفض العرض', 'Reject offer')}
        onClose={close}
        error={actionError}
        isAr={isAr}
        confirmVariant="danger"
        pending={rejectMutation.isPending}
        confirmLabel={t('تأكيد الرفض', 'Confirm reject')}
        onConfirm={() => rejectMutation.mutate()}
      >
        <div>
          <label className="block font-bold text-[#06245B] mb-1">{t('سبب الرفض (اختياري)', 'Reason (optional)')}</label>
          <textarea rows={2} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-300" />
        </div>
      </ActionModal>

      <ActionModal
        isOpen={actionType === 'cancel'}
        title={t('إلغاء التفاوض', 'Cancel negotiation')}
        onClose={close}
        error={actionError}
        isAr={isAr}
        confirmVariant="danger"
        pending={cancelMutation.isPending}
        confirmLabel={t('تأكيد الإلغاء', 'Confirm cancel')}
        onConfirm={() => cancelMutation.mutate()}
      >
        <p className="text-slate-600">
          {t('لا يمكن استئناف التفاوض بعد إلغائه. هل تريد المتابعة؟', 'A cancelled negotiation cannot be resumed. Continue?')}
        </p>
      </ActionModal>
    </div>
  )
}