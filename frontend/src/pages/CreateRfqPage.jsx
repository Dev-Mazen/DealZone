import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, AlertCircle, Package, CheckCircle2 } from 'lucide-react'
import { rfqService } from '../shared/api/services/rfqService'
import { catalogService } from '../shared/api/services/catalogService'
import { useTranslation } from '../hooks/useTranslation'
import { usePermissions } from '../hooks/usePermissions'
import { useToast } from '../hooks/useToast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card, { CardHeader } from '../components/ui/Card'
import { PageSpinner } from '../components/ui/Spinner'

const getCreateRfqSchema = (isAr) => {
  const itemSchema = z.object({
    categoryId: z.string().min(1, isAr ? 'القطاع/الفئة مطلوبة' : 'Category is required'),
    materialId: z.string().optional(),
    materialName: z.string().min(2, isAr ? 'اسم المادة مطلوب' : 'Material name is required'),
    specifications: z.string().min(5, isAr ? 'المواصفات الفنية مطلوبة (5 أحرف على الأقل)' : 'Specifications required (min 5 chars)'),
    quantity: z.coerce.number({ invalid_type_error: isAr ? 'يجب إدخال كمية رقمية' : 'Enter a numeric quantity' }).positive(isAr ? 'يجب أن تكون الكمية أكبر من الصفر' : 'Quantity must be > 0'),
    unitOfMeasureId: z.string().optional(),
    targetPricePerUnit: z.coerce.number().positive(isAr ? 'السعر المستهدف يجب أن يكون موجباً' : 'Target price must be positive').optional(),
    notes: z.string().optional(),
  })

  return z.object({
    title: z.string().min(5, isAr ? 'عنوان الطلب يجب ألا يقل عن 5 أحرف' : 'Title must be at least 5 characters'),
    description: z.string().optional(),
    targetCategoryId: z.string().optional(),
    deliveryGovernorate: z.string().min(1, isAr ? 'المحافظة مطلوبة' : 'Governorate is required'),
    deliveryCity: z.string().min(1, isAr ? 'المدينة مطلوبة' : 'City is required'),
    deliveryAddress: z.string().min(5, isAr ? 'عنوان التسليم بالتفصيل مطلوب' : 'Full delivery address required'),
    closingDateUtc: z.string().min(1, isAr ? 'تاريخ إغلاق العطاءات مطلوب' : 'Closing date required'),
    requiredDeliveryDateUtc: z.string().optional(),
    targetBudget: z.coerce.number().positive(isAr ? 'الميزانية التقديرية يجب أن تكون أكبر من الصفر' : 'Target budget must be positive').optional(),
    currency: z.string().optional(),
    notes: z.string().optional(),
    publishImmediately: z.boolean(),
    items: z.array(itemSchema).min(1, isAr ? 'يجب إضافة بند واحد على الأقل' : 'At least one line item is required'),
  })
}

const EGYPT_GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Luxor', 'Aswan', 'Qena', 'Sohag',
  'Minya', 'Asyut', 'Fayoum', 'Beni Suef', 'Suez', 'Ismailia',
  'Port Said', 'Damietta', 'Dakahlia', 'Sharqia', 'Qalyubia',
  'Monufia', 'Gharbia', 'Kafr el-Sheikh', 'Beheira', 'Matruh',
  'North Sinai', 'South Sinai', 'Red Sea', 'New Valley',
]

