import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { X, Handshake, AlertCircle } from 'lucide-react'
import { negotiationService } from '../../shared/api/services/negotiationService'
import { useTranslation } from '../../hooks/useTranslation'
import { useToast } from '../../hooks/useToast'
import Button from '../ui/Button'
import Alert from '../ui/Alert'

export default function NegotiationOfferModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}) {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [proposedQuantity, setProposedQuantity] = useState(product?.minimumOrderQuantity || 10)
  const [proposedUnitPrice, setProposedUnitPrice] = useState(product?.unitPrice || 1000)
  const [currency] = useState(product?.currency || 'EGP')
  const [targetDeliveryDate, setTargetDeliveryDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + (product?.deliveryLeadTimeDays || 14))
    return d.toISOString().split('T')[0]
  })
  const [deliveryLocation, setDeliveryLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  if (!isOpen || !product) return null

  const prodName = isAr ? product.nameAr : (product.nameEn || product.nameAr)
  const unit = product.unit || 'ton'
  const moq = product.minimumOrderQuantity || 1
  const numQty = Number(proposedQuantity) || 0
  const numPrice = Number(proposedUnitPrice) || 0
  const total = numQty * numPrice

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (numQty < moq) {
      setErrorMsg(
        isAr
          ? `الحد الأدنى للكمية هو ${moq} ${unit}`
          : `Minimum order quantity is ${moq} ${unit}`
      )
      return
    }

    if (numPrice <= 0) {
      setErrorMsg(
        isAr
          ? 'يرجى تحديد سعر وحدة صحيح أكبر من الصفر'
          : 'Please specify a valid unit price greater than 0'
      )
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const payload = {
        catalogProductId: product.id,
        proposedUnitPrice: numPrice,
        quantity: numQty,
        deliveryLeadTimeDays: product?.deliveryLeadTimeDays || 7,
        deliveryAddress: deliveryLocation.trim() || undefined,
        notes: notes.trim() || undefined,
      }

      const res = await negotiationService.create(payload)
      queryClient.invalidateQueries({ queryKey: ['negotiations'] })

      toast.success(
        isAr
          ? 'تم تقديم عرض السعر التفاوضي بنجاح!'
          : 'Negotiation offer submitted successfully!'
      )
      onClose()

      if (onSuccess) {
        onSuccess(res.id)
      } else {
        navigate(`/negotiations/${res.id}`)
      }
    } catch (err) {
      const detail =
        err?.problem?.detail ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        (isAr ? 'فشل في إرسال العرض' : 'Failed to submit negotiation offer')
      setErrorMsg(detail)
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-[#06245B]/65 backdrop-blur-md overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#06245B] via-[#0A3078] to-[#1266D6] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Handshake size={20} className="text-[#00D9F5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isAr ? 'تقديم عرض تفاوض على السعر' : 'Make a Price Negotiation Offer'}
              </h2>
              <p className="text-xs text-slate-200">
                {isAr ? 'إرسال مقترح سعر وكمية إلى المورد مباشرة' : 'Submit structured price terms directly to supplier'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* Product summary card */}
            <div className="p-3.5 bg-[#EAF4FF]/60 rounded-2xl border border-[#1266D6]/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#1266D6] bg-white px-2 py-0.5 rounded-full border border-blue-200">
                  {isAr ? product.categoryNameAr : (product.categoryNameEn || 'Category')}
                </span>
                <h4 className="font-extrabold text-[#06245B] text-sm mt-1">{prodName}</h4>
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? 'المورد:' : 'Supplier:'} {product.supplierCompanyName}
                </p>
              </div>
              <div className="text-end">
                {product.unitPrice != null ? (
                  <>
                    <span className="text-[11px] text-slate-400 block">{isAr ? 'السعر المعلن:' : 'Listed Price:'}</span>
                    <span className="text-sm font-bold text-[#06245B]">
                      {product.unitPrice.toLocaleString()} {currency} / {unit}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    {isAr ? 'سعر قابل للتفاوض' : 'Negotiable'}
                  </span>
                )}
              </div>
            </div>

            {errorMsg && (
              <Alert variant="danger" title={isAr ? 'خطأ' : 'Error'}>
                {errorMsg}
              </Alert>
            )}

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#06245B] mb-1.5">
                  {isAr ? 'الكمية المقترحة' : 'Proposed Quantity'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={moq}
                    step="any"
                    value={proposedQuantity}
                    onChange={(e) => setProposedQuantity(e.target.value)}
                    className="w-full h-11 px-3.5 pe-16 rounded-xl border border-slate-300 focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/20 font-bold text-slate-800 text-sm"
                    required
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {unit}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {isAr ? `الحد الأدنى للطلب (MOQ): ${moq} ${unit}` : `MOQ: ${moq} ${unit}`}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#06245B] mb-1.5">
                  {isAr ? 'سعر الوحدة المقترح' : 'Proposed Unit Price'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={proposedUnitPrice}
                    onChange={(e) => setProposedUnitPrice(e.target.value)}
                    className="w-full h-11 px-3.5 pe-16 rounded-xl border border-slate-300 focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/20 font-bold text-slate-800 text-sm"
                    required
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {currency}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#06245B] mb-1.5">
                  {isAr ? 'تاريخ الاستلام المستهدف' : 'Target Delivery Date'}
                </label>
                <input
                  type="date"
                  value={targetDeliveryDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTargetDeliveryDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#1266D6] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#06245B] mb-1.5">
                  {isAr ? 'موقع التسليم / المدينة الصناعية' : 'Delivery Location'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'مثال: العاشر من رمضان' : 'e.g. 10th of Ramadan'}
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#1266D6] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#06245B] mb-1.5">
                {isAr ? 'ملاحظات أو شروط إضافية للمورد' : 'Notes or Conditions'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isAr ? 'مثال: شروط الدفع، متطلبات التعبئة...' : 'e.g., payment conditions, packing specifications...'}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#1266D6] text-xs resize-none"
              />
            </div>

            {/* Calculations total */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-sm font-bold text-[#06245B]">
              <span>{isAr ? 'إجمالي قيمة العرض المقترح:' : 'Total Proposed Offer Value:'}</span>
              <span className="text-base text-[#1266D6]">
                {total.toLocaleString()} {currency}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
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
              loading={isSubmitting}
              icon={<Handshake size={16} />}
            >
              {isSubmitting
                ? (isAr ? 'جاري الإرسال...' : 'Submitting...')
                : (isAr ? 'إرسال العرض للمورد' : 'Submit Offer to Supplier')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return modalContent
  return createPortal(modalContent, document.body)
}

