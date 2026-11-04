import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Edit3, Save, X, Globe, MapPin, Star } from 'lucide-react';
import { getMyCompany, updateMyCompany, getMyCompanyReviews } from '../../api/companies';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const VERIFY_STATUS = {
  NotSubmitted:  { label: 'لم يُرفع',      variant: 'neutral'  },
  Pending:       { label: 'قيد المراجعة', variant: 'warning'  },
  Approved:      { label: 'معتمدة',       variant: 'success'  },
  Rejected:      { label: 'مرفوضة',      variant: 'error'    },
  ChangesNeeded: { label: 'يحتاج تعديل', variant: 'warning'  },
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

function StarDisplay({ value }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={14}
          style={{ color: n <= value ? '#F59E0B' : 'var(--border-strong)' }}
          fill={n <= value ? '#F59E0B' : 'none'}
        />
      ))}
    </div>
  );
}

function CompanyField({ label, value, icon: Icon, multiline }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
        {Icon && <Icon size={12} />} {label}
      </p>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontSize: '0.9375rem', lineHeight: multiline ? 1.6 : 1.3 }}>
        {value || '—'}
      </p>
    </div>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing]       = useState(false);
  const [saveError, setSaveError]   = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm]             = useState({});

  const { data: company, isLoading } = useQuery({
    queryKey: ['my-company'],
    queryFn: getMyCompany,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['company-reviews'],
    queryFn: () => getMyCompanyReviews(),
    enabled: !!company,
  });

  const reviews = reviewsData?.items ?? reviewsData ?? [];

  const updateMut = useMutation({
    mutationFn: (data) => updateMyCompany(data),
    onSuccess: () => {
      qc.invalidateQueries(['my-company']);
      refreshUser?.();
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (e) => setSaveError(e?.response?.data?.message || 'حدث خطأ أثناء الحفظ'),
  });

  const startEdit = () => {
    setForm({
      name:        company?.name        || '',
      description: company?.description || '',
      website:     company?.website     || '',
      city:        company?.city        || company?.address?.city || '',
      address:     company?.address?.street || company?.addressLine || '',
    });
    setEditing(true);
    setSaveSuccess(false);
    setSaveError('');
  };

  const verStatus = VERIFY_STATUS[company?.verificationStatus] || VERIFY_STATUS.NotSubmitted;

  if (isLoading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="dz-card skeleton"
            style={{ height: '120px', marginBottom: '20px', borderRadius: '16px' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Success Banner */}
      {saveSuccess && (
        <div style={{
          marginBottom: '16px', padding: '12px 20px', borderRadius: '10px',
          background: 'rgba(16,185,129,0.1)', borderInlineStart: '3px solid var(--success)',
          display: 'flex', alignItems: 'center', gap: '8px',
          color: 'var(--success)', fontWeight: 600,
        }}>
          ✓ تم الحفظ بنجاح!
        </div>
      )}

      {/* ── User Info Card ───────────────────────────────────────── */}
      <div className="dz-card" style={{ padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          {/* Avatar */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', flexShrink: 0,
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: 700, color: '#fff',
          }}>
            {user?.name?.charAt(0) || '?'}
          </div>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {user?.name || '—'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0' }}>
              {user?.email}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge variant={company?.role === 'Buyer' ? 'info' : 'brand'}>
                {company?.role === 'Buyer' ? '🛒 مشتري' : '🏭 مورِّد'}
              </Badge>
              <Badge variant={verStatus.variant}>{verStatus.label}</Badge>
            </div>
          </div>
        </div>

        {/* Basic Info Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px', padding: '16px', borderRadius: '10px', background: 'var(--bg-elevated)',
        }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>البريد الإلكتروني</p>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontSize: '0.9rem' }}>{user?.email || '—'}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>تاريخ الانضمام</p>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontSize: '0.9rem' }}>{formatDate(user?.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* ── Company Card ─────────────────────────────────────────── */}
      <div className="dz-card" style={{ padding: '28px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '24px', flexWrap: 'wrap', gap: '10px',
        }}>
          <h2 style={{
            fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', gap: '8px', margin: 0,
          }}>
            <Building2 size={20} style={{ color: 'var(--dz-cyan)' }} />
            بيانات الشركة
          </h2>
          {!editing ? (
            <Button variant="ghost" leftIcon={Edit3} onClick={startEdit}>تعديل</Button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" leftIcon={X} onClick={() => { setEditing(false); setSaveError(''); }}>
                إلغاء
              </Button>
              <Button
                variant="primary" leftIcon={Save}
                loading={updateMut.isLoading}
                onClick={() => { setSaveError(''); updateMut.mutate(form); }}
              >
                حفظ
              </Button>
            </div>
          )}
        </div>

        {saveError && (
          <div style={{
            marginBottom: '16px', padding: '10px 14px', borderRadius: '8px',
            background: 'rgba(239,68,68,0.08)', color: 'var(--error)', fontSize: '0.875rem',
          }}>
            {saveError}
          </div>
        )}

        {!editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <CompanyField label="اسم الشركة" value={company?.name} />
            <CompanyField label="السجل التجاري" value={company?.commercialRegistrationNumber || '—'} />
            <CompanyField label="المدينة" icon={MapPin} value={company?.city || company?.address?.city || '—'} />
            <CompanyField label="الموقع الإلكتروني" icon={Globe} value={company?.website || '—'} />
            <div style={{ gridColumn: '1 / -1' }}>
              <CompanyField label="وصف الشركة" value={company?.description || '—'} multiline />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Input
              label="اسم الشركة"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="اسم شركتك"
            />
            <Input
              label="المدينة"
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              placeholder="المدينة"
            />
            <Input
              label="الموقع الإلكتروني"
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="https://..."
            />
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block', fontSize: '0.875rem', fontWeight: 500,
                color: 'var(--text-secondary)', marginBottom: '6px',
              }}>
                وصف الشركة
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="وصف مختصر عن نشاط الشركة..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: '1px solid var(--border-input)', background: 'var(--bg-input)',
                  color: 'var(--text-primary)', fontSize: '0.9375rem', resize: 'vertical',
                  fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Reviews ──────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <div className="dz-card" style={{ padding: '24px' }}>
          <h2 style={{
            fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)',
            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Star size={18} style={{ color: '#F59E0B' }} />
            تقييمات الشركة
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reviews.map((rev, i) => (
              <div key={rev.id || i} style={{
                padding: '16px', borderRadius: '10px', background: 'var(--bg-elevated)',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  flexWrap: 'wrap', gap: '6px', marginBottom: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'var(--gradient-brand)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                    }}>
                      {(rev.reviewer?.name || rev.reviewerName || '؟').charAt(0)}
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {rev.reviewer?.name || rev.reviewerName || 'مجهول'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StarDisplay value={rev.rating} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {formatDate(rev.createdAt)}
                    </span>
                  </div>
                </div>
                {rev.comment && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>
                    {rev.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
