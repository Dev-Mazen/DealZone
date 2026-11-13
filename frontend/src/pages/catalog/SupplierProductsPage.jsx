import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Tag,
  Building2,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from 'lucide-react'
import { catalogService } from '../../shared/api/services/catalogService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../../hooks/useToast'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

export default function SupplierProductsPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const toast = useToast()
  const queryClient = useQueryClient()
  const { isSupplier, isVerified } = usePermissions()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deleteProductTarget, setDeleteProductTarget] = useState(null)

  // Form state
  const [formCategory, setFormCategory] = useState('')
  const [formNameAr, setFormNameAr] = useState('')
  const [formNameEn, setFormNameEn] = useState('')
  const [formSku, setFormSku] = useState('')
  const [formPricingMode, setFormPricingMode] = useState(1) // 1 = Fixed, 2 = Negotiable
  const [formPrice, setFormPrice] = useState('')
  const [formUnit, setFormUnit] = useState('ton')
  const [formMoq, setFormMoq] = useState(1)
  const [formStock, setFormStock] = useState(100)
  const [formLeadTime, setFormLeadTime] = useState(7)
  const [formSpecs, setFormSpecs] = useState('')
  const [formDescAr, setFormDescAr] = useState('')
  const [formDescEn, setFormDescEn] = useState('')
  const [formError, setFormError] = useState(null)

  // Categories query
  const { data: categories } = useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: catalogService.getCategories,
  })

  // Allowed 3 categories
  const allowedCategories = useMemo(() => {
    const list = categories || []
    const codes = ['METALS', 'TEXTILES', 'FOOD']
    return list.filter((c) => codes.includes(c.code?.toUpperCase()))
  }, [categories])

  // Products query (supplier's products)
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['catalog', 'my-products'],
    queryFn: () => catalogService.getProducts({ pageSize: 100 }),
    staleTime: 10_000,
  })

  const products = productsData?.items || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => catalogService.createProduct(data),
    onSuccess: () => {
      toast.success(isAr ? 'تم نشر المنتج بنجاح في السوق التجاري' : 'Product successfully published to Marketplace')
      setShowAddModal(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: (err) => {
      setFormError(err?.problem?.detail || err?.response?.data?.detail || err?.message || 'Failed to create product')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => catalogService.updateProduct(id, data),
    onSuccess: () => {
      toast.success(isAr ? 'تم تحديث بيانات المنتج بنجاح' : 'Product successfully updated')
      setEditingProduct(null)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: (err) => {
      setFormError(err?.problem?.detail || err?.response?.data?.detail || err?.message || 'Failed to update product')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => catalogService.deleteProduct(id),
    onSuccess: () => {
      toast.info(isAr ? 'تمت أرشفة المنتج وإزالته من العرض' : 'Product archived and unlisted')
      setDeleteProductTarget(null)
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || 'Failed to archive product')
    },
  })

  const resetForm = () => {
    setFormCategory('')
    setFormNameAr('')
    setFormNameEn('')
    setFormSku('')
    setFormPricingMode(1)
    setFormPrice('')
    setFormUnit('ton')
    setFormMoq(1)
    setFormStock(100)
    setFormLeadTime(7)
    setFormSpecs('')
    setFormDescAr('')
    setFormDescEn('')
    setFormError(null)
  }

  const openCreateModal = () => {
    resetForm()
    if (allowedCategories.length > 0) {
      setFormCategory(allowedCategories[0].id)
    }
    setShowAddModal(true)
  }

  const openEditModal = (p) => {
    resetForm()
    setEditingProduct(p)
    setFormCategory(p.categoryId)
    setFormNameAr(p.nameAr || '')
    setFormNameEn(p.nameEn || '')
    setFormSku(p.sku || '')
    setFormPricingMode(p.pricingMode === 2 || p.pricingMode === 'Negotiable' ? 2 : 1)
    setFormPrice(p.unitPrice != null ? p.unitPrice : '')
    setFormUnit(p.unit || 'ton')
    setFormMoq(p.minimumOrderQuantity || 1)
    setFormStock(p.availableQuantity || 0)
    setFormLeadTime(p.deliveryLeadTimeDays || 7)
    setFormSpecs(p.specifications || '')
    setFormDescAr(p.descriptionAr || '')
    setFormDescEn(p.descriptionEn || '')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError(null)

    if (!formCategory) {
      setFormError(isAr ? 'يرجى اختيار قطاع صناعي' : 'Please select an industry category')
      return
    }

    if (!formNameAr.trim()) {
      setFormError(isAr ? 'يرجى إدخال اسم المنتج بالعربية' : 'Please enter product name (Arabic)')
      return
    }

    const price = formPricingMode === 1 ? Number(formPrice) : 0
    if (formPricingMode === 1 && (price <= 0 || isNaN(price))) {
      setFormError(isAr ? 'يرجى إدخال سعر وحدة صحيح للمنتج ذو السعر الثابت' : 'Please enter a valid unit price for fixed-price products')
      return
    }

    const payload = {
      categoryId: formCategory,
      nameAr: formNameAr.trim(),
      nameEn: formNameEn.trim() || undefined,
      sku: formSku.trim() || undefined,
      pricingMode: formPricingMode,
      unitPrice: price,
      unit: formUnit.trim() || 'ton',
      minimumOrderQuantity: Number(formMoq) || 1,
      availableQuantity: Number(formStock) || 0,
      deliveryLeadTimeDays: Number(formLeadTime) || 7,
      specifications: formSpecs.trim() || undefined,
      descriptionAr: formDescAr.trim() || undefined,
      descriptionEn: formDescEn.trim() || undefined,
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1266D6] text-xs font-bold mb-2">
              <Layers size={14} />
              <span>{isAr ? 'إدارة منتجات المورد' : 'Supplier Product Publishing'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] tracking-tight">
              {isAr ? 'منتجاتي المعروضة في السوق' : 'My Listed Marketplace Products'}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {isAr
                ? 'إضافة ونشر خامات ومنتجات صناعية مخصصة بأسعار ثابتة أو قابلة للتفاوض، ومتابعة توفر المخزون.'
                : 'Publish custom raw materials and products with fixed or negotiable pricing modes to the platform marketplace.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              as={Link}
              to="/marketplace"
              variant="outline"
              size="md"
              icon={isAr ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            >
              {isAr ? 'عرض في السوق' : 'View Marketplace'}
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={18} />}
              onClick={openCreateModal}
            >
              {isAr ? 'إضافة منتج جديد' : 'Publish Product'}
            </Button>
          </div>
        </div>
      </div>

      {/* Product List */}
      {isLoading ? (
        <PageSpinner />
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
          <EmptyState
            icon={Package}
            title={isAr ? 'لم تقم بنشر أي منتجات بعد' : 'No Listed Products Yet'}
            description={
              isAr
                ? 'ابدأ بإضافة منتجات شركتك لتظهر للمصانع والمشترين في السوق الصناعي للشراء المباشر أو التفاوض.'
                : 'Publish your raw materials to appear in the buyer marketplace for direct purchase or price negotiation.'
            }
            action={
              <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreateModal}>
                {isAr ? 'نشر أول منتج' : 'Publish First Product'}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => {
            const isFixed = p.pricingMode === 1 || p.pricingMode === 'Fixed'
            const catName = isAr ? p.categoryNameAr : (p.categoryNameEn || 'Category')

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between hover:border-[#1266D6] hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-[#1266D6] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {catName}
                    </span>
                    <Badge variant={isFixed ? 'success' : 'warning'}>
                      {isFixed ? (isAr ? 'سعر ثابت' : 'Fixed Price') : (isAr ? 'قابل للتفاوض' : 'Negotiable')}
                    </Badge>
                  </div>

                  <h3 className="font-extrabold text-[#06245B] text-base mb-1">
                    {isAr ? p.nameAr : (p.nameEn || p.nameAr)}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mb-3">SKU: {p.sku}</p>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isAr ? 'السعر المعلن:' : 'Unit Price:'}</span>
                      <strong className="text-[#06245B] font-bold">
                        {isFixed ? `${p.unitPrice?.toLocaleString()} ${p.currency} / ${p.unit}` : (isAr ? 'تفاوضي' : 'Negotiable')}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isAr ? 'الحد الأدنى (MOQ):' : 'MOQ:'}</span>
                      <span>{p.minimumOrderQuantity} {p.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isAr ? 'المخزون المتاح:' : 'Available Stock:'}</span>
                      <span>{p.availableQuantity} {p.unit}</span>
                    </div>
                  </div>

                  {p.specifications && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {p.specifications}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    icon={<Edit2 size={13} />}
                    onClick={() => openEditModal(p)}
                  >
                    {isAr ? 'تعديل' : 'Edit'}
                  </Button>
                  <Button
                    variant="danger"
                    size="xs"
                    icon={<Trash2 size={13} />}
                    onClick={() => setDeleteProductTarget(p)}
                  >
                    {isAr ? 'أرشفة' : 'Archive'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showAddModal || !!editingProduct}
        onClose={() => {
          setShowAddModal(false)
          setEditingProduct(null)
          resetForm()
        }}
        title={
          editingProduct
            ? (isAr ? 'تعديل بيانات المنتج' : 'Edit Product')
            : (isAr ? 'نشر منتج جديد في السوق التجاري' : 'Publish New Marketplace Product')
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs" dir={isAr ? 'rtl' : 'ltr'}>
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl">
              {formError}
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="block font-bold text-[#06245B] mb-1">
              {isAr ? 'القطاع الصناعي' : 'Industry Category'} <span className="text-red-500">*</span>
            </label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              disabled={!!editingProduct}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white"
              required
            >
              <option value="">{isAr ? 'اختر القطاع...' : 'Select category...'}</option>
              {allowedCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {isAr ? c.nameAr : c.nameEn} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Product Names (Free text) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#06245B] mb-1">
                {isAr ? 'اسم المنتج بالعربية' : 'Product Name (Arabic)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={isAr ? 'مثال: بولي إيثيلين عالي الكثافة HDPE' : 'e.g. HDPE Resin'}
                value={formNameAr}
                onChange={(e) => setFormNameAr(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-[#06245B] mb-1">
                {isAr ? 'اسم المنتج بالإنجليزية (اختياري)' : 'Product Name (English)'}
              </label>
              <input
                type="text"
                placeholder="e.g. High-Density Polyethylene"
                value={formNameEn}
                onChange={(e) => setFormNameEn(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* SKU & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#06245B] mb-1">
                {isAr ? 'كود الصنف / SKU (اختياري)' : 'SKU (Optional)'}
              </label>
              <input
                type="text"
                placeholder="PROD-001"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                disabled={!!editingProduct}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-[#06245B] mb-1">
                {isAr ? 'وحدة القياس / التوريد' : 'Unit of Measurement'}
              </label>
              <input
                type="text"
                placeholder="ton, kg, roll, pallet"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Pricing Mode Toggle */}
          <div>
            <label className="block font-bold text-[#06245B] mb-1.5">
              {isAr ? 'طريقة التسعير' : 'Pricing Mode'} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormPricingMode(1)}
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  formPricingMode === 1
                    ? 'border-[#1266D6] bg-blue-50 text-[#06245B]'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {isAr ? 'سعر ثابت (شراء فوري + تفاوض)' : 'Fixed Price (Buy Now & Offer)'}
              </button>
              <button
                type="button"
                onClick={() => setFormPricingMode(2)}
                className={`p-3 rounded-xl border text-center font-bold transition-all ${
                  formPricingMode === 2
                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {isAr ? 'قابل للتفاوض (عروض أسعار فقط)' : 'Negotiable (Make an Offer Only)'}
              </button>
            </div>
          </div>

          {/* Fixed Unit Price (if applicable) */}
          {formPricingMode === 1 && (
            <div>
              <label className="block font-bold text-[#06245B] mb-1">
                {isAr ? 'سعر الوحدة بالجنيه المصري (EGP)' : 'Unit Price (EGP)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="e.g. 45000"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm font-bold"
                required={formPricingMode === 1}
              />
            </div>
          )}

          {/* Quantities & Lead Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#06245B] mb-1">
                {isAr ? 'الحد الأدنى للطلب (MOQ)' : 'Minimum Order Qty'}
              </label>
              <input
                type="number"
                min="1"
                value={formMoq}
                onChange={(e) => setFormMoq(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-[#06245B] mb-1">
                {isAr ? 'المخزون المتاح للتوريد' : 'Available Stock'}
              </label>
              <input
                type="number"
                min="0"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block font-bold text-[#06245B] mb-1">
                {isAr ? 'مهلة التسليم (أيام)' : 'Lead Time (Days)'}
              </label>
              <input
                type="number"
                min="1"
                value={formLeadTime}
                onChange={(e) => setFormLeadTime(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Specifications */}
          <div>
            <label className="block font-bold text-[#06245B] mb-1">
              {isAr ? 'المواصفات الفنية والشهادات القياسية' : 'Technical Specifications'}
            </label>
            <textarea
              rows={2}
              value={formSpecs}
              onChange={(e) => setFormSpecs(e.target.value)}
              placeholder={isAr ? 'المواصفات، درجات النقاء، شهادات المطابقة القياسية (ASTM/ISO)...' : 'Grade, purity, standard certificates...'}
              className="w-full p-2.5 rounded-xl border border-slate-300"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddModal(false)
                setEditingProduct(null)
                resetForm()
              }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingProduct
                ? (isAr ? 'حفظ التعديلات' : 'Save Changes')
                : (isAr ? 'نشر المنتج الآن' : 'Publish Product')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete/Archive Confirmation */}
      <ConfirmModal
        isOpen={!!deleteProductTarget}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteProductTarget.id)}
        loading={deleteMutation.isPending}
        title={isAr ? 'تأكيد أرشفة المنتج' : 'Confirm Archive Product'}
        message={
          isAr
            ? `هل أنت متأكد من أرشفة المنتج "${deleteProductTarget?.nameAr}"؟ لن يظهر للمشترين في السوق بعد الآن.`
            : `Are you sure you want to archive "${deleteProductTarget?.nameEn || deleteProductTarget?.nameAr}"? It will be removed from marketplace listings.`
        }
      />
    </div>
  )
}

