import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Package,
  Layers,
  ArrowRight,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Send,
  Building2,
  FileText,
  PlusCircle,
  Tag,
  Info,
} from 'lucide-react'
import { catalogService } from '../../shared/api/services/catalogService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../../hooks/useToast'
import { getLocalizedField } from '../../utils/format'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

// ============================================================
// STANDARDIZED INDUSTRIAL TAXONOMY (OFFICIAL SEED PARITY)
// Guarantees zero blank screen when offline or before DB seed
// ============================================================
const DEFAULT_CATEGORIES = [
  {
    id: 'cat-metals',
    code: 'METALS',
    nameAr: 'المعادن والصلب',
    nameEn: 'Metals & Steel',
    descriptionAr: 'منتجات الصلب والحديد والمعادن الصناعية',
    descriptionEn: 'Industrial steel, iron, and metal raw materials',
    itemCount: 4,
  },
  {
    id: 'cat-polymers',
    code: 'POLYMERS',
    nameAr: 'البوليمرات والبلاستيك الصناعي',
    nameEn: 'Polymers & Plastics',
    descriptionAr: 'حبيبات ومواد خام البلاستيك والبوليمرات',
    descriptionEn: 'Plastic resins, polymers, and raw plastic materials',
    itemCount: 4,
  },
  {
    id: 'cat-chemicals',
    code: 'CHEMICALS',
    nameAr: 'الكيماويات والمذيبات الصناعية',
    nameEn: 'Industrial Chemicals & Solvents',
    descriptionAr: 'الكيماويات والمذيبات والمواد الوسيطة الصناعية',
    descriptionEn: 'Industrial chemicals, solvents, and intermediates',
    itemCount: 4,
  },
  {
    id: 'cat-packaging',
    code: 'PACKAGING',
    nameAr: 'التعبئة والتغليف والألياف الصناعية',
    nameEn: 'Industrial Packaging & Film',
    descriptionAr: 'أكياس وبكرات ورولات التعبئة والتغليف الصناعي',
    descriptionEn: 'Industrial packaging bags, films, and corrugated materials',
    itemCount: 2,
  },
]

