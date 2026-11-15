import { useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  Handshake,
  AlertCircle,
  PlusCircle,
  ShieldCheck,
  Building2,
  Inbox,
  Send,
  Package,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { usePermissions } from '../../hooks/usePermissions'
import { useTranslation } from '../../hooks/useTranslation'
import { rfqService } from '../../shared/api/services/rfqService'
import { offerService } from '../../shared/api/services/offerService'
import { dealService } from '../../shared/api/services/dealService'
import { negotiationService } from '../../shared/api/services/negotiationService'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { formatCurrency, formatDate } from '../../utils/format'
import { statusMeta } from '../../utils/statusLabels'

const STALE = 60_000
const asItems = (d) => (Array.isArray(d) ? d : d?.items || d?.Items || [])

/* ------------------------------ UI pieces ------------------------------ */

function KpiCard({ to, icon: Icon, title, value, loading, attention = false, hint, numberFormat }) {
  const highlight = attention && value > 0
  return (
    <Link
      to={to}
      className={`group bg-white rounded-3xl p-5 border shadow-xs transition-all hover:shadow-md flex items-start gap-4 ${
        highlight ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200/80 hover:border-[#1266D6]'
      }`}
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${highlight ? 'bg-amber-100 text-amber-700' : 'bg-[#EAF4FF] text-[#1266D6]'}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 leading-snug">{title}</p>
        {loading ? (
          <div className="h-8 w-12 mt-1 bg-slate-100 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-extrabold text-[#06245B] leading-tight mt-0.5">{numberFormat.format(value ?? 0)}</p>
        )}
        {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
      </div>
    </Link>
  )
}

function ListPanel({ title, to, linkLabel, loading, isError, emptyText, children, footer }) {
  const rows = Array.isArray(children) ? children : children ? [children] : []
  return (
    <section className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h2 className="font-bold text-[#06245B] text-base">{title}</h2>
          {to && (
            <Link to={to} className="text-xs font-semibold text-[#1266D6] hover:underline shrink-0">
              {linkLabel}
            </Link>
          )}
        </div>
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse space-y-2">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-44 bg-slate-200 rounded" />
              </div>
            ))
          ) : isError ? (
            <p className="text-xs text-red-500 py-6 text-center">{emptyText?.error}</p>
          ) : rows.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">{emptyText?.empty}</p>
          ) : (
            rows
          )}
        </div>
      </div>
      {footer && <div className="mt-4 pt-3 border-t border-slate-100">{footer}</div>}
    </section>
  )
}

const rowClass =
  'p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#1266D6]/40 flex items-center justify-between gap-3 transition-colors'

