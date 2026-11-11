import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Handshake,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Truck,
  ArrowRight,
  ArrowLeft,
  Search,
  Filter,
  ShieldCheck,
  FileText,
  MapPin,
  Clock,
  DollarSign,
  Tag,
} from 'lucide-react'
import { dealService } from '../../shared/api/services/dealService'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuthStore } from '../../store/authStore'
import { usePermissions } from '../../hooks/usePermissions'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency, formatDate } from '../../utils/format'

const statusVariant = {
  AwaitingConfirmation: 'warning',
  Confirmed: 'info',
  InProgress: 'cyan',
  Disputed: 'error',
  Completed: 'success',
  Cancelled: 'error',
}

const statusOptions = [
  { value: '', label: 'All Statuses', labelAr: 'جميع الحالات' },
  { value: 'AwaitingConfirmation', label: 'Awaiting Confirmation', labelAr: 'بانتظار التأكيد' },
  { value: 'Confirmed', label: 'Confirmed', labelAr: 'مؤكدة' },
  { value: 'InProgress', label: 'In Progress', labelAr: 'قيد التنفيذ والشحن' },
  { value: 'Disputed', label: 'Disputed', labelAr: 'متنازع عليها' },
  { value: 'Completed', label: 'Completed', labelAr: 'مكتملة ومستلمة' },
  { value: 'Cancelled', label: 'Cancelled', labelAr: 'ملغاة' },
]

// Deal status configuration


