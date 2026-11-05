import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { rfqService } from '../../shared/api/services/rfqService'
import { offerService } from '../../shared/api/services/offerService'
import { catalogService } from '../../shared/api/services/catalogService'
import { useTranslation } from '../../hooks/useTranslation'
import { useToast } from '../../hooks/useToast'
import { usePermissions } from '../../hooks/usePermissions'
import { formatCurrency } from '../../utils/format'
import { Card, CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import { PageSpinner } from '../../components/ui/Spinner'
import { offerSchema } from '../../shared/validation/contracts.js'

export default function SubmitOfferPage() {
  const { rfqId } = useParams()
  const navigate = useNavigate()
  const { language } = useTranslation()
  const toast = useToast()
  const { canSubmitOffers } = usePermissions()

  const { data: rfq, isLoading: rfqLoading } = useQuery({
    queryKey: ['rfq', rfqId],
    queryFn: () => rfqService.get(rfqId),
    enabled: !!rfqId,
  })

  const { data: units } = useQuery({
    queryKey: ['catalog', 'units'],
    queryFn: catalogService.getUnits,
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      deliveryLeadTimeDays: 7,
      shippingIncluded: false,
      paymentTerms: '',
      validityDateUtc: '',
      notes: '',
      items: [],
    },
  })

  useEffect(() => {
    if (rfq?.items?.length) {
      reset({
        deliveryLeadTimeDays: 7,
        shippingIncluded: false,
        paymentTerms: '',
        validityDateUtc: '',
        notes: '',
        items: rfq.items.map((item) => ({
          rfqItemId: item.id,
          unitPrice: item.targetPricePerUnit || '',
          offeredQuantity: item.quantity,
          notes: '',
        })),
      })
    }
  }, [rfq, reset])

  const { fields } = useFieldArray({ control, name: 'items' })

  const submitMutation = useMutation({
    mutationFn: (data) => offerService.create(rfqId, data),
    onSuccess: () => {
      toast.success('Offer submitted successfully!')
      navigate(`/rfqs/${rfqId}`)
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || 'Failed to submit offer')
    },
  })

  const watchedItems = watch('items')

  if (!canSubmitOffers) {
    return (
      <div className="text-center py-16 text-[#EF4444]">
        You don't have permission to submit offers.
      </div>
    )
  }

  if (rfqLoading) return <PageSpinner />

  if (!rfq) {
    return <div className="text-center py-16 text-[#64748B]">RFQ not found.</div>
  }

  if (rfq.status !== 'Published') {
    return (
      <div className="text-center py-16">
        <p className="text-[#64748B]">This RFQ is not accepting offers (Status: {rfq.status}).</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(`/rfqs/${rfqId}`)}>
          Back to RFQ
        </Button>
      </div>
    )
  }

  const unitMap = {}
  units?.forEach((u) => { unitMap[u.id] = u })

  const onSubmit = (data) => {
    const payload = {
      deliveryLeadTimeDays: Number(data.deliveryLeadTimeDays),
      shippingIncluded: Boolean(data.shippingIncluded),
      paymentTerms: data.paymentTerms,
      validityDateUtc: new Date(data.validityDateUtc).toISOString(),
      notes: data.notes || undefined,
      items: data.items.map((it, idx) => ({
        rfqItemId: it.rfqItemId || rfq?.items?.[idx]?.id,
        unitPrice: Number(it.unitPrice),
        offeredQuantity: Number(it.offeredQuantity || rfq?.items?.[idx]?.quantity || 1),
        notes: it.notes || undefined,
      })),
    }
    submitMutation.mutate(payload)
  }

  const totalOfferedAmount = watchedItems?.reduce((sum, it, idx) => {
    const qty = Number(it?.offeredQuantity || rfq?.items?.[idx]?.quantity || 0)
    const price = Number(it?.unitPrice || 0)
    return sum + (qty * price)
  }, 0) || 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(`/rfqs/${rfqId}`)}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#06245B] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to RFQ
      </button>

      <div>
        <h1 className="text-2xl font-bold text-[#06245B]">Submit Offer</h1>
        <p className="text-sm text-[#64748B] mt-1">
          RFQ #{rfq.rfqNumber} — {rfq.deliveryGovernorate}
        </p>
      </div>

      {/* RFQ items summary */}
      <Card>
        <CardHeader title="RFQ Line Items" subtitle="Your offer must cover all items" />
        <div className="space-y-2">
          {rfq.items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-[rgba(6,36,91,0.06)] last:border-0">
              <div>
                <p className="text-sm font-medium text-[#06245B]">{item.materialNameEn || item.materialCode}</p>
                <p className="text-xs text-[#64748B]">
                  Qty: {item.quantity} {unitMap[item.unitOfMeasureId]?.symbol ?? ''}
                </p>
              </div>
              {item.targetUnitPrice && (
                <span className="text-xs text-[#64748B]">
                  Target: {formatCurrency(item.targetUnitPrice, language)}
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Pricing per item */}
        <Card>
          <CardHeader title="Your Pricing" />
          <div className="space-y-4">
            {fields.map((field, idx) => {
              const rfqItem = rfq.items?.[idx]
              const unit = unitMap[rfqItem?.unitOfMeasureId]
              return (
                <div key={field.id} className="p-4 bg-[#F4F7FB] rounded-xl">
                  <input type="hidden" {...register(`items.${idx}.rfqItemId`)} value={rfqItem?.id} />
                  <input type="hidden" {...register(`items.${idx}.offeredQuantity`)} value={rfqItem?.quantity || 1} />
                  <p className="text-sm font-semibold text-[#06245B] mb-3">
                    {rfqItem?.materialNameEn || rfqItem?.materialCode}
                    <span className="text-[#64748B] font-normal ms-2">
                      ({rfqItem?.quantity} {unit?.symbol})
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      {...register(`items.${idx}.unitPrice`)}
                      type="number"
                      step="0.01"
                      label={`Unit Price (EGP/${unit?.symbol ?? 'unit'})`}
                      placeholder="0.00"
                      error={errors.items?.[idx]?.unitPrice?.message}
                      required
                    />
                    <Input
                      {...register(`items.${idx}.notes`)}
                      label="Notes (optional)"
                      placeholder="Any notes for this item"
                    />
                  </div>
                  {watchedItems?.[idx]?.unitPrice > 0 && rfqItem?.quantity > 0 && (
                    <p className="text-xs text-[#1266D6] mt-2">
                      Line total: {formatCurrency(watchedItems[idx].unitPrice * rfqItem.quantity, language)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Commercial terms */}
        <Card>
          <CardHeader title="Commercial Terms" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                {...register('deliveryLeadTimeDays')}
                type="number"
                label="Delivery Lead Time (days)"
                placeholder="7"
                error={errors.deliveryLeadTimeDays?.message}
                required
              />
              <Input
                {...register('validityDateUtc')}
                type="date"
                label="Offer Valid Until"
                error={errors.validityDateUtc?.message}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <Input
              {...register('paymentTerms')}
              label="Payment Terms"
              placeholder="e.g. 30% upfront, 70% on delivery"
              error={errors.paymentTerms?.message}
              required
            />

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                {...register('shippingIncluded')}
                type="checkbox"
                className="w-4 h-4 rounded accent-[#06245B]"
              />
              <span className="text-sm font-medium text-[#1E293B]">
                Shipping cost included in price
              </span>
            </label>

            <Textarea
              {...register('notes')}
              label="Additional Notes (optional)"
              placeholder="Any additional information about your offer…"
              rows={3}
            />
          </div>
        </Card>

        {/* Total Summary */}
        <div className="bg-[#EAF4FF] border border-[#1266D6]/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#64748B] uppercase font-semibold tracking-wider">
              {language === 'ar' ? 'إجمالي قيمة العرض' : 'Total Offer Value'}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">
              {fields.length} {language === 'ar' ? 'بنود مشمولة' : 'line items covered'}
            </p>
          </div>
          <p className="text-2xl font-bold text-[#06245B]">
            {formatCurrency(totalOfferedAmount, language)}
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`/rfqs/${rfqId}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitMutation.isPending}
          >
            Submit Offer
          </Button>
        </div>
      </form>
    </div>
  )
}

