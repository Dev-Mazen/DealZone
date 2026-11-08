import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, Mail, ArrowLeft, KeyRound, Send } from 'lucide-react'
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
  const urlEmail = params.get('email') || ''
  const urlToken = params.get('token') || ''

  const [step, setStep] = useState(urlEmail && urlToken ? 'confirming' : 'manual')
  const [emailInput, setEmailInput] = useState(urlEmail)
  const [tokenInput, setTokenInput] = useState(urlToken)
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccessMsg, setResendSuccessMsg] = useState('')

  // Automatic confirmation if both email and token are in URL parameters
  useEffect(() => {
    if (!urlEmail || !urlToken) return

    setStep('confirming')
    authService
      .confirmEmail(urlEmail, urlToken)
      .then(() => setStep('success'))
      .catch((err) => {
        setErrorMsg(
          err?.problem?.detail ||
            err?.message ||
            (isAr ? 'فشل تأكيد البريد الإلكتروني. الرمز قد يكون غير صالح أو منتهي الصلاحية.' : 'Email confirmation failed. The token may be invalid or expired.')
        )
        setStep('manual')
      })
  }, [urlEmail, urlToken, isAr])

  const handleManualConfirm = async (e) => {
    if (e) e.preventDefault()
    if (!emailInput.trim() || !tokenInput.trim()) return

    setConfirmLoading(true)
    setErrorMsg('')
    setResendSuccessMsg('')
    try {
      await authService.confirmEmail(emailInput.trim(), tokenInput.trim())
      setStep('success')
    } catch (err) {
      setErrorMsg(
        err?.problem?.detail ||
          err?.message ||
          (isAr ? 'رمز التأكيد غير صالح أو منتهي الصلاحية.' : 'Invalid or expired confirmation token.')
      )
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleResend = async () => {
    if (!emailInput.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال البريد الإلكتروني أولاً.' : 'Please enter your email address first.')
      return
    }

    setResendLoading(true)
    setErrorMsg('')
    setResendSuccessMsg('')
    try {
      const res = await authService.resendConfirmation(emailInput.trim())
      setResendSuccessMsg(
        res?.message ||
          (isAr
            ? 'تم إرسال رسالة ورمز تأكيد جديد. تفقد صندوق الوارد أو البريد غير المرغوب به (Spam).'
            : 'A new confirmation email has been dispatched. Check your inbox or spam folder.')
      )
    } catch (err) {
      setErrorMsg(
        err?.problem?.detail ||
          err?.message ||
          (isAr ? 'فشل إرسال رسالة التأكيد. تأكد من إعدادات البريد أو اتصل بالدعم.' : 'Failed to send confirmation email. Check email configuration.')
      )
    } finally {
      setResendLoading(false)
    }
  }

  if (step === 'confirming') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-[rgba(6,36,91,0.06)] max-w-sm w-full mx-4">
          <PageSpinner />
          <h2 className="text-lg font-bold text-[#06245B] mt-4 mb-1">
            {isAr ? 'جاري التحقق من بريدك الإلكتروني...' : 'Confirming your email...'}
          </h2>
          <p className="text-xs text-[#64748B]">
            {isAr ? 'يرجى الانتظار لحظة واحدة' : 'Please wait a moment'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F8FAFC]" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[rgba(6,36,91,0.06)]">
          {step === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#D1FAE5] rounded-2xl flex items-center justify-center">
                <CheckCircle size={36} className="text-[#10B981]" />
              </div>
              <h1 className="text-2xl font-bold text-[#06245B] mb-2">
                {isAr ? 'تم تأكيد البريد الإلكتروني بنجاح!' : 'Email Confirmed Successfully!'}
              </h1>
              <p className="text-[#64748B] mb-8 text-sm">
                {isAr
                  ? 'تم تفعيل حسابك التجاري في ديل زون. يمكنك الآن تسجيل الدخول والبدء في استخدام المنصة.'
                  : 'Your DealZone account has been verified and activated. You can now log in.'}
              </p>
              <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
                {isAr ? 'الانتقال إلى تسجيل الدخول' : 'Go to Login'}
              </Button>
            </div>
          )}

          {step === 'manual' && (
            <div>
              <div className="w-14 h-14 mx-auto mb-5 bg-[#EAF4FF] rounded-2xl flex items-center justify-center text-[#1266D6]">
                <Mail size={30} />
              </div>

              <h1 className="text-2xl font-bold text-[#06245B] text-center mb-2">
                {isAr ? 'تأكيد الحساب عبر البريد' : 'Email Verification'}
              </h1>

              <p className="text-[#64748B] text-center text-xs mb-6 max-w-sm mx-auto leading-relaxed">
                {isAr
                  ? 'أدخل رمز التحقق المرسل إلى بريدك الإلكتروني لإكمال التفعيل، أو انقر على رابط التأكيد في الرسالة.'
                  : 'Enter the verification token received in your email or click the link in the message.'}
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-[#DC2626]">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}

              {resendSuccessMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-[#059669]">
                  <CheckCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-snug">{resendSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleManualConfirm} className="space-y-4">
                <Input
                  type="email"
                  label={isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@company.com"
                  required
                />

                <Input
                  label={isAr ? 'رمز التأكيد (Verification Token / Code)' : 'Confirmation Token / Code'}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder={isAr ? 'الصق رمز التأكيد هنا...' : 'Paste confirmation token here...'}
                  icon={<KeyRound size={16} className="text-[#94A3B8]" />}
                  required
                />

                <Button
                  variant="primary"
                  fullWidth
                  type="submit"
                  loading={confirmLoading}
                  disabled={!emailInput.trim() || !tokenInput.trim()}
                >
                  {isAr ? 'تأكيد الحساب وتفعيله' : 'Confirm & Activate Account'}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-[rgba(6,36,91,0.06)]">
                <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
                  <span>{isAr ? 'لم يصلك البريد؟' : "Didn't receive the email?"}</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || !emailInput.trim()}
                    className="font-semibold text-[#1266D6] hover:text-[#06245B] transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    <Send size={12} />
                    {resendLoading ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'إعادة إرسال البريد' : 'Resend Email')}
                  </button>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  {isAr
                    ? 'تأكد من فحص مجلد الرسائل غير المرغوب فيها (Spam / Junk).'
                    : 'Be sure to check your spam or junk folder.'}
                </p>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#06245B] transition-colors"
                >
                  <ArrowLeft size={14} className={isAr ? 'rotate-180' : ''} />
                  {isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
