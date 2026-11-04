import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, LayoutGrid, Package, Ruler, X } from 'lucide-react';
import {
  getCategories, getCategoryById, getMaterials, getUnits,
} from '../../../api/catalog';
import {
  adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  adminCreateMaterial, adminUpdateMaterial, adminDeleteMaterial,
  adminCreateUnit, adminUpdateUnit, adminDeleteUnit,
} from '../../../api/admin';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';

const TABS = [
  { key: 'categories', label: 'الفئات',   icon: LayoutGrid },
  { key: 'materials',  label: 'المواد',    icon: Package    },
  { key: 'units',      label: 'الوحدات',   icon: Ruler      },
];

function ConfirmDeleteModal({ open, onClose, onConfirm, loading, name }) {
  return (
    <Modal isOpen={open} onClose={onClose} title="تأكيد الحذف">
      <div style={{ padding: '8px 0' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          هل أنت متأكد من حذف <strong style={{ color: 'var(--text-primary)' }}>{name}</strong>؟ لا يمكن التراجع.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button variant="danger" leftIcon={Trash2} loading={loading} onClick={onConfirm}>حذف</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════
   CATEGORIES TAB
═══════════════════════════════════════════════════════ */
function CategoriesTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false, item: null });
  const [delModal, setDelModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({ name: '', description: '', arabicName: '' });
  const [err, setErr] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['admin-categories'], queryFn: () => getCategories({ pageSize: 100 }) });
  const items = data?.items ?? data ?? [];

  const saveMut = useMutation({
    mutationFn: (d) => modal.item ? adminUpdateCategory(modal.item.id, d) : adminCreateCategory(d),
    onSuccess: () => { qc.invalidateQueries(['admin-categories']); setModal({ open: false, item: null }); setErr(''); },
    onError: (e) => setErr(e?.response?.data?.message || 'حدث خطأ'),
  });

  const delMut = useMutation({
    mutationFn: (id) => adminDeleteCategory(id),
    onSuccess: () => { qc.invalidateQueries(['admin-categories']); setDelModal({ open: false, item: null }); },
  });

  const openCreate = () => { setForm({ name: '', description: '', arabicName: '' }); setErr(''); setModal({ open: true, item: null }); };
  const openEdit = (item) => { setForm({ name: item.name, description: item.description || '', arabicName: item.arabicName || '' }); setErr(''); setModal({ open: true, item }); };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <Button variant="primary" leftIcon={Plus} onClick={openCreate}>إضافة فئة</Button>
      </div>

      <div className="dz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <table className="dz-table">
          <thead><tr><th>الاسم</th><th>الاسم بالعربية</th><th>الوصف</th><th style={{ width: '100px' }}>إجراءات</th></tr></thead>
          <tbody>
            {isLoading ? Array.from({length:4}).map((_,i) => <tr key={i}>{[1,2,3,4].map(j=><td key={j}><div className="skeleton" style={{height:'16px',borderRadius:'4px'}}/></td>)}</tr>) :
            items.length === 0 ? <tr><td colSpan={4} style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>لا توجد فئات</td></tr> :
            items.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</td>
                <td className="td-secondary">{item.arabicName || '—'}</td>
                <td className="td-secondary" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEdit(item)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={13} /></button>
                    <button onClick={() => setDelModal({ open: true, item })} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? 'تعديل الفئة' : 'إضافة فئة جديدة'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '8px 0' }}>
          <Input label="الاسم" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="اسم الفئة" />
          <Input label="الاسم بالعربية" value={form.arabicName} onChange={e=>setForm(f=>({...f,arabicName:e.target.value}))} placeholder="الاسم بالعربية" />
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>الوصف</label>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2}
              style={{ width:'100%',padding:'10px 14px',borderRadius:'10px',border:'1px solid var(--border-input)',background:'var(--bg-input)',color:'var(--text-primary)',fontSize:'0.9375rem',resize:'vertical',fontFamily:'inherit',boxSizing:'border-box',outline:'none' }}
            />
          </div>
          {err && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModal({ open: false, item: null })}>إلغاء</Button>
            <Button variant="primary" loading={saveMut.isLoading} onClick={() => { setErr(''); saveMut.mutate(form); }}>حفظ</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        open={delModal.open} name={delModal.item?.name}
        onClose={() => setDelModal({ open: false, item: null })}
        loading={delMut.isLoading}
        onConfirm={() => delMut.mutate(delModal.item?.id)}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   MATERIALS TAB
