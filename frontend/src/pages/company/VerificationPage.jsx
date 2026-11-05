import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Trash2, CheckCircle } from 'lucide-react'
import { companyService } from '../../shared/api/services/companyService'
import { useToast } from '../../hooks/useToast'
import { useTranslation } from '../../hooks/useTranslation'
import { formatFileSize, formatDateTime, verificationStatusVariant } from '../../utils/format'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { PageSpinner } from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

const docTypes = [
  { value: 1, labelEn: 'Commercial Register', labelAr: 'السجل التجاري' },
  { value: 2, labelEn: 'Tax Card', labelAr: 'البطاقة الضريبية' },
  { value: 3, labelEn: 'Industrial Register', labelAr: 'السجل الصناعي' },
  { value: 4, labelEn: 'Quality Certificate', labelAr: 'شهادة الجودة' },
  { value: 5, labelEn: 'Other Document', labelAr: 'وثيقة أخرى' },
]

export default function VerificationPage() {
  const { t, language } = useTranslation()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const { data: status, isLoading } = useQuery({
    queryKey: ['company', 'verification'],
    queryFn: () => companyService.getVerificationStatus(),
  })

  const submitMutation = useMutation({
    mutationFn: () => companyService.submitForReview(),
    onSuccess: () => {
      toast.success('Submitted for review successfully!')
      queryClient.invalidateQueries({ queryKey: ['company', 'verification'] })
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || 'Failed to submit')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (docId) => companyService.deleteVerificationDocument(docId),
    onSuccess: () => {
      toast.success('Document deleted')
      queryClient.invalidateQueries({ queryKey: ['company', 'verification'] })
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || 'Failed to delete document')
    },
  })

  const handleUpload = async (docType, file) => {
    setUploading(true)
    try {
      await companyService.uploadVerificationDocument(docType, file)
      toast.success('Document uploaded successfully!')
      queryClient.invalidateQueries({ queryKey: ['company', 'verification'] })
    } catch (err) {
      toast.error(err?.problem?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) return <PageSpinner />

  const canSubmit =
    status?.companyVerificationStatus === 'Pending' ||
    status?.companyVerificationStatus === 'ChangesRequired'

  const hasRequiredDocs =
    status?.documents.some((d) => d.documentType === 'CommercialRegister') &&
    status?.documents.some((d) => d.documentType === 'TaxCard')

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader
          title={t('company.verification.status')}
          subtitle={language === 'ar' ? 'أرفق المستندات المطلوبة للتحقق' : 'Upload required documents for verification'}
          action={
            <Badge variant={verificationStatusVariant(status?.companyVerificationStatus || '')} dot>
              {t(`company.verification.${status?.companyVerificationStatus?.toLowerCase() || 'pending'}`)}
            </Badge>
          }
        />

        {status?.companyVerificationStatus === 'Rejected' && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-[#EF4444]/20 text-[#EF4444]">
            <h4 className="font-semibold text-sm mb-1">
              {language === 'ar' ? 'تم رفض طلب التحقق' : 'Verification Application Rejected'}
            </h4>
            <p className="text-xs">
              {language === 'ar'
                ? 'تم رفض طلب التحقق الخاص بشركتكم من قبل إدارة المنصة. يرجى التواصل مع الدعم الفني لمزيد من المعلومات: support@dealzone.eg'
                : 'Your verification request was rejected by platform administration. Please contact support@dealzone.eg for further assistance.'}
            </p>
          </div>
        )}

        {status?.companyVerificationStatus === 'ChangesRequired' && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <h4 className="font-semibold text-sm mb-1">
              {language === 'ar' ? 'مطلوب تعديلات على المستندات' : 'Modifications Requested'}
            </h4>
            <p className="text-xs">
              {language === 'ar'
                ? 'طلبت إدارة المنصة استبدال بعض المستندات أو تحديثها. يرجى مراجعة الملاحظات أدناه ورفع المستندات المطلوبة ثم إعادة التقديم.'
                : 'Platform administrators requested updates to your submitted documents. Review the notes below, upload updated documents, and resubmit.'}
            </p>
          </div>
        )}

        {/* Document types */}
        <div className="space-y-4 mb-6">
          {docTypes.slice(0, 2).map((docType) => {
            const uploaded = status?.documents.find((d) => d.documentType === docType.labelEn)
            return (
              <div
                key={docType.value}
                className="border border-[rgba(6,36,91,0.06)] rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-[#EAF4FF] flex items-center justify-center shrink-0">
                      <FileText size={20} className="text-[#1266D6]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#06245B] text-sm mb-1">
                        {language === 'ar' ? docType.labelAr : docType.labelEn}
                        <Badge variant="error" className="ms-2">
                          {t('common.required')}
                        </Badge>
                      </h4>
                      {uploaded ? (
                        <div>
                          <p className="text-xs text-[#64748B] mb-1">{uploaded.fileName}</p>
                          <p className="text-xs text-[#64748B]">
                            {formatFileSize(uploaded.fileSizeBytes)} •{' '}
                            {formatDateTime(uploaded.uploadedAtUtc, language)}
                          </p>
                          {uploaded.rejectionReason && (
                            <p className="text-xs text-[#EF4444] mt-1 bg-red-50 p-1.5 rounded">
                              {language === 'ar' ? 'سبب الرفض: ' : 'Rejection Reason: '}
                              {uploaded.rejectionReason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-[#64748B]">
                          {language === 'ar' ? 'لم يتم الرفع' : 'Not uploaded'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {uploaded ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<CheckCircle size={16} />}
                          disabled
                        >
                          {language === 'ar' ? 'مرفوع' : 'Uploaded'}
                        </Button>
                        {canSubmit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Trash2 size={16} />}
                            onClick={() => deleteMutation.mutate(uploaded.id)}
                            loading={deleteMutation.isPending}
                          />
                        )}
                      </>
                    ) : (
                      <label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUpload(docType.value, file)
                          }}
                          disabled={!canSubmit || uploading}
                        />
                        <Button
                          as="span"
                          size="sm"
                          variant="outline"
                          icon={<Upload size={16} />}
                          disabled={!canSubmit || uploading}
                        >
                          {language === 'ar' ? 'رفع' : 'Upload'}
                        </Button>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Submit button */}
        {canSubmit && (
          <div className="border-t pt-4 border-[rgba(6,36,91,0.06)]">
            <Button
              variant="primary"
              fullWidth
              onClick={() => submitMutation.mutate()}
              loading={submitMutation.isPending}
              disabled={!hasRequiredDocs}
            >
              {t('company.verification.submit')}
            </Button>
            {!hasRequiredDocs && (
              <p className="text-xs text-[#EF4444] mt-2 text-center">
                {language === 'ar'
                  ? 'يجب رفع السجل التجاري والبطاقة الضريبية'
                  : 'Commercial Register and Tax Card are required'}
              </p>
            )}
          </div>
        )}

        {status?.companyVerificationStatus === 'UnderReview' && (
          <div className="text-center py-4">
            <p className="text-sm text-[#64748B]">
              {language === 'ar'
                ? 'مستنداتك قيد المراجعة. سنخطرك قريباً.'
                : "Your documents are under review. We'll notify you soon."}
            </p>
          </div>
        )}

        {status?.companyVerificationStatus === 'Approved' && (
          <EmptyState
            icon={CheckCircle}
            title={language === 'ar' ? 'شركتك معتمدة!' : 'Your company is verified!'}
            description={language === 'ar' ? 'يمكنك الآن البدء في استخدام المنصة' : 'You can now start using the platform'}
          />
        )}
      </Card>
    </div>
  )
}
