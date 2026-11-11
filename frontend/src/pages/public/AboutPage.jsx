import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Building2,
  Factory,
  FileText,
  Gavel,
  Truck,
  Search,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Scale,
  Sparkles,
  Layers,
  Award,
  MapPin,
  Users,
  Globe,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import { useTranslation } from '../../hooks/useTranslation'
import Logo from '../../components/common/Logo'
import Footer from '../../components/layout/Footer'
import DonutChart from '../../components/charts/DonutChart'

export default function AboutPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'

  const marketPainPoints = [
    {
      title: isAr ? 'تشتت الموردين وانعدام الموثوقية' : 'Fragmented Supplier Discovery',
      desc: isAr
        ? 'تعتمد المصانع تقليدياً على وسطاء غير رسميين وشبكات علاقات محدودة دون تدقيق موثق للسجلات الضريبية والتجارية.'
        : 'Factories traditionally rely on informal middlemen and word-of-mouth networks with zero vetting of commercial credentials.',
    },
    {
      title: isAr ? 'مواصفات غير قياسية وتباين الجودة' : 'Non-Standard Specifications',
      desc: isAr
        ? 'غياب التوصيف الفني الموحد للخامات الصناعية يؤدي إلى استلام بضائع غير مطابقة للمواصفات الإنتاجية المطلوبة.'
        : 'Lack of standardized technical grading leads to mismatched raw materials and costly factory production halts.',
    },
    {
      title: isAr ? 'تقلبات الأسعار وغياب الشفافية' : 'Opaque & Volatile Pricing',
      desc: isAr
        ? 'مفاوضات هاتفية شاقة بدون منافسة عادلة، مما يمنع المصانع من الحصول على أفضل الأسعار التنافسية العادلة.'
        : 'Unstructured manual negotiations prevent fair price discovery and expose manufacturers to arbitrary price surges.',
    },
    {
      title: isAr ? 'مخاطر التخلف عن التوريد والتسليم' : 'Fulfillment & Logistics Risk',
      desc: isAr
        ? 'تأخر الشحنات وتضارب مواعيد التسليم دون وجود عقود ملزمة أو تتبع لمراحل النقل من المستودع إلى باب المصنع.'
        : 'Unreliable freight dispatch and broken delivery promises without binding commercial commitments or logistics tracking.',
    },
  ]

  const strategicPillars = [
    {
      icon: ShieldCheck,
      title: isAr ? 'تحقق قانوني وضريبي صارم' : 'Strict Enterprise Vetting',
      desc: isAr
        ? 'كل شركة مسجلة تخضع للفحص المباشر عبر السجل التجاري الرسمي والبطاقة الضريبية المعتمدة قبل السماح بأي نشاط تجاري.'
        : 'Every company undergoes strict document verification (Commercial Registration & Tax Card vetting) before conducting business.',
      bullets: isAr
        ? ['فحص قانوني للكيان التجاري', 'عزل السجلات الضريبية الخاصة', 'مكافحة الشركات الوهمية']
        : ['Legal entity validation', 'Isolated private tax records', 'Protection against shell entities'],
    },
    {
      icon: FileText,
      title: isAr ? 'نظام مناقصات وعروض أسعار منظم' : 'Structured RFQ & Reverse Bidding',
      desc: isAr
        ? 'نظام طلبات عروض أسعار (RFQ) يحدد الكميات والمواصفات بدقة، مع استقبال عروض تفصيلية ومراجعات موثقة بسجل تدقيق كامل.'
        : 'Formal bidding system with itemized unit pricing, delivery schedules, and immutable revision histories.',
      bullets: isAr
        ? ['تسعير مفصل لكل بند صناعي', 'سجل تدقيق كامل للمراجعات', 'فترة صلاحية واضحة للعروض']
        : ['Line-by-line item pricing', 'Immutable revision audit trails', 'Strict quote validity windows'],
    },
    {
      icon: Scale,
      title: isAr ? 'صفقات ملزمة وتجميد تجاري' : 'Contractually Binding Deals',
      desc: isAr
        ? 'بمجرد قبول العرض، تتشكل صفقة تجارية ملزمة تجمد الأسعار والكميات والمواعيد المتفق عليها دون أي مجال للتراجع المنفرد.'
        : 'Offer acceptance forms an atomic binding deal with frozen commercial snapshots and unambiguous legal terms.',
      bullets: isAr
        ? ['تجميد فوري للأسعار والكميات', 'منع الإلغاء العشوائي', 'حماية حقوق الطرفين']
        : ['Frozen commercial snapshots', 'Protection against unilateral default', 'Enforceable counterparty terms'],
    },
    {
      icon: Truck,
      title: isAr ? 'إدارة لوجستية وتتبع الشحنات' : 'Transparent Logistics Tracking',
      desc: isAr
        ? 'دعم الشحن الذاتي عبر المورد أو عبر أسطول شركاء DealZone المعتمدين، مع تحديث معالم التوصيل خطوة بخطوة.'
        : 'Support for Supplier-Arranged or DealZone-Arranged freight with real-time milestone dispatch tracking.',
      bullets: isAr
        ? ['تتبع مسار الشحنة بالكامل', 'تأكيد الاستلام عند الفحص', 'تسوية فورية عند التسليم']
        : ['Real-time transit updates', 'On-site delivery inspection sign-off', 'Direct fulfillment closure'],
    },
  ]

  const categoryShare = [
    { label: isAr ? 'حديد وصلب ومعادن' : 'Steel & Metallurgy', value: 40, color: '#06245B' },
    { label: isAr ? 'كيماويات وبتروكيماويات' : 'Industrial Chemicals', value: 30, color: '#1266D6' },
    { label: isAr ? 'بوليمرات ولدائن' : 'Polymers & Plastics', value: 18, color: '#00D9F5' },
    { label: isAr ? 'تعبئة وتغليف وألياف' : 'Packaging & Textiles', value: 12, color: '#10B981' },
  ]

  const platforms = [
    { icon: MapPin, label: isAr ? 'العاشر من رمضان' : '10th of Ramadan' },
    { icon: MapPin, label: isAr ? 'السادس من أكتوبر' : '6th of October' },
    { icon: MapPin, label: isAr ? 'برج العرب' : 'Borg El Arab' },
    { icon: MapPin, label: isAr ? 'مدينة السادات' : 'Sadat City' },
    { icon: MapPin, label: isAr ? 'القاهرة الكبرى' : 'Greater Cairo' },
    { icon: MapPin, label: isAr ? 'الإسكندرية' : 'Alexandria' },
  ]

  return (
    <div className="min-h-screen bg-[#F4F7FB] selection:bg-[#00D9F5]/20 selection:text-[#06245B]">
      {/* ============================================================
          HERO SECTION — WITH REAL IMAGE BACKGROUND
          ============================================================ */}
      <section className="relative overflow-hidden min-h-[70vh] flex items-center text-white">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/about-why-choose-us.jpeg"
            alt="About DealZone — industrial procurement platform"
            className="w-full h-full object-cover object-center"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#06245B]/95 via-[#0A3078]/90 to-[#1266D6]/85" />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10 pt-24 pb-28 px-4 sm:px-6">
          

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.15]">
            {isAr ? (
              <>
                نبني مستقبل <span className="text-[#00D9F5]">التوريد الصناعي</span>
                <br />
                في جمهورية مصر العربية
              </>
            ) : (
              <>
                Engineering the Future of
                <br />
                <span className="text-[#00D9F5]">Industrial Procurement</span> in Egypt
              </>
            )}
          </h1>

          <p className="text-base sm:text-xl text-slate-100 max-w-3xl mx-auto leading-relaxed mb-10">
            {isAr
              ? 'DealZone هي المنصة الرقمية الموحدة لربط مصانع الإنتاج بموردي المواد الخام المعتمدين في مصر. نوفر بنية تعاقدية شفافة، تسعيراً تنافسياً، وتتبعاً لوجستياً دقيقاً يحمي استمرارية سلاسل الإمداد الوطنية.'
              : 'DealZone is the standardized B2B digital marketplace bridging Egyptian manufacturing factories with verified raw material suppliers. We provide contract transparency, fair competitive pricing, and end-to-end fulfillment tracking.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              as={Link}
              to="/register"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto font-bold shadow-lg shadow-cyan-500/20"
              iconEnd={<ArrowRight size={20} />}
            >
              {isAr ? 'انضم إلى شبكة المصانع والموردين' : 'Join Our Industrial Network'}
            </Button>
            <Button
              as={Link}
              to="/catalog"
              variant="outline-white"
              size="lg"
              className="w-full sm:w-auto text-base"
            >
              {isAr ? 'استعراض الكتالوج المعتمد' : 'Explore Raw Materials'}
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================
          THE CORE PROBLEM
          ============================================================ */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-[#1266D6] font-bold text-xs uppercase tracking-widest mb-2">
              {isAr ? 'التحدي الصناعي' : 'The Industry Challenge'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06245B] tracking-tight mb-4">
              {isAr ? 'لماذا تحتاج الصناعة المصرية إلى DealZone؟' : "Why Egypt's Industrial Sector Demands DealZone"}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {isAr
                ? 'تاريخياً، عانى قطاع التوريد الصناعي في المناطق الصناعية من تحديات عطلت خطوط الإنتاج وأهدرت السيولة المالية.'
                : 'Historically, manufacturing hubs across Egypt have faced procurement opacity, unverified quality claims, and fulfillment defaults that disrupt industrial factory production.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {marketPainPoints.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#F8FAFC] rounded-2xl p-6 border border-slate-200/80 hover:border-[#1266D6] hover:shadow-md transition-all duration-200"
              >
                <div className="text-[#EF4444] font-black text-xl mb-3">0{idx + 1}</div>
                <h3 className="text-base font-bold text-[#06245B] mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          STRATEGIC PILLARS WITH IMAGE
          ============================================================ */}
      <section className="py-20 bg-[#F4F7FB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-[#1266D6] font-bold text-xs uppercase tracking-widest mb-2">
              {isAr ? 'ركائز المنصة' : 'Architectural Pillars'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06245B] tracking-tight mb-4">
              {isAr ? 'أركان الثقة والشفافية في DealZone' : 'The Four Pillars of Industrial Trust'}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {isAr
                ? 'قمنا بهندسة بنية تكنولوجية وقانونية تضمن أمان المعاملات وتلزم الطرفين بأعلى معايير الانضباط التجاري.'
                : 'Engineered with clean architectural standards to ensure counterparty security, audit readiness, and commercial binding.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {strategicPillars.map((pillar, idx) => {
              const Icon = pillar.icon
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#EAF4FF] text-[#1266D6] flex items-center justify-center mb-6 shadow-xs">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-[#06245B] mb-3">{pillar.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">{pillar.desc}</p>
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    {pillar.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <CheckCircle2 size={15} className="text-[#10B981] shrink-0" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS — IMAGE SPLIT SECTION
          ============================================================ */}
      <section className="py-20 bg-white border-t border-slate-200 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image side */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] order-2 lg:order-1">
              <img
                src="/images/how-it-works-logistics.jpeg"
                alt="How DealZone logistics and procurement works"
                className="w-full h-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06245B]/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF4FF] flex items-center justify-center shrink-0">
                      <Truck size={18} className="text-[#1266D6]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#06245B]">
                        {isAr ? 'تتبع الشحنة خطوة بخطوة' : 'Real-time shipment tracking'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {isAr ? 'من المستودع حتى باب المصنع' : 'From warehouse to factory door'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text side */}
            <div className="order-1 lg:order-2">
              <div className="text-[#1266D6] font-bold text-xs uppercase tracking-widest mb-3">
                {isAr ? 'كيف تعمل المنصة' : 'How It Works'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06245B] tracking-tight mb-6">
                {isAr ? 'ثلاث خطوات بسيطة لصفقة ناجحة' : 'Three Steps to a Closed Deal'}
              </h2>
              <div className="space-y-6">
                {[
                  {
                    step: '01',
                    title: isAr ? 'انشر طلب الشراء' : 'Publish Your RFQ',
                    desc: isAr ? 'حدد المواد والكميات والمواصفات' : 'Specify materials, quantities, and technical specs',
                  },
                  {
                    step: '02',
                    title: isAr ? 'استلم العروض وقارنها' : 'Receive & Compare Offers',
                    desc: isAr ? 'مقارنة بند ببند من موردين معتمدين' : 'Line-by-line comparison from verified suppliers',
                  },
                  {
                    step: '03',
                    title: isAr ? 'ثبّت الصفقة وتابع الشحن' : 'Close Deal & Track Logistics',
                    desc: isAr ? 'عقد ملزم فوري مع تتبع الشحنة' : 'Instant binding contract with shipment tracking',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="text-2xl font-black text-[#00D9F5] leading-none w-8 shrink-0 mt-1">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-bold text-[#06245B] mb-1">{item.title}</h4>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button as={Link} to="/register" variant="primary" size="md" iconEnd={<ArrowRight size={18} />}>
                  {isAr ? 'ابدأ الآن مجاناً' : 'Get Started Free'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          DUAL B2B ECOSYSTEM (BUYERS VS SUPPLIERS)
          ============================================================ */}
      <section className="py-20 bg-[#F4F7FB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06245B] tracking-tight mb-4">
              {isAr ? 'منظومة متكاملة تخدم طرفي المعادلة الصناعية' : 'Empowering Both Sides of Egyptian Industry'}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              {isAr
                ? 'سواء كنت مديراً لمشتريات مصنع أو مورداً لكبرى الخامات، تقدم لك DealZone أدوات مخصصة لاحتياجاتك.'
                : 'Tailored operational workflows engineered specifically for enterprise buyers and verified suppliers.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Buyers card with image */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="relative h-48 overflow-hidden">
                <img
                  src="/images/tenders-reverse-bidding.jpeg"
                  alt="For industrial buyers"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06245B]/80 via-[#06245B]/20 to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#06245B] text-white flex items-center justify-center shadow-md">
                    <Factory size={24} />
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-extrabold text-[#06245B] mb-3">
                  {isAr ? 'للمصانع والمشترين الصناعيين' : 'For Industrial Manufacturers & Buyers'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {isAr
                    ? 'حافظ على استمرارية خطوط إنتاجك بأفضل تكلفة توريد ودون مخاطر التعامل مع جهات غير موثقة.'
                    : 'Secure continuous factory operations with competitive raw material quotes and guaranteed supplier vetting.'}
                </p>
                <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
                    <span>{isAr ? 'نشر مناقصات وطلبات شراء محددة المواصفات' : 'Publish custom tenders with exact technical grades'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
                    <span>{isAr ? 'استقبال عروض أسعار متنافسة ومقارنتها بنداً ببند' : 'Receive and compare line-by-line itemized bids'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
                    <span>{isAr ? 'تجميد الأسعار وحماية ميزانية المشتريات' : 'Lock commercial budgets with frozen price snapshots'}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Suppliers card with image */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="relative h-48 overflow-hidden">
                <img
                  src="/images/marketplace-categories.jpeg"
                  alt="For raw material suppliers"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1266D6]/80 via-[#1266D6]/20 to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#00D9F5] text-[#06245B] flex items-center justify-center shadow-md">
                    <Building2 size={24} />
                  </div>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-extrabold text-[#06245B] mb-3">
                  {isAr ? 'لموردي وموزعي المواد الخام' : 'For Raw Material Suppliers & Distributors'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {isAr
                    ? 'وسع قاعدة عملائك الصناعيين في جميع المحافظات، وشارك في مناقصات كبرى المصانع بضمانات تعاقدية واضحة.'
                    : 'Expand your factory customer base across Egyptian industrial governorates with credit-vetted counterparties.'}
                </p>
                <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
                    <span>{isAr ? 'الوصول المباشر لطلبات الشراء الجادة فور نشرها' : 'Direct access to verified high-volume industrial tenders'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
                    <span>{isAr ? 'تقديم عروض أسعار تفصيلية وإجراء المراجعات بسهولة' : 'Structured proposal submission and revision management'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
                    <span>{isAr ? 'بناء سجل تجاري وتقييمات موثقة تزيد من موثوقيتك' : 'Build a verified counterparty track record and review score'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          RAW MATERIAL TAXONOMY & METRICS SECTION
          ============================================================ */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[#1266D6] font-bold text-xs uppercase tracking-widest mb-2">
                {isAr ? 'الكتالوج والتصنيف الموحد' : 'Standardized Taxonomy'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06245B] tracking-tight mb-4">
                {isAr ? 'كتالوج صناعي يغطي شريان الصناعة المصرية' : "Covering Egypt's Strategic Industrial Materials"}
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {isAr
                  ? 'يصنف كتالوج DealZone آلاف المواد الخام الصناعية وفق المعايير القياسية العالمية والمحلية، مع وحدات قياس عالية الدقة.'
                  : 'Our standardized bilingual taxonomy organizes raw materials by precise industrial grades and certified measurement units (MT, kg, L) to eliminate specification mismatch.'}
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F4F7FB] border border-slate-200/80">
                  <Award size={20} className="text-[#1266D6] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-[#06245B]">
                      {isAr ? 'مطابقة للمواصفات القياسية (ASTM, DIN, ISO)' : 'Global Standard Conformity (ASTM, DIN, ISO)'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isAr ? 'شهادات تحليل واختبارات الجودة مرفقة مع كل صفقة.' : 'Mill test certificates and chemical assay reports supported.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F4F7FB] border border-slate-200/80">
                  <Layers size={20} className="text-[#00D9F5] mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-[#06245B]">
                      {isAr ? 'دعم العملة المحلية EGP دون تعقيدات' : 'EGP Currency Precision (18,2)'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isAr ? 'تسعير مالي دقيق بالجنيه المصري يسهل المعاملات المحاسبية.' : 'Precise financial calculations tailored to domestic procurement.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Industrial zones coverage */}
              <div className="mt-6">
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">
                  {isAr ? 'المناطق الصناعية المدعومة' : 'Industrial Zones Covered'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((z, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1 bg-[#EAF4FF] rounded-full text-xs font-semibold text-[#06245B]"
                    >
                      <z.icon size={11} className="text-[#1266D6]" />
                      {z.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#F4F7FB] rounded-3xl p-8 border border-slate-200/80 shadow-md">
              <h3 className="text-base font-bold text-[#06245B] mb-2 text-center sm:text-start">
                {isAr ? 'حصة القطاعات الصناعية على المنصة' : 'Marketplace Sourcing Sector Share'}
              </h3>
              <p className="text-xs text-slate-500 mb-6 text-center sm:text-start">
                {isAr ? 'التوزيع النسبي للمواد الخام عبر كبرى القطاعات الإنتاجية' : 'Distribution of demand across core Egyptian manufacturing branches'}
              </p>
              <DonutChart
                data={categoryShare}
                centerLabel={isAr ? 'المواد' : 'Sectors'}
                centerValue="100%"
                size={200}
                strokeWidth={26}
              />
              <p className="text-[10px] text-slate-400 text-center mt-4">
                {isAr ? '* بيانات توضيحية — تعكس الاتجاه العام للطلب' : '* Illustrative data — reflects general demand trend'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          BOTTOM CALL TO ACTION
          ============================================================ */}
      <section className="py-20 bg-gradient-to-br from-[#06245B] via-[#0A3078] to-[#1266D6] text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <Logo size="xl" variant="white" link={false} className="justify-center mb-6" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            {isAr ? 'جاهز لتطوير تجارة وتوريد مصنعك؟' : 'Ready to Elevate Your Industrial Sourcing?'}
          </h2>
          <p className="text-base sm:text-xl text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'انضم اليوم إلى أكبر شبكة للمصانع وموردي المواد الخام في مصر، وسجل حسابك مجاناً.'
              : "Join Egypt's premier digital procurement platform. Set up your enterprise account in minutes."}
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
              to="/catalog"
              variant="outline-white"
              size="lg"
              className="w-full sm:w-auto text-base"
            >
              {isAr ? 'تصفح الكتالوج' : 'Browse Materials Catalog'}
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