const DEFAULT_MATERIALS = [
  {
    id: 'mat-1',
    categoryId: 'cat-metals',
    code: 'STEEL-REBAR-B500D',
    nameAr: 'حديد تسليح عالي المقاومة B500D',
    nameEn: 'High-Tensile Steel Rebar Grade B500D',
    categoryNameAr: 'المعادن والصلب',
    categoryNameEn: 'Metals & Steel',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'ES 262-2 / ISO 6935-2',
    grade: 'B500D',
    specsAr: 'أقطار 10 إلى 32 مم • أطوال مستقيمة 12م • مطابق للمواصفات المصرية',
    specsEn: 'Diameters 10–32mm • 12m Straight Lengths • Egyptian Standard ES 262-2',
  },
  {
    id: 'mat-2',
    categoryId: 'cat-metals',
    code: 'STEEL-COIL-HRC',
    nameAr: 'لفائف صلب مدلفن على الساخن HRC',
    nameEn: 'Hot-Rolled Steel Coils (HRC)',
    categoryNameAr: 'المعادن والصلب',
    categoryNameEn: 'Metals & Steel',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'ASTM A36 / EN 10025-2',
    grade: 'S235JR / S275JR',
    specsAr: 'سماكات من 1.8 إلى 12.7 مم • عروض 1000-1500 مم للصناعات الهندسية',
    specsEn: 'Thickness 1.8–12.7mm • Width 1000–1500mm for engineering uses',
  },
  {
    id: 'mat-3',
    categoryId: 'cat-metals',
    code: 'STEEL-BILLET-3SP',
    nameAr: 'مربعات صلب (بيلت) 150×150 مم 3SP/5SP',
    nameEn: 'Steel Billets 150x150mm Grade 3SP/5SP',
    categoryNameAr: 'المعادن والصلب',
    categoryNameEn: 'Metals & Steel',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'GOST 380 / ASTM A615',
    grade: '3SP / 5SP',
    specsAr: 'أطوال 6 أو 12 متراً • نسبة كربون محكمة لمصانع الدرفلة',
    specsEn: 'Length 6m/12m • Re-rolling quality for bar mills',
  },
  {
    id: 'mat-4',
    categoryId: 'cat-metals',
    code: 'STEEL-BEAM-IPE',
    nameAr: 'قطاعات كمرات حديد إنشائي IPE / HEA',
    nameEn: 'Structural Steel I-Beams (IPE / HEA)',
    categoryNameAr: 'المعادن والصلب',
    categoryNameEn: 'Metals & Steel',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'EN 10034 / DIN 1025',
    grade: 'S275JR / S355JR',
    specsAr: 'مقاسات من IPE 100 إلى 400 • لهياكل المصانع والمنشآت المعدنية',
    specsEn: 'Sizes IPE 100 to 400 • For industrial steel buildings and warehouses',
  },
  {
    id: 'mat-5',
    categoryId: 'cat-polymers',
    code: 'HDPE-BLOW-5502',
    nameAr: 'حبيبات بولي إيثيلين عالي الكثافة للنفخ',
    nameEn: 'HDPE Blow Molding Resin Grade 5502',
    categoryNameAr: 'البوليمرات والبلاستيك الصناعي',
    categoryNameEn: 'Polymers & Plastics',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'ISO 1133 / ASTM D1238',
    grade: 'Blow Molding 5502',
    specsAr: 'مؤشر انسياب 0.35 جم/10 دقائق • كثافة 0.954 • لتصنيع العبوات والجالونات',
    specsEn: 'MFI 0.35 g/10min • Density 0.954 • For bottles & jerrycans',
  },
  {
    id: 'mat-6',
    categoryId: 'cat-polymers',
    code: 'LDPE-FILM-2102',
    nameAr: 'حبيبات بولي إيثيلين منخفض الكثافة للأفلام',
    nameEn: 'LDPE Film Extrusion Resin Grade 2102',
    categoryNameAr: 'البوليمرات والبلاستيك الصناعي',
    categoryNameEn: 'Polymers & Plastics',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'ASTM D1238',
    grade: 'Film Grade 2102TN26',
    specsAr: 'مؤشر انسياب 2.0 • لإنتاج أكياس التغليف والأفلام الزراعية والحرارية',
    specsEn: 'MFI 2.0 • For heavy-duty packaging bags and shrink films',
  },
  {
    id: 'mat-7',
    categoryId: 'cat-polymers',
    code: 'PP-RAFFIA-030',
    nameAr: 'حبيبات بولي بروبيلين غزل وخيوط (رافيا)',
    nameEn: 'Polypropylene (PP) Raffia Grade',
    categoryNameAr: 'البوليمرات والبلاستيك الصناعي',
    categoryNameEn: 'Polymers & Plastics',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'ASTM D1238',
    grade: 'Homopolymer Raffia',
    specsAr: 'مؤشر انسياب 3.0 • لمصانع أجولة الأسمنت والأسمدة المنسوجة',
    specsEn: 'MFI 3.0 • For woven sacks, FIBC jumbo bags, and twine',
  },
  {
    id: 'mat-8',
    categoryId: 'cat-polymers',
    code: 'PVC-RESIN-S65',
    nameAr: 'خام بولي فينيل كلوريد سسبنشن PVC K67/S65',
    nameEn: 'Suspension PVC Resin Grade K67 / S65',
    categoryNameAr: 'البوليمرات والبلاستيك الصناعي',
    categoryNameEn: 'Polymers & Plastics',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'ISO 1268-1',
    grade: 'K-Value 67',
    specsAr: 'قيمة K = 67 • لمصانع مواسير الصرف ومجاري الكابلات البلاستيكية',
    specsEn: 'K-Value 67 • For rigid pipes, conduit profiles, and fittings',
  },
  {
    id: 'mat-9',
    categoryId: 'cat-chemicals',
    code: 'CHEM-ACETONE-995',
    nameAr: 'أسيتون صناعي نقي 99.5%',
    nameEn: 'Technical Acetone Pure 99.5%',
    categoryNameAr: 'الكيماويات والمذيبات الصناعية',
    categoryNameEn: 'Industrial Chemicals & Solvents',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'ASTM D329',
    grade: 'Purity 99.5%',
    specsAr: 'سائل نقي خالي من الشوائب • لمصانع الدهانات والمذيبات وراتنجات البوليستر',
    specsEn: 'High-purity industrial solvent for paints, coatings, and resins',
  },
  {
    id: 'mat-10',
    categoryId: 'cat-chemicals',
    code: 'CHEM-CAUSTIC-FLAKES',
    nameAr: 'صودا كاوية قشور (هيدروكسيد صوديوم) 99%',
    nameEn: 'Caustic Soda Flakes (NaOH) 99%',
    categoryNameAr: 'الكيماويات والمذيبات الصناعية',
    categoryNameEn: 'Industrial Chemicals & Solvents',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'IS 252 / Egyptian Standard',
    grade: 'Industrial Flakes 99%',
    specsAr: 'قشور بيضاء عالية التركيز • للصناعات النسيجية والصابون ومعالجة المياه',
    specsEn: 'White flakes 99% purity • For textiles, detergents, and water treatment',
  },
  {
    id: 'mat-11',
    categoryId: 'cat-chemicals',
    code: 'CHEM-SULFURIC-98',
    nameAr: 'حمض كبريتيك صناعي مركز 98%',
    nameEn: 'Sulfuric Acid Technical Grade 98%',
    categoryNameAr: 'الكيماويات والمذيبات الصناعية',
    categoryNameEn: 'Industrial Chemicals & Solvents',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'BS 3903 / ES 128',
    grade: 'Concentrated 98%',
    specsAr: 'حمض نقي للصناعات الكيماوية وإنتاج الأسمدة ومصانع البطاريات',
    specsEn: 'Concentrated 98% • For fertilizer production and chemical synthesis',
  },
  {
    id: 'mat-12',
    categoryId: 'cat-chemicals',
    code: 'CHEM-TOLUENE-99',
    nameAr: 'تولوين صناعي نقي 99.5%',
    nameEn: 'Pure Industrial Toluene 99.5%',
    categoryNameAr: 'الكيماويات والمذيبات الصناعية',
    categoryNameEn: 'Industrial Chemicals & Solvents',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'ASTM D841',
    grade: 'Nitration / Industrial',
    specsAr: 'مذيب عطري عالي الجودة للدهانات ومصانع الأحبار واللواصق الصناعية',
    specsEn: 'Aromatic solvent for industrial coatings, thinners, and adhesives',
  },
  {
    id: 'mat-13',
    categoryId: 'cat-packaging',
    code: 'PKG-FLUTING-125',
    nameAr: 'ورق فلوتنج وتست لاينر للكرتون 125 جم',
    nameEn: 'Fluting Medium & Testliner Paper 125 GSM',
    categoryNameAr: 'التعبئة والتغليف والألياف الصناعية',
    categoryNameEn: 'Industrial Packaging & Film',
    defaultUnitNameAr: 'طن متري',
    defaultUnitNameEn: 'Metric Ton',
    defaultUnitCode: 'ton',
    standard: 'ISO 7263 / TAPPI T809',
    grade: 'Recycled 125 GSM',
    specsAr: 'رولات ورق مدعمة لمصانع الكرتون المضلع وعلب الشحن الصناعية',
    specsEn: 'Paper reels for corrugated box manufacturing and industrial packaging',
  },
  {
    id: 'mat-14',
    categoryId: 'cat-packaging',
    code: 'PKG-PP-SACK-50KG',
    nameAr: 'أجولة بولي بروبيلين منسوجة 50 كجم',
    nameEn: 'Woven Polypropylene Sacks (50 kg Capacity)',
    categoryNameAr: 'التعبئة والتغليف والألياف الصناعية',
    categoryNameEn: 'Industrial Packaging & Film',
    defaultUnitNameAr: 'ألف قطعة',
    defaultUnitNameEn: 'Thousand Pcs',
    defaultUnitCode: 'pcs',
    standard: 'ES 1502 / ISO 21898',
    grade: 'Laminated / Unlaminated',
    specsAr: 'أجولة عالية التحمل لتعبئة الأسمنت والكيماويات والحبوب الزراعية',
    specsEn: 'Heavy-duty woven bags for cement, fertilizers, and industrial chemicals',
  },
]

