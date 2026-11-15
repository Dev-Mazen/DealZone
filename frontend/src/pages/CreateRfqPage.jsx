import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, AlertCircle, Package, CheckCircle2, Building2 } from 'lucide-react'
import { rfqService } from '../shared/api/services/rfqService'
import { catalogService } from '../shared/api/services/catalogService'
import { useTranslation } from '../hooks/useTranslation'
import { usePermissions } from '../hooks/usePermissions'
import { useToast } from '../hooks/useToast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card, { CardHeader } from '../components/ui/Card'
import { PageSpinner } from '../components/ui/Spinner'

/* ----------------------------- constants ----------------------------- */

const GOVERNORATES = [
  ['Cairo', 'القاهرة'], ['Giza', 'الجيزة'], ['Alexandria', 'الإسكندرية'], ['Luxor', 'الأقصر'],
  ['Aswan', 'أسوان'], ['Qena', 'قنا'], ['Sohag', 'سوهاج'], ['Minya', 'المنيا'],
  ['Asyut', 'أسيوط'], ['Fayoum', 'الفيوم'], ['Beni Suef', 'بني سويف'], ['Suez', 'السويس'],
  ['Ismailia', 'الإسماعيلية'], ['Port Said', 'بورسعيد'], ['Damietta', 'دمياط'],
  ['Dakahlia', 'الدقهلية'], ['Sharqia', 'الشرقية'], ['Qalyubia', 'القليوبية'],
  ['Monufia', 'المنوفية'], ['Gharbia', 'الغربية'], ['Kafr el-Sheikh', 'كفر الشيخ'],
  ['Beheira', 'البحيرة'], ['Matruh', 'مطروح'], ['North Sinai', 'شمال سيناء'],
  ['South Sinai', 'جنوب سيناء'], ['Red Sea', 'البحر الأحمر'], ['New Valley', 'الوادي الجديد'],
].map(([value, ar]) => ({ value, ar }))

const selectClass =
  'w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10 text-[#1E293B] bg-white'
const textareaClass =
  'w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10 resize-none text-[#1E293B] placeholder:text-[#94A3B8]'
const labelClass = 'block text-sm font-medium text-[#475569] mb-1'

const toDateInput = (d) => d.toISOString().split('T')[0]
const addDays = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

/* ------------------------------- schema ------------------------------ */

// Empty inputs ('' or NaN) become undefined so optional numeric fields don't fail validation.
const emptyToUndefined = (v) =>
  v === '' || v == null || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v

const optionalPositive = (msg) =>
  z.preprocess(emptyToUndefined, z.coerce.number({ invalid_type_error: msg }).positive(msg).optional())

const buildSchema = (isAr) => {
  const t = (ar, en) => (isAr ? ar : en)

  const item = z.object({
    categoryId: z.string().min(1, t('اختر الفئة', 'Select a category')),
    materialId: z.string().optional(),
    materialName: z.string().min(2, t('اسم المادة مطلوب', 'Material name is required')),
    specifications: z.string().min(5, t('اكتب المواصفات (5 أحرف على الأقل)', 'Add specifications (min 5 chars)')),
    quantity: z.coerce
      .number({ invalid_type_error: t('أدخل كمية رقمية', 'Enter a numeric quantity') })
      .positive(t('الكمية يجب أن تكون أكبر من صفر', 'Quantity must be greater than 0')),
    unitOfMeasureId: z.string().optional(),
    targetPricePerUnit: optionalPositive(t('السعر يجب أن يكون أكبر من صفر', 'Price must be greater than 0')),
  })

  return z
    .object({
      title: z.string().min(5, t('العنوان 5 أحرف على الأقل', 'Title must be at least 5 characters')),
      deliveryGovernorate: z.string().min(1, t('اختر المحافظة', 'Select a governorate')),
      deliveryCity: z.string().optional(),
      deliveryAddress: z.string().min(5, t('اكتب عنوان التسليم', 'Enter the delivery address')),
      closingDateUtc: z.string().min(1, t('اختر تاريخ إغلاق العروض', 'Select a closing date')),
      requiredDeliveryDateUtc: z.string().optional(),
      targetBudget: optionalPositive(t('الميزانية يجب أن تكون أكبر من صفر', 'Budget must be greater than 0')),
      notes: z.string().optional(),
      items: z.array(item).min(1, t('أضف بنداً واحداً على الأقل', 'Add at least one line item')),
    })
    .refine((d) => !d.requiredDeliveryDateUtc || !d.closingDateUtc || d.requiredDeliveryDateUtc >= d.closingDateUtc, {
      path: ['requiredDeliveryDateUtc'],
      message: t('تاريخ التسليم يجب أن يكون بعد إغلاق العروض', 'Delivery date must be after the closing date'),
    })
}

