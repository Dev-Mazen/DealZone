import { useState } from 'react'
import { Link } from 'react-router-dom'
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
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { usePermissions } from '../../hooks/usePermissions'
import { useTranslation } from '../../hooks/useTranslation'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import StatKpiCard from '../../components/charts/StatKpiCard'
import BarChart from '../../components/charts/BarChart'
import DonutChart from '../../components/charts/DonutChart'
import AreaTrendChart from '../../components/charts/AreaTrendChart'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { t, language } = useTranslation()
  const isAr = language === 'ar'
  const { hasCompany, isVerified, canManageRfqs, canSubmitOffers, role } = usePermissions()

  const [activeChartTab, setActiveChartTab] = useState('volume')

  // Company onboarding check
  if (!hasCompany) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#EAF4FF] rounded-2xl flex items-center justify-center shadow-inner">
            <Building2 size={40} className="text-[#1266D6]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#06245B] mb-3">
            {isAr ? 'أكمل تسجيل شركتك الصناعية' : 'Complete Your Enterprise Profile'}
          </h2>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
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

  // Verification pending check
  if (!isVerified) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white rounded-3xl p-8 border border-amber-200/80 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 border border-amber-200">
              <AlertCircle size={32} className="text-amber-600" />
            </div>
            <div className="text-center sm:text-start flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-3">
                <span>{isAr ? 'قيد التدقيق والمراجعة' : 'Verification Under Review'}</span>
              </div>
              <h2 className="text-xl font-bold text-[#06245B] mb-2">
                {isAr ? 'ملف شركتك يخضع للتحقق القانوني' : 'Company Credentials Under Review'}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
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

  // ── Industrial Procurement Analytics Sample & Live Data ──
  const sourcingVolumeData = [
    { label: isAr ? 'يناير' : 'Jan', value: 1250 },
    { label: isAr ? 'فبراير' : 'Feb', value: 1840 },
    { label: isAr ? 'مارس' : 'Mar', value: 2100 },
    { label: isAr ? 'أبريل' : 'Apr', value: 2650 },
    { label: isAr ? 'مايو' : 'May', value: 3100 },
    { label: isAr ? 'يونيو' : 'Jun', value: 3820 },
  ]

  const priceTrendData = [
    { label: 'W1', value: 24200 },
    { label: 'W2', value: 24800 },
    { label: 'W3', value: 24500 },
    { label: 'W4', value: 23900 },
    { label: 'W5', value: 24100 },
    { label: 'W6', value: 23750 },
  ]

  const categoryBreakdown = [
    { label: isAr ? 'حديد ومعادن' : 'Steel & Metallurgy', value: 42, color: '#06245B' },
    { label: isAr ? 'كيماويات أساسية' : 'Industrial Chemicals', value: 28, color: '#1266D6' },
    { label: isAr ? 'بوليمرات وبلاستيك' : 'Polymers & Resins', value: 18, color: '#00D9F5' },
    { label: isAr ? 'مواد تعبئة وتغليف' : 'Packaging & Film', value: 12, color: '#10B981' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ============================================================
          EXECUTIVE WELCOME BANNER
          ============================================================ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#06245B] via-[#0A3078] to-[#1266D6] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-[#00D9F5] text-xs font-bold mb-3">
              <ShieldCheck size={14} />
              <span>{isAr ? 'حساب تجاري معتمد' : 'Verified Enterprise Counterparty'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
              {isAr ? `مرحباً، ${user?.fullName}` : `Welcome back, ${user?.fullName}`}
            </h1>
            <p className="text-slate-200 text-sm max-w-xl">
              {user?.company?.tradeName || user?.company?.legalName} •{' '}
              <span className="text-[#00D9F5] font-semibold">{role || 'Corporate Member'}</span> •{' '}
              {user?.company?.city}, {user?.company?.governorate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canManageRfqs && (
              <Button
                as={Link}
                to="/rfqs/create"
                variant="primary"
                size="md"
                icon={<PlusCircle size={18} />}
                className="font-bold shadow-md shadow-cyan-500/20"
              >
                {isAr ? 'نشر طلب سعر (RFQ)' : 'Post New RFQ'}
              </Button>
            )}
            <Button
              as={Link}
              to="/catalog"
              variant="outline"
              size="md"
              className="!border-white/70 !text-white hover:!bg-white/15"
            >
              {isAr ? 'تصفح الكتالوج' : 'Browse Materials'}
            </Button>
          </div>
        </div>
      </div>

      {/* ============================================================
          KEY PERFORMANCE INDICATORS (KPI CARDS)
          ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatKpiCard
          title={isAr ? 'حجم المشتريات (EGP)' : 'Sourcing Volume (EGP)'}
          value="3.8M"
          change="+18.4%"
          isPositive={true}
          period={isAr ? 'مقارنة بالشهر الماضي' : 'vs last month'}
          icon={TrendingUp}
          sparkline={[18, 22, 25, 29, 32, 38]}
        />
        <StatKpiCard
          title={isAr ? 'طلبات الأسعار النشطة' : 'Active RFQ Tenders'}
          value="8"
          change="+2 new"
          isPositive={true}
          period={isAr ? 'هذا الأسبوع' : 'this week'}
          icon={FileText}
          sparkline={[4, 5, 5, 6, 7, 8]}
        />
        <StatKpiCard
          title={isAr ? 'الصفقات المبرمة' : 'Binding Deals Closed'}
          value="14"
          change="+100%"
          isPositive={true}
          period={isAr ? 'جميعها ملتزمة' : 'all on-schedule'}
          icon={Handshake}
          sparkline={[8, 9, 11, 12, 13, 14]}
        />
        <StatKpiCard
          title={isAr ? 'دقة التوريد والامتثال' : 'Fulfillment Reliability'}
          value="98.6%"
          change="+0.8%"
          isPositive={true}
          period={isAr ? 'معدل التقييم' : 'counterparty score'}
          icon={Truck}
          sparkline={[96, 96.5, 97, 97.8, 98.2, 98.6]}
        />
      </div>

      {/* ============================================================
          ANALYTICS & CHARTS SECTION
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Volume / Price Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-[#06245B]">
                {isAr ? 'تحليلات التوريد والأسعار الصناعية' : 'Procurement & Pricing Dynamics'}
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
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeChartTab === 'volume'
                    ? 'bg-white text-[#06245B] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-[#06245B]'
                }`}
              >
                {isAr ? 'حجم التوريد (طن)' : 'Volume (Tons)'}
              </button>
              <button
                onClick={() => setActiveChartTab('price')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeChartTab === 'price'
                    ? 'bg-white text-[#06245B] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-[#06245B]'
                }`}
              >
                {isAr ? 'مؤشر الأسعار' : 'Price Index'}
              </button>
            </div>
          </div>

          {activeChartTab === 'volume' ? (
            <BarChart
              data={sourcingVolumeData}
              height={230}
              valueFormatter={(v) => `${v.toLocaleString()} Tons`}
            />
          ) : (
            <AreaTrendChart
              data={priceTrendData}
              height={230}
              valueFormatter={(v) => `${v.toLocaleString()} EGP/Ton`}
            />
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
                ? 'نسبة الطلبات والصفقات عبر القطاعات الصناعية الرئيسية'
                : 'Share of deals across Egyptian industrial manufacturing sectors'}
            </p>
          </div>

          <DonutChart
            data={categoryBreakdown}
            centerLabel={isAr ? 'الإجمالي' : 'Deals'}
            centerValue="100%"
            size={180}
            strokeWidth={22}
          />

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
          QUICK COMMERCIAL WORKFLOW ACCESS
          ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/rfqs"
          className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-[#1266D6] hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#EAF4FF] text-[#1266D6] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <h3 className="text-base font-bold text-[#06245B] mb-2">
              {isAr ? 'إدارة طلبات الأسعار (RFQs)' : 'Manage RFQ Tenders'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr
                ? 'استعرض طلبات الشراء المنشورة، قارن عروض الأسعار الواردة من الموردين، واطلب مراجعات الأسعار.'
                : 'Monitor live requests for quotation, compare incoming line-item proposals, and request audited revisions.'}
            </p>
          </div>
          <div className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#1266D6]">
            <span>{isAr ? 'فتح مركز العروض' : 'Go to RFQs'}</span>
            <ArrowUpRight size={14} />
          </div>
        </Link>

        <Link
          to="/deals"
          className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-[#1266D6] hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Handshake size={24} />
            </div>
            <h3 className="text-base font-bold text-[#06245B] mb-2">
              {isAr ? 'الصفقات والعقود الملزمة' : 'Active Binding Deals'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr
                ? 'متابعة الصفقات المتفق عليها، مراحل التسليم، تأكيد الاستلام، وتقييم الطرف المقابل بعد الإتمام.'
                : 'Track formed commercial deals with frozen price snapshots, delivery confirmation, and counterparty reviews.'}
            </p>
          </div>
          <div className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
            <span>{isAr ? 'سجل الصفقات' : 'View Deals'}</span>
            <ArrowUpRight size={14} />
          </div>
        </Link>

        <Link
          to="/shipments/00000000-0000-0000-0000-000000000000"
          className="group bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-[#1266D6] hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Truck size={24} />
            </div>
            <h3 className="text-base font-bold text-[#06245B] mb-2">
              {isAr ? 'تتبع الشحن واللوجستيات' : 'Logistics & Dispatch Tracking'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr
                ? 'متابعة مسار الشحنات عبر شركاء النقل المعتمدين وتحديث معالم التوصيل من المستودع إلى المصنع.'
                : 'End-to-end milestone tracking across verified freight carriers from supplier dispatch to factory gate.'}
            </p>
          </div>
          <div className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-cyan-700">
            <span>{isAr ? 'متابعة الشحنات' : 'Track Shipments'}</span>
            <ArrowUpRight size={14} />
          </div>
        </Link>
      </div>
    </div>
  )
}
