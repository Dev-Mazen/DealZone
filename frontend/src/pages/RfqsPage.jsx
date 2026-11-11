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
  Gavel,
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

  // Real API Query for RFQs
  const { data: apiData, isLoading: isQueryLoading, error: queryError, refetch } = useQuery({
    queryKey: isSupplierView
      ? ['rfqs', 'discovery', { searchTerm, pageNumber, pageSize }]
      : ['rfqs', 'mine', { status: statusFilter, searchTerm, pageNumber, pageSize }],
    queryFn: async () => {
      if (isSupplierView) {
        return rfqService.discover({ searchTerm: searchTerm.trim() || undefined, pageNumber, pageSize })
      } else {
        return rfqService.getMine({ status: statusFilter || undefined, searchTerm: searchTerm.trim() || undefined, pageNumber, pageSize })
      }
    },
    enabled: isVerified,
    staleTime: 30_000,
  })

  // Real items from persisted database
  const rfqList = apiData?.items || []

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

          {/* Action buttons: Buyer only */}
          {canManageRfqs && !isSupplierView && (
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <Button
                as={Link}
                to="/rfqs/create"
                variant="primary"
                size="md"
                icon={<Plus size={16} />}
              >
                {isAr ? 'طلب سعر مباشر (RFQ)' : 'New Quote Request'}
              </Button>
              <Button
                as={Link}
                to="/tenders/create"
                variant="outline"
                size="md"
                icon={<Gavel size={16} />}
                className="border-[#06245B] text-[#06245B] hover:bg-[#EAF4FF]"
              >
                {isAr ? 'طرح مناقصة كبرى (Tender)' : 'Publish Tender'}
              </Button>
            </div>
          )}
        </div>

        {/* Section Navigation Tabs between Direct RFQs and Public Tenders */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100 flex-wrap">
          <Link
            to="/rfqs"
            className="px-4 py-2 rounded-2xl bg-[#06245B] text-white text-xs font-bold shadow-xs flex items-center gap-2"
          >
            <FileText size={15} />
            <span>{isAr ? 'طلبات الأسعار المباشرة (RFQs)' : 'Direct Quotations (RFQs)'}</span>
          </Link>
          <Link
            to="/tenders"
            className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2"
          >
            <Gavel size={15} className="text-[#1266D6]" />
            <span>{isAr ? 'المناقصات الكبرى والمزايدات (Tenders)' : 'Industrial Tenders'}</span>
          </Link>
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
      {isQueryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between animate-pulse space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="space-y-1.5">
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    <div className="h-5 w-28 bg-blue-100 rounded-full" />
                  </div>
                  <div className="h-5 w-16 bg-slate-200 rounded-full" />
                </div>
                <div className="h-5 w-3/4 bg-slate-200 rounded mb-4" />
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="h-3 w-1/2 bg-slate-200 rounded" />
                  <div className="h-3 w-2/3 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="h-4 w-16 bg-slate-200 rounded" />
                <div className="h-7 w-24 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : rfqList.length === 0 ? (
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
                    <Button
                      size="xs"
                      variant="outline"
                      icon={<Eye size={13} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/rfqs/${rfq.id}`)
                      }}
                    >
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
