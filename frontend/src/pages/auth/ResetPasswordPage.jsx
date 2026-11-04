import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPassword } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { AuthLayout } from './LoginPage';

const schema = z.object({
  newPassword:     z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
});

function PasswordStrength({ password }) {
  const strength = !password ? 0
    : password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 4
    : password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
    : password.length >= 8 ? 2
    : 1;

  const labels = ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية'];
  const colors = ['', 'var(--error)', 'var(--warning)', 'var(--info)', 'var(--success)'];

  if (!password) return null;
  return (
    <div style={{ marginTop: '-8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: '3px', borderRadius: '99px',
            background: i <= strength ? colors[strength] : 'var(--border)',
            transition: 'all 300ms',
          }} />
        ))}
      </div>
      <span style={{ fontSize: '0.75rem', color: colors[strength] }}>{labels[strength]}</span>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const token = params.get('token') || '';

  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const password = watch('newPassword', '');

  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) { navigate('/login', { replace: true }); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, countdown, navigate]);

  const onSubmit = async (data) => {
    setApiError('');
    setLoading(true);
    try {
      await resetPassword({ email, token, newPassword: data.newPassword });
      setSuccess(true);
    } catch (err) {
      setApiError(err.response?.data?.message || 'فشل إعادة تعيين كلمة المرور، الرابط قد يكون منتهي الصلاحية');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title={t('reset_password.title', 'إعادة تعيين كلمة المرور')}>
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
              {t('reset_password.success', 'تم تغيير كلمة المرور بنجاح')} ✅
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              سيتم تحويلك لتسجيل الدخول خلال {countdown} ثوانٍ...
            </p>
          </div>
          <Link to="/login">
            <Button variant="primary">تسجيل الدخول الآن</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('reset_password.title', 'إعادة تعيين كلمة المرور')}
      subtitle="أدخل كلمة المرور الجديدة"
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
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
          label={t('reset_password.new_password', 'كلمة المرور الجديدة')}
          type="password"
          placeholder="8 أحرف على الأقل"
          leftIcon={Lock}
          error={errors.newPassword?.message}
          required
          {...register('newPassword')}
        />
        <PasswordStrength password={password} />

        <Input
          label={t('reset_password.confirm_password', 'تأكيد كلمة المرور الجديدة')}
          type="password"
          placeholder="أعد كتابة كلمة المرور"
          leftIcon={Lock}
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
          {t('reset_password.submit', 'حفظ كلمة المرور الجديدة')}
        </Button>
      </form>
    </AuthLayout>
  );
}
