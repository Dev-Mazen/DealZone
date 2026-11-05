import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, Eye, Clock } from 'lucide-react'
import { adminService } from '../../shared/api/services/adminService'
import { formatDate } from '../../utils/format'
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

  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['admin', 'verification', 'pending'],
    queryFn: adminService.getPendingCompanies,
    refetchInterval: 60_000,
  })

  if (isLoading) return <PageSpinner />

  if (error) {
    return (
      <div className="text-center py-12 text-[#EF4444]">
        Failed to load verification queue
      </div>
    )
  }

  const pending = companies ?? []

  if (pending.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No Pending Verifications"
        description="All companies have been reviewed."
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#64748B]">
        {pending.length} compan{pending.length === 1 ? 'y' : 'ies'} pending review
      </p>

      {pending.map((company) => (
        <Card key={company.id} className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EAF4FF] flex items-center justify-center shrink-0">
                <Building2 size={24} className="text-[#1266D6]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#06245B]">
                  {company.tradeNameEn || company.legalName}
                </h3>
                <p className="text-sm text-[#64748B]">{company.legalName}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Badge
                    variant={statusVariantMap[company.verificationStatus] ?? 'gray'}
                    dot
                  >
                    {company.verificationStatus}
                  </Badge>
                  <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                    <Clock size={12} />
                    Submitted {formatDate(company.submittedAt)}
                  </span>
                  {company.governorate && (
                    <span className="text-xs text-[#64748B]">
                      📍 {company.city}, {company.governorate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<Eye size={15} />}
              onClick={() => navigate(`/admin/verification/${company.id}`)}
            >
              Review
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

