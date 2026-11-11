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
  ShoppingBag,
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
import EntranceAnimation from '../../components/animations/EntranceAnimation'
import DirectPurchaseModal from '../../components/catalog/DirectPurchaseModal'

export default function CatalogPage() {
  const { t, language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const toast = useToast()
  const { canManageRfqs, canSubmitOffers, isBuyer, isSupplier, isVerified, isAuthLoading } = usePermissions()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState()
  const [purchasingMaterial, setPurchasingMaterial] = useState(null)
  const [suppliedMaterials, setSuppliedMaterials] = useState(() => {
    try {
      const stored = localStorage.getItem('dz_supplier_catalog')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // 1. Fetch real categories from database API
  const { data: apiCategories, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: () => catalogService.getCategories(),
    staleTime: 60_000,
  })

  // 2. Fetch materials for selected category/search
  const { data: apiMaterialsPage, isLoading: materialsLoading, error: materialsError } = useQuery({
    queryKey: ['catalog', 'materials', { categoryId: selectedCategoryId, searchTerm }],
    queryFn: () =>
      catalogService.getMaterials({
        categoryId: selectedCategoryId,
        searchTerm: searchTerm.trim() || undefined,
        pageNumber: 1,
        pageSize: 50,
      }),
    staleTime: 60_000,
  })

  // 3. Unfiltered materials count to keep sidebar badges persistent & accurate
  const { data: allMaterialsData, isLoading: allMaterialsLoading } = useQuery({
    queryKey: ['catalog', 'materials', 'all-counts'],
    queryFn: () =>
      catalogService.getMaterials({
        pageNumber: 1,
        pageSize: 100,
      }),
    staleTime: 60_000,
  })

  // Strict 3-category enforcement: Only active Metals, Textiles, Food
  const categories = useMemo(() => {
    const list = apiCategories || []
    const allowed = ['METALS', 'TEXTILES', 'FOOD']
    return list.filter((c) => allowed.includes(c.code?.toUpperCase()))
  }, [apiCategories])

  // Resolve materials directly from real API response
  const materials = useMemo(() => {
    return apiMaterialsPage?.items || []
  }, [apiMaterialsPage])

  const allMaterials = useMemo(() => {
    return allMaterialsData?.items || []
  }, [allMaterialsData])

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

  // Buyer action: Pre-fill RFQ creation with rich material context
  const handleBuyerRequestQuote = (material) => {
    const matName = getLocalizedField(material, 'name', language)
    const unitName = getLocalizedField(material, 'defaultUnitName', language)
    const query = new URLSearchParams({
      materialId: material.id || '',
      materialCode: material.code || '',
      materialName: matName || '',
      unit: material.defaultUnitCode || unitName || 'ton',
      catId: material.categoryId || '',
    }).toString()

    navigate(`/rfqs/create?${query}`, {
      state: {
        prefilledMaterial: {
          materialId: material.id,
          materialName: matName,
          materialCode: material.code,
          categoryId: material.categoryId,
          unit: material.defaultUnitCode || 'ton',
          unitOfMeasureId: material.defaultUnitId,
          quantity: material.minOrderQty || 10,
          specifications: isAr
            ? (material.descriptionAr || `توريد مادة قياسية ${matName} مطابقة للمواصفات القياسية.`)
            : (material.descriptionEn || `Supply of standard ${matName} complying with industrial specifications.`),
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Search Header */}
      <EntranceAnimation direction="down" duration={300}>
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
                    ? 'تصفح مواصفات المواد القياسية، اشترِ مباشرة، أو اطلب عروض أسعار وتناقص مع الموردين المعتمدين.'
                    : 'Browse verified industrial raw materials, buy directly, or request competitive tender quotes from certified suppliers.'
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
      </EntranceAnimation>

      {/* Main Catalog Layout (Category Sidebar + Material Cards Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <aside className="lg:col-span-1">
          <EntranceAnimation direction="right" duration={350}>
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs sticky top-24">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="font-bold text-[#06245B] text-base flex items-center gap-2">
                  <Filter size={18} className="text-[#1266D6]" />
                  <span>{isAr ? 'القطاعات الصناعية' : 'Industry Sectors'}</span>
                </h3>
                <span className="text-xs font-mono text-[#1266D6] bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                  {categories.length} {isAr ? 'قطاعات' : 'sectors'}
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
                      {allMaterialsLoading && allMaterials.length === 0 ? (
                        <span className="inline-block w-4 h-3 bg-slate-200 animate-pulse rounded" />
                      ) : (
                        allMaterials.length || materials.length
                      )}
                    </span>
                  </button>
                </li>

                {categories.map((cat) => {
                  const count = (allMaterials.length > 0 ? allMaterials : materials).filter((m) => m.categoryId === cat.id).length
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
                        {allMaterialsLoading && allMaterials.length === 0 ? (
                          <span className="inline-block w-4 h-3 bg-slate-200 animate-pulse rounded ms-2" />
                        ) : count > 0 ? (
                          <span className="text-xs font-mono opacity-70 ms-2">
                            {count}
                          </span>
                        ) : null}
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
          </EntranceAnimation>
        </aside>

        {/* Materials Grid */}
        <div className="lg:col-span-3">
          {materialsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between animate-pulse space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="h-5 w-24 bg-blue-100 rounded-full" />
                      <div className="h-4 w-16 bg-slate-200 rounded" />
                    </div>
                    <div className="h-5 w-3/4 bg-slate-200 rounded" />
                    <div className="h-4 w-1/3 bg-slate-100 rounded" />
                    <div className="h-14 bg-slate-50 border border-slate-100 rounded-2xl" />
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                    <div className="h-8 w-24 bg-slate-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : materials.length === 0 ? (
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
              {materials.map((material, idx) => {
                const matName = getLocalizedField(material, 'name', language)
                const catName = getLocalizedField(material, 'categoryName', language)
                const unitName = getLocalizedField(material, 'defaultUnitName', language)
                const isSupplying = suppliedMaterials.includes(material.id)

                return (
                  <EntranceAnimation
                    key={material.id}
                    direction="up"
                    delay={Math.min(idx * 50, 300)}
                    duration={350}
                  >
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 hover:border-[#1266D6] hover:shadow-md transition-all duration-200 flex flex-col justify-between group h-full">
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

                        {/* Indicative pricing badge if available */}
                        {material.indicativePrice && (
                          <div className="mb-3 flex items-center justify-between text-xs px-3 py-1.5 bg-[#EAF4FF]/50 rounded-xl border border-[#1266D6]/10">
                            <span className="text-slate-500">
                              {isAr ? 'السعر الإرشادي:' : 'Benchmark Price:'}
                            </span>
                            <span className="font-extrabold text-[#06245B]">
                              {material.indicativePrice.toLocaleString()} EGP{' '}
                              <span className="font-normal text-slate-400">/ {unitName || 'ton'}</span>
                            </span>
                          </div>
                        )}

                        {/* Specifications Summary */}
                        <p className="text-xs text-slate-500 leading-relaxed mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                          {isAr ? material.specsAr : material.specsEn}
                        </p>
                      </div>

                      {/* Card Footer: Role Actions & Unit */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="text-xs text-slate-400">
                          <span>{isAr ? 'وحدة التوريد: ' : 'Trading Unit: '}</span>
                          <strong className="text-slate-700 font-semibold">{unitName || 'ton'}</strong>
                          {material.minOrderQty && (
                            <span className="block text-[10px] text-slate-400">
                              {isAr ? `الحد الأدنى: ${material.minOrderQty}` : `MOQ: ${material.minOrderQty}`}
                            </span>
                          )}
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

                          {/* Buyer Experience: Direct Purchase AND Request RFQ */}
                          {isBuyer && (
                            <div className="flex items-center gap-2">
                              {/* Direct Purchase Button */}
                              <Button
                                variant="primary"
                                size="xs"
                                icon={<ShoppingBag size={13} />}
                                onClick={() => setPurchasingMaterial(material)}
                              >
                                {isAr ? 'شراء الآن' : 'Buy Now'}
                              </Button>

                              {/* Request RFQ Button */}
                              <Button
                                variant="outline"
                                size="xs"
                                icon={<Send size={12} />}
                                onClick={() => handleBuyerRequestQuote(material)}
                              >
                                {isAr ? 'طلب عرض' : 'RFQ'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </EntranceAnimation>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Direct Purchase Modal */}
      <DirectPurchaseModal
        isOpen={!!purchasingMaterial}
        onClose={() => setPurchasingMaterial(null)}
        material={purchasingMaterial}
        onSuccess={(dealId) => {
          setPurchasingMaterial(null)
          if (dealId) {
            navigate(`/deals/${dealId}`)
          } else {
            navigate('/deals')
          }
        }}
      />
    </div>
  )
}
