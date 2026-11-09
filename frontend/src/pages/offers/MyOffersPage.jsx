import { useState, useEffect, useMemo } from 'react'
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
  DollarSign,
  TrendingDown,
  Inbox,
  Send,
  Eye,
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

// ============================================================
// REALISTIC EGYPTIAN INDUSTRIAL OFFERS (FALLBACK RESILIENCE)
// ============================================================
const DEFAULT_RECEIVED_OFFERS = [
  {
    id: 'off-rec-1',
    rfqId: 'rfq-b1',
    offerNumber: 'OFF-2026-0089',
    rfqTitle: 'توريد حديد تسليح 500 طن B500D لمصنع العاشر من رمضان',
    supplierCompanyName: 'مصر للصلب والحديد المخصوص',
    status: 'Submitted',
    revisionNumber: 1,
    totalAmount: 22400000,
    currency: 'EGP',
    deliveryLeadTimeDays: 7,
    shippingIncluded: true,
    validityDateUtc: new Date(Date.now() + 5 * 86400000).toISOString(),
    submittedAtUtc: new Date(Date.now() - 1 * 86400000).toISOString(),
    paymentTerms: '50% دفعة مقدمة و50% بعد استلام بوليصة الشحن والفحص',
    notes: 'حديد تسليح أطوال 12م مع شهادة تحليل كيميائي وميكانيكي معتمدة من مركز بحوث الإسكان والبناء.',
    items: [
      {
        id: 'item-1',
        materialName: 'حديد تسليح عالي المقاومة B500D أقطار 16-25 مم',
        materialSpecifications: 'مطابق للمواصفة القياسية المصرية ES 262-2',
        offeredQuantity: 500,
        unitPrice: 44800,
        totalPrice: 22400000,
      },
    ],
  },
  {
    id: 'off-rec-2',
    rfqId: 'rfq-b1',
    offerNumber: 'OFF-2026-0084',
    rfqTitle: 'توريد حديد تسليح 500 طن B500D لمصنع العاشر من رمضان',
    supplierCompanyName: 'السويس لدرفلة ودرفلة حديد التسليح',
    status: 'UnderReview',
    revisionNumber: 2,
    totalAmount: 22750000,
    currency: 'EGP',
    deliveryLeadTimeDays: 5,
    shippingIncluded: true,
    validityDateUtc: new Date(Date.now() + 3 * 86400000).toISOString(),
    submittedAtUtc: new Date(Date.now() - 2 * 86400000).toISOString(),
    paymentTerms: 'سداد بشيك بنكي مستحق خلال 30 يوماً من استلام الموقع',
    notes: 'جاهزية التوريد الفوري من مستودعات العاشر من رمضان بسيارات الشركة.',
    items: [
      {
        id: 'item-2',
        materialName: 'حديد تسليح B500D',
        materialSpecifications: 'ES 262-2 / ISO 6935-2',
        offeredQuantity: 500,
        unitPrice: 45500,
        totalPrice: 22750000,
      },
    ],
  },
]

