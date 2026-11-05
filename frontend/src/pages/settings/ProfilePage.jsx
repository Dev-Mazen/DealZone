import { Mail, Phone, Building2, Shield } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Card, CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { verificationStatusVariant } from '../../utils/format'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return <div className="text-center py-16 text-[#64748B]">Loading profile…</div>
  }

  const company = user.company

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#06245B]">My Profile</h1>

      {/* User info */}
      <Card>
        <CardHeader title="Account Information" />
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#06245B] flex items-center justify-center text-white text-2xl font-bold">
              {user.fullName?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div>
              <p className="text-lg font-semibold text-[#06245B]">{user.fullName}</p>
              <div className="flex items-center gap-2 mt-1">
                {user.isSystemAdmin && (
                  <Badge variant="cyan" dot>System Admin</Badge>
                )}
                {company?.role && (
                  <Badge variant="navy">{company.role}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[rgba(6,36,91,0.06)]">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-[#64748B] shrink-0" />
              <div>
                <p className="text-[#64748B] text-xs">Email</p>
                <p className="text-[#1E293B] font-medium">{user.email}</p>
              </div>
            </div>

            {user.phoneNumber && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-[#64748B] shrink-0" />
                <div>
                  <p className="text-[#64748B] text-xs">Phone</p>
                  <p className="text-[#1E293B] font-medium">{user.phoneNumber}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Shield size={14} className={user.emailConfirmed ? 'text-[#10B981]' : 'text-[#F59E0B]'} />
            <span className="text-xs text-[#64748B]">
              Email {user.emailConfirmed ? 'verified' : 'not verified'}
            </span>
          </div>
        </div>
      </Card>

      {/* Company summary */}
      {company && (
        <Card>
          <CardHeader
            title="Company"
            action={
              <Badge variant={verificationStatusVariant(company.verificationStatus)} dot>
                {company.verificationStatus}
              </Badge>
            }
          />
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Building2 size={16} className="text-[#64748B] shrink-0" />
              <div>
                <p className="text-[#64748B] text-xs">Company</p>
                <p className="text-[#1E293B] font-medium">
                  {company.tradeNameEn || company.tradeNameAr || company.legalName}
                </p>
              </div>
            </div>

            <div className="flex gap-3 text-xs text-[#64748B] flex-wrap">
              {company.city && <span>📍 {company.city}, {company.governorate}</span>}
              {company.canPerformCommercialActivities && (
                <span className="text-[#10B981] font-medium">✓ Verified — Commercial activities enabled</span>
              )}
            </div>
          </div>
        </Card>
      )}

      {!company && (
        <Card>
          <div className="text-center py-6">
            <Building2 size={40} className="text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-[#64748B] text-sm">No company registered yet</p>
            <a
              href="/onboarding/company"
              className="mt-3 inline-block text-sm text-[#1266D6] hover:text-[#06245B] font-medium"
            >
              Register your company →
            </a>
          </div>
        </Card>
      )}
    </div>
  )
}

