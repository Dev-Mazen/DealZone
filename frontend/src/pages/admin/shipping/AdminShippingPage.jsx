import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Package, Plus, Edit2, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import {
  getShippingProviders, createShippingProvider, updateShippingProvider,
  activateShippingProvider, deactivateShippingProvider,
  getAllShipments, adminAssignShippingProvider, adminUpdateShipmentStatus,
} from '../../../api/admin';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';

const TABS = [
  { key: 'providers', label: 'مزودو الشحن', icon: Truck   },
  { key: 'shipments', label: 'الشحنات',     icon: Package  },
];

const SHIPMENT_STATUSES = ['Pending', 'InTransit', 'Delivered', 'Failed'];
const SHIPMENT_STATUS_AR = {
  Pending:   'قيد الانتظار',
  InTransit: 'في الطريق',
  Delivered: 'تم التوصيل',
  Failed:    'فشل التوصيل',
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ══════════════════ PROVIDERS TAB ══════════════════ */
function ProvidersTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({ name: '', contactEmail: '', contactPhone: '', website: '' });
  const [err, setErr] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['shipping-providers'],
    queryFn: () => getShippingProviders({ pageSize: 100 }),
  });
  const providers = data?.items ?? data ?? [];

  const saveMut = useMutation({
    mutationFn: (d) => modal.item ? updateShippingProvider(modal.item.id, d) : createShippingProvider(d),
    onSuccess: () => { qc.invalidateQueries(['shipping-providers']); setModal({ open: false, item: null }); setErr(''); },
    onError: (e) => setErr(e?.response?.data?.message || 'حدث خطأ'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }) => active ? deactivateShippingProvider(id) : activateShippingProvider(id),
    onSuccess: () => qc.invalidateQueries(['shipping-providers']),
  });

  const openCreate = () => { setForm({ name: '', contactEmail: '', contactPhone: '', website: '' }); setErr(''); setModal({ open: true, item: null }); };
  const openEdit   = (item) => { setForm({ name: item.name || '', contactEmail: item.contactEmail || '', contactPhone: item.contactPhone || '', website: item.website || '' }); setErr(''); setModal({ open: true, item }); };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <Button variant="primary" leftIcon={Plus} onClick={openCreate}>إضافة مزود</Button>
      </div>

      <div className="dz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <table className="dz-table">
          <thead>
            <tr>
              <th>المزود</th>
              <th>البريد الإلكتروني</th>
              <th>الحالة</th>
              <th style={{ width: '120px' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <tr key={i}>{[1,2,3,4].map(j=><td key={j}><div className="skeleton" style={{height:'16px',borderRadius:'4px'}}/></td>)}</tr>)
            ) : providers.length === 0 ? (
              <tr><td colSpan={4} style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>لا توجد مزودون مسجلون</td></tr>
            ) : (
              providers.map(prov => (
                <tr key={prov.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prov.name}</div>
                    {prov.website && <div className="td-secondary">{prov.website}</div>}
                  </td>
                  <td className="td-secondary">{prov.contactEmail || '—'}</td>
                  <td>
                    <Badge variant={prov.isActive ? 'success' : 'neutral'}>
                      {prov.isActive ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => openEdit(prov)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => toggleMut.mutate({ id: prov.id, active: prov.isActive })}
                        style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem',
                          border: 'none',
                          background: prov.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: prov.isActive ? 'var(--error)' : 'var(--success)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                      >
                        {prov.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        {prov.isActive ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? 'تعديل المزود' : 'إضافة مزود جديد'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '8px 0' }}>
          <Input label="الاسم" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="اسم الشركة" />
          <Input label="البريد الإلكتروني" value={form.contactEmail} onChange={e=>setForm(f=>({...f,contactEmail:e.target.value}))} placeholder="email@example.com" />
          <Input label="رقم الهاتف" value={form.contactPhone} onChange={e=>setForm(f=>({...f,contactPhone:e.target.value}))} placeholder="+20..." />
          <Input label="الموقع الإلكتروني" value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://..." />
          {err && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModal({ open: false, item: null })}>إلغاء</Button>
            <Button variant="primary" loading={saveMut.isLoading} onClick={() => { setErr(''); saveMut.mutate(form); }}>حفظ</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ══════════════════ SHIPMENTS TAB ══════════════════ */
function ShipmentsTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [assignModal, setAssignModal] = useState({ open: false, shipment: null });
  const [statusModal, setStatusModal] = useState({ open: false, shipment: null });
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedStatus, setSelectedStatus]     = useState('');
  const [trackingNum, setTrackingNum]           = useState('');
  const [err, setErr] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shipments', page],
    queryFn: () => getAllShipments({ pageNumber: page, pageSize: 10 }),
  });

  const { data: provData } = useQuery({
    queryKey: ['shipping-providers'],
    queryFn: () => getShippingProviders({ pageSize: 100 }),
  });
  const providers   = provData?.items ?? provData ?? [];
  const shipments   = data?.items ?? data ?? [];
  const totalPages  = data?.totalPages ?? 1;

  const assignMut = useMutation({
    mutationFn: ({ id, providerId }) => adminAssignShippingProvider(id, { shippingProviderId: providerId }),
    onSuccess: () => { qc.invalidateQueries(['admin-shipments']); setAssignModal({ open: false, shipment: null }); setErr(''); },
    onError: (e) => setErr(e?.response?.data?.message || 'حدث خطأ'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status, tracking }) => adminUpdateShipmentStatus(id, { status, trackingNumber: tracking }),
    onSuccess: () => { qc.invalidateQueries(['admin-shipments']); setStatusModal({ open: false, shipment: null }); setErr(''); },
    onError: (e) => setErr(e?.response?.data?.message || 'حدث خطأ'),
  });

  return (
    <>
      <div className="dz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="dz-table" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th>رقم التتبع</th>
                <th>الصفقة</th>
                <th>المزود</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th style={{ width: '130px' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <tr key={i}>{[1,2,3,4,5,6].map(j=><td key={j}><div className="skeleton" style={{height:'16px',borderRadius:'4px'}}/></td>)}</tr>)
              ) : shipments.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>لا توجد شحنات</td></tr>
              ) : (
                shipments.map(ship => (
                  <tr key={ship.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {ship.trackingNumber || '—'}
                    </td>
                    <td className="td-secondary">
                      {ship.deal?.referenceNumber || ship.dealReferenceNumber || `DEAL-${ship.dealId?.slice(0,8)}`}
                    </td>
                    <td className="td-secondary">{ship.shippingProvider?.name || ship.providerName || '—'}</td>
                    <td>
                      <Badge variant={
                        ship.status === 'Delivered' ? 'success'
                        : ship.status === 'InTransit' ? 'info'
                        : ship.status === 'Failed' ? 'error'
                        : 'warning'
                      }>
                        {SHIPMENT_STATUS_AR[ship.status] || ship.status}
                      </Badge>
                    </td>
                    <td className="td-secondary">{formatDate(ship.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => { setAssignModal({ open: true, shipment: ship }); setSelectedProvider(ship.shippingProviderId || ''); setErr(''); }}
                          style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                          تعيين
                        </button>
                        <button
                          onClick={() => { setStatusModal({ open: true, shipment: ship }); setSelectedStatus(ship.status || 'Pending'); setTrackingNum(ship.trackingNumber || ''); setErr(''); }}
                          style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', border: 'none', background: 'rgba(18,102,214,0.1)', color: 'var(--dz-blue)', cursor: 'pointer' }}
                        >
                          حالة
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
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: page===1?'not-allowed':'pointer' }}>السابق</button>
            <span style={{ padding: '7px 14px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>صفحة {page} من {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: page===totalPages?'not-allowed':'pointer' }}>التالي</button>
          </div>
        )}
      </div>

      {/* Assign Provider Modal */}
      <Modal isOpen={assignModal.open} onClose={() => setAssignModal({ open: false, shipment: null })} title="تعيين مزود الشحن">
        <div style={{ padding: '8px 0' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>المزود</label>
          <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}
            style={{ width:'100%',padding:'10px 14px',borderRadius:'10px',border:'1px solid var(--border-input)',background:'var(--bg-input)',color:'var(--text-primary)',fontSize:'0.9375rem',fontFamily:'inherit',outline:'none', marginBottom: '12px' }}
          >
            <option value="">-- اختر مزوداً --</option>
            {providers.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {err && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '10px' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setAssignModal({ open: false, shipment: null })}>إلغاء</Button>
            <Button variant="primary" loading={assignMut.isLoading} onClick={() => { setErr(''); assignMut.mutate({ id: assignModal.shipment.id, providerId: selectedProvider }); }}>تعيين</Button>
          </div>
        </div>
      </Modal>

      {/* Update Status Modal */}
      <Modal isOpen={statusModal.open} onClose={() => setStatusModal({ open: false, shipment: null })} title="تحديث حالة الشحنة">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '8px 0' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>الحالة</label>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
              style={{ width:'100%',padding:'10px 14px',borderRadius:'10px',border:'1px solid var(--border-input)',background:'var(--bg-input)',color:'var(--text-primary)',fontSize:'0.9375rem',fontFamily:'inherit',outline:'none' }}
            >
              {SHIPMENT_STATUSES.map(s => <option key={s} value={s}>{SHIPMENT_STATUS_AR[s]}</option>)}
            </select>
          </div>
          <Input
            label="رقم التتبع"
            value={trackingNum}
            onChange={e => setTrackingNum(e.target.value)}
            placeholder="رقم التتبع (اختياري)"
          />
          {err && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setStatusModal({ open: false, shipment: null })}>إلغاء</Button>
            <Button variant="primary" loading={statusMut.isLoading} onClick={() => { setErr(''); statusMut.mutate({ id: statusModal.shipment.id, status: selectedStatus, tracking: trackingNum }); }}>تحديث</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ══════════════════ MAIN PAGE ══════════════════ */
export default function AdminShippingPage() {
  const [activeTab, setActiveTab] = useState('providers');

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          إدارة الشحن 🚚
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          إدارة مزودي الشحن والشحنات
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', border: 'none', background: 'none',
                color: activeTab === tab.key ? 'var(--dz-cyan)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.key ? 700 : 400,
                cursor: 'pointer', fontSize: '0.9375rem',
                borderBottom: activeTab === tab.key ? '2px solid var(--dz-cyan)' : '2px solid transparent',
                marginBottom: '-1px', transition: 'all 150ms',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'providers' && <ProvidersTab />}
      {activeTab === 'shipments' && <ShipmentsTab />}
    </div>
  );
}