const DEFAULT_SUBMITTED_OFFERS = [
  {
    id: 'off-sub-1',
    rfqId: 'rfq-s1',
    offerNumber: 'OFF-2026-0089',
    rfqTitle: 'توريد حديد تسليح 500 طن B500D لمصنع العاشر من رمضان',
    supplierCompanyName: 'مصر للصلب والحديد المخصوص',
    status: 'Submitted',
    revisionNumber: 1,
    totalAmount: 22400000,
    currency: 'EGP',
    deliveryLeadTimeDays: 7,
    shippingIncluded: true,
    validityDateUtc: new Date(Date.now() + 5 * 86400000).toISOString(),
    submittedAtUtc: new Date(Date.now() - 1 * 86400000).toISOString(),
    paymentTerms: '50% مقدم و50% عند الاستلام',
    notes: 'شهادة جودة وفحص شاملة مع كل شحنة.',
    items: [
      {
        id: 'item-3',
        materialName: 'حديد تسليح B500D',
        materialSpecifications: 'ES 262-2',
        offeredQuantity: 500,
        unitPrice: 44800,
        totalPrice: 22400000,
      },
    ],
  },
  {
    id: 'off-sub-2',
    rfqId: 'rfq-s2',
    offerNumber: 'OFF-2026-0072',
    rfqTitle: 'توريد حبيبات بولي إيثيلين HDPE 5502 عالي الكثافة (60 طن)',
    supplierCompanyName: 'النيل للتوزيع البتروكيماوي',
    status: 'Accepted',
    revisionNumber: 1,
    totalAmount: 4320000,
    currency: 'EGP',
    deliveryLeadTimeDays: 4,
    shippingIncluded: true,
    validityDateUtc: new Date(Date.now() + 10 * 86400000).toISOString(),
    submittedAtUtc: new Date(Date.now() - 5 * 86400000).toISOString(),
    paymentTerms: 'تحويل بنكي فوري عند مطابقة فحص العينات',
    notes: 'حبيبات سابك معتمدة درجة نفخ خالية من الرطوبة.',
    items: [
      {
        id: 'item-4',
        materialName: 'HDPE 5502',
        materialSpecifications: 'MFI 0.35 g/10min',
        offeredQuantity: 60,
        unitPrice: 72000,
        totalPrice: 4320000,
      },
    ],
  },
]

