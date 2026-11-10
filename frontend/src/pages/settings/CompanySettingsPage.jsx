import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2,
  ShieldCheck,
  MapPin,
  Globe,
  Phone,
  Mail,
  FileText,
  Edit2,
  Check,
  X,
  ExternalLink,
  Users,
} from 'lucide-react'
import { companyService } from '../../shared/api/services/companyService'
import { useToast } from '../../hooks/useToast'
import { usePermissions } from '../../hooks/usePermissions'
import { useTranslation } from '../../hooks/useTranslation'
import Card, { CardHeader } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { verificationStatusVariant, formatDate } from '../../utils/format'
import { PageSpinner } from '../../components/ui/Spinner'
import CompanyMembersTab from './CompanyMembersTab'

const profileSchema = z.object({
  tradeName: z.string().min(1, 'Trade name is required'),
  city: z.string().min(1, 'City is required'),
  governorate: z.string().min(1, 'Governorate is required'),
  description: z.string().optional().nullable(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')).nullable(),
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
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const { canEditCompanyProfile, hasCompany } = usePermissions()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'profile'
  const [editMode, setEditMode] = useState(false)

  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['company', 'me'],
    queryFn: companyService.getMyCompany,
    enabled: hasCompany,
  })

  const { data: contactDetails, isLoading: loadingContact } = useQuery({
    queryKey: ['company', 'contact'],
    queryFn: companyService.getMyContactDetails,
    enabled: hasCompany,
  })

  const { data: verificationStatus } = useQuery({
    queryKey: ['company', 'verification'],
    queryFn: companyService.getVerificationStatus,
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
          tradeName: company.tradeName || '',
          city: company.city || '',
          governorate: company.governorate || '',
          description: company.description || '',
          website: company.website || '',
        }
      : undefined,
  })

  const updateMutation = useMutation({
    mutationFn: (data) => companyService.updateMyCompany(data),
    onSuccess: () => {
      toast.success(isAr ? 'تم تحديث ملف الشركة بنجاح' : 'Company profile updated successfully')
      setEditMode(false)
      qc.invalidateQueries({ queryKey: ['company', 'me'] })
    },
    onError: (err) => {
      toast.error(err?.problem?.detail || (isAr ? 'فشل تحديث البيانات' : 'Failed to update company profile'))
    },
  })

  const onSubmit = (values) => {
    updateMutation.mutate(values)
  }

  const cancelEdit = () => {
    reset()
    setEditMode(false)
  }

  if (loadingCompany || loadingContact) return <PageSpinner />

  if (!hasCompany) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <Building2 size={48} className="text-[#CBD5E1] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#06245B] mb-2">
          {isAr ? 'لم يتم تسجيل شركة حتى الآن' : 'No Company Registered Yet'}
        </h2>
        <p className="text-sm text-[#64748B] mb-6">
          {isAr
            ? 'سجل بيانات شركتك للبدء في طرح طلبات الأسعار وتقديم العروض على المنصة.'
            : 'Register your company to start publishing tenders and bidding on DealZone.'}
        </p>
        <Button as={Link} to="/onboarding/company" variant="primary" size="md">
          {isAr ? 'تسجيل شركة جديدة' : 'Register New Company'}
        </Button>
      </div>
    )
  }

  const status = company?.verificationStatus || 'Pending'

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[#06245B]">
              {company?.tradeName || company?.legalName}
            </h1>
            <Badge variant={verificationStatusVariant(status)} dot>
              {isAr
                ? status === 'Approved'
                  ? 'معتمد'
                  : status === 'UnderReview'
                  ? 'قيد المراجعة'
                  : status === 'ChangesRequired'
                  ? 'مطلوب تعديلات'
                  : status === 'Rejected'
                  ? 'مرفوض'
                  : 'بانتظار التقديم'
                : status}
            </Badge>
          </div>
          <p className="text-sm text-[#64748B]">
            {isAr
              ? 'إدارة بيانات المنشأة الصناعية والعناوين المسجلة والوثائق القانونية'
              : 'Manage enterprise credentials, registered facilities, and legal documentation'}
          </p>
        </div>

        {activeTab === 'profile' && canEditCompanyProfile && !editMode && (
          <Button
            variant="outline"
            size="sm"
            icon={<Edit2 size={16} />}
            onClick={() => setEditMode(true)}
          >
            {isAr ? 'تعديل البيانات' : 'Edit Profile'}
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 pb-0">
        <button
          onClick={() => setSearchParams({ tab: 'profile' })}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'profile'
              ? 'border-[#1266D6] text-[#1266D6]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={16} />
          <span>{isAr ? 'بيانات المنشأة والتوثيق' : 'Company Profile & Legal'}</span>
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'members' })}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'members'
              ? 'border-[#1266D6] text-[#1266D6]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={16} />
          <span>{isAr ? 'فريق العمل والأعضاء' : 'Team Members'}</span>
        </button>
      </div>

      {activeTab === 'members' ? (
        <CompanyMembersTab />
      ) : (
        /* Grid: 2 Columns */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Commercial & Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Official Legal Identity (Immutable verified data) */}
          <Card>
            <CardHeader
              title={isAr ? 'الهوية القانونية المعتمدة' : 'Official Legal Identity'}
              subtitle={
                isAr
                  ? 'البيانات الثبوتية المعتمدة لدى السجل التجاري والجهات الحكومية'
                  : 'Government-verified enterprise registration and tax identification'
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">
                  {isAr ? 'الاسم القانوني للكيان (Legal Name)' : 'Legal Registered Name'}
                </span>
                <span className="font-bold text-[#06245B]">
                  {company?.legalName || '—'}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">
                  {isAr ? 'القطاع الصناعي (Sector)' : 'Industry Sector'}
                </span>
                <span className="font-bold text-[#06245B]">
                  {company?.industrySector || '—'}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">
                  {isAr ? 'رقم السجل التجاري' : 'Commercial Registration No.'}
                </span>
                <span className="font-mono font-bold text-[#06245B]">
                  {contactDetails?.commercialRegistrationNumber || '—'}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">
                  {isAr ? 'رقم البطاقة الضريبية' : 'Tax Identification Number'}
                </span>
                <span className="font-mono font-bold text-[#06245B]">
                  {contactDetails?.taxIdNumber || '—'}
                </span>
              </div>
            </div>
          </Card>

          {/* Card 2: Business Profile (Editable) */}
          <Card>
            <CardHeader
              title={isAr ? 'الملف التجاري والعام' : 'Commercial Profile'}
              subtitle={
                isAr
                  ? 'الاسم التجاري المعروض للمتعاملين والوصف والروابط'
                  : 'Public trade name, company description, and digital presence'
              }
            />

            {editMode ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isAr ? 'الاسم التجاري (Trade Name)' : 'Trade Name'}
                    error={errors.tradeName?.message}
                    {...register('tradeName')}
                    required
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {isAr ? 'المحافظة' : 'Governorate'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1266D6] bg-white text-slate-800"
                      {...register('governorate')}
                    >
                      {GOVERNORATES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    {errors.governorate && (
                      <p className="text-xs text-rose-500 mt-1">{errors.governorate.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={isAr ? 'المدينة / المنطقة الصناعية' : 'City / Industrial Zone'}
                    error={errors.city?.message}
                    {...register('city')}
                    required
                  />

                  <Input
                    label={isAr ? 'الموقع الإلكتروني' : 'Website'}
                    placeholder="https://example.com"
                    error={errors.website?.message}
                    {...register('website')}
                  />
                </div>

                <Textarea
                  label={isAr ? 'نبذة عن الشركة والمنتجات' : 'Company Overview & Capabilities'}
                  rows={3}
                  error={errors.description?.message}
                  {...register('description')}
                />

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<X size={16} />}
                    onClick={cancelEdit}
                    disabled={updateMutation.isPending}
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={<Check size={16} />}
                    loading={updateMutation.isPending}
                  >
                    {isAr ? 'حفظ التغييرات' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">
                      {isAr ? 'الاسم التجاري' : 'Trade Name'}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {company?.tradeName || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block mb-1">
                      {isAr ? 'الموقع الجغرافي' : 'Location'}
                    </span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#1266D6]" />
                      {company?.city}, {company?.governorate}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block mb-1">
                    {isAr ? 'الموقع الإلكتروني' : 'Website'}
                  </span>
                  {company?.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1266D6] hover:underline font-medium inline-flex items-center gap-1 text-xs"
                    >
                      <Globe size={13} />
                      {company.website}
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-slate-500 block mb-1">
                    {isAr ? 'نبذة عن الشركة' : 'Overview'}
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {company?.description || (isAr ? 'لم تتم إضافة وصف تجاري بعد' : 'No description provided')}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 Col): Contact, Address, & Verification Docs */}
        <div className="space-y-6">
          {/* Contact Details Card */}
          <Card>
            <CardHeader
              title={isAr ? 'بيانات التواصل والعنوان' : 'Contact & Address'}
            />
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-2.5">
                <Mail size={15} className="text-[#1266D6] shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block">{isAr ? 'البريد الرسمي' : 'Corporate Email'}</span>
                  <span className="font-semibold text-slate-800">
                    {contactDetails?.corporateEmail || '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone size={15} className="text-[#1266D6] shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block">{isAr ? 'هاتف المنشأة' : 'Corporate Phone'}</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {contactDetails?.corporatePhone || '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-[#1266D6] shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block">{isAr ? 'العنوان الفعلي المسجل' : 'Registered Address'}</span>
                  <span className="text-slate-800 font-medium">
                    {contactDetails?.addressLine1}
                    {contactDetails?.addressLine2 && `, ${contactDetails.addressLine2}`}
                    {contactDetails?.postalCode && ` (${contactDetails.postalCode})`}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Verification Documents Summary Card */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[#06245B] text-sm">
                {isAr ? 'المستندات القانونية' : 'Legal Documents'}
              </h3>
              <Link
                to="/onboarding/verification"
                className="text-xs font-semibold text-[#1266D6] hover:underline"
              >
                {isAr ? 'إدارة المستندات' : 'Manage Docs'}
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              {verificationStatus?.documents && verificationStatus.documents.length > 0 ? (
                verificationStatus.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-[#1266D6] shrink-0" />
                      <span className="font-medium text-slate-800 truncate" title={doc.fileName}>
                        {doc.documentType}
                      </span>
                    </div>
                    <Badge variant="success" size="xs">
                      {isAr ? 'مرفوع' : 'Uploaded'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs py-2">
                  {isAr ? 'لا توجد مستندات مرفوعة' : 'No documents uploaded yet'}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Button
                as={Link}
                to="/onboarding/verification"
                variant="outline"
                size="sm"
                fullWidth
              >
                {isAr ? 'فحص حالة التوثيق' : 'Check Verification Status'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
      )}
    </div>
  )
}
