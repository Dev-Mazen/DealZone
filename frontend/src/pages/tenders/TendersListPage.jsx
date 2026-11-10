import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Gavel,
  MapPin,
  Clock,
  Building2,
  TrendingDown,
  Send,
  Eye,
  AlertCircle,
  Filter,
} from 'lucide-react'
import { tenderService } from '../../shared/api/services/tenderService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency, tenderStatusVariant } from '../../utils/format'

const statusOptions = [
  { value: '', label: 'All Statuses', labelAr: 'جميع الحالات' },
  { value: 'Published', label: 'Published / Open', labelAr: 'منشور / مفتوح' },
  { value: 'Draft', label: 'Draft', labelAr: 'مسودة' },
  { value: 'Closed', label: 'Closed', labelAr: 'مغلق' },
  { value: 'Awarded', label: 'Awarded', labelAr: 'تمت الترسية' },
  { value: 'Cancelled', label: 'Cancelled', labelAr: 'ملغي' },
  { value: 'NoAward', label: 'No Award', labelAr: 'بدون ترسية' },
]

const tenderStatusLabel = (status, isAr) => {
  const map = {
    Draft: isAr ? 'مسودة' : 'Draft',
    Published: isAr ? 'مفتوح' : 'Open',
    Closed: isAr ? 'مغلق' : 'Closed',
    Awarded: isAr ? 'تمت الترسية' : 'Awarded',
    Cancelled: isAr ? 'ملغي' : 'Cancelled',
    NoAward: isAr ? 'بدون ترسية' : 'No Award',
  }
  return map[status] || status
}