/* -------------------------------- page -------------------------------- */

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const t = (ar, en) => (isAr ? ar : en)
  const { hasCompany, isVerified, isBuyer, isSupplier } = usePermissions()

  const isAdmin = !!user?.isSystemAdmin
  const companyId = (user?.company?.id || '').toLowerCase()
  const ready = hasCompany && isVerified && !isAdmin
  const buyerReady = ready && isBuyer
  const supplierReady = ready && isSupplier
  const numberFormat = useMemo(() => new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US'), [isAr])
  const Arrow = isAr ? ArrowLeft : ArrowRight

  // قوائم حديثة
  const rfqsMine = useQuery({ queryKey: ['rfqs', 'mine', { pageSize: 5 }], queryFn: () => rfqService.getMine({ pageNumber: 1, pageSize: 5 }), enabled: buyerReady, staleTime: STALE })
  const offersReceived = useQuery({ queryKey: ['offers', 'received', { pageSize: 5 }], queryFn: () => offerService.getReceived({ pageNumber: 1, pageSize: 5 }), enabled: buyerReady, staleTime: STALE })
  const rfqsOpen = useQuery({ queryKey: ['rfqs', 'discover', { pageSize: 5 }], queryFn: () => rfqService.discover({ pageNumber: 1, pageSize: 5 }), enabled: supplierReady, staleTime: STALE })
  const offersMine = useQuery({ queryKey: ['offers', 'mine', { pageSize: 5 }], queryFn: () => offerService.getMine({ pageNumber: 1, pageSize: 5 }), enabled: supplierReady, staleTime: STALE })
  const deals = useQuery({ queryKey: ['deals', 'mine', { pageSize: 5 }], queryFn: () => dealService.getMine({ pageNumber: 1, pageSize: 5 }), enabled: ready, staleTime: STALE })

  // أعداد حقيقية بفلتر الحالة من السيرفر (totalCount)
  const activeRfqs = useQuery({ queryKey: ['rfqs', 'mine', 'count', 'Published'], queryFn: () => rfqService.getMine({ status: 'Published', pageNumber: 1, pageSize: 1 }), enabled: buyerReady, staleTime: STALE })
  const pendingReceived = useQuery({ queryKey: ['offers', 'received', 'count', 'Submitted'], queryFn: () => offerService.getReceived({ status: 'Submitted', pageNumber: 1, pageSize: 1 }), enabled: buyerReady, staleTime: STALE })
  const pendingMine = useQuery({ queryKey: ['offers', 'mine', 'count', 'Submitted'], queryFn: () => offerService.getMine({ status: 'Submitted', pageNumber: 1, pageSize: 1 }), enabled: supplierReady, staleTime: STALE })
  const dealsAwaiting = useQuery({ queryKey: ['deals', 'mine', 'count', 'AwaitingConfirmation'], queryFn: () => dealService.getMine({ status: 'AwaitingConfirmation', pageNumber: 1, pageSize: 1 }), enabled: ready, staleTime: STALE })
  const negotiations = useQuery({ queryKey: ['negotiations', 'mine', { pageSize: 50 }], queryFn: () => negotiationService.getMine({ pageNumber: 1, pageSize: 50 }), enabled: ready, staleTime: 30_000 })

  const awaitingStatus = isSupplier ? 'PendingSupplierResponse' : 'CounterofferPendingBuyerResponse'
  const negotiationsAwaiting = useMemo(
    () => asItems(negotiations.data).filter((n) => n.status === awaitingStatus).length,
    [negotiations.data, awaitingStatus]
  )

  // بعد كل الـ Hooks
  if (isAdmin) return <Navigate to="/admin/analytics" replace />

  if (!hasCompany) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-3xl p-8 border border-[rgba(6,36,91,0.08)] shadow-xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#EAF4FF] rounded-2xl flex items-center justify-center">
            <Building2 size={40} className="text-[#1266D6]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#06245B] mb-3">
            {t('أكمل تسجيل شركتك', 'Complete your company profile')}
          </h1>
          <p className="text-[#64748B] mb-8 max-w-lg mx-auto leading-relaxed">
            {t(
              'لنشر طلبات الأسعار أو تقديم العروض أو عرض المنتجات، سجّل بيانات شركتك ثم ارفع مستندات التوثيق.',
              'To publish RFQs, submit offers or list products, register your company and upload verification documents.'
            )}
          </p>
          <Button as={Link} to="/onboarding/company" variant="primary" size="lg">
            {t('ابدأ تسجيل الشركة', 'Start company onboarding')}
          </Button>
        </div>
      </div>
    )
  }

  if (!isVerified) {
    const vs = user?.company?.verificationStatus
    const state =
      vs === 'Rejected' ? 'rejected'
        : vs === 'ChangesRequested' ? 'changes'
          : vs === 'Draft' || vs === 'NotSubmitted' ? 'notSubmitted'
            : 'pending'
    const copy = {
      pending: [t('قيد المراجعة', 'Under review'), t('فريق DealZone يراجع مستندات شركتك. سنخبرك فور اعتمادها.', 'The DealZone team is reviewing your documents. We will notify you once approved.'), t('متابعة حالة المستندات', 'View document status')],
      notSubmitted: [t('بانتظار المستندات', 'Documents needed'), t('ارفع السجل التجاري والبطاقة الضريبية وأرسلها للمراجعة.', 'Upload your commercial registration and tax card, then submit for review.'), t('رفع المستندات', 'Upload documents')],
      changes: [t('مطلوب تعديلات', 'Changes requested'), t('طلب فريق المراجعة تعديلات على مستنداتك. حدّثها وأعد الإرسال.', 'The review team requested changes. Update your documents and resubmit.'), t('تعديل المستندات', 'Update documents')],
      rejected: [t('تم رفض التوثيق', 'Verification rejected'), t('لم يتم اعتماد المستندات. راجع الملاحظات وأعد المحاولة.', 'Your documents were not approved. Review the notes and try again.'), t('عرض الملاحظات', 'View notes')],
    }[state]
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-lg flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200">
            <AlertCircle size={32} className="text-amber-500" />
          </div>
          <div className="text-center sm:text-start flex-1">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-3">{copy[0]}</span>
            <h1 className="text-xl font-bold text-[#06245B] mb-2">
              {t('توثيق الشركة مطلوب لبدء التعامل', 'Company verification is required to start trading')}
            </h1>
            <p className="text-[#64748B] text-sm leading-relaxed mb-6">{copy[1]}</p>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <Button as={Link} to="/onboarding/verification" variant="primary" size="sm">{copy[2]}</Button>
              <Button as={Link} to="/catalog" variant="outline" size="sm">{t('استعراض الكتالوج', 'Browse catalog')}</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const company = user?.company
  const location = [company?.city, company?.governorate].filter(Boolean).join(', ')
  const dealRows = asItems(deals.data)

  const kpis = isBuyer
    ? [
        { to: '/rfqs', icon: FileText, title: t('طلبات الأسعار المنشورة', 'Published RFQs'), q: activeRfqs, hint: t('تستقبل عروض الموردين', 'Receiving supplier offers') },
        { to: '/offers', icon: Inbox, title: t('عروض بانتظار قرارك', 'Offers awaiting your decision'), q: pendingReceived, attention: true },
        { to: '/negotiations?f=action', icon: Handshake, title: t('مفاوضات تنتظر ردك', 'Negotiations awaiting you'), value: negotiationsAwaiting, loading: negotiations.isLoading, attention: true },
        { to: '/deals', icon: CheckCircle2, title: t('صفقات بانتظار التأكيد', 'Deals awaiting confirmation'), q: dealsAwaiting, attention: true },
      ]
    : [
        { to: '/rfqs', icon: Layers, title: t('طلبات أسعار متاحة لك', 'RFQs available to you'), q: rfqsOpen, hint: t('تشمل الموجّهة إليك مباشرة', 'Includes those sent directly to you') },
        { to: '/offers', icon: Send, title: t('عروضي بانتظار قرار المشتري', 'Offers awaiting buyer decision'), q: pendingMine },
        { to: '/negotiations?f=action', icon: Handshake, title: t('مفاوضات تنتظر ردك', 'Negotiations awaiting you'), value: negotiationsAwaiting, loading: negotiations.isLoading, attention: true },
        { to: '/deals', icon: CheckCircle2, title: t('صفقات بانتظار التأكيد', 'Deals awaiting confirmation'), q: dealsAwaiting, attention: true },
      ]

  const rfqRow = (rfq) => {
    const meta = statusMeta('rfq', rfq.status, isAr)
    const direct = rfq.targetSupplierCompanyId && String(rfq.targetSupplierCompanyId).toLowerCase() === companyId
    return (
      <Link key={rfq.id} to={`/rfqs/${rfq.id}`} className={rowClass}>
        <div className="min-w-0">
          <span className="text-xs font-mono text-slate-400 block mb-0.5">{rfq.rfqNumber}</span>
          <span className="font-bold text-slate-800 text-sm block truncate">{rfq.title}</span>
          <span className="text-xs text-slate-500 block mt-0.5 truncate">
            {isSupplier ? `${t('المشتري: ', 'Buyer: ')}${rfq.buyerCompanyName ?? ''}` : formatDate(rfq.createdAtUtc)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {direct && <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">{t('موجّه إليك', 'Sent to you')}</span>}
          {isBuyer && <Badge variant={meta.variant}>{meta.label}</Badge>}
        </div>
      </Link>
    )
  }

  const offerRow = (offer) => {
    const meta = statusMeta('offer', offer.status, isAr)
    return (
      <Link key={offer.id} to="/offers" className={rowClass}>
        <div className="min-w-0">
          <span className="text-xs font-mono text-slate-400 block mb-0.5">{offer.offerNumber}</span>
          <span className="font-bold text-slate-800 text-sm block truncate">{offer.rfqTitle || offer.rfqNumber}</span>
          {isBuyer && <span className="text-xs text-[#1266D6] font-semibold block mt-0.5 truncate">{offer.supplierCompanyName}</span>}
        </div>
        <div className="text-end shrink-0 space-y-1">
          <span className="font-bold text-[#06245B] text-sm block">{formatCurrency(offer.totalAmount, offer.currency)}</span>
          <Badge variant={meta.variant} size="xs">{meta.label}</Badge>
        </div>
      </Link>
    )
  }

  const dealRow = (deal) => {
    const meta = statusMeta('deal', deal.status, isAr)
    const other = isBuyer ? deal.supplierCompanyName : deal.buyerCompanyName
    const amount = deal.totalAmount ?? deal.agreedPrice
    return (
      <Link key={deal.id} to={`/deals/${deal.id}`} className={rowClass}>
        <div className="min-w-0">
          <span className="text-xs font-mono text-slate-400 block mb-0.5">{deal.dealNumber}</span>
          <span className="font-bold text-slate-800 text-sm block truncate">{other}</span>
          <span className="text-xs text-slate-500 block mt-0.5">{formatDate(deal.createdAtUtc)}</span>
        </div>
        <div className="text-end shrink-0 space-y-1">
          {amount != null && <span className="font-bold text-[#06245B] text-sm block">{formatCurrency(amount, deal.currency)}</span>}
          <Badge variant={meta.variant} size="xs">{meta.label}</Badge>
        </div>
      </Link>
    )
  }

  const errText = { empty: '', error: t('تعذّر التحميل', 'Could not load') }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#06245B] via-[#0A3078] to-[#1266D6] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#00D9F5] text-xs font-bold">
                <ShieldCheck size={14} />
                {t('شركة موثقة', 'Verified company')}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold">
                {isBuyer ? t('حساب مشتري', 'Buyer account') : t('حساب مورد', 'Supplier account')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
              {t(`مرحبًا، ${user?.fullName ?? ''}`, `Welcome back, ${user?.fullName ?? ''}`)}
            </h1>
            <p className="text-slate-200 text-sm truncate">
              {company?.tradeName || company?.legalName}
              {location && ` • ${location}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isBuyer ? (
              <>
                <Button as={Link} to="/rfqs/create" variant="primary" size="md" icon={<PlusCircle size={18} />} className="font-bold">
                  {t('طلب سعر جديد', 'New RFQ')}
                </Button>
                <Button as={Link} to="/marketplace" variant="outline-white" size="md">
                  {t('تصفح السوق', 'Browse marketplace')}
                </Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/rfqs" variant="primary" size="md" icon={<Send size={18} />} className="font-bold">
                  {t('طلبات الأسعار المتاحة', 'Browse RFQs')}
                </Button>
                <Button as={Link} to="/catalog/my-products" variant="outline-white" size="md" icon={<Package size={18} />}>
                  {t('منتجاتي', 'My products')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPIs: الأرقام كلها من البيانات الفعلية */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard
            key={k.title}
            to={k.to}
            icon={k.icon}
            title={k.title}
            hint={k.hint}
            attention={k.attention}
            value={k.value ?? k.q?.data?.totalCount ?? 0}
            loading={k.loading ?? k.q?.isLoading}
            numberFormat={numberFormat}
          />
        ))}
      </div>

      {/* Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isBuyer ? (
          <>
            <ListPanel
              title={t('أحدث طلبات الأسعار', 'Recent RFQs')}
              to="/rfqs"
              linkLabel={t('عرض الكل', 'View all')}
              loading={rfqsMine.isLoading}
              isError={rfqsMine.isError}
              emptyText={{ ...errText, empty: t('لا توجد طلبات أسعار بعد', 'No RFQs yet') }}
              footer={<Button as={Link} to="/rfqs/create" variant="primary" size="sm" fullWidth>{t('إنشاء طلب سعر', 'Create RFQ')}</Button>}
            >
              {asItems(rfqsMine.data).slice(0, 4).map(rfqRow)}
            </ListPanel>
            <ListPanel
              title={t('عروض الموردين المستلمة', 'Received offers')}
              to="/offers"
              linkLabel={t('عرض الكل', 'View all')}
              loading={offersReceived.isLoading}
              isError={offersReceived.isError}
              emptyText={{ ...errText, empty: t('لا توجد عروض مستلمة بعد', 'No offers received yet') }}
            >
              {asItems(offersReceived.data).slice(0, 4).map(offerRow)}
            </ListPanel>
          </>
        ) : (
          <>
            <ListPanel
              title={t('طلبات أسعار مفتوحة', 'Open RFQs')}
              to="/rfqs"
              linkLabel={t('عرض الكل', 'View all')}
              loading={rfqsOpen.isLoading}
              isError={rfqsOpen.isError}
              emptyText={{ ...errText, empty: t('لا توجد طلبات مفتوحة حاليًا', 'No open RFQs right now') }}
            >
              {asItems(rfqsOpen.data).slice(0, 4).map(rfqRow)}
            </ListPanel>
            <ListPanel
              title={t('عروضي المقدمة', 'My submitted offers')}
              to="/offers"
              linkLabel={t('عرض الكل', 'View all')}
              loading={offersMine.isLoading}
              isError={offersMine.isError}
              emptyText={{ ...errText, empty: t('لم تقدم عروضًا بعد', 'No offers submitted yet') }}
            >
              {asItems(offersMine.data).slice(0, 4).map(offerRow)}
            </ListPanel>
          </>
        )}
      </div>

      <ListPanel
        title={isBuyer ? t('أحدث صفقات الشراء', 'Recent purchasing deals') : t('أحدث صفقات البيع', 'Recent sales deals')}
        to="/deals"
        linkLabel={t('عرض الكل', 'View all')}
        loading={deals.isLoading}
        isError={deals.isError}
        emptyText={{ ...errText, empty: t('لا توجد صفقات بعد. تظهر هنا بعد قبول عرض أو اتفاق مفاوضة.', 'No deals yet. They appear after an offer is accepted or a negotiation is agreed.') }}
        footer={
          <Link to="/deals" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1266D6] hover:text-[#06245B]">
            {t('إدارة الصفقات', 'Manage deals')} <Arrow size={14} />
          </Link>
        }
      >
        {dealRows.slice(0, 5).map(dealRow)}
      </ListPanel>
    </div>
  )
}