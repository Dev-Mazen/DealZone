import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Handshake, ChevronLeft, ChevronRight, Building2, Calendar } from 'lucide-react'
import { dealService } from '../../shared/api/services/dealService'
import { useTranslation } from '../../hooks/useTranslation'
import { useAuthStore } from '../../store/authStore'
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
  { value: '', label: 'All Deals', labelAr: 'جميع الصفقات' },
  { value: 'AwaitingConfirmation', label: 'Awaiting Confirmation', labelAr: 'بانتظار التأكيد' },
  { value: 'Confirmed', label: 'Confirmed', labelAr: 'مؤكدة' },
  { value: 'InProgress', label: 'In Progress', labelAr: 'قيد التنفيذ' },
  { value: 'Disputed', label: 'Disputed', labelAr: 'متنازع عليها' },
  { value: 'Completed', label: 'Completed', labelAr: 'مكتملة' },
  { value: 'Cancelled', label: 'Cancelled', labelAr: 'ملغاة' },
]

function DealCard({ deal, currentCompanyId, isAr }) {
  const navigate = useNavigate()
  const isBuyer = deal.buyerCompanyId === currentCompanyId
  const counterparty = isBuyer ? deal.supplierCompanyName : deal.buyerCompanyName

  return (
    <div
      onClick={() => navigate(`/deals/${deal.id}`)}
      className="bg-white rounded-xl border border-[rgba(6,36,91,0.08)] p-5 cursor-pointer
                 hover:shadow-[0_4px_20px_-2px_rgba(6,36,91,0.12)] hover:border-[rgba(6,36,91,0.16)]
                 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-mono text-[#64748B] block mb-0.5">{deal.dealNumber}</span>
          <p className="font-semibold text-[#06245B] text-sm">{deal.rfqTitle}</p>
          <p className="text-xs text-[#64748B] mt-0.5">
            {isAr ? 'الطرف الآخر:' : 'Counterparty:'} {counterparty}
          </p>
        </div>
        <Badge variant={statusVariant[deal.status]}>
          {deal.status.replace(/([A-Z])/g, ' $1').trim()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[#64748B] mt-3">
        <div className="flex items-center gap-1.5">
          <Building2 size={12} className="text-[#1266D6] shrink-0" />
          <span>{isAr ? (isBuyer ? 'مشتري' : 'مورد') : (isBuyer ? 'Buyer' : 'Supplier')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-[#1266D6] shrink-0" />
          <span>{formatDate(deal.createdAtUtc)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[rgba(6,36,91,0.06)] flex items-center justify-between">
        <span className="text-sm font-bold text-[#06245B]">{formatCurrency(deal.agreedPrice)}</span>
        {deal.completedAtUtc && (
          <span className="text-xs text-[#10B981]">
            {isAr ? 'اكتمل:' : 'Completed:'} {formatDate(deal.completedAtUtc)}
          </span>
        )}
      </div>
    </div>
  )
}

export default function DealsListPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const user = useAuthStore((s) => s.user)
  const [statusFilter, setStatusFilter] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 10

  const { data, isLoading, error } = useQuery({
    queryKey: ['deals', 'mine', { status: statusFilter, pageNumber, pageSize }],
    queryFn: () => dealService.getMine({ status: statusFilter || undefined, pageNumber, pageSize }),
  })

  if (isLoading) return <PageSpinner />

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-[#EF4444]">{isAr ? 'خطأ في تحميل الصفقات' : 'Error loading deals'}</p>
      </div>
    )
  }

  const currentCompanyId = user?.company?.id || ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#06245B]">
            {isAr ? 'صفقاتي' : 'My Deals'}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {isAr ? 'تتبع جميع الصفقات التجارية الخاصة بك' : 'Track all your commercial deals'}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-[rgba(6,36,91,0.08)] p-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPageNumber(1) }}
          className="px-3 py-2 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                     focus:outline-none focus:border-[#1266D6] bg-white text-[#1E293B]"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {isAr ? opt.labelAr : opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Deals */}
      {data?.items.length === 0 ? (
        <EmptyState
          icon={<Handshake size={48} />}
          title={isAr ? 'لا توجد صفقات' : 'No Deals Yet'}
          description={isAr ? 'ستظهر هنا صفقاتك بعد قبول عروض الأسعار.' : 'Your deals will appear here after accepting offers.'}
          action={
            <Link to="/rfqs">
              <Button variant="primary">{isAr ? 'تصفح طلبات الأسعار' : 'Browse RFQs'}</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data?.items.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                currentCompanyId={currentCompanyId}
                isAr={isAr}
              />
            ))}
          </div>

          {data && data.totalPages > 1 && (
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
              <span className="text-sm text-[#64748B]">
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
        </>
      )}
    </div>
  )
}
