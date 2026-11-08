import { useState } from 'react'
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
  { value: 'InProgress', label: 'In Progress', labelAr: 'قيد التنفيذ' },
  { value: 'Disputed', label: 'Disputed', labelAr: 'متنازع عليها' },
  { value: 'Completed', label: 'Completed', labelAr: 'مكتملة' },
  { value: 'Cancelled', label: 'Cancelled', labelAr: 'ملغاة' },
]

export default function DealsListPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isVerified, hasCompany } = usePermissions()

  const [roleFilter, setRoleFilter] = useState('all') // 'all', 'buyer', 'supplier'
  const [statusFilter, setStatusFilter] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 10

  const { data, isLoading, error } = useQuery({
    queryKey: ['deals', 'mine', { status: statusFilter, pageNumber, pageSize }],
    queryFn: () => dealService.getMine({ status: statusFilter || undefined, pageNumber, pageSize }),
    enabled: isVerified,
  })

  // Verification Check
  if (!hasCompany || !isVerified) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#06245B] mb-2">
          {isAr ? 'التحقق من الشركة مطلوب للوصول إلى الصفقات' : 'Company Verification Required'}
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          {isAr
            ? 'لإبرام الصفقات التجارية ومتابعة مراحل التوريد والمدفوعات، يجب أولاً إتمام توثيق السجل التجاري والبطاقة الضريبية.'
            : 'To execute binding deals and monitor fulfillment, please complete commercial registration and tax vetting.'}
        </p>
        <Button as={Link} to="/onboarding/verification" variant="primary" size="md">
          {isAr ? 'استكمال التحقق الآن' : 'Complete Verification'}
        </Button>
      </div>
    )
  }

  const currentCompanyId = (user?.company?.id || '').toLowerCase()

  // Filter items by buyer/supplier role if selected
  const filteredItems = (data?.items || []).filter((deal) => {
    if (roleFilter === 'buyer') {
      return (deal.buyerCompanyId || '').toLowerCase() === currentCompanyId
    }
    if (roleFilter === 'supplier') {
      return (deal.supplierCompanyId || '').toLowerCase() === currentCompanyId
    }
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#06245B]">
            {isAr ? 'الصفقات التجارية الملزمة' : 'Commercial Deals'}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {isAr
              ? 'متابعة الصفقات المنعقدة والجدول الزمني للشحنات وتأكيد الاستلام'
              : 'Track binding contracts, fulfillment milestones, and counterparty commitments'}
          </p>
        </div>

        {/* Role Filter Tabs */}
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
            className={`px-3 py-1.5 rounded-xl transition-all ${
              roleFilter === 'buyer'
                ? 'bg-white text-[#06245B] shadow-sm'
                : 'text-slate-600 hover:text-[#06245B]'
            }`}
          >
            {isAr ? 'صفقات الشراء' : 'Buying'}
          </button>
          <button
            onClick={() => setRoleFilter('supplier')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              roleFilter === 'supplier'
                ? 'bg-white text-[#06245B] shadow-sm'
                : 'text-slate-600 hover:text-[#06245B]'
            }`}
          >
            {isAr ? 'صفقات البيع' : 'Selling'}
          </button>
        </div>
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
          {data ? `${filteredItems.length} ${isAr ? 'صفقات معروضة' : 'deals listed'}` : ''}
        </span>
      </div>

      {/* Loading & Error States */}
      {isLoading && <PageSpinner />}

      {error && !isLoading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700">
          <AlertCircle size={32} className="mx-auto mb-2 text-rose-500" />
          <p className="text-sm font-semibold">
            {isAr ? 'تعذر تحميل الصفقات في الوقت الحالي' : 'Failed to load deals'}
          </p>
          <p className="text-xs text-rose-500 mt-1">
            {error?.problem?.detail || error?.message}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredItems.length === 0 && (
        <EmptyState
          icon={Handshake}
          title={isAr ? 'لا توجد صفقات تجارية بعد' : 'No Deals Found'}
          description={
            isAr
              ? 'تتشكل الصفقات الملزمة فور قبول أحد عروض الأسعار المقدمة.'
              : 'Binding deals are atomically created upon accepting an industrial quote.'
          }
          action={
            <Link to="/rfqs">
              <Button variant="primary">
                {isAr ? 'تصفح طلبات الأسعار' : 'Browse RFQs'}
              </Button>
            </Link>
          }
        />
      )}

      {/* Deals Grid */}
      {!isLoading && !error && filteredItems.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((deal) => {
              const isBuyer = (deal.buyerCompanyId || '').toLowerCase() === currentCompanyId
              const counterparty = isBuyer ? deal.supplierCompanyName : deal.buyerCompanyName

              return (
                <div
                  key={deal.id}
                  onClick={() => navigate(`/deals/${deal.id}`)}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 cursor-pointer hover:border-[#1266D6] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-xs font-mono text-slate-400 block mb-0.5">
                          {deal.dealNumber}
                        </span>
                        <h3 className="font-bold text-[#06245B] text-base leading-snug">
                          {deal.rfqTitle || deal.rfqNumber}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <Building2 size={13} className="text-[#1266D6]" />
                          <span>
                            {isAr ? 'الطرف الآخر: ' : 'Counterparty: '}
                            <strong className="text-slate-700">{counterparty || 'Enterprise'}</strong>
                          </span>
                        </p>
                      </div>

                      <Badge variant={statusVariant[deal.status]}>
                        {deal.status.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    </div>

                    {/* Role & Date Badges */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {isBuyer ? (isAr ? '🛒 مشتري' : 'Buyer') : (isAr ? '🏭 مورد' : 'Supplier')}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar size={13} />
                        {formatDate(deal.createdAtUtc)}
                      </span>
                    </div>

                    {/* Financial Snapshot */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400 block">
                          {isAr ? 'القيمة المتفق عليها' : 'Contract Value'}
                        </span>
                        <span className="font-extrabold text-[#06245B] text-base">
                          {formatCurrency(deal.agreedPrice, deal.currency)}
                        </span>
                      </div>

                      {deal.completedAtUtc && (
                        <div className="text-end">
                          <span className="text-[11px] text-emerald-600 font-semibold block">
                            {isAr ? '✓ مكتملة' : '✓ Completed'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(deal.completedAtUtc)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1266D6] hover:underline flex items-center gap-1">
                      <span>{isAr ? 'عرض تفاصيل الصفقة والشحنات' : 'View Contract & Logistics'}</span>
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
    </div>
  )
}