export default function TendersListPage() {
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

  const [viewMode, setViewMode] = useState(isSupplierOnly ? 'discover' : 'mine')

  useEffect(() => {
    if (isSupplierOnly && viewMode !== 'discover') setViewMode('discover')
    else if (isBuyerOnly && viewMode !== 'mine') setViewMode('mine')
  }, [isSupplierOnly, isBuyerOnly])

  const isSupplierView = isSupplierOnly || (hasBothCapabilities && viewMode === 'discover')

  const { data, isLoading } = useQuery({
    queryKey: isSupplierView
      ? ['tenders', 'discover', { search: searchTerm, pageNumber, pageSize }]
      : ['tenders', 'mine', { search: searchTerm, status: statusFilter, pageNumber, pageSize }],
    queryFn: () => {
      if (isSupplierView) {
        return tenderService.discover({
          search: searchTerm || undefined,
          pageNumber,
          pageSize,
        })
      }
      return tenderService.getMine({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        pageNumber,
        pageSize,
      })
    },
    enabled: isVerified,
    staleTime: 60_000,
  })

  const tenders = data?.items || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  if (!isAuthLoading && (!hasCompany || !isVerified)) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#06245B] mb-2">
          {isAr ? 'التحقق من الشركة مطلوب' : 'Company Verification Required'}
        </h2>
        <p className="text-sm text-[#64748B] mb-6 leading-relaxed">
          {isAr
            ? 'يجب استكمال توثيق الشركة للوصول إلى المناقصات والمزايدة العكسية.'
            : 'Complete company verification to access tenders and reverse bidding.'}
        </p>
        <Button as={Link} to="/onboarding/verification" variant="primary" size="md">
          {isAr ? 'استكمال التحقق الآن' : 'Complete Verification'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] tracking-tight">
                {isSupplierView
                  ? isAr
                    ? 'مناقصات السوق — مزايدة عكسية'
                    : 'Open Tenders — Reverse Bidding'
                  : isAr
                  ? 'مناقصاتي (المشتري)'
                  : 'My Tenders (Buyer)'}
              </h1>

              {hasBothCapabilities && (
                <div className="inline-flex rounded-2xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setViewMode('mine'); setPageNumber(1) }}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      !isSupplierView
                        ? 'bg-white text-[#06245B] shadow-xs font-extrabold'
                        : 'text-slate-600 hover:text-[#06245B]'
                    }`}
                  >
                    {isAr ? '🛒 مشتري: مناقصاتي' : '🛒 Buyer: My Tenders'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setViewMode('discover'); setPageNumber(1) }}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      isSupplierView
                        ? 'bg-white text-[#06245B] shadow-xs font-extrabold'
                        : 'text-slate-600 hover:text-[#06245B]'
                    }`}
                  >
                    {isAr ? '🏭 مورد: تصفح المناقصات' : '🏭 Supplier: Browse Tenders'}
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-slate-500 max-w-2xl">
              {isSupplierView
                ? isAr
                  ? 'استعرض المناقصات من المصانع وقدم عروض أسعار تنافسية في المزايدة العكسية.'
                  : 'Browse open tenders from verified buyers and submit competitive bids.'
                : isAr
                ? 'أنشئ مناقصات، حدد الأصناف والكميات، وقارن عروض الموردين لترسية أفضل صفقة.'
                : 'Create tenders, define line items, and evaluate supplier bids to award the best deal.'}
            </p>
          </div>

          {canManageRfqs && !isSupplierView && (
            <Button
              as={Link}
              to="/tenders/create"
              variant="primary"
              size="md"
              icon={<Plus size={18} />}
              className="shrink-0"
            >
              {isAr ? 'إنشاء مناقصة جديدة' : 'Create New Tender'}
            </Button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder={
                isAr
                  ? 'بحث برقم المناقصة، عنوان، شركة...'
                  : 'Search by tender number, title, company...'
              }
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPageNumber(1) }}
              className="w-full ps-9 pe-4 py-2.5 rounded-2xl border border-slate-200 text-sm
                         focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10
                         placeholder:text-slate-400 text-slate-800 bg-white"
            />
          </div>

          {!isSupplierView && (
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPageNumber(1) }}
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

      {/* Content */}
      {isLoading ? (
        <PageSpinner />
      ) : tenders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
          <EmptyState
            icon={Gavel}
            title={
              isSupplierView
                ? isAr ? 'لا توجد مناقصات متاحة حالياً' : 'No Open Tenders'
                : isAr ? 'لم تقم بإنشاء أي مناقصات بعد' : 'No Tenders Created Yet'
            }
            description={
              isSupplierView
                ? isAr
                  ? 'تحقق مرة أخرى لاحقاً أو عدّل معايير البحث.'
                  : 'Check back soon or adjust your search filters.'
                : isAr
                ? 'أنشئ أول مناقصة لبدء استلام عروض الأسعار من الموردين المعتمدين.'
                : 'Create your first tender to start receiving competitive bids from verified suppliers.'
            }
            action={
              canManageRfqs && !isSupplierView ? (
                <Button as={Link} to="/tenders/create" variant="primary">
                  {isAr ? 'إنشاء أول مناقصة' : 'Create Your First Tender'}
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tenders.map((tender) => (
              <div
                key={tender.id}
                onClick={() => navigate(`/tenders/${tender.id}`)}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 cursor-pointer hover:border-[#1266D6] hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Tender Number & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-mono text-slate-400 block mb-0.5">
                        {tender.tenderNumber}
                      </span>
                      {tender.targetCategoryName && (
                        <span className="text-[11px] font-bold text-[#1266D6] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                          {tender.targetCategoryName}
                        </span>
                      )}
                    </div>
                    <Badge variant={tenderStatusVariant(tender.status)}>
                      {tenderStatusLabel(tender.status, isAr)}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-[#06245B] text-base leading-snug group-hover:text-[#1266D6] transition-colors mb-3 line-clamp-2">
                    {tender.title}
                  </h3>

                  {/* Details */}
                  <div className="space-y-2 text-xs text-slate-500 mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#1266D6] shrink-0" />
                      <span className="truncate">
                        {tender.deliveryCity}, {tender.deliveryGovernorate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-amber-600 shrink-0" />
                      <span>
                        {isAr ? 'ينتهي في: ' : 'Closes: '}
                        <strong>{formatDate(tender.closingDateUtc)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">
                        {isAr ? 'المشتري: ' : 'Buyer: '}
                        <strong className="text-slate-700">{tender.buyerCompanyName}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Bidding info */}
                  {isSupplierView && tender.lowestActiveBidAmount ? (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-800 block flex items-center gap-1">
                          <TrendingDown size={13} />
                          {isAr ? 'أدنى عرض حالياً' : 'Current Lowest Bid'}
                        </span>
                        <span className="text-base font-extrabold text-emerald-900">
                          {formatCurrency(tender.lowestActiveBidAmount)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-white/80 px-2 py-0.5 rounded-full border border-emerald-200">
                        {tender.activeBidsCount} {isAr ? 'عروض' : 'bids'}
                      </span>
                    </div>
                  ) : !isSupplierView && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between mb-4 text-xs">
                      <span className="text-slate-500">
                        {isAr ? 'العروض النشطة: ' : 'Active Bids: '}
                        <strong className="text-[#06245B] font-bold">{tender.activeBidsCount ?? 0}</strong>
                      </span>
                      {tender.lowestActiveBidAmount && (
                        <span className="font-bold text-[#1266D6]">
                          {isAr ? 'أفضل: ' : 'Best: '}
                          {formatCurrency(tender.lowestActiveBidAmount)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {tender.itemsCount} {isAr ? 'أصناف' : 'items'}
                    {tender.referencePrice && (
                      <span className="ms-2 text-slate-500">
                        {isAr ? 'مرجعي: ' : 'Ref: '}{formatCurrency(tender.referencePrice)}
                      </span>
                    )}
                  </span>

                  {isSupplierView ? (
                    <Button
                      size="xs"
                      variant="primary"
                      icon={<Send size={13} />}
                      onClick={(e) => { e.stopPropagation(); navigate(`/tenders/${tender.id}`) }}
                    >
                      {isAr ? 'تقديم عرض' : 'Submit Bid'}
                    </Button>
                  ) : (
                    <Button size="xs" variant="outline" icon={<Eye size={13} />}>
                      {isAr ? 'إدارة المناقصة' : 'Manage'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                size="xs"
                variant="outline"
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => p - 1)}
              >
                {isAr ? 'السابق' : 'Previous'}
              </Button>
              <span className="text-sm text-slate-600 font-semibold">
                {pageNumber} / {totalPages}
              </span>
              <Button
                size="xs"
                variant="outline"
                disabled={pageNumber >= totalPages}
                onClick={() => setPageNumber((p) => p + 1)}
              >
                {isAr ? 'التالي' : 'Next'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
