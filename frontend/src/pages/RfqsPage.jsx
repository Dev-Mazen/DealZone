import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, FileText, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { rfqService } from '../shared/api/services/rfqService'
import { useTranslation } from '../hooks/useTranslation'
import { usePermissions } from '../hooks/usePermissions'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { PageSpinner } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { formatDate } from '../utils/format'

const statusOptions = [
  { value: '', label: 'All Statuses', labelAr: 'جميع الحالات' },
  { value: 'Draft', label: 'Draft', labelAr: 'مسودة' },
  { value: 'Published', label: 'Published', labelAr: 'منشور' },
  { value: 'Closed', label: 'Closed', labelAr: 'مغلق' },
  { value: 'Cancelled', label: 'Cancelled', labelAr: 'ملغي' },
]

const statusVariant = {
  Draft: 'navy',
  Published: 'success',
  Closed: 'warning',
  Cancelled: 'error',
}

function RfqCard({ rfq, onClick }) {
  const { language } = useTranslation()
  const isAr = language === 'ar'

  const categoryName = isAr
    ? (rfq.targetCategoryNameAr || rfq.targetCategoryNameEn || '—')
    : (rfq.targetCategoryNameEn || rfq.targetCategoryNameAr || '—')

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-[rgba(6,36,91,0.08)] p-5 cursor-pointer
                 hover:shadow-[0_4px_20px_-2px_rgba(6,36,91,0.12)] hover:border-[rgba(6,36,91,0.16)]
                 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono text-[#64748B] mb-1 block">{rfq.rfqNumber}</span>
          <h3 className="font-semibold text-[#06245B] group-hover:text-[#1266D6] transition-colors truncate">
            {rfq.title}
          </h3>
        </div>
        <Badge variant={statusVariant[rfq.status] || 'navy'}>
          {rfq.status}
        </Badge>
      </div>

      <div className="space-y-1.5 text-sm text-[#64748B]">
        {categoryName !== '—' && (
          <div className="flex items-center gap-2">
            <FileText size={14} className="shrink-0 text-[#1266D6]" />
            <span className="truncate">{categoryName}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <MapPin size={14} className="shrink-0 text-[#1266D6]" />
          <span>{rfq.deliveryCity}, {rfq.deliveryGovernorate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="shrink-0 text-[#1266D6]" />
          <span>{isAr ? 'ينتهي:' : 'Closes:'} {formatDate(rfq.closingDateUtc)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[rgba(6,36,91,0.06)] flex items-center justify-between text-xs text-[#94A3B8]">
        <span>{isAr ? `${rfq.itemCount} بند` : `${rfq.itemCount} item${rfq.itemCount !== 1 ? 's' : ''}`}</span>
        <span>{isAr ? 'المشتري:' : 'By:'} {rfq.buyerCompanyName}</span>
      </div>
    </div>
  )
}

export default function RfqsPage() {
  const { language } = useTranslation()
  const navigate = useNavigate()
  const { canManageRfqs, canSubmitOffers, isVerified } = usePermissions()
  const isAr = language === 'ar'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 12

  // Buyers see their own RFQs; Suppliers see the discovery feed
  const isSupplierView = canSubmitOffers && !canManageRfqs

  const { data, isLoading, error } = useQuery({
    queryKey: isSupplierView
      ? ['rfqs', 'discovery', { searchTerm, pageNumber, pageSize }]
      : ['rfqs', 'mine', { status: statusFilter, pageNumber, pageSize }],
    queryFn: isSupplierView
      ? () => rfqService.discover({ searchTerm: searchTerm || undefined, pageNumber, pageSize })
      : () => rfqService.getMine({ status: statusFilter || undefined, pageNumber, pageSize }),
    enabled: isVerified,
  })

  if (isLoading) return <PageSpinner />

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-[#EF4444] mb-4">{isAr ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}</p>
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          {isAr ? 'العودة' : 'Go back'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#06245B]">
            {isSupplierView
              ? (isAr ? 'اكتشاف طلبات الأسعار' : 'Discover RFQs')
              : (isAr ? 'طلبات الأسعار' : 'My RFQs')}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {isSupplierView
              ? (isAr ? 'تصفح طلبات الأسعار المتاحة وتقديم عروضك' : 'Browse available RFQs and submit your offers')
              : (isAr ? 'إدارة طلبات الأسعار الخاصة بك' : 'Manage your procurement requests')}
          </p>
        </div>
        {canManageRfqs && (
          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={() => navigate('/rfqs/create')}
          >
            {isAr ? 'إنشاء طلب سعر' : 'Create RFQ'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[rgba(6,36,91,0.08)] p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            <input
              type="search"
              placeholder={isAr ? 'بحث بالعنوان...' : 'Search by title...'}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPageNumber(1) }}
              className="w-full ps-9 pe-4 py-2 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                         focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10
                         placeholder:text-[#94A3B8] text-[#1E293B] bg-white"
            />
          </div>

          {/* Status filter — buyers only */}
          {!isSupplierView && (
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPageNumber(1) }}
              className="pe-9 ps-3 py-2 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                         focus:outline-none focus:border-[#1266D6] bg-white text-[#1E293B]"
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

      {/* Results */}
      {data?.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={isAr ? 'لا توجد طلبات أسعار' : 'No RFQs Found'}
          description={
            isSupplierView
              ? (isAr ? 'لا توجد طلبات أسعار متاحة حالياً. حاول تعديل بحثك.' : 'No RFQs available right now. Try adjusting your search.')
              : (isAr ? 'لم تقم بإنشاء أي طلبات أسعار بعد.' : "You haven't created any RFQs yet.")
          }
          action={
            canManageRfqs ? (
              <Button variant="primary" onClick={() => navigate('/rfqs/create')}>
                {isAr ? 'إنشاء أول طلب سعر' : 'Create Your First RFQ'}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.items.map((rfq) => (
              <RfqCard
                key={rfq.id}
                rfq={rfq}
                onClick={() => navigate(`/rfqs/${rfq.id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
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
              <span className="text-sm text-[#64748B] px-2">
                {isAr
                  ? `${pageNumber} من ${data.totalPages}`
                  : `Page ${pageNumber} of ${data.totalPages}`}
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

