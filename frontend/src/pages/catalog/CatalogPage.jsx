import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, Grid, List, ChevronRight, Box } from 'lucide-react';
import { getCategories, getMaterials } from '../../api/catalog';
import { Spinner } from '../../components/ui/Spinner';

function CategoryTree({ categories, selected, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          width: '100%', textAlign: 'start', padding: '10px 12px', borderRadius: '8px',
          background: !selected ? 'rgba(0,217,245,0.1)' : 'transparent',
          border: !selected ? '1px solid var(--dz-cyan)' : '1px solid transparent',
          color: !selected ? 'var(--dz-cyan)' : 'var(--text-secondary)',
          fontWeight: !selected ? 600 : 400, fontSize: '0.875rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 150ms',
        }}
      >
        <Grid size={15} />
        كل الفئات
      </button>
      {(categories || []).map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          style={{
            width: '100%', textAlign: 'start', padding: '10px 12px', borderRadius: '8px',
            background: selected === cat.id ? 'rgba(0,217,245,0.1)' : 'transparent',
            border: selected === cat.id ? '1px solid var(--dz-cyan)' : '1px solid transparent',
            color: selected === cat.id ? 'var(--dz-cyan)' : 'var(--text-secondary)',
            fontWeight: selected === cat.id ? 600 : 400, fontSize: '0.875rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all 150ms',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={15} />
            {cat.nameAr || cat.name}
          </span>
          {selected === cat.id && <ChevronRight size={14} />}
        </button>
      ))}
    </div>
  );
}

function MaterialCard({ material, viewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="dz-card" style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
          background: 'var(--bg-elevated)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Box size={22} style={{ color: 'var(--dz-cyan)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem', marginBottom: '4px' }}>
            {material.nameAr || material.name}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {material.descriptionAr || material.description || '—'}
          </div>
        </div>
        <div style={{ textAlign: 'end', flexShrink: 0 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>وحدة القياس</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
            borderRadius: '20px', background: 'rgba(0,217,245,0.1)',
            color: 'var(--dz-cyan)', fontSize: '0.8125rem', fontWeight: 600,
          }}>
            {material.unit?.nameAr || material.unit?.name || material.unitName || '—'}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="dz-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        width: '100%', height: '80px', borderRadius: '10px',
        background: 'var(--bg-elevated)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Box size={32} style={{ color: 'var(--dz-cyan)', opacity: 0.6 }} />
      </div>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem', marginBottom: '6px' }}>
          {material.nameAr || material.name}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {material.descriptionAr || material.description || 'لا يوجد وصف'}
        </div>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>وحدة القياس:</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
          borderRadius: '20px', background: 'rgba(0,217,245,0.1)',
          color: 'var(--dz-cyan)', fontSize: '0.8125rem', fontWeight: 600,
        }}>
          {material.unit?.nameAr || material.unit?.name || material.unitName || '—'}
        </span>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: materialsData, isLoading: matsLoading } = useQuery({
    queryKey: ['materials', { categoryId: selectedCategory, searchTerm: debouncedSearch, pageNumber: page, pageSize }],
    queryFn: () => getMaterials({ categoryId: selectedCategory, searchTerm: debouncedSearch || undefined, pageNumber: page, pageSize }),
    keepPreviousData: true,
  });

  const materials = materialsData?.items ?? materialsData ?? [];
  const totalPages = materialsData?.totalPages ?? 1;
  const totalCount = materialsData?.totalCount ?? materials.length;

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 400);
  };

  const handleCategorySelect = (id) => { setSelectedCategory(id); setPage(1); };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          الكتالوج 📦
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>تصفّح المواد الخام الصناعية المتاحة</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Sidebar: Categories */}
        <div style={{
          width: '220px', flexShrink: 0,
          display: 'none', /* hidden on mobile, shown via CSS */
        }} id="catalog-sidebar">
          <div className="dz-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
              الفئات
            </h3>
            {catsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '36px', borderRadius: '8px', marginBottom: '4px' }} />
              ))
            ) : (
              <CategoryTree categories={categories} selected={selectedCategory} onSelect={handleCategorySelect} />
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Search + View toggle */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', insetInlineStart: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                className="dz-input"
                placeholder="ابحث عن مادة..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                style={{ paddingInlineStart: '40px' }}
              />
            </div>
            {/* Mobile category select */}
            <select
              className="dz-input"
              style={{ width: 'auto', minWidth: '150px' }}
              value={selectedCategory || ''}
              onChange={e => handleCategorySelect(e.target.value || null)}
            >
              <option value="">كل الفئات</option>
              {(categories || []).map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nameAr || cat.name}</option>
              ))}
            </select>
            {/* View mode */}
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              {[{ mode: 'grid', Icon: Grid }, { mode: 'list', Icon: List }].map(({ mode, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    padding: '8px 12px', border: 'none', cursor: 'pointer',
                    background: viewMode === mode ? 'var(--dz-cyan)' : 'var(--bg-card)',
                    color: viewMode === mode ? '#070E1C' : 'var(--text-muted)',
                    transition: 'all 150ms',
                  }}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          {!matsLoading && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {totalCount} مادة {selectedCategory ? 'في هذه الفئة' : ''}
              {debouncedSearch ? ` تطابق "${debouncedSearch}"` : ''}
            </div>
          )}

          {/* Materials */}
          {matsLoading ? (
            <div style={{
              display: viewMode === 'grid'
                ? 'grid'
                : 'flex',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(220px, 1fr))' : undefined,
              flexDirection: 'column',
              gap: '16px',
            }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: viewMode === 'grid' ? '160px' : '70px', borderRadius: '12px' }} />
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="dz-card" style={{ padding: '64px 24px', textAlign: 'center' }}>
              <Box size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                لا توجد مواد
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>جرّب فئة أخرى أو تغيير كلمة البحث</p>
            </div>
          ) : (
            <div style={{
              display: viewMode === 'grid' ? 'grid' : 'flex',
              gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(220px, 1fr))' : undefined,
              flexDirection: 'column',
              gap: '16px',
            }}>
              {materials.map(m => (
                <MaterialCard key={m.id} material={m} viewMode={viewMode} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}
              >
                السابق
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      minWidth: '40px', height: '40px', borderRadius: '8px', border: '1px solid var(--border)',
                      background: p === page ? 'var(--dz-cyan)' : 'var(--bg-card)',
                      color: p === page ? '#070E1C' : 'var(--text-secondary)',
                      fontWeight: p === page ? 700 : 400, cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
              >
                التالي
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          #catalog-sidebar { display: block !important; }
        }
      `}</style>
    </div>
  );
}
