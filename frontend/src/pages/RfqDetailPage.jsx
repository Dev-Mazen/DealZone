import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Edit, Send, XCircle, Clock, MapPin, Calendar,
  Package, Banknote, FileText, ChevronDown, ChevronUp
} from 'lucide-react'
import { rfqService } from '../shared/api/services/rfqService'
import { offerService } from '../shared/api/services/offerService'
import { useTranslation } from '../hooks/useTranslation'
import { usePermissions } from '../hooks/usePermissions'
import { useToast } from '../hooks/useToast'
import Button from '../components/ui/Button'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { PageSpinner } from '../components/ui/Spinner'
import { formatDate, formatDateTime, formatCurrency } from '../utils/format'

const statusVariant = {
  Draft: 'navy',
  Published: 'success',
  Closed: 'warning',
  Cancelled: 'error',
}

const offerStatusVariant = {
  Submitted: 'info',
  UnderReview: 'warning',
  Accepted: 'success',
  Rejected: 'error',
  Superseded: 'navy',
  Withdrawn: 'navy',
  Expired: 'error',
}

function OfferCard({ offer, onAccept, onReject, canAccept }) {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-[rgba(6,36,91,0.08)] p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-mono text-[#64748B]">{offer.offerNumber}</span>
          <p className="font-semibold text-[#06245B] mt-0.5">{offer.supplierCompanyName}</p>
          <p className="text-xs text-[#64748B]">
            {offer.supplierCity}, {offer.supplierGovernorate}
            {offer.revisionNumber > 1 && (
              <span className="ms-2 bg-[#EAF4FF] text-[#1266D6] px-1.5 py-0.5 rounded text-xs font-medium">
                Rev. {offer.revisionNumber}
              </span>
            )}
          </p>
        </div>
        <Badge variant={offerStatusVariant[offer.status] || 'navy'}>
          {offer.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
        <div>
          <p className="text-[#64748B] text-xs mb-0.5">{isAr ? 'المبلغ الإجمالي' : 'Total Amount'}</p>
          <p className="font-bold text-[#06245B] text-base">{formatCurrency(offer.totalAmount)}</p>
        </div>
        <div>
          <p className="text-[#64748B] text-xs mb-0.5">{isAr ? 'مهلة التسليم' : 'Lead Time'}</p>
          <p className="font-medium text-[#1E293B]">
            {offer.deliveryLeadTimeDays} {isAr ? 'يوم' : 'days'}
          </p>
        </div>
        <div>
          <p className="text-[#64748B] text-xs mb-0.5">{isAr ? 'الشحن مشمول' : 'Shipping'}</p>
          <p className="font-medium text-[#1E293B]">
            {offer.shippingIncluded
              ? (isAr ? 'مشمول' : 'Included')
              : (isAr ? 'غير مشمول' : 'Not Included')}
          </p>
        </div>
        <div>
          <p className="text-[#64748B] text-xs mb-0.5">{isAr ? 'شروط الدفع' : 'Payment Terms'}</p>
          <p className="font-medium text-[#1E293B]">{offer.paymentTerms}</p>
        </div>
        <div>
          <p className="text-[#64748B] text-xs mb-0.5">{isAr ? 'صالح حتى' : 'Valid Until'}</p>
          <p className="font-medium text-[#1E293B]">{formatDate(offer.validityDateUtc)}</p>
        </div>
        <div>
          <p className="text-[#64748B] text-xs mb-0.5">{isAr ? 'تاريخ التقديم' : 'Submitted'}</p>
          <p className="font-medium text-[#1E293B]">{formatDateTime(offer.submittedAtUtc)}</p>
        </div>
      </div>

      {/* Line items toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-sm text-[#1266D6] hover:text-[#06245B] transition-colors"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded
          ? (isAr ? 'إخفاء البنود' : 'Hide Line Items')
          : (isAr ? `${offer.items.length} بند — عرض` : `${offer.items.length} line item${offer.items.length !== 1 ? 's' : ''} — Show`)}
      </button>

      {expanded && (
        <div className="mt-3 border-t border-[rgba(6,36,91,0.06)] pt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#64748B] text-xs">
                <th className="text-start pb-2">{isAr ? 'المواد' : 'Material'}</th>
                <th className="text-end pb-2">{isAr ? 'الكمية' : 'Qty'}</th>
                <th className="text-end pb-2">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                <th className="text-end pb-2">{isAr ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(6,36,91,0.04)]">
              {offer.items.map((item) => (
                <tr key={item.id} className="text-[#1E293B]">
                  <td className="py-2">{item.rfqItemMaterialName}</td>
                  <td className="py-2 text-end">{item.offeredQuantity}</td>
                  <td className="py-2 text-end">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2 text-end font-medium">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes */}
      {offer.notes && (
        <div className="mt-3 pt-3 border-t border-[rgba(6,36,91,0.06)]">
          <p className="text-xs text-[#64748B] mb-1">{isAr ? 'ملاحظات:' : 'Notes:'}</p>
          <p className="text-sm text-[#475569]">{offer.notes}</p>
        </div>
      )}

      {/* Actions for buyer */}
      {canAccept && offer.status === 'Submitted' && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-[rgba(6,36,91,0.06)]">
          <Button
            variant="primary"
            size="sm"
            onClick={onAccept}
          >
            {isAr ? 'قبول العرض' : 'Accept Offer'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
          >
            {isAr ? 'رفض' : 'Reject'}
          </Button>
          <Link to={`/offers/${offer.id}/revisions`}>
            <Button variant="ghost" size="sm">
              {isAr ? 'المراجعات' : 'Revisions'}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

export default function RfqDetailPage() {
  const { rfqId } = useParams()
  const { language } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { canManageRfqs, canSubmitOffers } = usePermissions()
  const isAr = language === 'ar'

  const [confirmAction, setConfirmAction] = useState(null)
  const [acceptOfferId, setAcceptOfferId] = useState(null)
  const [rejectOfferId, setRejectOfferId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: rfq, isLoading, error } = useQuery({
    queryKey: ['rfqs', rfqId],
    queryFn: () => rfqService.get(rfqId),
    enabled: !!rfqId,
  })

  // Buyer: load all offers for this RFQ
  const isOwnerBuyer = rfq?.isOwner && canManageRfqs
  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['offers', 'by-rfq', rfqId],
    queryFn: () => offerService.getForRfq(rfqId),
    enabled: !!rfqId && isOwnerBuyer,
  })

  // Supplier: load their own offer for this RFQ
  const { data: myOffer } = useQuery({
    queryKey: ['offers', 'mine-for-rfq', rfqId],
    queryFn: () => offerService.getMyOfferForRfq(rfqId),
    enabled: !!rfqId && canSubmitOffers && !canManageRfqs,
  })

  const publishMutation = useMutation({
    mutationFn: () => rfqService.publish(rfqId),
    onSuccess: () => {
      toast.success(isAr ? 'تم نشر طلب السعر' : 'RFQ published successfully')
      queryClient.invalidateQueries({ queryKey: ['rfqs', rfqId] })
      queryClient.invalidateQueries({ queryKey: ['rfqs', 'mine'] })
      setConfirmAction(null)
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to publish RFQ'),
  })

  const closeMutation = useMutation({
    mutationFn: () => rfqService.close(rfqId),
    onSuccess: () => {
      toast.success(isAr ? 'تم إغلاق طلب السعر' : 'RFQ closed')
      queryClient.invalidateQueries({ queryKey: ['rfqs', rfqId] })
      queryClient.invalidateQueries({ queryKey: ['rfqs', 'mine'] })
      setConfirmAction(null)
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to close RFQ'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => rfqService.cancel(rfqId),
    onSuccess: () => {
      toast.success(isAr ? 'تم إلغاء طلب السعر' : 'RFQ cancelled')
      queryClient.invalidateQueries({ queryKey: ['rfqs', rfqId] })
      queryClient.invalidateQueries({ queryKey: ['rfqs', 'mine'] })
      setConfirmAction(null)
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to cancel RFQ'),
  })

  const acceptOfferMutation = useMutation({
    mutationFn: (offerId) => offerService.accept(offerId),
    onSuccess: (deal) => {
      toast.success(isAr ? 'تم قبول العرض! تم إنشاء الصفقة.' : 'Offer accepted! Deal created.')
      queryClient.invalidateQueries({ queryKey: ['rfqs', rfqId] })
      queryClient.invalidateQueries({ queryKey: ['offers', 'by-rfq', rfqId] })
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      setAcceptOfferId(null)
      navigate(`/deals/${deal.dealId}`)
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to accept offer'),
  })

  const rejectOfferMutation = useMutation({
    mutationFn: ({ offerId, reason }) =>
      offerService.reject(offerId, reason),
    onSuccess: () => {
      toast.success(isAr ? 'تم رفض العرض' : 'Offer rejected')
      queryClient.invalidateQueries({ queryKey: ['offers', 'by-rfq', rfqId] })
      setRejectOfferId(null)
      setRejectReason('')
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to reject offer'),
  })

  if (isLoading) return <PageSpinner />

  if (error || !rfq) {
    return (
      <div className="text-center py-16">
        <p className="text-[#EF4444] mb-4">{isAr ? 'طلب السعر غير موجود' : 'RFQ not found'}</p>
        <Button variant="outline" onClick={() => navigate('/rfqs')}>
          {isAr ? 'العودة' : 'Back to RFQs'}
        </Button>
      </div>
    )
  }

  const canPublish = rfq.isOwner && rfq.status === 'Draft'
  const canClose = rfq.isOwner && rfq.status === 'Published'
  const canCancel = rfq.isOwner && (rfq.status === 'Draft' || rfq.status === 'Published')
  const canEdit = rfq.isOwner && rfq.status === 'Draft'
  const isMutating = publishMutation.isPending || closeMutation.isPending || cancelMutation.isPending

  const categoryName = isAr
    ? (rfq.targetCategoryNameAr || rfq.targetCategoryNameEn)
    : (rfq.targetCategoryNameEn || rfq.targetCategoryNameAr)

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/rfqs')}
            className="mt-1 p-2 rounded-lg hover:bg-[#EAF4FF] text-[#64748B] hover:text-[#06245B] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono text-[#64748B] bg-[#F4F7FB] px-2 py-1 rounded">
                {rfq.rfqNumber}
              </span>
              <Badge variant={statusVariant[rfq.status] || 'navy'}>{rfq.status}</Badge>
            </div>
            <h1 className="text-xl font-bold text-[#06245B] mt-1">{rfq.title}</h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              {isAr ? 'المشتري:' : 'Buyer:'} {rfq.buyerCompanyName}
              {rfq.publishedAtUtc && ` · ${isAr ? 'نُشر:' : 'Published:'} ${formatDate(rfq.publishedAtUtc)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit size={16} />}
              onClick={() => navigate(`/rfqs/${rfqId}/edit`)}
            >
              {isAr ? 'تعديل' : 'Edit'}
            </Button>
          )}
          {canPublish && (
            <Button
              variant="primary"
              size="sm"
              icon={<Send size={16} />}
              onClick={() => setConfirmAction('publish')}
              loading={publishMutation.isPending}
            >
              {isAr ? 'نشر' : 'Publish'}
            </Button>
          )}
          {canClose && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Clock size={16} />}
              onClick={() => setConfirmAction('close')}
              loading={closeMutation.isPending}
            >
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              icon={<XCircle size={16} />}
              onClick={() => setConfirmAction('cancel')}
              loading={cancelMutation.isPending}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
          )}
          {/* Supplier submit offer button */}
          {canSubmitOffers && !canManageRfqs && rfq.status === 'Published' && !myOffer && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/rfqs/${rfqId}/submit-offer`)}
            >
              {isAr ? 'تقديم عرض' : 'Submit Offer'}
            </Button>
          )}
        </div>
      </div>

      {/* Main info */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Details */}
        <Card>
          <CardHeader
            title={isAr ? 'تفاصيل الطلب' : 'Request Details'}
          />
          <dl className="space-y-3 text-sm">
            {categoryName && (
              <div className="flex items-start gap-2">
                <FileText size={15} className="text-[#1266D6] mt-0.5 shrink-0" />
                <div>
                  <dt className="text-[#64748B] text-xs">{isAr ? 'الفئة المستهدفة' : 'Target Category'}</dt>
                  <dd className="font-medium text-[#1E293B]">{categoryName}</dd>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin size={15} className="text-[#1266D6] mt-0.5 shrink-0" />
              <div>
                <dt className="text-[#64748B] text-xs">{isAr ? 'عنوان التسليم' : 'Delivery Address'}</dt>
                <dd className="font-medium text-[#1E293B]">
                  {rfq.deliveryAddress}, {rfq.deliveryCity}, {rfq.deliveryGovernorate}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar size={15} className="text-[#1266D6] mt-0.5 shrink-0" />
              <div>
                <dt className="text-[#64748B] text-xs">{isAr ? 'تاريخ إغلاق العروض' : 'Closing Date'}</dt>
                <dd className="font-medium text-[#1E293B]">{formatDate(rfq.closingDateUtc)}</dd>
              </div>
            </div>
            {rfq.requiredDeliveryDateUtc && (
              <div className="flex items-start gap-2">
                <Calendar size={15} className="text-[#1266D6] mt-0.5 shrink-0" />
                <div>
                  <dt className="text-[#64748B] text-xs">{isAr ? 'تاريخ التسليم المطلوب' : 'Required Delivery Date'}</dt>
                  <dd className="font-medium text-[#1E293B]">{formatDate(rfq.requiredDeliveryDateUtc)}</dd>
                </div>
              </div>
            )}
            {rfq.targetBudget && (
              <div className="flex items-start gap-2">
                <Banknote size={15} className="text-[#1266D6] mt-0.5 shrink-0" />
                <div>
                  <dt className="text-[#64748B] text-xs">{isAr ? 'الميزانية المستهدفة' : 'Target Budget'}</dt>
                  <dd className="font-medium text-[#1E293B]">{formatCurrency(rfq.targetBudget)}</dd>
                </div>
              </div>
            )}
          </dl>

          {rfq.description && (
            <div className="mt-4 pt-4 border-t border-[rgba(6,36,91,0.06)]">
              <p className="text-xs text-[#64748B] mb-1">{isAr ? 'الوصف' : 'Description'}</p>
              <p className="text-sm text-[#475569] whitespace-pre-wrap">{rfq.description}</p>
            </div>
          )}
          {rfq.notes && (
            <div className="mt-3">
              <p className="text-xs text-[#64748B] mb-1">{isAr ? 'ملاحظات' : 'Notes'}</p>
              <p className="text-sm text-[#475569] whitespace-pre-wrap">{rfq.notes}</p>
            </div>
          )}
        </Card>

        {/* Line items */}
        <Card>
          <CardHeader
            title={isAr ? `بنود الطلب (${rfq.items.length})` : `Line Items (${rfq.items.length})`}
          />
          <div className="space-y-3">
            {rfq.items.map((item) => (
              <div key={item.id} className="p-3 bg-[#F4F7FB] rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-medium text-sm text-[#1E293B]">{item.materialName}</p>
                  <span className="text-xs bg-[#EAF4FF] text-[#1266D6] px-2 py-0.5 rounded font-mono shrink-0">
                    #{item.lineNumber}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#64748B] mt-2">
                  <div>
                    <span className="text-[#94A3B8]">{isAr ? 'الكمية:' : 'Qty:'} </span>
                    <span className="text-[#1E293B] font-medium">{item.quantity} {item.unitCode}</span>
                  </div>
                  {item.targetPricePerUnit && (
                    <div>
                      <span className="text-[#94A3B8]">{isAr ? 'السعر المستهدف:' : 'Target:'} </span>
                      <span className="text-[#1E293B] font-medium">{formatCurrency(item.targetPricePerUnit)}</span>
                    </div>
                  )}
                </div>
                {item.specifications && (
                  <p className="text-xs text-[#475569] mt-2 line-clamp-2">{item.specifications}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Supplier: My submitted offer */}
      {canSubmitOffers && !canManageRfqs && myOffer && (
        <Card>
          <CardHeader
            title={isAr ? 'عرضي المقدّم' : 'My Submitted Offer'}
            subtitle={isAr ? 'عرضك الحالي لهذا الطلب' : 'Your current offer for this RFQ'}
          />
          <OfferCard offer={myOffer} />
          {myOffer.status === 'Submitted' && (
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/offers/${myOffer.id}/revise`)}
              >
                {isAr ? 'مراجعة العرض' : 'Revise Offer'}
              </Button>
              <Link to={`/offers/${myOffer.id}/revisions`}>
                <Button variant="ghost" size="sm">
                  {isAr ? 'سجل المراجعات' : 'Revision History'}
                </Button>
              </Link>
            </div>
          )}
        </Card>
      )}

      {/* Buyer: Incoming offers */}
      {isOwnerBuyer && (
        <Card>
          <CardHeader
            title={isAr ? 'العروض الواردة' : 'Incoming Offers'}
            subtitle={isAr ? 'عروض الموردين لهذا الطلب' : "Supplier offers for this RFQ"}
          />
          {offersLoading ? (
            <div className="text-center py-8 text-[#64748B] text-sm">
              {isAr ? 'جاري التحميل...' : 'Loading offers...'}
            </div>
          ) : !offers || offers.length === 0 ? (
            <div className="text-center py-8">
              <Package size={40} className="mx-auto text-[#CBD5E1] mb-3" />
              <p className="text-[#64748B] text-sm">
                {isAr ? 'لا توجد عروض بعد' : 'No offers yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  canAccept={rfq.status === 'Published' || rfq.status === 'Closed'}
                  onAccept={() => setAcceptOfferId(offer.id)}
                  onReject={() => setRejectOfferId(offer.id)}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Confirm Publish Modal */}
      <Modal
        open={confirmAction === 'publish'}
        onClose={() => setConfirmAction(null)}
        title={isAr ? 'نشر طلب السعر' : 'Publish RFQ'}
      >
        <p className="text-[#475569] mb-6">
          {isAr
            ? 'سيصبح طلب السعر مرئياً للموردين المعتمدين. هل أنت متأكد؟'
            : 'This RFQ will become visible to approved suppliers. Are you sure?'}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={isMutating}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="primary" onClick={() => publishMutation.mutate()} loading={publishMutation.isPending}>
            {isAr ? 'نشر' : 'Publish'}
          </Button>
        </div>
      </Modal>

      {/* Confirm Close Modal */}
      <Modal
        open={confirmAction === 'close'}
        onClose={() => setConfirmAction(null)}
        title={isAr ? 'إغلاق طلب السعر' : 'Close RFQ'}
      >
        <p className="text-[#475569] mb-6">
          {isAr
            ? 'سيتم إغلاق الطلب ولن يتمكن الموردون من تقديم عروض جديدة.'
            : 'The RFQ will be closed and suppliers cannot submit new offers.'}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={isMutating}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button variant="secondary" onClick={() => closeMutation.mutate()} loading={closeMutation.isPending}>
            {isAr ? 'إغلاق' : 'Close RFQ'}
          </Button>
        </div>
      </Modal>

      {/* Confirm Cancel Modal */}
      <Modal
        open={confirmAction === 'cancel'}
        onClose={() => setConfirmAction(null)}
        title={isAr ? 'إلغاء طلب السعر' : 'Cancel RFQ'}
      >
        <p className="text-[#475569] mb-6">
          {isAr
            ? 'هذا الإجراء لا يمكن التراجع عنه. سيتم رفض جميع العروض المقدمة.'
            : 'This action cannot be undone. All submitted offers will be rejected.'}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={isMutating}>
            {isAr ? 'تراجع' : 'Go back'}
          </Button>
          <Button variant="danger" onClick={() => cancelMutation.mutate()} loading={cancelMutation.isPending}>
            {isAr ? 'إلغاء الطلب' : 'Cancel RFQ'}
          </Button>
        </div>
      </Modal>

      {/* Accept Offer Modal */}
      <Modal
        open={!!acceptOfferId}
        onClose={() => setAcceptOfferId(null)}
        title={isAr ? 'قبول العرض' : 'Accept Offer'}
      >
        <p className="text-[#475569] mb-6">
          {isAr
            ? 'قبول هذا العرض سينشئ صفقة ملزمة وسيتم رفض جميع العروض الأخرى تلقائياً.'
            : 'Accepting this offer will create a binding deal and all other offers will be automatically rejected.'}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setAcceptOfferId(null)} disabled={acceptOfferMutation.isPending}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={() => acceptOfferId && acceptOfferMutation.mutate(acceptOfferId)}
            loading={acceptOfferMutation.isPending}
          >
            {isAr ? 'قبول وإنشاء الصفقة' : 'Accept & Create Deal'}
          </Button>
        </div>
      </Modal>

      {/* Reject Offer Modal */}
      <Modal
        open={!!rejectOfferId}
        onClose={() => { setRejectOfferId(null); setRejectReason('') }}
        title={isAr ? 'رفض العرض' : 'Reject Offer'}
      >
        <div className="space-y-4 mb-6">
          <p className="text-[#475569]">
            {isAr ? 'يرجى تقديم سبب الرفض (اختياري).' : 'Please provide a reason for rejection (optional).'}
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={isAr ? 'سبب الرفض...' : 'Rejection reason...'}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                       focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10
                       resize-none text-[#1E293B]"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => { setRejectOfferId(null); setRejectReason('') }}
            disabled={rejectOfferMutation.isPending}
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="danger"
            onClick={() => rejectOfferId && rejectOfferMutation.mutate({ offerId: rejectOfferId, reason: rejectReason })}
            loading={rejectOfferMutation.isPending}
          >
            {isAr ? 'رفض العرض' : 'Reject Offer'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
