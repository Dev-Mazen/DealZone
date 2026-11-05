import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { offerService } from '../../shared/api/services/offerService'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
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
  { value: '', label: 'All Offers', labelAr: 'جميع العروض' },
  { value: 'Submitted', label: 'Submitted', labelAr: 'مقدّم' },
  { value: 'UnderReview', label: 'Under Review', labelAr: 'قيد المراجعة' },
  { value: 'Accepted', label: 'Accepted', labelAr: 'مقبول' },
  { value: 'Rejected', label: 'Rejected', labelAr: 'مرفوض' },
  { value: 'Superseded', label: 'Superseded', labelAr: 'تمت مراجعته' },
]

function OfferSummaryCard({ offer, isAr, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-[rgba(6,36,91,0.08)] p-5 cursor-pointer
                 hover:shadow-[0_4px_20px_-2px_rgba(6,36,91,0.12)] hover:border-[rgba(6,36,91,0.16)]
                 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-mono text-[#64748B]">{offer.offerNumber}</span>
          <p className="font-semibold text-[#06245B] mt-0.5">{offer.rfqTitle}</p>
          <p className="text-xs text-[#64748B]">{isAr ? 'طلب السعر:' : 'RFQ:'} {offer.rfqNumber}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={statusVariant[offer.status]}>
            {offer.status.replace(/([A-Z])/g, ' $1').trim()}
          </Badge>
          {offer.revisionNumber > 1 && (
            <span className="text-xs bg-[#EAF4FF] text-[#1266D6] px-1.5 py-0.5 rounded font-medium">
              Rev. {offer.revisionNumber}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-[#64748B]">
        <div>
          <p className="text-[#94A3B8] mb-0.5">{isAr ? 'المبلغ' : 'Amount'}</p>
          <p className="font-bold text-[#06245B] text-sm">{formatCurrency(offer.totalAmount)}</p>
        </div>
        <div>
          <p className="text-[#94A3B8] mb-0.5">{isAr ? 'مهلة التسليم' : 'Lead Time'}</p>
          <p className="font-medium text-[#1E293B]">{offer.deliveryLeadTimeDays}d</p>
        </div>
        <div>
          <p className="text-[#94A3B8] mb-0.5">{isAr ? 'صالح حتى' : 'Valid Until'}</p>
          <p className="font-medium text-[#1E293B]">{formatDate(offer.validityDateUtc)}</p>
        </div>
        <div>
          <p className="text-[#94A3B8] mb-0.5">{isAr ? 'عدد البنود' : 'Items'}</p>
          <p className="font-medium text-[#1E293B]">{offer.itemCount}</p>
        </div>
        <div>
          <p className="text-[#94A3B8] mb-0.5">{isAr ? 'الشحن' : 'Shipping'}</p>
          <p className="font-medium text-[#1E293B]">
            {offer.shippingIncluded ? (isAr ? 'مشمول' : 'Incl.') : (isAr ? 'غير مشمول' : 'Excl.')}
          </p>
        </div>
        <div>
          <p className="text-[#94A3B8] mb-0.5">{isAr ? 'تاريخ التقديم' : 'Submitted'}</p>
          <p className="font-medium text-[#1E293B]">{formatDate(offer.submittedAtUtc)}</p>
        </div>
      </div>
    </div>
  )
}

export default function MyOffersPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 10

  const { data, isLoading, error } = useQuery({
    queryKey: ['offers', 'mine', { status: statusFilter, pageNumber, pageSize }],
    queryFn: () => offerService.getMine({ status: statusFilter || undefined, pageNumber, pageSize }),
  })

  if (isLoading) return <PageSpinner />

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-[#EF4444]">{isAr ? 'خطأ في تحميل العروض' : 'Error loading offers'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#06245B]">
          {isAr ? 'عروضي المقدّمة' : 'My Offers'}
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          {isAr ? 'تتبع العروض التي قدمتها على طلبات الأسعار' : 'Track offers you submitted on RFQs'}
        </p>
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

      {data?.items.length === 0 ? (
        <EmptyState
          icon={<Package size={48} />}
          title={isAr ? 'لا توجد عروض' : 'No Offers Yet'}
          description={isAr ? 'ابحث عن طلبات الأسعار المتاحة وقدم عروضك.' : 'Discover available RFQs and submit your offers.'}
          action={
            <Link to="/rfqs">
              <Button variant="primary">{isAr ? 'اكتشاف طلبات الأسعار' : 'Discover RFQs'}</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {data?.items.map((offer) => (
              <OfferSummaryCard
                key={offer.id}
                offer={offer}
                isAr={isAr}
                onClick={() => navigate(`/offers/${offer.id}`)}
              />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline" size="sm"
                icon={<ChevronLeft size={16} />}
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber((p) => p - 1)}
              >
                {isAr ? 'السابق' : 'Previous'}
              </Button>
              <span className="text-sm text-[#64748B]">{pageNumber} / {data.totalPages}</span>
              <Button
                variant="outline" size="sm"
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
