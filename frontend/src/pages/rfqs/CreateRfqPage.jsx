import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, AlertCircle, ArrowLeft, Package } from 'lucide-react';
import { createRfq, publishRfq } from '../../api/rfqs';
import { getCategories, getMaterials, getUnits } from '../../api/catalog';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const lineItemSchema = z.object({
  materialId: z.string().min(1, 'المادة مطلوبة'),
  quantity:   z.coerce.number().positive('الكمية يجب أن تكون أكبر من صفر'),
  unitId:     z.string().min(1, 'الوحدة مطلوبة'),
  notes:      z.string().optional(),
});

const schema = z.object({
  title:          z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
  description:    z.string().optional(),
  governorate:    z.string().optional(),
  city:           z.string().optional(),
  closingDate:    z.string().min(1, 'تاريخ الإغلاق مطلوب'),
  deliveryDate:   z.string().optional(),
  lineItems:      z.array(lineItemSchema).min(1, 'يجب إضافة مادة واحدة على الأقل'),
});

export default function CreateRfqPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: materials } = useQuery({ queryKey: ['materials-all'], queryFn: () => getMaterials({ pageSize: 100 }) });
  const { data: units } = useQuery({ queryKey: ['units'], queryFn: getUnits });

  const materialsList = materials?.items ?? materials ?? [];
  const unitsList = units ?? [];
  const categoriesList = categories ?? [];

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { lineItems: [{ materialId: '', quantity: 1, unitId: '', notes: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });

  const onSubmit = async (data, action = 'draft') => {
    setApiError('');
    setLoading(true);
    try {
      const payload = {
        ...data,
        closingDateUtc: new Date(data.closingDate).toISOString(),
        deliveryDateUtc: data.deliveryDate ? new Date(data.deliveryDate).toISOString() : undefined,
      };
      delete payload.closingDate;
      delete payload.deliveryDate;
      const rfq = await createRfq(payload);
      if (action === 'publish') {
        await publishRfq(rfq.id);
      }
      navigate('/rfqs');
    } catch (err) {
      setApiError(err.response?.data?.message || 'فشل إنشاء الطلب');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button onClick={() => navigate('/rfqs')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            طلب عرض أسعار جديد 📝
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>أدخل تفاصيل المواد التي تحتاجها</p>
        </div>
      </div>

      <form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {apiError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', background: 'var(--error-bg)', border: '1px solid var(--error)', color: 'var(--error-text)', fontSize: '0.875rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />{apiError}
          </div>
        )}

        {/* Basic info */}
        <div className="dz-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>البيانات الأساسية</h2>
          <Input label="عنوان الطلب" required placeholder="مثال: أحتاج 50 طن من الحديد" error={errors.title?.message} {...register('title')} />
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>وصف إضافي</label>
            <textarea className="dz-input" placeholder="تفاصيل إضافية، مواصفات، شروط..." rows={3} style={{ resize: 'vertical' }} {...register('description')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input label="تاريخ الإغلاق" type="date" min={today} required error={errors.closingDate?.message} {...register('closingDate')} />
            <Input label="تاريخ التسليم المتوقع" type="date" min={today} hint="اختياري" {...register('deliveryDate')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input label="المحافظة" placeholder="القاهرة" {...register('governorate')} />
            <Input label="المدينة" placeholder="مدينة نصر" {...register('city')} />
          </div>
        </div>

        {/* Line items */}
        <div className="dz-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              المواد المطلوبة <span style={{ color: 'var(--error)' }}>*</span>
            </h2>
            <Button
              type="button" variant="secondary" size="sm" leftIcon={Plus}
              onClick={() => append({ materialId: '', quantity: 1, unitId: '', notes: '' })}
            >
              إضافة مادة
            </Button>
          </div>

          {errors.lineItems?.root && (
            <div style={{ marginBottom: '12px', fontSize: '0.8125rem', color: 'var(--error-text)', display: 'flex', gap: '5px', alignItems: 'center' }}>
              <AlertCircle size={13} />{errors.lineItems.root.message || 'يجب إضافة مادة واحدة على الأقل'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {fields.map((field, index) => (
              <div key={field.id} style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={16} style={{ color: 'var(--dz-cyan)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>مادة {index + 1}</span>
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '4px', display: 'flex' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '5px' }}>المادة <span style={{ color: 'var(--error)' }}>*</span></label>
                    <select className={`dz-input${errors.lineItems?.[index]?.materialId ? ' dz-input-error' : ''}`} {...register(`lineItems.${index}.materialId`)}>
                      <option value="">اختر المادة</option>
                      {materialsList.map(m => <option key={m.id} value={m.id}>{m.nameAr || m.name}</option>)}
                    </select>
                    {errors.lineItems?.[index]?.materialId && <span style={{ fontSize: '0.75rem', color: 'var(--error-text)', marginTop: '4px', display: 'block' }}>{errors.lineItems[index].materialId.message}</span>}
                  </div>
                  <Input
                    label="الكمية"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    error={errors.lineItems?.[index]?.quantity?.message}
                    {...register(`lineItems.${index}.quantity`)}
                  />
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '5px' }}>الوحدة <span style={{ color: 'var(--error)' }}>*</span></label>
                    <select className={`dz-input${errors.lineItems?.[index]?.unitId ? ' dz-input-error' : ''}`} {...register(`lineItems.${index}.unitId`)}>
                      <option value="">اختر الوحدة</option>
                      {unitsList.map(u => <option key={u.id} value={u.id}>{u.nameAr || u.name}</option>)}
                    </select>
                    {errors.lineItems?.[index]?.unitId && <span style={{ fontSize: '0.75rem', color: 'var(--error-text)', marginTop: '4px', display: 'block' }}>{errors.lineItems[index].unitId.message}</span>}
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <Input label="ملاحظات" placeholder="مواصفات خاصة أو ملاحظات..." {...register(`lineItems.${index}.notes`)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button type="button" variant="secondary" onClick={() => navigate('/rfqs')} disabled={loading}>
            إلغاء
          </Button>
          <Button
            type="button" variant="ghost"
            loading={loading} disabled={loading}
            onClick={handleSubmit(d => onSubmit(d, 'draft'))}
          >
            حفظ كمسودة
          </Button>
          <Button
            type="button" variant="primary"
            loading={loading} disabled={loading}
            onClick={handleSubmit(d => onSubmit(d, 'publish'))}
          >
            نشر الطلب
          </Button>
        </div>
      </form>
    </div>
  );
}
