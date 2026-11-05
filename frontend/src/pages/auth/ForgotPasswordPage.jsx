import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { authService } from '../../shared/api/services/authService'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../../components/ui/Button'
import Logo from '../../components/common/Logo'
import Input from '../../components/ui/Input'

export default function ForgotPasswordPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      // Backend returns 200 regardless — but handle network errors
      setError(err?.problem?.detail || (isAr ? 'حدث خطأ. حاول مجدداً.' : 'An error occurred. Please try again.'))
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

          {sent ? (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-[#D1FAE5] rounded-2xl flex items-center justify-center">
                <CheckCircle size={36} className="text-[#10B981]" />
              </div>
              <h1 className="text-2xl font-bold text-[#06245B] text-center mb-2">
                {isAr ? 'تم الإرسال!' : 'Email Sent!'}
              </h1>
              <p className="text-[#64748B] text-center mb-8 text-sm">
                {isAr
                  ? `إذا كان الحساب موجوداً، سيصلك رابط إعادة تعيين كلمة المرور على ${email}`
                  : `If an account exists for ${email}, a password reset link has been sent.`}
              </p>
              <Link to="/login">
                <Button variant="outline" fullWidth icon={<ArrowLeft size={16} />}>
                  {isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-[#06245B] rounded-2xl flex items-center justify-center">
                <Mail size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#06245B] text-center mb-2">
                {isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
              </h1>
              <p className="text-[#64748B] text-center mb-8 text-sm">
                {isAr
                  ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.'
                  : "Enter your email and we'll send you a reset link."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  label={isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  startIcon={<Mail size={18} />}
                  required
                  autoComplete="email"
                />

                {error && (
                  <p className="text-[#EF4444] text-sm text-center">{error}</p>
                )}

                <Button type="submit" variant="primary" fullWidth loading={loading}>
                  {isAr ? 'إرسال رابط الإعادة' : 'Send Reset Link'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-[#1266D6] hover:text-[#06245B] transition-colors"
                >
                  <ArrowLeft size={14} />
                  {isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
