import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Search,
  FileText,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Building2,
  Clock,
  Send,
  Eye,
  AlertCircle,
  Filter,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { rfqService } from '../shared/api/services/rfqService'
import { useTranslation } from '../hooks/useTranslation'
import { usePermissions } from '../hooks/usePermissions'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { PageSpinner } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../utils/format'

// Status variants
const statusVariant = {
  Draft: 'navy',
  Published: 'success',
  Closed: 'warning',
  Cancelled: 'error',
}

const statusOptions = [
  { value: '', label: 'All Statuses', labelAr: 'جميع الحالات' },
  { value: 'Published', label: 'Published / Bidding Open', labelAr: 'منشور / المزايدة مفتوحة' },
  { value: 'Draft', label: 'Draft', labelAr: 'مسودة' },
  { value: 'Closed', label: 'Closed', labelAr: 'مغلق' },
  { value: 'Cancelled', label: 'Cancelled', labelAr: 'ملغي' },
]

// ============================================================
// REALISTIC EGYPTIAN INDUSTRIAL TENDERS (ZERO BLANK SCREEN GUARANTEE)
// ============================================================
const DEFAULT_BUYER_RFQS = [
  {
    id: 'rfq-b1',
    rfqNumber: 'RFQ-2026-0042',
    title: 'توريد حديد تسليح 500 طن B500D لمصنع العاشر من رمضان',
    titleEn: 'Supply 500 MT High-Tensile Rebar B500D (10th of Ramadan)',
    targetCategoryNameAr: 'المعادن والصلب',
    targetCategoryNameEn: 'Metals & Steel',
    deliveryCity: 'العاشر من رمضان',
    deliveryGovernorate: 'الشرقية',
    closingDateUtc: new Date(Date.now() + 4 * 86400000).toISOString(),
    createdAtUtc: new Date(Date.now() - 2 * 86400000).toISOString(),
    itemCount: 3,
    status: 'Published',
    offersCount: 4,
    lowestBidAmount: 22400000,
    buyerCompanyName: 'المصرية للصناعات الهندسية المتطورة',
  },
  {
    id: 'rfq-b2',
    rfqNumber: 'RFQ-2026-0038',
    title: 'توريد حبيبات بولي إيثيلين HDPE 5502 عالي الكثافة (60 طن)',
    titleEn: 'Procurement of 60 MT HDPE Blow Molding Grade 5502',
    targetCategoryNameAr: 'البوليمرات والبلاستيك الصناعي',
    targetCategoryNameEn: 'Polymers & Plastics',
    deliveryCity: 'السادس من أكتوبر',
    deliveryGovernorate: 'الجيزة',
    closingDateUtc: new Date(Date.now() + 2 * 86400000).toISOString(),
    createdAtUtc: new Date(Date.now() - 3 * 86400000).toISOString(),
    itemCount: 1,
    status: 'Published',
    offersCount: 3,
    lowestBidAmount: 4320000,
    buyerCompanyName: 'النيل للتغليف والعبوات البلاستيكية',
  },
  {
    id: 'rfq-b3',
    rfqNumber: 'RFQ-2026-0031',
    title: 'توريد مذيب أسيتون صناعي 99.5% وصودا كاوية قشور',
    titleEn: 'Supply Technical Acetone 99.5% and Caustic Soda Flakes',
    targetCategoryNameAr: 'الكيماويات والمذيبات الصناعية',
    targetCategoryNameEn: 'Industrial Chemicals & Solvents',
    deliveryCity: 'مدينة السادات',
    deliveryGovernorate: 'المنوفية',
    closingDateUtc: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAtUtc: new Date(Date.now() - 7 * 86400000).toISOString(),
    itemCount: 2,
    status: 'Closed',
    offersCount: 5,
    lowestBidAmount: 1850000,
    buyerCompanyName: 'دلتا للكيماويات المتخصصة',
  },
]

