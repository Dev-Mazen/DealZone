import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, Trash2, CheckCircle, Clock, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { getVerificationStatus, uploadVerificationDocument, submitForVerification, deleteVerificationDocument } from '../../api/companies';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import logo from '../../assets/logo.jpeg';

const DOC_TYPES = {
  CommercialRegister: { id: 1, label: 'السجل التجاري', labelEn: 'Commercial Register', required: true },
  TaxCard:           { id: 2, label: 'البطاقة الضريبية', labelEn: 'Tax Card', required: true },
  IndustrialRegister:{ id: 3, label: 'السجل الصناعي', labelEn: 'Industrial Register', required: false },
  Other:             { id: 5, label: 'وثيقة إضافية', labelEn: 'Additional Document', required: false },
};

const STATUS_CONFIG = {
  Pending:       { label: 'في انتظار الموافقة', variant: 'warning', icon: Clock },
  Approved:      { label: 'تم الاعتماد', variant: 'success', icon: CheckCircle },
  Rejected:      { label: 'مرفوضة', variant: 'error', icon: XCircle },
  NeedsMoreInfo: { label: 'يحتاج معلومات إضافية', variant: 'info', icon: AlertTriangle },
  NotSubmitted:  { label: 'لم يُرسل بعد', variant: 'neutral', icon: FileText },
};

function FileDropZone({ label, labelEn, required, onSelect, file, onRemove, uploading, docType }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert('الحجم الأقصى 5 ميجابايت'); return; }
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      alert('الصيغ المقبولة: PDF, JPG, PNG'); return;
    }
    onSelect(f);
  };

  return (
    <div>
      <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        {label}
        {required && <span style={{ color: 'var(--error)' }}>*</span>}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({labelEn})</span>
      </label>

      {file ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 16px', borderRadius: '10px',
          background: 'var(--success-bg)', border: '1px solid var(--success)',
        }}>
          <FileText size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--success-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB</div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px', flexShrink: 0 }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <label
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            padding: '24px', borderRadius: '10px', cursor: 'pointer',
            border: `2px dashed ${dragging ? 'var(--dz-cyan)' : 'var(--border)'}`,
            background: dragging ? 'rgba(0,217,245,0.05)' : 'var(--bg-elevated)',
            transition: 'all 200ms',
          }}
        >
          <Upload size={24} style={{ color: dragging ? 'var(--dz-cyan)' : 'var(--text-muted)' }} />
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: dragging ? 'var(--dz-cyan)' : 'var(--text-secondary)', fontWeight: 500 }}>
              اسحب الملف هنا أو اضغط للاختيار
            </span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>PDF, JPG, PNG — أقصى حجم 5MB</p>
          </div>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0])} />
        </label>
      )}
    </div>
  );
}

