import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Tag, Eye, FileText, TrendingUp } from 'lucide-react';
import { getMyOffers } from '../../api/offers';
import Badge from '../../components/ui/Badge';

const OFFER_STATUS = {
  Pending:  { label: 'قيد المراجعة', variant: 'warning' },
  Accepted: { label: 'مقبول',        variant: 'success' },
  Rejected: { label: 'مرفوض',        variant: 'error'   },
  Revised:  { label: 'تم التعديل',   variant: 'info'    },
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatPrice(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(val);
}

export default function MyOffersPage() {
  const [page, setPage]           = useState(1);
  const [statusFilter, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-offers', { page, statusFilter }],
    queryFn: () => getMyOffers({ pageNumber: page, pageSize: 12, status: statusFilter || undefined }),
  });

  const offers     = data?.items ?? data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? offers.length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            عروضي 💼
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {totalCount} عرض إجمالاً
          </p>
        </div>
        {/* Stats Row */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: 'مقبول', key: 'Accepted', color: '#10B981' },
            { label: 'قيد المراجعة', key: 'Pending', color: '#F59E0B' },
            { label: 'مرفوض', key: 'Rejected', color: '#EF4444' },
          ].map(s => (
            <div
              key={s.key}
              style={{
                padding: '8px 16px', borderRadius: '20px',
                background: `${s.color}18`,
                color: s.color, fontSize: '0.8125rem', fontWeight: 600,
                cursor: 'pointer',
                border: `1px solid ${statusFilter === s.key ? s.color : 'transparent'}`,
              }}
              onClick={() => { setStatus(statusFilter === s.key ? '' : s.key); setPage(1); }}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['', 'Pending', 'Accepted', 'Rejected', 'Revised'].map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '0.8125rem',
              border: `1px solid ${statusFilter === s ? 'var(--dz-cyan)' : 'var(--border)'}`,
              background: statusFilter === s ? 'rgba(0,217,245,0.1)' : 'var(--bg-card)',
              color: statusFilter === s ? 'var(--dz-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: statusFilter === s ? 600 : 400,
              transition: 'all 150ms',
            }}
          >
            {!s ? 'الكل' : OFFER_STATUS[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="dz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="dz-table" style={{ minWidth: '650px' }}>
            <thead>
              <tr>
                <th>الطلب المرتبط</th>
                <th>السعر الإجمالي</th>
                <th>الحالة</th>
                <th>تاريخ الإرسال</th>
                <th style={{ width: '80px' }}>تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5].map(j => (
                      <td key={j}><div className="skeleton" style={{ height: '18px', borderRadius: '4px' }} /></td>
                    ))}
                  </tr>
                ))
              ) : offers.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div style={{ padding: '56px', textAlign: 'center' }}>
                      <Tag size={44} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>
                        لا توجد عروض بعد
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                        تصفح طلبات العروض وأرسل عرضك الأول
                      </p>
                      <Link to="/rfqs" style={{
                        display: 'inline-block', marginTop: '16px',
                        padding: '8px 20px', borderRadius: '8px',
                        background: 'var(--dz-cyan)', color: '#fff',
                        textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
                      }}>
                        تصفح الطلبات
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                offers.map(offer => {
                  const st = OFFER_STATUS[offer.status] || { label: offer.status, variant: 'neutral' };
                  return (
                    <tr key={offer.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {offer.rfq?.title || offer.rfqTitle || `RFQ-${offer.rfqId?.slice(0,8) ?? '—'}`}
                        </div>
                        {offer.rfqReferenceNumber && (
                          <div className="td-secondary">{offer.rfqReferenceNumber}</div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--dz-cyan)' }}>
                        {formatPrice(offer.totalPrice ?? offer.price)}
                      </td>
                      <td><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="td-secondary">{formatDate(offer.createdAt)}</td>
                      <td>
                        <Link
                          to={`/offers/${offer.id}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '6px 10px', borderRadius: '6px',
                            background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                            textDecoration: 'none', fontSize: '0.8125rem', transition: 'all 150ms',
                          }}
                        >
                          <Eye size={14} />
                          عرض
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: page === 1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              السابق
            </button>
            <span style={{ padding: '7px 14px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              صفحة {page} من {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: page === totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
