import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, Mail, ArrowLeft, Send, ShieldCheck } from 'lucide-react'
import { authService } from '../../shared/api/services/authService'
import { useTranslation } from '../../hooks/useTranslation'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

const normalizeDigits = (str) => {
  if (!str) return ''
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return str.replace(/[٠-٩]/g, (d) => arabicDigits.indexOf(d).toString())
}

export default function ConfirmEmailPage() {
  const { language } = useTranslation()
  const isAr = language === 'ar'
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const urlEmail = params.get('email') || ''
  const urlToken = params.get('token') || ''

  // 'link-click' if urlToken is present, else 'code' or 'success'
  const [mode, setMode] = useState(urlToken ? 'link-click' : 'code')
  const [email, setEmail] = useState(urlEmail)
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

  const [errorMsg, setErrorMsg] = useState('')
  const [successNotice, setSuccessNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Auto-focus first digit on code mode
  useEffect(() => {
    if (mode === 'code' && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [mode])

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Handle 1-click token submission via POST
  const handleLinkConfirm = async () => {
    if (!urlToken) return
    setLoading(true)
    setErrorMsg('')
    try {
      await authService.confirmEmailLink(urlToken)
      setMode('success')
    } catch (err) {
      setErrorMsg(
        err?.problem?.detail ||
          err?.message ||
          (isAr
            ? 'رابط التأكيد غير صالح أو منتهي الصلاحية. يمكنك إدخال رمز التحقق المكون من 6 أرقام يدوياً.'
            : 'Invalid or expired confirmation link. You may enter your 6-digit code manually.')
      )
      setMode('code')
    } finally {
      setLoading(false)
    }
  }

  // Handle digit input change
  const handleDigitChange = (index, value) => {
    const normalized = normalizeDigits(value).replace(/\D/g, '')
    if (!normalized) {
      const updated = [...digits]
      updated[index] = ''
      setDigits(updated)
      return
    }

    const char = normalized.slice(-1)
    const updated = [...digits]
    updated[index] = char
    setDigits(updated)

    // Advance to next input
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }

    // If all 6 filled, auto submit
    const fullCode = updated.join('')
    if (fullCode.length === 6 && email.trim()) {
      submitCode(fullCode)
    }
  }

  // Handle backspace / arrows
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus()
      }
    } else if (e.key === 'ArrowLeft') {
      if (index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus()
      }
    } else if (e.key === 'ArrowRight') {
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus()
      }
    }
  }

  // Handle paste full code
  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = normalizeDigits(e.clipboardData.getData('text')).replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const updated = [...digits]
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i]
    }
    setDigits(updated)

    const nextFocus = Math.min(pasted.length, 5)
    if (inputRefs.current[nextFocus]) {
      inputRefs.current[nextFocus].focus()
    }

    if (pasted.length === 6 && email.trim()) {
      submitCode(pasted)
    }
  }

  const submitCode = async (overrideCode) => {
    const code = (overrideCode || digits.join('')).trim()
    if (!email.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال البريد الإلكتروني.' : 'Please enter your email address.')
      return
    }
    if (code.length !== 6) {
      setErrorMsg(isAr ? 'رمز التحقق يجب أن يتكون من 6 أرقام.' : 'Verification code must be 6 digits.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessNotice('')
    try {
      await authService.confirmEmailCode(email.trim(), code)
      setMode('success')
    } catch (err) {
      setErrorMsg(
        err?.problem?.detail ||
          err?.message ||
          (isAr ? 'رمز التحقق غير صالح أو انتهت صلاحيته.' : 'Invalid or expired verification code.')
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    if (!email.trim()) {
      setErrorMsg(isAr ? 'يرجى كتابة البريد الإلكتروني لإعادة إرسال الرمز.' : 'Please enter your email to resend code.')
      return
    }

    setResendLoading(true)
    setErrorMsg('')
    setSuccessNotice('')
    try {
      await authService.resendConfirmation(email.trim())
      setSuccessNotice(
        isAr
          ? 'تم إرسال رمز تحقق جديد بنجاح إلى بريدك الإلكتروني.'
          : 'A new verification code has been dispatched to your email.'
      )
      setCountdown(60)
    } catch (err) {
      setErrorMsg(
        err?.problem?.detail ||
          err?.message ||
          (isAr ? 'تعذر إرسال الرمز حالياً. يرجى الانتظار والمحاولة لاحقاً.' : 'Failed to resend confirmation email.')
      )
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F8FAFC]" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[rgba(6,36,91,0.06)]">
          {/* SUCCESS SCREEN */}
          {mode === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-[#D1FAE5] rounded-2xl flex items-center justify-center">
                <CheckCircle size={36} className="text-[#10B981]" />
              </div>
              <h1 className="text-2xl font-bold text-[#06245B] mb-2">
                {isAr ? 'تم تأكيد الحساب بنجاح!' : 'Email Confirmed Successfully!'}
              </h1>
              <p className="text-[#64748B] mb-8 text-sm leading-relaxed">
                {isAr
                  ? 'تم تفعيل حسابك التجاري في DealZone. يمكنك الآن تسجيل الدخول لبدء التداول والصفقات.'
                  : 'Your DealZone account has been verified and activated. You can now log in.'}
              </p>
              <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
                {isAr ? 'تسجيل الدخول الآن' : 'Log In Now'}
              </Button>
            </div>
          )}

          {/* ONE-CLICK LINK CONFIRMATION BUTTON */}
          {mode === 'link-click' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 bg-[#EAF4FF] rounded-2xl flex items-center justify-center text-[#1266D6]">
                <ShieldCheck size={36} />
              </div>
              <h1 className="text-2xl font-bold text-[#06245B] mb-2">
                {isAr ? 'تأكيد الحساب على DealZone' : 'Confirm Your DealZone Account'}
              </h1>
              <p className="text-[#64748B] text-xs mb-8 leading-relaxed max-w-sm mx-auto">
                {isAr
                  ? 'مرحباً بك! انقر على الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك التجاري مباشرة.'
                  : 'Welcome! Click the button below to confirm your email and activate your account.'}
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-[#DC2626] text-right">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}

              <Button
                variant="primary"
                fullWidth
                size="lg"
                loading={loading}
                onClick={handleLinkConfirm}
                className="mb-4"
              >
                {isAr ? 'تأكيد الحساب بنقرة واحدة' : 'Confirm Account with One Click'}
              </Button>

              <button
                type="button"
                onClick={() => setMode('code')}
                className="text-xs text-[#64748B] hover:text-[#1266D6] underline"
              >
                {isAr ? 'أو أدخل رمز التحقق المكون من 6 أرقام' : 'Or enter 6-digit verification code'}
              </button>
            </div>
          )}

          {/* 6-DIGIT CODE ENTRY */}
          {mode === 'code' && (
            <div>
              <div className="w-14 h-14 mx-auto mb-4 bg-[#EAF4FF] rounded-2xl flex items-center justify-center text-[#1266D6]">
                <Mail size={28} />
              </div>

              <h1 className="text-2xl font-bold text-[#06245B] text-center mb-1">
                {isAr ? 'رمز التحقق (6 أرقام)' : '6-Digit Verification Code'}
              </h1>
              <p className="text-[#64748B] text-center text-xs mb-6 max-w-sm mx-auto leading-relaxed">
                {isAr
                  ? 'أدخل رمز التحقق المكون من 6 أرقام المرسل إلى بريدك الإلكتروني.'
                  : 'Enter the 6-digit confirmation code sent to your email.'}
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-[#DC2626]">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMsg}</span>
                </div>
              )}

              {successNotice && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-[#059669]">
                  <CheckCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-snug">{successNotice}</span>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); submitCode() }} className="space-y-4">
                <Input
                  type="email"
                  label={isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />

                <div>
                  <label className="block text-xs font-semibold text-[#06245B] mb-2 text-center">
                    {isAr ? 'رمز التأكيد' : 'Confirmation Code'}
                  </label>
                  {/* Separate 6 digits input - forced LTR direction */}
                  <div className="flex justify-center items-center gap-2" dir="ltr">
                    {digits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        className="w-12 h-14 text-center text-2xl font-bold font-mono text-[#06245B] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1266D6] focus:border-[#1266D6] transition-all shadow-sm"
                        autoComplete="off"
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-[#64748B] text-center mt-2">
                    {isAr ? 'صلاحية هذا الرمز 15 دقيقة فقط' : 'This code is valid for 15 minutes only'}
                  </p>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  type="submit"
                  loading={loading}
                  disabled={!email.trim() || digits.join('').length !== 6}
                >
                  {isAr ? 'تأكيد الحساب' : 'Confirm Account'}
                </Button>
              </form>

              {/* RESEND SECTION */}
              <div className="mt-6 pt-5 border-t border-[rgba(6,36,91,0.06)]">
                <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
                  <span>{isAr ? 'لم يصلك الرمز؟' : "Didn't receive the code?"}</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || countdown > 0 || !email.trim()}
                    className="font-semibold text-[#1266D6] hover:text-[#06245B] transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    <Send size={12} />
                    {resendLoading
                      ? (isAr ? 'جاري الإرسال...' : 'Sending...')
                      : countdown > 0
                        ? (isAr ? `إعادة الإرسال بعد ${countdown} ث` : `Resend in ${countdown}s`)
                        : (isAr ? 'إعادة إرسال الرمز' : 'Resend Code')}
                  </button>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  {isAr
                    ? 'يرجى مراجعة مجلد الرسائل غير المرغوب بها (Spam) إذا لم تجد الرسالة.'
                    : 'Check your spam or junk folder if you cannot find the email.'}
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
