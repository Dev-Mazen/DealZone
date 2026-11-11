import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
} from 'lucide-react'
import { tenderService } from '../../shared/api/services/tenderService'
import { catalogService } from '../../shared/api/services/catalogService'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import { useToast } from '../../hooks/useToast'

const MATERIAL_UNITS = [
  { value: 'MetricTon', label: 'Metric Ton', labelAr: 'طن متري' },
  { value: 'Kilogram', label: 'Kilogram (kg)', labelAr: 'كيلوجرام' },
  { value: 'Gram', label: 'Gram (g)', labelAr: 'جرام' },
  { value: 'Liter', label: 'Liter (L)', labelAr: 'لتر' },
  { value: 'CubicMeter', label: 'Cubic Meter (m³)', labelAr: 'متر مكعب' },
  { value: 'Piece', label: 'Piece (pcs)', labelAr: 'قطعة' },
  { value: 'Barrel', label: 'Barrel (bbl)', labelAr: 'برميل' },
]

const emptyItem = () => ({
  key: Date.now() + Math.random(),
  categoryId: '',
  materialName: '',
  specifications: '',
  quantity: '',
  unit: 'MetricTon',
  targetPricePerUnit: '',
  notes: '',
})

export default function CreateTenderPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()

  const [form, setForm] = useState({
    title: '',
    description: '',
    targetCategoryId: '',
    deliveryGovernorate: '',
    deliveryCity: '',
    deliveryAddress: '',
    requiredDeliveryDateUtc: '',
    closingDateUtc: '',
    referencePrice: '',
    notes: '',
  })

  const [items, setItems] = useState([emptyItem()])
  const [errors, setErrors] = useState({})

  // Fetch categories for dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogService.getCategories?.() || Promise.resolve([]),
    staleTime: 300_000,
  })
  const categories = categoriesData || []

  const createMutation = useMutation({
    mutationFn: (data) => tenderService.create(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['tenders'] })
      toast.success(isAr ? 'تم إنشاء المناقصة بنجاح' : 'Tender created successfully')
      navigate(`/tenders/${result.id}`)
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || err.response?.data?.title || err.message
      toast.error(msg || (isAr ? 'حدث خطأ أثناء إنشاء المناقصة' : 'Failed to create tender'))
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      }
    },
  })

  const handleFieldChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  const handleItemChange = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const addItem = () => setItems((prev) => [...prev, emptyItem()])

  const removeItem = (index) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = isAr ? 'العنوان مطلوب' : 'Title is required'
    if (!form.targetCategoryId) e.targetCategoryId = isAr ? 'القطاع الصناعي مطلوب' : 'Industry Category is required'
    if (!form.deliveryGovernorate.trim()) e.deliveryGovernorate = isAr ? 'المحافظة مطلوبة' : 'Governorate is required'
    if (!form.deliveryCity.trim()) e.deliveryCity = isAr ? 'المدينة مطلوبة' : 'City is required'
    if (!form.deliveryAddress.trim()) e.deliveryAddress = isAr ? 'العنوان مطلوب' : 'Address is required'
    if (!form.closingDateUtc) {
      e.closingDateUtc = isAr ? 'تاريخ الإغلاق مطلوب' : 'Closing date is required'
    } else if (new Date(form.closingDateUtc) <= new Date()) {
      e.closingDateUtc = isAr ? 'يجب أن يكون تاريخ الإغلاق في موعد مستقبلي' : 'Closing date must be in the future'
    }
    
    items.forEach((item, i) => {
      if (!item.materialName.trim()) e[`items[${i}].materialName`] = isAr ? 'اسم المادة مطلوب' : 'Material name is required'
      if (!item.specifications.trim()) e[`items[${i}].specifications`] = isAr ? 'المواصفات مطلوبة' : 'Specifications are required'
      if (!item.quantity || Number(item.quantity) <= 0) e[`items[${i}].quantity`] = isAr ? 'الكمية مطلوبة' : 'Quantity is required'
    })

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      targetCategoryId: form.targetCategoryId || null,
      deliveryGovernorate: form.deliveryGovernorate.trim(),
      deliveryCity: form.deliveryCity.trim(),
      deliveryAddress: form.deliveryAddress.trim(),
      requiredDeliveryDateUtc: form.requiredDeliveryDateUtc
        ? new Date(form.requiredDeliveryDateUtc).toISOString()
        : null,
      closingDateUtc: new Date(form.closingDateUtc).toISOString(),
      referencePrice: form.referencePrice ? Number(form.referencePrice) : null,
      notes: form.notes.trim() || null,
      items: items.map((item) => ({
        categoryId: item.categoryId || form.targetCategoryId,
        materialName: item.materialName.trim(),
        specifications: item.specifications.trim(),
        quantity: Number(item.quantity),
        unit: item.unit,
        targetPricePerUnit: item.targetPricePerUnit ? Number(item.targetPricePerUnit) : null,
        notes: item.notes.trim() || null,
      })),
    }

    createMutation.mutate(payload)
  }

  const BackIcon = isAr ? ArrowRight : ArrowLeft

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          as={Link}
          to="/tenders"
          variant="ghost"
          size="sm"
          icon={<BackIcon size={16} />}
        >
          {isAr ? 'العودة للمناقصات' : 'Back to Tenders'}
        </Button>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <h1 className="text-2xl font-extrabold text-[#06245B] mb-1">
          {isAr ? 'إنشاء مناقصة جديدة' : 'Create New Tender'}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {isAr
            ? 'حدد الأصناف والكميات المطلوبة ليقوم الموردون بتقديم عروض تنافسية في المزايدة العكسية.'
            : 'Define required items and quantities for suppliers to compete through reverse bidding.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <section>
            <h2 className="text-lg font-bold text-[#06245B] mb-4 pb-2 border-b border-slate-100">
              {isAr ? 'المعلومات الأساسية' : 'Basic Information'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label={isAr ? 'عنوان المناقصة *' : 'Tender Title *'}
                  value={form.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  error={errors.title}
                  placeholder={isAr ? 'مثال: توريد 500 طن حديد تسليح B500D' : 'e.g. Supply 500 MT Rebar B500D'}
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label={isAr ? 'الوصف (اختياري)' : 'Description (optional)'}
                  value={form.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={3}
                  placeholder={isAr ? 'وصف تفصيلي للمتطلبات...' : 'Detailed requirements description...'}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#06245B] mb-1.5">
                  {isAr ? 'القطاع / التصنيف الصناعي *' : 'Industry Category *'}
                </label>
                <select
                  value={form.targetCategoryId}
                  onChange={(e) => handleFieldChange('targetCategoryId', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-2xl border ${
                    errors.targetCategoryId ? 'border-red-500' : 'border-slate-200'
                  } text-sm focus:outline-none focus:border-[#1266D6] bg-white text-slate-800`}
                >
                  <option value="">{isAr ? 'اختر القطاع الصناعي...' : 'Select industry category...'}</option>
                  {categories.map?.((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {isAr ? (cat.nameAr || cat.nameEn || cat.name) : (cat.nameEn || cat.nameAr || cat.name)}
                    </option>
                  ))}
                </select>
                {errors.targetCategoryId && (
                  <p className="text-xs text-red-500 mt-1">{errors.targetCategoryId}</p>
                )}
              </div>
              <div>
                <Input
                  label={isAr ? 'السعر المرجعي (اختياري — معلوماتي فقط)' : 'Reference Price (optional — informational)'}
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.referencePrice}
                  onChange={(e) => handleFieldChange('referencePrice', e.target.value)}
                  placeholder="EGP"
                />
              </div>
            </div>
          </section>

          {/* Delivery */}
          <section>
            <h2 className="text-lg font-bold text-[#06245B] mb-4 pb-2 border-b border-slate-100">
              {isAr ? 'بيانات التسليم' : 'Delivery Details'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={isAr ? 'المحافظة *' : 'Governorate *'}
                value={form.deliveryGovernorate}
                onChange={(e) => handleFieldChange('deliveryGovernorate', e.target.value)}
                error={errors.deliveryGovernorate}
                placeholder={isAr ? 'الشرقية' : 'Sharqia'}
              />
              <Input
                label={isAr ? 'المدينة *' : 'City *'}
                value={form.deliveryCity}
                onChange={(e) => handleFieldChange('deliveryCity', e.target.value)}
                error={errors.deliveryCity}
                placeholder={isAr ? 'العاشر من رمضان' : '10th of Ramadan'}
              />
              <Input
                label={isAr ? 'العنوان *' : 'Address *'}
                value={form.deliveryAddress}
                onChange={(e) => handleFieldChange('deliveryAddress', e.target.value)}
                error={errors.deliveryAddress}
              />
              <Input
                label={isAr ? 'تاريخ التسليم المطلوب' : 'Required Delivery Date'}
                type="datetime-local"
                value={form.requiredDeliveryDateUtc}
                onChange={(e) => handleFieldChange('requiredDeliveryDateUtc', e.target.value)}
              />
              <Input
                label={isAr ? 'تاريخ إغلاق المناقصة *' : 'Closing Date *'}
                type="datetime-local"
                min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                value={form.closingDateUtc}
                onChange={(e) => handleFieldChange('closingDateUtc', e.target.value)}
                error={errors.closingDateUtc}
              />
            </div>
          </section>

          {/* Items */}
          <section>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-bold text-[#06245B]">
                {isAr ? 'الأصناف المطلوبة' : 'Required Items'}
              </h2>
              <Button type="button" variant="outline" size="xs" icon={<Plus size={14} />} onClick={addItem}>
                {isAr ? 'إضافة صنف' : 'Add Item'}
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.key} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#06245B]">
                      {isAr ? `الصنف #${index + 1}` : `Item #${index + 1}`}
                    </span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      label={isAr ? 'اسم المادة *' : 'Material Name *'}
                      value={item.materialName}
                      onChange={(e) => handleItemChange(index, 'materialName', e.target.value)}
                      error={errors[`items[${index}].materialName`]}
                      placeholder={isAr ? 'حديد تسليح B500D' : 'Rebar B500D'}
                    />
                    <Input
                      label={isAr ? 'الكمية *' : 'Quantity *'}
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      error={errors[`items[${index}].quantity`]}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-[#06245B] mb-1.5">
                        {isAr ? 'الوحدة' : 'Unit'}
                      </label>
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#1266D6] bg-white"
                      >
                        {MATERIAL_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>{isAr ? u.labelAr : u.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Textarea
                      label={isAr ? 'المواصفات *' : 'Specifications *'}
                      value={item.specifications}
                      onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                      rows={2}
                      error={errors[`items[${index}].specifications`]}
                      placeholder={isAr ? 'المعايير، الأبعاد، الدرجة...' : 'Standards, dimensions, grade...'}
                    />
                    <Input
                      label={isAr ? 'السعر المستهدف / وحدة (اختياري)' : 'Target Price / Unit (optional)'}
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.targetPricePerUnit}
                      onChange={(e) => handleItemChange(index, 'targetPricePerUnit', e.target.value)}
                      placeholder="EGP"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Notes */}
          <Textarea
            label={isAr ? 'ملاحظات عامة (اختياري)' : 'General Notes (optional)'}
            value={form.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            rows={2}
          />

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => navigate('/tenders')}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={<Save size={16} />}
              loading={createMutation.isPending}
            >
              {isAr ? 'إنشاء مناقصة (مسودة)' : 'Create Tender (Draft)'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
