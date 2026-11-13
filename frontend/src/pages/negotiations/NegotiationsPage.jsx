import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Handshake,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Package,
} from 'lucide-react'
import { negotiationService } from '../../shared/api/services/negotiationService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { formatDateTime } from '../../utils/format'

const statusMap = {
  PendingSupplierResponse: {
    ar: 'بانتظار رد المورد',
    en: 'Pending Supplier Response',
    variant: 'warning',
  },
  CounterofferPendingBuyerResponse: {
    ar: 'عرض مضاد بانتظار ردك',
    en: 'Counteroffer Pending Buyer',
    variant: 'info',
  },
  Accepted: {
    ar: 'تم قبول العرض (مكتمل)',
    en: 'Accepted',
    variant: 'success',
  },
  Rejected: {
    ar: 'مرفوض',
    en: 'Rejected',
    variant: 'error',
  },
  Cancelled: {
    ar: 'ملغي',
    en: 'Cancelled',
    variant: 'navy',
  },
}

export default function NegotiationsPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const { isBuyer, isSupplier } = usePermissions()
  const [roleFilter, setRoleFilter] = useState('ALL') // 'ALL' | 'AS_BUYER' | 'AS_SUPPLIER'

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['negotiations', 'mine', { roleFilter }],
    queryFn: () =>
      negotiationService.getMine({
        asBuyer: roleFilter === 'AS_BUYER' ? true : roleFilter === 'AS_SUPPLIER' ? false : undefined,
      }),
    staleTime: 15_000,
  })

  // Normalize response: API returns PagedResult with `items` or `Items` array
  const items = useMemo(() => {
    if (!responseData) return []
    if (Array.isArray(responseData)) return responseData
    if (Array.isArray(responseData.items)) return responseData.items
    if (Array.isArray(responseData.Items)) return responseData.Items
    return []
  }, [responseData])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1266D6] text-xs font-bold mb-2">
              <Handshake size={14} />
              <span>{isAr ? 'التفاوض المباشر على الأسعار' : 'Direct Price Negotiations'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] tracking-tight">
              {isAr ? 'عروض الأسعار والتفاوض' : 'Price Negotiations & Proposals'}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {isAr
                ? 'متابعة كافة جولات التفاوض على أسعار المنتجات وكمياتها، العروض المضادة، والصفقات الناتجة عنها.'
                : 'Track all structured negotiation rounds, counteroffers, terms revisions, and resulting deals.'}
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl shrink-0 text-xs font-bold">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition-all ${roleFilter === 'ALL' ? 'bg-white text-[#06245B] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              onClick={() => setRoleFilter('AS_BUYER')}
              className={`px-3 py-1.5 rounded-xl transition-all ${roleFilter === 'AS_BUYER' ? 'bg-white text-[#06245B] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {isAr ? 'كمشتري' : 'As Buyer'}
            </button>
            <button
              onClick={() => setRoleFilter('AS_SUPPLIER')}
              className={`px-3 py-1.5 rounded-xl transition-all ${roleFilter === 'AS_SUPPLIER' ? 'bg-white text-[#06245B] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              {isAr ? 'كمورد' : 'As Supplier'}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200/80 p-6 animate-pulse space-y-3">
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
          <EmptyState
            icon={Handshake}
            title={isAr ? 'لا توجد مفاوضات أسعار جارية' : 'No Active Negotiations'}
            description={
              isAr
                ? 'يمكنك بدء تفاوض جديد من خلال صفحة السوق التجاري لأي منتج معروض.'
                : 'You can start a new price proposal directly from any listed product on the Marketplace.'
            }
            action={
              <Button as={Link} to="/marketplace" variant="primary" size="sm">
                {isAr ? 'تصفح السوق التجاري' : 'Browse Marketplace'}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((neg) => {
            const statusInfo = statusMap[neg.status] || { ar: neg.status, en: neg.status, variant: 'navy' }
            const prodName = isAr ? neg.productNameAr : (neg.productNameEn || neg.productNameAr)

            return (
              <div
                key={neg.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 hover:border-[#1266D6] hover:shadow-sm transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {neg.negotiationNumber}
                    </span>
                    <Badge variant={statusInfo.variant}>
                      {isAr ? statusInfo.ar : statusInfo.en}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {isAr ? `جولة ${neg.currentRound}` : `Round ${neg.currentRound}`}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#06245B] text-lg">
                    {prodName}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building2 size={13} className="text-[#1266D6]" />
                      <strong>{isAr ? 'المشتري:' : 'Buyer:'}</strong> {neg.buyerCompanyName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 size={13} className="text-emerald-600" />
                      <strong>{isAr ? 'المورد:' : 'Supplier:'}</strong> {neg.supplierCompanyName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {formatDateTime(neg.createdAtUtc)}
                    </span>
                  </div>
                </div>

                {/* Terms preview & Action link */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <div className="text-start md:text-end">
                    <span className="text-xs text-slate-400 block">
                      {isAr ? 'السعر والكمية الحالية:' : 'Current Terms:'}
                    </span>
                    <span className="text-base font-extrabold text-[#06245B]">
                      {(neg.currentProposedUnitPrice ?? neg.currentUnitPrice)?.toLocaleString()} {neg.currency}
                    </span>
                    <span className="text-xs text-slate-500 block font-semibold">
                      {neg.currentProposedQuantity ?? neg.quantity} {neg.productUnit || neg.unit || 'ton'}
                    </span>
                  </div>

                  <Button
                    as={Link}
                    to={`/negotiations/${neg.id}`}
                    variant="primary"
                    size="sm"
                    icon={isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                  >
                    {isAr ? 'تفاصيل الجولة' : 'View Details'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

