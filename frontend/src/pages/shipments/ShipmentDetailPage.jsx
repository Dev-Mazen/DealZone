import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Truck, Package, MapPin, Clock } from 'lucide-react'
import { shipmentService } from '../../shared/api/services/dealService'
import { useTranslation } from '../../hooks/useTranslation'
import { formatDate, formatDateTime, shipmentStatusVariant } from '../../utils/format'
import Badge from '../../components/ui/Badge'
import { Card, CardHeader } from '../../components/ui/Card'
import { PageSpinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

export default function ShipmentDetailPage() {
  const { shipmentId } = useParams()
  const navigate = useNavigate()
  const { language } = useTranslation()

  const { data: shipment, isLoading } = useQuery({
    queryKey: ['shipment', shipmentId],
    queryFn: () => shipmentService.get(shipmentId),
    enabled: !!shipmentId,
  })

  if (isLoading) return <PageSpinner />

  if (!shipment) {
    return (
      <EmptyState
        icon={Truck}
        title="Shipment Not Found"
        description="This shipment does not exist or you don't have access."
      />
    )
  }

  const statusVariant = shipmentStatusVariant(shipment.status)
  const isSupplierArranged = (shipment.arrangement || shipment.arrangementType) === 'SupplierArranged'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#06245B] transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#06245B]">
            Shipment #{shipment.shipmentNumber || shipment.id?.slice(0, 8).toUpperCase()}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={statusVariant} dot>{shipment.status}</Badge>
            <span className="text-sm text-[#64748B]">
              {isSupplierArranged ? '🚚 Supplier Arranged' : '🏢 DealZone Arranged'}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Tracking Information" />
          <div className="space-y-3 text-sm">
            {shipment.trackingNumber ? (
              <>
                <div className="flex items-center gap-2 text-[#06245B]">
                  <Package size={16} />
                  <span className="font-mono font-semibold">{shipment.trackingNumber}</span>
                </div>
                {shipment.carrierName && (
                  <div className="text-[#64748B]">
                    <span className="font-medium">Carrier:</span> {shipment.carrierName}
                  </div>
                )}
              </>
            ) : (
              <p className="text-[#94A3B8]">No tracking number assigned yet</p>
            )}

            {shipment.estimatedDeliveryDateUtc && (
              <div className="flex items-center gap-2 text-[#64748B]">
                <Clock size={14} />
                <span>Est. delivery: {formatDate(shipment.estimatedDeliveryDateUtc, language)}</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Shipment Details" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Created</span>
              <span className="text-[#06245B] font-medium">
                {formatDate(shipment.createdAtUtc || shipment.createdAt, language)}
              </span>
            </div>
            {(shipment.shippingProviderName || shipment.shippingProvider) && (
              <div className="flex justify-between">
                <span className="text-[#64748B]">Provider</span>
                <span className="text-[#06245B] font-medium">
                  {shipment.shippingProviderName || shipment.shippingProvider?.name}
                </span>
              </div>
            )}
            {shipment.notes && (
              <div className="mt-3 pt-3 border-t border-[rgba(6,36,91,0.06)]">
                <p className="text-[#64748B] text-xs mb-1">Notes</p>
                <p className="text-[#475569]">{shipment.notes}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tracking events timeline */}
      {shipment.trackingEvents?.length > 0 && (
        <Card>
          <CardHeader title="Tracking History" />
          <div className="space-y-0">
            {shipment.trackingEvents.map((event, idx) => (
              <div key={event.id ?? idx} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-[#06245B] mt-1 shrink-0" />
                  {idx < shipment.trackingEvents.length - 1 && (
                    <div className="w-px flex-1 bg-[rgba(6,36,91,0.12)] my-1" />
                  )}
                </div>

                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#06245B]">{event.status}</span>
                    {event.location && (
                      <span className="flex items-center gap-1 text-xs text-[#64748B]">
                        <MapPin size={12} />
                        {event.location}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-[#475569] mt-0.5">{event.description}</p>
                  )}
                  <p className="text-xs text-[#94A3B8] mt-1">
                    {formatDateTime(event.timestampUtc || event.recordedAt, language)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

