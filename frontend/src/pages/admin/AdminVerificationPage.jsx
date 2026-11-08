import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, Eye, Clock, FileText, RefreshCw } from 'lucide-react'
import { adminService } from '../../shared/api/services/adminService'
import { formatDate } from '../../utils/format'
import { useTranslation } from '../../hooks/useTranslation'
import { Card } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { PageSpinner } from '../../components/ui/Spinner'

const statusVariantMap = {
  Pending: 'warning',
  UnderReview: 'info',
  Approved: 'success',
  Rejected: 'error',
  ChangesRequired: 'warning',
}

export default function AdminVerificationPage() {
  const navigate = useNavigate()
  const { language } = useTranslation()
  const isAr = language === 'ar'

  const {
    data: companies,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin', 'verification', 'pending'],
    queryFn: adminService.getPendingCompanies,
    refetchInterval: 60_000,
  })

  if (isLoading) return <PageSpinner />

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[#EF4444] mb-3 font-semibold">
          {isAr ? 'فشل تحميل قائمة طلبات التوثيق' : 'Failed to load verification queue'}
        </p>
        <p className="text-sm text-[#64748B] mb-4">
          {error?.problem?.detail || error?.message}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {isAr ? 'إعادة المحاولة' : 'Retry'}
        </Button>
      </div>
    )
  }

  const pending = companies ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#64748B]">
          {isAr
            ? `${pending.length} شركة في انتظار المراجعة والاعتماد`
            : `${pending.length} compan${pending.length === 1 ? 'y' : 'ies'} pending review`}
        </p>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />}
          onClick={() => refetch()}
        >
          {isAr ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={isAr ? 'لا توجد طلبات توثيق معلقة' : 'No Pending Verifications'}
          description={
            isAr
              ? 'تمت مراجعة جميع ملفات الشركات المعروضة بنجاح.'
              : 'All submitted companies have been reviewed.'
          }
        />
      ) : (
        pending.map((company) => (
          <Card key={company.companyId} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF4FF] flex items-center justify-center shrink-0">
                  <Building2 size={24} className="text-[#1266D6]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#06245B] text-base">
                    {company.tradeName || company.legalName}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    {isAr ? 'الاسم القانوني: ' : 'Legal Name: '}
                    <span className="font-medium text-[#1E293B]">{company.legalName}</span>
                    {company.industrySector && (
                      <span className="ms-2 text-slate-400">· {company.industrySector}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Badge
                      variant={statusVariantMap[company.verificationStatus] ?? 'gray'}
                      dot
                    >
                      {company.verificationStatus}
                    </Badge>
                    <span className="text-xs text-[#64748B] flex items-center gap-1">
                      <FileText size={12} className="text-slate-400" />
                      {company.documentCount} {isAr ? 'مستندات مرفقة' : 'document(s)'}
                    </span>
                    <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                      <Clock size={12} />
                      {isAr ? 'تاريخ التقديم: ' : 'Submitted '}
                      {formatDate(company.createdAtUtc)}
                    </span>
                    {company.governorate && (
                      <span className="text-xs text-[#64748B]">
                        📍 {company.city ? `${company.city}, ` : ''}{company.governorate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={<Eye size={15} />}
                onClick={() => navigate(`/admin/verification/${company.companyId}`)}
              >
                {isAr ? 'مراجعة المستندات' : 'Review & Decide'}
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
