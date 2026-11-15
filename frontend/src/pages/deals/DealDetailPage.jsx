
import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, CheckCircle, Play, XCircle, AlertTriangle,
  Truck, Star, RefreshCw
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
import { statusMeta } from '../../utils/statusLabels'

const disputeCategories = [
  { value: 1, label: 'Quality Defect', labelAr: 'عيب في الجودة' },
  { value: 2, label: 'Quantity Mismatch', labelAr: 'عدم تطابق الكمية' },
  { value: 3, label: 'Late Delivery', labelAr: 'تأخر التسليم' },
  { value: 4, label: 'Damaged Goods', labelAr: 'بضاعة تالفة' },
  { value: 5, label: 'Non-Delivery', labelAr: 'عدم التسليم' },
  { value: 6, label: 'Terms Violation', labelAr: 'انتهاك الشروط' },
  { value: 99, label: 'Other', labelAr: 'أخرى' },
]

const normalizeId = (value) => String(value ?? '').trim().toLowerCase()

const toArray = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.results)) return value.results
  return []
}

const getErrorMessage = (error, fallback) =>
  error?.problem?.detail ||
  error?.response?.data?.detail ||
  error?.response?.data?.title ||
  error?.message ||
  fallback

const statusSteps = [
  'AwaitingConfirmation',
  'Confirmed',
  'InProgress',
  'Completed',
]

