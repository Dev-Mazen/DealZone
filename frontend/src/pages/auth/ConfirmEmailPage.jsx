import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, Mail, ArrowLeft } from 'lucide-react'
import { authService } from '../../shared/api/services/authService'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { PageSpinner } from '../../components/ui/Spinner'

export default function ConfirmEmailPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') || ''
  const token = params.get('token') || ''
  const [step, setStep] = useState(!email || !token ? 'resend' : 'confirming')
  const [errorMsg, setErrorMsg] = useState('')
  const [resendEmail, setResendEmail] = useState(params.get('email') || '')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  useEffect(() => {
    if (!email || !token) return

    authService
      .confirmEmail(email, token)
      .then(() => setStep('success'))
      .catch((err) => {
        setErrorMsg(err.problem?.detail || (isAr ? 'فشل تأكيد البريد الإلكتروني' : 'Email confirmation failed'))
        setStep('error')
      })
  }, [email, token, isAr])

  const handleResend = async () => {
    if (!resendEmail) return
    setResendLoading(true)
    try {
      await authService.resendConfirmation(resendEmail)
      setResendSent(true)
    } catch (err) {
      setErrorMsg(err?.problem?.detail || (isAr ? 'فشل إعادة الإرسال' : 'Failed to resend'))
    } finally {
      setResendLoading(false)
    }
  }

  if (step === 'confirming') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <PageSpinner />
          <p className="text-[#64748B] mt-4">{isAr ? 'جاري تأكيد بريدك الإلكتروني...' : 'Confirming your email...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[rgba(6,36,91,0.06)]">

          {step === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-[#D1FAE5] rounded-2xl flex items-center justify-center">
                <CheckCircle size={36} className="text-[#10B981]" />
              </div>
              <h1 className="text-2xl font-bold text-[#06245B] text-center mb-2">
                {isAr ? 'تم التأكيد بنجاح!' : 'Email Confirmed!'}
              </h1>
              <p className="text-[#64748B] text-center mb-8 text-sm">
                {isAr
                  ? 'تم تأكيد بريدك الإلكتروني. يمكنك الآن تسجيل الدخول.'
                  : 'Your email has been confirmed. You can now log in.'}
              </p>
              <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
                {isAr ? 'تسجيل الدخول' : 'Go to Login'}
              </Button>
            </>
          )}

          {step === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-[#FEE2E2] rounded-2xl flex items-center justify-center">
                <AlertCircle size={36} className="text-[#EF4444]" />
              </div>
              <h1 className="text-2xl font-bold text-[#06245B] text-center mb-2">
                {isAr ? 'فشل التأكيد' : 'Confirmation Failed'}
              </h1>
              <p className="text-[#64748B] text-center mb-6 text-sm">{errorMsg}</p>
              <div className="space-y-3">
                <Button variant="primary" fullWidth onClick={() => setStep('resend')}>
                  {isAr ? 'إعادة إرسال رابط التأكيد' : 'Resend Confirmation'}
                </Button>
                <Link to="/login">
                  <Button variant="ghost" fullWidth icon={<ArrowLeft size={16} />}>
                    {isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                  </Button>
                </Link>
              </div>
            </>
          )}

          {step === 'resend' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-[#EAF4FF] rounded-2xl flex items-center justify-center">
                <Mail size={36} className="text-[#1266D6]" />
              </div>
              <h1 className="text-2xl font-bold text-[#06245B] text-center mb-2">
                {isAr ? 'تأكيد البريد الإلكتروني' : 'Confirm Your Email'}
              </h1>

              {resendSent ? (
                <div className="text-center">
                  <p className="text-[#10B981] font-medium mb-4">
                    {isAr ? 'تم إرسال رابط التأكيد!' : 'Confirmation link sent!'}
                  </p>
                  <p className="text-sm text-[#64748B]">
                    {isAr ? 'تحقق من صندوق الوارد الخاص بك.' : 'Check your inbox.'}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[#64748B] text-center mb-6 text-sm">
                    {isAr
                      ? 'أدخل بريدك الإلكتروني لإعادة إرسال رابط التأكيد.'
                      : 'Enter your email to resend the confirmation link.'}
                  </p>
                  <div className="space-y-4">
                    <Input
                      type="email"
                      label={isAr ? 'البريد الإلكتروني' : 'Email Address'}
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="you@company.com"
                    />
                    <Button
                      variant="primary"
                      fullWidth
                      loading={resendLoading}
                      onClick={handleResend}
                      disabled={!resendEmail}
                    >
                      {isAr ? 'إعادة الإرسال' : 'Resend Confirmation'}
                    </Button>
                  </div>
                  {errorMsg && (
                    <p className="text-[#EF4444] text-sm text-center mt-3">{errorMsg}</p>
                  )}
                </>
              )}

              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-[#1266D6] hover:text-[#06245B] transition-colors">
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