function LineItemRow({
  index,
  onRemove,
  categories,
  units,
  isAr,
  register,
  errors,
  setValue,
  watch,
}) {
  const selectedCategoryId = watch(`items.${index}.categoryId`)
  const { data: materials } = useQuery({
    queryKey: ['catalog', 'materials', selectedCategoryId],
    queryFn: () => catalogService.getMaterials({ categoryId: selectedCategoryId, pageSize: 200 }),
    enabled: !!selectedCategoryId,
  })

  return (
    <div className="p-4 bg-[#F4F7FB] rounded-xl border border-[rgba(6,36,91,0.08)] space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#06245B]">
          {isAr ? `البند ${index + 1}` : `Line Item ${index + 1}`}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-lg hover:bg-red-50 text-[#EF4444] transition-colors"
          title={isAr ? 'حذف' : 'Remove'}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-1">
            {isAr ? 'الفئة' : 'Category'} *
          </label>
          <select
            {...register(`items.${index}.categoryId`)}
            onChange={(e) => {
              setValue(`items.${index}.categoryId`, e.target.value)
              setValue(`items.${index}.materialId`, '')
              setValue(`items.${index}.materialName`, '')
            }}
            className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                       focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10
                       text-[#1E293B] bg-white"
          >
            <option value="">{isAr ? 'اختر الفئة' : 'Select category'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {isAr ? (cat.nameAr || cat.nameEn) : (cat.nameEn || cat.nameAr)}
              </option>
            ))}
          </select>
          {errors.items?.[index]?.categoryId && (
            <p className="text-[#EF4444] text-xs mt-1">{errors.items[index].categoryId.message}</p>
          )}
        </div>

        {/* Material dropdown (optional) + free-text name */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-1">
            {isAr ? 'المادة' : 'Material'} *
          </label>
          {materials && materials.items.length > 0 ? (
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                         focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10
                         text-[#1E293B] bg-white"
              onChange={(e) => {
                const mat = materials.items.find((m) => m.id === e.target.value)
                setValue(`items.${index}.materialId`, e.target.value)
                if (mat) {
                  setValue(`items.${index}.materialName`, isAr ? mat.nameAr : mat.nameEn)
                }
              }}
            >
              <option value="">{isAr ? 'اختر مادة (اختياري)' : 'Select material (optional)'}</option>
              {materials.items.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {isAr ? (mat.nameAr || mat.nameEn) : (mat.nameEn || mat.nameAr)}
                </option>
              ))}
            </select>
          ) : (
            <Input
              {...register(`items.${index}.materialName`)}
              placeholder={isAr ? 'اسم المادة' : 'Material name'}
              error={errors.items?.[index]?.materialName?.message}
            />
          )}
        </div>

        {/* Material name (always visible if dropdown selected) */}
        {materials && materials.items.length > 0 && (
          <Input
            {...register(`items.${index}.materialName`)}
            label={isAr ? 'اسم المادة المحدد' : 'Material Name'}
            placeholder={isAr ? 'سيتم ملؤه تلقائياً' : 'Auto-filled from selection'}
            error={errors.items?.[index]?.materialName?.message}
          />
        )}

        {/* Quantity */}
        <Input
          type="number"
          step="0.0001"
          min="0.0001"
          label={isAr ? 'الكمية *' : 'Quantity *'}
          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
          error={errors.items?.[index]?.quantity?.message}
        />

        {/* Unit of Measure */}
        <div>
          <label className="block text-sm font-medium text-[#475569] mb-1">
            {isAr ? 'وحدة القياس' : 'Unit of Measure'}
          </label>
          <select
            {...register(`items.${index}.unitOfMeasureId`)}
            className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                       focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10
                       text-[#1E293B] bg-white"
          >
            <option value="">{isAr ? 'اختر الوحدة' : 'Select unit'}</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {isAr ? `${unit.nameAr} (${unit.symbolAr || unit.code})` : `${unit.nameEn} (${unit.symbolEn || unit.code})`}
              </option>
            ))}
          </select>
        </div>

        {/* Target price per unit */}
        <Input
          type="number"
          step="0.01"
          min="0"
          label={isAr ? 'السعر المستهدف للوحدة (اختياري)' : 'Target Unit Price (optional)'}
          {...register(`items.${index}.targetPricePerUnit`, { valueAsNumber: true })}
        />
      </div>

      {/* Specifications */}
      <div>
        <label className="block text-sm font-medium text-[#475569] mb-1">
          {isAr ? 'المواصفات *' : 'Specifications *'}
        </label>
        <textarea
          {...register(`items.${index}.specifications`)}
          rows={3}
          placeholder={isAr ? 'وصف مفصل للمواصفات المطلوبة...' : 'Detailed specifications and requirements...'}
          className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                     focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10
                     resize-none text-[#1E293B] placeholder:text-[#94A3B8]"
        />
        {errors.items?.[index]?.specifications && (
          <p className="text-[#EF4444] text-xs mt-1">{errors.items[index].specifications.message}</p>
        )}
      </div>
    </div>
  )
}

