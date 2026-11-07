import { useState, useMemo, memo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

/**
 * DataTable Component
 * 
 * A comprehensive data table with sorting, pagination, row selection, and responsive behavior.
 * Handles vendor/customer data display with proper TypeScript types.
 * Includes loading states and empty states.
 * 
 * Desktop: Standard HTML table
 * Mobile (<768px): Card-based layout
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of data objects
 * @param {Array} props.columns - Column definitions
 * @param {boolean} props.isLoading - Loading state
 * @param {Object} props.pagination - Pagination configuration
 * @param {Function} props.onSort - Sort callback
 * @param {Function} props.onPageChange - Page change callback
 * @param {Function} props.onRowsPerPageChange - Rows per page change callback
 * @param {boolean} props.enableSelection - Enable row selection
 * @param {Array} props.selectedRows - Selected row IDs
 * @param {Function} props.onSelectionChange - Selection change callback
 * @param {string} props.emptyMessage - Message to display when no data
 * @param {string} props.className - Additional CSS classes
 * 
 * Column definition:
 * {
 *   key: string,                    // Property key from data object
 *   header: string,                 // Column header text
 *   render: (value, row) => node,   // Custom render function (optional)
 *   sortable: boolean,              // Enable sorting (default: false)
 *   hiddenOnMobile: boolean,        // Hide column on mobile (default: false)
 *   mobileLabel: string,            // Label for mobile card view (default: header)
 *   align: 'left' | 'center' | 'right', // Text alignment (default: 'left')
 *   width: string,                  // Column width (e.g., '100px', '25%')
 * }
 * 
 * Requirements: 7.6, 7.9, 11.4
 */
export function DataTable({
  data = [],
  columns = [],
  isLoading = false,
  pagination = null,
  onSort = null,
  onPageChange = null,
  onRowsPerPageChange = null,
  enableSelection = false,
  selectedRows = [],
  onSelectionChange = null,
  emptyMessage = 'No data available',
  className = '',
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Handle sort
  const handleSort = (columnKey) => {
    if (!onSort) {
      // Local sorting if no callback provided
      let direction = 'asc';
      if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.key === columnKey && sortConfig.direction === 'desc') {
        direction = null;
      }
      setSortConfig({ key: columnKey, direction });
    } else {
      // Server-side sorting
      let direction = 'asc';
      if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key: columnKey, direction });
      onSort(columnKey, direction);
    }
  };

  // Sort data locally if no server-side sorting
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction || onSort) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, onSort]);

  // Handle row selection
  const handleSelectAll = (checked) => {
    if (onSelectionChange) {
      if (checked) {
        const allIds = sortedData.map((row) => row.id);
        onSelectionChange(allIds);
      } else {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectRow = (rowId, checked) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedRows, rowId]);
      } else {
        onSelectionChange(selectedRows.filter((id) => id !== rowId));
      }
    }
  };

  const isAllSelected = enableSelection && sortedData.length > 0 && sortedData.every((row) => selectedRows.includes(row.id));
  const isSomeSelected = enableSelection && selectedRows.length > 0 && !isAllSelected;

  // Render sort icon
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-[#64748B] opacity-50" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="w-4 h-4 text-[#00D9F5]" />;
    }
    return <ChevronDown className="w-4 h-4 text-[#00D9F5]" />;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          <div className="overflow-x-auto rounded-lg border border-[rgba(6,36,91,0.06)]">
            <table className="min-w-full divide-y divide-[rgba(6,36,91,0.06)]">
              <thead className="bg-[#F4F7FB]">
                <tr>
                  {columns.map((column, index) => (
                    <th key={index} className="px-6 py-3 text-left">
                      <Skeleton variant="text" width="80%" height="20px" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[rgba(6,36,91,0.06)]">
                {[...Array(5)].map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((_, colIndex) => (
                      <td key={colIndex} className="px-6 py-4">
                        <Skeleton variant="text" width="90%" height="16px" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile skeleton */}
        <div className="md:hidden space-y-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index} padding="md">
              <Skeleton variant="text" width="60%" height="20px" className="mb-3" />
              <Skeleton variant="text" width="100%" height="16px" className="mb-2" />
              <Skeleton variant="text" width="80%" height="16px" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!sortedData || sortedData.length === 0) {
    return (
      <div className={className}>
        <Card padding="lg">
          <EmptyState message={emptyMessage} />
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-[rgba(6,36,91,0.06)]">
        <table className="min-w-full divide-y divide-[rgba(6,36,91,0.06)]">
          <thead className="bg-[#F4F7FB]">
            <tr>
              {enableSelection && (
                <th className="px-6 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-[#00D9F5] border-[#64748B] rounded focus:ring-[#00D9F5] focus:ring-2 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-${column.align || 'left'} text-xs font-semibold text-[#06245B] uppercase tracking-wider`}
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="inline-flex items-center gap-1 hover:text-[#00D9F5] transition-colors duration-150"
                    >
                      {column.header}
                      {renderSortIcon(column.key)}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[rgba(6,36,91,0.06)]">
            {sortedData.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className="hover:bg-[#EAF4FF] transition-colors duration-150"
              >
                {enableSelection && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                      className="w-4 h-4 text-[#00D9F5] border-[#64748B] rounded focus:ring-[#00D9F5] focus:ring-2 cursor-pointer"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-sm text-[#06245B] text-${column.align || 'left'}`}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedData.map((row, rowIndex) => (
          <Card key={row.id || rowIndex} padding="md" hover={false}>
            {enableSelection && (
              <div className="mb-3 pb-3 border-b border-[rgba(6,36,91,0.06)]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                    className="w-4 h-4 text-[#00D9F5] border-[#64748B] rounded focus:ring-[#00D9F5] focus:ring-2"
                  />
                  <span className="text-sm text-[#64748B]">Select</span>
                </label>
              </div>
            )}
            <div className="space-y-2">
              {columns
                .filter((column) => !column.hiddenOnMobile)
                .map((column) => (
                  <div key={column.key} className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium text-[#64748B] min-w-[100px]">
                      {column.mobileLabel || column.header}:
                    </span>
                    <span className="text-sm text-[#06245B] flex-1 text-right">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination && (
        <DataTablePagination
          pagination={pagination}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      )}
    </div>
  );
}

/**
 * DataTable Pagination Component
 * 
 * Pagination controls for the DataTable component.
 * 
 * @param {Object} props
 * @param {Object} props.pagination - Pagination state
 * @param {Function} props.onPageChange - Page change callback
 * @param {Function} props.onRowsPerPageChange - Rows per page change callback
 */
const DataTablePagination = memo(function DataTablePagination({ pagination, onPageChange, onRowsPerPageChange }) {
  const {
    pageNumber = 1,
    pageSize = 20,
    totalCount = 0,
    totalPages = 1,
    hasPreviousPage = false,
    hasNextPage = false,
  } = pagination;

  const startItem = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endItem = Math.min(pageNumber * pageSize, totalCount);

  const handlePageChange = (newPage) => {
    if (onPageChange && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  const handleRowsPerPageChange = (e) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(parseInt(e.target.value, 10));
    }
  };

  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border border-[rgba(6,36,91,0.06)] rounded-lg">
      {/* Rows per page selector */}
      <div className="flex items-center gap-2 text-sm text-[#64748B]">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={handleRowsPerPageChange}
          className="px-2 py-1 border border-[#64748B] rounded-lg text-[#06245B] focus:outline-none focus:ring-2 focus:ring-[#00D9F5] cursor-pointer"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Page info */}
      <div className="text-sm text-[#64748B]">
        Showing {startItem} to {endItem} of {totalCount} results
      </div>

      {/* Pagination buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={!hasPreviousPage}
          icon={<ChevronsLeft className="w-4 h-4" />}
          aria-label="First page"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(pageNumber - 1)}
          disabled={!hasPreviousPage}
          icon={<ChevronLeft className="w-4 h-4" />}
          aria-label="Previous page"
        />
        
        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (pageNumber <= 3) {
              pageNum = i + 1;
            } else if (pageNumber >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = pageNumber - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`min-w-[32px] h-8 px-2 text-sm rounded-lg transition-colors duration-150 ${
                  pageNum === pageNumber
                    ? 'bg-[#00D9F5] text-[#06245B] font-semibold'
                    : 'text-[#06245B] hover:bg-[#EAF4FF]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(pageNumber + 1)}
          disabled={!hasNextPage}
          icon={<ChevronRight className="w-4 h-4" />}
          aria-label="Next page"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePageChange(totalPages)}
          disabled={!hasNextPage}
          icon={<ChevronsRight className="w-4 h-4" />}
          aria-label="Last page"
        />
      </div>
    </div>
  );
});

export default memo(DataTable);