export default function DealsListPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const {
    isVerified,
    hasCompany,
    isBuyer,
    isSupplier,
    isBuyerOnly,
    isSupplierOnly,
    hasBothCapabilities,
  } = usePermissions()

  // Initialize role filter based on actual permissions
  const [roleFilter, setRoleFilter] = useState(
    isSupplierOnly ? 'supplier' : isBuyerOnly ? 'buyer' : 'all'
  )

  useEffect(() => {
    if (isSupplierOnly && roleFilter !== 'supplier') {
      setRoleFilter('supplier')
    } else if (isBuyerOnly && roleFilter !== 'buyer') {
      setRoleFilter('buyer')
    }
  }, [isSupplierOnly, isBuyerOnly])

  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 10

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['deals', 'mine', { status: statusFilter, pageNumber, pageSize }],
    queryFn: () => dealService.getMine({ status: statusFilter || undefined, pageNumber, pageSize }),
    enabled: hasCompany && isVerified,
    retry: 1,
  })

  const allDeals = useMemo(() => data?.items ?? [], [data])

  const currentCompanyId = (user?.company?.id || '').toLowerCase()

  // Filter deals based on role filter, status, and search query
  const filteredItems = useMemo(() => {
    return allDeals.filter((deal) => {
      // Role filter check
      if (roleFilter === 'buyer') {
        const isBuyerMatch = (deal.buyerCompanyId || '').toLowerCase() === currentCompanyId
        if (!isBuyerMatch) return false
      }

      if (roleFilter === 'supplier') {
        const isSupplierMatch = (deal.supplierCompanyId || '').toLowerCase() === currentCompanyId
        if (!isSupplierMatch) return false
      }

      // Status filter check
      if (statusFilter && deal.status !== statusFilter) {
        return false
      }

      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchTitle = (deal.rfqTitle || '').toLowerCase().includes(query)
        const matchNumber = (deal.dealNumber || '').toLowerCase().includes(query)
        const matchBuyer = (deal.buyerCompanyName || '').toLowerCase().includes(query)
        const matchSupplier = (deal.supplierCompanyName || '').toLowerCase().includes(query)
        const matchZone = (deal.deliveryZone || '').toLowerCase().includes(query)
        if (!matchTitle && !matchNumber && !matchBuyer && !matchSupplier && !matchZone) {
          return false
        }
      }

      return true
    })
  }, [allDeals, roleFilter, statusFilter, searchQuery, currentCompanyId])

  // Company onboarding wall check (only when user has zero company record)
  if (!hasCompany) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-blue-50 text-[#1266D6] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200">
          <Building2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#06245B] mb-2">
          {isAr ? 'ملف الشركة مطلوب للوصول إلى الصفقات' : 'Company Profile Required'}
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          {isAr
            ? 'لإبرام الصفقات التجارية ومتابعة مراحل التوريد والمدفوعات، يجب أولاً إنشاء ملف الشركة التجاري.'
            : 'To execute legally binding raw materials contracts, please register your company profile first.'}
        </p>
        <Button as={Link} to="/onboarding" variant="primary" size="md">
          {isAr ? 'إنشاء ملف الشركة الآن' : 'Create Company Profile'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Verification Notice Banner (non-blocking) */}
      {!isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {isAr
                  ? 'حساب الشركة في وضع المعاينة — التوثيق مطلوب لإبرام صفقات جديدة'
                  : 'Company Account in Preview Mode — Verification required to execute new deals'}
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {isAr
                  ? 'يمكنك استعراض نماذج العقود والجدول الزمني. لإتمام صفقات حية ملزمة، يرجى رفع السجل التجاري والبطاقة الضريبية.'
                  : 'You can review contract structures and fulfillment schedules. To execute binding transactions, please complete legal verification.'}
              </p>
            </div>
          </div>
          <Button as={Link} to="/onboarding/verification" size="xs" variant="primary" className="shrink-0">
            {isAr ? 'استكمال التوثيق' : 'Verify Account'}
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#06245B]">
              {roleFilter === 'buyer'
                ? isAr
                  ? 'صفقات الشراء والتوريد'
                  : 'Purchasing & Procurement Deals'
                : roleFilter === 'supplier'
                ? isAr
                  ? 'صفقات البيع والمبيعات'
                  : 'Sales & Supply Contracts'
                : isAr
                ? 'الصفقات التجارية الملزمة'
                : 'Commercial Deals & Contracts'}
            </h1>
            <Badge variant="cyan">
              {isLoading ? '...' : `${filteredItems.length} ${isAr ? 'صفقة' : 'deals'}`}
            </Badge>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            {roleFilter === 'buyer'
              ? isAr
                ? 'متابعة عقود التوريد المبرمة لمصنعك وجدول الشحنات وتأكيد الفحص والاستلام'
                : 'Manage procurement contracts for your factory, shipping milestones, and inbound QA verification'
              : roleFilter === 'supplier'
              ? isAr
                ? 'متابعة عقود البيع المنعقدة مع المصانع ومواعيد الشحن ودفعات الضمان'
                : 'Manage confirmed sales contracts, dispatch schedules, and escrow payment milestones'
              : isAr
              ? 'متابعة الصفقات المنعقدة والجدول الزمني للشحنات وتأكيد الاستلام'
              : 'Track binding contracts, fulfillment milestones, and counterparty commitments'}
          </p>
        </div>

        {/* Role Filter Tabs (Only shown if user has dual capabilities or system view) */}
        {hasBothCapabilities && (
          <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 text-xs font-bold shrink-0">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                roleFilter === 'all'
                  ? 'bg-white text-[#06245B] shadow-sm'
                  : 'text-slate-600 hover:text-[#06245B]'
              }`}
            >
              {isAr ? 'جميع الصفقات' : 'All Deals'}
            </button>
            <button
              onClick={() => setRoleFilter('buyer')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                roleFilter === 'buyer'
                  ? 'bg-white text-[#06245B] shadow-sm'
                  : 'text-slate-600 hover:text-[#06245B]'
              }`}
            >
              <span>🛒</span>
              <span>{isAr ? 'صفقات الشراء (مشتري)' : 'Buying (Procurement)'}</span>
            </button>
            <button
              onClick={() => setRoleFilter('supplier')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                roleFilter === 'supplier'
                  ? 'bg-white text-[#06245B] shadow-sm'
                  : 'text-slate-600 hover:text-[#06245B]'
              }`}
            >
              <span>🏭</span>
              <span>{isAr ? 'صفقات البيع (مورد)' : 'Selling (Supply)'}</span>
            </button>
          </div>
        )}

        {/* Action Button */}
        {isBuyer && !isSupplierOnly && (
          <Button
            as={Link}
            to="/rfqs/create"
            variant="primary"
            size="sm"
            icon={<FileText size={16} />}
          >
            {isAr ? 'طلب تسعير جديد (RFQ)' : 'New Procurement RFQ'}
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'بحث بالخامة، رقم الصفقة، المصنع، المنطقة الصناعية...'
                : 'Search by material, deal #, company, industrial zone...'
            }
            className="w-full ps-10 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1266D6] focus:bg-white transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">
              {isAr ? 'الحالة:' : 'Status:'}
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPageNumber(1)
              }}
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
            {isLoading ? '...' : `${filteredItems.length} ${isAr ? 'صفقة' : 'deals'}`}
          </span>
        </div>
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-red-900">
                {isAr ? 'تعذر تحميل الصفقات التجارية' : 'Failed to load commercial deals'}
              </p>
              <p className="text-[11px] text-red-700 mt-0.5">
                {error?.problem?.detail || error?.message || (isAr ? 'يرجى المحاولة مرة أخرى لاحقاً' : 'Please try again later')}
              </p>
            </div>
          </div>
          <Button size="xs" variant="outline" onClick={() => refetch()}>
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && <PageSpinner />}

      {/* Empty State */}
      {!isLoading && !error && filteredItems.length === 0 && (
        <EmptyState
          icon={Handshake}
          title={isAr ? 'لا توجد صفقات تجارية مطابقة' : 'No Deals Found'}
          description={
            isAr
              ? 'تتشكل الصفقات الملزمة فور قبول أحد عروض الأسعار المقدمة في مناقصات التوريد.'
              : 'Binding deals are atomically created upon accepting an industrial quote in open tenders.'
          }
          action={
            <Button as={Link} to="/rfqs" variant="primary">
              {roleFilter === 'supplier'
                ? isAr
                  ? 'استعراض مناقصات السوق المفتوحة'
                  : 'Browse Open Market Tenders'
                : isAr
                ? 'إنشاء أو متابعة طلبات الأسعار'
                : 'Browse Procurement RFQs'}
            </Button>
          }
        />
      )}

      {/* Deals Grid */}
      {!isLoading && !error && filteredItems.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredItems.map((deal) => {
              const isBuyerDeal =
                roleFilter === 'buyer' ||
                (deal.buyerCompanyId || '').toLowerCase() === currentCompanyId

              const counterparty = isBuyerDeal ? deal.supplierCompanyName : deal.buyerCompanyName
              const counterpartyRole = isBuyerDeal
                ? isAr
                  ? 'المورد المتعاقد معه'
                  : 'Contracted Supplier'
                : isAr
                ? 'المصنع المشتري'
                : 'Buyer Factory'

              return (
                <div
                  key={deal.id}
                  onClick={() => navigate(`/deals/${deal.id}`)}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 cursor-pointer hover:border-[#1266D6] hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono font-bold text-[#1266D6] bg-blue-50 px-2 py-0.5 rounded-md">
                            {deal.dealNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {deal.materialCategory || 'Raw Materials'}
                          </span>
                        </div>
                        <h3 className="font-bold text-[#06245B] text-base leading-snug line-clamp-1 group-hover:text-[#1266D6] transition-colors">
                          {deal.rfqTitle || deal.rfqNumber}
                        </h3>
                      </div>

                      <Badge variant={statusVariant[deal.status] || 'info'}>
                        {deal.status.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    </div>

                    {/* Counterparty & Industrial Zone */}
                    <div className="space-y-1.5 mb-4 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-[#1266D6] shrink-0" />
                        <span className="text-slate-400">{counterpartyRole}:</span>
                        <strong className="text-[#06245B] font-bold truncate">
                          {counterparty || 'Egyptian Industrial Enterprise'}
                        </strong>
                      </div>

                      {deal.deliveryZone && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin size={14} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{deal.deliveryZone}</span>
                        </div>
                      )}

                      {deal.paymentTerms && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <DollarSign size={14} className="text-amber-600 shrink-0" />
                          <span className="truncate">{deal.paymentTerms}</span>
                        </div>
                      )}
                    </div>

                    {/* Role Tag & Logistics Details */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
                          isBuyerDeal
                            ? 'bg-[#EAF4FF] text-[#06245B]'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {isBuyerDeal
                          ? isAr
                            ? '🛒 عقد شراء مصنع'
                            : '🛒 Buyer Procurement'
                          : isAr
                          ? '🏭 عقد توريد ومبيعات'
                          : '🏭 Supplier Sales'}
                      </span>

                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar size={13} />
                        {formatDate(deal.createdAtUtc)}
                      </span>

                      {deal.leadTimeDays && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock size={13} className="text-[#1266D6]" />
                          <span>{deal.leadTimeDays} {isAr ? 'أيام توريد' : 'days lead time'}</span>
                        </span>
                      )}

                      {deal.shippingIncluded && (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <Truck size={13} />
                          <span>{isAr ? 'الشحن مشمول' : 'Shipping Included'}</span>
                        </span>
                      )}
                    </div>

                    {/* Financial Snapshot */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-slate-50 to-[#EAF4FF]/40 border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {isAr ? 'القيمة الإجمالية المتفق عليها' : 'Agreed Contract Value'}
                        </span>
                        <span className="font-extrabold text-[#06245B] text-lg">
                          {formatCurrency(deal.agreedPrice, deal.currency || 'EGP')}
                        </span>
                      </div>

                      {deal.status === 'Completed' ? (
                        <div className="text-end">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                            <CheckCircle size={12} />
                            {isAr ? 'مكتملة ومستلمة' : 'Completed'}
                          </span>
                          {deal.completedAtUtc && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {formatDate(deal.completedAtUtc)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-end">
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#1266D6] font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                            <Truck size={12} />
                            {isAr ? 'متابعة الشحن' : 'In Fulfillment'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1266D6] flex items-center gap-1 group-hover:underline">
                      <span>{isAr ? 'عرض تفاصيل العقد والتوريد' : 'View Contract & Milestones'}</span>
                      {isAr ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                    </span>

                    <Button size="xs" variant="primary">
                      {isAr ? 'فتح الصفقة' : 'Open Deal'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination if applicable */}
          {data?.totalPages > 1 && (
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
              <span className="text-xs text-slate-500 font-mono">
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
    </div>
  )
}
