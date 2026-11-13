import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Package,
  Layers,
  Filter,
  ShoppingBag,
  Handshake,
  Building2,
  Tag,
  Info,
  PlusCircle,
  Clock,
} from 'lucide-react'
import { catalogService } from '../../shared/api/services/catalogService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import DirectPurchaseModal from '../../components/catalog/DirectPurchaseModal'
import NegotiationOfferModal from '../../components/negotiations/NegotiationOfferModal'

export default function MarketplacePage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const { isBuyer, isSupplier, canSubmitOffers, canManageRfqs } = usePermissions()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState()
  const [pricingFilter, setPricingFilter] = useState('ALL') // 'ALL' | 'FIXED' | 'NEGOTIABLE'
  const [purchasingMaterial, setPurchasingMaterial] = useState(null)
  const [negotiatingProduct, setNegotiatingProduct] = useState(null)

  // 1. Fetch categories
  const { data: apiCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: () => catalogService.getCategories(),
    staleTime: 60_000,
  })

  // Strict 3 categories
  const categories = useMemo(() => {
    const list = apiCategories || []
    const allowed = ['METALS', 'TEXTILES', 'FOOD']
    return list.filter((c) => allowed.includes(c.code?.toUpperCase()))
  }, [apiCategories])

  // 2. Fetch products
  const { data: apiProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['catalog', 'products', { categoryId: selectedCategoryId, searchTerm }],
    queryFn: () =>
      catalogService.getProducts({
        categoryId: selectedCategoryId,
        searchTerm: searchTerm.trim() || undefined,
        pageNumber: 1,
        pageSize: 100,
      }),
    staleTime: 30_000,
  })

  // Filter products by pricing mode if chosen
  const filteredProducts = useMemo(() => {
    const list = apiProducts?.items || []
    if (pricingFilter === 'FIXED') {
      return list.filter((p) => p.pricingMode === 1 || p.pricingMode === 'Fixed' || (p.unitPrice != null && p.unitPrice > 0))
    }
    if (pricingFilter === 'NEGOTIABLE') {
      return list.filter((p) => p.pricingMode === 2 || p.pricingMode === 'Negotiable' || p.unitPrice == null)
    }
    return list
  }, [apiProducts, pricingFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1266D6] text-xs font-bold mb-2">
              <Layers size={14} />
              <span>{isAr ? 'السوق الصناعي المباشر' : 'Industrial Marketplace'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] tracking-tight">
              {isAr ? 'سوق الخامات والمنتجات الصناعية' : 'Raw Materials & Products Marketplace'}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {isAr
                ? 'استكشف منتجات الموردين المعتمدين، اشترِ بأسعار فورية محددة أو فاوض الموردين على عروض أسعار مخصصة.'
                : 'Browse verified supplier products, buy directly at fixed unit prices, or negotiate structured custom pricing proposals.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isSupplier && (
              <Button
                as={Link}
                to="/catalog/my-products"
                variant="outline"
                size="md"
                icon={<PlusCircle size={18} />}
              >
                {isAr ? 'منتجاتي المعروضة' : 'My Listed Products'}
              </Button>
            )}
            {canManageRfqs && (
              <Button
                as={Link}
                to="/rfqs/create"
                variant="primary"
                size="md"
                icon={<PlusCircle size={18} />}
              >
                {isAr ? 'إنشاء طلب RFQ' : 'Create Custom RFQ'}
              </Button>
            )}
          </div>
        </div>

        {/* Search bar & filter pills */}
        <div className="space-y-3">
          <div className="relative">
            <Input
              placeholder={
                isAr
                  ? 'ابحث باسم المنتج، كود المادة، أو المواصفات الفنية...'
                  : 'Search by product name, code, or technical specifications...'
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

          {/* Pricing mode pills */}
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-bold">{isAr ? 'نمط التسعير:' : 'Pricing Mode:'}</span>
            <button
              type="button"
              onClick={() => setPricingFilter('ALL')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                pricingFilter === 'ALL'
                  ? 'bg-[#06245B] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setPricingFilter('FIXED')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                pricingFilter === 'FIXED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'سعر ثابت (شراء فوري)' : 'Fixed Price (Buy Now)'}
            </button>
            <button
              type="button"
              onClick={() => setPricingFilter('NEGOTIABLE')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                pricingFilter === 'NEGOTIABLE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'قابل للتفاوض' : 'Negotiable'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid + Category Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <aside className="lg:col-span-1">
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
                    {apiProducts?.totalCount ?? filteredProducts.length}
                  </span>
                </button>
              </li>

              {categories.map((cat) => {
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
                      <span className="truncate">{isAr ? cat.nameAr : cat.nameEn}</span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#06245B]">
                <Info size={14} className="text-[#1266D6]" />
                <span>{isAr ? 'حماية التعامل التجاري' : 'Procurement Assurance'}</span>
              </div>
              <p className="leading-relaxed">
                {isAr
                  ? 'كل المنتجات معروضة من موردين تم التحقق من سجلهم التجاري، مع تثبيت الأسعار بمجرد إتمام الشراء أو الاتفاق.'
                  : 'All products are from verified suppliers with immutable price snapshots upon purchase agreement.'}
              </p>
            </div>
          </div>
        </aside>

        {/* Product Cards Grid */}
        <div className="lg:col-span-3">
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between animate-pulse space-y-4"
                >
                  <div className="h-6 w-32 bg-slate-200 rounded" />
                  <div className="h-16 bg-slate-100 rounded-2xl" />
                  <div className="h-8 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
              <EmptyState
                icon={Package}
                title={isAr ? 'لم يتم العثور على منتجات مطابقة' : 'No Products Found'}
                description={
                  isAr
                    ? 'جرّب تعديل كلمات البحث أو اختيار قطاع صناعي مختلف لاستعراض المنتجات المتاحة.'
                    : 'Try adjusting your search terms or select a different industry category.'
                }
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategoryId(undefined)
                      setPricingFilter('ALL')
                    }}
                  >
                    {isAr ? 'إعادة ضبط التصفية' : 'Reset Filters'}
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const prodName = isAr ? product.nameAr : (product.nameEn || product.nameAr)
                const catName = isAr ? product.categoryNameAr : (product.categoryNameEn || 'Category')
                const isFixedPrice = product.pricingMode === 1 || product.pricingMode === 'Fixed' || (product.unitPrice != null && product.unitPrice > 0)
                const unit = product.unit || 'ton'

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 hover:border-[#1266D6] hover:shadow-md transition-all duration-200 flex flex-col justify-between group h-full"
                  >
                    <div>
                      {/* Category & Pricing Mode Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold text-[#1266D6] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                          {catName}
                        </span>
                        {isFixedPrice ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            {isAr ? 'سعر محدد' : 'Fixed Price'}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            {isAr ? 'قابل للتفاوض' : 'Negotiable'}
                          </span>
                        )}
                      </div>

                      {/* Supplier info */}
                      {product.supplierCompanyName && (
                        <div className="mb-2 flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 font-semibold">
                          <Building2 size={13} className="text-emerald-600 shrink-0" />
                          <span className="truncate">
                            {isAr ? 'المورد: ' : 'Supplier: '}
                            <strong>{product.supplierCompanyName}</strong>
                          </span>
                        </div>
                      )}

                      {/* Product Name */}
                      <h3 className="font-bold text-[#06245B] text-base leading-snug group-hover:text-[#1266D6] transition-colors mb-2">
                        {prodName}
                      </h3>

                      {/* Pricing block */}
                      <div className="mb-3 p-3 bg-[#EAF4FF]/50 rounded-2xl border border-[#1266D6]/10 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {isFixedPrice
                            ? (isAr ? 'سعر الوحدة المعلن:' : 'Unit Price:')
                            : (isAr ? 'طريقة التسعير:' : 'Pricing:')}
                        </span>
                        <div className="text-end">
                          {isFixedPrice && product.unitPrice != null ? (
                            <span className="font-extrabold text-[#06245B] text-base">
                              {product.unitPrice.toLocaleString()} {product.currency}{' '}
                              <span className="font-normal text-xs text-slate-400">/ {unit}</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-700">
                              {isAr ? 'قدم عرضك المباشر' : 'Submit Structured Offer'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Specs or Description */}
                      <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        {product.specifications || (isAr ? product.descriptionAr : product.descriptionEn) || (isAr ? 'لا توجد مواصفات إضافية مسجلة' : 'No extra specifications listed')}
                      </p>
                    </div>

                    {/* Card Footer: Minimum Order Quantity & Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-400">
                        <span>{isAr ? 'الحد الأدنى: ' : 'MOQ: '}</span>
                        <strong className="text-slate-700 font-semibold">
                          {product.minimumOrderQuantity || 1} {unit}
                        </strong>
                        {product.deliveryLeadTimeDays && (
                          <span className="block text-[10px] text-slate-400">
                            {isAr ? `مهلة التسليم: ${product.deliveryLeadTimeDays} يوم` : `Lead time: ${product.deliveryLeadTimeDays} days`}
                          </span>
                        )}
                      </div>

                      {/* Buyer actions */}
                      <div className="flex items-center gap-2">
                        {/* Make an Offer / Negotiate is always available */}
                        <Button
                          variant="outline"
                          size="xs"
                          icon={<Handshake size={13} />}
                          onClick={() => setNegotiatingProduct(product)}
                        >
                          {isAr ? 'فاوض على السعر' : 'Make an Offer'}
                        </Button>

                        {/* Buy Now is available if Fixed Price */}
                        {isFixedPrice && (
                          <Button
                            variant="primary"
                            size="xs"
                            icon={<ShoppingBag size={13} />}
                            onClick={() => {
                              // Wrap product for DirectPurchaseModal
                              setPurchasingMaterial({
                                id: product.id,
                                catalogProductId: product.id,
                                materialId: product.materialId,
                                code: product.sku || 'PROD',
                                nameAr: product.nameAr,
                                nameEn: product.nameEn,
                                categoryName: catName,
                                defaultUnitName: unit,
                                defaultUnitCode: unit,
                                minOrderQty: product.minimumOrderQuantity || 1,
                                indicativePrice: product.unitPrice,
                                supplierCompanyName: product.supplierCompanyName,
                                supplierCompanyId: product.supplierCompanyId,
                              })
                            }}
                          >
                            {isAr ? 'شراء فوري' : 'Buy Now'}
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

      {/* Negotiation Modal */}
      <NegotiationOfferModal
        isOpen={!!negotiatingProduct}
        onClose={() => setNegotiatingProduct(null)}
        product={negotiatingProduct}
        onSuccess={(negId) => {
          setNegotiatingProduct(null)
          navigate(`/negotiations/${negId}`)
        }}
      />
    </div>
  )
}