export default function CatalogPage() {
  const { t, language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const toast = useToast()
  const { canManageRfqs, canSubmitOffers, isBuyer, isSupplier, isVerified, isAuthLoading } = usePermissions()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState()
  const [suppliedMaterials, setSuppliedMaterials] = useState(() => {
    try {
      const stored = localStorage.getItem('dz_supplier_catalog')
      return stored ? JSON.parse(stored) : ['mat-1', 'mat-5']
    } catch {
      return ['mat-1', 'mat-5']
    }
  })

  // 1. Fetch categories with fallback
  const { data: apiCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: async () => {
      try {
        const res = await catalogService.getCategories()
        return res?.length ? res : DEFAULT_CATEGORIES
      } catch {
        return DEFAULT_CATEGORIES
      }
    },
    staleTime: 60_000,
  })

  // 2. Fetch materials with fallback
  const { data: apiMaterialsPage, isLoading: materialsLoading } = useQuery({
    queryKey: ['catalog', 'materials', { categoryId: selectedCategoryId, searchTerm }],
    queryFn: async () => {
      try {
        const res = await catalogService.getMaterials({
          categoryId: selectedCategoryId,
          searchTerm: searchTerm || undefined,
          pageNumber: 1,
          pageSize: 50,
        })
        return res?.items?.length ? res : null
      } catch {
        return null
      }
    },
    staleTime: 60_000,
  })

  // Resolve categories (API or Fallback)
  const categories = useMemo(() => {
    return apiCategories?.length ? apiCategories : DEFAULT_CATEGORIES
  }, [apiCategories])

  // Resolve materials list (API or Fallback with client search & category filter)
  const materials = useMemo(() => {
    if (apiMaterialsPage?.items?.length) {
      return apiMaterialsPage.items
    }
    // Filter fallback baseline
    return DEFAULT_MATERIALS.filter((mat) => {
      const matchesCategory = !selectedCategoryId || mat.categoryId === selectedCategoryId
      const term = searchTerm.trim().toLowerCase()
      if (!term) return matchesCategory
      const matchesSearch =
        mat.code.toLowerCase().includes(term) ||
        mat.nameAr.toLowerCase().includes(term) ||
        mat.nameEn.toLowerCase().includes(term) ||
        (mat.specsAr && mat.specsAr.toLowerCase().includes(term)) ||
        (mat.specsEn && mat.specsEn.toLowerCase().includes(term))
      return matchesCategory && matchesSearch
    })
  }, [apiMaterialsPage, selectedCategoryId, searchTerm])

  // Supplier action: Toggle supply capability
  const toggleSupplierCapability = (materialId, materialName) => {
    const next = suppliedMaterials.includes(materialId)
      ? suppliedMaterials.filter((id) => id !== materialId)
      : [...suppliedMaterials, materialId]
    setSuppliedMaterials(next)
    try {
      localStorage.setItem('dz_supplier_catalog', JSON.stringify(next))
    } catch {}

    if (next.includes(materialId)) {
      toast.success(
        isAr
          ? `تمت إضافة "${materialName}" إلى قائمة المواد الموردة الخاصة بك`
          : `Added "${materialName}" to your supply capabilities catalog`
      )
    } else {
      toast.info(
        isAr
          ? `تمت إزالة "${materialName}" من قائمة التوريد الخاصة بك`
          : `Removed "${materialName}" from your supply capabilities`
      )
    }
  }

  // Buyer action: Pre-fill RFQ creation
  const handleBuyerRequestQuote = (material) => {
    const matName = getLocalizedField(material, 'name', language)
    const unitName = getLocalizedField(material, 'defaultUnitName', language)
    navigate(
      `/rfqs/create?materialCode=${encodeURIComponent(material.code)}&materialName=${encodeURIComponent(
        matName
      )}&unit=${encodeURIComponent(unitName || 'ton')}&catId=${encodeURIComponent(material.categoryId || '')}`
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Search Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1266D6] text-xs font-bold mb-2">
              <Layers size={14} />
              <span>{isAr ? 'الكتالوج الصناعي الموحد' : 'Unified Materials Taxonomy'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] tracking-tight">
              {isAr ? 'كتالوج المواد الخام الصناعية' : 'Raw Materials Marketplace Catalog'}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {isBuyer
                ? isAr
                  ? 'تصفح مواصفات المواد القياسية واطلب عروض أسعار تنافسية مباشرة من الموردين المعتمدين.'
                  : 'Browse verified industrial raw materials and request competitive tender quotes from certified suppliers.'
                : isAr
                ? 'استعرض الكتالوج الصناعي القياسي وحدد المواد التي تستطيع شركتك توريدها للمصانع.'
                : 'Review standard industrial taxonomy and register the raw materials your company supplies to manufacturers.'}
            </p>
          </div>

          {/* Role-specific header action */}
          {canManageRfqs && (
            <Button
              as={Link}
              to="/rfqs/create"
              variant="primary"
              size="md"
              icon={<PlusCircle size={18} />}
              className="shrink-0"
            >
              {isAr ? 'إنشاء طلب سعر مخصص' : 'Create Custom RFQ'}
            </Button>
          )}
        </div>

        {/* Search input with live debounced filter */}
        <div className="relative">
          <Input
            placeholder={
              isAr
                ? 'ابحث باسم المادة، كود الصنف، درجات النقاء، أو كود المواصفة القياسية (ASTM / ISO / ES)...'
                : 'Search by material name, code, grade, or industrial standard (ASTM / ISO / ES)...'
            }
            startIcon={<Search size={18} className="text-[#1266D6]" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-base"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded-md"
            >
              {isAr ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
      </div>

      {/* Main Catalog Layout (Category Sidebar + Material Cards Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs sticky top-24">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-[#06245B] text-base flex items-center gap-2">
                <Filter size={18} className="text-[#1266D6]" />
                <span>{isAr ? 'القطاعات الصناعية' : 'Industry Sectors'}</span>
              </h3>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {categories.length}
              </span>
            </div>

            <ul className="space-y-1.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(undefined)}
                  className={`w-full text-start px-3.5 py-2.5 rounded-2xl transition-all font-semibold flex items-center justify-between ${
                    !selectedCategoryId
                      ? 'bg-[#EAF4FF] text-[#06245B] font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-[#F4F7FB] hover:text-[#06245B]'
                  }`}
                >
                  <span>{isAr ? 'جميع القطاعات' : 'All Categories'}</span>
                  <span className="text-xs font-mono opacity-70">
                    {DEFAULT_MATERIALS.length}
                  </span>
                </button>
              </li>

              {categories.map((cat) => {
                const count = DEFAULT_MATERIALS.filter((m) => m.categoryId === cat.id).length
                const isSelected = selectedCategoryId === cat.id
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`w-full text-start px-3.5 py-2.5 rounded-2xl transition-all flex items-center justify-between text-xs sm:text-sm ${
                        isSelected
                          ? 'bg-[#EAF4FF] text-[#06245B] font-bold shadow-xs'
                          : 'text-slate-600 hover:bg-[#F4F7FB] hover:text-[#06245B]'
                      }`}
                    >
                      <span className="truncate">{getLocalizedField(cat, 'name', language)}</span>
                      {count > 0 && (
                        <span className="text-xs font-mono opacity-70 ms-2">
                          {count}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>

            {/* Sourcing Assurance Tip */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#06245B]">
                <Info size={14} className="text-[#1266D6]" />
                <span>{isAr ? 'معايير الجودة والتوريد' : 'Standard Compliance'}</span>
              </div>
              <p className="leading-relaxed">
                {isAr
                  ? 'جميع المواد مسجلة وفق الأكواد والمواصفات القياسية المصرية (EOS) ومطابقة للمعايير الدولية (ISO / ASTM).'
                  : 'All materials cataloged under EOS, ISO, and ASTM compliance for contract validation.'}
              </p>
            </div>
          </div>
        </aside>

        {/* Materials Grid */}
        <div className="lg:col-span-3">
          {materials.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
              <EmptyState
                icon={Package}
                title={isAr ? 'لم يتم العثور على مواد مطابقة' : 'No Materials Found'}
                description={
                  isAr
                    ? 'جرّب تعديل كلمات البحث أو اختيار قطاع صناعي مختلف لاستعراض المواد المتاحة.'
                    : 'Try adjusting your search terms or select a different industry category.'
                }
                action={
                  <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setSelectedCategoryId(undefined) }}>
                    {isAr ? 'إعادة ضبط التصفية' : 'Reset Filters'}
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map((material) => {
                const matName = getLocalizedField(material, 'name', language)
                const catName = getLocalizedField(material, 'categoryName', language)
                const unitName = getLocalizedField(material, 'defaultUnitName', language)
                const isSupplying = suppliedMaterials.includes(material.id)

                return (
                  <div
                    key={material.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 hover:border-[#1266D6] hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header: Category & Code */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold text-[#1266D6] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                          {catName || 'Industrial Material'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {material.code}
                        </span>
                      </div>

                      {/* Title & Standard */}
                      <h3 className="font-bold text-[#06245B] text-base leading-snug group-hover:text-[#1266D6] transition-colors mb-1.5">
                        {matName}
                      </h3>

                      {material.standard && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                          <Tag size={13} className="text-[#00D9F5]" />
                          <span>{material.standard}</span>
                          {material.grade && (
                            <span className="text-slate-400 font-mono">• {material.grade}</span>
                          )}
                        </div>
                      )}

                      {/* Specifications Summary */}
                      <p className="text-xs text-slate-500 leading-relaxed mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        {isAr ? material.specsAr : material.specsEn}
                      </p>
                    </div>

                    {/* Card Footer: Role Actions & Unit */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-400">
                        <span>{isAr ? 'وحدة التوريد: ' : 'Trading Unit: '}</span>
                        <strong className="text-slate-700 font-semibold">{unitName || 'ton'}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Supplier Experience: Register or remove supply capability */}
                        {isSupplier && (
                          <button
                            type="button"
                            onClick={() => toggleSupplierCapability(material.id, matName)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isSupplying
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={isAr ? 'تحديد كأحد المواد التي توردها' : 'Toggle supply capability'}
                          >
                            <CheckCircle2 size={14} className={isSupplying ? 'text-emerald-600' : 'text-slate-400'} />
                            <span>{isSupplying ? (isAr ? 'أورّد هذه المادة' : 'In My Supply') : (isAr ? 'أستطيع التوريد' : '+ I Supply')}</span>
                          </button>
                        )}

                        {/* Buyer Experience: Request Quotation / RFQ */}
                        {isBuyer && (
                          <Button
                            variant="primary"
                            size="xs"
                            icon={<Send size={13} />}
                            onClick={() => handleBuyerRequestQuote(material)}
                          >
                            {isAr ? 'طلب عرض سعر' : 'Request RFQ'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