export default function CreateRfqPage() {
  const { language } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const isAr = language === 'ar'

  const { canManageRfqs, isSupplierOnly } = usePermissions()

  // Extract pre-filled material from navigation state or URL query
  const prefilled = useMemo(() => {
    const stateObj = location.state?.prefilledMaterial
    if (stateObj) return stateObj
    const matId = searchParams.get('materialId')
    const matCode = searchParams.get('materialCode')
    const matName = searchParams.get('materialName')
    const catId = searchParams.get('catId')
    const unit = searchParams.get('unit')
    const qty = searchParams.get('qty')
    if (matId || matCode || matName) {
      return {
        materialId: matId || undefined,
        materialCode: matCode || undefined,
        materialName: matName || undefined,
        categoryId: catId || undefined,
        unit: unit || undefined,
        quantity: qty ? Number(qty) : undefined,
      }
    }
    return null
  }, [location.state, searchParams])

  const isPrefilled = Boolean(prefilled?.materialName || prefilled?.materialCode)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(getCreateRfqSchema(isAr)),
    mode: 'onChange',
    defaultValues: {
      publishImmediately: false,
      currency: 'EGP',
      items: [
        {
          categoryId: prefilled?.categoryId || '',
          materialId: prefilled?.materialId || '',
          materialName: prefilled?.materialName || '',
          specifications: prefilled?.specifications || '',
          quantity: prefilled?.quantity || undefined,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // Load catalog data
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: () => catalogService.getCategories(),
  })

  const { data: units, isLoading: loadingUnits } = useQuery({
    queryKey: ['catalog', 'units'],
    queryFn: () => catalogService.getUnits(),
  })

  // Automatically pre-fill the form whenever prefilled context or reference data is ready
  useEffect(() => {
    if (!prefilled) return

    const matDisplay = prefilled.materialName || prefilled.materialCode || ''
    if (matDisplay) {
      setValue('title', isAr ? `طلب توريد: ${matDisplay}` : `RFQ: Supply of ${matDisplay}`)
    }

    if (prefilled.categoryId) {
      setValue('targetCategoryId', prefilled.categoryId)
      setValue('items.0.categoryId', prefilled.categoryId)
    }

    if (prefilled.materialId) {
      setValue('items.0.materialId', prefilled.materialId)
    }

    if (prefilled.materialName) {
      setValue('items.0.materialName', prefilled.materialName)
    }

    if (prefilled.quantity) {
      setValue('items.0.quantity', prefilled.quantity)
    }

    if (prefilled.specifications) {
      setValue('items.0.specifications', prefilled.specifications)
    } else if (matDisplay) {
      setValue(
        'items.0.specifications',
        isAr
          ? `توريد مادة ${matDisplay} مطابقة للمعايير الصناعية والمواصفات القياسية المصرية (EOS) ومرفق معها شهادة الجودة.`
          : `Supply of ${matDisplay} conforming to certified EOS / ASTM industrial standards with Mill Test Certificate.`
      )
    }

    if (units && units.length > 0 && prefilled.unit) {
      const uTarget = prefilled.unit.toLowerCase()
      const found = units.find(
        (u) =>
          u.id === prefilled.unitOfMeasureId ||
          u.code?.toLowerCase() === uTarget ||
          u.nameEn?.toLowerCase() === uTarget ||
          u.nameAr?.includes(prefilled.unit)
      )
      if (found) {
        setValue('items.0.unitOfMeasureId', found.id)
      }
    }

    if (prefilled.deliveryAddress) {
      setValue('deliveryAddress', prefilled.deliveryAddress)
    }
    if (prefilled.industrialZone) {
      setValue('deliveryCity', prefilled.industrialZone)
      setValue('deliveryGovernorate', 'Sharqia')
    }
  }, [prefilled, units, setValue, isAr])

  // Flatten categories for dropdown (all levels)
  const flatCategories = useCallback(() => {
    const flat = []
    const traverse = (cats, depth = 0) => {
      cats.forEach((cat) => {
        flat.push({ ...cat, _depth: depth })
        if (cat.subCategories?.length) traverse(cat.subCategories, depth + 1)
      })
    }
    if (categories) traverse(categories)
    return flat
  }, [categories])()

  const createMutation = useMutation({
    mutationFn: (data) => rfqService.create(data),
    onSuccess: (rfq) => {
      toast.success(isAr ? 'تم إنشاء طلب السعر بنجاح' : 'RFQ created successfully')
      navigate(`/rfqs/${rfq.id}`)
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || (isAr ? 'فشل إنشاء الطلب' : 'Failed to create RFQ'))
    },
  })

  const onSubmit = (data) => {
    // Build the proper API request
    const request = {
      title: data.title,
      description: data.description || undefined,
      targetCategoryId: data.targetCategoryId || undefined,
      deliveryGovernorate: data.deliveryGovernorate,
      deliveryCity: data.deliveryCity,
      deliveryAddress: data.deliveryAddress,
      closingDateUtc: new Date(data.closingDateUtc).toISOString(),
      requiredDeliveryDateUtc: data.requiredDeliveryDateUtc
        ? new Date(data.requiredDeliveryDateUtc).toISOString()
        : undefined,
      targetBudget: data.targetBudget || undefined,
      currency: data.currency || 'EGP',
      notes: data.notes || undefined,
      publishImmediately: data.publishImmediately,
      items: data.items.map((item) => ({
        categoryId: item.categoryId,
        materialId: item.materialId || undefined,
        materialName: item.materialName,
        specifications: item.specifications,
        quantity: item.quantity,
        unitOfMeasureId: item.unitOfMeasureId || undefined,
        targetPricePerUnit: item.targetPricePerUnit || undefined,
        notes: item.notes || undefined,
      })),
    }
    createMutation.mutate(request)
  }

  if (isSupplierOnly || !canManageRfqs) {
    return (
      <div className="text-center py-16">
        <p className="text-[#EF4444] mb-4 font-bold">
          {isAr
            ? 'غير مسموح للموردين بإنشاء طلبات شراء. يمكنك تصفح طلبات الأسعار وتقديم عروضك.'
            : 'Suppliers are not permitted to create RFQs. You can browse open RFQs and submit bids.'}
        </p>
        <Button variant="primary" onClick={() => navigate('/rfqs')}>
          {isAr ? 'استعراض طلبات الأسعار' : 'Discover RFQs'}
        </Button>
      </div>
    )
  }

  if (loadingCategories || loadingUnits) return <PageSpinner />

  // Minimum closing date = tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate('/rfqs')}
          className="mt-1 p-2 rounded-lg hover:bg-[#EAF4FF] text-[#64748B] hover:text-[#06245B] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#06245B]">
            {isAr ? 'إنشاء طلب سعر جديد' : 'Create New RFQ'}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {isAr
              ? 'أنشئ طلب تسعير لمواد خام صناعية وتلقّ عروض من الموردين المعتمدين'
              : 'Create a Request for Quotation for industrial raw materials and receive offers from verified suppliers'}
          </p>
        </div>
      </div>

      {/* Contextual Pre-filled Material Banner */}
      {isPrefilled && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#EAF4FF] to-blue-50 border border-blue-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1266D6] text-white flex items-center justify-center shrink-0">
              <Package size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1266D6] uppercase tracking-wide">
                  {isAr ? 'طلب مخصص لخامة محددة' : 'Specific Material Request'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  <CheckCircle2 size={12} />
                  {isAr ? 'بيانات معبأة تلقائياً' : 'Pre-filled'}
                </span>
              </div>
              <h3 className="font-extrabold text-[#06245B] text-base mt-0.5">
                {prefilled.materialName || prefilled.materialCode}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'تم ملء المواصفات القياسية ووحدة القياس والفئة تلقائياً. يمكنك مراجعة وتعديل أي حقل بحرية.'
                  : 'Standard specifications, unit of measure, and category were auto-filled. You can review and adjust any field freely.'}
              </p>
            </div>
          </div>
          {prefilled.materialCode && (
            <span className="font-mono text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-blue-200 text-[#06245B] shrink-0">
              {prefilled.materialCode}
            </span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* General Info */}
        <Card>
          <CardHeader
            title={isAr ? 'معلومات عامة' : 'General Information'}
          />
          <div className="space-y-4">
            <Input
              label={isAr ? 'عنوان الطلب *' : 'RFQ Title *'}
              placeholder={isAr ? 'مثال: طلب خام بولي إيثيلين Q4-2026' : 'e.g., Polyethylene Raw Material Q4-2026'}
              {...register('title')}
              error={errors.title?.message}
            />

            <div>
              <label className="block text-sm font-medium text-[#475569] mb-1">
                {isAr ? 'الفئة المستهدفة (اختياري)' : 'Target Category (optional)'}
              </label>
              <select
                {...register('targetCategoryId')}
                className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                           focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10
                           text-[#1E293B] bg-white"
              >
                <option value="">{isAr ? 'جميع الفئات' : 'All categories'}</option>
                {flatCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {'—'.repeat(cat._depth)}{cat._depth > 0 ? ' ' : ''}
                    {isAr ? (cat.nameAr || cat.nameEn) : (cat.nameEn || cat.nameAr)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#475569] mb-1">
                {isAr ? 'الوصف (اختياري)' : 'Description (optional)'}
              </label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder={isAr ? 'وصف إضافي للطلب...' : 'Additional context about this request...'}
                className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                           focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10
                           resize-none text-[#1E293B] placeholder:text-[#94A3B8]"
              />
            </div>
          </div>
        </Card>

        {/* Delivery & Deadline */}
        <Card>
          <CardHeader
            title={isAr ? 'التسليم والجدول الزمني' : 'Delivery & Timeline'}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-1">
                {isAr ? 'المحافظة *' : 'Governorate *'}
              </label>
              <select
                {...register('deliveryGovernorate')}
                className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                           focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10
                           text-[#1E293B] bg-white"
              >
                <option value="">{isAr ? 'اختر المحافظة' : 'Select governorate'}</option>
                {EGYPT_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              {errors.deliveryGovernorate && (
                <p className="text-[#EF4444] text-xs mt-1">{errors.deliveryGovernorate.message}</p>
              )}
            </div>

            <Input
              label={isAr ? 'المدينة *' : 'City *'}
              {...register('deliveryCity')}
              error={errors.deliveryCity?.message}
            />

            <div className="md:col-span-2">
              <Input
                label={isAr ? 'عنوان التسليم الكامل *' : 'Full Delivery Address *'}
                placeholder={isAr ? 'الشارع، الحي، المنطقة الصناعية...' : 'Street, district, industrial zone...'}
                {...register('deliveryAddress')}
                error={errors.deliveryAddress?.message}
              />
            </div>

            <Input
              type="date"
              label={isAr ? 'تاريخ إغلاق العروض *' : 'Offer Closing Date *'}
              min={minDate}
              {...register('closingDateUtc')}
              error={errors.closingDateUtc?.message}
            />

            <Input
              type="date"
              label={isAr ? 'تاريخ التسليم المطلوب (اختياري)' : 'Required Delivery Date (optional)'}
              min={minDate}
              {...register('requiredDeliveryDateUtc')}
            />

            <Input
              type="number"
              step="0.01"
              min="0"
              label={isAr ? 'الميزانية الإجمالية (اختياري)' : 'Target Budget EGP (optional)'}
              {...register('targetBudget', { valueAsNumber: true })}
            />
          </div>
        </Card>

        {/* Line Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-[#06245B]">{isAr ? 'بنود الطلب' : 'Line Items'}</h2>
              <p className="text-sm text-[#64748B] mt-0.5">
                {isAr ? 'أضف المواد الخام المطلوبة' : 'Add the raw materials you need'}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => append({ categoryId: '', materialName: '', specifications: '', quantity: undefined })}
            >
              {isAr ? 'إضافة بند' : 'Add Item'}
            </Button>
          </div>

          {errors.items?.root && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-[#EF4444] text-sm mb-4">
              <AlertCircle size={16} />
              {errors.items.root.message}
            </div>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <LineItemRow
                key={field.id}
                index={index}
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

        {/* Notes */}
        <Card>
          <CardHeader title={isAr ? 'ملاحظات إضافية' : 'Additional Notes'} />
          <textarea
            {...register('notes')}
            rows={3}
            placeholder={isAr ? 'أي ملاحظات أو متطلبات خاصة...' : 'Any special requirements or notes for suppliers...'}
            className="w-full px-3 py-2.5 rounded-lg border border-[rgba(6,36,91,0.12)] text-sm
                       focus:outline-none focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/10
                       resize-none text-[#1E293B] placeholder:text-[#94A3B8]"
          />
        </Card>

        {/* Actions */}
        <div className="bg-white rounded-xl border border-[rgba(6,36,91,0.08)] p-5">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="publishImmediately"
              {...register('publishImmediately')}
              className="w-4 h-4 rounded border-[rgba(6,36,91,0.2)] text-[#00D9F5]"
            />
            <label htmlFor="publishImmediately" className="text-sm text-[#1E293B] cursor-pointer select-none">
              <span className="font-medium">{isAr ? 'نشر فوري' : 'Publish immediately'}</span>
              <span className="text-[#64748B] ms-2">
                {isAr ? '(إذا لم تحدد هذا الخيار، سيتم حفظه كمسودة)' : '(Otherwise saved as Draft)'}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/rfqs')}
              disabled={createMutation.isPending}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={createMutation.isPending}
            >
              {createMutation.isPending
                ? (isAr ? 'جاري الإنشاء...' : 'Creating...')
                : (isAr ? 'إنشاء طلب السعر' : 'Create RFQ')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
