import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Clock } from 'lucide-react'
import { offerService } from '../../shared/api/services/offerService'
import { useTranslation } from '../../hooks/useTranslation'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import { formatCurrency, formatDateTime } from '../../utils/format'

const statusVariant = {
  Submitted: 'info', UnderReview: 'warning', Accepted: 'success',
  Rejected: 'error', Superseded: 'navy', Withdrawn: 'navy', Expired: 'error',
}

export default function OfferRevisionsPage() {
  const { offerId } = useParams()
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()

  const { data: revisions, isLoading } = useQuery({
    queryKey: ['offers', offerId, 'revisions'],
    queryFn: () => offerService.getRevisions(offerId),
    enabled: !!offerId,
  })

  const { data: offer } = useQuery({
    queryKey: ['offers', offerId],
    queryFn: () => offerService.get(offerId),
    enabled: !!offerId,
  })

  if (isLoading) return <PageSpinner />

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-[#EAF4FF] text-[#64748B] hover:text-[#06245B] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#06245B]">
            {isAr ? 'سجل مراجعات العرض' : 'Offer Revision History'}
          </h1>
          {offer && (
            <p className="text-sm text-[#64748B] mt-0.5">
              {offer.rfqTitle} · {offer.supplierCompanyName}
            </p>
          )}
        </div>
      </div>

      {!revisions || revisions.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-[#64748B]">
            {isAr ? 'لا توجد مراجعات بعد' : 'No revisions yet'}
          </div>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute start-5 top-5 bottom-5 w-px bg-[rgba(6,36,91,0.1)]" />

          <div className="space-y-4">
            {[...revisions].reverse().map((rev, i) => {
              const isLatest = i === 0
              return (
                <div key={rev.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                    isLatest ? 'bg-[#06245B] text-white' : 'bg-white border-2 border-[rgba(6,36,91,0.2)] text-[#64748B]'
                  }`}>
                    {isLatest ? <Clock size={18} /> : <span className="text-xs font-bold">{rev.revisionNumber}</span>}
                  </div>

                  <Card className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#06245B]">
                            {isAr ? `المراجعة ${rev.revisionNumber}` : `Revision ${rev.revisionNumber}`}
                          </span>
                          {isLatest && (
                            <span className="text-xs bg-[#EAF4FF] text-[#1266D6] px-2 py-0.5 rounded font-medium">
                              {isAr ? 'الحالية' : 'Current'}
                            </span>
                          )}
                          <span className="text-xs font-mono text-[#64748B]">{rev.offerNumber}</span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">{formatDateTime(rev.submittedAtUtc)}</p>
                      </div>
                      <Badge variant={statusVariant[rev.status]}>
                        {rev.status.replace(/([A-Z])/g, ' $1').trim()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-[#94A3B8] text-xs">{isAr ? 'المبلغ' : 'Total'}</p>
                        <p className="font-bold text-[#06245B]">{formatCurrency(rev.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[#94A3B8] text-xs">{isAr ? 'مهلة التسليم' : 'Lead Time'}</p>
                        <p className="font-medium text-[#1E293B]">{rev.deliveryLeadTimeDays}d</p>
                      </div>
                      <div>
                        <p className="text-[#94A3B8] text-xs">{isAr ? 'الشحن' : 'Shipping'}</p>
                        <p className="font-medium text-[#1E293B]">
                          {rev.shippingIncluded ? (isAr ? 'مشمول' : 'Included') : (isAr ? 'غير مشمول' : 'Excluded')}
                        </p>
                      </div>
                    </div>

                    {rev.changeSummary && (
                      <div className="mt-3 pt-3 border-t border-[rgba(6,36,91,0.06)]">
                        <p className="text-xs text-[#64748B] mb-1">{isAr ? 'ملخص التغييرات:' : 'Change Summary:'}</p>
                        <p className="text-sm text-[#475569]">{rev.changeSummary}</p>
                      </div>
                    )}
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
