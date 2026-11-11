import { useState, useEffect, useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  Package,
  FileText,
  Handshake,
  AlertCircle,
  PlusCircle,
  Truck,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Inbox,
  Send,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { usePermissions } from '../../hooks/usePermissions'
import { useTranslation } from '../../hooks/useTranslation'
import { rfqService } from '../../shared/api/services/rfqService'
import { offerService } from '../../shared/api/services/offerService'
import { dealService } from '../../shared/api/services/dealService'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import StatKpiCard from '../../components/charts/StatKpiCard'
import BarChart from '../../components/charts/BarChart'
import DonutChart from '../../components/charts/DonutChart'
import AreaTrendChart from '../../components/charts/AreaTrendChart'
import { formatCurrency, formatDate } from '../../utils/format'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const {
    hasCompany,
    isVerified,
    canManageRfqs,
    canSubmitOffers,
    isOwner,
    isAdmin,
    isProcurementManager,
    isSalesManager,
    role,
  } = usePermissions()

  const {
    companyType,
    isBuyer,
    isSupplier,
    isBuyerOnly,
    isSupplierOnly,
    hasBothCapabilities,
  } = usePermissions()

  // Active dashboard view mode: 'buyer' or 'supplier'
  const [dashboardMode, setDashboardMode] = useState(
    isSupplierOnly ? 'supplier' : 'buyer'
  )

  useEffect(() => {
    if (isSupplierOnly && dashboardMode !== 'supplier') {
      setDashboardMode('supplier')
    } else if (isBuyerOnly && dashboardMode !== 'buyer') {
      setDashboardMode('buyer')
    }
  }, [isSupplierOnly, isBuyerOnly])

  const [activeChartTab, setActiveChartTab] = useState('volume')

  // 1. System admin separation: redirect to admin analytics portal
  if (user?.isSystemAdmin) {
    return <Navigate to="/admin/analytics" replace />
  }

  // 2. Company onboarding check
  if (!hasCompany) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-3xl p-8 border border-[rgba(6,36,91,0.08)] shadow-xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#EAF4FF] rounded-2xl flex items-center justify-center shadow-inner">
            <Building2 size={40} className="text-[#1266D6]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#06245B] mb-3">
            {isAr ? 'أكمل تسجيل شركتك الصناعية' : 'Complete Your Enterprise Profile'}
          </h2>
          <p className="text-[#64748B] mb-8 max-w-lg mx-auto leading-relaxed">
            {isAr
              ? 'للوصول إلى الكتالوج ونشر طلبات الأسعار أو تقديم العروض، يجب تسجيل بيانات الشركة والتحقق من السجل التجاري والبطاقة الضريبية.'
              : 'To access industrial catalogs, publish RFQs, or submit offers, please provide your registered business credentials and commercial tax information.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Button as={Link} to="/onboarding/company" variant="primary" size="lg" fullWidth>
              {isAr ? 'بدء تسجيل الشركة الآن' : 'Start Company Onboarding'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 3. Verification pending check
  if (!isVerified) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white rounded-3xl p-8 border border-[rgba(245,158,11,0.3)] shadow-lg">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-16 h-16 bg-[rgba(245,158,11,0.08)] rounded-2xl flex items-center justify-center shrink-0 border border-[rgba(245,158,11,0.3)]">
              <AlertCircle size={32} className="text-[#F59E0B]" />
            </div>
            <div className="text-center sm:text-start flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(245,158,11,0.1)] text-[#92400E] text-xs font-bold mb-3">
                <span>{isAr ? 'قيد التدقيق والمراجعة' : 'Verification Under Review'}</span>
              </div>
              <h2 className="text-xl font-bold text-[#06245B] mb-2">
                {isAr ? 'ملف شركتك يخضع للتحقق القانوني' : 'Company Credentials Under Review'}
              </h2>
              <p className="text-[#64748B] text-sm leading-relaxed mb-6">
                {isAr
                  ? 'يقوم فريق DealZone بمراجعة السجل التجاري والبطاقة الضريبية المرفقة لضمان أمان المعاملات. يمكنك تصفح الكتالوج ريثما يتم اعتماد الحساب.'
                  : 'Our compliance officers are vetting your commercial registration and tax card documents. You can explore the industrial taxonomy and catalog while awaiting approval.'}
              </p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                <Button as={Link} to="/onboarding/verification" variant="primary" size="sm">
                  {isAr ? 'متابعة حالة المستندات' : 'View Uploaded Documents'}
                </Button>
                <Button as={Link} to="/catalog" variant="outline" size="sm">
                  {isAr ? 'استعراض المواد الخام' : 'Browse Materials Catalog'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Live Data Queries
  // Buyer: My RFQs
  const { data: myRfqsData, isLoading: myRfqsLoading } = useQuery({
    queryKey: ['rfqs', 'mine', { pageSize: 5 }],
    queryFn: () => rfqService.getMine({ pageNumber: 1, pageSize: 5 }),
    enabled: isVerified && dashboardMode === 'buyer',
    staleTime: 60_000,
  })

  // Buyer: Received offers on RFQs
  const { data: receivedOffersData, isLoading: receivedOffersLoading } = useQuery({
    queryKey: ['offers', 'received', { pageSize: 5 }],
    queryFn: () => offerService.getReceived({ pageNumber: 1, pageSize: 5 }),
    enabled: isVerified && dashboardMode === 'buyer',
    staleTime: 60_000,
  })

  // Supplier: Open Market RFQs to Bid On
  const { data: openRfqsData, isLoading: openRfqsLoading } = useQuery({
    queryKey: ['rfqs', 'discover', { status: 'Published', pageSize: 5 }],
    queryFn: () => rfqService.discover({ pageNumber: 1, pageSize: 5 }),
    enabled: isVerified && dashboardMode === 'supplier',
    staleTime: 60_000,
  })

  // Supplier: My Submitted Offers
  const { data: myOffersData, isLoading: myOffersLoading } = useQuery({
    queryKey: ['offers', 'mine', { pageSize: 5 }],
    queryFn: () => offerService.getMine({ pageNumber: 1, pageSize: 5 }),
    enabled: isVerified && dashboardMode === 'supplier',
    staleTime: 60_000,
  })

  // Deals
  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals', 'mine', { pageSize: 5 }],
    queryFn: () => dealService.getMine({ pageNumber: 1, pageSize: 5 }),
    enabled: isVerified,
    staleTime: 60_000,
  })

  const currentCompanyId = (user?.company?.id || '').toLowerCase()
  const myDeals = dealsData?.items || []
  const buyingDeals = myDeals.filter((d) => (d.buyerCompanyId || '').toLowerCase() === currentCompanyId)
  const sellingDeals = myDeals.filter((d) => (d.supplierCompanyId || '').toLowerCase() === currentCompanyId)
  const hasDeals = myDeals.length > 0

  // Calculate volume index dynamically from real persisted database deals
  const sourcingVolumeData = useMemo(() => {
    if (!hasDeals) return []
    const monthsMap = {}
    const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    myDeals.forEach((deal) => {
      const dt = new Date(deal.createdAtUtc || Date.now())
      const mIdx = dt.getMonth()
      const label = isAr ? monthNamesAr[mIdx] : monthNamesEn[mIdx]
      const val = Number(deal.agreedPrice ? deal.agreedPrice / 1000 : 50)
      monthsMap[label] = (monthsMap[label] || 0) + Math.round(val)
    })
    return Object.entries(monthsMap).map(([label, value]) => ({ label, value }))
  }, [myDeals, hasDeals, isAr])

  // Calculate industrial category split dynamically from actual transactions
  const categoryBreakdown = useMemo(() => {
    if (!hasDeals) return []
    const sectorMap = {}
    const colors = ['#06245B', '#1266D6', '#00D9F5']
    myDeals.forEach((deal) => {
      const sector = deal.targetCategoryName || (isAr ? 'معادن وصلب' : 'Metals & Steel')
      sectorMap[sector] = (sectorMap[sector] || 0) + 1
    })
    const total = Object.values(sectorMap).reduce((a, b) => a + b, 0) || 1
    return Object.entries(sectorMap).map(([label, count], i) => ({
      label,
      value: Math.round((count / total) * 100),
      color: colors[i % colors.length],
    }))
  }, [myDeals, hasDeals, isAr])

  return (
    <div className="space-y-8 animate-fade-in overflow-x-hidden">
      {/* ============================================================
          EXECUTIVE WELCOME BANNER WITH ROLE TOGGLE
          ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#06245B] via-[#0A3078] to-[#1266D6] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[#00D9F5] text-xs font-bold">
                <ShieldCheck size={14} />
                <span>{isAr ? 'حساب تجاري معتمد' : 'Verified Enterprise Counterparty'}</span>
              </div>

              {/* Dual Role Selector Pill */}
              {hasBothCapabilities && (
                <div className="inline-flex rounded-full bg-black/20 backdrop-blur-md p-1 border border-white/15 text-xs font-bold">
                  <button
                    onClick={() => setDashboardMode('buyer')}
                    className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${dashboardMode === 'buyer'
                        ? 'bg-white text-[#06245B] shadow-sm font-extrabold'
                        : 'text-slate-300 hover:text-white'
                      }`}
                  >
                    <span>🛒</span>
                    <span>{isAr ? 'لوحة المشتري' : 'Buyer View'}</span>
                  </button>
                  <button
                    onClick={() => setDashboardMode('supplier')}
                    className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${dashboardMode === 'supplier'
                        ? 'bg-white text-[#06245B] shadow-sm font-extrabold'
                        : 'text-slate-300 hover:text-white'
                      }`}
                  >
                    <span>🏭</span>
                    <span>{isAr ? 'لوحة المورد' : 'Supplier View'}</span>
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              {isAr ? `مرحباً، ${user?.fullName}` : `Welcome back, ${user?.fullName}`}
            </h1>
            <p className="text-slate-200 text-sm max-w-xl">
              {user?.company?.tradeName || user?.company?.legalName} •{' '}
              <span className="text-[#00D9F5] font-semibold">
                {dashboardMode === 'buyer'
                  ? isAr ? 'مسؤول المشتريات والتوريد' : 'Procurement Manager'
                  : isAr ? 'مسؤول المبيعات والتعاقدات' : 'Sales & Supply Manager'}
              </span> •{' '}
              {user?.company?.city}, {user?.company?.governorate}
            </p>
          </div>

          {/* Quick Action Buttons according to active mode */}
          <div className="flex flex-wrap items-center gap-3">
            {dashboardMode === 'buyer' ? (
              <>
                <Button
                  as={Link}
                  to="/rfqs/create"
                  variant="primary"
                  size="md"
                  icon={<PlusCircle size={18} />}
                  className="font-bold shadow-md shadow-cyan-500/20"
                >
                  {isAr ? 'طرح طلب سعر (RFQ)' : 'Post New RFQ'}
                </Button>
                <Button
                  as={Link}
                  to="/catalog"
                  variant="outline-white"
                  size="md"
                >
                  {isAr ? 'تصفح الكتالوج' : 'Browse Materials'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  as={Link}
                  to="/rfqs"
                  variant="primary"
                  size="md"
                  icon={<Send size={18} />}
                  className="font-bold shadow-md shadow-cyan-500/20"
                >
                  {isAr ? 'استعراض طلبات الأسعار' : 'Browse Open RFQs'}
                </Button>
                <Button
                  as={Link}
                  to="/offers"
                  variant="outline-white"
                  size="md"
                >
                  {isAr ? 'إدارة عروضي' : 'My Submitted Offers'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          ROLE-SPECIFIC KPI CARDS
          ============================================================ */}
      {dashboardMode === 'buyer' ? (
        /* Buyer KPIs */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatKpiCard
            title={isAr ? 'طلبات الأسعار النشطة (RFQs)' : 'Active Sourcing RFQs'}
            value={myRfqsData?.totalCount ?? 0}
            change={isAr ? 'طلبات منشورة' : 'active tenders'}
            isPositive={true}
            period={isAr ? 'قيد استقبال عروض الموردين' : 'accepting bids'}
            icon={FileText}
            loading={myRfqsLoading}
          />
          <StatKpiCard
            title={isAr ? 'عروض أسعار بانتظار قرارك' : 'Pending Incoming Bids'}
            value={receivedOffersData?.totalCount ?? 0}
            change={isAr ? 'عروض مستلمة' : 'quotes to review'}
            isPositive={true}
            period={isAr ? 'جاهزة للمقارنة والقبول' : 'ready for evaluation'}
            icon={Inbox}
            loading={receivedOffersLoading}
          />
          <StatKpiCard
            title={isAr ? 'صفقات شراء قيد التنفيذ' : 'Active Purchasing Deals'}
            value={buyingDeals.length}
            change={isAr ? 'عقود ملزمة' : 'binding contracts'}
            isPositive={true}
            period={isAr ? 'مواعيد توريد مؤكدة' : 'on-schedule dispatch'}
            icon={Handshake}
            loading={dealsLoading}
          />
          <StatKpiCard
            title={isAr ? 'موثوقية التوريد والامتثال' : 'Fulfillment Reliability'}
            value="99.2%"
            change="+1.2%"
            isPositive={true}
            period={isAr ? 'تقييم الموردين المتعاقدين' : 'supplier SLA score'}
            icon={Truck}
            loading={dealsLoading}
          />
        </div>
      ) : (
        /* Supplier KPIs */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatKpiCard
            title={isAr ? 'طلبات أسعار متاحة للتقديم' : 'Available Market RFQs'}
            value={openRfqsData?.totalCount ?? 0}
            change={isAr ? 'مناقصات مفتوحة' : 'open for bids'}
            isPositive={true}
            period={isAr ? 'في قطاعك الصناعي' : 'matching your sector'}
            icon={Layers}
            loading={openRfqsLoading}
          />
          <StatKpiCard
            title={isAr ? 'عروضي المقدمة للمشترين' : 'Submitted Quotes'}
            value={myOffersData?.totalCount ?? 0}
            change={isAr ? 'عروض نشطة' : 'active quotes'}
            isPositive={true}
            period={isAr ? 'بانتظار قرار المشتري' : 'under buyer review'}
            icon={Send}
            loading={myOffersLoading}
          />
          <StatKpiCard
            title={isAr ? 'صفقات توريد قيد التنفيذ' : 'Active Sales Deals'}
            value={sellingDeals.length}
            change={isAr ? 'صفقات ملزمة' : 'confirmed contracts'}
            isPositive={true}
            period={isAr ? 'مجدولة للتسليم' : 'scheduled for dispatch'}
            icon={Handshake}
            loading={dealsLoading}
          />
          <StatKpiCard
            title={isAr ? 'تقييم جودة التوريد' : 'Supplier Trust Score'}
            value="98.5%"
            change="+0.5%"
            isPositive={true}
            period={isAr ? 'معدل التقييم' : 'verified counterparty score'}
            icon={TrendingUp}
            loading={dealsLoading}
          />
        </div>
      )}

      {/* ============================================================
          ANALYTICS & CHARTS SECTION (SECTOR CHART WITH 0 CLIPPING)
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Volume / Price Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-[#06245B]">
                {dashboardMode === 'buyer'
                  ? isAr ? 'تحليلات مشتريات المواد الخام' : 'Procurement & Pricing Dynamics'
                  : isAr ? 'تحليلات حركة التوريد والمبيعات' : 'Supply Dynamics & Market Pricing'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isAr
                  ? 'متابعة كميات التوريد الشهرية ومؤشر استقرار أسعار المواد الخام'
                  : 'Track monthly material intake tonnage and regional price index trends'}
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                onClick={() => setActiveChartTab('volume')}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeChartTab === 'volume'
                    ? 'bg-white text-[#06245B] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-[#06245B]'
                  }`}
              >
                {isAr ? 'حجم التوريد (طن)' : 'Volume (Tons)'}
              </button>
              <button
                onClick={() => setActiveChartTab('price')}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeChartTab === 'price'
                    ? 'bg-white text-[#06245B] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-[#06245B]'
                  }`}
              >
                {isAr ? 'مؤشر الأسعار' : 'Price Index'}
              </button>
            </div>
          </div>

          {dealsLoading ? (
            <div className="h-[230px] flex items-end gap-3 px-4 pt-8 animate-pulse">
              <div className="flex-1 bg-slate-100 rounded-t-xl h-[45%]" />
              <div className="flex-1 bg-slate-200/80 rounded-t-xl h-[70%]" />
              <div className="flex-1 bg-slate-100 rounded-t-xl h-[55%]" />
              <div className="flex-1 bg-slate-200/80 rounded-t-xl h-[85%]" />
              <div className="flex-1 bg-slate-100 rounded-t-xl h-[60%]" />
              <div className="flex-1 bg-slate-200/80 rounded-t-xl h-[75%]" />
            </div>
          ) : hasDeals ? (
            <BarChart
              data={sourcingVolumeData}
              height={230}
              valueFormatter={(v) => `${v.toLocaleString()} ${isAr ? 'طن / ألف ج.م' : 'Tons / kEGP'}`}
            />
          ) : (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF4FF] text-[#1266D6] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <TrendingUp size={24} />
              </div>
              <p className="font-bold text-[#06245B] text-sm">
                {isAr ? 'لا توجد بيانات صفقات منفذة حتى الآن' : 'No deal activity recorded yet'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {isAr
                  ? 'يتم توليد مؤشرات حجم التوريد وحركة الصفقات تلقائياً بمجرد إبرام وتأكيد أول صفقة تجارية.'
                  : 'Procurement volume trends will dynamically generate as soon as your first commercial deal is confirmed.'}
              </p>
            </div>
          )}
        </div>

        {/* Right Col: Category Breakdown Donut */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#06245B] mb-1">
              {isAr ? 'توزيع المواد حسب القطاع' : 'Category Sourcing Split'}
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              {isAr
                ? 'نسبة المعاملات عبر القطاعات الصناعية الرئيسية في مصر'
                : 'Share of deals across Egyptian industrial manufacturing sectors'}
            </p>
          </div>

          {dealsLoading ? (
            <div className="py-8 flex flex-col items-center justify-center animate-pulse">
              <div className="w-36 h-36 rounded-full border-8 border-slate-200/70 border-t-[#1266D6]/40 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-slate-50" />
              </div>
              <div className="mt-4 h-4 w-32 bg-slate-100 rounded" />
            </div>
          ) : hasDeals && categoryBreakdown.length > 0 ? (
            <DonutChart
              data={categoryBreakdown}
              centerLabel={isAr ? 'الإجمالي' : 'Total'}
              centerValue="100%"
              size={150}
              strokeWidth={20}
              layout="vertical"
            />
          ) : (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Package size={24} />
              </div>
              <p className="font-bold text-slate-700 text-sm">
                {isAr ? 'في انتظار إبرام أول صفقة' : 'Awaiting First Executed Deal'}
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                {isAr
                  ? 'ستظهر نسب توزيع المشتريات والمبيعات بين القطاعات الصناعية هنا.'
                  : 'Sector distribution will be calculated from your verified transactions.'}
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link
              to="/catalog"
              className="text-xs font-bold text-[#1266D6] hover:text-[#06245B] inline-flex items-center gap-1 transition-colors"
            >
              <span>{isAr ? 'استعراض كل تصنيفات الكتالوج' : 'Explore Full Industrial Taxonomy'}</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================
          ROLE-SPECIFIC LIVE ACTIVITY FEED & RECENT TRANSACTIONS
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardMode === 'buyer' ? (
          /* Buyer Feed: Recent RFQs & Incoming Offers */
          <>
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#06245B] text-base">
                    {isAr ? 'أحدث طلبات الأسعار المنشورة' : 'Your Recent RFQs'}
                  </h3>
                  <Link to="/rfqs" className="text-xs font-semibold text-[#1266D6] hover:underline">
                    {isAr ? 'عرض الكل' : 'View All'}
                  </Link>
                </div>

                <div className="space-y-3">
                  {myRfqsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="h-3 w-20 bg-slate-200 rounded" />
                            <div className="h-4 w-48 bg-slate-200 rounded" />
                            <div className="h-3 w-24 bg-slate-100 rounded" />
                          </div>
                          <div className="h-6 w-16 bg-slate-200 rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : myRfqsData?.items && myRfqsData.items.length > 0 ? (
                    myRfqsData.items.slice(0, 4).map((rfq) => (
                      <Link
                        key={rfq.id}
                        to={`/rfqs/${rfq.id}`}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#1266D6]/40 flex items-center justify-between gap-3 transition-colors block"
                      >
                        <div>
                          <span className="text-xs font-mono text-slate-400 block mb-0.5">{rfq.rfqNumber}</span>
                          <span className="font-bold text-slate-800 text-sm">{rfq.title}</span>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            {formatDate(rfq.createdAtUtc)}
                          </span>
                        </div>
                        <Badge variant={rfq.status === 'Published' ? 'success' : 'info'}>
                          {rfq.status}
                        </Badge>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      {isAr ? 'لا توجد طلبات أسعار بعد' : 'No RFQs posted yet'}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Button as={Link} to="/rfqs/create" variant="primary" size="sm" fullWidth>
                  {isAr ? 'نشر طلب سعر جديد (RFQ)' : 'Create New RFQ'}
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#06245B] text-base">
                    {isAr ? 'عروض الموردين المستلمة' : 'Incoming Supplier Bids'}
                  </h3>
                  <Link to="/offers" className="text-xs font-semibold text-[#1266D6] hover:underline">
                    {isAr ? 'عرض الكل' : 'View All'}
                  </Link>
                </div>

                <div className="space-y-3">
                  {receivedOffersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse flex items-center justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="h-3 w-20 bg-slate-200 rounded" />
                            <div className="h-4 w-40 bg-slate-200 rounded" />
                            <div className="h-3 w-28 bg-slate-100 rounded" />
                          </div>
                          <div className="space-y-1 text-end">
                            <div className="h-4 w-20 bg-slate-200 rounded" />
                            <div className="h-5 w-14 bg-slate-100 rounded-full ms-auto" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : receivedOffersData?.items && receivedOffersData.items.length > 0 ? (
                    receivedOffersData.items.slice(0, 4).map((offer) => (
                      <Link
                        key={offer.id}
                        to={`/offers`}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#1266D6]/40 flex items-center justify-between gap-3 transition-colors block"
                      >
                        <div>
                          <span className="text-xs font-mono text-slate-400 block mb-0.5">{offer.offerNumber}</span>
                          <span className="font-bold text-slate-800 text-sm">{offer.rfqTitle || offer.rfqNumber}</span>
                          <span className="text-xs text-[#1266D6] font-semibold block mt-0.5">
                            {offer.supplierCompanyName}
                          </span>
                        </div>
                        <div className="text-end">
                          <span className="font-bold text-[#06245B] text-sm block">
                            {formatCurrency(offer.totalAmount, offer.currency)}
                          </span>
                          <Badge variant="info" size="xs">
                            {offer.status}
                          </Badge>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      {isAr ? 'لا توجد عروض مستلمة حالياً' : 'No incoming offers yet'}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Button as={Link} to="/offers" variant="outline" size="sm" fullWidth>
                  {isAr ? 'مراجعة كافة العروض المستلمة' : 'Review All Received Offers'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Supplier Feed: Open Market RFQs & Submitted Bids */
          <>
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#06245B] text-base">
                    {isAr ? 'طلبات أسعار مفتوحة في السوق' : 'Available Market Tenders'}
                  </h3>
                  <Link to="/rfqs" className="text-xs font-semibold text-[#1266D6] hover:underline">
                    {isAr ? 'عرض الكل' : 'Explore All'}
                  </Link>
                </div>

                <div className="space-y-3">
                  {openRfqsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 animate-pulse"
                        >
                          <div className="space-y-1.5">
                            <div className="h-3 w-16 bg-slate-200 rounded" />
                            <div className="h-4 w-44 bg-slate-200 rounded" />
                            <div className="h-3 w-32 bg-slate-100 rounded" />
                          </div>
                          <div className="h-7 w-20 bg-slate-200 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  ) : openRfqsData?.items && openRfqsData.items.length > 0 ? (
                    openRfqsData.items.slice(0, 4).map((rfq) => (
                      <Link
                        key={rfq.id}
                        to={`/rfqs/${rfq.id}`}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#1266D6]/40 flex items-center justify-between gap-3 transition-colors block"
                      >
                        <div>
                          <span className="text-xs font-mono text-slate-400 block mb-0.5">{rfq.rfqNumber}</span>
                          <span className="font-bold text-slate-800 text-sm">{rfq.title}</span>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            {isAr ? 'المشتري: ' : 'Buyer: '}
                            <strong className="text-slate-700">{rfq.buyerCompanyName}</strong>
                          </span>
                        </div>
                        <Button size="xs" variant="primary">
                          {isAr ? 'تقديم عرض' : 'Bid Now'}
                        </Button>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      {isAr ? 'لا توجد طلبات مفتوحة حالياً' : 'No open tenders right now'}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Button as={Link} to="/rfqs" variant="primary" size="sm" fullWidth>
                  {isAr ? 'اكتشاف كافة المناقصات الصناعية' : 'Discover All RFQ Tenders'}
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#06245B] text-base">
                    {isAr ? 'عروضي المقدمة وحالتها' : 'My Submitted Quotes'}
                  </h3>
                  <Link to="/offers" className="text-xs font-semibold text-[#1266D6] hover:underline">
                    {isAr ? 'عرض الكل' : 'View All'}
                  </Link>
                </div>

                <div className="space-y-3">
                  {myOffersLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 animate-pulse"
                        >
                          <div className="space-y-1.5">
                            <div className="h-3 w-16 bg-slate-200 rounded" />
                            <div className="h-4 w-40 bg-slate-200 rounded" />
                            <div className="h-3 w-28 bg-slate-100 rounded" />
                          </div>
                          <div className="space-y-1 text-end">
                            <div className="h-4 w-20 bg-slate-200 rounded" />
                            <div className="h-5 w-14 bg-slate-100 rounded-full ms-auto" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : myOffersData?.items && myOffersData.items.length > 0 ? (
                    myOffersData.items.slice(0, 4).map((offer) => (
                      <Link
                        key={offer.id}
                        to={`/offers`}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#1266D6]/40 flex items-center justify-between gap-3 transition-colors block"
                      >
                        <div>
                          <span className="text-xs font-mono text-slate-400 block mb-0.5">{offer.offerNumber}</span>
                          <span className="font-bold text-slate-800 text-sm">{offer.rfqTitle || offer.rfqNumber}</span>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            {formatDate(offer.submittedAtUtc)}
                          </span>
                        </div>
                        <div className="text-end">
                          <span className="font-bold text-[#06245B] text-sm block">
                            {formatCurrency(offer.totalAmount, offer.currency)}
                          </span>
                          <Badge variant={offer.status === 'Accepted' ? 'success' : 'info'} size="xs">
                            {offer.status}
                          </Badge>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      {isAr ? 'لم تقدم عروض أسعار بعد' : 'No offers submitted yet'}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Button as={Link} to="/offers" variant="outline" size="sm" fullWidth>
                  {isAr ? 'إدارة ومتابعة عروضي' : 'Manage My Submitted Offers'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============================================================
          QUICK COMMERCIAL WORKFLOW ACCESS SHORTCUTS
          ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/rfqs"
          className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-[#1266D6] hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#EAF4FF] text-[#1266D6] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <FileText size={24} />
            </div>
            <h3 className="font-bold text-[#06245B] text-base mb-1">
              {isAr ? 'طلبات الأسعار (RFQs)' : 'Structured RFQ Sourcing'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr
                ? 'طرح ومراجعة المناقصات وتحديد المواصفات الفنية وجداول التوريد بدقة.'
                : 'Publish reverse bidding tenders, define technical specs, and schedule delivery windows.'}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#1266D6] group-hover:text-[#06245B]">
            <span>{isAr ? 'الانتقال إلى طلبات الأسعار' : 'Manage RFQs'}</span>
            {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
          </div>
        </Link>

        <Link
          to="/deals"
          className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-[#1266D6] hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Handshake size={24} />
            </div>
            <h3 className="font-bold text-[#06245B] text-base mb-1">
              {isAr ? 'الصفقات والعقود الملزمة' : 'Commercial Deals'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr
                ? 'متابعة الصفقات المنعقدة وتجميد الأسعار والكميات وتأكيد استلام الدفعات.'
                : 'Atomic contracts with frozen commercial snapshots, payment milestones, and execution tracking.'}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-600 group-hover:text-emerald-800">
            <span>{isAr ? 'عرض الصفقات الجارية' : 'View Deals'}</span>
            {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
          </div>
        </Link>

        <Link
          to="/catalog"
          className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-[#1266D6] hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Package size={24} />
            </div>
            <h3 className="font-bold text-[#06245B] text-base mb-1">
              {isAr ? 'الكتالوج الصناعي الموحد' : 'Unified Materials Catalog'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr
                ? 'استكشاف المواد الخام عبر القطاعات الصناعية والمواصفات القياسية المصرية.'
                : 'Standardized industrial taxonomy across steel, chemicals, plastics, and packaging.'}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-cyan-600 group-hover:text-cyan-800">
            <span>{isAr ? 'تصفح الكتالوج' : 'Explore Catalog'}</span>
            {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
          </div>
        </Link>
      </div>
    </div>
  )
}
