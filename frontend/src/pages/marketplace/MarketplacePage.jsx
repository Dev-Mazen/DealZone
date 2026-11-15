import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  Search,
  Package,
  Layers,
  Filter,
  ShoppingBag,
  Handshake,
  Building2,
  Info,
  PlusCircle,
  ShieldAlert,
  AlertCircle,
  X,
} from 'lucide-react'
import { catalogService } from '../../shared/api/services/catalogService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuthStore } from '../../store/authStore'
import { ROUTES } from '../../constants/routes'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import DirectPurchaseModal from '../../components/catalog/DirectPurchaseModal'
import NegotiationOfferModal from '../../components/negotiations/NegotiationOfferModal'

const FETCH_SIZE = 100 // أقصى عدد منتجات بيتحمّل من السيرفر في الطلب
const PAGE_STEP = 12 // عدد البطاقات المعروضة في كل "عرض المزيد"

const PRICING_FILTERS = ['ALL', 'FIXED', 'NEGOTIABLE']

/* ----------------------------- helpers ----------------------------- */

function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

const isFixedMode = (mode) => mode === 1 || mode === 'Fixed'

// مصدر واحد لتعريف نمط التسعير (يستخدمه الفلتر والبطاقة)
function getPricing(product) {
  const hasPrice = Number(product.unitPrice) > 0
  const modeKnown = product.pricingMode !== undefined && product.pricingMode !== null
  const isFixed = hasPrice && (modeKnown ? isFixedMode(product.pricingMode) : true)
  return { hasPrice, isFixed }
}

const productName = (p, isAr) => (isAr ? p.nameAr || p.nameEn : p.nameEn || p.nameAr)
const categoryLabel = (p, isAr) => (isAr ? p.categoryNameAr || p.categoryNameEn : p.categoryNameEn || p.categoryNameAr)

/* --------------------------- small components --------------------------- */

function FilterPill({ active, onClick, activeClass, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
        active ? activeClass : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 animate-pulse">
      <div className="h-5 w-28 bg-slate-200 rounded" />
      <div className="h-6 w-3/4 bg-slate-200 rounded" />
      <div className="h-14 bg-slate-100 rounded-2xl" />
      <div className="h-8 bg-slate-200 rounded" />
    </div>
  )
}

