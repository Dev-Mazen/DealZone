import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { offerService } from '../../shared/api/services/offerService'
import { useTranslation } from '../../hooks/useTranslation'
import { useToast } from '../../hooks/useToast'
import { formatDate, formatCurrency } from '../../utils/format'
import { Card, CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import { PageSpinner } from '../../components/ui/Spinner'
import { reviseOfferSchema as reviseSchema } from '../../shared/validation/contracts.js'

export default function ReviseOfferPage() {
  const { offerId } = useParams()
  const navigate = useNavigate()
  const { language } = useTranslation()
  const toast = useToast()

  const { data: offer, isLoading } = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => offerService.get(offerId),
    enabled: !!offerId,
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviseSchema),
    values: offer
      ? {
          deliveryLeadTimeDays: offer.deliveryLeadTimeDays,
          shippingIncluded: offer.shippingIncluded,
          paymentTerms: offer.paymentTerms,
          validityDateUtc: offer.validityDateUtc?.split('T')[0] ?? '',
          changeSummary: '',
          notes: offer.notes ?? '',
          items: offer.items?.map((it) => ({
            rfqItemId: it.rfqItemId,
            unitPrice: it.unitPrice,
            offeredQuantity: it.offeredQuantity,
            notes: it.notes ?? '',
          })) ?? [],
        }
      : undefined,
  })

  const { fields } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  const reviseMutation = useMutation({
    mutationFn: (data) =>
      offerService.revise(offerId, {
        deliveryLeadTimeDays: Number(data.deliveryLeadTimeDays),
        shippingIncluded: Boolean(data.shippingIncluded),
        paymentTerms: data.paymentTerms,
        validityDateUtc: new Date(data.validityDateUtc).toISOString(),
        changeSummary: data.changeSummary,
        notes: data.notes || undefined,
        items: data.items.map((it) => ({
          rfqItemId: it.rfqItemId,
          unitPrice: Number(it.unitPrice),
          offeredQuantity: Number(it.offeredQuantity),
          notes: it.notes || undefined,
        })),
      }),
    onSuccess: (newOffer) => {
      toast.success('Offer revised successfully!')
      navigate(`/offers/${newOffer.id}/revisions`)
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || 'Failed to revise offer')
    },
  })

  if (isLoading) return <PageSpinner />

  if (!offer) {
    return <div className="text-center py-16 text-[#64748B]">Offer not found.</div>
  }

  if (!['Submitted', 'UnderReview'].includes(offer.status)) {
    return (
      <div className="text-center py-16">
        <p className="text-[#64748B]">This offer cannot be revised (Status: {offer.status}).</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/offers')}>
          Back to Offers
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/offers')}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#06245B] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to My Offers
      </button>

      <div>
        <h1 className="text-2xl font-bold text-[#06245B]">Revise Offer</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Original offer submitted {formatDate(offer.submittedAt, language)}
        </p>
      </div>

      {/* Current offer summary */}
      <Card>
        <CardHeader title="Current Offer Summary" />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[#64748B]">Lead time</p>
            <p className="font-medium text-[#06245B]">{offer.deliveryLeadTimeDays} days</p>
          </div>
          <div>
            <p className="text-[#64748B]">Valid until</p>
            <p className="font-medium text-[#06245B]">{formatDate(offer.validityDateUtc, language)}</p>
          </div>
          <div>
            <p className="text-[#64748B]">Payment terms</p>
            <p className="font-medium text-[#06245B]">{offer.paymentTerms}</p>
          </div>
          <div>
            <p className="text-[#64748B]">Shipping</p>
            <p className="font-medium text-[#06245B]">{offer.shippingIncluded ? 'Included' : 'Not included'}</p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit((data) => reviseMutation.mutate(data))} className="space-y-6">
        {/* Pricing per item */}
        <Card>
          <CardHeader title="Revised Item Pricing" subtitle="Update line item unit prices if needed" />
          <div className="space-y-4">
            {fields.map((field, idx) => {
              const offerItem = offer.items?.[idx]
              return (
                <div key={field.id} className="p-4 bg-[#F4F7FB] rounded-xl">
                  <input type="hidden" {...register(`items.${idx}.rfqItemId`)} value={offerItem?.rfqItemId} />
                  <input type="hidden" {...register(`items.${idx}.offeredQuantity`)} value={offerItem?.offeredQuantity || 1} />
                  <p className="text-sm font-semibold text-[#06245B] mb-3">
                    {offerItem?.rfqItemMaterialName || `Item ${idx + 1}`}
                    <span className="text-[#64748B] font-normal ms-2">
                      ({offerItem?.offeredQuantity} units)
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      {...register(`items.${idx}.unitPrice`)}
                      type="number"
                      step="0.01"
                      label="Unit Price (EGP)"
                      placeholder="0.00"
                      error={errors.items?.[idx]?.unitPrice?.message}
                      required
                    />
                    <Input
                      {...register(`items.${idx}.notes`)}
                      label="Notes (optional)"
                      placeholder="Notes for revised item"
                    />
                  </div>
                  {watchedItems?.[idx]?.unitPrice > 0 && offerItem?.offeredQuantity > 0 && (
                    <p className="text-xs text-[#1266D6] mt-2">
                      Line total: {formatCurrency(watchedItems[idx].unitPrice * offerItem.offeredQuantity, language)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Revised Terms" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                {...register('deliveryLeadTimeDays')}
                type="number"
                label="Delivery Lead Time (days)"
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
              error={errors.paymentTerms?.message}
              required
            />

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                {...register('shippingIncluded')}
                type="checkbox"
                className="w-4 h-4 rounded accent-[#06245B]"
              />
              <span className="text-sm font-medium text-[#1E293B]">Shipping cost included</span>
            </label>

            <Textarea
              {...register('notes')}
              label="Additional Notes (optional)"
              rows={3}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Change Summary"
            subtitle="Explain what changed and why"
          />
          <Textarea
            {...register('changeSummary')}
            label="Describe the changes"
            placeholder="e.g. Reduced lead time from 14 to 7 days due to stock availability; updated payment terms."
            rows={4}
            error={errors.changeSummary?.message}
            required
          />
        </Card>

        {/* Total Summary */}
        <div className="bg-[#EAF4FF] border border-[#1266D6]/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#64748B] uppercase font-semibold tracking-wider">
              {language === 'ar' ? 'إجمالي العرض بعد التعديل' : 'Revised Total Offer Value'}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">
              {fields.length} {language === 'ar' ? 'بنود مشمولة' : 'line items covered'}
            </p>
          </div>
          <p className="text-2xl font-bold text-[#06245B]">
            {formatCurrency(
              watchedItems?.reduce((sum, it, idx) => {
                const qty = Number(it?.offeredQuantity || offer?.items?.[idx]?.offeredQuantity || 0)
                const price = Number(it?.unitPrice || 0)
                return sum + (qty * price)
              }, 0) || 0,
              language
            )}
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate('/offers')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={reviseMutation.isPending}>
            Submit Revision
          </Button>
        </div>
      </form>
    </div>
  )
}

