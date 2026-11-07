import { useState, useCallback, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  SlidersHorizontal,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if the given filter value is "active" (non-empty / non-default). */
function isFilterActive(filter, value) {
  if (value === undefined || value === null) return false;
  if (filter.type === "checkbox") {
    return Array.isArray(value) && value.length > 0;
  }
  if (filter.type === "radio") {
    return value !== "" && value !== undefined && value !== null;
  }
  if (filter.type === "range") {
    return (
      (value.min !== undefined && value.min !== "" && value.min !== filter.min) ||
      (value.max !== undefined && value.max !== "" && value.max !== filter.max)
    );
  }
  return false;
}

/** Count active values within a single filter. */
function countActiveInFilter(filter, value) {
  if (!isFilterActive(filter, value)) return 0;
  if (filter.type === "checkbox") return value.length;
  if (filter.type === "radio") return 1;
  if (filter.type === "range") {
    let count = 0;
    if (value.min !== undefined && value.min !== "" && value.min !== filter.min) count++;
    if (value.max !== undefined && value.max !== "" && value.max !== filter.max) count++;
    return count;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 ${className}`}
      aria-hidden="true"
    />
  );
}

function ActiveBadge({ count }) {
  if (!count) return null;
  return (
    <span
      className="ml-auto inline-flex items-center justify-center rounded-full bg-[#06245B] px-2 py-0.5 text-xs font-semibold text-white leading-none"
      aria-label={`${count} active`}
    >
      {count}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Filter type renderers
// ---------------------------------------------------------------------------

function CheckboxFilter({ filter, value = [], onChange }) {
  const selected = Array.isArray(value) ? value : [];

  const toggle = useCallback(
    (optionValue) => {
      const next = selected.includes(optionValue)
        ? selected.filter((v) => v !== optionValue)
        : [...selected, optionValue];
      onChange(filter.id, next);
    },
    [selected, filter.id, onChange]
  );

  return (
    <ul className="space-y-2" role="group" aria-label={filter.label}>
      {filter.options?.map((opt) => {
        const checked = selected.includes(opt.value);
        const id = `${filter.id}-${opt.value}`;
        return (
          <li key={opt.value} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={id}
              checked={checked}
              onChange={() => toggle(opt.value)}
              className="sr-only peer"
            />
            <label
              htmlFor={id}
              className="flex flex-1 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-[#EAF4FF] peer-focus-visible:ring-2 peer-focus-visible:ring-[#00D9F5]"
            >
              {/* Custom checkbox */}
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  checked
                    ? "border-[#00D9F5] bg-[#00D9F5]"
                    : "border-slate-300 bg-white"
                }`}
              >
                {checked && (
                  <svg
                    viewBox="0 0 10 8"
                    className="h-2.5 w-2.5 text-[#06245B]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="1 4 4 7 9 1" />
                  </svg>
                )}
              </span>
              <span className="flex-1">{opt.label}</span>
              {opt.count !== undefined && (
                <span className="text-xs text-slate-400">({opt.count})</span>
              )}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function RadioFilter({ filter, value = "", onChange }) {
  return (
    <ul className="space-y-2" role="radiogroup" aria-label={filter.label}>
      {filter.options?.map((opt) => {
        const checked = value === opt.value;
        const id = `${filter.id}-${opt.value}`;
        return (
          <li key={opt.value} className="flex items-center gap-2">
            <input
              type="radio"
              id={id}
              name={filter.id}
              checked={checked}
              onChange={() => onChange(filter.id, opt.value)}
              className="sr-only peer"
            />
            <label
              htmlFor={id}
              className="flex flex-1 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-[#EAF4FF] peer-focus-visible:ring-2 peer-focus-visible:ring-[#00D9F5]"
            >
              {/* Custom radio */}
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  checked
                    ? "border-[#00D9F5] bg-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {checked && (
                  <span className="h-2 w-2 rounded-full bg-[#00D9F5]" />
                )}
              </span>
              <span className="flex-1">{opt.label}</span>
              {opt.count !== undefined && (
                <span className="text-xs text-slate-400">({opt.count})</span>
              )}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function RangeFilter({ filter, value = {}, onChange }) {
  const minVal = value.min ?? "";
  const maxVal = value.max ?? "";

  const handleMin = (e) => {
    onChange(filter.id, { ...value, min: e.target.value });
  };
  const handleMax = (e) => {
    onChange(filter.id, { ...value, max: e.target.value });
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-[#F4F7FB] px-3 py-2 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-[#00D9F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00D9F5]/30";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label
            htmlFor={`${filter.id}-min`}
            className="mb-1 block text-xs text-slate-500"
          >
            Min{filter.unit ? ` (${filter.unit})` : ""}
          </label>
          <input
            id={`${filter.id}-min`}
            type="number"
            min={filter.min}
            max={filter.max}
            placeholder={filter.min !== undefined ? String(filter.min) : "Min"}
            value={minVal}
            onChange={handleMin}
            className={inputClass}
          />
        </div>
        <span className="mt-5 text-slate-400 select-none">—</span>
        <div className="flex-1">
          <label
            htmlFor={`${filter.id}-max`}
            className="mb-1 block text-xs text-slate-500"
          >
            Max{filter.unit ? ` (${filter.unit})` : ""}
          </label>
          <input
            id={`${filter.id}-max`}
            type="number"
            min={filter.min}
            max={filter.max}
            placeholder={filter.max !== undefined ? String(filter.max) : "Max"}
            value={maxVal}
            onChange={handleMax}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterSection
// ---------------------------------------------------------------------------

function FilterSection({ filter, value, onChange }) {
  const [expanded, setExpanded] = useState(filter.defaultExpanded ?? true);
  const activeCount = countActiveInFilter(filter, value);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-[#EAF4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00D9F5]"
      >
        <span className="flex-1 text-sm font-semibold text-[#06245B]">
          {filter.label}
        </span>
        <ActiveBadge count={activeCount} />
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        )}
      </button>

      {/* Animated collapse */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          expanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!expanded}
      >
        <div className="px-4 pb-4 pt-1">
          {filter.type === "checkbox" && (
            <CheckboxFilter filter={filter} value={value} onChange={onChange} />
          )}
          {filter.type === "radio" && (
            <RadioFilter filter={filter} value={value} onChange={onChange} />
          )}
          {filter.type === "range" && (
            <RangeFilter filter={filter} value={value} onChange={onChange} />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active chips
// ---------------------------------------------------------------------------

function ActiveChips({ filters, values, onRemove }) {
  const chips = useMemo(() => {
    const result = [];
    filters.forEach((filter) => {
      const val = values[filter.id];
      if (!isFilterActive(filter, val)) return;

      if (filter.type === "checkbox" && Array.isArray(val)) {
        val.forEach((v) => {
          const opt = filter.options?.find((o) => o.value === v);
          result.push({
            key: `${filter.id}::${v}`,
            filterId: filter.id,
            chipValue: v,
            label: opt ? opt.label : String(v),
            filterType: "checkbox",
          });
        });
      } else if (filter.type === "radio" && val) {
        const opt = filter.options?.find((o) => o.value === val);
        result.push({
          key: `${filter.id}::${val}`,
          filterId: filter.id,
          chipValue: val,
          label: `${filter.label}: ${opt ? opt.label : val}`,
          filterType: "radio",
        });
      } else if (filter.type === "range") {
        const parts = [];
        if (val.min !== undefined && val.min !== "" && val.min !== filter.min) {
          parts.push(`≥${val.min}${filter.unit ? " " + filter.unit : ""}`);
        }
        if (val.max !== undefined && val.max !== "" && val.max !== filter.max) {
          parts.push(`≤${val.max}${filter.unit ? " " + filter.unit : ""}`);
        }
        if (parts.length) {
          result.push({
            key: `${filter.id}::range`,
            filterId: filter.id,
            chipValue: null,
            label: `${filter.label}: ${parts.join(", ")}`,
            filterType: "range",
          });
        }
      }
    });
    return result;
  }, [filters, values]);

  if (!chips.length) return null;

  return (
    <div
      className="flex flex-wrap gap-1.5 px-4 pb-3 pt-3"
      role="list"
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          role="listitem"
          className="inline-flex items-center gap-1 rounded-full bg-[#00D9F5]/15 px-2.5 py-1 text-xs font-medium text-[#06245B]"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip)}
            className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-[#06245B]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06245B]"
            aria-label={`Remove filter: ${chip.label}`}
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function FilterPanelSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm" aria-busy="true" aria-label="Loading filters">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
        <SkeletonBlock className="h-5 w-5 rounded" />
        <SkeletonBlock className="h-4 w-20" />
      </div>
      {/* Sections */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-b border-slate-100 px-4 py-3 space-y-2">
          <SkeletonBlock className="h-4 w-28" />
          <div className="space-y-2 pl-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-2">
                <SkeletonBlock className="h-4 w-4 rounded" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
      {/* Buttons */}
      <div className="space-y-2 p-4">
        <SkeletonBlock className="h-9 w-full rounded-lg" />
        <SkeletonBlock className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function FilterPanel({
  filters = [],
  values = {},
  onChange,
  onApply,
  onClear,
  className = "",
  isLoading = false,
  applyLabel = "Apply Filters",
  clearLabel = "Clear All",
  title = "Filters",
}) {
  // Count total active filters across all sections
  const totalActive = useMemo(
    () =>
      filters.reduce(
        (sum, f) => sum + countActiveInFilter(f, values[f.id]),
        0
      ),
    [filters, values]
  );

  /** Remove a single chip / active value */
  const handleRemoveChip = useCallback(
    ({ filterId, chipValue, filterType }) => {
      if (!onChange) return;
      const filter = filters.find((f) => f.id === filterId);
      if (!filter) return;

      if (filterType === "checkbox") {
        const current = Array.isArray(values[filterId]) ? values[filterId] : [];
        onChange(filterId, current.filter((v) => v !== chipValue));
      } else if (filterType === "radio") {
        onChange(filterId, "");
      } else if (filterType === "range") {
        onChange(filterId, {});
      }
    },
    [filters, values, onChange]
  );

  if (isLoading) return <FilterPanelSkeleton />;

  return (
    <aside
      className={`w-full rounded-lg border border-slate-200 bg-white shadow-sm md:w-72 lg:w-80 ${className}`}
      aria-label={title}
    >
      {/* ── Panel header ── */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
        <SlidersHorizontal
          className="h-5 w-5 shrink-0 text-[#06245B]"
          aria-hidden="true"
        />
        <h2 className="flex-1 text-base font-bold text-[#06245B]">{title}</h2>
        {totalActive > 0 && (
          <span
            className="inline-flex items-center justify-center rounded-full bg-[#00D9F5] px-2.5 py-0.5 text-xs font-bold text-[#06245B]"
            aria-label={`${totalActive} active filters`}
          >
            {totalActive}
          </span>
        )}
        <Filter className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      </div>

      {/* ── Active chips ── */}
      {totalActive > 0 && (
        <div className="border-b border-slate-100">
          <ActiveChips
            filters={filters}
            values={values}
            onRemove={handleRemoveChip}
          />
        </div>
      )}

      {/* ── Filter sections ── */}
      <div role="list" aria-label="Filter sections">
        {filters.map((filter) => (
          <div key={filter.id} role="listitem">
            <FilterSection
              filter={filter}
              value={values[filter.id]}
              onChange={onChange}
            />
          </div>
        ))}
      </div>

      {/* ── Action buttons ── */}
      <div className="space-y-2 p-4">
        <button
          type="button"
          onClick={onApply}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00D9F5] px-4 py-2.5 text-sm font-semibold text-[#06245B] transition-colors hover:bg-[#00C4DC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9F5] focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          {applyLabel}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={totalActive === 0}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-transparent px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-[#EAF4FF] hover:text-[#06245B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9F5] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
        >
          {clearLabel}
        </button>
      </div>
    </aside>
  );
}

export default FilterPanel;
export { FilterPanel };
