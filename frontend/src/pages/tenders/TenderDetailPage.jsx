import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Gavel,
  MapPin,
  Calendar,
  Clock,
  Building2,
  TrendingDown,
  Send,
  Award,
  XCircle,
  RotateCcw,
  CheckCircle2,
  Ban,
  Package,
  DollarSign,
  AlertTriangle,
} from 'lucide-react'
import { tenderService } from '../../shared/api/services/tenderService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import { PageSpinner } from '../../components/ui/Spinner'
import { useToast } from '../../hooks/useToast'
import { formatDate, formatDateTime, formatCurrency, formatQuantity, tenderStatusVariant, bidStatusVariant } from '../../utils/format'

const tenderStatusLabel = (status, isAr) => ({
  Draft: isAr ? 'مسودة' : 'Draft',
  Published: isAr ? 'مفتوح للعروض' : 'Open for Bids',
  Closed: isAr ? 'مغلق' : 'Closed',
  Awarded: isAr ? 'تمت الترسية' : 'Awarded',
  Cancelled: isAr ? 'ملغي' : 'Cancelled',
  NoAward: isAr ? 'بدون ترسية' : 'No Award',
}[status] || status)

const bidStatusLabel = (status, isAr) => ({
  Submitted: isAr ? 'مقدم' : 'Submitted',
  UnderReview: isAr ? 'قيد المراجعة' : 'Under Review',
  Accepted: isAr ? 'مقبول' : 'Accepted',
  Rejected: isAr ? 'مرفوض' : 'Rejected',
  Withdrawn: isAr ? 'تم السحب' : 'Withdrawn',
  Superseded: isAr ? 'محدث' : 'Superseded',
}[status] || status)

