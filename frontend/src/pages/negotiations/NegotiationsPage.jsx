import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Handshake, ArrowRight, ArrowLeft, Clock, Building2, AlertCircle } from 'lucide-react'
import { negotiationService } from '../../shared/api/services/negotiationService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { formatDateTime } from '../../utils/format'
import { statusMeta } from '../../utils/statusLabels'

const PAGE_SIZE = 50
const FILTERS = ['all', 'action', 'active', 'closed']
const CLOSED = ['Accepted', 'Rejected', 'Cancelled', 'Expired']

const statusOf = (n) => n.statusName || n.status
const isOpen = (n) => !CLOSED.includes(statusOf(n))

const asItems = (data) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.items || data.Items || []
}

export default function NegotiationsPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const t = (ar, en) => (isAr ? ar : en)
  const { isSupplier } = usePermissions()
  const [params, setParams] = useSearchParams()
  const filterParam = params.get('f')
  const filter = FILTERS.includes(filterParam) ? filterParam : 'all'
  const numberFormat = useMemo(() => new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US'), [isAr])
  const Arrow = isAr ? ArrowLeft : ArrowRight

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['negotiations', 'mine', { pageSize: PAGE_SIZE }],
    queryFn: () => negotiationService.getMine({ pageNumber: 1, pageSize: PAGE_SIZE }),
    staleTime: 15_000,
  })

  // The party whose turn it is: supplier waits for PendingSupplierResponse, buyer waits for CounterofferPendingBuyerResponse
  const needsMyAction = (n) => isOpen(n) && n.lastActionByCompanyId === (isSupplier ? n.buyerCompanyId : n.supplierCompanyId)

  const all = useMemo(() => asItems(data), [data])
  const counts = useMemo(
    () => ({
      all: all.length,
      action: all.filter(needsMyAction).length,
      active: all.filter(isOpen).length,
      closed: all.filter((n) => !isOpen(n)).length,
    }),
    [all] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const items = useMemo(() => {
    const filtered = all.filter((n) =>
      filter === 'action' ? needsMyAction(n)
        : filter === 'active' ? isOpen(n)
          : filter === 'closed' ? !isOpen(n)
            : true
    )
    return [...filtered].sort((a, b) => {
      const byAction = Number(needsMyAction(b)) - Number(needsMyAction(a))
      if (byAction) return byAction
      return new Date(b.updatedAtUtc || b.createdAtUtc || 0) - new Date(a.updatedAtUtc || a.createdAtUtc || 0)
    })
  }, [all, filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (f) =>
    setParams((p) => {
      const next = new URLSearchParams(p)
      if (f === 'all') next.delete('f')
      else next.set('f', f)
      return next
    }, { replace: true })

  const tabLabels = {
    all: t('الكل', 'All'),
    action: t('ينتظر ردك', 'Needs your response'),
    active: t('جارية', 'Active'),
    closed: t('مغلقة', 'Closed'),
  }

  const truncated = data?.totalCount != null && data.totalCount > all.length

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1266D6] text-xs font-bold mb-2">
          <Handshake size={14} />
          <span>{t('التفاوض على الأسعار', 'Price negotiations')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] tracking-tight">
          {t('المفاوضات', 'Negotiations')}
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          {isSupplier
            ? t('عروض المشترين على منتجاتك. ردّ بالقبول أو الرفض أو عرض مضاد.', 'Buyer offers on your products. Accept, reject or send a counteroffer.')
            : t('تابع عروضك على منتجات الموردين والعروض المضادة والصفقات الناتجة عنها.', 'Track your offers on supplier products, counteroffers and the resulting deals.')}
        </p>

        <div role="tablist" aria-label={t('تصفية المفاوضات', 'Filter negotiations')} className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
                filter === f ? 'bg-[#06245B] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tabLabels[f]}
              <span
                className={`min-w-5 px-1.5 rounded-full text-[10px] ${
                  filter === f ? 'bg-white/20' : f === 'action' && counts.action > 0 ? 'bg-amber-500 text-white' : 'bg-white text-slate-500'
                }`}
              >
                {numberFormat.format(counts[f])}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl border border-slate-200/80 p-6 animate-pulse space-y-3">
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-4 w-32 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl p-12 border border-red-200 text-center space-y-4">
          <AlertCircle size={36} className="mx-auto text-red-500" />
          <p className="text-sm text-slate-600">{t('تعذّر تحميل المفاوضات.', 'Could not load negotiations.')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>{t('إعادة المحاولة', 'Retry')}</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
          <EmptyState
            icon={Handshake}
            title={filter === 'all' ? t('لا توجد مفاوضات', 'No negotiations') : t('لا توجد نتائج في هذا التصنيف', 'Nothing in this view')}
            description={
              filter !== 'all'
                ? t('جرّب تصنيفًا آخر.', 'Try another view.')
                : isSupplier
                  ? t('ستظهر هنا عروض المشترين على منتجاتك.', 'Buyer offers on your products will appear here.')
                  : t('ابدأ مفاوضة من صفحة أي منتج في السوق.', 'Start a negotiation from any product in the marketplace.')
            }
            action={
              filter !== 'all' ? (
                <Button variant="outline" size="sm" onClick={() => setFilter('all')}>{t('عرض الكل', 'Show all')}</Button>
              ) : !isSupplier ? (
                <Button as={Link} to="/marketplace" variant="primary" size="sm">{t('تصفح السوق', 'Browse marketplace')}</Button>
              ) : null
            }
          />
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((neg) => {
            const meta = statusMeta('negotiation', statusOf(neg), isAr)
            const mine = needsMyAction(neg)
            const name = isAr ? neg.productNameAr || neg.productNameEn : neg.productNameEn || neg.productNameAr
            const counterparty = isSupplier
              ? { label: t('المشتري', 'Buyer'), name: neg.buyerCompanyName, to: `/buyers/${neg.buyerCompanyId}`, ok: !!neg.buyerCompanyId }
              : { label: t('المورد', 'Supplier'), name: neg.supplierCompanyName, to: `/suppliers/${neg.supplierCompanyId}`, ok: !!neg.supplierCompanyId }
            const price = neg.currentProposedUnitPrice ?? neg.currentUnitPrice
            const qty = neg.currentProposedQuantity ?? neg.quantity
            const unit = neg.productUnit || neg.unit
            const total = typeof price === 'number' && typeof qty === 'number' ? price * qty : null

            return (
              <li
                key={neg.id}
                className={`relative bg-white rounded-3xl border p-5 sm:p-6 transition-all duration-200 hover:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  mine ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/80 hover:border-[#1266D6]'
                }`}
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{neg.negotiationNumber}</span>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    {mine && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        {t('دورك الآن', 'Your turn')}
                      </span>
                    )}
                    {neg.currentRound != null && (
                      <span className="text-xs text-slate-400">{t(`جولة ${neg.currentRound}`, `Round ${neg.currentRound}`)}</span>
                    )}
                  </div>

                  <h3 className="font-bold text-[#06245B] text-lg truncate">
                    <Link to={`/negotiations/${neg.id}`} className="after:absolute after:inset-0 after:rounded-3xl focus:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#1266D6]">
                      {name}
                    </Link>
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Building2 size={13} className="text-[#1266D6]" />
                      <strong>{counterparty.label}:</strong>
                      {counterparty.ok ? (
                        <Link to={counterparty.to} className="relative z-10 text-[#06245B] hover:text-[#1266D6] hover:underline">
                          {counterparty.name}
                        </Link>
                      ) : (
                        counterparty.name
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {formatDateTime(neg.updatedAtUtc || neg.createdAtUtc)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <div className="text-start md:text-end">
                    <span className="text-xs text-slate-400 block">{t('الشروط الحالية', 'Current terms')}</span>
                    {typeof price === 'number' && (
                      <span className="text-base font-extrabold text-[#06245B] block">
                        {numberFormat.format(price)} {neg.currency}
                        {unit && <span className="text-xs font-normal text-slate-400"> / {unit}</span>}
                      </span>
                    )}
                    {typeof qty === 'number' && (
                      <span className="text-xs text-slate-500 block font-semibold">
                        {numberFormat.format(qty)} {unit}
                        {total != null && ` · ${numberFormat.format(total)} ${neg.currency || ''}`}
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1266D6]" aria-hidden="true">
                    {mine ? t('ردّ الآن', 'Respond') : t('التفاصيل', 'Details')}
                    <Arrow size={14} />
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {truncated && (
        <p className="text-center text-xs text-slate-400">
          {t(`يتم عرض أحدث ${PAGE_SIZE} مفاوضة.`, `Showing the latest ${PAGE_SIZE} negotiations.`)}
        </p>
      )}
    </div>
  )
}