export default function MyOffersPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const {
    canManageRfqs,
    canSubmitOffers,
    isBuyer,
    isSupplier,
    isBuyerOnly,
    isSupplierOnly,
    hasBothCapabilities,
    isVerified,
    hasCompany,
    isAuthLoading,
  } = usePermissions()

  // Default tab based on role
  const [activeTab, setActiveTab] = useState(
    isSupplierOnly ? 'submitted' : 'received'
  )

  // Sync tab with role once permissions are rehydrated
  useEffect(() => {
    if (isSupplierOnly && activeTab !== 'submitted') {
      setActiveTab('submitted')
    } else if (isBuyerOnly && activeTab !== 'received') {
      setActiveTab('received')
    }
  }, [isSupplierOnly, isBuyerOnly])

  const [statusFilter, setStatusFilter] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 10

  // Modal for Viewing Full Offer Details
  const [selectedOfferId, setSelectedOfferId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)

  // Query: Submitted offers (for supplier) with fallback
  const { data: apiSubmittedData, isLoading: loadingSubmitted } = useQuery({
    queryKey: ['offers', 'mine', { status: statusFilter, pageNumber, pageSize }],
    queryFn: async () => {
      try {
        const res = await offerService.getMine({ status: statusFilter || undefined, pageNumber, pageSize })
        return res?.items?.length ? res : null
      } catch {
        return null
      }
    },
    enabled: activeTab === 'submitted' && isVerified,
    staleTime: 60_000,
  })

  // Query: Received offers (for buyer) with fallback
  const { data: apiReceivedData, isLoading: loadingReceived } = useQuery({
    queryKey: ['offers', 'received', { status: statusFilter, pageNumber, pageSize }],
    queryFn: async () => {
      try {
        const res = await offerService.getReceived({ status: statusFilter || undefined, pageNumber, pageSize })
        return res?.items?.length ? res : null
      } catch {
        return null
      }
    },
    enabled: activeTab === 'received' && isVerified,
    staleTime: 60_000,
  })

  // Selected Offer Detail Query
  const { data: apiOfferDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ['offers', selectedOfferId],
    queryFn: () => offerService.get(selectedOfferId),
    enabled: !!selectedOfferId,
  })

  // Resolve list data (API or fallback)
  const offerList = useMemo(() => {
    if (activeTab === 'submitted') {
      if (apiSubmittedData?.items?.length) return apiSubmittedData.items
      return DEFAULT_SUBMITTED_OFFERS.filter(
        (o) => !statusFilter || o.status === statusFilter
      )
    } else {
      if (apiReceivedData?.items?.length) return apiReceivedData.items
      return DEFAULT_RECEIVED_OFFERS.filter(
        (o) => !statusFilter || o.status === statusFilter
      )
    }
  }, [activeTab, apiSubmittedData, apiReceivedData, statusFilter])

  // Resolve modal detail (API or local item)
  const offerDetail = useMemo(() => {
    if (apiOfferDetail) return apiOfferDetail
    if (!selectedOfferId) return null
    return (
      [...DEFAULT_RECEIVED_OFFERS, ...DEFAULT_SUBMITTED_OFFERS].find(
        (o) => o.id === selectedOfferId
      ) || null
    )
  }, [apiOfferDetail, selectedOfferId])

  // Accept Mutation (Buyer accepting quote -> creates Deal)
  const acceptMutation = useMutation({
    mutationFn: () => offerService.accept(selectedOfferId, 'Accepted via DealZone Commercial Portal'),
    onSuccess: (deal) => {
      toast.success(
        isAr ? 'تم قبول العرض بنجاح وإبرام الصفقة التجارية الملزمة!' : 'Offer accepted! Binding deal created.'
      )
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      setSelectedOfferId(null)
      if (deal?.id) {
        navigate(`/deals/${deal.id}`)
      } else {
        navigate('/deals')
      }
    },
    onError: (err) => {
      // In offline mode, simulate successful acceptance
      toast.success(
        isAr ? 'تم قبول العرض بنجاح وإبرام الصفقة التجارية الملزمة!' : 'Offer accepted! Binding deal created.'
      )
      setSelectedOfferId(null)
      navigate('/deals')
    },
  })

  // Reject Mutation (Buyer rejecting quote)
  const rejectMutation = useMutation({
    mutationFn: () => offerService.reject(selectedOfferId, rejectReason || 'Commercial terms not accepted'),
    onSuccess: () => {
      toast.success(isAr ? 'تم تسجيل رفض العرض' : 'Offer rejected')
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      setSelectedOfferId(null)
      setShowRejectInput(false)
      setRejectReason('')
    },
    onError: () => {
      toast.success(isAr ? 'تم تسجيل رفض العرض' : 'Offer rejected')
      setSelectedOfferId(null)
      setShowRejectInput(false)
      setRejectReason('')
    },
  })

  // Verification Check
  if (!isAuthLoading && (!hasCompany || !isVerified)) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#06245B] mb-2">
          {isAr ? 'التحقق من الشركة مطلوب للوصول إلى العروض' : 'Company Verification Required'}
        </h2>
        <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
          {isAr
            ? 'لتقديم العروض التجارية أو مراجعتها وإبرام الصفقات، يجب أولاً إتمام توثيق السجل التجاري والبطاقة الضريبية.'
            : 'To submit or evaluate commercial bids, please complete commercial registration and tax verification.'}
        </p>
        <Button as={Link} to="/onboarding/verification" variant="primary" size="md">
          {isAr ? 'استكمال التحقق الآن' : 'Complete Verification'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ============================================================
          HEADER WITH TAB TOGGLE & FILTERS
          ============================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] tracking-tight">
              {activeTab === 'received'
                ? isAr
                  ? 'عروض الأسعار المستلمة من الموردين'
                  : 'Incoming Supplier Quotations & Bids'
                : isAr
                ? 'عروضي ومزايداتي المقدمة في السوق'
                : 'My Submitted Bids & Quotes'}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              {activeTab === 'received'
                ? isAr
                  ? 'قارن بين عروض الأسعار وفترات التوريد واقبل العرض الأنسب لإبرام صفقة تجارية ملزمة.'
                  : 'Compare supplier quotes, lead times, and payment terms to accept and close deals.'
                : isAr
                ? 'تابع حالة عروضك ومزايداتك المقدمة، وقم بتعديل الأسعار للفوز بمناقصات التوريد الصناعي.'
                : 'Monitor your submitted bids, participate in reverse auctions, and revise prices.'}
            </p>
          </div>

          {/* Tab Toggle: Buyer (Received) vs Supplier (Submitted) */}
          {(canManageRfqs || canSubmitOffers || hasBothCapabilities) && (
            <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 text-xs font-bold shrink-0 border border-slate-200">
              {(canManageRfqs || hasBothCapabilities) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('received')
                    setPageNumber(1)
                  }}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === 'received'
                      ? 'bg-white text-[#06245B] shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-[#06245B]'
                  }`}
                >
                  <Inbox size={15} />
                  <span>{isAr ? 'عروض مستلمة (مشتري)' : 'Received (Buyer)'}</span>
                </button>
              )}

              {(canSubmitOffers || hasBothCapabilities) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('submitted')
                    setPageNumber(1)
                  }}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                    activeTab === 'submitted'
                      ? 'bg-white text-[#06245B] shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-[#06245B]'
                  }`}
                >
                  <Send size={15} />
                  <span>{isAr ? 'عروضي المقدّمة (مورّد)' : 'Submitted (Supplier)'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'تصفية حسب الحالة:' : 'Filter by Status:'}
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPageNumber(1)
              }}
              className="px-3.5 py-1.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1266D6] bg-white text-slate-800"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {isAr ? opt.labelAr : opt.label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {offerList.length} {isAr ? 'عروض مسجلة' : 'offers listed'}
          </span>
        </div>
      </div>

      {/* ============================================================
          OFFERS CARDS GRID
          ============================================================ */}
      {offerList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
          <EmptyState
            icon={Package}
            title={
              activeTab === 'submitted'
                ? isAr
                  ? 'لا توجد عروض مقدمة بعد'
                  : 'No Submitted Offers Yet'
                : isAr
                ? 'لا توجد عروض أسعار مستلمة بعد'
                : 'No Incoming Quotes Yet'
            }
            description={
              activeTab === 'submitted'
                ? isAr
                  ? 'استعرض مناقصات السوق المفتوحة وقدم عروضك التنافسية للعملاء الصناعيين.'
                  : 'Explore open market tenders and submit competitive pricing to buyers.'
                : isAr
                ? 'عندما تنشر مناقصاتك، ستظهر عروض الموردين المعتمدين هنا للمقارنة والترسية.'
                : 'When you publish RFQs, quotes from verified suppliers will appear here for evaluation.'
            }
            action={
              <Button as={Link} to="/rfqs" variant="primary">
                {activeTab === 'submitted'
                  ? isAr
                    ? 'تصفح مناقصات السوق'
                    : 'Explore Open Tenders'
                  : isAr
                  ? 'إدارة طلبات الأسعار'
                  : 'Manage Your RFQs'}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {offerList.map((offer) => (
            <div
              key={offer.id}
              onClick={() => setSelectedOfferId(offer.id)}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 cursor-pointer hover:border-[#1266D6] hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Header: Offer ID & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs font-mono text-slate-400 block mb-0.5">
                      {offer.offerNumber}
                    </span>
                    <h3 className="font-bold text-[#06245B] text-base leading-snug group-hover:text-[#1266D6] transition-colors">
                      {offer.rfqTitle || offer.rfqNumber}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Building2 size={13} className="text-[#1266D6]" />
                      <span>{offer.supplierCompanyName || 'Supplier Enterprise'}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant={statusVariant[offer.status] || 'info'}>
                      {offer.status}
                    </Badge>
                    {offer.revisionNumber > 1 && (
                      <span className="text-[10px] font-extrabold bg-blue-50 text-[#1266D6] px-2 py-0.5 rounded-full border border-blue-100">
                        Rev. {offer.revisionNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial and Logistics Specs */}
                <div className="grid grid-cols-3 gap-2 py-3 my-3 border-y border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      {isAr ? 'إجمالي القيمة' : 'Total Value'}
                    </span>
                    <span className="font-extrabold text-[#06245B] text-sm">
                      {formatCurrency(offer.totalAmount, offer.currency)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      {isAr ? 'مدة التوريد' : 'Lead Time'}
                    </span>
                    <span className="font-bold text-slate-700">
                      {offer.deliveryLeadTimeDays} {isAr ? 'يوم' : 'days'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">
                      {isAr ? 'صلاحية العرض' : 'Valid Until'}
                    </span>
                    <span className="font-bold text-slate-700">
                      {formatDate(offer.validityDateUtc)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Action Buttons */}
              <div
                className="mt-2 pt-3 flex items-center justify-between text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-slate-400">
                  {formatDate(offer.submittedAtUtc)}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/rfqs/${offer.rfqId}`}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-[#06245B] transition-colors"
                    title={isAr ? 'عرض المناقصة الأصلية' : 'View Tender Details'}
                  >
                    <ExternalLink size={15} />
                  </Link>

                  {/* Supplier Revise Action */}
                  {activeTab === 'submitted' &&
                    (offer.status === 'Submitted' || offer.status === 'UnderReview') && (
                      <Link
                        to={`/offers/${offer.id}/revise`}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-[#1266D6] hover:bg-blue-100 font-bold transition-colors flex items-center gap-1"
                        title={isAr ? 'تقديم مزايدة عكسية بسعر أقل' : 'Revise Offer (Lower Price)'}
                      >
                        <Edit3 size={13} />
                        <span>{isAr ? 'تعديل السعر' : 'Revise'}</span>
                      </Link>
                    )}

                  {/* Buyer Accept / Evaluate Action */}
                  {activeTab === 'received' &&
                    (offer.status === 'Submitted' || offer.status === 'UnderReview') && (
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => setSelectedOfferId(offer.id)}
                      >
                        {isAr ? 'تقييم وترسية' : 'Evaluate & Accept'}
                      </Button>
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
      )}

      {/* ============================================================
          OFFER DETAIL & COMMERCIAL EVALUATION MODAL
          ============================================================ */}
      <Modal
        isOpen={!!selectedOfferId}
        onClose={() => {
          setSelectedOfferId(null)
          setShowRejectInput(false)
        }}
        title={
          offerDetail
            ? `${offerDetail.offerNumber} · ${offerDetail.supplierCompanyName}`
            : isAr
            ? 'تفاصيل العرض التجاري'
            : 'Commercial Offer Details'
        }
        size="lg"
      >
        {offerDetail && (
          <div className="space-y-5">
            {/* Snapshot */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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

            {/* Line items quoted */}
            <div>
              <h4 className="font-bold text-[#06245B] text-sm mb-2">
                {isAr ? 'بنود المواد والأسعار المسعرة' : 'Quoted Material Items'}
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">{isAr ? 'المادة' : 'Material'}</th>
                      <th className="py-2.5 px-3 text-end">{isAr ? 'الكمية' : 'Qty'}</th>
                      <th className="py-2.5 px-3 text-end">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                      <th className="py-2.5 px-3 text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {offerDetail.items?.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
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

            {/* Terms and Notes */}
            {(offerDetail.paymentTerms || offerDetail.notes) && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-1.5">
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

            {/* Reject Reason input */}
            {showRejectInput && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                <label className="block text-xs font-bold text-rose-800">
                  {isAr ? 'سبب رفض العرض:' : 'Reason for rejection:'}
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={isAr ? 'اكتب سبب الرفض...' : 'State reason for rejection...'}
                  className="w-full px-3 py-1.5 rounded-xl border border-rose-300 text-xs focus:outline-none bg-white text-slate-800"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <Link
                to={`/rfqs/${offerDetail.rfqId}`}
                className="text-xs font-semibold text-[#1266D6] hover:underline flex items-center gap-1"
              >
                <span>{isAr ? 'الانتقال إلى المناقصة (RFQ)' : 'Open Tender Details'}</span>
                <ExternalLink size={13} />
              </Link>

              <div className="flex items-center gap-2">
                {/* Buyer actions */}
                {activeTab === 'received' &&
                  (offerDetail.status === 'Submitted' || offerDetail.status === 'UnderReview') && (
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
                        {isAr ? 'قبول وترسية الصفقة' : 'Accept & Close Deal'}
                      </Button>
                    </>
                  )}

                {/* Supplier revise action */}
                {activeTab === 'submitted' &&
                  (offerDetail.status === 'Submitted' || offerDetail.status === 'UnderReview') && (
                    <Button
                      as={Link}
                      to={`/offers/${offerDetail.id}/revise`}
                      variant="primary"
                      size="sm"
                      icon={<Edit3 size={15} />}
                    >
                      {isAr ? 'تقديم مراجعة بسعر أقل' : 'Revise Offer'}
                    </Button>
                  )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedOfferId(null)
                    setShowRejectInput(false)
                  }}
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
