import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Download,
  FileText,
  Building2,
  Calendar,
  History,
  ShieldCheck,
} from 'lucide-react'
import { adminService } from '../../shared/api/services/adminService'
import { formatDate } from '../../utils/format'
import { useTranslation } from '../../hooks/useTranslation'
import Card, { CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { PageSpinner } from '../../components/ui/Spinner'
import { useToast } from '../../hooks/useToast'

const docTypeLabels = {
  CommercialRegister: { en: 'Commercial Registration (السجل التجاري)', ar: 'السجل التجاري' },
  TaxCard: { en: 'Tax Card (البطاقة الضريبية)', ar: 'البطاقة الضريبية' },
  IndustrialRegister: { en: 'Industrial Register', ar: 'السجل الصناعي' },
  QualityCertificate: { en: 'Quality Certificate', ar: 'شهادة الجودة' },
  Other: { en: 'Other Document', ar: 'وثيقة أخرى' },
}

const statusVariants = {
  Pending: 'warning',
  UnderReview: 'info',
  Approved: 'success',
  Rejected: 'error',
  ChangesRequired: 'warning',
}

export default function AdminVerificationDetailPage() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const toast = useToast()
  const queryClient = useQueryClient()

  const [modalAction, setModalAction] = useState(null) // 'approve' | 'reject' | 'changes'
  const [reason, setReason] = useState('')
  const [downloadingDocId, setDownloadingDocId] = useState(null)

  const {
    data: detail,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'verification', companyId],
    queryFn: () => adminService.getCompanyVerificationDetail(companyId),
    enabled: !!companyId,
  })

  const approveMutation = useMutation({
    mutationFn: () => adminService.approveCompany(companyId),
    onSuccess: () => {
      toast.success(isAr ? 'تم اعتماد وتوثيق الشركة بنجاح!' : 'Company approved successfully!')
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] })
      navigate('/admin/verification')
    },
    onError: (err) =>
      toast.error(
        err?.problem?.detail ||
          err?.message ||
          (isAr ? 'فشل اعتماد الشركة' : 'Failed to approve company'),
      ),
  })

  const rejectMutation = useMutation({
    mutationFn: (r) => adminService.rejectCompany(companyId, r),
    onSuccess: () => {
      toast.success(isAr ? 'تم رفض طلب التوثيق' : 'Company verification rejected')
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] })
      navigate('/admin/verification')
    },
    onError: (err) =>
      toast.error(
        err?.problem?.detail ||
          err?.message ||
          (isAr ? 'فشل رفض الطلب' : 'Failed to reject company'),
      ),
  })

  const requestChangesMutation = useMutation({
    mutationFn: (r) => adminService.requestCompanyChanges(companyId, r),
    onSuccess: () => {
      toast.success(isAr ? 'تم إرسال طلب التعديل للشركة' : 'Changes requested from company')
      queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] })
      navigate('/admin/verification')
    },
    onError: (err) =>
      toast.error(
        err?.problem?.detail ||
          err?.message ||
          (isAr ? 'فشل إرسال طلب التعديل' : 'Failed to request changes'),
      ),
  })

  const handleDownload = async (docId, fileName) => {
    setDownloadingDocId(docId)
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
      toast.error(isAr ? 'فشل تحميل الملف' : 'Failed to download document')
    } finally {
      setDownloadingDocId(null)
    }
  }

  if (isLoading) return <PageSpinner />

  if (error || !detail) {
    return (
      <div className="text-center py-12">
        <p className="text-[#EF4444] mb-4 font-semibold">
          {error?.problem?.detail ||
            (isAr ? 'لم يتم العثور على بيانات توثيق الشركة' : 'Company verification details not found')}
        </p>
        <Button variant="outline" onClick={() => navigate('/admin/verification')}>
          {isAr ? 'العودة للقائمة' : 'Back to Queue'}
        </Button>
      </div>
    )
  }

  const isMutating =
    approveMutation.isPending || rejectMutation.isPending || requestChangesMutation.isPending

  const canDecide = detail.verificationStatus === 'UnderReview'

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Top action header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate('/admin/verification')}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#06245B] transition-colors"
        >
          <ArrowLeft size={16} />
          {isAr ? 'العودة لقائمة طلبات التوثيق' : 'Back to Verification Queue'}
        </button>

        {canDecide && (
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              icon={<X size={15} />}
              onClick={() => {
                setReason('')
                setModalAction('reject')
              }}
            >
              {isAr ? 'رفض الطلب' : 'Reject'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<AlertTriangle size={15} />}
              onClick={() => {
                setReason('')
                setModalAction('changes')
              }}
            >
              {isAr ? 'طلب تعديل' : 'Request Changes'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Check size={15} />}
              onClick={() => setModalAction('approve')}
            >
              {isAr ? 'اعتماد التوثيق' : 'Approve Company'}
            </Button>
          </div>
        )}
      </div>

      {/* Company identity card */}
      <Card>
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#EAF4FF] flex items-center justify-center shrink-0">
              <Building2 size={24} className="text-[#1266D6]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#06245B]">
                {detail.tradeName || detail.legalName}
              </h1>
              <p className="text-[#64748B] text-sm mt-0.5">
                {isAr ? 'الاسم القانوني المسجل: ' : 'Registered Legal Name: '}
                <span className="font-semibold text-[#1E293B]">{detail.legalName}</span>
              </p>
            </div>
          </div>
          <Badge variant={statusVariants[detail.verificationStatus] ?? 'gray'} dot size="lg">
            {detail.verificationStatus}
          </Badge>
        </div>

        {detail.rejectionReason && (
          <div className="p-3.5 rounded-xl bg-[#FEE2E2] border border-[#EF4444]/20 text-sm text-[#EF4444] mt-3">
            <span className="font-semibold">{isAr ? 'سبب الملاحظة / الرفض السابق: ' : 'Previous Reason: '}</span>
            {detail.rejectionReason}
          </div>
        )}
      </Card>

      {/* Uploaded Verification Documents */}
      <Card>
        <CardHeader
          title={
            isAr
              ? `المستندات القانونية المرفقة (${detail.documents?.length || 0})`
              : `Uploaded Verification Documents (${detail.documents?.length || 0})`
          }
          subtitle={
            isAr
              ? 'راجع السجل التجاري والبطاقة الضريبية بدقة قبل اتخاذ قرار الاعتماد'
              : 'Review submitted Commercial Register and Tax Card for corporate legal validation'
          }
        />

        {!detail.documents || detail.documents.length === 0 ? (
          <p className="text-sm text-[#94A3B8] py-8 text-center">
            {isAr ? 'لا توجد مستندات مرفقة.' : 'No documents uploaded.'}
          </p>
        ) : (
          <div className="space-y-3">
            {detail.documents.map((doc) => {
              const typeInfo = docTypeLabels[doc.documentType] || {
                en: doc.documentType,
                ar: doc.documentType,
              }
              const sizeKb = doc.fileSizeBytes
                ? (doc.fileSizeBytes / 1024).toFixed(1) + ' KB'
                : ''

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-[#F4F7FB] rounded-xl border border-[rgba(6,36,91,0.06)] flex-wrap gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-[#EAF4FF] text-[#1266D6] shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#06245B]">
                        {isAr ? typeInfo.ar : typeInfo.en}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {doc.fileName} {sizeKb && `· ${sizeKb}`} · {formatDate(doc.uploadedAtUtc)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariants[doc.status] ?? 'gray'} size="sm">
                      {doc.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Download size={14} />}
                      loading={downloadingDocId === doc.id}
                      onClick={() => handleDownload(doc.id, doc.fileName)}
                    >
                      {isAr ? 'تحميل' : 'Download'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Decision History */}
      {detail.decisionHistory && detail.decisionHistory.length > 0 && (
        <Card>
          <CardHeader
            title={isAr ? 'سجل القرارات والمراجعات' : 'Decision & Review History'}
            subtitle={isAr ? 'القرارات المتخذة سابقاً من قِبل المشرفين' : 'Historical administrative audit trail'}
          />
          <div className="space-y-3">
            {detail.decisionHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-4 flex-wrap"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariants[item.decision] ?? 'gray'} size="sm">
                      {item.decision}
                    </Badge>
                    <span className="text-xs text-[#64748B]">{item.reviewedByUserEmail}</span>
                  </div>
                  {item.reason && (
                    <p className="text-sm text-[#1E293B] mt-2 font-medium">
                      {isAr ? 'السبب: ' : 'Reason: '}
                      {item.reason}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {formatDate(item.decidedAtUtc)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Approve Modal */}
      <Modal
        open={modalAction === 'approve'}
        onClose={() => setModalAction(null)}
        title={isAr ? 'تأكيد اعتماد وتوثيق الشركة' : 'Approve Company'}
      >
        <p className="text-sm text-[#475569] mb-6 leading-relaxed">
          {isAr
            ? `هل أنت متأكد من رغبتك في اعتماد شركة "${detail.legalName}"؟ ستحصل الشركة فوراً على علامة التوثيق وتصبح مؤهلة لنشر طلبات الأسعار وتقديم العروض وإبرام الصفقات على DealZone.`
            : `Are you sure you want to approve "${detail.legalName}"? The company will be granted Verified status and can perform commercial activities across DealZone.`}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setModalAction(null)} disabled={isMutating}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            loading={approveMutation.isPending}
            onClick={() => approveMutation.mutate()}
          >
            {isAr ? 'تأكيد الاعتماد' : 'Confirm Approval'}
          </Button>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={modalAction === 'reject'}
        onClose={() => setModalAction(null)}
        title={isAr ? 'رفض طلب توثيق الشركة' : 'Reject Company Verification'}
      >
        <div className="space-y-4 mb-6">
          <p className="text-sm text-[#475569]">
            {isAr
              ? 'يرجى كتابة سبب الرفض بدقة (سيتم إرسال هذا التوضيح إلى صاحب الشركة عبر البريد الإلكتروني والإشعارات):'
              : 'Please enter a mandatory rejection reason (this will be sent to the company owner):'}
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={
              isAr
                ? 'مثال: السجل التجاري المقدم منتهي الصلاحية أو غير واضح الأختام...'
                : 'Reason for rejection...'
            }
            className="w-full p-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00D9F5]"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setModalAction(null)} disabled={isMutating}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="danger"
            disabled={!reason.trim()}
            loading={rejectMutation.isPending}
            onClick={() => rejectMutation.mutate(reason.trim())}
          >
            {isAr ? 'تأكيد الرفض' : 'Confirm Rejection'}
          </Button>
        </div>
      </Modal>

      {/* Request Changes Modal */}
      <Modal
        open={modalAction === 'changes'}
        onClose={() => setModalAction(null)}
        title={isAr ? 'طلب استكمال أو تعديل مستندات' : 'Request Changes'}
      >
        <div className="space-y-4 mb-6">
          <p className="text-sm text-[#475569]">
            {isAr
              ? 'حدد التعديلات أو المستندات الإضافية المطلوبة من الشركة:'
              : 'Describe what changes or additional documents are required from the company:'}
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={
              isAr
                ? 'مثال: يرجى رفع صورة واضحة وحديثة من السجل التجاري سارية لعام 2026...'
                : 'e.g., Please upload a clearer copy of the Commercial Register...'
            }
            className="w-full p-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00D9F5]"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setModalAction(null)} disabled={isMutating}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            disabled={!reason.trim()}
            loading={requestChangesMutation.isPending}
            onClick={() => requestChangesMutation.mutate(reason.trim())}
          >
            {isAr ? 'إرسال طلب التعديل' : 'Submit Request'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
