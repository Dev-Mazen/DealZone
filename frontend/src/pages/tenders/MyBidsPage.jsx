import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Gavel,
  Search,
  Eye,
  Clock,
  Calendar,
  Building2,
  DollarSign,
  AlertCircle,
  Truck,
} from 'lucide-react'
import { tenderService } from '../../shared/api/services/tenderService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency, bidStatusVariant } from '../../utils/format'

const bidStatusOptions = [
  { value: '', label: 'All Statuses', labelAr: 'جميع الحالات' },
  { value: 'Submitted', label: 'Submitted', labelAr: 'مقدم' },
  { value: 'UnderReview', label: 'Under Review', labelAr: 'قيد المراجعة' },
  { value: 'Accepted', label: 'Accepted (Awarded)', labelAr: 'مقبول (فائز)' },
  { value: 'Rejected', label: 'Rejected', labelAr: 'مرفوض' },
  { value: 'Withdrawn', label: 'Withdrawn', labelAr: 'مسحوب' },
  { value: 'Superseded', label: 'Superseded', labelAr: 'محدث' },
]

const bidStatusLabel = (status, isAr) => ({
  Submitted: isAr ? 'مقدم' : 'Submitted',
  UnderReview: isAr ? 'قيد المراجعة' : 'Under Review',
  Accepted: isAr ? 'مقبول (فائز)' : 'Accepted',
  Rejected: isAr ? 'مرفوض' : 'Rejected',
  Withdrawn: isAr ? 'مسحوب' : 'Withdrawn',
  Superseded: isAr ? 'محدث' : 'Superseded',
}[status] || status)

export default function MyBidsPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const { isVerified, hasCompany, isAuthLoading } = usePermissions()

  const [statusFilter, setStatusFilter] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const pageSize = 12

  const { data, isLoading } = useQuery({
    queryKey: ['bids', 'mine', { status: statusFilter, pageNumber, pageSize }],
    queryFn: () =>
      tenderService.getMyBids({
        status: statusFilter || undefined,
        pageNumber,
        pageSize,
      }),
    enabled: isVerified,
    staleTime: 60_000,
  })

  const bids = data?.items || []
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
            ? 'يجب استكمال توثيق الشركة للوصول إلى عروض المناقصات.'
            : 'Complete company verification to manage your tender bids.'}
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] tracking-tight mb-2">
              {isAr ? 'عروضي في المناقصات والمزايدات' : 'My Tender Bids'}
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              {isAr
                ? 'تابع حالة عروضك ومزايداتك العكسية المقدمة للمصانع والشركات الشارية.'
                : 'Track the status and progress of all your submitted reverse auction bids.'}
            </p>
          </div>

          <Button
            as={Link}
            to="/tenders"
            variant="primary"
            size="md"
            icon={<Gavel size={18} />}
            className="shrink-0"
          >
            {isAr ? 'تصفح المناقصات المفتوحة' : 'Browse Open Tenders'}
          </Button>
        </div>

        {/* Filter bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPageNumber(1)
            }}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#1266D6] bg-white text-slate-800"
          >
            {bidStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {isAr ? opt.labelAr : opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <PageSpinner />
      ) : bids.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
          <EmptyState
            icon={Gavel}
            title={isAr ? 'لا توجد عروض مقدمة' : 'No Submitted Bids'}
            description={
              isAr
                ? 'لم تقم بتقديم أي عروض أسعار في المناقصات بعد. تصفح مناقصات السوق للمشاركة في المزايدات.'
                : 'You have not submitted any bids yet. Explore open tenders to start bidding.'
            }
            action={
              <Button as={Link} to="/tenders" variant="primary">
                {isAr ? 'تصفح المناقصات' : 'Browse Tenders'}
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bids.map((bid) => (
              <div
                key={bid.id}
                onClick={() => navigate(`/tenders/bids/${bid.id}`)}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 cursor-pointer hover:border-[#1266D6] hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-mono text-slate-400 block mb-0.5">
                        {bid.bidNumber}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {bid.tenderNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {bid.isLowest && (
                        <Badge variant="success" size="sm">
                          {isAr ? 'الأدنى' : 'Lowest'}
                        </Badge>
                      )}
                      <Badge variant={bidStatusVariant(bid.status)}>
                        {bidStatusLabel(bid.status, isAr)}
                      </Badge>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-[#06245B] text-base leading-snug group-hover:text-[#1266D6] transition-colors mb-3 line-clamp-2">
                    {bid.tenderTitle}
                  </h3>

                  {/* Amount highlight */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">
                        {isAr ? 'إجمالي العرض' : 'Total Bid'}
                      </span>
                      <span className="text-lg font-extrabold text-[#06245B]">
                        {formatCurrency(bid.totalAmount)}
                      </span>
                    </div>
                    <div className="text-end text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Truck size={13} className="text-[#1266D6]" />
                        <span>{bid.deliveryLeadTimeDays} {isAr ? 'يوم' : 'days'}</span>
                      </div>
                      {bid.revisionNumber > 1 && (
                        <span className="text-[10px] text-slate-400">
                          {isAr ? `تعديل #${bid.revisionNumber}` : `Rev #${bid.revisionNumber}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date details */}
                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} />
                      <span>{isAr ? 'قدم بتاريخ: ' : 'Submitted: '}{formatDate(bid.submittedAtUtc)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={13} />
                      <span>{isAr ? 'صالح حتى: ' : 'Valid until: '}{formatDate(bid.validityDateUtc)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-end">
                  <Button size="xs" variant="outline" icon={<Eye size={13} />}>
                    {isAr ? 'عرض التفاصيل' : 'View Details'}
                  </Button>
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