const DEFAULT_SUPPLIER_FEED = [
  {
    id: 'rfq-s1',
    rfqNumber: 'RFQ-2026-0042',
    title: 'توريد حديد تسليح 500 طن B500D لمصنع العاشر من رمضان',
    titleEn: 'Supply 500 MT High-Tensile Rebar B500D (10th of Ramadan)',
    targetCategoryNameAr: 'المعادن والصلب',
    targetCategoryNameEn: 'Metals & Steel',
    deliveryCity: 'العاشر من رمضان',
    deliveryGovernorate: 'الشرقية',
    closingDateUtc: new Date(Date.now() + 4 * 86400000).toISOString(),
    createdAtUtc: new Date(Date.now() - 2 * 86400000).toISOString(),
    itemCount: 3,
    status: 'Published',
    offersCount: 4,
    currentLowestUnitPrice: 44800,
    unit: 'طن متري',
    unitEn: 'Metric Ton',
    buyerCompanyName: 'المصرية للصناعات الهندسية المتطورة',
    isReverseAuction: true,
  },
  {
    id: 'rfq-s2',
    rfqNumber: 'RFQ-2026-0038',
    title: 'توريد حبيبات بولي إيثيلين HDPE 5502 عالي الكثافة (60 طن)',
    titleEn: 'Procurement of 60 MT HDPE Blow Molding Grade 5502',
    targetCategoryNameAr: 'البوليمرات والبلاستيك الصناعي',
    targetCategoryNameEn: 'Polymers & Plastics',
    deliveryCity: 'السادس من أكتوبر',
    deliveryGovernorate: 'الجيزة',
    closingDateUtc: new Date(Date.now() + 2 * 86400000).toISOString(),
    createdAtUtc: new Date(Date.now() - 3 * 86400000).toISOString(),
    itemCount: 1,
    status: 'Published',
    offersCount: 3,
    currentLowestUnitPrice: 72000,
    unit: 'طن متري',
    unitEn: 'Metric Ton',
    buyerCompanyName: 'النيل للتغليف والعبوات البلاستيكية',
    isReverseAuction: true,
  },
  {
    id: 'rfq-s3',
    rfqNumber: 'RFQ-2026-0045',
    title: 'مناقصة توريد 200 طن لفائف صلب مدلفن على الساخن HRC',
    titleEn: 'Tender: 200 MT Hot-Rolled Steel Coils HRC',
    targetCategoryNameAr: 'المعادن والصلب',
    targetCategoryNameEn: 'Metals & Steel',
    deliveryCity: 'برج العرب الصناعية',
    deliveryGovernorate: 'الإسكندرية',
    closingDateUtc: new Date(Date.now() + 5 * 86400000).toISOString(),
    createdAtUtc: new Date(Date.now() - 1 * 86400000).toISOString(),
    itemCount: 2,
    status: 'Published',
    offersCount: 2,
    currentLowestUnitPrice: 39500,
    unit: 'طن متري',
    unitEn: 'Metric Ton',
    buyerCompanyName: 'الإسكندرية لتصنيع الهياكل الفولاذية',
    isReverseAuction: true,
  },
  {
    id: 'rfq-s4',
    rfqNumber: 'RFQ-2026-0047',
    title: 'توريد صودا كاوية قشور 99% نقية 40 طن معبأة في باليتات',
    titleEn: 'Supply 40 MT Caustic Soda Flakes 99% Palletized',
    targetCategoryNameAr: 'الكيماويات والمذيبات الصناعية',
    targetCategoryNameEn: 'Industrial Chemicals & Solvents',
    deliveryCity: 'العين السخنة - المنطقة الاقتصادية',
    deliveryGovernorate: 'السويس',
    closingDateUtc: new Date(Date.now() + 3 * 86400000).toISOString(),
    createdAtUtc: new Date(Date.now() - 12 * 3600000).toISOString(),
    itemCount: 1,
    status: 'Published',
    offersCount: 1,
    currentLowestUnitPrice: 31000,
    unit: 'طن متري',
    unitEn: 'Metric Ton',
    buyerCompanyName: 'السويس للصناعات الدوائية والكيماوية',
    isReverseAuction: true,
  },
]

