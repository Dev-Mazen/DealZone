import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Truck, Phone, Mail, Trash2 } from 'lucide-react'
import { adminService } from '../../shared/api/services/adminService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../hooks/useToast'

export default function AdminShippingPage() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProvider, setNewProvider] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    supportedGovernorates: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'shipping-providers'],
    queryFn: () => adminService.getShippingProviders(),
  })

  const createMutation = useMutation({
    mutationFn: (payload) => adminService.createShippingProvider(payload),
    onSuccess: () => {
      toast.success('Shipping provider registered')
      setShowAddModal(false)
      setNewProvider({ name: '', contactPerson: '', phone: '', email: '', supportedGovernorates: '' })
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-providers'] })
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to create provider'),
  })

  const activateMutation = useMutation({
    mutationFn: (id) => adminService.activateShippingProvider(id),
    onSuccess: () => {
      toast.success('Provider activated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-providers'] })
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id) => adminService.deactivateShippingProvider(id),
    onSuccess: () => {
      toast.success('Provider deactivated')
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-providers'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteShippingProvider(id),
    onSuccess: () => {
      toast.success('Provider removed')
      queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-providers'] })
    },
  })

  if (isLoading) return <PageSpinner />

  const providers = data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#06245B]">DealZone Shipping Partners</h2>
          <p className="text-xs text-[#64748B]">Manage integrated logistics and delivery service providers</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => setShowAddModal(true)}
        >
          Add Provider
        </Button>
      </div>

      {providers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No Shipping Providers"
          description="Register certified freight and logistics partners to handle shipments."
          action={
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              Add First Provider
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAF4FF] flex items-center justify-center text-[#1266D6]">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-[#06245B]">{p.name}</h3>
                    <p className="text-xs text-[#64748B]">{p.contactPerson || 'Logistics Team'}</p>
                  </div>
                </div>
                <Badge variant={p.isActive ? 'success' : 'gray'} dot>
                  {p.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-[#64748B] mt-4 pt-3 border-t border-[rgba(6,36,91,0.06)]">
                {p.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-[#94A3B8]" />
                    <span>{p.phone}</span>
                  </div>
                )}
                {p.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-[#94A3B8]" />
                    <span>{p.email}</span>
                  </div>
                )}
                {p.supportedGovernorates && (
                  <div className="text-[11px] text-[#64748B] truncate mt-1">
                    Coverage: {p.supportedGovernorates}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[rgba(6,36,91,0.06)]">
                {p.isActive ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deactivateMutation.mutate(p.id)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => activateMutation.mutate(p.id)}
                  >
                    Activate
                  </Button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Remove provider "${p.name}"?`)) {
                      deleteMutation.mutate(p.id)
                    }
                  }}
                  className="p-2 text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Provider Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Shipping Provider">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(newProvider)
          }}
          className="space-y-4"
        >
          <Input
            label="Provider Name"
            placeholder="e.g. Nile Logistics Freight"
            value={newProvider.name}
            onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
            required
          />
          <Input
            label="Contact Person *"
            placeholder="Account Representative Name"
            value={newProvider.contactPerson}
            onChange={(e) => setNewProvider({ ...newProvider, contactPerson: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone *"
              placeholder="+20 1..."
              value={newProvider.phone}
              onChange={(e) => setNewProvider({ ...newProvider, phone: e.target.value })}
              required
            />
            <Input
              label="Email *"
              type="email"
              placeholder="ops@nilefreight.eg"
              value={newProvider.email}
              onChange={(e) => setNewProvider({ ...newProvider, email: e.target.value })}
              required
            />
          </div>
          <Input
            label="Supported Governorates (optional)"
            placeholder="e.g. Cairo, Giza, Alexandria, Sharqia (or leave empty for All)"
            value={newProvider.supportedGovernorates}
            onChange={(e) => setNewProvider({ ...newProvider, supportedGovernorates: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createMutation.isPending}>
              Add Provider
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