export default function DealDetailPage() {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const { language } = useTranslation()
  const isAr = language === 'ar'

  const {
    canManageDeals,
    isSalesManager,
    isOwner,
    isAdmin,
    isProcurementManager,
  } = usePermissions()

  const user = useAuthStore((state) => state.user)
  const currentCompanyId = normalizeId(user?.company?.id)

  // Modal state
  const [showCancel, setShowCancel] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [showReview, setShowReview] = useState(false)

  // Form state
  const [cancelReason, setCancelReason] = useState('')
  const [disputeCategory, setDisputeCategory] = useState(1)
  const [disputeDescription, setDisputeDescription] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  // Queries
  const {
    data: deal,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['deals', dealId],
    queryFn: () => dealService.get(dealId),
    enabled: Boolean(dealId),
  })

  const {
    data: shipmentsResponse,
    isLoading: shipmentsLoading,
    isError: shipmentsError,
    refetch: refetchShipments,
  } = useQuery({
    queryKey: ['deals', dealId, 'shipments'],
    queryFn: () => dealService.getDealShipments(dealId),
    enabled: Boolean(dealId),
  })

  const shipments = useMemo(
    () => toArray(shipmentsResponse),
    [shipmentsResponse]
  )

  const {
    data: reviewsResponse,
    isLoading: reviewsLoading,
    isError: reviewsError,
  } = useQuery({
    queryKey: ['deals', dealId, 'reviews'],
    queryFn: () => dealService.getDealReviews(dealId),
    enabled: Boolean(dealId) && deal?.status === 'Completed',
  })

  const reviews = useMemo(
    () => toArray(reviewsResponse),
    [reviewsResponse]
  )

  // Shared query invalidation
  const refreshDealData = async ({ includeReviews = true } = {}) => {
    const keys = [
      ['deals', dealId],
      ['deals'],
      ['deals', 'mine'],
    ]

    if (includeReviews) {
      keys.push(['deals', dealId, 'reviews'])
    }

    await Promise.all(
      keys.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      )
    )
  }

  // Mutations
  const confirmMutation = useMutation({
    mutationFn: () => dealService.confirm(dealId),
    onSuccess: async () => {
      toast.success(isAr ? 'تم تأكيد الصفقة' : 'Deal confirmed')
      await refreshDealData()
    },
    onError: (err) => {
      toast.error(getErrorMessage(
        err,
        isAr ? 'تعذر تأكيد الصفقة' : 'Failed to confirm deal'
      ))
    },
  })

  const startMutation = useMutation({
    mutationFn: () => dealService.start(dealId),
    onSuccess: async () => {
      toast.success(isAr ? 'تم بدء تنفيذ الصفقة' : 'Deal execution started')
      await refreshDealData()
    },
    onError: (err) => {
      toast.error(getErrorMessage(
        err,
        isAr ? 'تعذر بدء التنفيذ' : 'Failed to start fulfillment'
      ))
    },
  })

  const completeMutation = useMutation({
    mutationFn: () => dealService.complete(dealId),
    onSuccess: async () => {
      toast.success(isAr ? 'تم إتمام الصفقة' : 'Deal completed')
      setShowComplete(false)
      await refreshDealData()
    },
    onError: (err) => {
      toast.error(getErrorMessage(
        err,
        isAr ? 'تعذر إتمام الصفقة' : 'Failed to complete deal'
      ))
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => dealService.cancel(dealId, cancelReason.trim()),
    onSuccess: async () => {
      toast.success(isAr ? 'تم إلغاء الصفقة' : 'Deal cancelled')
      setShowCancel(false)
      setCancelReason('')
      await refreshDealData()
    },
    onError: (err) => {
      toast.error(getErrorMessage(
        err,
        isAr ? 'تعذر إلغاء الصفقة' : 'Failed to cancel deal'
      ))
    },
  })

  const disputeMutation = useMutation({
    mutationFn: () =>
      dealService.openDispute(
        dealId,
        Number(disputeCategory),
        disputeDescription.trim()
      ),
    onSuccess: async () => {
      toast.success(isAr ? 'تم فتح النزاع' : 'Dispute opened')
      setShowDispute(false)
      setDisputeDescription('')
      setDisputeCategory(1)
      await refreshDealData()
    },
    onError: (err) => {
      toast.error(getErrorMessage(
        err,
        isAr ? 'تعذر فتح النزاع' : 'Failed to open dispute'
      ))
    },
  })

  const reviewMutation = useMutation({
    mutationFn: () =>
      dealService.submitReview(
        dealId,
        reviewRating,
        reviewComment.trim()
      ),
    onSuccess: async () => {
      toast.success(isAr ? 'تم إرسال التقييم' : 'Review submitted')
      setShowReview(false)
      setReviewComment('')
      setReviewRating(5)
      await refreshDealData()
    },
    onError: (err) => {
      toast.error(getErrorMessage(
        err,
        isAr ? 'تعذر إرسال التقييم' : 'Failed to submit review'
      ))
    },
  })

  // Loading and error states
  if (isLoading) return <PageSpinner />

  if (isError || !deal) {
    const statusCode =
      error?.status ||
      error?.response?.status

    const is404 = statusCode === 404

    return (
      <div className="max-w-md mx-auto mt-8 p-8 md:p-12 text-center space-y-4 bg-white rounded-3xl border border-slate-200">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
          <AlertTriangle size={28} className="text-slate-400" />
        </div>

        <h2 className="text-lg font-bold text-[#06245B]">
          {is404
            ? (isAr ? 'الصفقة غير موجودة' : 'Deal not found')
            : (isAr ? 'تعذّر تحميل الصفقة' : 'Could not load deal')}
        </h2>

        <p className="text-sm text-slate-500">
          {is404
            ? (isAr
              ? 'قد تكون الصفقة غير موجودة أو لا تملك صلاحية الوصول إليها.'
              : 'The deal may not exist or you may not have access to it.')
            : (isAr
              ? 'تحقق من اتصالك وحاول مرة أخرى.'
              : 'Check your connection and try again.')}
        </p>

        {!is404 && (
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw size={15} className="me-2" />
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        )}

        <Button variant="outline" onClick={() => navigate('/deals')}>
          {isAr ? 'العودة للصفقات' : 'Back to Deals'}
        </Button>
      </div>
    )
  }

  // Deal participants and permissions
  const buyerCompanyId = normalizeId(deal.buyerCompanyId)
  const supplierCompanyId = normalizeId(deal.supplierCompanyId)

  const isBuyer = Boolean(
    currentCompanyId && currentCompanyId === buyerCompanyId
  )

  const isSupplier = Boolean(
    currentCompanyId && currentCompanyId === supplierCompanyId
  )

  const isParticipant = isBuyer || isSupplier

  const canConfirm =
    (isBuyer &&
      !deal.confirmedByBuyer &&
      (isProcurementManager || isOwner || isAdmin)) ||
    (isSupplier &&
      !deal.confirmedBySupplier &&
      (isSalesManager || isOwner || isAdmin))

  const canStart =
    isSupplier &&
    deal.status === 'Confirmed' &&
    (isSalesManager || isOwner || isAdmin)

  // Either authorized party may request completion.
  // The backend must enforce participant and status authorization.
  const canComplete =
    isParticipant &&
    canManageDeals &&
    deal.status === 'InProgress'

  const canCancel =
    isParticipant &&
    canManageDeals &&
    ['AwaitingConfirmation', 'Confirmed', 'InProgress'].includes(deal.status)

  const canDispute =
    isParticipant &&
    canManageDeals &&
    ['Confirmed', 'InProgress'].includes(deal.status)

  const hasReviewed = reviews.some(
    (review) =>
      normalizeId(review.reviewerCompanyId) === currentCompanyId
  )

  const canReview =
    isParticipant &&
    canManageDeals &&
    deal.status === 'Completed' &&
    !hasReviewed

  const terms = deal.commercialTerms
  const lineItems = toArray(terms?.items)
  const disputes = toArray(deal.disputes)

  const currentStepIndex = statusSteps.indexOf(deal.status)

  const canSubmitCancel = cancelReason.trim().length >= 3
  const canSubmitDispute = disputeDescription.trim().length >= 10

  const formatStatus = (status) =>
    status?.replace(/([A-Z])/g, ' $1').trim() || '—'

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/deals')}
            aria-label={isAr ? 'العودة للصفقات' : 'Back to deals'}
            className="mt-1 shrink-0 p-2 rounded-lg hover:bg-[#EAF4FF] text-[#64748B] hover:text-[#06245B] transition-colors"
          >
            <ArrowLeft size={20} className={isAr ? 'rotate-180' : ''} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono text-[#64748B] bg-[#F4F7FB] px-2 py-1 rounded">
                {deal.dealNumber || deal.id}
              </span>

              <Badge variant={statusMeta('deal', deal.status, isAr).variant}>
                {statusMeta('deal', deal.status, isAr).label}
              </Badge>
            </div>

            <h1 className="text-xl font-bold text-[#06245B] mt-2 break-words">
              {deal.rfqTitle || (isAr ? 'صفقة' : 'Deal')}
            </h1>

            <p className="text-sm text-[#64748B] mt-1 flex flex-wrap items-center gap-x-1 gap-y-1">
              {isAr ? 'المشتري:' : 'Buyer:'}
              <Link
                to={`/buyers/${deal.buyerCompanyId}`}
                className="hover:text-[#1266D6] hover:underline font-semibold"
              >
                {deal.buyerCompanyName || '—'}
              </Link>

              <span className="mx-1">·</span>

              {isAr ? 'المورد:' : 'Supplier:'}
              <Link
                to={`/suppliers/${deal.supplierCompanyId}`}
                className="hover:text-[#1266D6] hover:underline font-semibold"
              >
                {deal.supplierCompanyName || '—'}
              </Link>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {canConfirm && (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle size={16} />}
              onClick={() => confirmMutation.mutate()}
              loading={confirmMutation.isPending}
              disabled={confirmMutation.isPending}
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
              disabled={startMutation.isPending}
            >
              {isAr ? 'بدء التنفيذ' : 'Start Fulfillment'}
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
          {statusSteps.map((status, index) => {
            const isCurrent = deal.status === status
            const isPast =
              currentStepIndex >= 0 && index < currentStepIndex

            return (
              <div key={status} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium ${
                    isCurrent
                      ? 'bg-[#06245B] text-white'
                      : isPast
                        ? 'bg-[#D1FAE5] text-[#059669]'
                        : 'bg-[#F4F7FB] text-[#94A3B8]'
                  }`}
                >
                  {isPast && <CheckCircle size={12} />}
                  {isAr
                    ? ({
                        AwaitingConfirmation: 'بانتظار التأكيد',
                        Confirmed: 'تم التأكيد',
                        InProgress: 'قيد التنفيذ',
                        Completed: 'مكتملة',
                      }[status])
                    : formatStatus(status)}
                </div>

                {index < statusSteps.length - 1 && (
                  <span className="text-[#CBD5E1] text-xs">→</span>
                )}
              </div>
            )
          })}

          {deal.status === 'Disputed' && (
            <Badge variant="error">
              <AlertTriangle size={12} className="inline me-1" />
              {isAr ? 'متنازع عليها' : 'Disputed'}
            </Badge>
          )}

          {deal.status === 'Cancelled' && (
            <Badge variant="warning">
              {isAr ? 'ملغاة' : 'Cancelled'}
            </Badge>
          )}
        </div>

        {deal.status === 'AwaitingConfirmation' && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                label: isAr ? 'المشتري' : 'Buyer',
                name: deal.buyerCompanyName,
                confirmed: deal.confirmedByBuyer,
              },
              {
                label: isAr ? 'المورد' : 'Supplier',
                name: deal.supplierCompanyName,
                confirmed: deal.confirmedBySupplier,
              },
            ].map((party) => (
              <div
                key={party.label}
                className={`p-3 rounded-lg ${
                  party.confirmed ? 'bg-[#D1FAE5]' : 'bg-[#FEF3C7]'
                }`}
              >
                <div className="font-medium text-sm text-[#1E293B]">
                  {party.label}: {party.name || '—'}
                </div>
                <div className={`text-xs mt-1 ${
                  party.confirmed ? 'text-[#059669]' : 'text-[#D97706]'
                }`}>
                  {party.confirmed
                    ? (isAr ? 'تم التأكيد' : 'Confirmed')
                    : (isAr ? 'بانتظار التأكيد' : 'Pending confirmation')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Commercial Terms */}
      {terms && (
        <Card>
          <CardHeader
            title={isAr ? 'الشروط التجارية المتفق عليها' : 'Agreed Commercial Terms'}
            subtitle={isAr
              ? 'نسخة الشروط التجارية المسجلة عند إنشاء الصفقة'
              : 'The commercial terms recorded when this deal was created'}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[#64748B] text-xs mb-1">
                {isAr ? 'المبلغ الإجمالي' : 'Total Amount'}
              </p>
              <p className="font-bold text-[#06245B] text-lg">
                {formatCurrency(terms.totalAmount)}
              </p>
            </div>

            <div>
              <p className="text-[#64748B] text-xs mb-1">
                {isAr ? 'العملة' : 'Currency'}
              </p>
              <p className="font-medium text-[#1E293B]">
                {terms.currency || '—'}
              </p>
            </div>

            <div>
              <p className="text-[#64748B] text-xs mb-1">
                {isAr ? 'مهلة التسليم' : 'Lead Time'}
              </p>
              <p className="font-medium text-[#1E293B]">
                {terms.deliveryLeadTimeDays ?? '—'} {isAr ? 'يوم' : 'days'}
              </p>
            </div>

            <div>
              <p className="text-[#64748B] text-xs mb-1">
                {isAr ? 'الشحن' : 'Shipping'}
              </p>
              <p className="font-medium text-[#1E293B]">
                {terms.shippingIncluded
                  ? (isAr ? 'مشمول' : 'Included')
                  : (isAr ? 'غير مشمول' : 'Not Included')}
              </p>
            </div>

            <div>
              <p className="text-[#64748B] text-xs mb-1">
                {isAr ? 'شروط الدفع' : 'Payment Terms'}
              </p>
              <p className="font-medium text-[#1E293B]">
                {terms.paymentTerms || '—'}
              </p>
            </div>

            <div>
              <p className="text-[#64748B] text-xs mb-1">
                {isAr ? 'صلاحية العرض' : 'Offer Validity'}
              </p>
              <p className="font-medium text-[#1E293B]">
                {terms.validityDateUtc
                  ? formatDate(terms.validityDateUtc)
                  : '—'}
              </p>
            </div>
          </div>

          <CardDivider />

          <h4 className="text-sm font-semibold text-[#06245B] mb-3">
            {isAr ? 'بنود الصفقة' : 'Deal Line Items'}
          </h4>

          {lineItems.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              {isAr ? 'لا توجد بنود مسجلة' : 'No line items available'}
            </p>
          ) : (
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="text-[#64748B] text-xs border-b border-slate-200">
                    <th className="text-start pb-3 pe-3">
                      {isAr ? 'المادة' : 'Material'}
                    </th>
                    <th className="text-end pb-3 px-3">
                      {isAr ? 'الكمية' : 'Quantity'}
                    </th>
                    <th className="text-end pb-3 px-3">
                      {isAr ? 'سعر الوحدة' : 'Unit Price'}
                    </th>
                    <th className="text-end pb-3 ps-3">
                      {isAr ? 'الإجمالي' : 'Total'}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {lineItems.map((item, index) => (
                    <tr key={item.id || index} className="text-[#1E293B]">
                      <td className="py-3 pe-3 font-medium">
                        {item.materialName || item.productName || '—'}
                      </td>
                      <td className="py-3 px-3 text-end text-slate-600">
                        {item.offeredQuantity ?? item.quantity ?? '—'}
                      </td>
                      <td className="py-3 px-3 text-end">
                        {item.unitPrice != null
                          ? formatCurrency(item.unitPrice)
                          : '—'}
                      </td>
                      <td className="py-3 ps-3 text-end font-semibold">
                        {item.totalPrice != null
                          ? formatCurrency(item.totalPrice)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Shipments */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <CardHeader
            title={isAr ? 'الشحنات' : 'Shipments'}
            subtitle={isAr
              ? 'الشحنات المرتبطة بهذه الصفقة'
              : 'Shipments associated with this deal'}
          />

          <button
            type="button"
            onClick={() => refetchShipments()}
            disabled={shipmentsLoading}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label={isAr ? 'تحديث الشحنات' : 'Refresh shipments'}
          >
            <RefreshCw size={16} className={shipmentsLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {shipmentsLoading ? (
          <p className="text-sm text-slate-500 text-center py-6">
            {isAr ? 'جاري تحميل الشحنات...' : 'Loading shipments...'}
          </p>
        ) : shipmentsError ? (
          <div className="text-center py-6">
            <p className="text-sm text-red-600 mb-3">
              {isAr ? 'تعذر تحميل الشحنات' : 'Could not load shipments'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetchShipments()}>
              {isAr ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-8">
            <Truck size={40} className="mx-auto text-[#CBD5E1] mb-3" />
            <p className="text-sm text-[#64748B]">
              {isAr ? 'لا توجد شحنات مسجلة لهذه الصفقة' : 'No shipments recorded for this deal'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <Link
                key={shipment.id}
                to={`/shipments/${shipment.id}`}
                className="flex items-center justify-between gap-3 p-3 bg-[#F4F7FB] rounded-xl hover:bg-[#EAF4FF] transition-colors"
              >
                <div className="min-w-0">
                  <span className="font-medium text-sm text-[#06245B]">
                    {shipment.shipmentNumber || (isAr ? 'شحنة' : 'Shipment')}
                  </span>
                  <p className="text-xs text-[#64748B] mt-1">
                    {shipment.arrangement === 'SupplierArranged'
                      ? (isAr ? 'بترتيب المورد' : 'Supplier Arranged')
                      : (isAr ? 'بترتيب ديل زون' : 'DealZone Arranged')}
                  </p>
                </div>

                <Badge variant="info">
                  {shipment.status || '—'}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Disputes */}
      {disputes.length > 0 && (
        <Card>
          <CardHeader title={isAr ? 'النزاعات' : 'Disputes'} />

          <div className="space-y-3">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="p-4 bg-red-50 rounded-xl border border-red-100"
              >
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span className="font-medium text-sm text-[#06245B]">
                    {dispute.category || (isAr ? 'نزاع' : 'Dispute')}
                  </span>

                  <Badge
                    variant={
                      dispute.status === 'Open'
                        ? 'error'
                        : dispute.status === 'Resolved'
                          ? 'success'
                          : 'warning'
                    }
                  >
                    {dispute.status || '—'}
                  </Badge>
                </div>

                <p className="text-sm text-[#475569] whitespace-pre-wrap break-words">
                  {dispute.description || '—'}
                </p>

                <p className="text-xs text-[#64748B] mt-2">
                  {isAr ? 'بواسطة:' : 'By:'}{' '}
                  {dispute.openedByCompanyName || '—'}
                  {' · '}
                  {dispute.openedAtUtc
                    ? formatDate(dispute.openedAtUtc)
                    : '—'}
                </p>

                {dispute.resolutionNotes && (
                  <p className="text-sm text-emerald-700 mt-3 font-medium">
                    {isAr ? 'قرار النزاع:' : 'Resolution:'}{' '}
                    {dispute.resolutionNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reviews */}
      {deal.status === 'Completed' && (
        <Card>
          <CardHeader title={isAr ? 'التقييمات' : 'Reviews'} />

          {reviewsLoading ? (
            <p className="text-sm text-slate-500 text-center py-6">
              {isAr ? 'جاري تحميل التقييمات...' : 'Loading reviews...'}
            </p>
          ) : reviewsError ? (
            <p className="text-sm text-red-600 text-center py-6">
              {isAr ? 'تعذر تحميل التقييمات' : 'Could not load reviews'}
            </p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              {isAr ? 'لم يتم إرسال تقييمات بعد' : 'No reviews submitted yet'}
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="p-4 bg-[#F4F7FB] rounded-xl">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div
                      className="flex"
                      role="img"
                      aria-label={`${review.rating} ${isAr ? 'من 5 نجوم' : 'out of 5 stars'}`}
                    >
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          size={16}
                          aria-hidden="true"
                          className={
                            index < review.rating
                              ? 'text-[#F59E0B] fill-[#F59E0B]'
                              : 'text-[#CBD5E1]'
                          }
                        />
                      ))}
                    </div>

                    <span className="text-sm font-medium text-[#06245B]">
                      {review.reviewerCompanyName || '—'}
                    </span>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-[#475569] whitespace-pre-wrap break-words">
                      {review.comment}
                    </p>
                  )}

                  <p className="text-xs text-[#94A3B8] mt-2">
                    {review.createdAtUtc
                      ? formatDate(review.createdAtUtc)
                      : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancel}
        onClose={() => !cancelMutation.isPending && setShowCancel(false)}
        title={isAr ? 'إلغاء الصفقة' : 'Cancel Deal'}
      >
        <div className="space-y-4 mb-6">
          <p className="text-sm text-[#475569]">
            {isAr
              ? 'يرجى توضيح سبب إلغاء الصفقة. سيتم تسجيل السبب ضمن تفاصيل الصفقة.'
              : 'Please explain why you want to cancel this deal. The reason will be recorded.'}
          </p>

          <textarea
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder={isAr ? 'سبب الإلغاء...' : 'Cancellation reason...'}
            rows={4}
            maxLength={1000}
            disabled={cancelMutation.isPending}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#1266D6] resize-y text-[#1E293B] disabled:bg-slate-50"
          />

          <p className="text-xs text-slate-400 text-end">
            {cancelReason.length}/1000
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCancel(false)}
            disabled={cancelMutation.isPending}
          >
            {isAr ? 'رجوع' : 'Go Back'}
          </Button>

          <Button
            variant="danger"
            onClick={() => cancelMutation.mutate()}
            loading={cancelMutation.isPending}
            disabled={!canSubmitCancel || cancelMutation.isPending}
          >
            {isAr ? 'تأكيد الإلغاء' : 'Confirm Cancellation'}
          </Button>
        </div>
      </Modal>

      {/* Complete Modal */}
      <Modal
        isOpen={showComplete}
        onClose={() => !completeMutation.isPending && setShowComplete(false)}
        title={isAr ? 'إتمام الصفقة' : 'Complete Deal'}
      >
        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
            <div className="flex items-start gap-2">
              <AlertTriangle size={19} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                {isAr
                  ? 'تأكد من استلام أو تسليم المنتجات والاتفاق على إتمام الصفقة قبل المتابعة.'
                  : 'Make sure the goods have been delivered or received and both parties are ready to close the deal.'}
              </p>
            </div>
          </div>

          <p className="text-sm text-[#475569]">
            {isAr
              ? 'بعد إتمام الصفقة ستصبح مؤهلة للتقييم، ولن يكون بالإمكان تعديل حالتها من هذه الصفحة.'
              : 'After completion, the deal becomes eligible for reviews and cannot be reopened from this page.'}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setShowComplete(false)}
            disabled={completeMutation.isPending}
          >
            {isAr ? 'رجوع' : 'Go Back'}
          </Button>

          <Button
            variant="primary"
            icon={<CheckCircle size={16} />}
            onClick={() => completeMutation.mutate()}
            loading={completeMutation.isPending}
            disabled={!canComplete || completeMutation.isPending}
          >
            {isAr ? 'تأكيد إتمام الصفقة' : 'Confirm Completion'}
          </Button>
        </div>
      </Modal>

      {/* Dispute Modal */}
      <Modal
        isOpen={showDispute}
        onClose={() => !disputeMutation.isPending && setShowDispute(false)}
        title={isAr ? 'فتح نزاع' : 'Open Dispute'}
      >
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              {isAr ? 'نوع النزاع' : 'Dispute Category'}
            </label>

            <select
              value={disputeCategory}
              onChange={(event) => setDisputeCategory(Number(event.target.value))}
              disabled={disputeMutation.isPending}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#1266D6] bg-white text-[#1E293B]"
            >
              {disputeCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {isAr ? category.labelAr : category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              {isAr ? 'وصف النزاع *' : 'Description *'}
            </label>

            <textarea
              value={disputeDescription}
              onChange={(event) => setDisputeDescription(event.target.value)}
              placeholder={isAr
                ? 'اشرح المشكلة والتفاصيل المتعلقة بها...'
                : 'Describe the issue and relevant details...'}
              rows={5}
              maxLength={3000}
              disabled={disputeMutation.isPending}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#1266D6] resize-y text-[#1E293B] disabled:bg-slate-50"
            />

            <p className="text-xs text-slate-400 text-end mt-1">
              {disputeDescription.length}/3000
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setShowDispute(false)}
            disabled={disputeMutation.isPending}
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>

          <Button
            variant="danger"
            onClick={() => disputeMutation.mutate()}
            loading={disputeMutation.isPending}
            disabled={!canSubmitDispute || disputeMutation.isPending}
          >
            {isAr ? 'إرسال النزاع' : 'Submit Dispute'}
          </Button>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReview}
        onClose={() => !reviewMutation.isPending && setShowReview(false)}
        title={isAr ? 'تقييم الطرف الآخر' : 'Leave a Review'}
      >
        <div className="space-y-5 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-3">
              {isAr ? 'تقييمك للصفقة' : 'Your Rating'}
            </label>

            <div className="flex gap-2" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  disabled={reviewMutation.isPending}
                  aria-label={`${star} ${isAr ? 'نجوم' : 'stars'}`}
                  aria-pressed={reviewRating === star}
                  className="p-1 rounded-lg hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
                >
                  <Star
                    size={30}
                    className={
                      star <= reviewRating
                        ? 'text-[#F59E0B] fill-[#F59E0B]'
                        : 'text-[#CBD5E1]'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              {isAr ? 'التعليق (اختياري)' : 'Comment (Optional)'}
            </label>

            <textarea
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              placeholder={isAr
                ? 'شاركنا تجربتك مع الطرف الآخر...'
                : 'Share your experience with the other party...'}
              rows={4}
              maxLength={1000}
              disabled={reviewMutation.isPending}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#1266D6] resize-y text-[#1E293B] disabled:bg-slate-50"
            />

            <p className="text-xs text-slate-400 text-end mt-1">
              {reviewComment.length}/1000
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setShowReview(false)}
            disabled={reviewMutation.isPending}
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>

          <Button
            variant="primary"
            onClick={() => reviewMutation.mutate()}
            loading={reviewMutation.isPending}
            disabled={reviewMutation.isPending}
          >
            {isAr ? 'إرسال التقييم' : 'Submit Review'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
