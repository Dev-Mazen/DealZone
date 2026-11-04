import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { AuthLayout } from './LoginPage';

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!email) { setEmailError('البريد الإلكتروني مطلوب'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('البريد الإلكتروني غير صحيح'); return false; }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setApiError(err.response?.data?.message || 'فشل إرسال رابط الاستعادة');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title={t('forgot_password.title', 'استعادة كلمة المرور')}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--success-bg)', border: '2px solid var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle size={36} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              تم الإرسال!
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {t('forgot_password.success', 'تم إرسال رابط الاستعادة إلى بريدك الإلكتروني')}
              <br />
              <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </p>
          </div>
          <Link to="/login">
            <Button variant="secondary" leftIcon={ArrowLeft}>
              {t('forgot_password.back_to_login', 'العودة لتسجيل الدخول')}
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('forgot_password.title', 'استعادة كلمة المرور')}
      subtitle={t('forgot_password.subtitle', 'أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة')}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {apiError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '8px',
            background: 'var(--error-bg)', border: '1px solid var(--error)',
            color: 'var(--error-text)', fontSize: '0.875rem',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {apiError}
          </div>
        )}

        <Input
          label={t('forgot_password.email', 'البريد الإلكتروني')}
          type="email"
          placeholder="your@company.com"
          leftIcon={Mail}
          value={email}
          onChange={e => { setEmail(e.target.value); setEmailError(''); }}
          error={emailError}
          required
        />

        <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
          {t('forgot_password.submit', 'إرسال رابط الاستعادة')}
        </Button>

        <Link
          to="/login"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          {t('forgot_password.back_to_login', 'العودة لتسجيل الدخول')}
        </Link>
      </form>
    </AuthLayout>
  );
}
