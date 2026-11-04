import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, Phone, AlertCircle, Building2, Store } from 'lucide-react';
import { register as registerApi } from '../../api/auth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { AuthLayout } from './LoginPage';

const schema = z.object({
  fullName:        z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email:           z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صحيح'),
  phoneNumber:     z.string().optional().refine(v => !v || /^\+?[0-9\s\-()]{7,15}$/.test(v), 'رقم الجوال غير صحيح'),
  password:        z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [roleError, setRoleError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    let valid = true;
    if (!role) { setRoleError('الرجاء اختيار دورك'); valid = false; }
    else setRoleError('');
    if (!termsAccepted) { setTermsError('يجب الموافقة على الشروط والأحكام'); valid = false; }
    else setTermsError('');
    if (!valid) return;

    setApiError('');
    setLoading(true);
    try {
      await registerApi({ ...data, role });
      navigate(`/confirm-email?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  const roleCard = (value, labelAr, labelEn, Icon) => {
    const isSelected = role === value;
    return (
      <button
        type="button"
        onClick={() => { setRole(value); setRoleError(''); }}
        style={{
          flex: 1, padding: '20px 16px', borderRadius: '12px', cursor: 'pointer',
          border: `2px solid ${isSelected ? 'var(--dz-cyan)' : 'var(--border)'}`,
          background: isSelected ? 'rgba(0,217,245,0.07)' : 'var(--bg-card)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
          transition: 'all 200ms ease',
        }}
      >
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: isSelected ? 'rgba(0,217,245,0.15)' : 'var(--bg-elevated)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isSelected ? 'var(--dz-cyan)' : 'var(--text-muted)',
          transition: 'all 200ms',
        }}>
          <Icon size={22} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: isSelected ? 'var(--dz-cyan)' : 'var(--text-primary)' }}>
            {labelAr}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{labelEn}</div>
        </div>
      </button>
    );
  };

  return (
    <AuthLayout
      title={t('register.title', 'إنشاء حساب جديد')}
      subtitle={t('register.subtitle', 'انضم إلى أكبر سوق للمواد الخام الصناعية في مصر')}
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} noValidate>
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

        {/* Role selector */}
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
            دورك في المنصة <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {roleCard('Buyer', 'مشتري', 'Buyer', Building2)}
            {roleCard('Supplier', 'مورّد', 'Supplier', Store)}
          </div>
          {roleError && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '6px' }}>
              <AlertCircle size={13} />{roleError}
            </span>
          )}
        </div>

        <Input
          label={t('register.full_name', 'الاسم الكامل')}
          type="text"
          placeholder="أحمد محمد"
          leftIcon={User}
          error={errors.fullName?.message}
          required
          {...register('fullName')}
        />

        <Input
          label={t('register.email', 'البريد الإلكتروني')}
          type="email"
          placeholder="your@company.com"
          leftIcon={Mail}
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <Input
          label={t('register.phone', 'رقم الجوال')}
          type="tel"
          placeholder="+201012345678"
          leftIcon={Phone}
          error={errors.phoneNumber?.message}
          hint="اختياري"
          {...register('phoneNumber')}
        />

        <Input
          label={t('register.password', 'كلمة المرور')}
          type="password"
          placeholder="8 أحرف على الأقل"
          leftIcon={Lock}
          error={errors.password?.message}
          required
          {...register('password')}
        />

        <Input
          label={t('register.confirm_password', 'تأكيد كلمة المرور')}
          type="password"
          placeholder="أعد كتابة كلمة المرور"
          leftIcon={Lock}
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        {/* Terms */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => { setTermsAccepted(e.target.checked); setTermsError(''); }}
              style={{ width: '16px', height: '16px', accentColor: 'var(--dz-cyan)', cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {t('register.terms', 'أوافق على')}{' '}
              <span style={{ color: 'var(--dz-cyan)', fontWeight: 500, cursor: 'pointer' }}>
                {t('register.terms_link', 'الشروط والأحكام')}
              </span>
            </span>
          </label>
          {termsError && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '6px' }}>
              <AlertCircle size={13} />{termsError}
            </span>
          )}
        </div>

        <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading}>
          {t('register.submit', 'إنشاء الحساب')}
        </Button>

        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
          {t('register.has_account', 'لديك حساب بالفعل؟')}{' '}
          <Link to="/login" style={{ color: 'var(--dz-cyan)', fontWeight: 600 }}>
            {t('register.login_link', 'تسجيل الدخول')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