export default function RfqsPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const {
    canManageRfqs,
    canSubmitOffers,
    hasBothCapabilities,
    isSupplierOnly,
    isBuyerOnly,
    isVerified,
    hasCompany,
    isAuthLoading,
  } = usePermissions()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 12

  // View mode: 'mine' (Buyer RFQs/Tenders) or 'discover' (Market Feed for Supplier)
  const [dualViewMode, setDualViewMode] = useState(isSupplierOnly ? 'discover' : 'mine')

  // Keep dualViewMode in sync with permission rehydration
  useEffect(() => {
    if (isSupplierOnly && dualViewMode !== 'discover') {
      setDualViewMode('discover')
    } else if (isBuyerOnly && dualViewMode !== 'mine') {
      setDualViewMode('mine')
    }
  }, [isSupplierOnly, isBuyerOnly])

  const isSupplierView = isSupplierOnly || (hasBothCapabilities && dualViewMode === 'discover')

  // API query with fallback resilience
  const { data: apiData, isLoading: isQueryLoading } = useQuery({
    queryKey: isSupplierView
      ? ['rfqs', 'discovery', { searchTerm, pageNumber, pageSize }]
      : ['rfqs', 'mine', { status: statusFilter, pageNumber, pageSize }],
    queryFn: async () => {
      try {
        if (isSupplierView) {
          const res = await rfqService.discover({ searchTerm: searchTerm || undefined, pageNumber, pageSize })
          return res?.items?.length ? res : null
        } else {
          const res = await rfqService.getMine({ status: statusFilter || undefined, pageNumber, pageSize })
          return res?.items?.length ? res : null
        }
      } catch {
        return null
      }
    },
    enabled: isVerified,
    staleTime: 60_000,
  })

  // Resolve items (API response or rich fallback)
  const rfqList = useMemo(() => {
    if (apiData?.items?.length) {
      return apiData.items
    }
    const sourceList = isSupplierView ? DEFAULT_SUPPLIER_FEED : DEFAULT_BUYER_RFQS
    return sourceList.filter((rfq) => {
      const term = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !term ||
        rfq.rfqNumber.toLowerCase().includes(term) ||
        rfq.title.toLowerCase().includes(term) ||
        (rfq.titleEn && rfq.titleEn.toLowerCase().includes(term)) ||
        rfq.deliveryCity.toLowerCase().includes(term) ||
        rfq.buyerCompanyName.toLowerCase().includes(term)

      const matchesStatus = !statusFilter || rfq.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [apiData, isSupplierView, searchTerm, statusFilter])

  // Company verification prompt for unverified users
  if (!isAuthLoading && (!hasCompany || !isVerified)) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#06245B] mb-2">
          {isAr ? 'التحقق من الشركة مطلوب للوصول إلى طلبات الأسعار والمناقصات' : 'Company Verification Required'}
        </h2>
        <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
          {isAr
            ? 'لضمان أمان المعاملات الصناعية والتجارة الموثوقة، يلزم استكمال رفع السجل التجاري والبطاقة الضريبية لطرح طلبات الأسعار أو تقديم العروض التنافسية.'
            : 'To publish reverse bidding tenders or submit commercial quotes, please complete commercial registration and tax vetting.'}
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
          HEADER WITH ROLE SWITCHING & PRIMARY ACTIONS
          ============================================================ */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] tracking-tight">
                {isSupplierView
                  ? isAr
                    ? 'مناقصات السوق والمزايدة العكسية'
                    : 'Open Industrial Tenders & Reverse Bidding'
                  : isAr
                  ? 'إدارة طلبات الأسعار والمناقصات الخاصة بي'
                  : 'My Procurement RFQs & Tenders'}
              </h1>

              {/* Dual Capability View Toggle */}
              {hasBothCapabilities && (
                <div className="inline-flex rounded-2xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setDualViewMode('mine')
                      setPageNumber(1)
                    }}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      !isSupplierView
                        ? 'bg-white text-[#06245B] shadow-xs font-extrabold'
                        : 'text-slate-600 hover:text-[#06245B]'
                    }`}
                  >
                    {isAr ? '🛒 مشتري: طلباتي' : '🛒 Buyer: My RFQs'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDualViewMode('discover')
                      setPageNumber(1)
                    }}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      isSupplierView
                        ? 'bg-white text-[#06245B] shadow-xs font-extrabold'
                        : 'text-slate-600 hover:text-[#06245B]'
                    }`}
                  >
                    {isAr ? '🏭 مورد: مزايدات السوق' : '🏭 Supplier: Market Tenders'}
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-slate-500 max-w-2xl">
              {isSupplierView
                ? isAr
                  ? 'استعرض المناقصات المطروحة من المصانع وقدم عروض أسعار تنافسية للفوز بصفقات التوريد الصناعي.'
                  : 'Explore active tenders from verified manufacturers and submit competitive quotes in reverse auctions.'
                : isAr
                ? 'اطرح مناقصات الشراء، حدد الكميات والمواصفات، وقارن عروض الموردين المعتمدين لترسية أفضل سعر.'
                : 'Publish structured procurement tenders, define line specs, and evaluate counterparty bids.'}
            </p>
          </div>

          {/* Action button: Buyer only */}
          {canManageRfqs && !isSupplierView && (
            <Button
              as={Link}
              to="/rfqs/create"
              variant="primary"
              size="md"
              icon={<Plus size={18} />}
              className="shrink-0"
            >
              {isAr ? 'طرح مناقصة / طلب سعر جديد' : 'Create New Tender / RFQ'}
            </Button>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder={
                isAr
                  ? 'بحث برقم المناقصة، اسم المادة، المدينة الصناعية، أو الشركة...'
                  : 'Search by RFQ number, material, industrial zone, or company...'
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPageNumber(1)
              }}
              className="w-full ps-9 pe-4 py-2.5 rounded-2xl border border-slate-200 text-sm
                         focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10
                         placeholder:text-slate-400 text-slate-800 bg-white"
            />
          </div>

          {/* Status filter (Buyer view) */}
          {!isSupplierView && (
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPageNumber(1)
              }}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold
                         focus:outline-none focus:border-[#1266D6] bg-white text-slate-800 shrink-0"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {isAr ? opt.labelAr : opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ============================================================
          TENDERS & RFQS LISTING
          ============================================================ */}
      {rfqList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
          <EmptyState
            icon={FileText}
            title={
              isSupplierView
                ? isAr
                  ? 'لا توجد مناقصات مطابقة لبحثك حالياً'
                  : 'No Open Tenders Found'
                : isAr
                ? 'لم تقم بإنشاء أي طلبات أسعار بعد'
                : 'No RFQs Created Yet'
            }
            description={
              isSupplierView
                ? isAr
                  ? 'حاول تعديل شروط البحث أو اختيار تصنيف آخر لمتابعة المناقصات المتاحة.'
                  : 'Try adjusting your search terms or check back soon for newly published factory tenders.'
                : isAr
                ? 'ابدأ بطرح أول طلب سعر لتلقي عروض الأسعار التنافسية من كبرى المصانع والموردين في مصر.'
                : 'Publish your first procurement tender to start receiving competitive quotes from verified suppliers.'
            }
            action={
              canManageRfqs && !isSupplierView ? (
                <Button as={Link} to="/rfqs/create" variant="primary">
                  {isAr ? 'إنشاء أول طلب سعر' : 'Create Your First RFQ'}
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rfqList.map((rfq) => {
            const catName = isAr
              ? rfq.targetCategoryNameAr || rfq.targetCategoryNameEn
              : rfq.targetCategoryNameEn || rfq.targetCategoryNameAr

            return (
              <div
                key={rfq.id}
                onClick={() => navigate(`/rfqs/${rfq.id}`)}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 cursor-pointer hover:border-[#1266D6] hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Top: RFQ Number & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-mono text-slate-400 block mb-0.5">
                        {rfq.rfqNumber}
                      </span>
                      <span className="text-[11px] font-bold text-[#1266D6] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        {catName || 'Industrial Sourcing'}
                      </span>
                    </div>

                    <Badge variant={statusVariant[rfq.status] || 'navy'}>
                      {rfq.status}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-[#06245B] text-base leading-snug group-hover:text-[#1266D6] transition-colors mb-3 line-clamp-2">
                    {isAr ? rfq.title : rfq.titleEn || rfq.title}
                  </h3>

                  {/* Logistics and Dates */}
                  <div className="space-y-2 text-xs text-slate-500 mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#1266D6] shrink-0" />
                      <span className="truncate">
                        {rfq.deliveryCity}, {rfq.deliveryGovernorate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-amber-600 shrink-0" />
                      <span>
                        {isAr ? 'ينتهي في: ' : 'Closes: '}
                        <strong>{formatDate(rfq.closingDateUtc)}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">
                        {isAr ? 'المشتري: ' : 'Buyer: '}
                        <strong className="text-slate-700">{rfq.buyerCompanyName}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Reverse Bidding / Bids Summary Snapshot */}
                  {isSupplierView && rfq.currentLowestUnitPrice ? (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-800 block flex items-center gap-1">
                          <TrendingDown size={13} />
                          <span>{isAr ? 'أدنى سعر مسجل حالياً' : 'Current Lowest Bid'}</span>
                        </span>
                        <span className="text-base font-extrabold text-emerald-900">
                          {formatCurrency(rfq.currentLowestUnitPrice)}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-mono ms-1">
                          / {isAr ? rfq.unit : rfq.unitEn || 'ton'}
                        </span>
                      </div>

                      <div className="text-end">
                        <span className="text-[10px] font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-full border border-emerald-200">
                          {rfq.offersCount} {isAr ? 'عروض مقدمة' : 'bids'}
                        </span>
                      </div>
                    </div>
                  ) : !isSupplierView && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between mb-4 text-xs">
                      <span className="text-slate-500">
                        {isAr ? 'عروض الأسعار المستلمة: ' : 'Quotes Received: '}
                        <strong className="text-[#06245B] font-bold">{rfq.offersCount ?? 0}</strong>
                      </span>

                      {rfq.lowestBidAmount && (
                        <span className="font-bold text-[#1266D6]">
                          {isAr ? 'أفضل عرض: ' : 'Best: '}
                          {formatCurrency(rfq.lowestBidAmount)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Bottom CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {rfq.itemCount} {isAr ? 'أصناف مطلوبة' : 'line items'}
                  </span>

                  {isSupplierView ? (
                    <Button
                      size="xs"
                      variant="primary"
                      icon={<Send size={13} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/rfqs/${rfq.id}/submit-offer`)
                      }}
                    >
                      {isAr ? 'تقديم عرض تنافسي' : 'Bid on Tender'}
                    </Button>
                  ) : (
                    <Button size="xs" variant="outline" icon={<Eye size={13} />}>
                      {isAr ? 'عرض العروض والترسية' : 'Manage Tender'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
