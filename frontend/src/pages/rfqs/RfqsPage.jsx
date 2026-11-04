import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, Clock, CheckCircle, XCircle, Eye, Filter } from 'lucide-react';
import { getMyRfqs, getPublishedRfqs } from '../../api/rfqs';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const STATUS_MAP = {
  Draft:     { label: 'مسودة',    variant: 'neutral' },
  Published: { label: 'منشور',   variant: 'info' },
  Closed:    { label: 'مغلق',    variant: 'neutral' },
  Cancelled: { label: 'ملغي',    variant: 'error' },
  Awarded:   { label: 'مُنجز',   variant: 'success' },
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function RfqsPage() {
  const { companyRole } = useAuth();
  const isBuyer = companyRole === 'Buyer';
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['rfqs', isBuyer ? 'mine' : 'published', { page, statusFilter }],
    queryFn: () => isBuyer
      ? getMyRfqs({ pageNumber: page, pageSize: 10, status: statusFilter || undefined })
      : getPublishedRfqs({ pageNumber: page, pageSize: 10 }),
  });

  const rfqs = data?.items ?? data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? rfqs.length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {isBuyer ? 'طلباتي 📋' : 'سوق العروض 🏪'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {isBuyer ? `${totalCount} طلب إجمالاً` : `${totalCount} طلب متاح`}
          </p>
        </div>
        {isBuyer && (
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate('/rfqs/create')}>
            طلب جديد
          </Button>
        )}
      </div>

      {/* Filters (buyer only) */}
      {isBuyer && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['', 'Draft', 'Published', 'Closed', 'Awarded', 'Cancelled'].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '0.8125rem',
                border: `1px solid ${statusFilter === s ? 'var(--dz-cyan)' : 'var(--border)'}`,
                background: statusFilter === s ? 'rgba(0,217,245,0.1)' : 'var(--bg-card)',
                color: statusFilter === s ? 'var(--dz-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer', fontWeight: statusFilter === s ? 600 : 400,
                transition: 'all 150ms',
              }}
            >
              {!s ? 'الكل' : STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="dz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="dz-table" style={{ minWidth: '600px' }}>
            <thead>
              <tr>
                <th>رقم الطلب / العنوان</th>
                <th>الحالة</th>
                <th>تاريخ الإغلاق</th>
                <th>تاريخ الإنشاء</th>
                <th style={{ width: '80px' }}>تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4,5].map(j => (
                      <td key={j}><div className="skeleton" style={{ height: '18px', borderRadius: '4px' }} /></td>
                    ))}
                  </tr>
                ))
              ) : rfqs.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div style={{ padding: '48px', textAlign: 'center' }}>
                      <FileText size={40} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                        {isBuyer ? 'لا توجد طلبات بعد. أنشئ طلبك الأول!' : 'لا توجد طلبات متاحة حالياً'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rfqs.map(rfq => {
                  const st = STATUS_MAP[rfq.status] || { label: rfq.status, variant: 'neutral' };
                  return (
                    <tr key={rfq.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {rfq.title || rfq.referenceNumber || `RFQ-${rfq.id?.slice(0,8)}`}
                        </div>
                        {rfq.referenceNumber && <div className="td-secondary">{rfq.referenceNumber}</div>}
                      </td>
                      <td><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="td-secondary">{formatDate(rfq.closingDateUtc || rfq.closingDate)}</td>
                      <td className="td-secondary">{formatDate(rfq.createdAt)}</td>
                      <td>
                        <Link
                          to={`/rfqs/${rfq.id}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '6px 10px', borderRadius: '6px',
                            background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                            textDecoration: 'none', fontSize: '0.8125rem',
                            transition: 'all 150ms',
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
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: page===1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page===1 ? 'not-allowed' : 'pointer' }}>السابق</button>
            <span style={{ padding: '7px 14px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>صفحة {page} من {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: page===totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: page===totalPages ? 'not-allowed' : 'pointer' }}>التالي</button>
          </div>
        )}
      </div>
    </div>
  );
}
