import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Package,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  History,
  Edit3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  Truck,
  FileText,
} from 'lucide-react'
import { offerService } from '../../shared/api/services/offerService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../../hooks/useToast'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency, formatDate } from '../../utils/format'

const statusVariant = {
  Submitted: 'info',
  UnderReview: 'warning',
  Accepted: 'success',
  Rejected: 'error',
  Superseded: 'navy',
  Withdrawn: 'navy',
  Expired: 'error',
}

const statusOptions = [
  { value: '', label: 'All Statuses', labelAr: 'جميع الحالات' },
  { value: 'Submitted', label: 'Submitted', labelAr: 'مقدّم' },
  { value: 'UnderReview', label: 'Under Review', labelAr: 'قيد المراجعة' },
  { value: 'Accepted', label: 'Accepted', labelAr: 'مقبول' },
  { value: 'Rejected', label: 'Rejected', labelAr: 'مرفوض' },
  { value: 'Superseded', label: 'Superseded', labelAr: 'تمت مراجعته' },
]

export default function MyOffersPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { canManageRfqs, canSubmitOffers, isVerified, hasCompany } = usePermissions()

  // Default tab: if user can manage RFQs and not submit offers -> received; otherwise submitted
  const [activeTab, setActiveTab] = useState(
    canSubmitOffers ? 'submitted' : 'received'
  )
  const [statusFilter, setStatusFilter] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 10

  // Modal for Viewing Full Offer Details
  const [selectedOfferId, setSelectedOfferId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  // Query: Submitted offers (for supplier)
  const {
    data: submittedData,
    isLoading: loadingSubmitted,
    error: errorSubmitted,
  } = useQuery({
    queryKey: ['offers', 'mine', { status: statusFilter, pageNumber, pageSize }],
    queryFn: () => offerService.getMine({ status: statusFilter || undefined, pageNumber, pageSize }),
    enabled: activeTab === 'submitted' && isVerified,
  })

  // Query: Received offers (for buyer)
  const {
    data: receivedData,
    isLoading: loadingReceived,
    error: errorReceived,
  } = useQuery({
    queryKey: ['offers', 'received', { status: statusFilter, pageNumber, pageSize }],
    queryFn: () => offerService.getReceived({ status: statusFilter || undefined, pageNumber, pageSize }),
    enabled: activeTab === 'received' && isVerified,
  })

  // Selected Offer Detail Query
  const { data: offerDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['offers', selectedOfferId],
    queryFn: () => offerService.get(selectedOfferId),
    enabled: !!selectedOfferId,
  })

  // Accept Mutation (Buyer)
  const acceptMutation = useMutation({
    mutationFn: () => offerService.accept(selectedOfferId, 'Accepted via DealZone Portal'),
    onSuccess: (deal) => {
      toast.success(isAr ? 'تم قبول العرض وإبرام الصفقة بنجاح!' : 'Offer accepted! Binding deal created.')
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      setSelectedOfferId(null)
      if (deal?.id) {
        navigate(`/deals/${deal.id}`)
      }
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || (isAr ? 'فشل قبول العرض' : 'Failed to accept offer'))
    },
  })

  // Reject Mutation (Buyer)
  const rejectMutation = useMutation({
    mutationFn: () => offerService.reject(selectedOfferId, rejectReason || 'Commercial terms not accepted'),
    onSuccess: () => {
      toast.success(isAr ? 'تم رفض العرض' : 'Offer rejected')
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      setSelectedOfferId(null)
      setShowRejectInput(false)
      setRejectReason('')
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || (isAr ? 'فشل رفض العرض' : 'Failed to reject offer'))
    },
  })

  // Verification Check
  if (!hasCompany || !isVerified) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#06245B] mb-2">
          {isAr ? 'التحقق من الشركة مطلوب للوصول إلى العروض' : 'Company Verification Required'}
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          {isAr
            ? 'لتقديم العروض أو استقبالها وإبرام الصفقات، يجب أولاً إتمام توثيق السجل التجاري والبطاقة الضريبية.'
            : 'To submit or review commercial bids, please complete commercial registration and tax verification.'}
        </p>
        <Button as={Link} to="/onboarding/verification" variant="primary" size="md">
          {isAr ? 'استكمال التحقق الآن' : 'Complete Verification'}
        </Button>
      </div>
    )
  }

  const isLoading = activeTab === 'submitted' ? loadingSubmitted : loadingReceived
  const error = activeTab === 'submitted' ? errorSubmitted : errorReceived
  const data = activeTab === 'submitted' ? submittedData : receivedData

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#06245B]">
            {isAr ? 'عروض الأسعار التجارية' : 'Commercial Offers & Bids'}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {isAr
              ? 'متابعة وإدارة العروض المقدمة من الموردين والعروض المستلمة على طلبات الأسعار'
              : 'Review incoming bids on your RFQs and manage offers submitted to the marketplace'}
          </p>
        </div>

        {/* Tab Toggle: Received vs Submitted */}
        {(canManageRfqs || canSubmitOffers) && (
          <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 text-xs font-bold shrink-0">
            {canSubmitOffers && (
              <button
                onClick={() => { setActiveTab('submitted'); setPageNumber(1) }}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'submitted'
                    ? 'bg-white text-[#06245B] shadow-sm'
                    : 'text-slate-600 hover:text-[#06245B]'
                }`}
              >
                {isAr ? 'عروضي المقدّمة (كمورّد)' : 'Submitted Bids (Supplier)'}
              </button>
            )}
            {canManageRfqs && (
              <button
                onClick={() => { setActiveTab('received'); setPageNumber(1) }}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'received'
                    ? 'bg-white text-[#06245B] shadow-sm'
                    : 'text-slate-600 hover:text-[#06245B]'
                }`}
              >
                {isAr ? 'العروض المستلمة (كمشتري)' : 'Received Bids (Buyer)'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">
            {isAr ? 'تصفية حسب الحالة:' : 'Filter by Status:'}
          </span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPageNumber(1) }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#1266D6] bg-white text-slate-800"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {isAr ? opt.labelAr : opt.label}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          {data ? `${data.totalCount} ${isAr ? 'عروض إجمالاً' : 'total offers'}` : ''}
        </span>
      </div>

      {/* Loading & Error States */}
      {isLoading && <PageSpinner />}

      {error && !isLoading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700">
          <AlertCircle size={32} className="mx-auto mb-2 text-rose-500" />
          <p className="text-sm font-semibold">
            {isAr ? 'تعذر تحميل العروض في الوقت الحالي' : 'Failed to load offers'}
          </p>
          <p className="text-xs text-rose-500 mt-1">
            {error?.problem?.detail || error?.message}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.items?.length === 0 && (
        <EmptyState
          icon={Package}
          title={
            activeTab === 'submitted'
              ? isAr ? 'لا توجد عروض مقدمة بعد' : 'No Submitted Offers'
              : isAr ? 'لا توجد عروض مستلمة بعد' : 'No Received Offers'
          }
          description={
            activeTab === 'submitted'
              ? isAr ? 'تصفح طلبات الأسعار المنشورة وقدم عروضك التنافسية.' : 'Explore published RFQs and submit your industrial pricing.'
              : isAr ? 'عند نشر طلبات الأسعار، ستظهر هنا عروض الموردين المعتمدين.' : 'When you publish RFQs, vetted supplier bids will appear here.'
          }
          action={
            <Link to="/rfqs">
              <Button variant="primary">
                {activeTab === 'submitted'
                  ? isAr ? 'تصفح طلبات الأسعار' : 'Browse Open RFQs'
                  : isAr ? 'إدارة طلبات الأسعار' : 'Manage Your RFQs'}
              </Button>
            </Link>
          }
        />
      )}

      {/* Offers Cards Grid */}
      {!isLoading && !error && data?.items?.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.items.map((offer) => (
              <div
                key={offer.id}
                onClick={() => setSelectedOfferId(offer.id)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 cursor-pointer hover:border-[#1266D6] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-mono text-slate-400 block mb-0.5">
                        {offer.offerNumber}
                      </span>
                      <h3 className="font-bold text-[#06245B] text-base leading-snug">
                        {offer.rfqTitle || offer.rfqNumber}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <Building2 size={13} className="text-[#1266D6]" />
                        <span>{offer.supplierCompanyName || 'Supplier'}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant={statusVariant[offer.status]}>
                        {offer.status.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                      {offer.revisionNumber > 1 && (
                        <span className="text-[11px] font-bold bg-blue-50 text-[#1266D6] px-2 py-0.5 rounded-full border border-blue-100">
                          Rev. {offer.revisionNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial & Logistics Snapshot */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-3 border-y border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">{isAr ? 'القيمة' : 'Total Value'}</span>
                      <span className="font-extrabold text-[#06245B] text-sm">
                        {formatCurrency(offer.totalAmount, offer.currency)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">{isAr ? 'مدة التوريد' : 'Lead Time'}</span>
                      <span className="font-medium text-slate-700">
                        {offer.deliveryLeadTimeDays} {isAr ? 'يوم' : 'days'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">{isAr ? 'صلاحية العرض' : 'Valid Until'}</span>
                      <span className="font-medium text-slate-700">
                        {formatDate(offer.validityDateUtc)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {formatDate(offer.submittedAtUtc)}
                  </span>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Link
                      to={`/rfqs/${offer.rfqId}`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#06245B] transition-colors"
                      title={isAr ? 'عرض طلب السعر' : 'View RFQ'}
                    >
                      <ExternalLink size={15} />
                    </Link>

                    <Link
                      to={`/offers/${offer.id}/revisions`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#06245B] transition-colors"
                      title={isAr ? 'سجل المراجعات' : 'Revision History'}
                    >
                      <History size={15} />
                    </Link>

                    {activeTab === 'submitted' && (offer.status === 'Submitted' || offer.status === 'UnderReview') && (
                      <Link
                        to={`/offers/${offer.id}/revise`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-[#1266D6] hover:text-[#06245B] transition-colors"
                        title={isAr ? 'تعديل وتقديم مراجعة' : 'Revise Offer'}
                      >
                        <Edit3 size={15} />
                      </Link>
                    )}

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setSelectedOfferId(offer.id)}
                    >
                      {isAr ? 'التفاصيل' : 'Details'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={16} />}
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => p - 1)}
              >
                {isAr ? 'السابق' : 'Previous'}
              </Button>
              <span className="text-xs text-slate-500">
                {isAr ? `${pageNumber} من ${data.totalPages}` : `${pageNumber} / ${data.totalPages}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                iconEnd={<ChevronRight size={16} />}
                disabled={pageNumber >= data.totalPages}
                onClick={() => setPageNumber((p) => p + 1)}
              >
                {isAr ? 'التالي' : 'Next'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Offer Detail Modal */}
      <Modal
        isOpen={!!selectedOfferId}
        onClose={() => { setSelectedOfferId(null); setShowRejectInput(false) }}
        title={
          offerDetail
            ? `${offerDetail.offerNumber} · ${offerDetail.supplierCompanyName}`
            : (isAr ? 'تفاصيل العرض التجاري' : 'Offer Details')
        }
        size="lg"
      >
        {loadingDetail && <PageSpinner />}

        {offerDetail && (
          <div className="space-y-5">
            {/* Header Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">{isAr ? 'إجمالي القيمة' : 'Total Price'}</span>
                <span className="font-extrabold text-[#06245B] text-base">
                  {formatCurrency(offerDetail.totalAmount, offerDetail.currency)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">{isAr ? 'مدة التوريد' : 'Lead Time'}</span>
                <span className="font-bold text-slate-800">
                  {offerDetail.deliveryLeadTimeDays} {isAr ? 'يوم' : 'days'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">{isAr ? 'الشحن والتوصيل' : 'Shipping'}</span>
                <span className="font-bold text-slate-800">
                  {offerDetail.shippingIncluded ? (isAr ? 'مشمول' : 'Included') : (isAr ? 'غير مشمول' : 'Excluded')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">{isAr ? 'صالح حتى' : 'Valid Until'}</span>
                <span className="font-bold text-slate-800">
                  {formatDate(offerDetail.validityDateUtc)}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="font-bold text-[#06245B] text-sm mb-2">
                {isAr ? 'بنود المواد والكميات المسعرة' : 'Quoted Material Items'}
              </h4>
              <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">{isAr ? 'المادة' : 'Material'}</th>
                      <th className="py-2.5 px-3 text-end">{isAr ? 'الكمية' : 'Qty'}</th>
                      <th className="py-2.5 px-3 text-end">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                      <th className="py-2.5 px-3 text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {offerDetail.items?.map((item) => (
                      <tr key={item.id || item.rfqItemId} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-[#06245B] block">{item.materialName}</span>
                          {item.materialSpecifications && (
                            <span className="text-slate-400 text-[11px] block">{item.materialSpecifications}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-end font-mono">{item.offeredQuantity}</td>
                        <td className="py-2.5 px-3 text-end font-mono">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-end font-mono font-bold text-[#06245B]">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commercial Notes & Payment Terms */}
            {(offerDetail.paymentTerms || offerDetail.notes) && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-1.5">
                {offerDetail.paymentTerms && (
                  <p>
                    <strong className="text-slate-700">{isAr ? 'شروط السداد: ' : 'Payment Terms: '}</strong>
                    <span className="text-slate-600">{offerDetail.paymentTerms}</span>
                  </p>
                )}
                {offerDetail.notes && (
                  <p>
                    <strong className="text-slate-700">{isAr ? 'ملاحظات العرض: ' : 'Notes: '}</strong>
                    <span className="text-slate-600">{offerDetail.notes}</span>
                  </p>
                )}
              </div>
            )}

            {/* Reject Reason Input (Buyer only) */}
            {showRejectInput && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                <label className="block text-xs font-bold text-rose-800">
                  {isAr ? 'سبب رفض العرض:' : 'Reason for rejection:'}
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={isAr ? 'اكتب سبب الرفض...' : 'State reason for rejection...'}
                  className="w-full px-3 py-1.5 rounded-lg border border-rose-300 text-xs focus:outline-none bg-white text-slate-800"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <Link
                to={`/rfqs/${offerDetail.rfqId}`}
                className="text-xs font-semibold text-[#1266D6] hover:underline flex items-center gap-1"
              >
                <span>{isAr ? 'الانتقال إلى طلب السعر (RFQ)' : 'Open Related RFQ'}</span>
                <ExternalLink size={13} />
              </Link>

              <div className="flex items-center gap-2">
                {/* Actions for Buyer on Submitted/UnderReview offers */}
                {activeTab === 'received' && (offerDetail.status === 'Submitted' || offerDetail.status === 'UnderReview') && (
                  <>
                    {!showRejectInput ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!text-rose-600 hover:!bg-rose-50"
                        onClick={() => setShowRejectInput(true)}
                      >
                        {isAr ? 'رفض العرض' : 'Reject'}
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => rejectMutation.mutate()}
                        loading={rejectMutation.isPending}
                      >
                        {isAr ? 'تأكيد الرفض' : 'Confirm Rejection'}
                      </Button>
                    )}

                    <Button
                      variant="primary"
                      size="sm"
                      icon={<CheckCircle size={15} />}
                      onClick={() => acceptMutation.mutate()}
                      loading={acceptMutation.isPending}
                    >
                      {isAr ? 'قبول العرض وتوقيع الصفقة' : 'Accept & Close Deal'}
                    </Button>
                  </>
                )}

                {/* Actions for Supplier */}
                {activeTab === 'submitted' && (offerDetail.status === 'Submitted' || offerDetail.status === 'UnderReview') && (
                  <Button
                    as={Link}
                    to={`/offers/${offerDetail.id}/revise`}
                    variant="primary"
                    size="sm"
                    icon={<Edit3 size={15} />}
                  >
                    {isAr ? 'تعديل وتقديم مراجعة' : 'Revise Offer'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedOfferId(null); setShowRejectInput(false) }}
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