/* ----------------------------- prefill ------------------------------- */

// Everything prefilled goes into defaultValues once, so later re-renders never overwrite user edits.
const buildDefaults = (prefilled, isAr) => {
  const t = (ar, en) => (isAr ? ar : en)
  const matDisplay = prefilled?.materialName || prefilled?.materialCode || ''
  const supplier = prefilled?.targetSupplierName

  let title = ''
  if (matDisplay) {
    title = supplier
      ? t(`طلب عرض سعر موجه إلى ${supplier}: ${matDisplay}`, `RFQ to ${supplier}: ${matDisplay}`)
      : t(`طلب توريد: ${matDisplay}`, `RFQ: Supply of ${matDisplay}`)
  }

  const specifications =
    prefilled?.specifications ||
    (matDisplay
      ? t(
          `توريد ${matDisplay} مطابق للمواصفات القياسية مع شهادة الجودة.`,
          `Supply of ${matDisplay} conforming to industry standards, with quality certificate.`
        )
      : '')

  return {
    title,
    notes: supplier ? t(`طلب موجه إلى المورد: ${supplier}`, `Targeted RFQ for supplier: ${supplier}`) : '',
    deliveryGovernorate: prefilled?.governorate || '',
    deliveryCity: prefilled?.city || '',
    deliveryAddress: prefilled?.deliveryAddress || '',
    closingDateUtc: toDateInput(addDays(7)),
    requiredDeliveryDateUtc: '',
    targetBudget: '',
    items: [
      {
        categoryId: prefilled?.categoryId || '',
        materialId: prefilled?.materialId || '',
        materialName: matDisplay,
        specifications,
        quantity: prefilled?.quantity ?? '',
        unitOfMeasureId: '',
        targetPricePerUnit: '',
      },
    ],
  }
}

/* ----------------------------- line item ----------------------------- */

function LineItemRow({ index, canRemove, onRemove, categories, units, isAr, register, errors, setValue, watch }) {
  const t = (ar, en) => (isAr ? ar : en)
  const itemErrors = errors.items?.[index]
  const categoryId = watch(`items.${index}.categoryId`)

  const { data: materials } = useQuery({
    queryKey: ['catalog', 'materials', categoryId],
    queryFn: () => catalogService.getMaterials({ categoryId, pageSize: 200 }),
    enabled: !!categoryId,
  })

  const nameOf = (o) => (isAr ? o.nameAr || o.nameEn : o.nameEn || o.nameAr)
  const materialItems = materials?.items || []

  const categoryReg = register(`items.${index}.categoryId`)
  const materialReg = register(`items.${index}.materialName`)

  return (
    <div className="p-4 bg-[#F4F7FB] rounded-xl border border-[rgba(6,36,91,0.08)] space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#06245B]">{t(`البند ${index + 1}`, `Item ${index + 1}`)}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-50 text-[#EF4444] transition-colors"
            title={t('حذف', 'Remove')}
            aria-label={t('حذف البند', 'Remove item')}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className={labelClass}>{t('الفئة', 'Category')} *</label>
          <select
            {...categoryReg}
            onChange={(e) => {
              categoryReg.onChange(e)
              // a new category invalidates the previously picked material
              setValue(`items.${index}.materialId`, '')
              setValue(`items.${index}.materialName`, '')
            }}
            className={selectClass}
          >
            <option value="">{t('اختر الفئة', 'Select category')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {'—'.repeat(cat._depth)}
                {cat._depth > 0 ? ' ' : ''}
                {nameOf(cat)}
              </option>
            ))}
          </select>
          {itemErrors?.categoryId && <p className="text-[#EF4444] text-xs mt-1">{itemErrors.categoryId.message}</p>}
        </div>

        {/* Material: ONE field. Type freely, or pick a catalog suggestion. */}
        <div>
          <Input
            label={`${t('المادة', 'Material')} *`}
            placeholder={materialItems.length ? t('اكتب أو اختر من القائمة', 'Type or pick from the list') : t('اسم المادة', 'Material name')}
            list={`materials-${index}`}
            autoComplete="off"
            {...materialReg}
            onChange={(e) => {
              materialReg.onChange(e)
              const match = materialItems.find((m) => nameOf(m) === e.target.value)
              setValue(`items.${index}.materialId`, match?.id || '')
            }}
            error={itemErrors?.materialName?.message}
          />
          <datalist id={`materials-${index}`}>
            {materialItems.map((m) => (
              <option key={m.id} value={nameOf(m)} />
            ))}
          </datalist>
        </div>

        {/* Quantity + unit + target price */}
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          label={`${t('الكمية', 'Quantity')} *`}
          {...register(`items.${index}.quantity`)}
          error={itemErrors?.quantity?.message}
        />

        <div>
          <label className={labelClass}>{t('وحدة القياس', 'Unit')}</label>
          <select {...register(`items.${index}.unitOfMeasureId`)} className={selectClass}>
            <option value="">{t('اختر الوحدة', 'Select unit')}</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {isAr
                  ? `${unit.nameAr} (${unit.symbolAr || unit.code})`
                  : `${unit.nameEn} (${unit.symbolEn || unit.code})`}
              </option>
            ))}
          </select>
        </div>

        <Input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          label={t('السعر المستهدف للوحدة (اختياري)', 'Target unit price (optional)')}
          {...register(`items.${index}.targetPricePerUnit`)}
          error={itemErrors?.targetPricePerUnit?.message}
        />
      </div>

      {/* Specifications */}
      <div>
        <label className={labelClass}>{t('المواصفات', 'Specifications')} *</label>
        <textarea
          {...register(`items.${index}.specifications`)}
          rows={3}
          placeholder={t('الدرجة، المقاس، المعايير المطلوبة...', 'Grade, size, required standards...')}
          className={textareaClass}
        />
        {itemErrors?.specifications && <p className="text-[#EF4444] text-xs mt-1">{itemErrors.specifications.message}</p>}
      </div>
    </div>
  )
}

