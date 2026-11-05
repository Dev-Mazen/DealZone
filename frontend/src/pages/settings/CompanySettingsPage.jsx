import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, ExternalLink } from 'lucide-react'
import { companyService } from '../../shared/api/services/companyService'
import { useToast } from '../../hooks/useToast'
import { usePermissions } from '../../hooks/usePermissions'
import { Card, CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { verificationStatusVariant } from '../../utils/format'
import { PageSpinner } from '../../components/ui/Spinner'

const profileSchema = z.object({
  tradeNameEn: z.string().min(1, 'Trade name (EN) is required'),
  tradeNameAr: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  governorate: z.string().min(1, 'Governorate is required'),
  descriptionEn: z.string().optional(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

const GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Aswan', 'Asyut', 'Beheira', 'Beni Suef',
  'Dakahlia', 'Damietta', 'Fayyum', 'Gharbia', 'Ismailia', 'Kafr el-Sheikh',
  'Luxor', 'Matruh', 'Minya', 'Monufia', 'New Valley', 'North Sinai',
  'Port Said', 'Qalyubia', 'Qena', 'Red Sea', 'Sharqia', 'Sohag',
  'South Sinai', 'Suez',
]

export default function CompanySettingsPage() {
  const toast = useToast()
  const qc = useQueryClient()
  const { canEditCompanyProfile, hasCompany } = usePermissions()
  const [editMode, setEditMode] = useState(false)

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', 'me'],
    queryFn: companyService.getMyCompany,
    enabled: hasCompany,
  })

  const { data: contactDetails } = useQuery({
    queryKey: ['company', 'contact'],
    queryFn: companyService.getMyContactDetails,
    enabled: hasCompany,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: company
      ? {
          tradeNameEn: company.tradeNameEn ?? '',
          tradeNameAr: company.tradeNameAr ?? '',
          city: company.city ?? '',
          governorate: company.governorate ?? '',
          descriptionEn: company.descriptionEn ?? '',
          website: company.website ?? '',
        }
      : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (data) => companyService.updateMyCompany(data),
    onSuccess: () => {
      toast.success('Company profile updated successfully')
      setEditMode(false)
      qc.invalidateQueries({ queryKey: ['company', 'me'] })
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || 'Failed to update company profile')
    },
  })

  if (!hasCompany) {
    return (
      <div className="text-center py-16">
        <Building2 size={40} className="text-[#CBD5E1] mx-auto mb-3" />
        <p className="text-[#64748B]">No company registered yet</p>
        <a href="/onboarding/company" className="mt-3 inline-block text-[#1266D6] text-sm font-medium">
          Register your company →
        </a>
      </div>
    )
  }

  if (isLoading) return <PageSpinner />

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#06245B]">Company Settings</h1>
        {canEditCompanyProfile && !editMode && (
          <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {/* Verification status */}
      {company && (
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#64748B]">Verification status</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={verificationStatusVariant(company.verificationStatus)} dot>
                  {company.verificationStatus}
                </Badge>
                {company.canPerformCommercialActivities && (
                  <span className="text-xs text-[#10B981]">Commercial activities enabled</span>
                )}
              </div>
            </div>
            <a
              href="/onboarding/verification"
              className="text-sm text-[#1266D6] hover:text-[#06245B] flex items-center gap-1"
            >
              Manage documents <ExternalLink size={12} />
            </a>
          </div>
        </Card>
      )}

      {/* Profile form */}
      <Card>
        <CardHeader title="Company Profile" />
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#64748B] mb-1">Legal Name</p>
              <p className="text-sm font-medium text-[#06245B]">{company?.legalName}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748B] mb-1">Tax ID</p>
              <p className="text-sm font-medium text-[#06245B]">{company?.taxIdentificationNumber || '—'}</p>
            </div>
          </div>

          <div className="h-px bg-[rgba(6,36,91,0.06)]" />

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('tradeNameEn')}
              label="Trade Name (English)"
              error={errors.tradeNameEn?.message}
              disabled={!editMode}
              required
            />
            <Input
              {...register('tradeNameAr')}
              label="Trade Name (Arabic)"
              dir="rtl"
              disabled={!editMode}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('city')}
              label="City"
              error={errors.city?.message}
              disabled={!editMode}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#1E293B]">
                Governorate <span className="text-[#EF4444]">*</span>
              </label>
              <select
                {...register('governorate')}
                disabled={!editMode}
                className="h-10 ps-3 pe-3 rounded-lg border border-[#E2E8F0] text-sm text-[#1E293B] bg-white focus:outline-none focus:ring-2 focus:ring-[#00D9F5] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">Select governorate</option>
                {GOVERNORATES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {errors.governorate && (
                <p className="text-xs text-[#EF4444]">{errors.governorate.message}</p>
              )}
            </div>
          </div>

          <Textarea
            {...register('descriptionEn')}
            label="Company Description"
            placeholder="Describe your company, products, and capabilities…"
            rows={3}
            disabled={!editMode}
          />

          <Input
            {...register('website')}
            type="url"
            label="Website"
            placeholder="https://yourcompany.com"
            error={errors.website?.message}
            disabled={!editMode}
          />

          {editMode && (
            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setEditMode(false); reset() }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* Contact details (private — only owner sees) */}
      {contactDetails && (
        <Card>
          <CardHeader
            title="Contact Details"
            subtitle="Private — not shown publicly"
          />
          <div className="grid grid-cols-2 gap-3 text-sm">
            {contactDetails.email && (
              <div>
                <p className="text-[#64748B] text-xs">Email</p>
                <p className="text-[#06245B] font-medium">{contactDetails.email}</p>
              </div>
            )}
            {contactDetails.phone && (
              <div>
                <p className="text-[#64748B] text-xs">Phone</p>
                <p className="text-[#06245B] font-medium">{contactDetails.phone}</p>
              </div>
            )}
            {contactDetails.address && (
              <div className="col-span-2">
                <p className="text-[#64748B] text-xs">Address</p>
                <p className="text-[#06245B] font-medium">{contactDetails.address}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

