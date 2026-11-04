import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { confirmEmail, resendConfirmation } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { AuthLayout } from './LoginPage';

export default function ConfirmEmailPage() {
  const { t } = useTranslation('auth');
  const [params] = useSearchParams();
  const email = params.get('email') || '';

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) { setError('رمز التأكيد مطلوب'); return; }
    setError('');
    setLoading(true);
    try {
      await confirmEmail({ email, token: token.trim() });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'رمز التأكيد غير صحيح أو منتهي الصلاحية');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendConfirmation({ email });
      setCooldown(60);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'فشل إعادة الإرسال');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title={t('confirm_email.title', 'تأكيد البريد الإلكتروني')}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--success-bg)', border: '2px solid var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle size={36} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              تم التأكيد بنجاح! 🎉
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>يمكنك الآن تسجيل الدخول إلى حسابك</p>
          </div>
          <Link to="/login">
            <Button variant="primary" size="lg">الذهاب لتسجيل الدخول</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('confirm_email.title', 'تأكيد البريد الإلكتروني')}
      subtitle={t('confirm_email.subtitle', 'أدخل رمز التأكيد المرسل إلى بريدك الإلكتروني')}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Email display */}
        {email && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '8px',
            background: 'var(--info-bg)', border: '1px solid var(--info)',
            color: 'var(--info-text)', fontSize: '0.875rem',
          }}>
            <Mail size={16} style={{ flexShrink: 0 }} />
            تم إرسال الرمز إلى: <strong>{email}</strong>
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '8px',
            background: 'var(--error-bg)', border: '1px solid var(--error)',
            color: 'var(--error-text)', fontSize: '0.875rem',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <Input
          label={t('confirm_email.token', 'رمز التأكيد')}
          type="text"
          placeholder="أدخل الرمز المكوّن من 6 أرقام"
          value={token}
          onChange={e => { setToken(e.target.value); setError(''); }}
          maxLength={10}
          error={!token.trim() && error ? error : undefined}
          required
        />

        <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
          {t('confirm_email.submit', 'تأكيد')}
        </Button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            لم يصلك الرمز؟{' '}
          </span>
          {cooldown > 0 ? (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              إعادة الإرسال بعد {cooldown} ثانية
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{
                fontSize: '0.875rem', color: 'var(--dz-cyan)', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              {resending ? 'جاري الإرسال...' : t('confirm_email.resend', 'إعادة الإرسال')}
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
