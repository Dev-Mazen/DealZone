import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { getAllDisputes, getDisputeById, resolveDispute } from '../../../api/admin';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminDisputesPage() {
  const [page, setPage] = useState(1);
  const [resolveModal, setResolveModal] = useState({ open: false, dispute: null });
  const [resolution, setResolution] = useState('');
  const [err, setErr] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', page],
    queryFn: () => getAllDisputes({ pageNumber: page, pageSize: 10 }),
  });

  const resolveMut = useMutation({
    mutationFn: ({ id, resolution: r }) => resolveDispute(id, { resolution: r }),
    onSuccess: () => {
      qc.invalidateQueries(['admin-disputes']);
      setResolveModal({ open: false, dispute: null });
      setResolution('');
      setErr('');
    },
    onError: (e) => setErr(e?.response?.data?.message || 'حدث خطأ أثناء الحل'),
  });

  const disputes   = data?.items ?? data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? disputes.length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          النزاعات ⚖️
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          {totalCount} نزاع إجمالاً
        </p>
      </div>

      <div className="dz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="dz-table" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th>الصفقة</th>
                <th>الأطراف</th>
                <th>سبب النزاع</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th style={{ width: '100px' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{[1,2,3,4,5,6].map(j => <td key={j}><div className="skeleton" style={{ height: '18px', borderRadius: '4px' }} /></td>)}</tr>
                ))
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div style={{ padding: '56px', textAlign: 'center' }}>
                      <CheckCircle size={44} style={{ color: 'var(--success)', opacity: 0.4, margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>لا توجد نزاعات مفتوحة 🎉</p>
                    </div>
                  </td>
                </tr>
              ) : (
                disputes.map(dispute => (
                  <tr key={dispute.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {dispute.deal?.referenceNumber || dispute.dealReferenceNumber || `DEAL-${dispute.dealId?.slice(0,8)}`}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                          {dispute.openedBy?.companyName || dispute.openedByName || '—'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          ضد: {dispute.otherParty?.companyName || dispute.otherPartyName || '—'}
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {dispute.reason || '—'}
                      </p>
                    </td>
                    <td>
                      <Badge variant={dispute.isResolved || dispute.status === 'Resolved' ? 'success' : 'error'}>
                        {dispute.isResolved || dispute.status === 'Resolved' ? 'محلول' : 'مفتوح'}
                      </Badge>
                    </td>
                    <td className="td-secondary">{formatDate(dispute.createdAt)}</td>
                    <td>
                      {!dispute.isResolved && dispute.status !== 'Resolved' && (
                        <button
                          onClick={() => { setResolveModal({ open: true, dispute }); setResolution(''); setErr(''); }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '5px 10px', borderRadius: '6px', fontSize: '0.8125rem',
                            border: 'none', background: 'rgba(16,185,129,0.12)',
                            color: 'var(--success)', cursor: 'pointer',
                          }}
                        >
                          <CheckCircle size={13} /> حل
                        </button>
                      )}
                      {(dispute.isResolved || dispute.status === 'Resolved') && (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>محلول</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>السابق</button>
            <span style={{ padding: '7px 14px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>صفحة {page} من {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>التالي</button>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      <Modal isOpen={resolveModal.open} onClose={() => setResolveModal({ open: false, dispute: null })} title="حل النزاع">
        <div style={{ padding: '8px 0' }}>
          {resolveModal.dispute && (
            <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '10px', background: 'var(--bg-elevated)' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>سبب النزاع</p>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{resolveModal.dispute.reason}</p>
            </div>
          )}
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            القرار / الحل
          </label>
          <textarea
            value={resolution}
            onChange={e => setResolution(e.target.value)}
            placeholder="أدخل قرار حل النزاع..."
            rows={4}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '10px',
              border: '1px solid var(--border-input)', background: 'var(--bg-input)',
              color: 'var(--text-primary)', fontSize: '0.9375rem', resize: 'vertical',
              fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
            }}
          />
          {err && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '8px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => setResolveModal({ open: false, dispute: null })}>إلغاء</Button>
            <Button
              variant="primary" leftIcon={CheckCircle}
              loading={resolveMut.isLoading}
              onClick={() => {
                if (!resolution.trim()) { setErr('يجب إدخال قرار الحل'); return; }
                resolveMut.mutate({ id: resolveModal.dispute.id, resolution });
              }}
            >
              تأكيد الحل
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