export default function TenderDetailPage() {
  const { tenderId } = useParams()
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()
  const { canManageRfqs, canSubmitOffers } = usePermissions()

  // Modals
  const [showPublish, setShowPublish] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showNoAward, setShowNoAward] = useState(false)
  const [showReopen, setShowReopen] = useState(false)
  const [showAward, setShowAward] = useState(false)
  const [showBidForm, setShowBidForm] = useState(false)
  const [showWithdrawBid, setShowWithdrawBid] = useState(false)

  const [cancelReason, setCancelReason] = useState('')
  const [noAwardReason, setNoAwardReason] = useState('')
  const [reopenDate, setReopenDate] = useState('')
  const [awardBidId, setAwardBidId] = useState('')
  const [awardRationale, setAwardRationale] = useState('')
  const [withdrawBidId, setWithdrawBidId] = useState('')
  const [withdrawReason, setWithdrawReason] = useState('')

  // Bid form state
  const [bidForm, setBidForm] = useState({
    validityDateUtc: '',
    deliveryLeadTimeDays: '',
    shippingIncluded: false,
    paymentTerms: '',
    notes: '',
    items: [],
  })

  const { data: tender, isLoading } = useQuery({
    queryKey: ['tenders', tenderId],
    queryFn: () => tenderService.get(tenderId),
    enabled: !!tenderId,
  })

  const { data: bids } = useQuery({
    queryKey: ['tenders', tenderId, 'bids'],
    queryFn: () => tenderService.getTenderBids(tenderId),
    enabled: !!tenderId && tender?.canManage,
  })

  const isBuyer = tender?.canManage
  const canBid = tender?.canBid

  // Mutations
  const publishMutation = useMutation({
    mutationFn: () => tenderService.publish(tenderId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenders'] }); setShowPublish(false); toast.success(isAr ? 'تم نشر المناقصة' : 'Tender published') },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.title || (isAr ? 'فشل نشر المناقصة' : 'Failed to publish tender')),
  })

  const closeMutation = useMutation({
    mutationFn: () => tenderService.close(tenderId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenders'] }); setShowClose(false); toast.success(isAr ? 'تم إغلاق المناقصة' : 'Tender closed') },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.title || (isAr ? 'فشل إغلاق المناقصة' : 'Failed to close tender')),
  })

  const cancelMutation = useMutation({
    mutationFn: () => tenderService.cancel(tenderId, cancelReason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenders'] }); setShowCancel(false); toast.success(isAr ? 'تم إلغاء المناقصة' : 'Tender cancelled') },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.title || (isAr ? 'فشل إلغاء المناقصة' : 'Failed to cancel tender')),
  })

  const noAwardMutation = useMutation({
    mutationFn: () => tenderService.noAward(tenderId, noAwardReason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenders'] }); setShowNoAward(false); toast.success(isAr ? 'تم رفض جميع العروض' : 'All bids rejected — no award') },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.title || (isAr ? 'فشل إنهاء المناقصة' : 'Failed to conclude tender')),
  })

  const reopenMutation = useMutation({
    mutationFn: () => tenderService.reopen(tenderId, { newClosingDateUtc: new Date(reopenDate).toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenders'] }); setShowReopen(false); toast.success(isAr ? 'تم إعادة فتح المناقصة' : 'Tender reopened') },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.title || (isAr ? 'فشل إعادة فتح المناقصة' : 'Failed to reopen tender')),
  })

  const awardMutation = useMutation({
    mutationFn: () => tenderService.award(tenderId, awardBidId, awardRationale || null),
    onSuccess: (deal) => {
      qc.invalidateQueries({ queryKey: ['tenders'] })
      qc.invalidateQueries({ queryKey: ['deals'] })
      setShowAward(false)
      toast.success(isAr ? 'تم ترسية المناقصة وإنشاء الصفقة' : 'Tender awarded — Deal created')
      if (deal?.id) navigate(`/deals/${deal.id}`)
    },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.title || (isAr ? 'فشل ترسية المناقصة' : 'Failed to award tender')),
  })

  const submitBidMutation = useMutation({
    mutationFn: (data) => tenderService.submitBid(tenderId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenders'] })
      qc.invalidateQueries({ queryKey: ['bids'] })
      setShowBidForm(false)
      toast.success(isAr ? 'تم تقديم العرض بنجاح' : 'Bid submitted successfully')
    },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.title || (isAr ? 'فشل تقديم العرض' : 'Failed to submit bid')),
  })

  const withdrawBidMutation = useMutation({
    mutationFn: () => tenderService.withdrawBid(withdrawBidId, withdrawReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenders'] })
      setShowWithdrawBid(false)
      toast.success(isAr ? 'تم سحب العرض' : 'Bid withdrawn')
    },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.title || (isAr ? 'فشل سحب العرض' : 'Failed to withdraw bid')),
  })

  const initBidForm = () => {
    if (!tender?.items) return
    setBidForm({
      validityDateUtc: '',
      deliveryLeadTimeDays: '',
      shippingIncluded: false,
      paymentTerms: '',
      notes: '',
      items: tender.items.map((item) => ({
        tenderItemId: item.id,
        materialName: item.materialName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: '',
        notes: '',
      })),
    })
    setShowBidForm(true)
  }

  const handleBidSubmit = () => {
    if (!bidForm.validityDateUtc) {
      toast.error(isAr ? 'تاريخ سريان العرض مطلوب' : 'Validity date is required')
      return
    }
    const payload = {
      validityDateUtc: new Date(bidForm.validityDateUtc).toISOString(),
      deliveryLeadTimeDays: Number(bidForm.deliveryLeadTimeDays),
      shippingIncluded: Boolean(bidForm.shippingIncluded),
      paymentTerms: bidForm.paymentTerms.trim(),
      notes: bidForm.notes?.trim() || null,
      items: bidForm.items.map((i) => ({
        tenderItemId: i.tenderItemId,
        unitPrice: Number(i.unitPrice),
        notes: i.notes?.trim() || null,
      })),
    }
    submitBidMutation.mutate(payload)
  }

  if (isLoading) return <PageSpinner />
  if (!tender) return <div className="text-center py-12 text-slate-500">{isAr ? 'المناقصة غير موجودة' : 'Tender not found'}</div>

  const BackIcon = isAr ? ArrowRight : ArrowLeft

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Button as={Link} to="/tenders" variant="ghost" size="sm" icon={<BackIcon size={16} />}>
        {isAr ? 'العودة للمناقصات' : 'Back to Tenders'}
      </Button>

      {/* Tender Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="text-xs font-mono text-slate-400">{tender.tenderNumber}</span>
              <Badge variant={tenderStatusVariant(tender.status)} size="md">
                {tenderStatusLabel(tender.status, isAr)}
              </Badge>
              {tender.isExpired && (
                <Badge variant="warning" size="sm">{isAr ? 'منتهي' : 'Expired'}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-[#06245B] mb-2">{tender.title}</h1>
            {tender.description && (
              <p className="text-sm text-slate-600 mb-4 whitespace-pre-line">{tender.description}</p>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 size={16} className="text-[#1266D6]" />
                <span>{tender.buyerCompanyName}</span>
              </div>
              {tender.targetCategoryName && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Package size={16} className="text-[#1266D6]" />
                  <span>{tender.targetCategoryName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={16} className="text-[#1266D6]" />
                <span>{tender.deliveryCity}, {tender.deliveryGovernorate}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock size={16} className="text-amber-600" />
                <span>{isAr ? 'يغلق: ' : 'Closes: '}{formatDateTime(tender.closingDateUtc)}</span>
              </div>
              {tender.requiredDeliveryDateUtc && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={16} className="text-emerald-600" />
                  <span>{isAr ? 'التسليم: ' : 'Delivery: '}{formatDate(tender.requiredDeliveryDateUtc)}</span>
                </div>
              )}
              {tender.referencePrice && (
                <div className="flex items-center gap-2 text-slate-600">
                  <DollarSign size={16} className="text-slate-400" />
                  <span>{isAr ? 'سعر مرجعي: ' : 'Ref Price: '}{formatCurrency(tender.referencePrice)}</span>
                </div>
              )}
            </div>

            {/* Bidding summary */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="text-slate-500">{isAr ? 'العروض النشطة: ' : 'Active Bids: '}</span>
                <strong className="text-[#06245B]">{tender.activeBidsCount ?? 0}</strong>
              </div>
              {tender.lowestActiveBidAmount && (
                <div className="flex items-center gap-1 text-emerald-700">
                  <TrendingDown size={14} />
                  <span>{isAr ? 'أدنى عرض: ' : 'Lowest: '}</span>
                  <strong>{formatCurrency(tender.lowestActiveBidAmount)}</strong>
                </div>
              )}
              {tender.reopenedCount > 0 && (
                <div className="text-slate-500">
                  {isAr ? `أعيد فتحها ${tender.reopenedCount} مرة` : `Reopened ${tender.reopenedCount} time(s)`}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            {isBuyer && tender.status === 'Draft' && (
              <Button variant="primary" size="sm" icon={<Send size={14} />} onClick={() => setShowPublish(true)}>
                {isAr ? 'نشر المناقصة' : 'Publish'}
              </Button>
            )}
            {isBuyer && tender.status === 'Published' && (
              <Button variant="outline" size="sm" icon={<XCircle size={14} />} onClick={() => setShowClose(true)}>
                {isAr ? 'إغلاق مبكر' : 'Close Early'}
              </Button>
            )}
            {isBuyer && tender.status === 'Closed' && (
              <>
                <Button variant="primary" size="sm" icon={<Award size={14} />} onClick={() => setShowAward(true)}>
                  {isAr ? 'ترسية' : 'Award'}
                </Button>
                <Button variant="outline" size="sm" icon={<RotateCcw size={14} />} onClick={() => setShowReopen(true)}>
                  {isAr ? 'إعادة فتح' : 'Reopen'}
                </Button>
                <Button variant="ghost" size="sm" icon={<Ban size={14} />} onClick={() => setShowNoAward(true)}>
                  {isAr ? 'بدون ترسية' : 'No Award'}
                </Button>
              </>
            )}
            {isBuyer && ['Draft', 'Published', 'Closed'].includes(tender.status) && (
              <Button variant="ghost" size="sm" className="!text-red-500" icon={<XCircle size={14} />} onClick={() => setShowCancel(true)}>
                {isAr ? 'إلغاء المناقصة' : 'Cancel'}
              </Button>
            )}
            {canBid && tender.status === 'Published' && !tender.isExpired && (
              <Button variant="primary" size="sm" icon={<Send size={14} />} onClick={initBidForm}>
                {tender.myActiveBid ? (isAr ? 'تعديل العرض' : 'Revise Bid') : (isAr ? 'تقديم عرض' : 'Submit Bid')}
              </Button>
            )}
            {canBid && tender.myActiveBid && tender.status === 'Published' && (
              <Button
                variant="ghost"
                size="sm"
                className="!text-red-500"
                onClick={() => { setWithdrawBidId(tender.myActiveBid.id); setShowWithdrawBid(true) }}
              >
                {isAr ? 'سحب عرضي' : 'Withdraw My Bid'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tender Items */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-lg font-bold text-[#06245B] mb-4">
          {isAr ? 'الأصناف المطلوبة' : 'Required Items'} ({tender.items?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="text-start py-3 px-2">#</th>
                <th className="text-start py-3 px-2">{isAr ? 'المادة' : 'Material'}</th>
                <th className="text-start py-3 px-2">{isAr ? 'المواصفات' : 'Specifications'}</th>
                <th className="text-end py-3 px-2">{isAr ? 'الكمية' : 'Qty'}</th>
                <th className="text-start py-3 px-2">{isAr ? 'الوحدة' : 'Unit'}</th>
                <th className="text-end py-3 px-2">{isAr ? 'السعر المستهدف' : 'Target Price'}</th>
              </tr>
            </thead>
            <tbody>
              {tender.items?.map((item, i) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-2 text-slate-400">{item.lineNumber || i + 1}</td>
                  <td className="py-3 px-2 font-semibold text-[#06245B]">{item.materialName}</td>
                  <td className="py-3 px-2 text-slate-600 max-w-xs truncate">{item.specifications}</td>
                  <td className="py-3 px-2 text-end font-mono">{formatQuantity(item.quantity)}</td>
                  <td className="py-3 px-2">{item.unit}</td>
                  <td className="py-3 px-2 text-end">{item.targetPricePerUnit ? formatCurrency(item.targetPricePerUnit) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Active Bid (Supplier) */}
      {tender.myActiveBid && (
        <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200">
          <h2 className="text-lg font-bold text-emerald-900 mb-3 flex items-center gap-2">
            <CheckCircle2 size={20} />
            {isAr ? 'عرضي النشط' : 'My Active Bid'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-emerald-700 block text-xs">{isAr ? 'رقم العرض' : 'Bid #'}</span>
              <strong className="text-emerald-900">{tender.myActiveBid.bidNumber}</strong>
            </div>
            <div>
              <span className="text-emerald-700 block text-xs">{isAr ? 'إجمالي العرض' : 'Total'}</span>
              <strong className="text-emerald-900">{formatCurrency(tender.myActiveBid.totalAmount)}</strong>
            </div>
            <div>
              <span className="text-emerald-700 block text-xs">{isAr ? 'الحالة' : 'Status'}</span>
              <Badge variant={bidStatusVariant(tender.myActiveBid.status)} size="sm">
                {bidStatusLabel(tender.myActiveBid.status, isAr)}
              </Badge>
            </div>
            <div>
              <span className="text-emerald-700 block text-xs">{isAr ? 'التسليم' : 'Lead Time'}</span>
              <strong className="text-emerald-900">{tender.myActiveBid.deliveryLeadTimeDays} {isAr ? 'يوم' : 'days'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Bids List (Buyer Only) */}
      {isBuyer && bids && bids.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-lg font-bold text-[#06245B] mb-4">
            {isAr ? 'العروض المقدمة' : 'Submitted Bids'} ({bids.length})
          </h2>
          <div className="space-y-3">
            {bids.map((bid) => (
              <div
                key={bid.id}
                className={`p-4 rounded-2xl border transition-colors cursor-pointer hover:border-[#1266D6] ${
                  bid.isLowest ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white'
                }`}
                onClick={() => navigate(`/tenders/bids/${bid.id}`)}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-xs font-mono text-slate-400">{bid.bidNumber}</span>
                      <p className="text-sm font-bold text-[#06245B]">{bid.supplierCompanyName}</p>
                    </div>
                    {bid.isLowest && (
                      <Badge variant="success" size="sm">{isAr ? 'الأدنى' : 'Lowest'}</Badge>
                    )}
                    <Badge variant={bidStatusVariant(bid.status)} size="sm">
                      {bidStatusLabel(bid.status, isAr)}
                    </Badge>
                  </div>
                  <div className="text-end">
                    <span className="text-lg font-extrabold text-[#06245B]">{formatCurrency(bid.totalAmount)}</span>
                    <span className="block text-xs text-slate-500">{bid.deliveryLeadTimeDays} {isAr ? 'يوم تسليم' : 'days lead'}</span>
                  </div>
                </div>
                {tender.status === 'Closed' && (bid.status === 'Submitted' || bid.status === 'UnderReview') && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="xs"
                      variant="primary"
                      icon={<Award size={12} />}
                      onClick={(e) => { e.stopPropagation(); setAwardBidId(bid.id); setShowAward(true) }}
                    >
                      {isAr ? 'ترسية لهذا العرض' : 'Award This Bid'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== MODALS ========== */}

      {/* Publish */}
      <Modal open={showPublish} onClose={() => setShowPublish(false)} title={isAr ? 'نشر المناقصة' : 'Publish Tender'}>
        <p className="text-sm text-slate-600 mb-4">
          {isAr ? 'هل تريد نشر هذه المناقصة؟ ستصبح مرئية لجميع الموردين المعتمدين.' : 'Are you sure? The tender will become visible to all verified suppliers.'}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowPublish(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button variant="primary" loading={publishMutation.isPending} onClick={() => publishMutation.mutate()}>
            {isAr ? 'نشر' : 'Publish'}
          </Button>
        </div>
      </Modal>

      {/* Close */}
      <Modal open={showClose} onClose={() => setShowClose(false)} title={isAr ? 'إغلاق المناقصة' : 'Close Tender'}>
        <p className="text-sm text-slate-600 mb-4">
          {isAr ? 'سيتم إغلاق المناقصة ولن يتمكن الموردون من تقديم عروض جديدة.' : 'Suppliers will no longer be able to submit new bids.'}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowClose(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
          <Button variant="primary" loading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
            {isAr ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </Modal>

      {/* Cancel */}
      <Modal open={showCancel} onClose={() => setShowCancel(false)} title={isAr ? 'إلغاء المناقصة' : 'Cancel Tender'}>
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} />
          {isAr ? 'هذا الإجراء نهائي ولا يمكن التراجع عنه.' : 'This action is permanent and cannot be undone.'}
        </div>
        <Textarea
          label={isAr ? 'سبب الإلغاء *' : 'Cancellation Reason *'}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowCancel(false)}>{isAr ? 'تراجع' : 'Back'}</Button>
          <Button variant="error" loading={cancelMutation.isPending} disabled={!cancelReason.trim()} onClick={() => cancelMutation.mutate()}>
            {isAr ? 'تأكيد الإلغاء' : 'Confirm Cancel'}
          </Button>
        </div>
      </Modal>

      {/* No Award */}
      <Modal open={showNoAward} onClose={() => setShowNoAward(false)} title={isAr ? 'رفض جميع العروض' : 'No Award'}>
        <Textarea
          label={isAr ? 'السبب *' : 'Reason *'}
          value={noAwardReason}
          onChange={(e) => setNoAwardReason(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowNoAward(false)}>{isAr ? 'تراجع' : 'Back'}</Button>
          <Button variant="warning" loading={noAwardMutation.isPending} disabled={!noAwardReason.trim()} onClick={() => noAwardMutation.mutate()}>
            {isAr ? 'تأكيد بدون ترسية' : 'Confirm No Award'}
          </Button>
        </div>
      </Modal>

      {/* Reopen */}
      <Modal open={showReopen} onClose={() => setShowReopen(false)} title={isAr ? 'إعادة فتح المناقصة' : 'Reopen Tender'}>
        <Input
          label={isAr ? 'تاريخ الإغلاق الجديد *' : 'New Closing Date *'}
          type="datetime-local"
          value={reopenDate}
          onChange={(e) => setReopenDate(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowReopen(false)}>{isAr ? 'تراجع' : 'Back'}</Button>
          <Button variant="primary" loading={reopenMutation.isPending} disabled={!reopenDate} onClick={() => reopenMutation.mutate()}>
            {isAr ? 'إعادة فتح' : 'Reopen'}
          </Button>
        </div>
      </Modal>

      {/* Award */}
      <Modal open={showAward} onClose={() => setShowAward(false)} title={isAr ? 'ترسية المناقصة' : 'Award Tender'}>
        <p className="text-sm text-slate-600 mb-3">
          {isAr ? 'سيتم إنشاء صفقة تجارية تلقائياً مع المورد الفائز.' : 'A Deal will be automatically created with the winning supplier.'}
        </p>
        {!awardBidId && bids?.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm font-semibold text-[#06245B] mb-1.5">{isAr ? 'اختر العرض الفائز' : 'Select Winning Bid'}</label>
            <select
              value={awardBidId}
              onChange={(e) => setAwardBidId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#1266D6] bg-white"
            >
              <option value="">{isAr ? 'اختر...' : 'Select...'}</option>
              {bids.filter(b => b.status === 'Submitted' || b.status === 'UnderReview').map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bidNumber} — {b.supplierCompanyName} — {formatCurrency(b.totalAmount)}
                  {b.isLowest ? ` ★ ${isAr ? 'الأدنى' : 'Lowest'}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        <Textarea
          label={isAr ? 'مبررات الترسية (اختياري)' : 'Award Rationale (optional)'}
          value={awardRationale}
          onChange={(e) => setAwardRationale(e.target.value)}
          rows={2}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowAward(false)}>{isAr ? 'تراجع' : 'Back'}</Button>
          <Button variant="primary" loading={awardMutation.isPending} disabled={!awardBidId} onClick={() => awardMutation.mutate()}>
            {isAr ? 'ترسية وإنشاء صفقة' : 'Award & Create Deal'}
          </Button>
        </div>
      </Modal>

      {/* Submit Bid */}
      <Modal open={showBidForm} onClose={() => setShowBidForm(false)} title={isAr ? 'تقديم عرض سعر' : 'Submit Bid'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={isAr ? 'صلاحية العرض *' : 'Bid Validity Date *'}
              type="datetime-local"
              value={bidForm.validityDateUtc}
              onChange={(e) => setBidForm((f) => ({ ...f, validityDateUtc: e.target.value }))}
            />
            <Input
              label={isAr ? 'مدة التسليم (أيام) *' : 'Delivery Lead Time (days) *'}
              type="number"
              min="1"
              value={bidForm.deliveryLeadTimeDays}
              onChange={(e) => setBidForm((f) => ({ ...f, deliveryLeadTimeDays: e.target.value }))}
            />
            <Input
              label={isAr ? 'شروط الدفع *' : 'Payment Terms *'}
              value={bidForm.paymentTerms}
              onChange={(e) => setBidForm((f) => ({ ...f, paymentTerms: e.target.value }))}
              placeholder={isAr ? 'مثال: 30 يوم صافي' : 'e.g. Net 30'}
            />
            <label className="flex items-center gap-2 self-end pb-2.5">
              <input
                type="checkbox"
                checked={bidForm.shippingIncluded}
                onChange={(e) => setBidForm((f) => ({ ...f, shippingIncluded: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-[#1266D6]"
              />
              <span className="text-sm font-semibold text-[#06245B]">
                {isAr ? 'الشحن مشمول في السعر' : 'Shipping Included'}
              </span>
            </label>
          </div>

          {/* Bid Items */}
          <h3 className="text-sm font-bold text-[#06245B] pt-2 border-t border-slate-100">
            {isAr ? 'أسعار الأصناف' : 'Item Prices'}
          </h3>
          {bidForm.items.map((item, i) => (
            <div key={item.tenderItemId} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#06245B]">{item.materialName}</span>
                <span className="text-xs text-slate-500">{formatQuantity(item.quantity)} {item.unit}</span>
              </div>
              <Input
                label={isAr ? 'سعر الوحدة (ج.م) *' : 'Unit Price (EGP) *'}
                type="number"
                step="0.01"
                min="0.01"
                value={item.unitPrice}
                onChange={(e) => {
                  const val = e.target.value
                  setBidForm((f) => ({
                    ...f,
                    items: f.items.map((it, idx) => idx === i ? { ...it, unitPrice: val } : it),
                  }))
                }}
              />
            </div>
          ))}

          {/* Computed total */}
          {bidForm.items.every((i) => i.unitPrice) && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-sm text-[#1266D6] font-bold">{isAr ? 'الإجمالي المحسوب: ' : 'Calculated Total: '}</span>
              <strong className="text-lg text-[#06245B]">
                {formatCurrency(bidForm.items.reduce((sum, i) => sum + Number(i.unitPrice || 0) * Number(i.quantity || 0), 0))}
              </strong>
            </div>
          )}

          <Textarea
            label={isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
            value={bidForm.notes}
            onChange={(e) => setBidForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowBidForm(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button
              variant="primary"
              loading={submitBidMutation.isPending}
              onClick={handleBidSubmit}
              icon={<Send size={14} />}
            >
              {isAr ? 'تقديم العرض' : 'Submit Bid'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdraw Bid */}
      <Modal open={showWithdrawBid} onClose={() => setShowWithdrawBid(false)} title={isAr ? 'سحب العرض' : 'Withdraw Bid'}>
        <Textarea
          label={isAr ? 'سبب السحب *' : 'Withdrawal Reason *'}
          value={withdrawReason}
          onChange={(e) => setWithdrawReason(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowWithdrawBid(false)}>{isAr ? 'تراجع' : 'Back'}</Button>
          <Button variant="error" loading={withdrawBidMutation.isPending} disabled={!withdrawReason.trim()} onClick={() => withdrawBidMutation.mutate()}>
            {isAr ? 'تأكيد السحب' : 'Confirm Withdraw'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
