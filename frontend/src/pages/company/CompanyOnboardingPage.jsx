import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2,
  Factory,
  FileText,
  MapPin,
  Mail,
  Phone,
  Globe,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react'
import { companyService } from '../../shared/api/services/companyService'
import { authService } from '../../shared/api/services/authService'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import { useTranslation } from '../../hooks/useTranslation'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'

const companySchema = z.object({
  legalName: z.string().min(3, 'Legal name must be at least 3 characters'),
  tradeName: z.string().min(3, 'Trade name must be at least 3 characters'),
  industrySector: z.string().min(3, 'Industry sector is required'),
  city: z.string().min(2, 'City is required'),
  governorate: z.string().min(2, 'Governorate is required'),
  description: z.string().optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  taxIdNumber: z.string().min(5, 'Tax ID number is required'),
  commercialRegistrationNumber: z.string().min(5, 'Commercial registration number is required'),
  corporateEmail: z.string().email('Invalid corporate email address'),
  corporatePhone: z.string().min(10, 'Corporate phone number must be at least 10 digits'),
  addressLine1: z.string().min(5, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  postalCode: z.string().optional(),
})

const commonSectors = [
  { ar: 'حديد وصلب ومعادن', en: 'Steel & Metallurgy' },
  { ar: 'كيماويات وبتروكيماويات', en: 'Industrial Chemicals' },
  { ar: 'بوليمرات ولدائن', en: 'Polymers & Plastics' },
  { ar: 'تعبئة وتغليف وورق', en: 'Packaging & Paper' },
  { ar: 'غزل ونسيج وألياف', en: 'Textiles & Fibers' },
  { ar: 'تعدين ومواد بناء', en: 'Mining & Construction' },
]

export default function CompanyOnboardingPage() {
  const navigate = useNavigate()
  const { t, language } = useTranslation()
  const isAr = language === 'ar'
  const toast = useToast()
  const setUser = useAuthStore((s) => s.setUser)
  const [isLoading, setIsLoading] = useState(false)
  const [userIntent, setUserIntent] = useState('buyer')

  useEffect(() => {
    const saved = localStorage.getItem('dz_user_intent')
    if (saved) setUserIntent(saved)
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      industrySector: '',
    },
  })

  const currentSector = watch('industrySector')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      await companyService.create(data)
      const user = await authService.me()
      setUser(user)
      toast.success(
        isAr
          ? 'تم تسجيل بيانات الشركة بنجاح! يرجى رفع المستندات الرسمية للاعتماد.'
          : 'Company registered successfully! Please upload verification documents.',
      )
      navigate('/onboarding/verification')
    } catch (err) {
      toast.error(err?.problem?.detail || (isAr ? 'فشل تسجيل الشركة. يرجى مراجعة البيانات.' : 'Failed to register company.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* ============================================================
          STEP PROGRESS TRACKER
          ============================================================ */}
      <div className="mb-10">
        <div className="flex items-center justify-between max-w-xl mx-auto relative">
          <div className="absolute top-1/2 inset-x-8 -translate-y-1/2 h-0.5 bg-slate-200 -z-10" />

          {/* Step 1: User Account */}
          <div className="flex flex-col items-center gap-1.5 bg-[#F4F7FB] px-2">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <CheckCircle2 size={18} />
            </div>
            <span className="text-[11px] font-bold text-emerald-700">
              {isAr ? 'الحساب الشخصي' : 'Account'}
            </span>
          </div>

          {/* Step 2: Company Profile (Active) */}
          <div className="flex flex-col items-center gap-1.5 bg-[#F4F7FB] px-2">
            <div className="w-9 h-9 rounded-full bg-[#06245B] text-white flex items-center justify-center font-bold text-xs shadow-md ring-4 ring-[#00D9F5]/30">
              2
            </div>
            <span className="text-[11px] font-extrabold text-[#06245B]">
              {isAr ? 'بيانات الشركة' : 'Company Profile'}
            </span>
          </div>

          {/* Step 3: Verification Documents */}
          <div className="flex flex-col items-center gap-1.5 bg-[#F4F7FB] px-2">
            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {isAr ? 'التدقيق القانوني' : 'Verification'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================
          INTENT WELCOME BANNER
          ============================================================ */}
      <div className="bg-gradient-to-r from-[#06245B] via-[#0A3078] to-[#1266D6] rounded-3xl p-6 text-white mb-8 shadow-lg flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
          {userIntent === 'buyer' ? (
            <Factory size={28} className="text-[#00D9F5]" />
          ) : userIntent === 'supplier' ? (
            <Building2 size={28} className="text-[#00D9F5]" />
          ) : (
            <Layers size={28} className="text-[#00D9F5]" />
          )}
        </div>
        <div>
          <div className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#00D9F5] mb-1">
            <Sparkles size={13} />
            <span>
              {userIntent === 'buyer'
                ? isAr ? 'إعداد ملف المصنع / المشتري' : 'Factory / Buyer Profile Setup'
                : userIntent === 'supplier'
                ? isAr ? 'إعداد ملف المورد / الموزع' : 'Supplier / Distributor Profile Setup'
                : isAr ? 'إعداد ملف المنشأة الصناعية المزدوجة' : 'Dual Enterprise Profile Setup'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold">
            {isAr ? 'سجل بيانات شركتك لبدء التجارة المعتمدة' : 'Register Your Enterprise Credentials'}
          </h1>
          <p className="text-xs text-slate-200 mt-1">
            {isAr
              ? 'تُحفظ البيانات الضريبية والتجارية بسرية تامة ولا تُشارك إلا لإبرام الصفقات المعتمدة.'
              : 'Legal tax identifiers remain strictly protected under multi-tenant isolation policies.'}
          </p>
        </div>
      </div>

      {/* ============================================================
          MAIN ONBOARDING FORM
          ============================================================ */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Business Identity */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Building2 size={18} className="text-[#1266D6]" />
              <h2 className="text-base font-extrabold text-[#06245B]">
                {isAr ? '1. الهوية التجارية للشركة' : '1. Corporate Identity'}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Input
                {...register('legalName')}
                label={t('company.legalName')}
                placeholder={isAr ? 'شركة الأهرام للصناعات الكيماوية ش.م.م' : 'Al-Ahram Industrial Chemicals S.A.E'}
                error={errors.legalName?.message}
                required
              />
              <Input
                {...register('tradeName')}
                label={t('company.tradeName')}
                placeholder={isAr ? 'الأهرام كيم' : 'Ahram Chem'}
                error={errors.tradeName?.message}
                required
              />
            </div>

            {/* Industry Sector with Quick Selection Chips */}
            <div>
              <Input
                {...register('industrySector')}
                label={t('company.sector')}
                placeholder={isAr ? 'حدد القطاع الصناعي (مثال: كيماويات)' : 'Select or type sector (e.g. Metallurgy)'}
                error={errors.industrySector?.message}
                required
              />

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 me-1">
                  {isAr ? 'اقتراحات شائعة:' : 'Quick Select:'}
                </span>
                {commonSectors.map((sec, i) => {
                  const val = isAr ? sec.ar : sec.en
                  const isSelected = currentSector === val

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setValue('industrySector', val, { shouldValidate: true })}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-[#06245B] text-white border-[#06245B] font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-[#1266D6]'
                      }`}
                    >
                      {val}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Official Registration & Tax Identifiers */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <FileText size={18} className="text-[#1266D6]" />
              <h2 className="text-base font-extrabold text-[#06245B]">
                {isAr ? '2. بيانات السجل التجاري والبطاقة الضريبية' : '2. Legal Tax & Commercial Identifiers'}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                {...register('commercialRegistrationNumber')}
                label={isAr ? 'رقم السجل التجاري' : 'Commercial Registration (CR) Number'}
                placeholder="123456"
                error={errors.commercialRegistrationNumber?.message}
                required
              />
              <Input
                {...register('taxIdNumber')}
                label={isAr ? 'رقم البطاقة الضريبية / التسجيل الضريبي' : 'Tax Identification (TIN) Number'}
                placeholder="987-654-321"
                error={errors.taxIdNumber?.message}
                required
              />
            </div>
          </div>

          {/* Section 3: Head Office & Location */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <MapPin size={18} className="text-[#1266D6]" />
              <h2 className="text-base font-extrabold text-[#06245B]">
                {isAr ? '3. المقر الرئيسي والعنوان الصناعي' : '3. Industrial Address & Location'}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Input
                {...register('governorate')}
                label={t('company.governorate')}
                placeholder={isAr ? 'الشرقية' : 'Sharqia'}
                error={errors.governorate?.message}
                required
              />
              <Input
                {...register('city')}
                label={t('company.city')}
                placeholder={isAr ? 'العاشر من رمضان' : '10th of Ramadan'}
                error={errors.city?.message}
                required
              />
            </div>

            <Input
              {...register('addressLine1')}
              label={t('company.address')}
              placeholder={isAr ? 'المنطقة الصناعية الثالثة، مجمع المصانع، مصنع رقم 14' : 'Industrial Zone B3, Block 14'}
              error={errors.addressLine1?.message}
              required
            />
          </div>

          {/* Section 4: Corporate Communications */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <Mail size={18} className="text-[#1266D6]" />
              <h2 className="text-base font-extrabold text-[#06245B]">
                {isAr ? '4. قنوات الاتصال الرسمية للشركة' : '4. Corporate Communications'}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <Input
                {...register('corporateEmail')}
                type="email"
                label={t('company.email')}
                placeholder="procurement@company.com"
                startIcon={<Mail size={16} />}
                error={errors.corporateEmail?.message}
                required
              />
              <Input
                {...register('corporatePhone')}
                type="tel"
                label={t('company.phone')}
                placeholder="+20 15 xxx xxxx"
                startIcon={<Phone size={16} />}
                error={errors.corporatePhone?.message}
                required
              />
            </div>

            <Input
              {...register('website')}
              type="url"
              label={t('company.website')}
              placeholder="https://company.com"
              startIcon={<Globe size={16} />}
              error={errors.website?.message}
            />

            <div className="mt-4">
              <Textarea
                {...register('description')}
                label={t('company.description')}
                placeholder={isAr ? 'نبذة عن الطاقة الإنتاجية أو مجالات التوريد والتوزيع...' : 'Overview of manufacturing capacity or distribution specialties...'}
                rows={3}
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full sm:w-auto font-bold shadow-lg shadow-cyan-500/25 px-8"
            >
              {isAr ? 'حفظ ومتابعة رفع المستندات' : 'Save & Proceed to Documents'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