/* -------------------------------- page ------------------------------- */

export default function CreateRfqPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const t = (ar, en) => (isAr ? ar : en)
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const { canManageRfqs, isSupplierOnly } = usePermissions()

  // Prefilled material/supplier from navigation state or URL query
  const prefilled = useMemo(() => {
    const fromState = location.state?.prefilledMaterial
    if (fromState) return fromState

    const get = (k) => searchParams.get(k) || undefined
    const materialId = get('materialId')
    const materialCode = get('materialCode')
    const materialName = get('materialName')
    const targetSupplierId = get('supplierId') || get('targetSupplierId')
    const targetSupplierName = get('supplierName') || get('targetSupplierName')

    if (!(materialId || materialCode || materialName || targetSupplierId || targetSupplierName)) return null
    const qty = get('qty')
    return {
      materialId,
      materialCode,
      materialName,
      categoryId: get('catId'),
      unit: get('unit'),
      quantity: qty ? Number(qty) : undefined,
      targetSupplierId,
      targetSupplierName,
    }
  }, [location.state, searchParams])

  const isPrefilled = Boolean(prefilled?.materialName || prefilled?.materialCode || prefilled?.targetSupplierName)

  const schema = useMemo(() => buildSchema(isAr), [isAr])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: buildDefaults(prefilled, isAr),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: () => catalogService.getCategories(),
  })
  const { data: units, isLoading: loadingUnits } = useQuery({
    queryKey: ['catalog', 'units'],
    queryFn: () => catalogService.getUnits(),
  })

  // The only thing that depends on async data: match the prefilled unit once units are loaded
  useEffect(() => {
    if (!units?.length || !prefilled?.unit) return
    const target = prefilled.unit.toLowerCase()
    const found = units.find(
      (u) =>
        u.id === prefilled.unitOfMeasureId ||
        u.code?.toLowerCase() === target ||
        u.nameEn?.toLowerCase() === target ||
        u.nameAr?.includes(prefilled.unit)
    )
    if (found) setValue('items.0.unitOfMeasureId', found.id)
  }, [units, prefilled, setValue])

  // Flatten the category tree (keeps depth for indentation)
  const flatCategories = useMemo(() => {
    const flat = []
    const walk = (cats, depth = 0) =>
      cats.forEach((cat) => {
        flat.push({ ...cat, _depth: depth })
        if (cat.subCategories?.length) walk(cat.subCategories, depth + 1)
      })
    if (categories) walk(categories)
    return flat
  }, [categories])

  const createMutation = useMutation({
    mutationFn: (data) => rfqService.create(data),
    onSuccess: (rfq) => {
      toast.success(t('تم إنشاء طلب السعر', 'RFQ created'))
      navigate(`/rfqs/${rfq.id}`)
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || t('تعذّر إنشاء الطلب', 'Could not create the RFQ'))
    },
  })

  const submit = useCallback(
    (publishImmediately) => (data) => {
      const govAr = GOVERNORATES.find((g) => g.value === data.deliveryGovernorate)
      createMutation.mutate({
        title: data.title,
        // derived from the first line item instead of asking the user twice
        targetCategoryId: data.items[0]?.categoryId || undefined,
        deliveryGovernorate: data.deliveryGovernorate,
        // city is optional in the UI; fall back to the governorate so the API still gets a value
        deliveryCity: data.deliveryCity?.trim() || govAr?.value || data.deliveryGovernorate,
        deliveryAddress: data.deliveryAddress,
        closingDateUtc: new Date(data.closingDateUtc).toISOString(),
        requiredDeliveryDateUtc: data.requiredDeliveryDateUtc
          ? new Date(data.requiredDeliveryDateUtc).toISOString()
          : undefined,
        targetBudget: data.targetBudget || undefined,
        currency: 'EGP',
        notes: data.notes?.trim() || undefined,
        publishImmediately,
        targetSupplierCompanyId: prefilled?.targetSupplierId || undefined,
        items: data.items.map((item) => ({
          categoryId: item.categoryId,
          materialId: item.materialId || undefined,
          materialName: item.materialName,
          specifications: item.specifications,
          quantity: item.quantity,
          unitOfMeasureId: item.unitOfMeasureId || undefined,
          targetPricePerUnit: item.targetPricePerUnit || undefined,
        })),
      })
    },
    [createMutation, prefilled]
  )

  if (isSupplierOnly || !canManageRfqs) {
    return (
      <div className="text-center py-16">
        <p className="text-[#EF4444] mb-4 font-bold">
          {t(
            'الموردون لا يمكنهم إنشاء طلبات شراء. يمكنك تصفح طلبات الأسعار وتقديم عروضك.',
            'Suppliers cannot create RFQs. You can browse open RFQs and submit offers.'
          )}
        </p>
        <Button variant="primary" onClick={() => navigate('/rfqs')}>
          {t('تصفح طلبات الأسعار', 'Browse RFQs')}
        </Button>
      </div>
    )
  }

  if (loadingCategories || loadingUnits) return <PageSpinner />

  const minDate = toDateInput(addDays(1))
  const isPending = createMutation.isPending
  const publishingNow = isPending && createMutation.variables?.publishImmediately

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate('/rfqs')}
          className="mt-1 p-2 rounded-lg hover:bg-[#EAF4FF] text-[#64748B] hover:text-[#06245B] transition-colors"
          aria-label={t('رجوع', 'Back')}
        >
          <ArrowLeft size={20} className="rtl:rotate-180" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#06245B]">{t('طلب سعر جديد', 'New RFQ')}</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {t('حدد ما تحتاجه واستقبل عروض الموردين.', 'Tell suppliers what you need and receive offers.')}
          </p>
        </div>
      </div>

      {/* Prefilled banner */}
      {isPrefilled && (
        <div className="p-4 rounded-2xl bg-[#EAF4FF] border border-blue-200/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1266D6] text-white flex items-center justify-center shrink-0">
            <Package size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-[#06245B]">{prefilled.materialName || prefilled.materialCode}</h3>
              {prefilled.materialCode && prefilled.materialName && (
                <span className="font-mono text-xs text-[#06245B]/70">{prefilled.materialCode}</span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                <CheckCircle2 size={12} />
                {t('معبأ تلقائياً', 'Pre-filled')}
              </span>
              {prefilled.targetSupplierName && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#06245B] bg-white px-2 py-0.5 rounded-md border border-blue-200">
                  <Building2 size={12} className="text-[#1266D6]" />
                  {prefilled.targetSupplierName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('راجع البيانات وعدّل أي حقل تريده.', 'Review the details and change anything you need.')}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(submit(false))} className="space-y-6" noValidate>
        {/* Basics */}
        <Card>
          <CardHeader title={t('الطلب', 'Request')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label={`${t('عنوان الطلب', 'Title')} *`}
                placeholder={t('مثال: خام بولي إيثيلين للربع الرابع', 'e.g., Polyethylene raw material Q4')}
                {...register('title')}
                error={errors.title?.message}
              />
            </div>
            <Input
              type="date"
              label={`${t('آخر موعد لاستقبال العروض', 'Offers close on')} *`}
              min={minDate}
              {...register('closingDateUtc')}
              error={errors.closingDateUtc?.message}
            />
          </div>
        </Card>

        {/* Delivery */}
        <Card>
          <CardHeader title={t('التسليم', 'Delivery')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('المحافظة', 'Governorate')} *</label>
              <select {...register('deliveryGovernorate')} className={selectClass}>
                <option value="">{t('اختر المحافظة', 'Select governorate')}</option>
                {GOVERNORATES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {isAr ? g.ar : g.value}
                  </option>
                ))}
              </select>
              {errors.deliveryGovernorate && (
                <p className="text-[#EF4444] text-xs mt-1">{errors.deliveryGovernorate.message}</p>
              )}
            </div>

            <Input
              label={t('المدينة / المنطقة (اختياري)', 'City / area (optional)')}
              {...register('deliveryCity')}
            />

            <div className="md:col-span-2">
              <Input
                label={`${t('عنوان التسليم', 'Delivery address')} *`}
                placeholder={t('الشارع، الحي، أو بوابة المصنع', 'Street, district, or factory gate')}
                {...register('deliveryAddress')}
                error={errors.deliveryAddress?.message}
              />
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-[#06245B]">{t('البنود', 'Items')}</h2>
              <p className="text-sm text-[#64748B] mt-0.5">{t('أضف المواد المطلوبة', 'Add the materials you need')}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => append({ categoryId: '', materialId: '', materialName: '', specifications: '', quantity: '', unitOfMeasureId: '', targetPricePerUnit: '' })}
            >
              {t('إضافة بند', 'Add item')}
            </Button>
          </div>

          {(errors.items?.root?.message || errors.items?.message) && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-[#EF4444] text-sm mb-4">
              <AlertCircle size={16} />
              {errors.items?.root?.message || errors.items?.message}
            </div>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <LineItemRow
                key={field.id}
                index={index}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
                categories={flatCategories}
                units={units || []}
                isAr={isAr}
                register={register}
                errors={errors}
                setValue={setValue}
                watch={watch}
              />
            ))}
          </div>
        </Card>

        {/* Optional extras, collapsed by default */}
        <Card>
          <details className="group" open={Boolean(prefilled?.targetSupplierName)}>
            <summary className="cursor-pointer select-none font-semibold text-[#06245B] list-none flex items-center justify-between">
              <span>{t('خيارات إضافية (اختيارية)', 'More options (optional)')}</span>
              <span className="text-xs text-[#64748B] group-open:hidden">{t('إظهار', 'Show')}</span>
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                type="date"
                label={t('تاريخ التسليم المطلوب', 'Required delivery date')}
                min={minDate}
                {...register('requiredDeliveryDateUtc')}
                error={errors.requiredDeliveryDateUtc?.message}
              />
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                label={t('الميزانية الإجمالية (جنيه)', 'Total budget (EGP)')}
                {...register('targetBudget')}
                error={errors.targetBudget?.message}
              />
              <div className="md:col-span-2">
                <label className={labelClass}>{t('ملاحظات للموردين', 'Notes for suppliers')}</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder={t('أي متطلبات خاصة...', 'Any special requirements...')}
                  className={textareaClass}
                />
              </div>
            </div>
          </details>
        </Card>

        {/* Actions: two explicit buttons instead of a checkbox */}
        <div className="sticky bottom-3 bg-white/95 backdrop-blur rounded-xl border border-[rgba(6,36,91,0.08)] shadow-lg p-4 flex flex-wrap items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate('/rfqs')} disabled={isPending}>
            {t('إلغاء', 'Cancel')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSubmit(submit(false))}
            loading={isPending && !publishingNow}
            disabled={isPending}
          >
            {t('حفظ كمسودة', 'Save as draft')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit(submit(true))}
            loading={publishingNow}
            disabled={isPending}
          >
            {t('نشر الطلب', 'Publish RFQ')}
          </Button>
        </div>
      </form>
    </div>
  )
}