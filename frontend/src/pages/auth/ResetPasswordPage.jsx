import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService } from '../../shared/api/services/authService'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../../components/ui/Button'
import Logo from '../../components/common/Logo'
import Input from '../../components/ui/Input'

const schema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function ResetPasswordPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [apiError, setApiError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const email = params.get('email') || ''
  const token = params.get('token') || ''

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  if (!email || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[#EF4444] mb-4">
            {isAr ? 'رابط إعادة التعيين غير صالح.' : 'Invalid reset link.'}
          </p>
          <Link to="/forgot-password">
            <Button variant="primary">
              {isAr ? 'طلب رابط جديد' : 'Request New Link'}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (data) => {
    setLoading(true)
    setApiError('')
    try {
      await authService.resetPassword(email, token, data.newPassword)
      setSuccess(true)
    } catch (err) {
      setApiError(err?.problem?.detail || (isAr ? 'فشل إعادة التعيين' : 'Reset failed. The link may have expired.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[rgba(6,36,91,0.06)]">
          <div className="flex justify-center mb-6">
            <Logo size="md" link={true} />
          </div>

          {success ? (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-[#D1FAE5] rounded-2xl flex items-center justify-center">
                <CheckCircle size={36} className="text-[#10B981]" />
              </div>
              <h1 className="text-2xl font-bold text-[#06245B] text-center mb-2">
                {isAr ? 'تم التغيير بنجاح!' : 'Password Reset!'}
              </h1>
              <p className="text-[#64748B] text-center mb-8 text-sm">
                {isAr ? 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.' : 'You can now log in with your new password.'}
              </p>
              <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
                {isAr ? 'تسجيل الدخول' : 'Go to Login'}
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-[#06245B] rounded-2xl flex items-center justify-center">
                <Lock size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#06245B] text-center mb-2">
                {isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
              </h1>
              <p className="text-[#64748B] text-center mb-8 text-sm">
                {isAr ? `إعادة تعيين كلمة المرور لـ ${email}` : `Reset password for ${email}`}
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    label={isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                    {...register('newPassword')}
                    error={errors.newPassword?.message}
                    startIcon={<Lock size={18} />}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute end-3 top-9 p-1 text-[#64748B] hover:text-[#06245B] transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <Input
                  type="password"
                  label={isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  startIcon={<Lock size={18} />}
                  autoComplete="new-password"
                />

                {apiError && (
                  <p className="text-[#EF4444] text-sm text-center">{apiError}</p>
                )}

                <Button type="submit" variant="primary" fullWidth loading={loading}>
                  {isAr ? 'تعيين كلمة المرور' : 'Reset Password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
