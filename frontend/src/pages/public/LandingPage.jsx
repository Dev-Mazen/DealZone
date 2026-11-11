import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ShieldCheck,
  Package,
  CheckCircle2,
  FileText,
  Truck,
  Building2,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Factory,
  Globe,
  Star,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import { useTranslation } from '../../hooks/useTranslation'
import Logo from '../../components/common/Logo'
import Footer from '../../components/layout/Footer'
import BarChart from '../../components/charts/BarChart'

export default function LandingPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'

  const features = [
    {
      icon: ShieldCheck,
      title: isAr ? 'موردون موثوقون ومعتمدون' : 'Verified Enterprise Suppliers',
      desc: isAr
        ? 'جميع الشركات مسجلة وخاضعة للتدقيق القانوني والضريبي عبر السجل التجاري والبطاقة الضريبية.'
        : 'Every supplier is legally and commercially vetted via official commercial registries and tax cards.',
    },
    {
      icon: Package,
      title: isAr ? 'كتالوج صناعي متخصص' : 'Standardized Industrial Catalog',
      desc: isAr
        ? 'آلاف المواد الخام المصنفة بدقة حسب المواصفات القياسية مع وحدات قياس صناعية دقيقة.'
        : 'Thousands of raw materials categorized by technical grades with high-precision industrial units.',
    },
    {
      icon: FileText,
      title: isAr ? 'طلبات عروض أسعار منظمة' : 'Structured RFQ Workflows',
      desc: isAr
        ? 'نظام مناقصات احترافي لتحديد المواصفات واستقبال عروض الأسعار التنافسية وإجراء المراجعات.'
        : 'Formal bidding system to specify parameters, receive itemized proposals, and audit revisions.',
    },
    {
      icon: Truck,
      title: isAr ? 'إدارة الشحن واللوجستيات' : 'Fulfillment & Logistics Tracking',
      desc: isAr
        ? 'دعم الشحن عبر المورد أو أسطول شركاء DealZone مع تتبع مسار الشحنات خطوة بخطوة.'
        : 'Support for Supplier-Arranged or DealZone-Arranged logistics with real-time milestone tracking.',
    },
  ]

  const stats = [
    {
      value: '1,000+',
      label: isAr ? 'شركة ومصنع مسجل' : 'Registered Factories',
      sublabel: isAr ? 'في مختلف المحافظات الصناعية' : 'Across Egyptian industrial zones',
    },
    {
      value: '5,000+',
      label: isAr ? 'مادة خام صناعية' : 'Raw Material Specs',
      sublabel: isAr ? 'كيماويات، معادن، بوليمرات' : 'Chemicals, metallurgy, polymers',
    },
    {
      value: '10,000+',
      label: isAr ? 'صفقة تجارية ناجحة' : 'Binding Deals Formed',
      sublabel: isAr ? 'بأعلى معايير الالتزام' : 'With frozen commercial snapshots',
    },
    {
      value: '98.6%',
      label: isAr ? 'معدل رضا التوريد' : 'Fulfillment Satisfaction',
      sublabel: isAr ? 'تقييمات موثقة بعد التسليم' : 'Verified post-delivery reviews',
    },
  ]

  const sourcingVolumeData = [
    { label: isAr ? 'يناير' : 'Jan', value: 1400 },
    { label: isAr ? 'فبراير' : 'Feb', value: 1950 },
    { label: isAr ? 'مارس' : 'Mar', value: 2400 },
    { label: isAr ? 'أبريل' : 'Apr', value: 2900 },
    { label: isAr ? 'مايو' : 'May', value: 3350 },
    { label: isAr ? 'يونيو' : 'Jun', value: 4100 },
  ]

  const steps = [
    {
      step: '01',
      title: isAr ? 'انشر طلب الشراء (RFQ)' : 'Publish Structured RFQ',
      desc: isAr
        ? 'حدد المواد الخام والكميات المطلوبة ومكان التسليم والمواصفات الفنية بدقة.'
        : 'Specify materials, exact target quantities, delivery location, and technical parameters.',
      image: '/images/tenders-reverse-bidding.jpeg',
    },
    {
      step: '02',
      title: isAr ? 'استلم عروض أسعار تنافسية' : 'Receive Supplier Offers',
      desc: isAr
        ? 'قارن عروض الأسعار المفصلة من كبار الموردين المعتمدين مع إمكانية طلب مراجعة العرض.'
        : 'Compare itemized proposals from verified suppliers and request structured revisions.',
      image: '/images/marketplace-categories.jpeg',
    },
    {
      step: '03',
      title: isAr ? 'ثبّت الصفقة وتتبع الشحن' : 'Form Deal & Track Logistics',
      desc: isAr
        ? 'تعاقد فوري ملزم يثبت الشروط التجارية مع متابعة مراحل الشحن والتسليم حتى باب المصنع.'
        : 'Atomic binding deal freezes terms and enables end-to-end logistics tracking to factory door.',
      image: '/images/how-it-works-logistics.jpeg',
    },
  ]

  const trustedBy = [
    isAr ? 'مصانع العاشر من رمضان' : 'Al-Obour Industrial Zone',
    isAr ? 'السادس من أكتوبر' : '6th of October City',
    isAr ? 'برج العرب' : 'Borg El Arab',
    isAr ? 'مدينة السادات' : 'Sadat City',
    isAr ? 'الإسكندرية الصناعية' : 'Alexandria Industrial',
  ]

  return (
    <div className="min-h-screen bg-[#F4F7FB] selection:bg-[#00D9F5]/20 selection:text-[#06245B]">
      {/* ============================================================
          HERO SECTION — FULL IMAGE BACKGROUND WITH OVERLAY
          ============================================================ */}
      <section className="relative overflow-hidden min-h-[88vh] flex items-center text-white">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-landing.jpeg"
            alt="DealZone industrial procurement platform"
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          {/* Deep navy gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#06245B]/95 via-[#0A3078]/88 to-[#1266D6]/80" />
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="container relative z-10 max-w-6xl mx-auto text-center pt-24 pb-28 px-4 sm:px-6 lg:px-8">
          {/* Official Logo Banner */}
          <div className="flex justify-center mb-6">
            <Logo size="xl" variant="white" link={false} />
          </div>

          

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
            {isAr ? (
              <>
                منصة التجارة <span className="text-[#00D9F5]">الذكية</span>
                <br />
                للمواد الخام الصناعية في مصر
              </>
            ) : (
              <>
                Trade Smarter. Grow Faster.
                <br />
                <span className="text-[#00D9F5]">Industrial Procurement</span> Simplified.
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-100 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            {isAr
              ? 'اربط مصنعك مباشرة بأكبر شبكة من موردي المواد الخام المعتمدين في مصر. أدر طلبات الشراء، قارن عروض الأسعار، وأتمم صفقاتك بكل موثوقية وأمان.'
              : 'Directly connect your factory with verified Egyptian raw material suppliers. Publish tenders, compare itemized offers, and close legally binding deals with total transparency.'}
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Button
              as={Link}
              to="/register"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto text-base font-bold shadow-lg shadow-cyan-500/20"
              iconEnd={<ArrowRight size={20} />}
            >
              {isAr ? 'سجل شركتك مجاناً' : 'Get Started Free'}
            </Button>
            <Button
              as={Link}
              to="/about"
              variant="outline-white"
              size="lg"
              className="w-full sm:w-auto text-base"
            >
              {isAr ? 'عن المنصة ورؤيتنا' : 'About DealZone'}
            </Button>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-8 border-t border-white/15 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#00D9F5] shrink-0" />
              <span>{isAr ? 'تسجيل مجاني وبلا رسوم خفية' : 'Free Registration & Onboarding'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#00D9F5] shrink-0" />
              <span>{isAr ? 'فحص السجل التجاري والبطاقة الضريبية' : 'Verified CR & Tax Card Vetting'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#00D9F5] shrink-0" />
              <span>{isAr ? 'إلزام قانوني وتجميد للأسعار' : 'Legally Binding Commercial Deals'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          STATS SECTION — METRIC CARDS
          ============================================================ */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-6 text-center hover:shadow-md hover:border-[#1266D6]/40 transition-all duration-200"
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-[#06245B] tracking-tight mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-slate-800 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-slate-500">
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          TRUSTED ZONES BANNER
          ============================================================ */}
      <section className="py-8 bg-[#F4F7FB] border-b border-slate-200">
        <div className="container max-w-6xl mx-auto px-4">
          <p className="text-center text-xs font-bold text-[#64748B] uppercase tracking-widest mb-5">
            {isAr ? 'يخدم كبرى المناطق الصناعية في مصر' : "Serving Egypt's Top Industrial Zones"}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            {trustedBy.map((zone, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-full border border-slate-200 text-xs font-semibold text-[#06245B] shadow-xs"
              >
                <Factory size={13} className="text-[#1266D6]" />
                {zone}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          LIVE INDUSTRIAL PROCUREMENT VOLUME (DATA VISUALIZATION)
          ============================================================ */}
      <section className="py-20 bg-white">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="bg-[#F8FAFC] rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-md">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF4FF] text-[#1266D6] text-xs font-bold mb-3">
                  <TrendingUp size={14} />
                  <span>{isAr ? 'بيانات السوق المباشرة' : 'Market Liquidity Trends'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] mb-3">
                  {isAr ? 'نمو حجم التوريد الشهري عبر المنصة' : 'Monthly Sourcing Volume Growth'}
                </h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {isAr
                    ? 'يعكس المخطط تصاعد إجمالي أطنان المواد الخام المتداولة شهرياً في قطاعات الحديد والكيماويات والبوليمرات عبر كبرى المناطق الصناعية المصرية.'
                    : "Real-time overview of monthly raw material trading tonnage across Egypt's major industrial manufacturing zones."}
                </p>
                <div className="flex items-center gap-4">
                  <Button as={Link} to="/catalog" variant="outline" size="sm">
                    {isAr ? 'عرض الكتالوج الكامل' : 'Browse Material Specs'}
                  </Button>
                </div>
              </div>

              <div className="w-full lg:max-w-xl bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    {isAr ? 'حجم التوريد الصناعي (طن متري)' : 'Procurement Volume (Metric Tons)'}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    +34% YoY Growth
                  </span>
                </div>
                <BarChart
                  data={sourcingVolumeData}
                  height={220}
                  valueFormatter={(v) => `${v.toLocaleString()} MT`}
                />
                <p className="text-[10px] text-slate-400 mt-2 text-center">
                  {isAr ? '* بيانات توضيحية — تعكس الاتجاه العام' : '* Illustrative data — reflects general market trend'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURES SECTION WITH IMAGE
          ============================================================ */}
      <section className="py-20 bg-[#F4F7FB]">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06245B] mb-4 tracking-tight">
              {isAr ? 'لماذا تختار منصة DealZone؟' : 'Why Choose DealZone?'}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              {isAr
                ? 'بنية تحتية رقمية متكاملة مصممة خصيصاً لتلبية متطلبات المصانع والشركات الصناعية في مصر.'
                : 'Enterprise digital procurement infrastructure built exclusively for Egyptian manufacturers and suppliers.'}
            </p>
          </div>

          {/* Two-column layout: image left, features right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16">
            {/* Image */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3] order-2 lg:order-1">
              <img
                src="/images/about-why-choose-us.jpeg"
                alt="Why choose DealZone"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
              {/* Overlay badge */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF4FF] flex items-center justify-center shrink-0">
                      <Star size={20} className="text-[#1266D6]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#06245B]">
                        {isAr ? 'الموردون المعتمدون فقط' : 'Verified Suppliers Only'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {isAr ? 'تدقيق قانوني وضريبي لكل شركة' : 'Legal & tax vetting for every company'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 order-1 lg:order-2">
              {features.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#EAF4FF] text-[#1266D6] flex items-center justify-center mb-4 shadow-xs">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-base font-bold text-[#06245B] mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          WORKFLOW STEPS SECTION WITH REAL IMAGES
          ============================================================ */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-[#1266D6] font-bold text-sm tracking-wider uppercase mb-2">
              {isAr ? 'خطوات مبسطة وفعالة' : 'Simple & Verified Workflow'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06245B] mb-4 tracking-tight">
              {isAr ? 'كيف تعمل الصفقات على المنصة؟' : 'How Industrial Procurement Works'}
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              {isAr
                ? 'دورة تعامل شفافة تحميك من هدر الوقت ومخاطر تقلبات الأسعار'
                : 'A transparent procurement cycle that eliminates manual overhead and counterparty risks.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((st, i) => (
              <div
                key={i}
                className="group bg-[#F8FAFC] border border-slate-200 rounded-2xl overflow-hidden hover:border-[#1266D6] hover:shadow-xl transition-all duration-300"
              >
                {/* Step image */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={st.image}
                    alt={st.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06245B]/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-3xl font-black text-white drop-shadow">
                    {st.step}
                  </div>
                </div>

                {/* Step content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-[#06245B] mb-2">
                    {st.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          INDUSTRIAL GALLERY STRIP
          ============================================================ */}
      <section className="py-12 bg-[#F4F7FB] overflow-hidden">
        <div className="container max-w-6xl mx-auto px-4">
          <p className="text-center text-xs font-bold text-[#64748B] uppercase tracking-widest mb-6">
            {isAr ? 'القطاعات الصناعية المدعومة' : 'Supported Industrial Sectors'}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div
                key={n}
                className="aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <img
                  src={`/images/industrial-${n}.jpeg`}
                  alt={`Industrial sector ${n}`}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          BOTTOM CALL TO ACTION
          ============================================================ */}
      <section className="py-20 bg-gradient-to-br from-[#06245B] via-[#0A3078] to-[#1266D6] text-white relative overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="container max-w-4xl mx-auto text-center px-4 relative z-10">
          <Building2 size={48} className="text-[#00D9F5] mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            {isAr ? 'جاهز لتطوير مشتريات مصنعك؟' : 'Ready to Streamline Your Industrial Procurement?'}
          </h2>
          <p className="text-base sm:text-xl text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'انضم إلى نخبة المصانع والشركات الصناعية في مصر وسجل حساب شركتك في دقائق معدودة.'
              : 'Join leading Egyptian factories and raw material suppliers. Set up your enterprise account in minutes.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              as={Link}
              to="/register"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto text-base font-bold shadow-xl shadow-cyan-500/25"
              iconEnd={<ArrowRight size={20} />}
            >
              {isAr ? 'سجل شركتك الآن مجاناً' : 'Register Your Company Now'}
            </Button>
            <Button
              as={Link}
              to="/login"
              variant="outline-white"
              size="lg"
              className="w-full sm:w-auto text-base"
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In to Your Account'}
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
