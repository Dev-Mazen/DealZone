import { useState, useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Package,
  Plus,
  Edit2,
  Archive,
  Layers,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react'
import { catalogService } from '../../shared/api/services/catalogService'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import {
  FormField,
  TextField,
  TextArea,
  SelectField,
  NumberField,
} from '../../components/ui/FormControls'

const PRICING = { FIXED: 1, NEGOTIABLE: 2 }

const EMPTY_FORM = {
  categoryId: '',
  nameAr: '',
  nameEn: '',
  sku: '',
  unit: '',
  pricingMode: PRICING.FIXED,
  unitPrice: '',
  moq: '',
  stock: '',
  leadTime: '',
  specifications: '',
  descriptionAr: '',
  descriptionEn: '',
}

// أسماء حقول الـ API -> أسماء حقول الفورم (لعرض أخطاء السيرفر تحت الحقل الصح)
const SERVER_FIELD_MAP = {
  categoryId: 'categoryId',
  nameAr: 'nameAr',
  nameEn: 'nameEn',
  sku: 'sku',
  unit: 'unit',
  pricingMode: 'pricingMode',
  unitPrice: 'unitPrice',
  minimumOrderQuantity: 'moq',
  availableQuantity: 'stock',
  deliveryLeadTimeDays: 'leadTime',
  specifications: 'specifications',
  descriptionAr: 'descriptionAr',
  descriptionEn: 'descriptionEn',
}

function parseServerErrors(err) {
  const raw = err?.problem?.errors || err?.response?.data?.errors
  const out = {}
  if (raw && typeof raw === 'object') {
    Object.entries(raw).forEach(([key, val]) => {
      const camel = key.charAt(0).toLowerCase() + key.slice(1)
      const field = SERVER_FIELD_MAP[camel]
      if (field) out[field] = Array.isArray(val) ? val[0] : String(val)
    })
  }
  return out
}

function validate(f, t) {
  const e = {}
  if (!f.categoryId) e.categoryId = t('اختر القطاع الصناعي', 'Select an industry category')

  const nameAr = f.nameAr.trim()
  if (nameAr.length < 3) e.nameAr = t('اسم المنتج بالعربية (3 أحرف على الأقل)', 'Arabic name is required (min 3 characters)')
  else if (nameAr.length > 200) e.nameAr = t('الاسم طويل جدًا (الحد 200 حرف)', 'Name is too long (max 200)')
  if (f.nameEn.trim().length > 200) e.nameEn = t('الاسم طويل جدًا (الحد 200 حرف)', 'Name is too long (max 200)')
  if (f.sku.trim().length > 50) e.sku = t('الكود طويل جدًا (الحد 50 حرف)', 'SKU is too long (max 50)')

  if (!f.unit) e.unit = t('اختر وحدة القياس', 'Select a unit')

  if (f.pricingMode === PRICING.FIXED) {
    const p = Number(f.unitPrice)
    if (f.unitPrice === '' || !(p > 0)) e.unitPrice = t('أدخل سعر وحدة أكبر من صفر', 'Enter a unit price greater than zero')
    else if (p > 1_000_000_000) e.unitPrice = t('السعر غير منطقي', 'Price is unrealistically high')
  }

  const moq = Number(f.moq)
  if (f.moq === '' || !(moq > 0)) e.moq = t('أدخل الحد الأدنى للطلب', 'Enter the minimum order quantity')

  if (f.stock !== '') {
    const s = Number(f.stock)
    if (!(s >= 0)) e.stock = t('المخزون لا يمكن أن يكون سالبًا', 'Stock cannot be negative')
    else if (f.moq !== '' && moq > s) e.moq = t('الحد الأدنى أكبر من المخزون المتاح', 'Minimum order exceeds available stock')
  }

  const lead = Number(f.leadTime)
  if (f.leadTime === '' || !Number.isInteger(lead) || lead < 1 || lead > 365)
    e.leadTime = t('مهلة التسليم من 1 إلى 365 يومًا', 'Lead time must be 1 to 365 days')

  if (f.specifications.length > 2000) e.specifications = t('المواصفات أطول من 2000 حرف', 'Specifications exceed 2000 characters')
  if (f.descriptionAr.length > 2000) e.descriptionAr = t('الوصف أطول من 2000 حرف', 'Description exceeds 2000 characters')
  if (f.descriptionEn.length > 2000) e.descriptionEn = t('الوصف أطول من 2000 حرف', 'Description exceeds 2000 characters')
  return e
}

export default function SupplierProductsPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const t = (ar, en) => (isAr ? ar : en)
  const toast = useToast()
  const queryClient = useQueryClient()
  const { isSupplier, isVerified } = usePermissions()
  const user = useAuthStore((s) => s.user)
  const myCompanyId = user?.company?.id

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErrors, setServerErrors] = useState({})
  const [formError, setFormError] = useState(null)

  const numberFormat = useMemo(() => new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US'), [isAr])

  const { data: categories } = useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: () => catalogService.getCategories(),
    staleTime: 60_000,
  })
  const { data: units } = useQuery({
    queryKey: ['catalog', 'units'],
    queryFn: () => catalogService.getUnits(),
    staleTime: 5 * 60_000,
  })
  const {
    data: productsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['catalog', 'my-products'],
    queryFn: () => catalogService.getMyProducts({ pageSize: 100 }),
    enabled: !!myCompanyId && isSupplier,
    staleTime: 10_000,
  })

  const allowedCategories = useMemo(
    () => (categories || []).filter((c) => c.isMarketplaceAllowed ?? true),
    [categories]
  )
  const unitOptions = useMemo(() => {
    const base = (units || []).map((u) => ({
      value: u.code,
      label: isAr ? u.nameAr || u.code : u.nameEn || u.nameAr || u.code,
    }))
    if (editing?.unit && !base.some((o) => o.value === editing.unit)) {
      base.push({ value: editing.unit, label: editing.unit })
    }
    return base
  }, [units, editing, isAr])

  const products = productsData?.items || []
  const stats = useMemo(() => {
    const active = products.filter((p) => p.isActive !== false)
    return {
      total: products.length,
      fixed: active.filter((p) => p.pricingMode === PRICING.FIXED || p.pricingMode === 'Fixed').length,
      negotiable: active.filter((p) => p.pricingMode === PRICING.NEGOTIABLE || p.pricingMode === 'Negotiable').length,
      archived: products.length - active.length,
    }
  }, [products])

  /* ---------------- form helpers ---------------- */
  const errors = useMemo(() => validate(form, t), [form, isAr]) // eslint-disable-line react-hooks/exhaustive-deps
  const err = (k) => serverErrors[k] || (touched[k] || submitted ? errors[k] : undefined)
  const touch = (k) => setTouched((tc) => (tc[k] ? tc : { ...tc, [k]: true }))
  const setField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (serverErrors[k]) setServerErrors((s) => { const n = { ...s }; delete n[k]; return n })
  }
  const bind = (k) => ({ id: `pf-${k}`, invalid: !!err(k), onBlur: () => touch(k) })

  const resetFormState = (next = EMPTY_FORM) => {
    setForm(next)
    setTouched({})
    setSubmitted(false)
    setServerErrors({})
    setFormError(null)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    resetFormState()
  }

  const openCreate = () => {
    setEditing(null)
    resetFormState({
      ...EMPTY_FORM,
      categoryId: allowedCategories.length === 1 ? allowedCategories[0].id : '',
    })
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    resetFormState({
      categoryId: p.categoryId || '',
      nameAr: p.nameAr || '',
      nameEn: p.nameEn || '',
      sku: p.sku || '',
      unit: p.unit || '',
      pricingMode: p.pricingMode === PRICING.NEGOTIABLE || p.pricingMode === 'Negotiable' ? PRICING.NEGOTIABLE : PRICING.FIXED,
      unitPrice: p.unitPrice != null ? String(p.unitPrice) : '',
      moq: p.minimumOrderQuantity != null ? String(p.minimumOrderQuantity) : '',
      stock: p.availableQuantity != null ? String(p.availableQuantity) : '',
      leadTime: p.deliveryLeadTimeDays != null ? String(p.deliveryLeadTimeDays) : '',
      specifications: p.specifications || '',
      descriptionAr: p.descriptionAr || '',
      descriptionEn: p.descriptionEn || '',
    })
    setModalOpen(true)
  }

  /* ---------------- mutations ---------------- */
  const onSaveError = (err) => {
    const fieldErrors = parseServerErrors(err)
    setServerErrors(fieldErrors)
    setFormError(
      Object.keys(fieldErrors).length
        ? t('راجع الحقول المحددة', 'Please review the highlighted fields')
        : err?.problem?.detail || err?.response?.data?.detail || t('تعذّر حفظ المنتج', 'Could not save the product')
    )
  }

  const createMutation = useMutation({
    mutationFn: (data) => catalogService.createProduct(data),
    onSuccess: () => {
      toast.success(t('تم نشر المنتج في السوق', 'Product published to the marketplace'))
      closeModal()
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: onSaveError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => catalogService.updateProduct(id, data),
    onSuccess: () => {
      toast.success(t('تم تحديث المنتج', 'Product updated'))
      closeModal()
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: onSaveError,
  })

  const archiveMutation = useMutation({
    mutationFn: (id) => catalogService.deleteProduct(id),
    onSuccess: () => {
      toast.info(t('تمت أرشفة المنتج وإزالته من السوق', 'Product archived and unlisted'))
      setArchiveTarget(null)
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
    onError: (e) => toast.error(e?.problem?.detail || t('تعذّرت الأرشفة', 'Could not archive the product')),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setFormError(null)

    const firstInvalid = Object.keys(errors)[0]
    if (firstInvalid) {
      document.getElementById(`pf-${firstInvalid}`)?.focus()
      return
    }

    const fixed = form.pricingMode === PRICING.FIXED
    const payload = {
      categoryId: form.categoryId,
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim() || undefined,
      sku: form.sku.trim() || undefined,
      pricingMode: form.pricingMode,
      unitPrice: fixed ? Number(form.unitPrice) : null,
      unit: form.unit,
      minimumOrderQuantity: Number(form.moq),
      availableQuantity: form.stock === '' ? undefined : Number(form.stock),
      deliveryLeadTimeDays: Number(form.leadTime),
      specifications: form.specifications.trim() || undefined,
      descriptionAr: form.descriptionAr.trim() || undefined,
      descriptionEn: form.descriptionEn.trim() || undefined,
    }

    if (editing) updateMutation.mutate({ id: editing.id, data: payload })
    else createMutation.mutate(payload)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  // بعد كل الـ Hooks
  if (!isSupplier) return <Navigate to="/marketplace" replace />

  const BackIcon = isAr ? ArrowRight : ArrowLeft

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1266D6] text-xs font-bold mb-2">
              <Layers size={14} />
              <span>{t('إدارة منتجات المورد', 'Supplier products')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] tracking-tight">
              {t('منتجاتي المعروضة في السوق', 'My marketplace products')}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {t(
                'انشر منتجات شركتك بسعر ثابت أو قابل للتفاوض. المشترون الموثقون هم من يشترون ويفاوضون؛ حسابك كمورد يعرض ويرد فقط.',
                'Publish your products with fixed or negotiable pricing. Verified buyers purchase and negotiate; your supplier account lists and responds.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button as={Link} to="/marketplace" variant="outline" size="md" icon={<BackIcon size={16} />}>
              {t('عرض في السوق', 'View marketplace')}
            </Button>
            <Button variant="primary" size="md" icon={<Plus size={18} />} onClick={openCreate} disabled={!isVerified}>
              {t('إضافة منتج جديد', 'Add product')}
            </Button>
          </div>
        </div>

        {products.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              [t('إجمالي المنتجات', 'Total'), stats.total],
              [t('سعر ثابت', 'Fixed price'), stats.fixed],
              [t('قابل للتفاوض', 'Negotiable'), stats.negotiable],
              [t('مؤرشف', 'Archived'), stats.archived],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 border border-slate-100 py-3">
                <dd className="text-xl font-extrabold text-[#06245B]">{numberFormat.format(value)}</dd>
                <dt className="text-xs text-slate-500 mt-0.5">{label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>

      {!isVerified && (
        <div role="status" className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <p>
            {t('نشر المنتجات متاح بعد توثيق شركتك. ', 'Publishing products is available after your company is verified. ')}
            <Link to="/onboarding/verification" className="font-bold underline">
              {t('أكمل التوثيق', 'Complete verification')}
            </Link>
          </p>
        </div>
      )}

      {/* Product list */}
      {isLoading ? (
        <PageSpinner />
      ) : isError ? (
        <div className="bg-white rounded-3xl p-12 border border-red-200 text-center space-y-4">
          <p className="text-sm text-slate-600">{t('تعذّر تحميل منتجاتك.', 'Could not load your products.')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t('إعادة المحاولة', 'Retry')}
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center">
          <EmptyState
            icon={Package}
            title={t('لم تنشر أي منتجات بعد', 'No products listed yet')}
            description={t(
              'أضف منتجات شركتك لتظهر للمشترين في السوق الصناعي.',
              'Add your products so buyers can find them in the marketplace.'
            )}
            action={
              isVerified && (
                <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
                  {t('نشر أول منتج', 'Publish your first product')}
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => {
            const isFixed = p.pricingMode === PRICING.FIXED || p.pricingMode === 'Fixed'
            const active = p.isActive !== false
            const category = isAr ? p.categoryNameAr || p.categoryNameEn : p.categoryNameEn || p.categoryNameAr
            return (
              <article
                key={p.id}
                className={`bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between hover:border-[#1266D6] hover:shadow-sm transition-all ${
                  active ? '' : 'opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {category ? (
                      <span className="text-xs font-bold text-[#1266D6] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 truncate">
                        {category}
                      </span>
                    ) : <span />}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!active && <Badge variant="navy">{t('مؤرشف', 'Archived')}</Badge>}
                      <Badge variant={isFixed ? 'success' : 'warning'}>
                        {isFixed ? t('سعر ثابت', 'Fixed price') : t('قابل للتفاوض', 'Negotiable')}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-[#06245B] text-base mb-1">
                    {isAr ? p.nameAr : p.nameEn || p.nameAr}
                  </h3>
                  {p.sku && <p className="text-xs font-mono text-slate-400 mb-3">SKU: {p.sku}</p>}

                  <dl className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs mb-3">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">{t('السعر المعلن', 'Unit price')}</dt>
                      <dd className="font-bold text-[#06245B] text-end">
                        {isFixed && p.unitPrice != null
                          ? `${numberFormat.format(p.unitPrice)} ${p.currency || ''} / ${p.unit}`
                          : t('تفاوضي', 'Negotiable')}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">{t('الحد الأدنى', 'MOQ')}</dt>
                      <dd>{numberFormat.format(p.minimumOrderQuantity)} {p.unit}</dd>
                    </div>
                    {p.availableQuantity != null && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">{t('المخزون المتاح', 'Available stock')}</dt>
                        <dd>{numberFormat.format(p.availableQuantity)} {p.unit}</dd>
                      </div>
                    )}
                    {p.deliveryLeadTimeDays > 0 && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-slate-500">{t('مهلة التسليم', 'Lead time')}</dt>
                        <dd>{p.deliveryLeadTimeDays} {t('يوم', 'days')}</dd>
                      </div>
                    )}
                  </dl>

                  {p.specifications && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{p.specifications}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button variant="outline" size="xs" icon={<Edit2 size={13} />} onClick={() => openEdit(p)}>
                    {t('تعديل', 'Edit')}
                  </Button>
                  {active && (
                    <Button variant="danger" size="xs" icon={<Archive size={13} />} onClick={() => setArchiveTarget(p)}>
                      {t('أرشفة', 'Archive')}
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Add / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? t('تعديل بيانات المنتج', 'Edit product') : t('نشر منتج جديد', 'Publish a new product')}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
          {formError && (
            <div role="alert" className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl">
              {formError}
            </div>
          )}

          <FormField id="pf-categoryId" label={t('القطاع الصناعي', 'Industry category')} required error={err('categoryId')}>
            <SelectField
              {...bind('categoryId')}
              value={form.categoryId}
              onChange={(e) => setField('categoryId', e.target.value)}
              disabled={!!editing}
              placeholder={t('اختر القطاع...', 'Select category...')}
              options={allowedCategories.map((c) => ({ value: c.id, label: isAr ? c.nameAr : c.nameEn || c.nameAr }))}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField id="pf-nameAr" label={t('اسم المنتج بالعربية', 'Product name (Arabic)')} required error={err('nameAr')}>
              <TextField
                {...bind('nameAr')}
                value={form.nameAr}
                onChange={(e) => setField('nameAr', e.target.value)}
                maxLength={200}
                placeholder={t('مثال: بولي إيثيلين عالي الكثافة', 'e.g. HDPE resin')}
              />
            </FormField>
            <FormField id="pf-nameEn" label={t('اسم المنتج بالإنجليزية', 'Product name (English)')} optional error={err('nameEn')}>
              <TextField
                {...bind('nameEn')}
                dir="ltr"
                value={form.nameEn}
                onChange={(e) => setField('nameEn', e.target.value)}
                maxLength={200}
                placeholder="e.g. High-density polyethylene"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField id="pf-sku" label={t('كود الصنف (SKU)', 'SKU')} optional error={err('sku')}>
              <TextField
                {...bind('sku')}
                dir="ltr"
                value={form.sku}
                onChange={(e) => setField('sku', e.target.value)}
                maxLength={50}
                disabled={!!editing}
                placeholder="PROD-001"
              />
            </FormField>
            <FormField id="pf-unit" label={t('وحدة القياس', 'Unit of measure')} required error={err('unit')}>
              <SelectField
                {...bind('unit')}
                value={form.unit}
                onChange={(e) => setField('unit', e.target.value)}
                placeholder={t('اختر الوحدة...', 'Select unit...')}
                options={unitOptions}
              />
            </FormField>
          </div>

          <div>
            <span className="block text-xs font-bold text-[#06245B] mb-1">
              {t('طريقة التسعير', 'Pricing mode')} <span className="text-red-500" aria-hidden="true">*</span>
            </span>
            <div role="radiogroup" aria-label={t('طريقة التسعير', 'Pricing mode')} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                [PRICING.FIXED, t('سعر ثابت', 'Fixed price'), t('شراء فوري + تفاوض', 'Buy now & negotiate'), 'border-[#1266D6] bg-blue-50 text-[#06245B]'],
                [PRICING.NEGOTIABLE, t('قابل للتفاوض', 'Negotiable'), t('عروض أسعار فقط', 'Offers only'), 'border-amber-500 bg-amber-50 text-amber-900'],
              ].map(([val, title, sub, activeCls]) => (
                <button
                  key={val}
                  type="button"
                  role="radio"
                  aria-checked={form.pricingMode === val}
                  onClick={() => setField('pricingMode', val)}
                  className={`p-3 rounded-xl border text-start transition-colors ${
                    form.pricingMode === val ? activeCls : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="block text-xs opacity-80">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {form.pricingMode === PRICING.FIXED && (
            <FormField id="pf-unitPrice" label={t('سعر الوحدة', 'Unit price')} required error={err('unitPrice')}>
              <NumberField
                {...bind('unitPrice')}
                value={form.unitPrice}
                onChange={(v) => setField('unitPrice', v)}
                min={0.01}
                step={1}
                decimals={2}
                suffix="EGP"
                placeholder="0.00"
              />
            </FormField>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField id="pf-moq" label={t('الحد الأدنى للطلب', 'Minimum order')} required error={err('moq')}>
              <NumberField
                {...bind('moq')}
                value={form.moq}
                onChange={(v) => setField('moq', v)}
                min={0.01}
                step={1}
                decimals={2}
                suffix={form.unit || undefined}
              />
            </FormField>
            <FormField
              id="pf-stock"
              label={t('المخزون المتاح', 'Available stock')}
              optional
              error={err('stock')}
              helper={t('اتركه فارغًا لو غير محدد', 'Leave empty if not tracked')}
            >
              <NumberField
                {...bind('stock')}
                value={form.stock}
                onChange={(v) => setField('stock', v)}
                min={0}
                step={1}
                decimals={2}
                suffix={form.unit || undefined}
              />
            </FormField>
            <FormField id="pf-leadTime" label={t('مهلة التسليم', 'Lead time')} required error={err('leadTime')}>
              <NumberField
                {...bind('leadTime')}
                value={form.leadTime}
                onChange={(v) => setField('leadTime', v)}
                min={1}
                max={365}
                step={1}
                decimals={0}
                suffix={t('يوم', 'days')}
              />
            </FormField>
          </div>

          <FormField id="pf-specifications" label={t('المواصفات الفنية والشهادات', 'Technical specifications')} optional error={err('specifications')}>
            <TextArea
              {...bind('specifications')}
              rows={3}
              value={form.specifications}
              onChange={(e) => setField('specifications', e.target.value)}
              maxLength={2000}
              placeholder={t('الدرجة، النقاء، شهادات المطابقة (ASTM/ISO)...', 'Grade, purity, conformity certificates (ASTM/ISO)...')}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField id="pf-descriptionAr" label={t('وصف المنتج بالعربية', 'Description (Arabic)')} optional error={err('descriptionAr')}>
              <TextArea
                {...bind('descriptionAr')}
                rows={2}
                value={form.descriptionAr}
                onChange={(e) => setField('descriptionAr', e.target.value)}
                maxLength={2000}
              />
            </FormField>
            <FormField id="pf-descriptionEn" label={t('وصف المنتج بالإنجليزية', 'Description (English)')} optional error={err('descriptionEn')}>
              <TextArea
                {...bind('descriptionEn')}
                dir="ltr"
                rows={2}
                value={form.descriptionEn}
                onChange={(e) => setField('descriptionEn', e.target.value)}
                maxLength={2000}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={closeModal} disabled={isSaving}>
              {t('إلغاء', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={isSaving}>
              {editing ? t('حفظ التعديلات', 'Save changes') : t('نشر المنتج', 'Publish product')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
        loading={archiveMutation.isPending}
        title={t('تأكيد أرشفة المنتج', 'Confirm archive')}
        message={t(
          `هل تريد أرشفة "${archiveTarget?.nameAr}"؟ لن يظهر للمشترين في السوق، ولن تتأثر الصفقات الحالية.`,
          `Archive "${archiveTarget?.nameEn || archiveTarget?.nameAr}"? It will no longer appear to buyers; existing deals are not affected.`
        )}
      />
    </div>
  )
}