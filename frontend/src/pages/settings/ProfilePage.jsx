import { useState, useEffect } from 'react'
import {
  Mail,
  Phone,
  Building2,
  Shield,
  User,
  Edit2,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../hooks/useTranslation'
import { useToast } from '../../hooks/useToast'
import { authService } from '../../shared/api/services/authService'
import { Card, CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { verificationStatusVariant } from '../../utils/format'

export default function ProfilePage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const toast = useToast()

  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState({})

  // Initialize form state when user changes or edit mode opens
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '')
      setPhoneNumber(user.phoneNumber || '')
      setErrors({})
    }
  }, [user, isEditing])

  if (!user) {
    return (
      <div className="text-center py-16 text-[#64748B]">
        {isAr ? 'جاري تحميل الملف الشخصي…' : 'Loading profile…'}
      </div>
    )
  }

  const company = user.company

  const validate = () => {
    const errs = {}
    if (!fullName.trim()) {
      errs.fullName = isAr ? 'الاسم الكامل مطلوب' : 'Full name is required'
    } else if (fullName.trim().length < 2 || fullName.trim().length > 150) {
      errs.fullName = isAr
        ? 'يجب أن يكون الاسم بين 2 و150 حرفاً'
        : 'Full name must be between 2 and 150 characters'
    }

    if (phoneNumber && phoneNumber.trim().length > 30) {
      errs.phoneNumber = isAr
        ? 'رقم الهاتف يجب ألا يتجاوز 30 حرفاً'
        : 'Phone number must not exceed 30 characters'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSaving(true)
    try {
      const updatedProfile = await authService.updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || null,
      })

      // Update local auth store user
      setUser({
        ...user,
        ...updatedProfile,
      })

      toast.success(
        isAr ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully'
      )
      setIsEditing(false)
    } catch (err) {
      toast.error(
        err?.problem?.detail ||
          err?.message ||
          (isAr ? 'فشل تحديث الملف الشخصي' : 'Failed to update profile')
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFullName(user.fullName || '')
    setPhoneNumber(user.phoneNumber || '')
    setErrors({})
    setIsEditing(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#06245B]">
          {isAr ? 'الملف الشخصي' : 'My Profile'}
        </h1>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader
          title={isAr ? 'بيانات الحساب الشخصي' : 'Account Information'}
          action={
            !isEditing ? (
              <Button
                variant="ghost"
                size="xs"
                icon={<Edit2 size={14} />}
                onClick={() => setIsEditing(true)}
              >
                {isAr ? 'تعديل البيانات' : 'Edit Profile'}
              </Button>
            ) : null
          }
        />

        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#06245B] flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {user.fullName?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-[#06245B] truncate">
                  {user.fullName}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {user.isSystemAdmin && (
                    <Badge variant="cyan" dot>
                      {isAr ? 'مدير النظام' : 'System Admin'}
                    </Badge>
                  )}
                  {company?.role && (
                    <Badge variant="navy">
                      {company.role === 'Admin'
                        ? isAr ? 'مسؤول الشركة' : 'Company Admin'
                        : company.role}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[rgba(6,36,91,0.06)]">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-[#64748B] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[#64748B] text-xs">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </p>
                  <p className="text-[#1E293B] font-medium truncate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-[#64748B] shrink-0" />
                <div className="min-w-0">
                  <p className="text-[#64748B] text-xs">
                    {isAr ? 'رقم الهاتف' : 'Phone'}
                  </p>
                  <p className="text-[#1E293B] font-medium">
                    {user.phoneNumber || (isAr ? 'غير محدد' : 'Not set')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Shield
                size={14}
                className={user.emailConfirmed ? 'text-[#10B981]' : 'text-[#F59E0B]'}
              />
              <span className="text-xs text-[#64748B]">
                {user.emailConfirmed
                  ? isAr ? 'البريد الإلكتروني موثّق' : 'Email verified'
                  : isAr ? 'البريد الإلكتروني غير موثّق' : 'Email not verified'}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label={isAr ? 'الاسم الكامل' : 'Full Name'}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
              leftIcon={<User size={16} />}
              required
              disabled={isSaving}
              autoFocus
            />

            <Input
              label={isAr ? 'رقم الهاتف' : 'Phone Number'}
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              error={errors.phoneNumber}
              leftIcon={<Phone size={16} />}
              helperText={
                isAr
                  ? 'رقم هاتف مسؤول الاتصال بالشركة للتنسيق'
                  : 'Contact phone number for logistics and operational coordination'
              }
              disabled={isSaving}
            />

            <Input
              label={isAr ? 'البريد الإلكتروني (غير قابل للتعديل)' : 'Email Address (Read-only)'}
              type="email"
              value={user.email}
              leftIcon={<Mail size={16} />}
              disabled
              helperText={
                isAr
                  ? 'لا يمكن تغيير البريد الإلكتروني مباشرة لأسباب أمنية وتوثيقية'
                  : 'Email cannot be changed directly due to compliance and security policy'
              }
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(6,36,91,0.06)]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
                icon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              >
                {isSaving
                  ? isAr ? 'جاري الحفظ…' : 'Saving…'
                  : isAr ? 'حفظ التعديلات' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Company Summary */}
      {company && (
        <Card>
          <CardHeader
            title={isAr ? 'الشركة المسجلة' : 'Company'}
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
                <p className="text-[#64748B] text-xs">
                  {isAr ? 'الاسم التجاري / القانوني' : 'Trade / Legal Name'}
                </p>
                <p className="text-[#1E293B] font-medium">
                  {company.tradeName || company.legalName}
                </p>
              </div>
            </div>

            <div className="flex gap-3 text-xs text-[#64748B] flex-wrap">
              {company.city && (
                <span>📍 {company.city}{company.governorate ? `, ${company.governorate}` : ''}</span>
              )}
              {company.canPerformCommercialActivities && (
                <span className="text-[#10B981] font-medium">
                  {isAr
                    ? '✓ موثقة — العمليات والصفقات التجارية مفعلة'
                    : '✓ Verified — Commercial activities enabled'}
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {!company && (
        <Card>
          <div className="text-center py-6">
            <Building2 size={40} className="text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-[#64748B] text-sm">
              {isAr ? 'لا توجد شركة مسجلة حتى الآن' : 'No company registered yet'}
            </p>
            <a
              href="/onboarding/company"
              className="mt-3 inline-block text-sm text-[#1266D6] hover:text-[#06245B] font-medium"
            >
              {isAr ? 'تسجيل الشركة الآن ←' : 'Register your company →'}
            </a>
          </div>
        </Card>
      )}
    </div>
  )
}
