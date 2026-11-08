import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  Building2,
  FileText,
  Handshake,
  AlertTriangle,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Users,
} from 'lucide-react'
import { adminService } from '../../shared/api/services/adminService'
import { useTranslation } from '../../hooks/useTranslation'
import { useToast } from '../../hooks/useToast'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import StatKpiCard from '../../components/charts/StatKpiCard'
import BarChart from '../../components/charts/BarChart'
import DonutChart from '../../components/charts/DonutChart'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatCurrency, formatDate } from '../../utils/format'

export default function AdminAnalyticsPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const toast = useToast()

  const [dateRange, setDateRange] = useState('all') // 'all', '30d', '90d', 'year'
  const [downloadingCompanies, setDownloadingCompanies] = useState(false)
  const [downloadingDeals, setDownloadingDeals] = useState(false)

  // Compute fromDate based on selection
  let fromDate = null
  if (dateRange === '30d') {
    fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  } else if (dateRange === '90d') {
    fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  } else if (dateRange === 'year') {
    fromDate = new Date(new Date().getFullYear(), 0, 1).toISOString()
  }

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'analytics', { fromDate }],
    queryFn: () => adminService.getAnalytics({ fromDate: fromDate || undefined }),
    staleTime: 60_000,
  })

  // Export Companies CSV
  const handleExportCompanies = async () => {
    setDownloadingCompanies(true)
    try {
      const blob = await adminService.exportCompaniesCsv()
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `dealzone-companies-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success(isAr ? 'تم تصدير تقرير الشركات بنجاح' : 'Companies report exported')
    } catch (err) {
      toast.error(isAr ? 'فشل تصدير التقرير' : 'Failed to export companies')
    } finally {
      setDownloadingCompanies(false)
    }
  }

  // Export Deals CSV
  const handleExportDeals = async () => {
    setDownloadingDeals(true)
    try {
      const blob = await adminService.exportDealsCsv()
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv;charset=utf-8;' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `dealzone-deals-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success(isAr ? 'تم تصدير تقرير الصفقات بنجاح' : 'Deals report exported')
    } catch (err) {
      toast.error(isAr ? 'فشل تصدير التقرير' : 'Failed to export deals')
    } finally {
      setDownloadingDeals(false)
    }
  }

  if (isLoading) return <PageSpinner />

  const kpis = data?.kpis
  const sectors = data?.sectors || []
  const activity = data?.activity || []

  // Transform activity data for BarChart
  const activityChartData = activity.map((a) => ({
    label: a.period,
    value: a.newDeals,
  }))

  // Transform sectors for DonutChart
  const sectorColors = ['#06245B', '#1266D6', '#00D9F5', '#10B981', '#F59E0B', '#8B5CF6']
  const sectorChartData = sectors.slice(0, 6).map((s, idx) => ({
    label: s.sector,
    value: s.companyCount || s.rfqCount || 1,
    color: sectorColors[idx % sectorColors.length],
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Controls: Date Filters & Professional Export Actions */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Date Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 me-2 flex items-center gap-1.5">
            <Calendar size={14} className="text-[#1266D6]" />
            {isAr ? 'الفترة الزمنية:' : 'Time Period:'}
          </span>
          <div className="inline-flex rounded-2xl bg-slate-100 p-1 text-xs font-bold">
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                dateRange === 'all'
                  ? 'bg-white text-[#06245B] shadow-xs'
                  : 'text-slate-600 hover:text-[#06245B]'
              }`}
            >
              {isAr ? 'كل الفترات' : 'All Time'}
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                dateRange === 'year'
                  ? 'bg-white text-[#06245B] shadow-xs'
                  : 'text-slate-600 hover:text-[#06245B]'
              }`}
            >
              {isAr ? 'هذا العام' : 'This Year'}
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                dateRange === '90d'
                  ? 'bg-white text-[#06245B] shadow-xs'
                  : 'text-slate-600 hover:text-[#06245B]'
              }`}
            >
              {isAr ? 'آخر 90 يوم' : 'Last 90 Days'}
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                dateRange === '30d'
                  ? 'bg-white text-[#06245B] shadow-xs'
                  : 'text-slate-600 hover:text-[#06245B]'
              }`}
            >
              {isAr ? 'آخر 30 يوم' : 'Last 30 Days'}
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl text-slate-400 hover:text-[#06245B] hover:bg-slate-100 transition-colors"
            title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Real Data Export Actions */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={15} />}
            onClick={handleExportCompanies}
            loading={downloadingCompanies}
            className="text-xs font-semibold"
          >
            {isAr ? 'تصدير الشركات (.csv)' : 'Export Companies (.csv)'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Download size={15} />}
            onClick={handleExportDeals}
            loading={downloadingDeals}
            className="text-xs font-bold"
          >
            {isAr ? 'تصدير الصفقات والمبيعات (.csv)' : 'Export Deals (.csv)'}
          </Button>
        </div>
      </div>

      {/* KPI Section 1: Macro Volume & Marketplace Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatKpiCard
          title={isAr ? 'إجمالي حجم الصفقات (EGP)' : 'Traded Volume (EGP)'}
          value={formatCurrency(kpis?.totalTradedVolumeEgp || 0)}
          change={`${kpis?.completedDeals || 0} completed`}
          isPositive={true}
          period={isAr ? 'الصفقات المكتملة والجارية' : 'confirmed contracts'}
          icon={TrendingUp}
        />

        <StatKpiCard
          title={isAr ? 'إجمالي الشركات المسجلة' : 'Registered Enterprises'}
          value={kpis?.totalCompanies || 0}
          change={`${kpis?.verifiedCompanies || 0} verified`}
          isPositive={true}
          period={isAr ? `${kpis?.pendingCompanies || 0} بانتظار التوثيق` : `${kpis?.pendingCompanies || 0} pending review`}
          icon={Building2}
        />

        <StatKpiCard
          title={isAr ? 'طلبات الأسعار (RFQs)' : 'Total RFQs Published'}
          value={kpis?.totalRfqs || 0}
          change={`${kpis?.openRfqs || 0} open`}
          isPositive={true}
          period={isAr ? 'متاحة لتلقي عروض الموردين' : 'currently active for bidding'}
          icon={FileText}
        />

        <StatKpiCard
          title={isAr ? 'الصفقات التجارية الملزمة' : 'Binding Deals'}
          value={kpis?.totalDeals || 0}
          change={`${kpis?.inProgressDeals || 0} in progress`}
          isPositive={true}
          period={isAr ? `${kpis?.disputedDeals || 0} نزاعات مفتوحة` : `${kpis?.disputedDeals || 0} open disputes`}
          icon={Handshake}
        />
      </div>

      {/* KPI Section 2: Detailed Status Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Companies Verification Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#06245B] text-sm">
              {isAr ? 'حالة توثيق الشركات' : 'Company Verification Status'}
            </h3>
            <ShieldCheck size={18} className="text-[#1266D6]" />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-900">
              <span className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" />
                {isAr ? 'شركات معتمدة ومفعلة' : 'Verified & Active'}
              </span>
              <span className="font-mono font-bold">{kpis?.verifiedCompanies || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 text-amber-900">
              <span className="flex items-center gap-2">
                <Clock size={14} className="text-amber-600" />
                {isAr ? 'بانتظار المراجعة والتدقيق' : 'Pending Verification'}
              </span>
              <span className="font-mono font-bold">{kpis?.pendingCompanies || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 text-blue-900">
              <span className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#1266D6]" />
                {isAr ? 'مطلوب تعديلات على المستندات' : 'Modifications Required'}
              </span>
              <span className="font-mono font-bold">{kpis?.changesRequiredCompanies || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 text-rose-900">
              <span className="flex items-center gap-2">
                <XCircle size={14} className="text-rose-600" />
                {isAr ? 'شركات مرفوضة' : 'Rejected'}
              </span>
              <span className="font-mono font-bold">{kpis?.rejectedCompanies || 0}</span>
            </div>
          </div>
        </div>

        {/* Commercial Liquidity: Bids & Offers */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#06245B] text-sm">
              {isAr ? 'حركة العروض والمناقصات' : 'Bidding & Quote Activity'}
            </h3>
            <Users size={18} className="text-[#1266D6]" />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-slate-800">
              <span>{isAr ? 'إجمالي العروض المقدمة' : 'Total Quotes Submitted'}</span>
              <span className="font-mono font-bold text-[#06245B]">{kpis?.totalOffers || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-900">
              <span>{isAr ? 'عروض مقبولة وتوجت بصفقات' : 'Accepted Offers'}</span>
              <span className="font-mono font-bold">{kpis?.acceptedOffers || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 text-blue-900">
              <span>{isAr ? 'عروض قيد المراجعة والمفاضلة' : 'Pending Review'}</span>
              <span className="font-mono font-bold">{kpis?.submittedOffers || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-slate-500">
              <span>{isAr ? 'عروض مرفوضة أو منتهية' : 'Rejected / Superseded'}</span>
              <span className="font-mono font-bold">{kpis?.rejectedOffers || 0}</span>
            </div>
          </div>
        </div>

        {/* Dispute Resolution & Mediation */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#06245B] text-sm">
              {isAr ? 'فض النزاعات والوساطة' : 'Dispute Mediation'}
            </h3>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-slate-800">
              <span>{isAr ? 'إجمالي النزاعات المسجلة' : 'Total Cases Raised'}</span>
              <span className="font-mono font-bold text-[#06245B]">{kpis?.totalDisputes || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 text-amber-900">
              <span>{isAr ? 'نزاعات مفتوحة وقيد التحقيق' : 'Open / Under Investigation'}</span>
              <span className="font-mono font-bold">{kpis?.openDisputes || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-900">
              <span>{isAr ? 'نزاعات تم فضها والصلح' : 'Resolved & Mediated'}</span>
              <span className="font-mono font-bold">{kpis?.resolvedDisputes || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-slate-500">
              <span>{isAr ? 'معدل حسم النزاعات' : 'Resolution Rate'}</span>
              <span className="font-mono font-bold">
                {kpis?.totalDisputes ? `${Math.round(((kpis.resolvedDisputes || 0) / kpis.totalDisputes) * 100)}%` : '100%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Over Time BarChart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#06245B] text-base">
                {isAr ? 'حركة الصفقات الشهرية على المنصة' : 'Monthly Deal Formation Volume'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr ? 'عدد الصفقات الملزمة المبرمة شهرياً' : 'Number of legally binding deals executed per month'}
              </p>
            </div>
          </div>

          {activityChartData.length > 0 ? (
            <BarChart
              data={activityChartData}
              height={230}
              valueFormatter={(v) => `${v} ${isAr ? 'صفقة' : 'deals'}`}
            />
          ) : (
            <p className="text-xs text-slate-400 py-12 text-center">
              {isAr ? 'لا توجد بيانات حركة كافية' : 'Insufficient historical activity'}
            </p>
          )}
        </div>

        {/* Sector Distribution DonutChart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#06245B] text-base mb-1">
              {isAr ? 'توزيع الشركات حسب القطاع' : 'Enterprise Industry Sectors'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {isAr ? 'القطاعات الصناعية الأكثر تمثيلاً' : 'Distribution of vetted companies across Egyptian sectors'}
            </p>
          </div>

          {sectorChartData.length > 0 ? (
            <DonutChart
              data={sectorChartData}
              centerLabel={isAr ? 'القطاعات' : 'Sectors'}
              centerValue={String(sectors.length)}
              size={150}
              strokeWidth={20}
              layout="vertical"
            />
          ) : (
            <p className="text-xs text-slate-400 py-12 text-center">
              {isAr ? 'لا توجد بيانات قطاعات' : 'No sector distribution data'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
