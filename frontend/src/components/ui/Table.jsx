import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

function TableSkeleton({ columns }) {
  return Array.from({ length: 5 }).map((_, i) => (
    <tr key={i}>
      {columns.map((col, j) => (
        <td key={j} style={{ padding: '14px 16px' }}>
          <div
            className="skeleton"
            style={{ height: '18px', width: col.width || '80%', borderRadius: '4px' }}
          />
        </td>
      ))}
    </tr>
  ));
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const delta = 2;
  const range = [];
  for (
    let i = Math.max(1, page - delta);
    i <= Math.min(totalPages, page + delta);
    i++
  ) {
    range.push(i);
  }

  const btnStyle = (active) => ({
    minWidth: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: active ? 'var(--dz-cyan)' : 'var(--bg-card)',
    color: active ? '#070E1C' : 'var(--text-secondary)',
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    fontSize: '0.875rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '16px',
      }}
    >
      <button
        style={btnStyle(false)}
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous"
      >
        <ChevronLeft size={16} />
      </button>

      {range[0] > 1 && (
        <>
          <button style={btnStyle(page === 1)} onClick={() => onPageChange(1)}>
            1
          </button>
          {range[0] > 2 && (
            <span style={{ color: 'var(--text-muted)' }}>…</span>
          )}
        </>
      )}

      {range.map((p) => (
        <button key={p} style={btnStyle(p === page)} onClick={() => onPageChange(p)}>
          {p}
        </button>
      ))}

      {range[range.length - 1] < totalPages && (
        <>
          {range[range.length - 1] < totalPages - 1 && (
            <span style={{ color: 'var(--text-muted)' }}>…</span>
          )}
          <button
            style={btnStyle(page === totalPages)}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        style={btnStyle(false)}
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data found',
  pagination,
  className = '',
}) {
  return (
    <div
      className={`dz-card${className ? ` ${className}` : ''}`}
      style={{ overflow: 'hidden', padding: 0 }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table className="dz-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align || 'start' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton columns={columns} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '48px 24px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Inbox size={40} style={{ opacity: 0.4 }} />
                    <span style={{ fontSize: '0.9rem' }}>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align || 'start' }}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && !loading && data.length > 0 && (
        <Pagination {...pagination} />
      )}
    </div>
  );
}

export default Table;
