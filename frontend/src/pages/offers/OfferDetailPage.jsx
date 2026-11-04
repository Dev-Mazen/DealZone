import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, CheckCircle, XCircle, Tag, FileText, AlertCircle, Handshake } from 'lucide-react';
import { getOfferById, getOfferRevisions, acceptOffer, rejectOffer } from '../../api/offers';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';

const OFFER_STATUS = {
  Pending:  { label: 'قيد المراجعة', variant: 'warning' },
  Accepted: { label: 'مقبول',        variant: 'success' },
  Rejected: { label: 'مرفوض',        variant: 'error'   },
  Revised:  { label: 'تم التعديل',   variant: 'info'    },
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatPrice(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(val);
}

export default function OfferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companyRole } = useAuth();
  const isBuyer = companyRole === 'Buyer';
  const qc = useQueryClient();

  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [acceptModal, setAcceptModal] = useState(false);
  const [actionError, setActionError] = useState('');

  const { data: offer, isLoading } = useQuery({
    queryKey: ['offer', id],
    queryFn: () => getOfferById(id),
    enabled: !!id,
  });

  const { data: revisions = [] } = useQuery({
    queryKey: ['offer-revisions', id],
    queryFn: () => getOfferRevisions(id),
    enabled: !!id,
  });

  const acceptMut = useMutation({
    mutationFn: () => acceptOffer(id),
    onSuccess: () => {
      qc.invalidateQueries(['offer', id]);
      setAcceptModal(false);
    },
    onError: (e) => setActionError(e?.response?.data?.message || 'حدث خطأ أثناء القبول'),
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectOffer(id, { reason: rejectReason }),
    onSuccess: () => {
      qc.invalidateQueries(['offer', id]);
      setRejectModal(false);
      setRejectReason('');
    },
    onError: (e) => setActionError(e?.response?.data?.message || 'حدث خطأ أثناء الرفض'),
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Spinner size={40} />
      </div>
    );
  }

  if (!offer) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <AlertCircle size={48} style={{ color: 'var(--error)', margin: '0 auto 16px', display: 'block' }} />
        <p style={{ color: 'var(--text-secondary)' }}>لم يتم العثور على العرض</p>
        <Button variant="ghost" onClick={() => navigate(-1)} style={{ marginTop: '16px' }}>عودة</Button>
      </div>
    );
  }

  const st = OFFER_STATUS[offer.status] || { label: offer.status, variant: 'neutral' };
  const canAct = isBuyer && offer.status === 'Pending';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          marginBottom: '20px', padding: '6px 0',
          background: 'none', border: 'none',
          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem',
        }}
      >
        <ArrowLeft size={16} /> رجوع
      </button>

      {/* Header Card */}
      <div className="dz-card" style={{ padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(0,217,245,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Tag size={22} style={{ color: 'var(--dz-cyan)' }} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  تفاصيل العرض
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
                  #{offer.id?.slice(0, 12)}...
                </p>
              </div>
            </div>
          </div>
          <Badge variant={st.variant} style={{ fontSize: '0.875rem' }}>{st.label}</Badge>
        </div>

        {/* Info Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px', marginTop: '24px',
          padding: '20px', borderRadius: '12px',
          background: 'var(--bg-elevated)',
        }}>
          <InfoItem label="السعر الإجمالي" value={formatPrice(offer.totalPrice ?? offer.price)} highlight />
          <InfoItem label="الشركة المورِّدة" value={offer.supplier?.companyName || offer.supplierName || '—'} />
          <InfoItem label="تاريخ الإرسال" value={formatDate(offer.createdAt)} />
          <InfoItem label="آخر تحديث" value={formatDate(offer.updatedAt)} />
        </div>

        {/* Notes */}
        {offer.notes && (
          <div style={{ marginTop: '20px', padding: '16px', borderRadius: '10px', background: 'rgba(18,102,214,0.07)', borderInlineStart: '3px solid var(--dz-blue)' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>ملاحظات المورِّد</p>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{offer.notes}</p>
          </div>
        )}

        {/* Reject reason */}
        {offer.status === 'Rejected' && offer.rejectionReason && (
          <div style={{ marginTop: '16px', padding: '16px', borderRadius: '10px', background: 'rgba(239,68,68,0.07)', borderInlineStart: '3px solid var(--error)' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--error)', marginBottom: '4px', fontWeight: 600 }}>سبب الرفض</p>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{offer.rejectionReason}</p>
          </div>
        )}

        {/* Deal link if accepted */}
        {offer.status === 'Accepted' && offer.dealId && (
          <div style={{ marginTop: '20px', padding: '16px', borderRadius: '10px', background: 'rgba(16,185,129,0.07)', borderInlineStart: '3px solid var(--success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Handshake size={18} style={{ color: 'var(--success)' }} />
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>تم إنشاء صفقة</span>
              </div>
              <Link to={`/deals/${offer.dealId}`} style={{
                padding: '6px 14px', borderRadius: '8px',
                background: 'var(--success)', color: '#fff',
                textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 600,
              }}>
                عرض الصفقة
              </Link>
            </div>
          </div>
        )}

        {/* Actions */}
        {canAct && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
            <Button variant="primary" leftIcon={CheckCircle} onClick={() => setAcceptModal(true)}>
              قبول العرض
            </Button>
            <Button variant="danger" leftIcon={XCircle} onClick={() => setRejectModal(true)}>
              رفض العرض
            </Button>
          </div>
        )}
      </div>

      {/* Revision History */}
      {revisions.length > 0 && (
        <div className="dz-card" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
            سجل المراجعات 🕒
          </h2>
          <div style={{ position: 'relative', paddingInlineStart: '24px', borderInlineStart: '2px solid var(--border)' }}>
            {revisions.map((rev, i) => (
              <div key={rev.id || i} style={{
                position: 'relative', marginBottom: i < revisions.length - 1 ? '24px' : 0,
              }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute', insetInlineStart: '-33px', top: '4px',
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: i === 0 ? 'var(--dz-cyan)' : 'var(--border)',
                  border: `2px solid var(--bg-card)`,
                }} />
                <div style={{ marginInlineStart: '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                      {formatPrice(rev.totalPrice ?? rev.price)}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {formatDate(rev.createdAt)}
                    </span>
                  </div>
                  {rev.notes && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>{rev.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accept Modal */}
      <Modal isOpen={acceptModal} onClose={() => setAcceptModal(false)} title="تأكيد القبول">
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            هل أنت متأكد من قبول هذا العرض؟ سيتم إنشاء صفقة جديدة تلقائياً.
          </p>
          {actionError && <p style={{ color: 'var(--error)', marginBottom: '12px', fontSize: '0.875rem' }}>{actionError}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setAcceptModal(false)}>إلغاء</Button>
            <Button
              variant="primary"
              leftIcon={CheckCircle}
              loading={acceptMut.isLoading}
              onClick={() => { setActionError(''); acceptMut.mutate(); }}
            >
              نعم، قبول
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="رفض العرض">
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            يرجى توضيح سبب الرفض للمورِّد:
          </p>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="سبب الرفض..."
            rows={3}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '10px',
              border: '1px solid var(--border-input)', background: 'var(--bg-input)',
              color: 'var(--text-primary)', fontSize: '0.9375rem', resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          {actionError && <p style={{ color: 'var(--error)', marginTop: '8px', fontSize: '0.875rem' }}>{actionError}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => { setRejectModal(false); setRejectReason(''); }}>إلغاء</Button>
            <Button
              variant="danger"
              leftIcon={XCircle}
              loading={rejectMut.isLoading}
              onClick={() => { setActionError(''); rejectMut.mutate(); }}
            >
              تأكيد الرفض
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>{label}</p>
      <p style={{
        fontWeight: highlight ? 700 : 600,
        color: highlight ? 'var(--dz-cyan)' : 'var(--text-primary)',
        fontSize: highlight ? '1.25rem' : '0.9375rem',
        margin: 0,
      }}>
        {value}
      </p>
    </div>
  );
}
