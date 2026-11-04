import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Eye, CheckCircle, XCircle, MessageSquare, FileText, Download } from 'lucide-react';
import {
  getPendingVerifications, getCompanyVerificationDetails,
  approveCompany, rejectCompany, requestChanges, downloadDocument,
} from '../../../api/admin';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

const DOC_TYPES = {
  1: 'السجل التجاري',
  2: 'البطاقة الضريبية',
  3: 'السجل الصناعي',
  4: 'شهادة الجودة',
  5: 'أخرى',
};

export default function AdminVerificationPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, type: '', id: '' });
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pending-verifications', page],
    queryFn: () => getPendingVerifications({ pageNumber: page, pageSize: 10 }),
  });

  const { data: companyDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['company-verification-detail', selected],
    queryFn: () => getCompanyVerificationDetails(selected),
    enabled: !!selected && detailModal,
  });

  const makeAction = (fn, label) => useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries(['pending-verifications']);
      setActionModal({ open: false, type: '', id: '' });
      setReason('');
    },
    onError: (e) => setActionError(e?.response?.data?.message || `حدث خطأ أثناء ${label}`),
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const approveMut = makeAction((id) => approveCompany(id), 'الاعتماد');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const rejectMut  = makeAction(({ id, reason: r }) => rejectCompany(id, { reason: r }), 'الرفض');
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const changesMut = makeAction(({ id, notes }) => requestChanges(id, { notes }), 'طلب التعديل');

  const companies  = data?.items ?? data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? companies.length;

  const openAction = (type, id) => {
    setActionError('');
    setReason('');
    setActionModal({ open: true, type, id });
  };

  const submitAction = () => {
    setActionError('');
    const { type, id } = actionModal;
    if (type === 'approve') approveMut.mutate(id);
    else if (type === 'reject') rejectMut.mutate({ id, reason });
    else if (type === 'changes') changesMut.mutate({ id, notes: reason });
  };

  const actionConfig = {
    approve: { title: 'اعتماد الشركة', btn: 'نعم، اعتماد', variant: 'primary', icon: CheckCircle },
    reject:  { title: 'رفض الشركة',    btn: 'تأكيد الرفض', variant: 'danger', icon: XCircle },
    changes: { title: 'طلب تعديلات',   btn: 'إرسال الطلب', variant: 'ghost',  icon: MessageSquare },
  };
  const cfg = actionConfig[actionModal.type] || {};
  const actionLoading = approveMut.isLoading || rejectMut.isLoading || changesMut.isLoading;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          طلبات التحقق 🏢
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          {totalCount} طلب في انتظار المراجعة
        </p>
      </div>

      <div className="dz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="dz-table" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th>الشركة</th>
                <th>النوع</th>
                <th>المستندات</th>
                <th>تاريخ التقديم</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{[1,2,3,4,5].map(j => <td key={j}><div className="skeleton" style={{ height: '18px', borderRadius: '4px' }} /></td>)}</tr>
                ))
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div style={{ padding: '56px', textAlign: 'center' }}>
                      <CheckCircle size={44} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>لا توجد طلبات معلقة 🎉</p>
                    </div>
                  </td>
                </tr>
              ) : (
                companies.map(co => (
                  <tr key={co.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{co.name || co.companyName}</div>
                      <div className="td-secondary">{co.email || co.contactEmail || '—'}</div>
                    </td>
                    <td>
                      <Badge variant={co.role === 'Buyer' ? 'info' : 'brand'}>
                        {co.role === 'Buyer' ? 'مشتري' : 'مورِّد'}
                      </Badge>
                    </td>
                    <td className="td-secondary">{co.documentCount ?? co.documents?.length ?? '—'} مستند</td>
                    <td className="td-secondary">{formatDate(co.submittedAt || co.verificationSubmittedAt || co.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => { setSelected(co.id); setDetailModal(true); }}
                          style={{
                            padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem',
                            border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          <Eye size={13} /> عرض
                        </button>
                        <button
                          onClick={() => openAction('approve', co.id)}
                          style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', border: 'none', background: 'rgba(16,185,129,0.12)', color: 'var(--success)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CheckCircle size={13} /> اعتماد
                        </button>
                        <button
                          onClick={() => openAction('reject', co.id)}
                          style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', border: 'none', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <XCircle size={13} /> رفض
                        </button>
                        <button
                          onClick={() => openAction('changes', co.id)}
                          style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <MessageSquare size={13} /> تعديل
                        </button>
                      </div>
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

      {/* Detail Modal */}
      <Modal isOpen={detailModal} onClose={() => { setDetailModal(false); setSelected(null); }} title="تفاصيل الشركة">
        <div style={{ padding: '8px 0' }}>
          {detailLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />)}
            </div>
          ) : companyDetail ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                {[
                  ['الاسم', companyDetail.name || companyDetail.companyName],
                  ['النوع', companyDetail.role],
                  ['البريد', companyDetail.email || companyDetail.contactEmail],
                  ['المدينة', companyDetail.city || '—'],
                ].map(([lbl, val]) => (
                  <div key={lbl}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 3px', fontWeight: 500 }}>{lbl}</p>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{val || '—'}</p>
                  </div>
                ))}
              </div>
              {/* Documents */}
              {(companyDetail.documents || []).length > 0 && (
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>المستندات</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {companyDetail.documents.map((doc, i) => (
                      <div key={doc.id || i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-elevated)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} style={{ color: 'var(--dz-cyan)' }} />
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {DOC_TYPES[doc.documentType] || doc.name || `مستند ${i+1}`}
                          </span>
                        </div>
                        <button
                          onClick={() => downloadDocument(selected, doc.id)}
                          style={{
                            padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem',
                            border: '1px solid var(--border)', background: 'var(--bg-card)',
                            color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          <Download size={13} /> تنزيل
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>لا توجد بيانات</p>
          )}
        </div>
      </Modal>

      {/* Action Modal */}
      <Modal isOpen={actionModal.open} onClose={() => setActionModal({ open: false, type: '', id: '' })} title={cfg.title || ''}>
        <div style={{ padding: '8px 0' }}>
          {actionModal.type === 'approve' ? (
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              هل أنت متأكد من اعتماد هذه الشركة؟ سيتم منحها صلاحيات التداول الكاملة.
            </p>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {actionModal.type === 'reject' ? 'سبب الرفض:' : 'ملاحظات التعديل المطلوبة:'}
              </p>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={actionModal.type === 'reject' ? 'سبب الرفض...' : 'التعديلات المطلوبة...'}
                rows={3}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: '1px solid var(--border-input)', background: 'var(--bg-input)',
                  color: 'var(--text-primary)', fontSize: '0.9375rem', resize: 'vertical',
                  fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
                }}
              />
            </>
          )}
          {actionError && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '8px' }}>{actionError}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="ghost" onClick={() => setActionModal({ open: false, type: '', id: '' })}>إلغاء</Button>
            <Button
              variant={cfg.variant || 'primary'}
              leftIcon={cfg.icon}
              loading={actionLoading}
              onClick={submitAction}
            >
              {cfg.btn}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