const ProductCard = memo(function ProductCard({
  product,
  isAr,
  numberFormat,
  actionState,
  ownCompanyId,
  onNegotiate,
  onBuy,
}) {
  const { hasPrice, isFixed } = getPricing(product)
  const name = productName(product, isAr)
  const category = categoryLabel(product, isAr)
  const unit = product.unit
  const location = [product.supplierCity, product.supplierGovernorate].filter(Boolean).join(', ')
  const description =
    product.specifications || (isAr ? product.descriptionAr : product.descriptionEn)
  const isOwn = ownCompanyId && ownCompanyId === product.supplierCompanyId

  return (
    <article className="bg-white rounded-3xl border border-slate-200/80 p-5 hover:border-[#1266D6] hover:shadow-md transition-all duration-200 flex flex-col justify-between group h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {category ? (
            <span className="text-xs font-bold text-[#1266D6] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 truncate">
              {category}
            </span>
          ) : (
            <span />
          )}
          {isFixed ? (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
              {isAr ? 'سعر محدد' : 'Fixed Price'}
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shrink-0">
              {isAr ? 'قابل للتفاوض' : 'Negotiable'}
            </span>
          )}
        </div>

        {product.supplierCompanyName && (
          <div className="mb-2 flex items-center justify-between gap-2 text-xs bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <Link
              to={`/suppliers/${product.supplierCompanyId}`}
              className="flex items-center gap-1.5 text-[#06245B] hover:text-[#1266D6] hover:underline font-semibold truncate"
              title={isAr ? 'عرض الملف التجاري للمورد' : 'View supplier profile'}
            >
              <Building2 size={13} className="text-[#1266D6] shrink-0" />
              <span className="truncate">{product.supplierCompanyName}</span>
            </Link>
            {location && <span className="text-[10px] text-slate-500 shrink-0">{location}</span>}
          </div>
        )}

        <h3 className="font-bold text-[#06245B] text-base leading-snug group-hover:text-[#1266D6] transition-colors mb-2">
          {name}
        </h3>

        <div className="mb-3 p-3 bg-[#EAF4FF]/50 rounded-2xl border border-[#1266D6]/10 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500">
            {isFixed ? (isAr ? 'سعر الوحدة:' : 'Unit price:') : isAr ? 'التسعير:' : 'Pricing:'}
          </span>
          {hasPrice ? (
            <span className="font-extrabold text-[#06245B] text-base text-end">
              {numberFormat.format(product.unitPrice)} {product.currency}
              {unit && <span className="font-normal text-xs text-slate-400"> / {unit}</span>}
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-700">
              {isAr ? 'السعر عند الطلب' : 'Price on request'}
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
            {description}
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          {product.minimumOrderQuantity > 0 && (
            <div>
              {isAr ? 'الحد الأدنى: ' : 'MOQ: '}
              <strong className="text-slate-700 font-semibold">
                {numberFormat.format(product.minimumOrderQuantity)} {unit}
              </strong>
            </div>
          )}
          {product.deliveryLeadTimeDays > 0 && (
            <div className="text-[10px]">
              {isAr
                ? `مهلة التسليم: ${product.deliveryLeadTimeDays} يوم`
                : `Lead time: ${product.deliveryLeadTimeDays} days`}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isOwn ? (
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {isAr ? 'منتج شركتك' : 'Your product'}
            </span>
          ) : actionState === 'buyer' ? (
            <>
              <Button
                variant="outline"
                size="xs"
                icon={<Handshake size={13} />}
                onClick={() => onNegotiate(product)}
              >
                {isAr ? 'فاوض على السعر' : 'Make an offer'}
              </Button>
              {isFixed && (
                <Button
                  variant="primary"
                  size="xs"
                  icon={<ShoppingBag size={13} />}
                  onClick={() => onBuy(product)}
                >
                  {isAr ? 'شراء فوري' : 'Buy now'}
                </Button>
              )}
            </>
          ) : actionState === 'unverified' ? (
            <Link
              to={ROUTES.VERIFICATION}
              className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md"
            >
              {isAr ? 'وثّق شركتك للشراء' : 'Verify your company to buy'}
            </Link>
          ) : actionState === 'guest' ? (
            <Link
              to="/login"
              className="text-[11px] font-bold text-[#1266D6] bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md"
            >
              {isAr ? 'سجّل الدخول للشراء' : 'Log in to buy'}
            </Link>
          ) : (
            <span className="text-[11px] text-slate-400 italic">
              {isAr ? 'للعرض فقط' : 'View only'}
            </span>
          )}
        </div>
      </div>
    </article>
  )
})

/* ------------------------------- page ------------------------------- */

export default function MarketplacePage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isBuyer, isSupplier, isSystemAdmin, isVerified } = usePermissions()

  // الفلاتر في الرابط (Refresh / رجوع / مشاركة الرابط)
  const [params, setParams] = useSearchParams()
  const categoryId = params.get('cat') || undefined
  const pricingParam = params.get('pricing')
  const pricing = PRICING_FILTERS.includes(pricingParam) ? pricingParam : 'ALL'

  const updateParams = useCallback(
    (patch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
          return next
        },
        { replace: true }
      )
    },
    [setParams]
  )

  const [searchInput, setSearchInput] = useState(params.get('q') || '')
  const debouncedSearch = useDebounced(searchInput.trim())
  useEffect(() => {
    updateParams({ q: debouncedSearch })
  }, [debouncedSearch, updateParams])

  const [visibleCount, setVisibleCount] = useState(PAGE_STEP)
  useEffect(() => {
    setVisibleCount(PAGE_STEP)
  }, [categoryId, pricing, debouncedSearch])

  const [purchasingProduct, setPurchasingProduct] = useState(null)
  const [negotiatingProduct, setNegotiatingProduct] = useState(null)

  const numberFormat = useMemo(() => new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US'), [isAr])

  const handleBuy = useCallback((product) => setPurchasingProduct(product), [])
  const handleNegotiate = useCallback((product) => setNegotiatingProduct(product), [])

  // القطاعات
  const { data: apiCategories } = useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: () => catalogService.getCategories(),
    staleTime: 60_000,
  })
  const categories = useMemo(
    () =>
      (apiCategories || []).filter((c) =>
        c.isMarketplaceAllowed ?? true
      ),
    [apiCategories]
  )

  // المنتجات
  const {
    data: productsData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['catalog', 'products', { categoryId, q: debouncedSearch }],
    queryFn: () =>
      catalogService.getProducts({
        categoryId,
        searchTerm: debouncedSearch || undefined,
        pageNumber: 1,
        pageSize: FETCH_SIZE,
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

  const loadedItems = productsData?.items
  const filteredProducts = useMemo(() => {
    const list = loadedItems || []
    if (pricing === 'FIXED') return list.filter((p) => getPricing(p).isFixed)
    if (pricing === 'NEGOTIABLE') return list.filter((p) => !getPricing(p).isFixed)
    return list
  }, [loadedItems, pricing])

  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const isTruncatedByServer =
    productsData?.totalCount != null && productsData.totalCount > (loadedItems?.length || 0)

  const actionState = !user
    ? 'guest'
    : isSystemAdmin
      ? 'admin'
      : isSupplier
        ? 'supplier'
        : isBuyer
          ? isVerified
            ? 'buyer'
            : 'unverified'
          : 'none'

  const resetFilters = () => {
    setSearchInput('')
    setParams({}, { replace: true })
  }
  const hasActiveFilters = !!(categoryId || debouncedSearch || pricing !== 'ALL')

  const categoryOptions = [
    { id: undefined, label: isAr ? 'جميع القطاعات' : 'All categories' },
    ...categories.map((c) => ({ id: c.id, label: isAr ? c.nameAr : c.nameEn || c.nameAr })),
  ]

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
                ? 'استكشف منتجات الموردين المعتمدين، واشترِ بسعر محدد أو فاوض الموردين على عروض مخصصة.'
                : 'Browse verified supplier products, buy at fixed prices, or negotiate custom offers.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isSupplier && (
              <Button
                as={Link}
                to="/catalog/my-products"
                variant="outline"
                size="md"
                icon={<PlusCircle size={18} />}
              >
                {isAr ? 'منتجاتي المعروضة' : 'My listed products'}
              </Button>
            )}
            {isBuyer && (
              <Button
                as={Link}
                to="/rfqs/create"
                variant="primary"
                size="md"
                icon={<PlusCircle size={18} />}
              >
                {isAr ? 'إنشاء طلب سعر (RFQ)' : 'Create RFQ'}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Input
              aria-label={isAr ? 'بحث في المنتجات' : 'Search products'}
              placeholder={
                isAr
                  ? 'ابحث باسم المنتج أو المواصفات الفنية...'
                  : 'Search by product name or technical specifications...'
              }
              startIcon={<Search size={18} className="text-[#1266D6]" />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full text-base"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                className="absolute end-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 bg-slate-100"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-xs text-slate-400 font-bold">
              {isAr ? 'نمط التسعير:' : 'Pricing:'}
            </span>
            <FilterPill
              active={pricing === 'ALL'}
              onClick={() => updateParams({ pricing: null })}
              activeClass="bg-[#06245B] text-white"
            >
              {isAr ? 'الكل' : 'All'}
            </FilterPill>
            <FilterPill
              active={pricing === 'FIXED'}
              onClick={() => updateParams({ pricing: 'FIXED' })}
              activeClass="bg-blue-600 text-white"
            >
              {isAr ? 'سعر ثابت (شراء فوري)' : 'Fixed price (Buy now)'}
            </FilterPill>
            <FilterPill
              active={pricing === 'NEGOTIABLE'}
              onClick={() => updateParams({ pricing: 'NEGOTIABLE' })}
              activeClass="bg-amber-600 text-white"
            >
              {isAr ? 'قابل للتفاوض' : 'Negotiable'}
            </FilterPill>
          </div>
        </div>
      </div>

      {actionState === 'unverified' && (
        <div
          role="status"
          className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900"
        >
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <p>
            {isAr ? 'شركتك غير موثقة بعد، فالشراء والتفاوض متاحان بعد اعتماد التوثيق. ' : 'Your company is not verified yet; buying and negotiating are available after verification. '}
            <Link to={ROUTES.VERIFICATION} className="font-bold underline">
              {isAr ? 'أكمل التوثيق' : 'Complete verification'}
            </Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories: chips on mobile, sidebar on desktop */}
        <nav
          aria-label={isAr ? 'القطاعات الصناعية' : 'Industry sectors'}
          className="lg:hidden -mx-1 overflow-x-auto"
        >
          <div className="flex gap-2 px-1 pb-1 w-max">
            {categoryOptions.map((opt) => (
              <FilterPill
                key={opt.id ?? 'all'}
                active={categoryId === opt.id}
                onClick={() => updateParams({ cat: opt.id })}
                activeClass="bg-[#06245B] text-white"
              >
                {opt.label}
              </FilterPill>
            ))}
          </div>
        </nav>

        <aside className="hidden lg:block lg:col-span-1">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs sticky top-24">
            <h3 className="font-bold text-[#06245B] text-base flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Filter size={18} className="text-[#1266D6]" />
              <span>{isAr ? 'القطاعات الصناعية' : 'Industry sectors'}</span>
            </h3>

            <ul className="space-y-1.5 text-sm">
              {categoryOptions.map((opt) => {
                const selected = categoryId === opt.id
                return (
                  <li key={opt.id ?? 'all'}>
                    <button
                      type="button"
                      onClick={() => updateParams({ cat: opt.id })}
                      aria-current={selected ? 'true' : undefined}
                      className={`w-full text-start px-3.5 py-2.5 rounded-2xl transition-colors font-semibold ${
                        selected
                          ? 'bg-[#EAF4FF] text-[#06245B] font-bold'
                          : 'text-slate-600 hover:bg-[#F4F7FB] hover:text-[#06245B]'
                      }`}
                    >
                      <span className="truncate block">{opt.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#06245B]">
                <Info size={14} className="text-[#1266D6]" />
                <span>{isAr ? 'حماية التعامل التجاري' : 'Procurement assurance'}</span>
              </div>
              <p className="leading-relaxed">
                {isAr
                  ? 'المنتجات معروضة من موردين موثقين، ويتم تثبيت السعر في الصفقة عند الشراء أو الاتفاق.'
                  : 'Products come from verified suppliers, and the price is locked into the deal at purchase or agreement.'}
              </p>
            </div>
          </div>
        </aside>

        {/* Products */}
        <section className="lg:col-span-3" aria-busy={isFetching}>
          {!isLoading && !isError && (
            <p className="text-xs text-slate-500 mb-3" aria-live="polite">
              {isAr
                ? `${numberFormat.format(filteredProducts.length)} منتج`
                : `${numberFormat.format(filteredProducts.length)} products`}
              {isFetching && <span className="ms-2 text-slate-400">{isAr ? '· جاري التحديث...' : '· updating...'}</span>}
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="bg-white rounded-3xl p-12 border border-red-200 text-center space-y-4">
              <AlertCircle size={36} className="mx-auto text-red-500" />
              <p className="text-sm text-slate-600">
                {isAr ? 'تعذّر تحميل المنتجات. حاول مرة أخرى.' : 'Could not load products. Please try again.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                {isAr ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
              <EmptyState
                icon={Package}
                title={isAr ? 'لا توجد منتجات مطابقة' : 'No products found'}
                description={
                  hasActiveFilters
                    ? isAr
                      ? 'جرّب تعديل البحث أو اختيار قطاع آخر.'
                      : 'Try adjusting your search or choosing a different category.'
                    : isAr
                      ? 'لم يعرض الموردون منتجات بعد.'
                      : 'Suppliers have not listed any products yet.'
                }
                action={
                  hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      {isAr ? 'إعادة ضبط التصفية' : 'Reset filters'}
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isAr={isAr}
                    numberFormat={numberFormat}
                    actionState={actionState}
                    ownCompanyId={user?.company?.id}
                    onNegotiate={handleNegotiate}
                    onBuy={handleBuy}
                  />
                ))}
              </div>

              {visibleCount < filteredProducts.length && (
                <div className="mt-6 text-center">
                  <Button variant="outline" onClick={() => setVisibleCount((c) => c + PAGE_STEP)}>
                    {isAr ? 'عرض المزيد' : 'Show more'}
                  </Button>
                </div>
              )}

              {isTruncatedByServer && (
                <p className="mt-4 text-center text-xs text-slate-400">
                  {isAr
                    ? `يتم عرض أول ${FETCH_SIZE} نتيجة. ضيّق البحث للوصول لنتائج أدق.`
                    : `Showing the first ${FETCH_SIZE} results. Narrow your search for more precise results.`}
                </p>
              )}
            </>
          )}
        </section>
      </div>

      <DirectPurchaseModal
        isOpen={!!purchasingProduct}
        onClose={() => setPurchasingProduct(null)}
        product={purchasingProduct}
        onSuccess={(dealId) => {
          setPurchasingProduct(null)
          navigate(dealId ? `/deals/${dealId}` : '/deals')
        }}
      />

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