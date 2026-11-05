import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, CheckCircle, Play, XCircle, AlertTriangle,
  Truck, Star
} from 'lucide-react'
import { dealService } from '../../shared/api/services/dealService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import Button from '../../components/ui/Button'
import Card, { CardHeader, CardDivider } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatCurrency, formatDate } from '../../utils/format'

const statusVariant = {
  AwaitingConfirmation: 'warning',
  Confirmed: 'info',
  InProgress: 'cyan',
  Disputed: 'error',
  Completed: 'success',
  Cancelled: 'error',
}

const disputeCategories = [
  { value: 1, label: 'Quality Defect', labelAr: 'عيب في الجودة' },
  { value: 2, label: 'Quantity Mismatch', labelAr: 'عدم تطابق الكمية' },
  { value: 3, label: 'Late Delivery', labelAr: 'تأخر التسليم' },
  { value: 4, label: 'Damaged Goods', labelAr: 'بضاعة تالفة' },
  { value: 5, label: 'Non-Delivery', labelAr: 'عدم التسليم' },
  { value: 6, label: 'Terms Violation', labelAr: 'انتهاك الشروط' },
  { value: 99, label: 'Other', labelAr: 'أخرى' },
]

export default function DealDetailPage() {
  const { dealId } = useParams()
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { canManageDeals, canManageShipments, isSalesManager, isOwner, isAdmin, isProcurementManager } = usePermissions()
  const user = useAuthStore((s) => s.user)

  // Modals state
  const [showCancel, setShowCancel] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showCreateShipment, setShowCreateShipment] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [disputeCategory, setDisputeCategory] = useState(1)
  const [disputeDescription, setDisputeDescription] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  // Shipment form
  const [shipArrangement, setShipArrangement] = useState(1)
  const [shipPickup, setShipPickup] = useState('')
  const [shipDelivery, setShipDelivery] = useState('')
  const [shipCarrier, setShipCarrier] = useState('')

  const { data: deal, isLoading, error } = useQuery({
    queryKey: ['deals', dealId],
    queryFn: () => dealService.get(dealId),
    enabled: !!dealId,
  })

  const { data: shipments } = useQuery({
    queryKey: ['deals', dealId, 'shipments'],
    queryFn: () => dealService.getDealShipments(dealId),
    enabled: !!dealId,
  })

  const { data: reviews } = useQuery({
    queryKey: ['deals', dealId, 'reviews'],
    queryFn: () => dealService.getDealReviews(dealId),
    enabled: !!dealId && deal?.status === 'Completed',
  })

  const confirmMutation = useMutation({
    mutationFn: () => dealService.confirm(dealId),
    onSuccess: () => {
      toast.success(isAr ? 'تم تأكيد الصفقة' : 'Deal confirmed')
      queryClient.invalidateQueries({ queryKey: ['deals', dealId] })
    },
    onError: (err) => toast.error(err?.problem?.detail || err?.message || 'Failed to confirm'),
  })

  const startMutation = useMutation({
    mutationFn: () => dealService.start(dealId),
    onSuccess: () => {
      toast.success(isAr ? 'تم بدء تنفيذ الصفقة' : 'Deal execution started')
      queryClient.invalidateQueries({ queryKey: ['deals', dealId] })
    },
    onError: (err) => toast.error(err?.problem?.detail || err?.message || 'Failed to start'),
  })

  const completeMutation = useMutation({
    mutationFn: () => dealService.complete(dealId),
    onSuccess: () => {
      toast.success(isAr ? 'تم إتمام الصفقة' : 'Deal completed')
      queryClient.invalidateQueries({ queryKey: ['deals', dealId] })
      setShowComplete(false)
    },
    onError: (err) => toast.error(err?.problem?.detail || err?.message || 'Failed to complete'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => dealService.cancel(dealId, cancelReason),
    onSuccess: () => {
      toast.success(isAr ? 'تم إلغاء الصفقة' : 'Deal cancelled')
      queryClient.invalidateQueries({ queryKey: ['deals', dealId] })
      setShowCancel(false)
    },
    onError: (err) => toast.error(err?.problem?.detail || err?.message || 'Failed to cancel'),
  })

  const disputeMutation = useMutation({
    mutationFn: () => dealService.openDispute(dealId, Number(disputeCategory), disputeDescription),
    onSuccess: () => {
      toast.success(isAr ? 'تم فتح النزاع' : 'Dispute opened')
      queryClient.invalidateQueries({ queryKey: ['deals', dealId] })
      setShowDispute(false)
    },
    onError: (err) => toast.error(err?.problem?.detail || err?.message || 'Failed to open dispute'),
  })

  const reviewMutation = useMutation({
    mutationFn: () => dealService.submitReview(dealId, reviewRating, reviewComment),
    onSuccess: () => {
      toast.success(isAr ? 'تم إرسال التقييم' : 'Review submitted')
      queryClient.invalidateQueries({ queryKey: ['deals', dealId, 'reviews'] })
      setShowReview(false)
    },
    onError: (err) => toast.error(err?.problem?.detail || err?.message || 'Failed to submit review'),
  })

  const shipmentMutation = useMutation({
    mutationFn: () => dealService.createShipment(dealId, {
      arrangement: shipArrangement,
      pickupAddress: shipPickup,
      deliveryAddress: shipDelivery,
      carrierName: shipCarrier || undefined,
    }),
    onSuccess: (shipment) => {
      toast.success(isAr ? 'تم إنشاء الشحنة' : 'Shipment created')
      queryClient.invalidateQueries({ queryKey: ['deals', dealId, 'shipments'] })
      setShowCreateShipment(false)
      navigate(`/shipments/${shipment.id}`)
    },
    onError: (err) => toast.error(err?.problem?.detail || err?.message || 'Failed to create shipment'),
  })

  if (isLoading) return <PageSpinner />
  if (error || !deal) {
    return (
      <div className="text-center py-16">
        <p className="text-[#EF4444] mb-4">{isAr ? 'الصفقة غير موجودة' : 'Deal not found'}</p>
        <Button variant="outline" onClick={() => navigate('/deals')}>
          {isAr ? 'العودة' : 'Back to Deals'}
        </Button>
      </div>
    )
  }

  const currentCompanyId = user?.company?.id || ''
  const isBuyer = deal.buyerCompanyId === currentCompanyId
  const isSupplier = deal.supplierCompanyId === currentCompanyId

  // Can confirm: buyer (Procurement/Owner/Admin) or supplier (Sales/Owner/Admin) if not yet confirmed by their side
  const canConfirm =
    (isBuyer && !deal.confirmedByBuyer && (isProcurementManager || isOwner || isAdmin)) ||
    (isSupplier && !deal.confirmedBySupplier && (isSalesManager || isOwner || isAdmin))

  // Can start: supplier only, after both confirmed
  const canStart = isSupplier && deal.status === 'Confirmed' && (isSalesManager || isOwner || isAdmin)

  // Can complete: either party, when InProgress
  const canComplete = deal.status === 'InProgress' && canManageDeals

  // Can cancel: when AwaitingConfirmation or Confirmed/InProgress
  const canCancel =
    deal.status !== 'Completed' &&
    deal.status !== 'Cancelled' &&
    canManageDeals

  // Can open dispute: when Confirmed or InProgress
  const canDispute =
    (deal.status === 'Confirmed' || deal.status === 'InProgress') &&
    canManageDeals

  // Can create shipment: supplier, when Confirmed or InProgress
  const canCreateShipment =
    isSupplier &&
    (deal.status === 'Confirmed' || deal.status === 'InProgress') &&
    canManageShipments

  // Can review: Completed and hasn't reviewed yet
  const hasReviewed = reviews?.some((r) => r.reviewerCompanyId === currentCompanyId)
  const canReview = deal.status === 'Completed' && !hasReviewed && canManageDeals

  const terms = deal.commercialTerms

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/deals')}
            className="mt-1 p-2 rounded-lg hover:bg-[#EAF4FF] text-[#64748B] hover:text-[#06245B] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono text-[#64748B] bg-[#F4F7FB] px-2 py-1 rounded">
                {deal.dealNumber}
              </span>
              <Badge variant={statusVariant[deal.status]}>
                {deal.status.replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-[#06245B] mt-1">{deal.rfqTitle}</h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              {isAr ? 'المشتري:' : 'Buyer:'} {deal.buyerCompanyName}
              {' · '}
              {isAr ? 'المورد:' : 'Supplier:'} {deal.supplierCompanyName}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {canConfirm && (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle size={16} />}
              onClick={() => confirmMutation.mutate()}
              loading={confirmMutation.isPending}
            >
              {isAr ? 'تأكيد الصفقة' : 'Confirm Deal'}
            </Button>
          )}
          {canStart && (
            <Button
              variant="primary"
              size="sm"
              icon={<Play size={16} />}
              onClick={() => startMutation.mutate()}
              loading={startMutation.isPending}
            >
              {isAr ? 'بدء التنفيذ' : 'Start Fulfillment'}
            </Button>
          )}
          {canCreateShipment && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Truck size={16} />}
              onClick={() => setShowCreateShipment(true)}
            >
              {isAr ? 'إنشاء شحنة' : 'Create Shipment'}
            </Button>
          )}
          {canComplete && (
            <Button
              variant="outline"
              size="sm"
              icon={<CheckCircle size={16} />}
              onClick={() => setShowComplete(true)}
            >
              {isAr ? 'إتمام الصفقة' : 'Complete Deal'}
            </Button>
          )}
          {canReview && (
            <Button
              variant="outline"
              size="sm"
              icon={<Star size={16} />}
              onClick={() => setShowReview(true)}
            >
              {isAr ? 'تقييم الطرف الآخر' : 'Leave Review'}
            </Button>
          )}
          {canDispute && (
            <Button
              variant="outline"
              size="sm"
              icon={<AlertTriangle size={16} />}
              onClick={() => setShowDispute(true)}
            >
              {isAr ? 'فتح نزاع' : 'Open Dispute'}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              icon={<XCircle size={16} />}
              onClick={() => setShowCancel(true)}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
          )}
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader title={isAr ? 'حالة الصفقة' : 'Deal Status'} />
        <div className="flex items-center gap-2 flex-wrap">
          {(['AwaitingConfirmation', 'Confirmed', 'InProgress', 'Completed']).map((s, i) => {
            const isCurrentOrPast =
              ['AwaitingConfirmation', 'Confirmed', 'InProgress', 'Completed'].indexOf(deal.status) >= i ||
              deal.status === 'Completed'
            const isCurrent = deal.status === s
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-[#06245B] text-white'
                    : isCurrentOrPast
                    ? 'bg-[#D1FAE5] text-[#059669]'
                    : 'bg-[#F4F7FB] text-[#94A3B8]'
                }`}>
                  {isCurrentOrPast && !isCurrent && <CheckCircle size={12} />}
                  {s.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                {i < 3 && <span className="text-[#CBD5E1] text-xs">→</span>}
              </div>
            )
          })}
          {deal.status === 'Disputed' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#DC2626]">
              <AlertTriangle size={12} />
              Disputed
            </div>
          )}
          {deal.status === 'Cancelled' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F4F7FB] text-[#EF4444]">
              Cancelled
            </div>
          )}
        </div>

        {/* Confirmation status */}
        {deal.status === 'AwaitingConfirmation' && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg text-sm ${deal.confirmedByBuyer ? 'bg-[#D1FAE5]' : 'bg-[#FEF3C7]'}`}>
              <div className="font-medium text-[#1E293B]">
                {isAr ? 'المشتري' : 'Buyer'}: {deal.buyerCompanyName}
              </div>
              <div className={`text-xs mt-0.5 ${deal.confirmedByBuyer ? 'text-[#059669]' : 'text-[#D97706]'}`}>
                {deal.confirmedByBuyer
                  ? (isAr ? '✓ تم التأكيد' : '✓ Confirmed')
                  : (isAr ? 'بانتظار التأكيد' : 'Pending confirmation')}
              </div>
            </div>
            <div className={`p-3 rounded-lg text-sm ${deal.confirmedBySupplier ? 'bg-[#D1FAE5]' : 'bg-[#FEF3C7]'}`}>
              <div className="font-medium text-[#1E293B]">
                {isAr ? 'المورد' : 'Supplier'}: {deal.supplierCompanyName}
              </div>
              <div className={`text-xs mt-0.5 ${deal.confirmedBySupplier ? 'text-[#059669]' : 'text-[#D97706]'}`}>
                {deal.confirmedBySupplier
                  ? (isAr ? '✓ تم التأكيد' : '✓ Confirmed')
                  : (isAr ? 'بانتظار التأكيد' : 'Pending confirmation')}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Commercial Terms Snapshot */}
      {terms && (
        <Card>
          <CardHeader
            title={isAr ? 'الشروط التجارية المُجمّدة' : 'Frozen Commercial Terms'}
            subtitle={isAr
              ? 'هذه الشروط محمية وتمثل الاتفاقية التجارية الملزمة'
              : 'These terms are immutable and represent the binding commercial agreement'}
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[#64748B] text-xs mb-0.5">{isAr ? 'المبلغ الإجمالي' : 'Total Amount'}</p>
              <p className="font-bold text-[#06245B] text-lg">{formatCurrency(terms.totalAmount)}</p>
            </div>
            <div>
              <p className="text-[#64748B] text-xs mb-0.5">{isAr ? 'العملة' : 'Currency'}</p>
              <p className="font-medium text-[#1E293B]">{terms.currency}</p>
            </div>
            <div>
              <p className="text-[#64748B] text-xs mb-0.5">{isAr ? 'مهلة التسليم' : 'Lead Time'}</p>
              <p className="font-medium text-[#1E293B]">{terms.deliveryLeadTimeDays} {isAr ? 'يوم' : 'days'}</p>
            </div>
            <div>
              <p className="text-[#64748B] text-xs mb-0.5">{isAr ? 'الشحن مشمول' : 'Shipping'}</p>
              <p className="font-medium text-[#1E293B]">
                {terms.shippingIncluded ? (isAr ? 'مشمول' : 'Included') : (isAr ? 'غير مشمول' : 'Not Included')}
              </p>
            </div>
            <div>
              <p className="text-[#64748B] text-xs mb-0.5">{isAr ? 'شروط الدفع' : 'Payment Terms'}</p>
              <p className="font-medium text-[#1E293B]">{terms.paymentTerms}</p>
            </div>
            <div>
              <p className="text-[#64748B] text-xs mb-0.5">{isAr ? 'صالحية العرض' : 'Offer Validity'}</p>
              <p className="font-medium text-[#1E293B]">{formatDate(terms.validityDateUtc)}</p>
            </div>
          </div>

          <CardDivider />

          {/* Line items */}
          <h4 className="text-sm font-semibold text-[#06245B] mb-3">
            {isAr ? 'بنود الصفقة' : 'Deal Line Items'}
          </h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#64748B] text-xs border-b border-[rgba(6,36,91,0.06)]">
                <th className="text-start pb-2">{isAr ? 'المادة' : 'Material'}</th>
                <th className="text-end pb-2">{isAr ? 'الكمية' : 'Qty'}</th>
                <th className="text-end pb-2">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                <th className="text-end pb-2">{isAr ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(6,36,91,0.04)]">
              {terms.items.map((item, i) => (
                <tr key={i} className="text-[#1E293B]">
                  <td className="py-2">{item.materialName}</td>
                  <td className="py-2 text-end text-[#64748B]">{item.offeredQuantity}</td>
                  <td className="py-2 text-end">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2 text-end font-semibold">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Shipments */}
      <Card>
        <CardHeader
          title={isAr ? 'الشحنات' : 'Shipments'}
          subtitle={isAr ? 'تتبع شحنات هذه الصفقة' : 'Track shipments for this deal'}
        />
        {!shipments || shipments.length === 0 ? (
          <div className="text-center py-8">
            <Truck size={40} className="mx-auto text-[#CBD5E1] mb-3" />
            <p className="text-sm text-[#64748B]">{isAr ? 'لا توجد شحنات بعد' : 'No shipments yet'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <Link
                key={shipment.id}
                to={`/shipments/${shipment.id}`}
                className="flex items-center justify-between p-3 bg-[#F4F7FB] rounded-lg hover:bg-[#EAF4FF] transition-colors"
              >
                <div>
                  <span className="font-medium text-sm text-[#06245B]">{shipment.shipmentNumber}</span>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {shipment.arrangement === 'SupplierArranged' ? (isAr ? 'بترتيب المورد' : 'Supplier Arranged') : (isAr ? 'بترتيب ديل زون' : 'DealZone Arranged')}
                  </p>
                </div>
                <Badge variant="info">{shipment.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Disputes */}
      {deal.disputes && deal.disputes.length > 0 && (
        <Card>
          <CardHeader title={isAr ? 'النزاعات' : 'Disputes'} />
          <div className="space-y-3">
            {deal.disputes.map((dispute) => (
              <div key={dispute.id} className="p-4 bg-[#FEF2F2] rounded-lg border border-[#FECACA]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-medium text-sm text-[#06245B]">{dispute.category}</span>
                  <Badge variant={dispute.status === 'Open' ? 'error' : dispute.status === 'Resolved' ? 'success' : 'warning'}>
                    {dispute.status}
                  </Badge>
                </div>
                <p className="text-sm text-[#475569]">{dispute.description}</p>
                <p className="text-xs text-[#64748B] mt-1">
                  {isAr ? 'بواسطة:' : 'By:'} {dispute.openedByCompanyName} · {formatDate(dispute.openedAtUtc)}
                </p>
                {dispute.resolutionNotes && (
                  <p className="text-sm text-[#059669] mt-2 font-medium">
                    {isAr ? 'القرار:' : 'Resolution:'} {dispute.resolutionNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reviews */}
      {deal.status === 'Completed' && reviews && reviews.length > 0 && (
        <Card>
          <CardHeader title={isAr ? 'التقييمات' : 'Reviews'} />
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-[#F4F7FB] rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < review.rating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#CBD5E1]'}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-[#06245B]">{review.reviewerCompanyName}</span>
                </div>
                <p className="text-sm text-[#475569]">{review.comment}</p>
                <p className="text-xs text-[#94A3B8] mt-1">{formatDate(review.createdAtUtc)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cancel Modal */}
      <Modal isOpen={showCancel} onClose={() => setShowCancel(false)} title={isAr ? 'إلغاء الصفقة' : 'Cancel Deal'}>
        <div className="space-y-4 mb-6">
          <p className="text-[#475569] text-sm">{isAr ? 'الرجاء تقديم سبب الإلغاء.' : 'Please provide a reason for cancellation.'}</p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={isAr ? 'سبب الإلغاء...' : 'Cancellation reason...'}
            rows={3}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                       focus:outline-none focus:border-[#1266D6] resize-none text-[#1E293B]"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowCancel(false)}>
            {isAr ? 'تراجع' : 'Go Back'}
          </Button>
          <Button
            variant="danger"
            onClick={() => cancelMutation.mutate()}
            loading={cancelMutation.isPending}
            disabled={!cancelReason.trim()}
          >
            {isAr ? 'إلغاء الصفقة' : 'Cancel Deal'}
          </Button>
        </div>
      </Modal>

      {/* Complete Modal */}
      <Modal isOpen={showComplete} onClose={() => setShowComplete(false)} title={isAr ? 'إتمام الصفقة' : 'Complete Deal'}>
        <p className="text-[#475569] mb-6">
          {isAr ? 'بمجرد إتمام الصفقة، سيتمكن الطرفان من تقييم بعضهما البعض.' : 'Once completed, both parties can leave reviews.'}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowComplete(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={() => completeMutation.mutate()}
            loading={completeMutation.isPending}
          >
            {isAr ? 'إتمام الصفقة' : 'Complete Deal'}
          </Button>
        </div>
      </Modal>

      {/* Dispute Modal */}
      <Modal isOpen={showDispute} onClose={() => setShowDispute(false)} title={isAr ? 'فتح نزاع' : 'Open Dispute'}>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1">
              {isAr ? 'نوع النزاع' : 'Dispute Category'}
            </label>
            <select
              value={disputeCategory}
              onChange={(e) => setDisputeCategory(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm focus:outline-none focus:border-[#1266D6] bg-white text-[#1E293B]"
            >
              {disputeCategories.map((c) => (
                <option key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1">
              {isAr ? 'وصف النزاع *' : 'Description *'}
            </label>
            <textarea
              value={disputeDescription}
              onChange={(e) => setDisputeDescription(e.target.value)}
              placeholder={isAr ? 'وصف مفصل لسبب النزاع...' : 'Detailed description of the dispute...'}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                         focus:outline-none focus:border-[#1266D6] resize-none text-[#1E293B]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowDispute(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="danger"
            onClick={() => disputeMutation.mutate()}
            loading={disputeMutation.isPending}
            disabled={!disputeDescription.trim()}
          >
            {isAr ? 'فتح النزاع' : 'Open Dispute'}
          </Button>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={showReview} onClose={() => setShowReview(false)} title={isAr ? 'تقييم الطرف الآخر' : 'Leave a Review'}>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              {isAr ? 'التقييم' : 'Rating'}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1"
                >
                  <Star
                    size={28}
                    className={star <= reviewRating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#CBD5E1]'}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1">
              {isAr ? 'التعليق' : 'Comment'}
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={isAr ? 'شاركنا تجربتك...' : 'Share your experience...'}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                         focus:outline-none focus:border-[#1266D6] resize-none text-[#1E293B]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowReview(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={() => reviewMutation.mutate()}
            loading={reviewMutation.isPending}
          >
            {isAr ? 'إرسال التقييم' : 'Submit Review'}
          </Button>
        </div>
      </Modal>

      {/* Create Shipment Modal */}
      <Modal isOpen={showCreateShipment} onClose={() => setShowCreateShipment(false)} title={isAr ? 'إنشاء شحنة' : 'Create Shipment'}>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1">
              {isAr ? 'ترتيب الشحن' : 'Shipping Arrangement'}
            </label>
            <select
              value={shipArrangement}
              onChange={(e) => setShipArrangement(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm focus:outline-none focus:border-[#1266D6] bg-white text-[#1E293B]"
            >
              <option value={1}>{isAr ? 'بترتيب المورد' : 'Supplier Arranged'}</option>
              <option value={2}>{isAr ? 'بترتيب ديل زون' : 'DealZone Arranged'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1">
              {isAr ? 'عنوان الاستلام *' : 'Pickup Address *'}
            </label>
            <input
              type="text"
              value={shipPickup}
              onChange={(e) => setShipPickup(e.target.value)}
              placeholder={isAr ? 'عنوان الاستلام...' : 'Pickup address...'}
              className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm focus:outline-none focus:border-[#1266D6] text-[#1E293B]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-1">
              {isAr ? 'عنوان التسليم *' : 'Delivery Address *'}
            </label>
            <input
              type="text"
              value={shipDelivery}
              onChange={(e) => setShipDelivery(e.target.value)}
              placeholder={isAr ? 'عنوان التسليم...' : 'Delivery address...'}
              className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm focus:outline-none focus:border-[#1266D6] text-[#1E293B]"
            />
          </div>
          {shipArrangement === 1 && (
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-1">
                {isAr ? 'الناقل (اختياري)' : 'Carrier (optional)'}
              </label>
              <input
                type="text"
                value={shipCarrier}
                onChange={(e) => setShipCarrier(e.target.value)}
                placeholder={isAr ? 'اسم الناقل...' : 'Carrier name...'}
                className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm focus:outline-none focus:border-[#1266D6] text-[#1E293B]"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowCreateShipment(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={() => shipmentMutation.mutate()}
            loading={shipmentMutation.isPending}
            disabled={!shipPickup.trim() || !shipDelivery.trim()}
          >
            {isAr ? 'إنشاء شحنة' : 'Create Shipment'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