═══════════════════════════════════════════════════════ */
function MaterialsTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false, item: null });
  const [delModal, setDelModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({ name: '', arabicName: '', description: '', categoryId: '' });
  const [err, setErr] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['admin-materials'], queryFn: () => getMaterials({ pageSize: 100 }) });
  const { data: catData } = useQuery({ queryKey: ['admin-categories'], queryFn: () => getCategories({ pageSize: 100 }) });
  const items    = data?.items ?? data ?? [];
  const catItems = catData?.items ?? catData ?? [];

  const saveMut = useMutation({
    mutationFn: (d) => modal.item ? adminUpdateMaterial(modal.item.id, d) : adminCreateMaterial(d),
    onSuccess: () => { qc.invalidateQueries(['admin-materials']); setModal({ open: false, item: null }); setErr(''); },
    onError: (e) => setErr(e?.response?.data?.message || 'حدث خطأ'),
  });

  const delMut = useMutation({
    mutationFn: (id) => adminDeleteMaterial(id),
    onSuccess: () => { qc.invalidateQueries(['admin-materials']); setDelModal({ open: false, item: null }); },
  });

  const openCreate = () => { setForm({ name: '', arabicName: '', description: '', categoryId: '' }); setErr(''); setModal({ open: true, item: null }); };
  const openEdit = (item) => { setForm({ name: item.name, arabicName: item.arabicName || '', description: item.description || '', categoryId: item.categoryId || '' }); setErr(''); setModal({ open: true, item }); };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <Button variant="primary" leftIcon={Plus} onClick={openCreate}>إضافة مادة</Button>
      </div>

      <div className="dz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <table className="dz-table">
          <thead><tr><th>الاسم</th><th>الفئة</th><th>الاسم بالعربية</th><th style={{ width: '100px' }}>إجراءات</th></tr></thead>
          <tbody>
            {isLoading ? Array.from({length:4}).map((_,i) => <tr key={i}>{[1,2,3,4].map(j=><td key={j}><div className="skeleton" style={{height:'16px',borderRadius:'4px'}}/></td>)}</tr>) :
            items.length === 0 ? <tr><td colSpan={4} style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>لا توجد مواد</td></tr> :
            items.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</td>
                <td className="td-secondary">{item.category?.name || item.categoryName || '—'}</td>
                <td className="td-secondary">{item.arabicName || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEdit(item)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={13} /></button>
                    <button onClick={() => setDelModal({ open: true, item })} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? 'تعديل المادة' : 'إضافة مادة جديدة'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '8px 0' }}>
          <Input label="الاسم" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="اسم المادة" />
          <Input label="الاسم بالعربية" value={form.arabicName} onChange={e=>setForm(f=>({...f,arabicName:e.target.value}))} placeholder="الاسم بالعربية" />
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>الفئة</label>
            <select value={form.categoryId} onChange={e=>setForm(f=>({...f,categoryId:e.target.value}))}
              style={{ width:'100%',padding:'10px 14px',borderRadius:'10px',border:'1px solid var(--border-input)',background:'var(--bg-input)',color:'var(--text-primary)',fontSize:'0.9375rem',fontFamily:'inherit',outline:'none' }}
            >
              <option value="">-- اختر فئة --</option>
              {catItems.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {err && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModal({ open: false, item: null })}>إلغاء</Button>
            <Button variant="primary" loading={saveMut.isLoading} onClick={() => { setErr(''); saveMut.mutate(form); }}>حفظ</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        open={delModal.open} name={delModal.item?.name}
        onClose={() => setDelModal({ open: false, item: null })}
        loading={delMut.isLoading}
        onConfirm={() => delMut.mutate(delModal.item?.id)}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   UNITS TAB
═══════════════════════════════════════════════════════ */
function UnitsTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false, item: null });
  const [delModal, setDelModal] = useState({ open: false, item: null });
  const [form, setForm] = useState({ name: '', symbol: '', arabicName: '' });
  const [err, setErr] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['admin-units'], queryFn: () => getUnits({ pageSize: 100 }) });
  const items = data?.items ?? data ?? [];

  const saveMut = useMutation({
    mutationFn: (d) => modal.item ? adminUpdateUnit(modal.item.id, d) : adminCreateUnit(d),
    onSuccess: () => { qc.invalidateQueries(['admin-units']); setModal({ open: false, item: null }); setErr(''); },
    onError: (e) => setErr(e?.response?.data?.message || 'حدث خطأ'),
  });

  const delMut = useMutation({
    mutationFn: (id) => adminDeleteUnit(id),
    onSuccess: () => { qc.invalidateQueries(['admin-units']); setDelModal({ open: false, item: null }); },
  });

  const openCreate = () => { setForm({ name: '', symbol: '', arabicName: '' }); setErr(''); setModal({ open: true, item: null }); };
  const openEdit = (item) => { setForm({ name: item.name, symbol: item.symbol || '', arabicName: item.arabicName || '' }); setErr(''); setModal({ open: true, item }); };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <Button variant="primary" leftIcon={Plus} onClick={openCreate}>إضافة وحدة</Button>
      </div>

      <div className="dz-card" style={{ overflow: 'hidden', padding: 0 }}>
        <table className="dz-table">
          <thead><tr><th>الاسم</th><th>الرمز</th><th>الاسم بالعربية</th><th style={{ width: '100px' }}>إجراءات</th></tr></thead>
          <tbody>
            {isLoading ? Array.from({length:4}).map((_,i) => <tr key={i}>{[1,2,3,4].map(j=><td key={j}><div className="skeleton" style={{height:'16px',borderRadius:'4px'}}/></td>)}</tr>) :
            items.length === 0 ? <tr><td colSpan={4} style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>لا توجد وحدات</td></tr> :
            items.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</td>
                <td><span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-elevated)', fontFamily: 'monospace', fontSize: '0.875rem' }}>{item.symbol || '—'}</span></td>
                <td className="td-secondary">{item.arabicName || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEdit(item)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={13} /></button>
                    <button onClick={() => setDelModal({ open: true, item })} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '8px 0' }}>
          <Input label="الاسم" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="طن، كيلوجرام..." />
          <Input label="الرمز" value={form.symbol} onChange={e=>setForm(f=>({...f,symbol:e.target.value}))} placeholder="kg, t, m..." />
          <Input label="الاسم بالعربية" value={form.arabicName} onChange={e=>setForm(f=>({...f,arabicName:e.target.value}))} placeholder="الاسم بالعربية" />
          {err && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{err}</p>}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setModal({ open: false, item: null })}>إلغاء</Button>
            <Button variant="primary" loading={saveMut.isLoading} onClick={() => { setErr(''); saveMut.mutate(form); }}>حفظ</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        open={delModal.open} name={delModal.item?.name}
        onClose={() => setDelModal({ open: false, item: null })}
        loading={delMut.isLoading}
        onConfirm={() => delMut.mutate(delModal.item?.id)}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          إدارة الكتالوج 📦
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          إدارة الفئات والمواد الخام والوحدات
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
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

      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'materials'  && <MaterialsTab />}
      {activeTab === 'units'      && <UnitsTab />}
    </div>
  );
}
