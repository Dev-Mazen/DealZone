import { useState, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Package,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Building2,
  FileText,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react'
import { catalogService } from '../../shared/api/services/catalogService'
import { useTranslation } from '../../hooks/useTranslation'
import { useToast } from '../../hooks/useToast'
import { getLocalizedField } from '../../utils/format'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Alert from '../ui/Alert'
import Spinner from '../ui/Spinner'

const EGYPTIAN_INDUSTRIAL_ZONES = [
  { id: '10th-ramadan', ar: 'العاشر من رمضان — المنطقة الصناعية B1-B4', en: '10th of Ramadan — Industrial Zone B1-B4' },
  { id: '6th-october', ar: 'السادس من أكتوبر — المنطقة الصناعية الأولى - السادسة', en: '6th of October — Industrial Zones 1-6' },
  { id: 'sadat-city', ar: 'مدينة السادات الصناعية — المنوفية', en: 'Sadat City Industrial Zone — Menofia' },
  { id: 'borg-el-arab', ar: 'برج العرب الجديدة — الإسكندرية', en: 'New Borg El Arab — Alexandria' },
  { id: 'al-obour', ar: 'العبور — المنطقة الصناعية أ و ب', en: 'Al Obour — Industrial Zone A & B' },
  { id: 'badr-city', ar: 'مدينة بدر — منطقة الروبيكي ومصانع بدر', en: 'Badr City — Roubiki & Badr Industrial' },
  { id: 'amreya-alex', ar: 'العامرية ومرغم الصناعية — الإسكندرية', en: 'Amreya & Merghem Industrial — Alexandria' },
  { id: 'helwan-tebbin', ar: 'حلوان والتبين — الصناعات الثقيلة', en: 'Helwan & El Tebbin — Heavy Industry Zone' },
  { id: 'quesna', ar: 'قويسنا الصناعية — المنوفية', en: 'Quesna Industrial Zone — Menofia' },
  { id: 'new-damietta', ar: 'دمياط الجديدة — المنطقة الصناعية وميناء دمياط', en: 'New Damietta — Industrial & Port Zone' },
  { id: 'suez-sczone', ar: 'المنطقة الاقتصادية لقناة السويس (SCZONE) — العين السخنة', en: 'Suez Canal Economic Zone (SCZONE) — Ain Sokhna' },
]

export default function DirectPurchaseModal({
  isOpen,
  onClose,
  material,
  onSuccess,
}) {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const toast = useToast()

  if (!isOpen || !material) return null

  const matName = getLocalizedField(material, 'name', language)
  const catName = getLocalizedField(material, 'categoryName', language)
  const unitName = getLocalizedField(material, 'defaultUnitName', language) || (isAr ? 'طن متري' : 'Metric Ton')
  const unitCode = material.defaultUnitCode || 'ton'

  const minOrderQty = material.minOrderQty || 10
  const unitPrice = material.indicativePrice || 35000

  // 7 days ahead as default delivery
  const defaultDeliveryDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  }

  const [quantity, setQuantity] = useState(minOrderQty)
  const [industrialZone, setIndustrialZone] = useState(EGYPTIAN_INDUSTRIAL_ZONES[0].ar)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [targetDeliveryDate, setTargetDeliveryDate] = useState(defaultDeliveryDate)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [serverEndpointUnavailable, setServerEndpointUnavailable] = useState(false)

  // Calculations
  const numericQty = Number(quantity) || 0
  const subtotal = numericQty * unitPrice
  const vat = Math.round(subtotal * 0.14)
  const total = subtotal + vat

  const handleQuantityChange = (val) => {
    const num = Math.max(1, Number(val) || 1)
    setQuantity(num)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (numericQty < minOrderQty) {
      setErrorMsg(
        isAr
          ? `الحد الأدنى للطلب المباشر لهذه المادة هو ${minOrderQty} ${unitName}.`
          : `Minimum direct order quantity is ${minOrderQty} ${unitName}.`
      )
      return
    }

    if (!deliveryAddress.trim()) {
      setErrorMsg(
        isAr
          ? 'يرجى إدخال عنوان موقع التسليم بالتفصيل أو بوابة المصنع.'
          : 'Please enter detailed delivery site address or factory gate.'
      )
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    setServerEndpointUnavailable(false)

    const payload = {
      materialId: material.id,
      materialCode: material.code,
      quantity: numericQty,
      unitCode: unitCode,
      unitPrice,
      subtotal,
      vat,
      total,
      currency: 'EGP',
      deliveryIndustrialZone: industrialZone,
      deliveryAddress: deliveryAddress.trim(),
      targetDeliveryDate,
      specialInstructions: specialInstructions.trim() || undefined,
    }

    try {
      const response = await catalogService.directPurchase(material.id, payload)
      toast.success(
        isAr
          ? 'تم تسجيل طلب الشراء المباشر بنجاح! جاري تحويلك للصفقات.'
          : 'Direct purchase order placed successfully! Redirecting to deals.'
      )
      onClose()
      if (onSuccess) {
        onSuccess(response?.id || response?.dealId)
      } else {
        navigate(response?.dealId ? `/deals/${response.dealId}` : '/deals')
      }
    } catch (err) {
      console.warn('Direct purchase API call result:', err)
      const status = err?.response?.status || err?.status
      const detail =
        err?.problem?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.title ||
        err?.message

      if (status === 404 || status === 501 || status === 405) {
        setServerEndpointUnavailable(true)
        setErrorMsg(
          isAr
            ? `خدمة الشراء المباشر التلقائي من الكتالوج قيد الربط البرمجي على خادم المنصة (HTTP ${status}: ${err?.config?.url || '/catalog/materials/{id}/purchase'}). يمكنك تحويل الطلب فوراً إلى طلب عرض سعر (RFQ) معتمد بنفس البيانات.`
            : `Direct catalog purchase backend API endpoint is currently being finalized (HTTP ${status}: ${err?.config?.url || '/catalog/materials/{id}/purchase'}). You can instantly convert this order into an official RFQ with the exact same parameters.`
        )
      } else {
        setErrorMsg(
          detail ||
            (isAr
              ? 'حدث خطأ أثناء معالجة طلب الشراء. يرجى المحاولة مرة أخرى.'
              : 'Failed to submit direct purchase. Please try again.')
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConvertToRfq = () => {
    onClose()
    navigate('/rfqs/create', {
      state: {
        prefilledMaterial: {
          materialId: material.id,
          materialName: matName,
          materialCode: material.code,
          quantity: numericQty,
          unit: unitCode,
          industrialZone,
          deliveryAddress,
          targetDeliveryDate,
        },
      },
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      dir={isAr ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#06245B] via-[#0A3078] to-[#1266D6] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Package size={20} className="text-[#00D9F5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isAr ? 'شراء مباشر من الكتالوج' : 'Direct Catalog Purchase'}
              </h2>
              <p className="text-xs text-slate-200">
                {isAr ? 'إصدار أمر توريد صناعي فوري ومباشر' : 'Issue direct industrial raw material supply order'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Material Identity Card */}
          <div className="p-4 rounded-2xl bg-[#EAF4FF]/70 border border-[#1266D6]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-[#1266D6] bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                {catName || 'Industrial'}
              </span>
              <h3 className="font-extrabold text-[#06245B] text-base mt-1.5">{matName}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {material.code} {material.standard ? `• ${material.standard}` : ''}
              </p>
            </div>
            <div className="text-start sm:text-end shrink-0">
              <span className="text-[11px] text-slate-500 block">
                {isAr ? 'السعر الإرشادي للوحدة:' : 'Benchmark Unit Price:'}
              </span>
              <span className="text-base font-extrabold text-[#06245B]">
                {unitPrice.toLocaleString()} EGP
              </span>
              <span className="text-xs text-slate-400 block font-mono">
                / {unitName}
              </span>
            </div>
          </div>

          {/* Validation or API Alert */}
          {errorMsg && (
            <Alert
              variant={serverEndpointUnavailable ? 'warning' : 'danger'}
              title={
                serverEndpointUnavailable
                  ? (isAr ? 'عقد الخدمة البرمجية قيد الاكتمال' : 'Backend Service Contract Pending')
                  : (isAr ? 'تنبيه التحقق' : 'Validation Error')
              }
            >
              <div className="space-y-2 text-xs">
                <p>{errorMsg}</p>
                {serverEndpointUnavailable && (
                  <button
                    type="button"
                    onClick={handleConvertToRfq}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-[#06245B] text-white hover:bg-[#1266D6] transition-colors"
                  >
                    <span>{isAr ? 'تحويل فوري إلى طلب عرض أسعار (RFQ)' : 'Convert to Official RFQ'}</span>
                    {isAr ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                  </button>
                )}
              </div>
            </Alert>
          )}

          {/* Quantity & Unit Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#06245B] mb-1.5">
                {isAr ? 'الكمية المطلوبة' : 'Required Quantity'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={minOrderQty}
                  step={1}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-11 px-3.5 pe-24 rounded-xl border border-slate-300 focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/20 font-bold text-slate-800 text-base transition-all"
                  required
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                  {unitName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr
                  ? `الحد الأدنى للطلب (MOQ): ${minOrderQty} ${unitName}`
                  : `Minimum order quantity (MOQ): ${minOrderQty} ${unitName}`}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#06245B] mb-1.5">
                {isAr ? 'تاريخ التوريد المستهدف' : 'Target Delivery Date'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={targetDeliveryDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTargetDeliveryDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/20 text-slate-800 text-sm transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Location & Egyptian Industrial Zone */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#06245B] mb-1.5 flex items-center gap-1.5">
                <MapPin size={14} className="text-[#1266D6]" />
                <span>{isAr ? 'المنطقة الصناعية (مصر)' : 'Industrial Zone (Egypt)'}</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={industrialZone}
                onChange={(e) => setIndustrialZone(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/20 text-slate-800 text-sm transition-all bg-white"
                required
              >
                {EGYPTIAN_INDUSTRIAL_ZONES.map((zone) => (
                  <option key={zone.id} value={isAr ? zone.ar : zone.en}>
                    {isAr ? zone.ar : zone.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#06245B] mb-1.5">
                {isAr ? 'عنوان موقع التسليم / بوابة المصنع' : 'Delivery Address / Factory Gate'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={
                  isAr
                    ? 'مثال: القطعة 42، المنطقة الصناعية الثالثة، أمام مجمع الصناعات الهندسية'
                    : 'e.g., Plot 42, 3rd Industrial Zone, Factory Gate 2'
                }
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                disabled={isSubmitting}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/20 text-slate-800 text-sm transition-all"
                required
              />
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-xs font-bold text-[#06245B] mb-1.5">
              {isAr ? 'ملاحظات فنية أو شروط الاستلام (اختياري)' : 'Technical Notes or Inspection Terms (Optional)'}
            </label>
            <textarea
              rows={2}
              placeholder={
                isAr
                  ? 'أي شهادات جودة مطلوبة، مواعيد تفريغ الشاحنات، أو متطلبات الفحص المعملي...'
                  : 'Required mill test certificates, offloading hours, or sampling requirements...'
              }
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/20 text-slate-800 text-xs transition-all resize-none"
            />
          </div>

          {/* Price Breakdown Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>
                {isAr ? 'قيمة البضاعة التقديرية:' : 'Estimated Material Cost:'}
              </span>
              <span className="font-semibold">{subtotal.toLocaleString()} EGP</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{isAr ? 'ضريبة القيمة المضافة (14%):' : 'Estimated VAT (14%):'}</span>
              <span className="font-semibold">{vat.toLocaleString()} EGP</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-[#06245B]">
              <span>{isAr ? 'إجمالي أمر الشراء التقديري:' : 'Total Estimated Order Value:'}</span>
              <span className="text-base text-[#1266D6]">{total.toLocaleString()} EGP</span>
            </div>
            <p className="text-[10px] text-slate-400 pt-1 leading-normal">
              {isAr
                ? 'ملاحظة: السعر استرشادي يخضع لتأكيد التوريد التجاري. لا يتطلب هذا الإجراء الدفع الإلكتروني المباشر.'
                : 'Note: Prevailing benchmark pricing. Does not require online credit processing.'}
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              icon={isSubmitting ? <Spinner size="sm" /> : <Package size={16} />}
            >
              {isSubmitting
                ? (isAr ? 'جاري إرسال أمر الشراء...' : 'Submitting Order...')
                : (isAr ? 'تأكيد أمر الشراء المباشر' : 'Confirm Direct Purchase')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

