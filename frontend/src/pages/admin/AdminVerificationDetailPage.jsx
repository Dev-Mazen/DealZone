import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, X, AlertTriangle, Download, FileText } from 'lucide-react'
import { adminService } from '../../shared/api/services/adminService'
import { formatDate } from '../../utils/format'
import Card, { CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { useToast } from '../../hooks/useToast'

export default function AdminVerificationDetailPage() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [modalAction, setModalAction] = useState(null) // 'approve' | 'reject' | 'changes'
  const [reason, setReason] = useState('')

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ['admin', 'verification', companyId],
    queryFn: () => adminService.getCompanyVerificationDetail(companyId),
    enabled: !!companyId,
  })

  const approveMutation = useMutation({
    mutationFn: () => adminService.approveCompany(companyId),
    onSuccess: () => {
      toast.success('Company approved successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] })
      navigate('/admin/verification')
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to approve company'),
  })

  const rejectMutation = useMutation({
    mutationFn: (r) => adminService.rejectCompany(companyId, r),
    onSuccess: () => {
      toast.success('Company rejected')
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] })
      navigate('/admin/verification')
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to reject company'),
  })

  const requestChangesMutation = useMutation({
    mutationFn: (r) => adminService.requestCompanyChanges(companyId, r),
    onSuccess: () => {
      toast.success('Changes requested from company')
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] })
      navigate('/admin/verification')
    },
    onError: (err) => toast.error(err?.problem?.detail || 'Failed to request changes'),
  })

  const handleDownload = async (docId, fileName) => {
    try {
      const blob = await adminService.downloadDocument(companyId, docId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName || 'document'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      toast.error('Failed to download document')
    }
  }

  if (isLoading) return <PageSpinner />
  if (error || !detail) {
    return (
      <div className="text-center py-12">
        <p className="text-[#EF4444] mb-4">Company verification details not found</p>
        <Button variant="outline" onClick={() => navigate('/admin/verification')}>
          Back to Queue
        </Button>
      </div>
    )
  }

  const isMutating = approveMutation.isPending || rejectMutation.isPending || requestChangesMutation.isPending

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate('/admin/verification')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#06245B] transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Verification Queue
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            icon={<X size={15} />}
            onClick={() => { setReason(''); setModalAction('reject') }}
          >
            Reject
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<AlertTriangle size={15} />}
            onClick={() => { setReason(''); setModalAction('changes') }}
          >
            Request Changes
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Check size={15} />}
            onClick={() => setModalAction('approve')}
          >
            Approve Company
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#06245B]">
              {detail.tradeNameEn || detail.tradeNameAr || detail.legalName}
            </h1>
            <p className="text-[#64748B] text-sm mt-0.5">Legal Name: {detail.legalName}</p>
          </div>
          <Badge variant={detail.verificationStatus === 'Approved' ? 'success' : 'warning'} dot>
            {detail.verificationStatus}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-[rgba(6,36,91,0.06)]">
          <div>
            <span className="text-[#64748B] text-xs block mb-0.5">Commercial Registration Number</span>
            <span className="font-medium text-[#1E293B]">{detail.commercialRegistrationNumber || '—'}</span>
          </div>
          <div>
            <span className="text-[#64748B] text-xs block mb-0.5">Tax Identification Number</span>
            <span className="font-medium text-[#1E293B]">{detail.taxIdentificationNumber || '—'}</span>
          </div>
          <div>
            <span className="text-[#64748B] text-xs block mb-0.5">Location</span>
            <span className="font-medium text-[#1E293B]">
              {detail.city ? `${detail.city}, ${detail.governorate}` : '—'}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] text-xs block mb-0.5">Submitted Date</span>
            <span className="font-medium text-[#1E293B]">{formatDate(detail.submittedAt)}</span>
          </div>
        </div>
      </Card>

      {/* Uploaded Verification Documents */}
      <Card>
        <CardHeader
          title={`Verification Documents (${detail.documents?.length || 0})`}
          subtitle="Review uploaded files for legal validation"
        />

        {(!detail.documents || detail.documents.length === 0) ? (
          <p className="text-sm text-[#94A3B8] py-4 text-center">No documents uploaded.</p>
        ) : (
          <div className="space-y-3">
            {detail.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3.5 bg-[#F4F7FB] rounded-xl border border-[rgba(6,36,91,0.06)]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#EAF4FF] text-[#1266D6]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#06245B]">{doc.documentTypeName || doc.fileName}</p>
                    <p className="text-xs text-[#64748B]">{doc.fileName} · Uploaded {formatDate(doc.uploadedAt)}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download size={14} />}
                  onClick={() => handleDownload(doc.id, doc.fileName)}
                >
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Action Modals */}
      <Modal
        open={modalAction === 'approve'}
        onClose={() => setModalAction(null)}
        title="Approve Company"
      >
        <p className="text-sm text-[#475569] mb-6">
          Are you sure you want to approve this company? It will receive verified status and become eligible to perform commercial activities on DealZone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setModalAction(null)} disabled={isMutating}>
            Cancel
          </Button>
          <Button variant="primary" loading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>
            Confirm Approval
          </Button>
        </div>
      </Modal>

      <Modal
        open={modalAction === 'reject'}
        onClose={() => setModalAction(null)}
        title="Reject Company"
      >
        <div className="space-y-4 mb-6">
          <p className="text-sm text-[#475569]">
            Please enter a reason for rejection. This will be visible to the company owner.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Reason for rejection..."
            className="w-full p-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00D9F5]"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setModalAction(null)} disabled={isMutating}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={!reason.trim()}
            loading={rejectMutation.isPending}
            onClick={() => rejectMutation.mutate(reason)}
          >
            Reject Company
          </Button>
        </div>
      </Modal>

      <Modal
        open={modalAction === 'changes'}
        onClose={() => setModalAction(null)}
        title="Request Changes"
      >
        <div className="space-y-4 mb-6">
          <p className="text-sm text-[#475569]">
            Describe what changes or additional documents are required from the company.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g., Please upload an updated Commercial Register certificate from this year..."
            className="w-full p-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00D9F5]"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setModalAction(null)} disabled={isMutating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!reason.trim()}
            loading={requestChangesMutation.isPending}
            onClick={() => requestChangesMutation.mutate(reason)}
          >
            Submit Request
          </Button>
        </div>
      </Modal>
    </div>
  )
}
