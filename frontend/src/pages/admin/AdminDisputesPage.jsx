import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react'
import { adminDisputeService } from '../../shared/api/services/dealService'
import { formatDate, disputeStatusVariant } from '../../utils/format'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../hooks/useToast'

export default function AdminDisputesPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [resolveAction, setResolveAction] = useState(1) // 1 = ResumeDeal | 2 = CancelDeal
  const [notes, setNotes] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'disputes'],
    queryFn: () => adminDisputeService.getAll(),
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, action, resolutionNotes }) =>
      adminDisputeService.resolve(id, action, resolutionNotes),
    onSuccess: () => {
      toast.success('Dispute resolved successfully')
      setSelectedDispute(null)
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] })
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to resolve dispute'),
  })

  if (isLoading) return <PageSpinner />

  if (error) {
    return (
      <div className="text-center py-12 text-[#EF4444]">
        Failed to load disputes
      </div>
    )
  }

  const disputes = data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#06245B]">Deal Disputes Resolution</h2>
          <p className="text-xs text-[#64748B]">Mediate contractual disputes between buyers and suppliers</p>
        </div>
      </div>

      {disputes.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No Disputes"
          description="There are currently no active disputes on the platform."
        />
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <Card key={d.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#64748B]">Dispute #{d.id?.slice(0, 8)}</span>
                    <Badge variant={disputeStatusVariant(d.status)} dot>{d.status}</Badge>
                  </div>
                  <h3 className="font-semibold text-base text-[#06245B] mt-1">{d.category}</h3>
                  <p className="text-sm text-[#475569] mt-1 max-w-xl leading-relaxed">{d.description}</p>

                  <div className="flex items-center gap-4 text-xs text-[#64748B] mt-3">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Opened {formatDate(d.createdAt)}
                    </span>
                    <span>Deal ID: <span className="font-mono">{d.dealId?.slice(0, 8)}</span></span>
                  </div>
                </div>

                {d.status === 'Open' || d.status === 'UnderReview' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ShieldAlert size={14} />}
                    onClick={() => setSelectedDispute(d)}
                  >
                    Resolve Dispute
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Resolve Dispute Modal */}
      <Modal
        open={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        title="Resolve Commercial Dispute"
      >
        <div className="space-y-4 mb-6">
          <p className="text-sm text-[#475569]">
            Select an administrative action to conclude this dispute:
          </p>

          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC]">
              <input
                type="radio"
                name="resolveAction"
                value={1}
                checked={resolveAction === 1}
                onChange={() => setResolveAction(1)}
                className="mt-1 accent-[#06245B]"
              />
              <div>
                <span className="font-semibold text-sm text-[#06245B] block">Resume Deal</span>
                <span className="text-xs text-[#64748B]">Unfreezes the deal terms and allows fulfillment to proceed.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E2E8F0] cursor-pointer hover:bg-[#F8FAFC]">
              <input
                type="radio"
                name="resolveAction"
                value={2}
                checked={resolveAction === 2}
                onChange={() => setResolveAction(2)}
                className="mt-1 accent-[#EF4444]"
              />
              <div>
                <span className="font-semibold text-sm text-[#EF4444] block">Cancel Deal</span>
                <span className="text-xs text-[#64748B]">Terminates the contractual agreement between both parties.</span>
              </div>
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#475569] block mb-1">Resolution Notes *</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain the mediation findings and reasons for this resolution decision..."
              className="w-full p-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00D9F5]"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setSelectedDispute(null)} disabled={resolveMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!notes.trim()}
            loading={resolveMutation.isPending}
            onClick={() =>
              resolveMutation.mutate({
                id: selectedDispute.id,
                action: resolveAction,
                resolutionNotes: notes,
              })
            }
          >
            Confirm Resolution
          </Button>
        </div>
      </Modal>
    </div>
  )
}
