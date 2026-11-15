import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { X, Package, Building2 } from 'lucide-react'
import { catalogService } from '../../shared/api/services/catalogService'
import { useTranslation } from '../../hooks/useTranslation'
import { useToast } from '../../hooks/useToast'
import Button from '../ui/Button'
import Alert from '../ui/Alert'
import { NumberField } from '../ui/FormControls'

const VAT_RATE = 0.14

const inputClass =
  'w-full h-11 px-3.5 rounded-xl border border-slate-300 focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/20 text-slate-800 text-sm transition-all disabled:bg-slate-50'

export default function DirectPurchaseModal({ isOpen, onClose, product, material, onSuccess }) {
  // Normalize all possible incoming shapes into a single consistent object.
  // Callers may pass `product=` or `material=` with varying field names.
  const normalizeProduct = (raw) => {
    if (!raw) return null
    return {
      id: raw.catalogProductId ?? raw.id,
      nameAr: raw.nameAr ?? raw.name ?? '',
      nameEn: raw.nameEn ?? raw.name ?? '',
      categoryNameAr: raw.categoryNameAr ?? '',
      categoryNameEn: raw.categoryNameEn ?? '',
      code: raw.code ?? '',
      standard: raw.standard ?? '',
      unit: raw.defaultUnitName ?? raw.unit ?? '',
      supplierCompanyName: raw.supplierCompanyName ?? '',
      unitPrice: raw.unitPrice ?? raw.indicativePrice ?? 0,
      minimumOrderQuantity: raw.minimumOrderQuantity ?? raw.minOrderQty ?? 1,
    }
  }
  const currentProduct = normalizeProduct(product || material)

  // All hooks first, early return after
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  // quantity is kept as a string so the user can clear / retype it freely.
  // It's validated on submit, not on every keystroke.
  const [quantity, setQuantity] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  // Reset whenever the modal opens or the product changes
  useEffect(() => {
    if (isOpen && currentProduct) {
      const initialQty = currentProduct.minimumOrderQuantity ?? 1
      setQuantity(String(initialQty))
      setDeliveryAddress('')
      setNotes('')
      setErrorMsg(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentProduct?.id])

  // Close on Escape + lock background scroll while open
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen || !currentProduct) return null

  const matName = isAr
    ? (currentProduct.nameAr || currentProduct.nameEn)
    : (currentProduct.nameEn || currentProduct.nameAr)
  const catName = isAr
    ? (currentProduct.categoryNameAr || currentProduct.categoryNameEn)
    : (currentProduct.categoryNameEn || currentProduct.categoryNameAr)
  const unitName = currentProduct.unit || (isAr ? 'طن متري' : 'Metric Ton')
  const supplierName = currentProduct.supplierCompanyName || ''

  const minOrderQty = currentProduct.minimumOrderQuantity ?? 1
  const unitPrice = currentProduct.unitPrice ?? 0
  const hasValidPrice = unitPrice > 0

  // Estimates only — the server computes the authoritative amounts
  const numericQty = Number(quantity) || 0
  const subtotal = numericQty * unitPrice
  const vat = Math.round(subtotal * VAT_RATE)
  const total = subtotal + vat

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (numericQty < minOrderQty) {
      setErrorMsg(
        isAr
          ? `الحد الأدنى للطلب هو ${minOrderQty} ${unitName}.`
          : `Minimum order is ${minOrderQty} ${unitName}.`
      )
      return
    }
    if (!deliveryAddress.trim()) {
      setErrorMsg(isAr ? 'اكتب عنوان التسليم.' : 'Enter the delivery address.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const clientRequestId =
        typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}`

      const response = await catalogService.directPurchaseProduct({
        catalogProductId: currentProduct.id,
        quantity: numericQty,
        deliveryAddress: deliveryAddress.trim(),
        notes: notes.trim() || undefined,
        clientRequestId,
      })
      const dealId = response?.dealId

      queryClient.invalidateQueries({ queryKey: ['deals'] })
      toast.success(
        isAr
          ? 'تم إرسال أمر الشراء. جاري تحويلك للصفقة.'
          : 'Order placed. Taking you to the deal.'
      )
      onClose()
      if (onSuccess) onSuccess(dealId)
      else navigate(dealId ? `/deals/${dealId}` : '/deals')
    } catch (err) {
      const detail =
        err?.problem?.detail || err?.response?.data?.detail || err?.response?.data?.title || err?.message
      setErrorMsg(
        detail ||
          (isAr
            ? 'تعذّر إرسال أمر الشراء. راجع البيانات وحاول مرة أخرى.'
            : 'Could not place the order. Check the details and try again.')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-[#06245B]/65 backdrop-blur-md"
      dir={isAr ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#06245B] via-[#0A3078] to-[#1266D6] text-white flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold">{isAr ? 'شراء مباشر' : 'Direct purchase'}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-50"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Material summary */}
            <div className="p-4 rounded-2xl bg-[#EAF4FF]/70 border border-[#1266D6]/20 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-extrabold text-[#06245B] text-base">{matName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {[catName, currentProduct?.code, currentProduct?.standard].filter(Boolean).join(' • ')}
                </p>
                {supplierName && (
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-2">
                    <Building2 size={12} />
                    {supplierName}
                  </p>
                )}
              </div>
              <div className="text-end shrink-0">
                <div className="text-base font-extrabold text-[#06245B]">
                  {hasValidPrice ? `${unitPrice.toLocaleString()} EGP` : '—'}
                </div>
                <div className="text-xs text-slate-400">/ {unitName}</div>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="dp-qty" className="block text-xs font-bold text-[#06245B] mb-1.5">
                {isAr ? 'الكمية' : 'Quantity'} <span className="text-red-500">*</span>
              </label>
              <NumberField
                id="dp-qty"
                value={quantity}
                onChange={(val) => setQuantity(val)}
                min={minOrderQty}
                step={1}
                decimals={2}
                suffix={unitName}
                disabled={isSubmitting}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr ? `الحد الأدنى: ${minOrderQty} ${unitName}` : `Minimum: ${minOrderQty} ${unitName}`}
              </p>
            </div>

            {/* Delivery address — single free-text field, works for any factory/site */}
            <div>
              <label htmlFor="dp-address" className="block text-xs font-bold text-[#06245B] mb-1.5">
                {isAr ? 'عنوان التسليم' : 'Delivery address'} <span className="text-red-500">*</span>
              </label>
              <input
                id="dp-address"
                type="text"
                autoComplete="street-address"
                placeholder={
                  isAr
                    ? 'المحافظة، المدينة، الشارع أو بوابة المصنع'
                    : 'Governorate, city, street or factory gate'
                }
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                disabled={isSubmitting}
                className={inputClass}
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="dp-notes" className="block text-xs font-bold text-[#06245B] mb-1.5">
                {isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
              </label>
              <textarea
                id="dp-notes"
                rows={2}
                placeholder={
                  isAr
                    ? 'شهادات جودة، مواعيد التفريغ، متطلبات الفحص...'
                    : 'Test certificates, offloading hours, inspection needs...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#1266D6] focus:ring-2 focus:ring-[#1266D6]/20 text-slate-800 text-sm transition-all resize-none"
              />
            </div>

            {/* Estimate */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              {hasValidPrice ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? 'قيمة البضاعة' : 'Subtotal'}</span>
                    <span className="font-semibold">{subtotal.toLocaleString()} EGP</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? 'ضريبة القيمة المضافة (14%)' : 'VAT (14%)'}</span>
                    <span className="font-semibold">{vat.toLocaleString()} EGP</span>
                  </div>
                  <div className="pt-2 mt-1 border-t border-slate-200 flex justify-between items-center font-bold text-[#06245B]">
                    <span>{isAr ? 'الإجمالي التقديري' : 'Estimated total'}</span>
                    <span className="text-base text-[#1266D6]">{total.toLocaleString()} EGP</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1">
                    {isAr
                      ? 'الأرقام تقديرية، والحساب النهائي يتم على الخادم.'
                      : 'Estimates only. The final amount is calculated by the server.'}
                  </p>
                </>
              ) : (
                <p className="text-center py-1 text-amber-700 font-bold">
                  {isAr
                    ? 'السعر عند الطلب. الشراء المباشر غير متاح، اطلب عرض سعر بدلاً منه.'
                    : 'Price on request. Direct purchase is unavailable — request a quote instead.'}
                </p>
              )}
            </div>
          </div>

          {/* Footer — error lives here so it's always visible, even when the body is scrolled */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 space-y-3 shrink-0">
            {errorMsg && (
              <Alert variant="danger">
                <p className="text-xs" role="alert">
                  {errorMsg}
                </p>
              </Alert>
            )}
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!hasValidPrice}
                loading={isSubmitting}
                icon={<Package size={16} />}
              >
                {isAr ? 'تأكيد الشراء' : 'Confirm purchase'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return modalContent
  return createPortal(modalContent, document.body)
}