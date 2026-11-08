import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock } from 'lucide-react'
import { authService } from '../../shared/api/services/authService'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../hooks/useToast'
import { useTranslation } from '../../hooks/useTranslation'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Logo from '../../components/common/Logo'
import { getLoginSchema } from '../../shared/validation/formSchemas'

// Schema dynamically loaded via getLoginSchema(isAr)

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const toast = useToast()
  const { setUser, setTokens } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('')

  const { language } = useTranslation()
  const isAr = language === 'ar'
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(getLoginSchema(isAr)),
    mode: 'onChange',
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    setErrorMsg('')
    setUnconfirmedEmail('')
    try {
      const authResponse = await authService.login(data)
      setTokens(authResponse.accessToken, authResponse.refreshToken)
      const user = await authService.me()
      setUser(user)
      toast.success(user.isSystemAdmin ? 'Welcome to Admin Portal!' : 'Welcome back!')
      if (user.isSystemAdmin) {
        navigate('/admin/verification')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      const msg = err?.problem?.detail || err?.message || 'Login failed. Please check your credentials.'
      setErrorMsg(msg)
      if (msg.toLowerCase().includes('confirm your email') || msg.toLowerCase().includes('not confirmed')) {
        setUnconfirmedEmail(data.email)
      }
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[rgba(6,36,91,0.06)]">
          {/* Official Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="lg" link={true} />
          </div>

          <h1 className="text-2xl font-bold text-[#06245B] text-center mb-2">
            {t('auth.login.title')}
          </h1>
          <p className="text-sm text-[#64748B] text-center mb-8">
            {t('auth.login.subtitle')}
          </p>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-[#FEE2E2] border border-[#EF4444]/20 text-[#EF4444] text-sm">
              <p>{errorMsg}</p>
              {unconfirmedEmail && (
                <Link
                  to={`/confirm-email?email=${encodeURIComponent(unconfirmedEmail)}`}
                  className="mt-2 inline-block font-semibold text-[#1266D6] hover:underline"
                >
                  {t('auth.login.confirmEmailLink') || 'Click here to confirm your email'}
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register('email')}
              type="email"
              label={t('auth.login.email')}
              placeholder="you@company.com"
              startIcon={<Mail size={18} />}
              error={errors.email?.message}
              required
              autoComplete="email"
            />

            <Input
              {...register('password')}
              type="password"
              label={t('auth.login.password')}
              placeholder="••••••••"
              startIcon={<Lock size={18} />}
              error={errors.password?.message}
              required
              autoComplete="current-password"
            />

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-[#1266D6] hover:text-[#06245B] transition-colors"
              >
                {t('auth.login.forgot')}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            >
              {t('auth.login.submit')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[#64748B]">
            {t('auth.login.noAccount')}{' '}
            <Link
              to="/register"
              className="text-[#1266D6] font-semibold hover:text-[#06245B] transition-colors"
            >
              {t('auth.login.register')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

