import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Handshake, Package, Truck, AlertCircle,
  CheckCircle, PlayCircle, XCircle, Star, MessageSquare,
} from 'lucide-react';
import {
  getDealById, confirmDeal, startDeal, completeDeal,
  cancelDeal, openDispute, getDealShipments, getDealDisputes,
  submitReview,
} from '../../api/deals';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';

const DEAL_STATUS = {
  PendingBuyerConfirmation: { label: 'في انتظار التأكيد', variant: 'warning'  },
  Active:                   { label: 'نشط',               variant: 'info'     },
  Completed:                { label: 'مكتمل',             variant: 'success'  },
  Cancelled:                { label: 'ملغي',              variant: 'error'    },
  Disputed:                 { label: 'نزاع',              variant: 'error'    },
};

const SHIPMENT_STATUS = {
  Pending:    { label: 'قيد الانتظار',   color: '#F59E0B' },
  InTransit:  { label: 'في الطريق',      color: '#1266D6' },
  Delivered:  { label: 'تم التوصيل',    color: '#10B981' },
  Failed:     { label: 'فشل التوصيل',   color: '#EF4444' },
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatPrice(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(val);
}

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
            color: n <= value ? '#F59E0B' : 'var(--border-strong)',
            transition: 'color 150ms',
          }}
        >
          <Star size={24} fill={n <= value ? '#F59E0B' : 'none'} />
        </button>
      ))}
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
        fontSize: highlight ? '1.25rem' : '0.9375rem', margin: 0,
      }}>{value}</p>
    </div>
  );
}

