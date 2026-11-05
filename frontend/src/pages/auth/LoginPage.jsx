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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const toast = useToast()
  const { setUser, setTokens } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const authResponse = await authService.login(data)
      setTokens(authResponse.accessToken, authResponse.refreshToken)
      const user = await authService.me()
      setUser(user)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err?.problem?.detail || 'Login failed. Please check your credentials.')
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

