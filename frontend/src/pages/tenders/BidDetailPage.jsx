import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Gavel,
  Calendar,
  Clock,
  Building2,
  DollarSign,
  Truck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
} from 'lucide-react'
import { tenderService } from '../../shared/api/services/tenderService'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import { PageSpinner } from '../../components/ui/Spinner'
import { useToast } from '../../hooks/useToast'
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatQuantity,
  bidStatusVariant,
} from '../../utils/format'

const bidStatusLabel = (status, isAr) => ({
  Submitted: isAr ? 'مقدم' : 'Submitted',
  UnderReview: isAr ? 'قيد المراجعة' : 'Under Review',
  Accepted: isAr ? 'مقبول' : 'Accepted',
  Rejected: isAr ? 'مرفوض' : 'Rejected',
  Withdrawn: isAr ? 'تم السحب' : 'Withdrawn',
  Superseded: isAr ? 'محدث (ملغي)' : 'Superseded',
}[status] || status)

export default function BidDetailPage() {
  const { bidId } = useParams()
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const qc = useQueryClient()
  const toast = useToast()

  const [showReviseModal, setShowReviseModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')

  // Revision Form state
  const [reviseForm, setReviseForm] = useState({
    validityDateUtc: '',
    deliveryLeadTimeDays: '',
    shippingIncluded: false,
    paymentTerms: '',
    notes: '',
    changeSummary: '',
    items: [],
  })

  const { data: bid, isLoading } = useQuery({
    queryKey: ['bids', bidId],
    queryFn: () => tenderService.getBid(bidId),
    enabled: !!bidId,
  })

  const reviseMutation = useMutation({
    mutationFn: (data) => tenderService.reviseBid(bidId, data),
    onSuccess: (newBid) => {
      qc.invalidateQueries({ queryKey: ['bids'] })
      qc.invalidateQueries({ queryKey: ['tenders'] })
      setShowReviseModal(false)
      toast.success(isAr ? 'تم إرسال العرض المعدل بنجاح' : 'Bid revised successfully')
      if (newBid?.id) {
        navigate(`/tenders/bids/${newBid.id}`)
      }
    },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.title || (isAr ? 'خطأ أثناء تعديل العرض' : 'Error revising bid')),
  })

  const withdrawMutation = useMutation({
    mutationFn: () => tenderService.withdrawBid(bidId, withdrawReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bids'] })
      qc.invalidateQueries({ queryKey: ['tenders'] })
      setShowWithdrawModal(false)
      toast.success(isAr ? 'تم سحب العرض' : 'Bid withdrawn')
    },
    onError: (e) => toast.error(e.response?.data?.detail || e.response?.data?.title || (isAr ? 'خطأ أثناء سحب العرض' : 'Error withdrawing bid')),
  })

  const initReviseModal = () => {
    if (!bid) return
    setReviseForm({
      validityDateUtc: bid.validityDateUtc ? bid.validityDateUtc.substring(0, 16) : '',
      deliveryLeadTimeDays: bid.deliveryLeadTimeDays || '',
      shippingIncluded: !!bid.shippingIncluded,
      paymentTerms: bid.paymentTerms || '',
      notes: bid.notes || '',
      changeSummary: '',
      items: (bid.items || []).map((item) => ({
        tenderItemId: item.tenderItemId,
        materialName: item.materialName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        notes: item.notes || '',
      })),
    })
    setShowReviseModal(true)
  }

  const handleReviseSubmit = () => {
    if (!reviseForm.validityDateUtc) {
      toast.error(isAr ? 'تاريخ سريان العرض مطلوب' : 'Validity date is required')
      return
    }
    const payload = {
      validityDateUtc: new Date(reviseForm.validityDateUtc).toISOString(),
      deliveryLeadTimeDays: Number(reviseForm.deliveryLeadTimeDays),
      shippingIncluded: Boolean(reviseForm.shippingIncluded),
      paymentTerms: reviseForm.paymentTerms.trim(),
      notes: reviseForm.notes?.trim() || null,
      changeSummary: reviseForm.changeSummary?.trim() || null,
      items: reviseForm.items.map((i) => ({
        tenderItemId: i.tenderItemId,
        unitPrice: Number(i.unitPrice),
        notes: i.notes?.trim() || null,
      })),
    }
    reviseMutation.mutate(payload)
  }

  if (isLoading) return <PageSpinner />
  if (!bid) {
    return (
      <div className="text-center py-12 text-slate-500">
        {isAr ? 'العرض غير موجود' : 'Bid not found'}
      </div>
    )
  }

  const canReviseOrWithdraw = bid.status === 'Submitted' || bid.status === 'UnderReview'
  const BackIcon = isAr ? ArrowRight : ArrowLeft

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Button
          as={Link}
          to={`/tenders/${bid.tenderId}`}
          variant="ghost"
          size="sm"
          icon={<BackIcon size={16} />}
        >
          {isAr ? 'العودة للمناقصة' : 'Back to Tender'}
        </Button>
      </div>

      {/* Bid Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="text-xs font-mono text-slate-400">{bid.bidNumber}</span>
              <Badge variant={bidStatusVariant(bid.status)} size="md">
                {bidStatusLabel(bid.status, isAr)}
              </Badge>
              {bid.isLowest && (
                <Badge variant="success" size="sm">
                  {isAr ? 'أدنى سعر مسجل' : 'Lowest Bid'}
                </Badge>
              )}
              {bid.revisionNumber > 1 && (
                <Badge variant="navy" size="sm">
                  {isAr ? `تعديل رقم ${bid.revisionNumber}` : `Rev #${bid.revisionNumber}`}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-[#06245B] mb-1">
              {bid.tenderTitle}
            </h1>
            <p className="text-sm font-mono text-slate-500 mb-4">
              {bid.tenderNumber}
            </p>

            {/* Total and key metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <DollarSign size={16} className="text-[#1266D6]" />
                <span>
                  {isAr ? 'إجمالي العرض: ' : 'Total: '}
                  <strong className="text-base text-[#06245B]">
                    {formatCurrency(bid.totalAmount)}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Building2 size={16} className="text-slate-400" />
                <span>{bid.supplierCompanyName || (isAr ? 'المورد' : 'Supplier')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Truck size={16} className="text-[#1266D6]" />
                <span>
                  {isAr ? 'مدة التوريد: ' : 'Lead Time: '}
                  <strong>{bid.deliveryLeadTimeDays} {isAr ? 'يوم' : 'days'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock size={16} className="text-amber-600" />
                <span>
                  {isAr ? 'صلاحية العرض: ' : 'Validity: '}
                  <strong>{formatDateTime(bid.validityDateUtc)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>
                  {isAr ? 'تاريخ التقديم: ' : 'Submitted: '}
                  {formatDate(bid.submittedAtUtc)}
                </span>
              </div>
            </div>

            {/* Additional info badges */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                {isAr ? 'الشحن: ' : 'Shipping: '}
                {bid.shippingIncluded
                  ? isAr ? 'مشمول بالسعر' : 'Included'
                  : isAr ? 'غير مشمول' : 'Not Included'}
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                {isAr ? 'شروط السداد: ' : 'Payment Terms: '}
                {bid.paymentTerms}
              </span>
            </div>

            {bid.changeSummary && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <strong>{isAr ? 'ملخص التعديل: ' : 'Change Summary: '}</strong>
                {bid.changeSummary}
              </div>
            )}

            {bid.withdrawalReason && (
              <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">
                <strong>{isAr ? 'سبب السحب: ' : 'Withdrawal Reason: '}</strong>
                {bid.withdrawalReason}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {canReviseOrWithdraw && (
            <div className="flex sm:flex-col gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                icon={<RotateCcw size={14} />}
                onClick={initReviseModal}
              >
                {isAr ? 'تعديل العرض (تخفيض)' : 'Revise Bid (Lower)'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="!text-red-500 hover:!bg-red-50"
                icon={<XCircle size={14} />}
                onClick={() => setShowWithdrawModal(true)}
              >
                {isAr ? 'سحب العرض' : 'Withdraw Bid'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bid Items */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <h2 className="text-lg font-bold text-[#06245B] mb-4">
          {isAr ? 'بنود العرض والأسعار' : 'Bid Items & Pricing'} ({bid.items?.length || 0})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="text-start py-3 px-2">#</th>
                <th className="text-start py-3 px-2">{isAr ? 'المادة' : 'Material'}</th>
                <th className="text-end py-3 px-2">{isAr ? 'الكمية' : 'Qty'}</th>
                <th className="text-start py-3 px-2">{isAr ? 'الوحدة' : 'Unit'}</th>
                <th className="text-end py-3 px-2">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                <th className="text-end py-3 px-2">{isAr ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {bid.items?.map((item, i) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-2 text-slate-400">{i + 1}</td>
                  <td className="py-3 px-2 font-semibold text-[#06245B]">{item.materialName}</td>
                  <td className="py-3 px-2 text-end font-mono">{formatQuantity(item.quantity)}</td>
                  <td className="py-3 px-2">{item.unit}</td>
                  <td className="py-3 px-2 text-end font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3 px-2 text-end font-bold text-[#06245B] font-mono">
                    {formatCurrency(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-bold text-base text-[#06245B]">
                <td colSpan={5} className="py-4 px-2 text-end">
                  {isAr ? 'المجموع الكلي:' : 'Total Amount:'}
                </td>
                <td className="py-4 px-2 text-end text-[#1266D6] font-mono">
                  {formatCurrency(bid.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Revise Bid Modal */}
      <Modal
        open={showReviseModal}
        onClose={() => setShowReviseModal(false)}
        title={isAr ? 'تعديل العرض (مزايدة عكسية)' : 'Revise Bid (Reverse Auction)'}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            {isAr
              ? 'ملاحظة: في المزايدة العكسية، يجب أن يكون إجمالي العرض الجديد أقل من العرض المنافس الأدنى، ولا يمكن رفع السعر.'
              : 'Note: In reverse bidding, the revised total must be lower than the competing lowest bid.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={isAr ? 'صلاحية العرض *' : 'Validity Date *'}
              type="datetime-local"
              value={reviseForm.validityDateUtc}
              onChange={(e) => setReviseForm((f) => ({ ...f, validityDateUtc: e.target.value }))}
            />
            <Input
              label={isAr ? 'مدة التسليم (أيام) *' : 'Delivery Lead Time (days) *'}
              type="number"
              min="1"
              value={reviseForm.deliveryLeadTimeDays}
              onChange={(e) => setReviseForm((f) => ({ ...f, deliveryLeadTimeDays: e.target.value }))}
            />
            <Input
              label={isAr ? 'شروط الدفع *' : 'Payment Terms *'}
              value={reviseForm.paymentTerms}
              onChange={(e) => setReviseForm((f) => ({ ...f, paymentTerms: e.target.value }))}
            />
            <label className="flex items-center gap-2 self-end pb-2.5">
              <input
                type="checkbox"
                checked={reviseForm.shippingIncluded}
                onChange={(e) => setReviseForm((f) => ({ ...f, shippingIncluded: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-[#1266D6]"
              />
              <span className="text-sm font-semibold text-[#06245B]">
                {isAr ? 'الشحن مشمول' : 'Shipping Included'}
              </span>
            </label>
          </div>

          <Textarea
            label={isAr ? 'سبب أو ملخص التعديل (اختياري)' : 'Change Summary (optional)'}
            value={reviseForm.changeSummary}
            onChange={(e) => setReviseForm((f) => ({ ...f, changeSummary: e.target.value }))}
            rows={2}
          />

          {/* Reverse Bidding Guideline Callout */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
            <strong>{isAr ? 'قاعدة المزايدة العكسية: ' : 'Reverse Bidding Rule: '}</strong>
            {isAr
              ? 'يجب أن يكون إجمالي العرض المعدل أقل من عرضك السابق ومن أدنى عرض منافس نشط في المناقصة.'
              : 'Your revised bid total must be strictly lower than your previous bid and lower than the lowest competing bid.'}
          </div>

          {/* Item Prices */}
          <h3 className="text-sm font-bold text-[#06245B] pt-2 border-t border-slate-100">
            {isAr ? 'أسعار الأصناف الجديدة' : 'Revised Item Prices'}
          </h3>
          {reviseForm.items.map((item, i) => (
            <div key={item.tenderItemId} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#06245B]">{item.materialName}</span>
                <span className="text-xs text-slate-500">{formatQuantity(item.quantity)} {item.unit}</span>
              </div>
              <Input
                label={isAr ? 'سعر الوحدة (ج.م) *' : 'Unit Price (EGP) *'}
                type="number"
                step="0.01"
                min="0.01"
                value={item.unitPrice}
                onChange={(e) => {
                  const val = e.target.value
                  setReviseForm((f) => ({
                    ...f,
                    items: f.items.map((it, idx) => (idx === i ? { ...it, unitPrice: val } : it)),
                  }))
                }}
              />
            </div>
          ))}

          {/* New total preview */}
          {reviseForm.items.every((i) => i.unitPrice) && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
              <span className="text-sm text-[#1266D6] font-bold">
                {isAr ? 'الإجمالي الجديد المحسوب: ' : 'New Calculated Total: '}
              </span>
              <strong className="text-lg text-[#06245B]">
                {formatCurrency(
                  reviseForm.items.reduce(
                    (sum, i) => sum + Number(i.unitPrice || 0) * Number(i.quantity || 0),
                    0
                  )
                )}
              </strong>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowReviseModal(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              loading={reviseMutation.isPending}
              onClick={handleReviseSubmit}
            >
              {isAr ? 'تأكيد وإرسال التعديل' : 'Submit Revision'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title={isAr ? 'تأكيد سحب العرض' : 'Confirm Bid Withdrawal'}
      >
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 mb-3 flex items-center gap-2">
          <AlertTriangle size={16} />
          {isAr
            ? 'سحب العرض نهائي ولا يمكن التراجع عنه. يمكنك تقديم عرض جديد إذا كانت المناقصة مفتوحة.'
            : 'Withdrawal is irreversible. You may submit a new bid while the tender is open.'}
        </div>
        <Textarea
          label={isAr ? 'سبب السحب *' : 'Withdrawal Reason *'}
          value={withdrawReason}
          onChange={(e) => setWithdrawReason(e.target.value)}
          rows={3}
          placeholder={isAr ? 'اذكر سبب سحب العرض...' : 'Reason for withdrawing...'}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setShowWithdrawModal(false)}>
            {isAr ? 'تراجع' : 'Back'}
          </Button>
          <Button
            variant="error"
            loading={withdrawMutation.isPending}
            disabled={!withdrawReason.trim()}
            onClick={() => withdrawMutation.mutate()}
          >
            {isAr ? 'تأكيد السحب' : 'Confirm Withdrawal'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