export default function DealDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companyRole } = useAuth();
  const isBuyer    = companyRole === 'Buyer';
  const isSupplier = companyRole === 'Supplier';
  const qc = useQueryClient();

  const [disputeModal,  setDisputeModal]  = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [cancelModal,   setCancelModal]   = useState(false);
  const [reviewModal,   setReviewModal]   = useState(false);
  const [stars,         setStars]         = useState(5);
  const [comment,       setComment]       = useState('');
  const [actionError,   setActionError]   = useState('');

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => getDealById(id),
    enabled: !!id,
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['deal-shipments', id],
    queryFn: () => getDealShipments(id),
    enabled: !!id,
  });

  const { data: disputes = [] } = useQuery({
    queryKey: ['deal-disputes', id],
    queryFn: () => getDealDisputes(id),
    enabled: !!id,
  });

  const makeAction = (fn, opts = {}) => useMutation({
    mutationFn: fn,
    onSuccess: () => { qc.invalidateQueries(['deal', id]); opts.onSuccess?.(); },
    onError: (e) => setActionError(e?.response?.data?.message || 'حدث خطأ'),
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const confirmMut  = makeAction(() => confirmDeal(id));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const startMut    = makeAction(() => startDeal(id));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const completeMut = makeAction(() => completeDeal(id));
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cancelMut   = makeAction(() => cancelDeal(id), { onSuccess: () => setCancelModal(false) });
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const disputeMut  = makeAction(() => openDispute(id, { reason: disputeReason }), {
    onSuccess: () => { setDisputeModal(false); setDisputeReason(''); },
  });
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const reviewMut   = makeAction(() => submitReview(id, { rating: stars, comment }), {
    onSuccess: () => { setReviewModal(false); setStars(5); setComment(''); },
  });

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><Spinner size={40} /></div>;
  }

  if (!deal) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <AlertCircle size={48} style={{ color: 'var(--error)', margin: '0 auto 16px', display: 'block' }} />
        <p style={{ color: 'var(--text-secondary)' }}>لم يتم العثور على الصفقة</p>
        <Button variant="ghost" onClick={() => navigate(-1)} style={{ marginTop: '16px' }}>عودة</Button>
      </div>
    );
  }

  const st = DEAL_STATUS[deal.status] || { label: deal.status, variant: 'neutral' };
  const shipmentArr = Array.isArray(shipments) ? shipments : shipments?.items ?? [];
  const disputeArr  = Array.isArray(disputes)  ? disputes  : disputes?.items  ?? [];
  const ship        = shipmentArr[0];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          marginBottom: '20px', padding: '6px 0',
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem',
        }}
      >
        <ArrowLeft size={16} /> رجوع
      </button>

      {/* Deal Header */}
      <div className="dz-card" style={{ padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'rgba(0,217,245,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Handshake size={24} style={{ color: 'var(--dz-cyan)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {deal.referenceNumber || `DEAL-${deal.id?.slice(0,8)}`}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
                أُنشئت {formatDate(deal.createdAt)}
              </p>
            </div>
          </div>
          <Badge variant={st.variant} style={{ fontSize: '0.9rem' }}>{st.label}</Badge>
        </div>

        {/* Info Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '20px', padding: '20px', borderRadius: '12px', background: 'var(--bg-elevated)',
        }}>
          <InfoItem label="القيمة الإجمالية" value={formatPrice(deal.totalPrice ?? deal.amount)} highlight />
          <InfoItem label="المشتري" value={deal.buyer?.companyName || deal.buyerName || '—'} />
          <InfoItem label="المورِّد" value={deal.supplier?.companyName || deal.supplierName || '—'} />
          <InfoItem label="تاريخ الإنشاء" value={formatDate(deal.createdAt)} />
        </div>

        {actionError && (
          <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', color: 'var(--error)', fontSize: '0.875rem' }}>
            {actionError}
          </div>
        )}

        {/* Status Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
          {isBuyer && deal.status === 'PendingBuyerConfirmation' && (
            <Button variant="primary" leftIcon={CheckCircle}
              loading={confirmMut.isLoading}
              onClick={() => { setActionError(''); confirmMut.mutate(); }}>
              تأكيد الصفقة
            </Button>
          )}
          {isSupplier && deal.status === 'Active' && (
            <Button variant="primary" leftIcon={PlayCircle}
              loading={startMut.isLoading}
              onClick={() => { setActionError(''); startMut.mutate(); }}>
              بدء التنفيذ
            </Button>
          )}
          {isBuyer && deal.status === 'Active' && (
            <Button variant="primary" leftIcon={CheckCircle}
              loading={completeMut.isLoading}
              onClick={() => { setActionError(''); completeMut.mutate(); }}>
              إتمام الصفقة
            </Button>
          )}
          {deal.status === 'Active' && (
            <Button variant="ghost" leftIcon={AlertCircle}
              onClick={() => { setDisputeModal(true); setActionError(''); }}>
              فتح نزاع
            </Button>
          )}
          {['PendingBuyerConfirmation', 'Active'].includes(deal.status) && (
            <Button variant="danger" leftIcon={XCircle}
              onClick={() => { setCancelModal(true); setActionError(''); }}>
              إلغاء الصفقة
            </Button>
          )}
          {deal.status === 'Completed' && (
            <Button variant="ghost" leftIcon={Star}
              onClick={() => setReviewModal(true)}>
              تقييم الصفقة
            </Button>
          )}
        </div>
      </div>

      {/* Shipment */}
      <div className="dz-card" style={{ padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Truck size={18} style={{ color: 'var(--dz-cyan)' }} />
          معلومات الشحن
        </h2>
        {!ship ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>لا توجد معلومات شحن حتى الآن</p>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px', padding: '16px', borderRadius: '10px', background: 'var(--bg-elevated)',
          }}>
            <InfoItem label="رقم التتبع" value={ship.trackingNumber || '—'} />
            <InfoItem
              label="الحالة"
              value={SHIPMENT_STATUS[ship.status]?.label || ship.status || '—'}
            />
            <InfoItem label="مزود الشحن" value={ship.shippingProvider?.name || ship.providerName || '—'} />
            <InfoItem label="تاريخ التحديث" value={formatDate(ship.updatedAt)} />
          </div>
        )}
      </div>

      {/* Disputes */}
      {disputeArr.length > 0 && (
        <div className="dz-card" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: 'var(--error)' }} />
            النزاعات
          </h2>
          {disputeArr.map((d, i) => (
            <div key={d.id || i} style={{
              padding: '16px', borderRadius: '10px', marginBottom: i < disputeArr.length - 1 ? '12px' : 0,
              background: 'rgba(239,68,68,0.06)', borderInlineStart: '3px solid var(--error)',
            }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {d.reason || 'نزاع'}
              </p>
              {d.resolution && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                  القرار: {d.resolution}
                </p>
              )}
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{formatDate(d.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="إلغاء الصفقة">
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            هل أنت متأكد من إلغاء هذه الصفقة؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setCancelModal(false)}>لا، رجوع</Button>
            <Button variant="danger" leftIcon={XCircle} loading={cancelMut.isLoading} onClick={() => { setActionError(''); cancelMut.mutate(); }}>
              نعم، إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* Dispute Modal */}
      <Modal isOpen={disputeModal} onClose={() => setDisputeModal(false)} title="فتح نزاع">
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>يرجى توضيح سبب فتح النزاع:</p>
          <textarea
            value={disputeReason}
            onChange={e => setDisputeReason(e.target.value)}
            placeholder="سبب النزاع..."
            rows={4}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '10px',
              border: '1px solid var(--border-input)', background: 'var(--bg-input)',
              color: 'var(--text-primary)', fontSize: '0.9375rem', resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => { setDisputeModal(false); setDisputeReason(''); }}>إلغاء</Button>
            <Button variant="danger" leftIcon={AlertCircle} loading={disputeMut.isLoading}
              onClick={() => { setActionError(''); disputeMut.mutate(); }}>
              فتح النزاع
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="تقييم الصفقة">
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>شارك تجربتك مع هذه الصفقة:</p>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '8px' }}>التقييم</p>
            <StarRating value={stars} onChange={setStars} />
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="تعليقك (اختياري)..."
            rows={3}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '10px',
              border: '1px solid var(--border-input)', background: 'var(--bg-input)',
              color: 'var(--text-primary)', fontSize: '0.9375rem', resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => setReviewModal(false)}>إلغاء</Button>
            <Button variant="primary" leftIcon={Star} loading={reviewMut.isLoading}
              onClick={() => reviewMut.mutate()}>
              إرسال التقييم
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
