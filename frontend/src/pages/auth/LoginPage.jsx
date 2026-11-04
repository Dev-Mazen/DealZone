import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import logo from '../../assets/logo.jpeg';

const schema = z.object({
  email:    z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
});

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div style={{ display: 'flex', minHeight: '100svh' }}>
      {/* Brand Panel */}
      <div
        className="auth-brand-panel"
        style={{
          flex: '0 0 460px',
          background: 'var(--gradient-digital)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '48px', gap: '40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src={logo} alt="DealZone" style={{ height: '54px', width: '54px', borderRadius: '14px', objectFit: 'cover' }} />
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            DEAL ZONE
          </span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '10px' }}>
            سوق المواد الخام الصناعية
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            Trade Smarter. Grow Faster.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
          {[
            { icon: '🔒', text: 'شركات موثّقة ومعتمدة رسمياً' },
            { icon: '⚡', text: 'طلبات عروض أسعار فورية' },
            { icon: '🤝', text: 'عقود وصفقات آمنة ومضمونة' },
          ].map(f => (
            <div key={f.text} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 16px',
            }}>
              <span style={{ fontSize: '1.25rem' }}>{f.icon}</span>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(24px, 5vw, 64px)',
        background: 'var(--bg-canvas)', overflowY: 'auto', minWidth: 0,
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .auth-brand-panel { display: none !important; } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    setApiError('');
    setLoading(true);
    try {
      const user = await login(data);
      if (user?.isSystemAdmin) {
        navigate('/dashboard', { replace: true });
      } else if (!user?.company) {
        navigate('/onboarding/create-company', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'فشل تسجيل الدخول، تحقق من بياناتك');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('login.title', 'تسجيل الدخول')}
      subtitle={t('login.subtitle', 'أهلاً بك في ديل زون')}
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
          label={t('login.email', 'البريد الإلكتروني')}
          type="email"
          placeholder="your@company.com"
          leftIcon={Mail}
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <Input
          label={t('login.password', 'كلمة المرور')}
          type="password"
          placeholder={t('login.password_placeholder', 'أدخل كلمة المرور')}
          leftIcon={Lock}
          error={errors.password?.message}
          required
          {...register('password')}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
          <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--dz-cyan)', fontWeight: 500 }}>
            {t('login.forgot_password', 'نسيت كلمة المرور؟')}
          </Link>
        </div>

        <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
          {t('login.submit', 'تسجيل الدخول')}
        </Button>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
          {t('login.no_account', 'ليس لديك حساب؟')}{' '}
          <Link to="/register" style={{ color: 'var(--dz-cyan)', fontWeight: 600 }}>
            {t('login.register_link', 'سجّل الآن')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
