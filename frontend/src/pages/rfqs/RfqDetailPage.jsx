import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, Package, MapPin, Tag, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getRfqById, getRfqOffers, getMyOfferOnRfq } from '../../api/rfqs';
import { createOffer, acceptOffer, rejectOffer } from '../../api/offers';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';

const STATUS_MAP = {
  Draft: { label: 'مسودة', variant: 'neutral' },
  Published: { label: 'منشور', variant: 'info' },
  Closed: { label: 'مغلق', variant: 'neutral' },
  Cancelled: { label: 'ملغي', variant: 'error' },
  Awarded: { label: 'مُنجز', variant: 'success' },
};

const OFFER_STATUS = {
  Pending:  { label: 'قيد المراجعة', variant: 'warning' },
  Accepted: { label: 'مقبول', variant: 'success' },
  Rejected: { label: 'مرفوض', variant: 'error' },
  Revised:  { label: 'تم التعديل', variant: 'info' },
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function RfqDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companyRole } = useAuth();
  const isBuyer = companyRole === 'Buyer';
  const isSupplier = companyRole === 'Supplier';
  const qc = useQueryClient();

  const [offerModal, setOfferModal] = useState(false);
  const [rejectModal, setRejectModal] = useState({ open: false, offerId: null });
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNotes, setOfferNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [offerError, setOfferError] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  const { data: rfq, isLoading } = useQuery({ queryKey: ['rfq', id], queryFn: () => getRfqById(id) });
  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['rfq-offers', id],
    queryFn: () => getRfqOffers(id),
    enabled: isBuyer && !!id,
  });
  const { data: myOffer } = useQuery({
    queryKey: ['my-offer-rfq', id],
    queryFn: () => getMyOfferOnRfq(id),
    enabled: isSupplier && !!id,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptOffer,
    onSuccess: () => { qc.invalidateQueries(['rfq-offers', id]); qc.invalidateQueries(['rfq', id]); },
  });
  const rejectMutation = useMutation({
    mutationFn: ({ offerId, reason }) => rejectOffer(offerId, { reason }),
    onSuccess: () => { setRejectModal({ open: false, offerId: null }); qc.invalidateQueries(['rfq-offers', id]); },
  });

  const handleSubmitOffer = async () => {
    if (!offerPrice) { setOfferError('السعر مطلوب'); return; }
    setOfferError('');
    setOfferLoading(true);
    try {
      await createOffer(id, { totalPrice: parseFloat(offerPrice), notes: offerNotes });
      setOfferModal(false);
      qc.invalidateQueries(['my-offer-rfq', id]);
    } catch (err) {
      setOfferError(err.response?.data?.message || 'فشل إرسال العرض');
    } finally {
      setOfferLoading(false);
    }
  };

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
      <Spinner size="lg" label="جاري التحميل..." />
    </div>
  );

  if (!rfq) return (
    <div style={{ textAlign: 'center', padding: '64px' }}>
      <p style={{ color: 'var(--text-muted)' }}>الطلب غير موجود</p>
    </div>
  );

  const st = STATUS_MAP[rfq.status] || { label: rfq.status, variant: 'neutral' };
  const offersList = offers?.items ?? offers ?? [];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back */}
      <button onClick={() => navigate('/rfqs')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} />
        العودة للقائمة
      </button>

      {/* RFQ Header */}
      <div className="dz-card" style={{ padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <Badge variant={st.variant}>{st.label}</Badge>
              {rfq.referenceNumber && <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{rfq.referenceNumber}</span>}
            </div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              {rfq.title}
            </h1>
            {rfq.description && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{rfq.description}</p>}
          </div>
          {isSupplier && rfq.status === 'Published' && (
            myOffer ? (
              <div style={{ textAlign: 'center' }}>
                <Badge variant={OFFER_STATUS[myOffer.status]?.variant || 'neutral'}>
                  {OFFER_STATUS[myOffer.status]?.label || myOffer.status}
                </Badge>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>عرضك المقدّم</div>
              </div>
            ) : (
              <Button variant="primary" leftIcon={Send} onClick={() => setOfferModal(true)}>
                قدّم عرضاً
              </Button>
            )
          )}
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>تاريخ الإغلاق</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{formatDate(rfq.closingDateUtc || rfq.closingDate)}</div>
            </div>
          </div>
          {(rfq.governorate || rfq.city) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>الموقع</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{[rfq.city, rfq.governorate].filter(Boolean).join(', ')}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      {rfq.lineItems?.length > 0 && (
        <div className="dz-card" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} style={{ color: 'var(--dz-cyan)' }} />
            المواد المطلوبة
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="dz-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>المادة</th>
                  <th>الكمية</th>
                  <th>الوحدة</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {rfq.lineItems.map((item, i) => (
                  <tr key={item.id || i}>
                    <td className="td-secondary">{i + 1}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.material?.nameAr || item.material?.name || item.materialName || '—'}</td>
                    <td className="td-mono">{item.quantity?.toLocaleString('ar-EG')}</td>
                    <td className="td-secondary">{item.unit?.nameAr || item.unit?.name || item.unitName || '—'}</td>
                    <td className="td-secondary">{item.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Offers (Buyer view) */}
      {isBuyer && (
        <div className="dz-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} style={{ color: 'var(--dz-cyan)' }} />
            العروض الواردة ({offersList.length})
          </h2>
          {offersLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '64px', borderRadius: '10px' }} />)}
            </div>
          ) : offersList.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Tag size={36} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
              لا توجد عروض بعد
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {offersList.map(offer => {
                const os = OFFER_STATUS[offer.status] || { label: offer.status, variant: 'neutral' };
                return (
                  <div key={offer.id} style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--dz-cyan)', fontSize: '14px', flexShrink: 0 }}>
                        {offer.supplierCompany?.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                          {offer.supplierCompany?.name || 'مورّد'}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{formatDate(offer.createdAt)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'end' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', direction: 'ltr' }}>
                          {offer.totalPrice?.toLocaleString('en-US', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 })}
                        </div>
                        <Badge variant={os.variant}>{os.label}</Badge>
                      </div>
                      {offer.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button variant="primary" size="sm" leftIcon={CheckCircle}
                            onClick={() => acceptMutation.mutate(offer.id)}
                            loading={acceptMutation.isPending}>
                            قبول
                          </Button>
                          <Button variant="danger" size="sm" leftIcon={XCircle}
                            onClick={() => setRejectModal({ open: true, offerId: offer.id })}>
                            رفض
                          </Button>
                        </div>
                      )}
                      <Link to={`/offers/${offer.id}`} style={{ fontSize: '0.8125rem', color: 'var(--dz-cyan)' }}>عرض</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Submit Offer Modal */}
      <Modal open={offerModal} onClose={() => setOfferModal(false)} title="تقديم عرض سعر" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setOfferModal(false)}>إلغاء</Button>
          <Button variant="primary" loading={offerLoading} onClick={handleSubmitOffer}>إرسال العرض</Button>
        </>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {offerError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'var(--error-bg)', color: 'var(--error-text)', fontSize: '0.875rem' }}>
              <AlertCircle size={14} />{offerError}
            </div>
          )}
          <Input label="السعر الإجمالي (بالجنيه المصري)" type="number" placeholder="0.00" min="0" step="0.01" required value={offerPrice} onChange={e => setOfferPrice(e.target.value)} />
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>ملاحظات</label>
            <textarea className="dz-input" placeholder="تفاصيل إضافية، شروط التوريد، المدة..." rows={3} style={{ resize: 'vertical' }} value={offerNotes} onChange={e => setOfferNotes(e.target.value)} />
          </div>
        </div>
      </Modal>

      {/* Reject Offer Modal */}
      <Modal open={rejectModal.open} onClose={() => setRejectModal({ open: false, offerId: null })} title="رفض العرض" size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setRejectModal({ open: false, offerId: null })}>إلغاء</Button>
          <Button variant="danger" loading={rejectMutation.isPending}
            onClick={() => rejectMutation.mutate({ offerId: rejectModal.offerId, reason: rejectReason })}>
            تأكيد الرفض
          </Button>
        </>}
      >
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>سبب الرفض</label>
          <textarea className="dz-input" placeholder="اكتب سبب الرفض للمورّد..." rows={3} style={{ resize: 'vertical' }} value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
