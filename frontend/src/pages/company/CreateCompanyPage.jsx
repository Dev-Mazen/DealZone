import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Store, Globe, MapPin, AlertCircle, ArrowRight, FileText } from 'lucide-react';
import { createCompany } from '../../api/companies';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import logo from '../../assets/logo.jpeg';

const schema = z.object({
  name:        z.string().min(2, 'اسم الشركة يجب أن يكون حرفين على الأقل'),
  description: z.string().max(500, 'الوصف لا يتجاوز 500 حرف').optional(),
  website:     z.string().url('رابط الموقع غير صحيح').optional().or(z.literal('')),
  address:     z.string().min(5, 'العنوان مطلوب'),
  city:        z.string().min(2, 'المدينة مطلوبة'),
  country:     z.string().min(2, 'البلد مطلوب'),
});

export default function CreateCompanyPage() {
  const { t } = useTranslation('company');
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [role, setRole] = useState('');
  const [roleError, setRoleError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [descLen, setDescLen] = useState(0);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { country: 'Egypt' },
  });
  const description = watch('description', '');

  const roleCard = (value, labelAr, labelEn, Icon) => {
    const isSelected = role === value;
    return (
      <button
        type="button"
        onClick={() => { setRole(value); setRoleError(''); }}
        style={{
          flex: 1, padding: '24px 16px', borderRadius: '14px', cursor: 'pointer',
          border: `2px solid ${isSelected ? 'var(--dz-cyan)' : 'var(--border)'}`,
          background: isSelected ? 'rgba(0,217,245,0.07)' : 'var(--bg-card)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          transition: 'all 200ms ease', boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
        }}
      >
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: isSelected ? 'rgba(0,217,245,0.15)' : 'var(--bg-elevated)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isSelected ? 'var(--dz-cyan)' : 'var(--text-muted)',
          transition: 'all 200ms',
        }}>
          <Icon size={26} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: isSelected ? 'var(--dz-cyan)' : 'var(--text-primary)' }}>
            {labelAr}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '3px' }}>{labelEn}</div>
        </div>
      </button>
    );
  };

  const onSubmit = async (data) => {
    if (!role) { setRoleError('الرجاء اختيار دور شركتك'); return; }
    setApiError('');
    setLoading(true);
    try {
      await createCompany({ ...data, role });
      await refreshUser();
      navigate('/onboarding/verification');
    } catch (err) {
      setApiError(err.response?.data?.message || 'فشل إنشاء الشركة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg-canvas)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 32px)' }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '640px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <img src={logo} alt="DealZone" style={{ height: '40px', width: '40px', borderRadius: '10px', objectFit: 'cover' }} />
          <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }}>DEAL ZONE</span>
        </div>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--dz-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#070E1C', flexShrink: 0 }}>1</div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>بيانات الشركة</span>
          </div>
          <div style={{ flex: 1, height: '2px', background: 'var(--border)', borderRadius: '1px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>2</div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>التوثيق</span>
          </div>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          أنشئ شركتك 🏢
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          أدخل بيانات شركتك للبدء في رحلة النمو مع DealZone
        </p>
      </div>

      {/* Form */}
      <div className="dz-card animate-fade-in" style={{ width: '100%', maxWidth: '640px', padding: '32px' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} noValidate>

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

          {/* Role */}
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '12px' }}>
              دور شركتك <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {roleCard('Buyer', 'مشتري', 'Buyer', Building2)}
              {roleCard('Supplier', 'مورّد', 'Supplier', Store)}
            </div>
            {roleError && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem', color: 'var(--error-text)', marginTop: '8px' }}>
                <AlertCircle size={13} />{roleError}
              </span>
            )}
          </div>

          <Input
            label="اسم الشركة"
            type="text"
            placeholder="شركة النيل للصناعات"
            leftIcon={Building2}
            error={errors.name?.message}
            required
            {...register('name')}
          />

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>وصف الشركة</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                {description?.length || 0} / 500
              </span>
            </label>
            <textarea
              className="dz-input"
              placeholder="صف نشاط شركتك ومنتجاتها..."
              rows={3}
              style={{ resize: 'vertical', minHeight: '80px' }}
              {...register('description')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="المدينة"
              type="text"
              placeholder="القاهرة"
              leftIcon={MapPin}
              error={errors.city?.message}
              required
              {...register('city')}
            />
            <Input
              label="البلد"
              type="text"
              placeholder="Egypt"
              error={errors.country?.message}
              required
              {...register('country')}
            />
          </div>

          <Input
            label="العنوان"
            type="text"
            placeholder="شارع التحرير، المهندسين"
            leftIcon={MapPin}
            error={errors.address?.message}
            required
            {...register('address')}
          />

          <Input
            label="الموقع الإلكتروني"
            type="url"
            placeholder="https://example.com"
            leftIcon={Globe}
            hint="اختياري"
            error={errors.website?.message}
            {...register('website')}
          />

          <Button type="submit" variant="primary" fullWidth loading={loading} disabled={loading} rightIcon={ArrowRight} size="lg">
            التالي — رفع الوثائق
          </Button>
        </form>
      </div>
    </div>
  );
}
