import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Trash2, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { companyService } from '../../shared/api/services/companyService'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import { useTranslation } from '../../hooks/useTranslation'
import { formatFileSize, formatDateTime, verificationStatusVariant } from '../../utils/format'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'

const docTypes = [
  { value: 1, typeKey: 'CommercialRegister', labelEn: 'Commercial Register', labelAr: 'السجل التجاري', required: true },
  { value: 2, typeKey: 'TaxCard', labelEn: 'Tax Card', labelAr: 'البطاقة الضريبية', required: true },
  { value: 3, typeKey: 'IndustrialRegister', labelEn: 'Industrial Register', labelAr: 'السجل الصناعي', required: false },
  { value: 4, typeKey: 'QualityCertificate', labelEn: 'Quality Certificate', labelAr: 'شهادة الجودة', required: false },
  { value: 5, typeKey: 'Other', labelEn: 'Other Document', labelAr: 'وثيقة أخرى', required: false },
]

export default function VerificationPage() {
  const user = useAuthStore((s) => s.user)
  const { t, language } = useTranslation()
  const isAr = language === 'ar'
  const toast = useToast()
  const queryClient = useQueryClient()
  const [uploadingDocType, setUploadingDocType] = useState(null)

  if (user?.isSystemAdmin) {
    return <Navigate to="/admin/verification" replace />
  }

  const { data: status, isLoading } = useQuery({
    queryKey: ['company', 'verification'],
    queryFn: () => companyService.getVerificationStatus(),
  })

  const submitMutation = useMutation({
    mutationFn: () => companyService.submitForReview(),
    onSuccess: () => {
      toast.success(isAr ? 'تم إرسال المستندات للمراجعة بنجاح' : 'Submitted for review successfully!')
      queryClient.invalidateQueries({ queryKey: ['company', 'verification'] })
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || (isAr ? 'فشل الإرسال' : 'Failed to submit'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (docId) => companyService.deleteVerificationDocument(docId),
    onSuccess: () => {
      toast.success(isAr ? 'تم حذف المستند' : 'Document deleted')
      queryClient.invalidateQueries({ queryKey: ['company', 'verification'] })
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || (isAr ? 'فشل حذف المستند' : 'Failed to delete document'))
    },
  })

  const handleUpload = async (docType, file) => {
    setUploadingDocType(docType)
    try {
      await companyService.uploadVerificationDocument(docType, file)
      toast.success(isAr ? 'تم رفع المستند بنجاح' : 'Document uploaded successfully!')
      queryClient.invalidateQueries({ queryKey: ['company', 'verification'] })
    } catch (err) {
      toast.error(err?.problem?.detail || (isAr ? 'فشل رفع المستند' : 'Upload failed'))
    } finally {
      setUploadingDocType(null)
    }
  }

  if (isLoading) return <PageSpinner />

  const companyStatus = status?.companyVerificationStatus || 'Pending'

  const canUploadOrEdit =
    companyStatus === 'Pending' ||
    companyStatus === 'ChangesRequired'

  // Match either exact enum value or friendly string
  const hasCommercialRegister = status?.documents?.some(
    (d) => d.documentType === 'CommercialRegister' || d.documentType === 'Commercial Register'
  )
  const hasTaxCard = status?.documents?.some(
    (d) => d.documentType === 'TaxCard' || d.documentType === 'Tax Card'
  )
  const hasRequiredDocs = hasCommercialRegister && hasTaxCard

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader
          title={isAr ? 'توثيق الشركة والمستندات القانونية' : 'Company Verification & Legal Documents'}
          subtitle={
            isAr
              ? 'متابعة حالة المستندات المرفوعة للتحقق القانوني والتجاري'
              : 'Track submitted documents for legal and commercial verification'
          }
          action={
            <Badge variant={verificationStatusVariant(companyStatus)} dot>
              {isAr
                ? companyStatus === 'Approved'
                  ? 'معتمد'
                  : companyStatus === 'UnderReview'
                  ? 'قيد المراجعة'
                  : companyStatus === 'ChangesRequired'
                  ? 'مطلوب تعديلات'
                  : companyStatus === 'Rejected'
                  ? 'مرفوض'
                  : 'بانتظار التقديم'
                : companyStatus}
            </Badge>
          }
        />

        {/* Status Banners */}
        {companyStatus === 'Approved' && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm mb-1">
                {isAr ? 'شركتك معتمدة رسمياً' : 'Your Company is Officially Verified!'}
              </h4>
              <p className="text-xs text-emerald-700 leading-relaxed">
                {isAr
                  ? 'تم التحقق من السجل التجاري والبطاقة الضريبية الخاصة بشركتكم، وبإمكانكم الآن نشر طلبات الأسعار وتقديم العروض وإبرام الصفقات التجارية.'
                  : 'Your commercial registration and tax credentials have been verified. You can now post RFQs, submit offers, and execute binding deals.'}
              </p>
            </div>
          </div>
        )}

        {companyStatus === 'UnderReview' && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
            <Clock size={20} className="text-[#1266D6] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm mb-1">
                {isAr ? 'المستندات قيد التدقيق والمراجعة' : 'Documents Under Review'}
              </h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                {isAr
                  ? 'يقوم فريق الامتثال القانوني في DealZone بفحص المستندات المرفوعة للتأكد من صحتها. ستصلك رسالة فور اعتماد الحساب.'
                  : 'DealZone compliance officers are vetting your uploaded credentials. You will be notified once verification is completed.'}
              </p>
            </div>
          </div>
        )}

        {companyStatus === 'ChangesRequired' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm mb-1">
                {isAr ? 'مطلوب تعديلات على بعض المستندات' : 'Modifications Requested'}
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                {isAr
                  ? 'يرجى مراجعة الملاحظات المدونة أدناه واستبدال المستندات المطلوبة ثم الضغط على زر "إعادة التقديم للمراجعة".'
                  : 'Please check the notes below, upload updated replacement documents, and click "Resubmit for Review".'}
              </p>
            </div>
          </div>
        )}

        {companyStatus === 'Rejected' && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
            <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm mb-1">
                {isAr ? 'تم رفض طلب التحقق' : 'Verification Request Rejected'}
              </h4>
              <p className="text-xs text-rose-700 leading-relaxed">
                {isAr
                  ? 'تم رفض طلب التحقق الخاص بشركتكم. يرجى التواصل مع فريق الدعم الفني: support@dealzone.eg'
                  : 'Your company verification request was rejected. Please reach out to support@dealzone.eg for details.'}
              </p>
            </div>
          </div>
        )}

        {/* Verification Documents List */}
        <div className="space-y-4 mb-6">
          {docTypes.map((docType) => {
            // Match against both enum string and human label
            const uploaded = status?.documents?.find(
              (d) => d.documentType === docType.typeKey || d.documentType === docType.labelEn
            )

            const isPendingUpload = uploadingDocType === docType.value

            return (
              <div
                key={docType.value}
                className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 transition-all hover:border-[#1266D6]/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF4FF] flex items-center justify-center shrink-0">
                      <FileText size={20} className="text-[#1266D6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-[#06245B] text-sm">
                          {isAr ? docType.labelAr : docType.labelEn}
                        </h4>
                        {docType.required ? (
                          <Badge variant="error" size="xs">
                            {isAr ? 'إلزامي' : 'Required'}
                          </Badge>
                        ) : (
                          <Badge variant="navy" size="xs">
                            {isAr ? 'اختياري' : 'Optional'}
                          </Badge>
                        )}
                      </div>

                      {uploaded ? (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-slate-800 truncate" title={uploaded.fileName}>
                            {uploaded.fileName}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[#64748B] flex-wrap">
                            <span>{formatFileSize(uploaded.fileSizeBytes)}</span>
                            <span>•</span>
                            <span>{formatDateTime(uploaded.uploadedAtUtc, language)}</span>
                            <span>•</span>
                            <span className="font-semibold text-emerald-600">
                              {isAr ? 'تم الرفع بنجاح' : 'Uploaded'}
                            </span>
                          </div>
                          {uploaded.rejectionReason && (
                            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg mt-2">
                              <strong>{isAr ? 'ملاحظة الإدارة: ' : 'Admin Note: '}</strong>
                              {uploaded.rejectionReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">
                          {isAr ? 'لم يتم رفع المستند بعد' : 'No document uploaded yet'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {uploaded ? (
                      <>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                          <CheckCircle size={14} />
                          <span>{isAr ? 'مرفوع' : 'Uploaded'}</span>
                        </div>
                        {canUploadOrEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Trash2 size={16} className="text-rose-600" />}
                            onClick={() => deleteMutation.mutate(uploaded.id)}
                            loading={deleteMutation.isPending}
                            title={isAr ? 'حذف واستبدال' : 'Delete and replace'}
                          />
                        )}
                      </>
                    ) : (
                      canUploadOrEdit && (
                        <label>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(docType.value, file)
                            }}
                            disabled={isPendingUpload}
                          />
                          <Button
                            as="span"
                            size="sm"
                            variant="outline"
                            icon={<Upload size={16} />}
                            loading={isPendingUpload}
                            className="cursor-pointer"
                          >
                            {isAr ? 'رفع ملف' : 'Upload File'}
                          </Button>
                        </label>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Submit / Resubmit Actions */}
        {canUploadOrEdit && (
          <div className="border-t pt-5 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 text-center sm:text-start">
              {!hasRequiredDocs ? (
                <span className="text-rose-600 font-semibold">
                  {isAr
                    ? '⚠️ يجب رفع السجل التجاري والبطاقة الضريبية لتفعيل الحساب'
                    : '⚠️ Commercial Register and Tax Card are required to activate account'}
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">
                  {isAr
                    ? '✓ تم استيفاء المستندات الأساسية وجاهزة للتقديم'
                    : '✓ All mandatory documents uploaded and ready for review'}
                </span>
              )}
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => submitMutation.mutate()}
              loading={submitMutation.isPending}
              disabled={!hasRequiredDocs}
              className="w-full sm:w-auto font-bold"
            >
              {companyStatus === 'ChangesRequired'
                ? isAr ? 'إعادة التقديم بعد التعديل' : 'Resubmit After Changes'
                : isAr ? 'إرسال المستندات للمراجعة' : 'Submit for Admin Review'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
