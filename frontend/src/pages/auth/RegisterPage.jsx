import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Phone, Factory, Building2, Layers, Eye, EyeOff, ShieldCheck, TrendingUp, Handshake } from 'lucide-react'
import { authService } from '../../shared/api/services/authService'
import { useToast } from '../../hooks/useToast'
import { useTranslation } from '../../hooks/useTranslation'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import Logo from '../../components/common/Logo'
import { getRegisterSchema } from '../../shared/validation/formSchemas'

// Schema is dynamically generated using getRegisterSchema(isAr)

const trustPoints = [
  {
    icon: ShieldCheck,
    en: 'Verified B2B companies only — no anonymous accounts',
    ar: 'شركات موثقة فقط — لا حسابات مجهولة',
  },
  {
    icon: TrendingUp,
    en: 'Access Egypt\'s largest raw materials supplier network',
    ar: 'الوصول إلى أكبر شبكة موردي مواد خام في مصر',
  },
  {
    icon: Handshake,
    en: 'Secure RFQ, tendering & direct deal execution',
    ar: 'تقديم العطاءات وإبرام الصفقات بأمان تام',
  },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { t, language } = useTranslation()
  const isAr = language === 'ar'
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [accountIntent, setAccountIntent] = useState('buyer') // 'buyer' | 'supplier' | 'dual'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(getRegisterSchema(isAr)),
    mode: 'onChange',
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      localStorage.setItem('dz_user_intent', accountIntent)
      const { confirmPassword: _, ...payload } = data
      const res = await authService.register(payload)
      toast.success(
        isAr
          ? 'تم إنشاء الحساب! يرجى مراجعة بريدك الإلكتروني للتأكيد.'
          : 'Account created! Please check your email to verify.',
      )
      const token = res?.confirmationToken
      if (token) {
        navigate(`/confirm-email?email=${encodeURIComponent(data.email)}&token=${encodeURIComponent(token)}`)
      } else {
        navigate(`/confirm-email?email=${encodeURIComponent(data.email)}`)
      }
    } catch (err) {
      setErrorMsg(
        err?.problem?.detail ||
          (isAr ? 'فشل إنشاء الحساب. حاول مجدداً.' : 'Registration failed. Please try again.'),
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/images/hero-landing.jpeg"
          alt="DealZone industrial marketplace"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#06245B]/95 via-[#0A3078]/88 to-[#1266D6]/80" />

        <div className="relative z-10 p-12 flex flex-col justify-between h-full text-white">
          {/* Logo + tagline */}
          <div>
            <Logo size="lg" variant="white" link={false} />
            <p className="mt-4 text-sm font-medium text-[#00D9F5]">
              {isAr ? 'منصة B2B الصناعية الرائدة في مصر' : "Egypt's Premier Industrial B2B Marketplace"}
            </p>
          </div>

          {/* Trust bullets */}
          <div className="space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-snug text-white">
              {isAr ? (
                <>
                  ابدأ تجارتك الصناعية <br />
                  <span className="text-[#00D9F5]">بثقة واحترافية</span>
                </>
              ) : (
                <>
                  Start trading with <br />
                  <span className="text-[#00D9F5]">trust & confidence</span>
                </>
              )}
            </h2>
            <ul className="space-y-4">
              {trustPoints.map(({ icon: Icon, en, ar }) => (
                <li key={en} className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#00D9F5]/20 border border-[#00D9F5]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} className="text-[#00D9F5]" />
                  </span>
                  <span className="text-sm text-slate-200 leading-snug">{isAr ? ar : en}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer note */}
          <p className="text-xs text-slate-400">
            {isAr
              ? '© 2025 DealZone — جميع البيانات محمية بتشفير متقدم'
              : '© 2025 DealZone — All data protected with enterprise-grade encryption'}
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F4F7FB] overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Logo size="lg" link={true} />
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-slate-200/80">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#06245B] text-center mb-1 tracking-tight">
              {isAr ? 'أنشئ حسابك' : 'Create your account'}
            </h1>
            <p className="text-sm text-[#64748B] text-center mb-7">
              {isAr
                ? 'انضم إلى أكبر شبكة صناعية لموردي المواد الخام في مصر'
                : "Join Egypt's premier B2B industrial raw materials marketplace"}
            </p>

            {/* Account Intent Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-[#06245B] mb-2 uppercase tracking-wider">
                {isAr ? 'ما هو النشاط الأساسي لشركتك؟' : 'Primary Business Activity'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'buyer', Icon: Factory, en: 'Buyer / Factory', ar: 'مشتري / مصنع', sub: { en: 'Procure Raw Materials', ar: 'شراء خامات' } },
                  { key: 'supplier', Icon: Building2, en: 'Raw Supplier', ar: 'مورد خامات', sub: { en: 'Supply & Quoting', ar: 'توريد وبيع' } },
                  { key: 'dual', Icon: Layers, en: 'Dual Enterprise', ar: 'كلاهما', sub: { en: 'Buy & Sell', ar: 'شراء وتوزيع' } },
                ].map(({ key, Icon, en, ar, sub }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAccountIntent(key)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      accountIntent === key
                        ? 'border-[#1266D6] bg-[#EAF4FF] text-[#06245B] shadow-sm ring-2 ring-[#1266D6]/20'
                        : 'border-slate-200 hover:border-slate-300 text-[#64748B] bg-[#F4F7FB]/50'
                    }`}
                  >
                    <Icon size={20} className={accountIntent === key ? 'text-[#1266D6]' : 'text-[#64748B]'} />
                    <span className="text-xs font-bold leading-tight">{isAr ? ar : en}</span>
                    <span className="text-[10px] text-slate-500 leading-none">{isAr ? sub.ar : sub.en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error alert */}
            {errorMsg && (
              <Alert type="error" dismissible onDismiss={() => setErrorMsg('')} className="mb-5">
                {errorMsg}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                {...register('fullName')}
                label={isAr ? 'الاسم الكامل' : 'Full Name'}
                placeholder="Ahmed Hassan"
                startIcon={<User size={18} />}
                error={errors.fullName?.message}
                required
                autoComplete="name"
              />

              <Input
                {...register('email')}
                type="email"
                label={isAr ? 'البريد الإلكتروني' : 'Email Address'}
                placeholder="ahmed@company.com"
                startIcon={<Mail size={18} />}
                error={errors.email?.message}
                required
                autoComplete="email"
              />

              <Input
                {...register('phoneNumber')}
                type="tel"
                label={isAr ? 'رقم الهاتف' : 'Phone Number'}
                placeholder="+20 1xx xxx xxxx"
                startIcon={<Phone size={18} />}
                error={errors.phoneNumber?.message}
                autoComplete="tel"
              />

              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label={isAr ? 'كلمة المرور' : 'Password'}
                placeholder="••••••••"
                startIcon={<Lock size={18} />}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-[#64748B] hover:text-[#06245B] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                error={errors.password?.message}
                required
                autoComplete="new-password"
              />

              <Input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                label={isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                placeholder="••••••••"
                startIcon={<Lock size={18} />}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="text-[#64748B] hover:text-[#06245B] transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                error={errors.confirmPassword?.message}
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
                {isAr ? 'إنشاء الحساب' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-[#64748B]">
              {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              <Link to="/login" className="text-[#1266D6] font-bold hover:text-[#06245B] transition-colors">
                {isAr ? 'تسجيل الدخول' : 'Sign in'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
