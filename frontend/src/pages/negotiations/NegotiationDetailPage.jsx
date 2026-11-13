import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Handshake,
  Clock,
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  MessageSquare,
} from 'lucide-react'
import { negotiationService } from '../../shared/api/services/negotiationService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../../hooks/useToast'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Alert from '../../components/ui/Alert'
import Modal from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatDate, formatDateTime } from '../../utils/format'

const statusMap = {
  PendingSupplierResponse: {
    ar: 'بانتظار رد المورد',
    en: 'Pending Supplier Response',
    variant: 'warning',
  },
  CounterofferPendingBuyerResponse: {
    ar: 'عرض مضاد بانتظار رد المشتري',
    en: 'Counteroffer Pending Buyer',
    variant: 'info',
  },
  Accepted: {
    ar: 'تم قبول العرض (مبرم الصفقة)',
    en: 'Accepted (Deal Created)',
    variant: 'success',
  },
  Rejected: {
    ar: 'مرفوض',
    en: 'Rejected',
    variant: 'error',
  },
  Cancelled: {
    ar: 'ملغي من قبل المشتري',
    en: 'Cancelled by Buyer',
    variant: 'navy',
  },
}

export default function NegotiationDetailPage() {
  const { negotiationId } = useParams()
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { isBuyer, isSupplier } = usePermissions()

  // Modal / action state
  const [actionType, setActionType] = useState(null) // 'counter' | 'accept' | 'reject' | 'cancel'
  const [counterPrice, setCounterPrice] = useState('')
  const [counterQty, setCounterQty] = useState('')
  const [counterDate, setCounterDate] = useState('')
  const [counterLocation, setCounterLocation] = useState('')
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

  // Counter mutation
  const counterMutation = useMutation({
    mutationFn: () =>
      negotiationService.counter(negotiationId, {
        proposedQuantity: Number(counterQty) || neg.currentProposedQuantity,
        proposedUnitPrice: Number(counterPrice),
        targetDeliveryDate: counterDate ? new Date(counterDate).toISOString() : null,
        deliveryLocation: counterLocation.trim() || null,
        notes: counterNotes.trim() || null,
      }),
    onSuccess: () => {
      toast.success(isAr ? 'تم إرسال العرض المقابل بنجاح' : 'Counteroffer sent successfully')
      setActionType(null)
      invalidate()
    },
    onError: (err) => {
      setActionError(err?.problem?.detail || err?.message || 'Failed to submit counteroffer')
    },
  })

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: () => negotiationService.accept(negotiationId),
    onSuccess: (deal) => {
      toast.success(isAr ? 'تم قبول العرض وإنشاء الصفقة بنجاح!' : 'Offer accepted and deal created!')
      setActionType(null)
      invalidate()
      if (deal?.dealId || deal?.id) {
        navigate(`/deals/${deal.dealId || deal.id}`)
      }
    },
    onError: (err) => {
      setActionError(err?.problem?.detail || err?.message || 'Failed to accept offer')
    },
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: () => negotiationService.reject(negotiationId, { reason: rejectReason }),
    onSuccess: () => {
      toast.info(isAr ? 'تم رفض العرض' : 'Offer rejected')
      setActionType(null)
      invalidate()
    },
    onError: (err) => {
      setActionError(err?.problem?.detail || err?.message || 'Failed to reject offer')
    },
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => negotiationService.cancel(negotiationId),
    onSuccess: () => {
      toast.info(isAr ? 'تم إلغاء التفاوض' : 'Negotiation cancelled')
      setActionType(null)
      invalidate()
    },
    onError: (err) => {
      setActionError(err?.problem?.detail || err?.message || 'Failed to cancel negotiation')
    },
  })

  if (isLoading) return <PageSpinner />

  if (error || !neg) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-800">
          {isAr ? 'لم يتم العثور على جلسة التفاوض' : 'Negotiation Session Not Found'}
        </h2>
        <Button as={Link} to="/negotiations" variant="outline" size="sm" className="mt-4">
          {isAr ? 'العودة لقائمة المفاوضات' : 'Back to Negotiations'}
        </Button>
      </div>
    )
  }

  const statusInfo = statusMap[neg.status] || { ar: neg.status, en: neg.status, variant: 'navy' }
  const prodName = isAr ? neg.productNameAr : (neg.productNameEn || neg.productNameAr)
  const isTerminal = neg.status === 'Accepted' || neg.status === 'Rejected' || neg.status === 'Cancelled'
  const isPendingSupplier = neg.status === 'PendingSupplierResponse'
  const isPendingBuyer = neg.status === 'CounterofferPendingBuyerResponse'

  const openCounterModal = () => {
    setActionError(null)
    setCounterPrice(neg.currentProposedUnitPrice ?? neg.currentUnitPrice)
    setCounterQty(neg.currentProposedQuantity ?? neg.quantity)
    setCounterDate(neg.targetDeliveryDate ? neg.targetDeliveryDate.split('T')[0] : '')
    setCounterLocation(neg.deliveryLocation || '')
    setCounterNotes('')
    setActionType('counter')
  }

  return (
    <div className="space-y-6">
      {/* Top back & actions bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/negotiations"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1266D6] hover:text-[#06245B] transition-colors"
        >
          {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          <span>{isAr ? 'العودة للمفاوضات' : 'Back to Negotiations'}</span>
        </Link>

        {neg.resultingDealId && (
          <Button
            as={Link}
            to={`/deals/${neg.resultingDealId}`}
            variant="primary"
            size="sm"
            icon={<Handshake size={14} />}
          >
            {isAr ? 'عرض الصفقة المبرمة' : 'View Resulting Deal'}
          </Button>
        )}
      </div>

      {/* Main Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-slate-400">
                {neg.negotiationNumber}
              </span>
              <Badge variant={statusInfo.variant}>
                {isAr ? statusInfo.ar : statusInfo.en}
              </Badge>
              <span className="text-xs text-slate-500 font-medium">
                {isAr ? `الجولة رقم: ${neg.currentRound}` : `Round: ${neg.currentRound}`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B]">
              {prodName}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              SKU: {neg.productSku}
            </p>
          </div>

          {/* Current terms summary */}
          <div className="bg-[#EAF4FF]/60 rounded-2xl p-4 border border-[#1266D6]/20 text-start sm:text-end shrink-0">
            <span className="text-xs text-slate-500 block">
              {isAr ? 'السعر المقترح حالياً:' : 'Current Proposed Price:'}
            </span>
            <span className="text-xl font-extrabold text-[#06245B]">
              {(neg.currentProposedUnitPrice ?? neg.currentUnitPrice)?.toLocaleString()} {neg.currency}
            </span>
            <span className="text-xs font-semibold text-slate-600 block mt-0.5">
              {isAr ? 'الكمية:' : 'Qty:'} {neg.currentProposedQuantity ?? neg.quantity} {neg.productUnit || neg.unit || 'ton'}
            </span>
            <span className="text-xs font-bold text-[#1266D6] block mt-1">
              {isAr ? 'الإجمالي:' : 'Total:'}{' '}
              {(((neg.currentProposedUnitPrice ?? neg.currentUnitPrice) || 0) * ((neg.currentProposedQuantity ?? neg.quantity) || 0)).toLocaleString()}{' '}
              {neg.currency}
            </span>
          </div>
        </div>

        {/* Parties & Logistics details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">{isAr ? 'المشتري' : 'Buyer'}</span>
            <span className="font-bold text-[#06245B] text-sm flex items-center gap-1.5">
              <Building2 size={14} className="text-[#1266D6]" />
              {neg.buyerCompanyName}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">{isAr ? 'المورد' : 'Supplier'}</span>
            <span className="font-bold text-[#06245B] text-sm flex items-center gap-1.5">
              <Building2 size={14} className="text-emerald-600" />
              {neg.supplierCompanyName}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">{isAr ? 'تاريخ التوريد المطلوب' : 'Target Delivery'}</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              {neg.targetDeliveryDate ? formatDate(neg.targetDeliveryDate) : (isAr ? 'غير محدد' : 'Not specified')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">{isAr ? 'موقع التسليم' : 'Delivery Location'}</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-400" />
              {neg.deliveryLocation || (isAr ? 'حسب الاتفاق' : 'To be agreed')}
            </span>
          </div>
        </div>

        {/* Action button bar for active sessions */}
        {!isTerminal && (
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl">
            <div className="text-xs font-medium text-slate-600">
              {isPendingSupplier && (isAr ? 'الدور الحالي: بانتظار رد المورد (قبول، رفض، أو عرض مضاد)' : 'Turn: Awaiting Supplier response')}
              {isPendingBuyer && (isAr ? 'الدور الحالي: بانتظار رد المشتري على العرض المضاد' : 'Turn: Awaiting Buyer response to counteroffer')}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openCounterModal}
              >
                {isAr ? 'تقديم عرض مضاد' : 'Counteroffer'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => { setActionError(null); setActionType('accept') }}
              >
                {isAr ? 'قبول العرض الحالي' : 'Accept Current Offer'}
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => { setActionError(null); setActionType('reject') }}
              >
                {isAr ? 'رفض' : 'Reject'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setActionError(null); setActionType('cancel') }}
              >
                {isAr ? 'إلغاء التفاوض' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Revision History Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-extrabold text-[#06245B] text-lg flex items-center gap-2">
          <Clock size={18} className="text-[#1266D6]" />
          <span>{isAr ? 'سجل جولات التفاوض والتعديلات' : 'Negotiation Rounds & History'}</span>
        </h3>

        <div className="space-y-4 pt-2">
          {neg.revisions?.map((rev, idx) => {
            const isBuyerRevision = rev.submittedByCompanyId === neg.buyerCompanyId
            return (
              <div
                key={rev.id || idx}
                className={`p-4.5 rounded-2xl border ${
                  isBuyerRevision
                    ? 'bg-[#F4F7FB]/70 border-blue-100'
                    : 'bg-emerald-50/50 border-emerald-100'
                } space-y-2.5`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#06245B] px-2 py-0.5 rounded bg-white border border-slate-200">
                      {isAr ? `الجولة ${rev.roundNumber}` : `Round ${rev.roundNumber}`}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {isBuyerRevision
                        ? (isAr ? 'المشتري' : 'Buyer')
                        : (isAr ? 'المورد' : 'Supplier')}
                    </span>
                  </div>
                  <span className="text-slate-400 font-mono">
                    {formatDateTime(rev.createdAtUtc)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'سعر الوحدة المقترح' : 'Unit Price'}</span>
                    <strong className="text-slate-800 text-sm font-bold">
                      {(rev.proposedUnitPrice ?? rev.unitPrice)?.toLocaleString()} {neg.currency}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'الكمية المقترحة' : 'Quantity'}</span>
                    <strong className="text-slate-800 text-sm font-bold">
                      {rev.proposedQuantity ?? rev.quantity} {neg.productUnit || neg.unit || 'ton'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'إجمالي المقترح' : 'Total Value'}</span>
                    <strong className="text-[#1266D6] text-sm font-bold">
                      {(((rev.proposedUnitPrice ?? rev.unitPrice) || 0) * ((rev.proposedQuantity ?? rev.quantity) || 0)).toLocaleString()} {neg.currency}
                    </strong>
                  </div>
                </div>

                {rev.notes && (
                  <p className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-100">
                    <strong>{isAr ? 'ملاحظات: ' : 'Notes: '}</strong>
                    {rev.notes}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Counter Modal */}
      <Modal
        isOpen={actionType === 'counter'}
        onClose={() => setActionType(null)}
        title={isAr ? 'تقديم عرض تفاوضي مضاد' : 'Submit Counteroffer'}
      >
        <div className="space-y-4 text-xs" dir={isAr ? 'rtl' : 'ltr'}>
          {actionError && <Alert variant="danger">{actionError}</Alert>}

          <div>
            <label className="block font-bold text-[#06245B] mb-1">
              {isAr ? 'سعر الوحدة الجديد' : 'New Unit Price'} ({neg.currency})
            </label>
            <input
              type="number"
              min="1"
              value={counterPrice}
              onChange={(e) => setCounterPrice(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-[#06245B] mb-1">
              {isAr ? 'الكمية المقترحة' : 'Proposed Quantity'} ({neg.productUnit || 'ton'})
            </label>
            <input
              type="number"
              min="1"
              value={counterQty}
              onChange={(e) => setCounterQty(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-[#06245B] mb-1">
              {isAr ? 'ملاحظات العرض المضاد' : 'Counteroffer Notes'}
            </label>
            <textarea
              rows={2}
              value={counterNotes}
              onChange={(e) => setCounterNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setActionType(null)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={counterMutation.isPending}
              onClick={() => counterMutation.mutate()}
            >
              {isAr ? 'إرسال العرض المضاد' : 'Submit Counter'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Accept Confirmation Modal */}
      <Modal
        isOpen={actionType === 'accept'}
        onClose={() => setActionType(null)}
        title={isAr ? 'تأكيد قبول العرض وإبرام الصفقة' : 'Confirm Accept & Create Deal'}
      >
        <div className="space-y-4 text-xs" dir={isAr ? 'rtl' : 'ltr'}>
          {actionError && <Alert variant="danger">{actionError}</Alert>}
          <p className="text-slate-600 leading-relaxed">
            {isAr
              ? `هل أنت متأكد من قبول شروط العرض الحالي بسعر ${(neg.currentProposedUnitPrice ?? neg.currentUnitPrice)?.toLocaleString()} ${neg.currency} وكمية ${neg.currentProposedQuantity ?? neg.quantity}؟ سيؤدي ذلك لإنشاء صفقة رسمية ملزمة.`
              : `Are you sure you want to accept the current terms (${(neg.currentProposedUnitPrice ?? neg.currentUnitPrice)?.toLocaleString()} ${neg.currency} x ${neg.currentProposedQuantity ?? neg.quantity})? This will create an official commercial deal.`}
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setActionType(null)}>
              {isAr ? 'تراجع' : 'Back'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={acceptMutation.isPending}
              onClick={() => acceptMutation.mutate()}
            >
              {isAr ? 'تأكيد القبول' : 'Confirm Accept'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={actionType === 'reject'}
        onClose={() => setActionType(null)}
        title={isAr ? 'رفض عرض التفاوض' : 'Reject Negotiation'}
      >
        <div className="space-y-4 text-xs" dir={isAr ? 'rtl' : 'ltr'}>
          {actionError && <Alert variant="danger">{actionError}</Alert>}
          <div>
            <label className="block font-bold text-[#06245B] mb-1">
              {isAr ? 'سبب الرفض (اختياري)' : 'Rejection Reason (Optional)'}
            </label>
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setActionType(null)}>
              {isAr ? 'تراجع' : 'Back'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              {isAr ? 'تأكيد الرفض' : 'Confirm Reject'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={actionType === 'cancel'}
        onClose={() => setActionType(null)}
        title={isAr ? 'إلغاء جلسة التفاوض' : 'Cancel Negotiation'}
      >
        <div className="space-y-4 text-xs" dir={isAr ? 'rtl' : 'ltr'}>
          {actionError && <Alert variant="danger">{actionError}</Alert>}
          <p className="text-slate-600">
            {isAr
              ? 'هل ترغب في إلغاء جلسة التفاوض الحالية؟ لا يمكن استئناف الجلسة بعد الإلغاء.'
              : 'Are you sure you want to cancel this negotiation session? It cannot be resumed once cancelled.'}
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setActionType(null)}>
              {isAr ? 'تراجع' : 'Back'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {isAr ? 'تأكيد الإلغاء' : 'Confirm Cancel'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