export default function VerificationPage() {
  const { t } = useTranslation('company');
  const navigate = useNavigate();
  const { refreshUser, company } = useAuth();
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const { data: status, refetch } = useQuery({
    queryKey: ['verification-status'],
    queryFn: getVerificationStatus,
    retry: 1,
  });

  const verificationStatus = status?.status || 'NotSubmitted';
  const statusConfig = STATUS_CONFIG[verificationStatus] || STATUS_CONFIG.NotSubmitted;
  const StatusIcon = statusConfig.icon;
  const isApproved = verificationStatus === 'Approved';

  const handleSubmit = async () => {
    if (!files[1] || !files[2]) { setError('الوثيقتان الأساسيتان مطلوبتان (السجل التجاري + البطاقة الضريبية)'); return; }
    setError('');
    setUploading(true);
    try {
      for (const [docType, file] of Object.entries(files)) {
        await uploadVerificationDocument(file, Number(docType));
      }
      await submitForVerification();
      await refreshUser();
      setSubmitted(true);
      await refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'فشل رفع الوثائق');
    } finally {
      setUploading(false);
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
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={16} style={{ color: '#fff' }} />
            </div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>بيانات الشركة</span>
          </div>
          <div style={{ flex: 1, height: '2px', background: 'var(--dz-cyan)', borderRadius: '1px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--dz-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#070E1C', flexShrink: 0 }}>2</div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>التوثيق</span>
          </div>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          توثيق الشركة 📄
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          ارفع وثائق الشركة الرسمية للحصول على الموافقة والبدء في التداول
        </p>
      </div>

      {/* Status Card */}
      <div className="dz-card animate-fade-in" style={{ width: '100%', maxWidth: '640px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: `var(--${statusConfig.variant === 'success' ? 'success' : statusConfig.variant === 'warning' ? 'warning' : statusConfig.variant === 'error' ? 'error' : 'info'}-bg, var(--bg-elevated))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: `var(--${statusConfig.variant === 'neutral' ? 'text-muted' : statusConfig.variant})`,
        }}>
          <StatusIcon size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            حالة التوثيق:
            <Badge variant={statusConfig.variant} style={{ marginInlineStart: '10px' }}>{statusConfig.label}</Badge>
          </div>
          {status?.adminNotes && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{status.adminNotes}</p>
          )}
        </div>
      </div>

      {isApproved ? (
        <div className="dz-card" style={{ width: '100%', maxWidth: '640px', padding: '32px', textAlign: 'center' }}>
          <CheckCircle size={48} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            تم اعتماد شركتك! 🎉
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            يمكنك الآن البدء في استخدام منصة DealZone كاملاً
          </p>
          <Button variant="primary" size="lg" rightIcon={ArrowRight} onClick={() => navigate('/dashboard')}>
            الذهاب للوحة التحكم
          </Button>
        </div>
      ) : !submitted ? (
        <div className="dz-card animate-fade-in" style={{ width: '100%', maxWidth: '640px', padding: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', borderRadius: '8px',
                background: 'var(--error-bg)', border: '1px solid var(--error)',
                color: 'var(--error-text)', fontSize: '0.875rem',
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <FileDropZone
              label={DOC_TYPES.CommercialRegister.label}
              labelEn={DOC_TYPES.CommercialRegister.labelEn}
              required={true}
              file={files[1]}
              onSelect={f => setFiles(p => ({ ...p, 1: f }))}
              onRemove={() => setFiles(p => { const n = { ...p }; delete n[1]; return n; })}
            />

            <FileDropZone
              label={DOC_TYPES.TaxCard.label}
              labelEn={DOC_TYPES.TaxCard.labelEn}
              required={true}
              file={files[2]}
              onSelect={f => setFiles(p => ({ ...p, 2: f }))}
              onRemove={() => setFiles(p => { const n = { ...p }; delete n[2]; return n; })}
            />

            <FileDropZone
              label={DOC_TYPES.IndustrialRegister.label}
              labelEn={DOC_TYPES.IndustrialRegister.labelEn}
              required={false}
              file={files[3]}
              onSelect={f => setFiles(p => ({ ...p, 3: f }))}
              onRemove={() => setFiles(p => { const n = { ...p }; delete n[3]; return n; })}
            />

            <Button
              type="button"
              variant="primary"
              fullWidth
              size="lg"
              loading={uploading}
              disabled={uploading}
              onClick={handleSubmit}
            >
              رفع الوثائق وإرسال للمراجعة
            </Button>
          </div>
        </div>
      ) : (
        <div className="dz-card" style={{ width: '100%', maxWidth: '640px', padding: '32px', textAlign: 'center' }}>
          <Clock size={48} style={{ color: 'var(--warning)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            في انتظار المراجعة ⏳
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            تم رفع وثائقك بنجاح. سيتم مراجعتها خلال 1-3 أيام عمل وسيصلك إشعار بالنتيجة.
          </p>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            العودة للوحة التحكم
          </Button>
        </div>
      )}
    </div>
  );
}
