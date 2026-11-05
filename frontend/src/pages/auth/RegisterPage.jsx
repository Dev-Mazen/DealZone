import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Phone, Factory, Building2, Layers } from 'lucide-react'
import { authService } from '../../shared/api/services/authService'
import { useToast } from '../../hooks/useToast'
import { useTranslation } from '../../hooks/useTranslation'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Logo from '../../components/common/Logo'

const registerSchema = z.object({
  fullName: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const { t, language } = useTranslation()
  const isAr = language === 'ar'
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [accountIntent, setAccountIntent] = useState('buyer') // 'buyer' | 'supplier' | 'dual'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      // Store intent locally to streamline post-registration onboarding
      localStorage.setItem('dz_user_intent', accountIntent)
      await authService.register(data)
      toast.success(
        isAr
          ? 'تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني للتأكيد.'
          : 'Account created successfully! Please check your email to verify.',
      )
      navigate('/login')
    } catch (err) {
      toast.error(err?.problem?.detail || (isAr ? 'فشل إنشاء الحساب. حاول مجدداً.' : 'Registration failed. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F4F7FB]">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-slate-200/80">
          {/* Official DealZone Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="lg" link={true} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] text-center mb-2 tracking-tight">
            {t('auth.register.title')}
          </h1>
          <p className="text-sm text-[#64748B] text-center mb-8">
            {isAr
              ? 'انضم إلى أكبر شبكة صناعية للمصانع وموردي المواد الخام في مصر'
              : 'Join Egypt’s premier B2B industrial raw materials marketplace'}
          </p>

          {/* Account Intent Selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-[#06245B] mb-2 uppercase tracking-wider">
              {isAr ? 'ما هو النشاط الأساسي لشركتك؟' : 'Primary Business Activity'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAccountIntent('buyer')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  accountIntent === 'buyer'
                    ? 'border-[#1266D6] bg-[#EAF4FF] text-[#06245B] shadow-xs ring-2 ring-[#1266D6]/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                }`}
              >
                <Factory size={20} className={accountIntent === 'buyer' ? 'text-[#1266D6]' : 'text-slate-400'} />
                <span className="text-xs font-bold leading-tight">
                  {isAr ? 'مشتري / مصنع' : 'Buyer / Factory'}
                </span>
                <span className="text-[10px] text-slate-500 leading-none">
                  {isAr ? 'شراء خامات' : 'Procure Raw Materials'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAccountIntent('supplier')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  accountIntent === 'supplier'
                    ? 'border-[#1266D6] bg-[#EAF4FF] text-[#06245B] shadow-xs ring-2 ring-[#1266D6]/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                }`}
              >
                <Building2 size={20} className={accountIntent === 'supplier' ? 'text-[#1266D6]' : 'text-slate-400'} />
                <span className="text-xs font-bold leading-tight">
                  {isAr ? 'مورد خامات' : 'Raw Supplier'}
                </span>
                <span className="text-[10px] text-slate-500 leading-none">
                  {isAr ? 'توريد وبيع' : 'Supply & Quoting'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAccountIntent('dual')}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  accountIntent === 'dual'
                    ? 'border-[#1266D6] bg-[#EAF4FF] text-[#06245B] shadow-xs ring-2 ring-[#1266D6]/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                }`}
              >
                <Layers size={20} className={accountIntent === 'dual' ? 'text-[#1266D6]' : 'text-slate-400'} />
                <span className="text-xs font-bold leading-tight">
                  {isAr ? 'كلاهما (شراء وتوريد)' : 'Dual Enterprise'}
                </span>
                <span className="text-[10px] text-slate-500 leading-none">
                  {isAr ? 'شراء وتوزيع' : 'Buy & Sell'}
                </span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register('fullName')}
              label={t('auth.register.fullName')}
              placeholder="Ahmed Hassan"
              startIcon={<User size={18} />}
              error={errors.fullName?.message}
              required
              autoComplete="name"
            />

            <Input
              {...register('email')}
              type="email"
              label={t('auth.register.email')}
              placeholder="ahmed@company.com"
              startIcon={<Mail size={18} />}
              error={errors.email?.message}
              required
              autoComplete="email"
            />

            <Input
              {...register('phoneNumber')}
              type="tel"
              label={t('auth.register.phone')}
              placeholder="+20 1xx xxx xxxx"
              startIcon={<Phone size={18} />}
              error={errors.phoneNumber?.message}
              autoComplete="tel"
            />

            <Input
              {...register('password')}
              type="password"
              label={t('auth.register.password')}
              placeholder="••••••••"
              startIcon={<Lock size={18} />}
              error={errors.password?.message}
              required
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              className="mt-6 font-bold shadow-lg shadow-cyan-500/20"
            >
              {t('auth.register.submit')}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-[#64748B]">
            {t('auth.register.hasAccount')}{' '}
            <Link
              to="/login"
              className="text-[#1266D6] font-bold hover:text-[#06245B] transition-colors"
            >
              {t('auth.register.login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
