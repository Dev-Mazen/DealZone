import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Handshake, Eye, AlertCircle } from 'lucide-react';
import { getMyDeals } from '../../api/deals';
import Badge from '../../components/ui/Badge';

const DEAL_STATUS = {
  PendingBuyerConfirmation: { label: 'في انتظار التأكيد', variant: 'warning'  },
  Active:                   { label: 'نشط',               variant: 'info'     },
  Completed:                { label: 'مكتمل',             variant: 'success'  },
  Cancelled:                { label: 'ملغي',              variant: 'error'    },
  Disputed:                 { label: 'نزاع',              variant: 'error'    },
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatPrice(val) {
  if (val == null) return '—';
  return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(val);
}

export default function DealsPage() {
  const [page, setPage]           = useState(1);
  const [statusFilter, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-deals', { page, statusFilter }],
    queryFn: () => getMyDeals({ pageNumber: page, pageSize: 10, status: statusFilter || undefined }),
  });

  const deals      = data?.items ?? data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? deals.length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          صفقاتي 🤝
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          {totalCount} صفقة إجمالاً
        </p>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['', 'PendingBuyerConfirmation', 'Active', 'Completed', 'Cancelled', 'Disputed'].map(s => (
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
            {!s ? 'الكل' : DEAL_STATUS[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="dz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="dz-table" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th>رقم الصفقة</th>
                <th>الأطراف</th>
                <th>القيمة الإجمالية</th>
                <th>الحالة</th>
                <th>تاريخ الإنشاء</th>
                <th style={{ width: '80px' }}>تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j}><div className="skeleton" style={{ height: '18px', borderRadius: '4px' }} /></td>
                    ))}
                  </tr>
                ))
              ) : deals.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div style={{ padding: '56px', textAlign: 'center' }}>
                      <Handshake size={44} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>لا توجد صفقات بعد</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                        تبدأ الصفقات عند قبول عرض أسعار
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                deals.map(deal => {
                  const st = DEAL_STATUS[deal.status] || { label: deal.status, variant: 'neutral' };
                  return (
                    <tr key={deal.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                          {deal.referenceNumber || `DEAL-${deal.id?.slice(0,8)}`}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {deal.buyer?.companyName || deal.buyerName || '—'}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                            → {deal.supplier?.companyName || deal.supplierName || '—'}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--dz-cyan)' }}>
                        {formatPrice(deal.totalPrice ?? deal.amount)}
                      </td>
                      <td><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="td-secondary">{formatDate(deal.createdAt)}</td>
                      <td>
                        <Link
                          to={`/deals/${deal.id}`}
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
            <span style={{ padding: '7px 14px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>صفحة {page} من {totalPages}</span>
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
