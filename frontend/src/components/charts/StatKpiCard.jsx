import { TrendingUp, TrendingDown } from 'lucide-react'

/**
 * Enhanced Stat KPI Card with Trend Badge and Micro-Sparkline
 * Fully resilient to large numbers, currency strings, and narrow responsive columns.
 * Never truncates values with ellipses; adapts layout dynamically for long numbers.
 */
export default function StatKpiCard({
  title,
  value,
  change,
  isPositive = true,
  period = 'vs last month',
  icon: Icon,
  sparkline = [20, 25, 22, 30, 28, 35, 42],
  className = '',
  loading = false,
}) {
  if (loading) {
    return (
      <div className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between ${className}`}>
        <div>
          <div className="flex items-start justify-between mb-3 gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
              {title}
            </span>
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-slate-300" />
              </div>
            )}
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="h-8 w-28 bg-slate-200/80 rounded-xl animate-pulse" />
            <div className="h-5 w-12 bg-slate-100 rounded-lg animate-pulse shrink-0" />
          </div>
        </div>

        <div className="mt-3 h-4 w-36 bg-slate-100 rounded animate-pulse" />
      </div>
    )
  }

  const min = Math.min(...sparkline)
  const max = Math.max(...sparkline)
  const range = max - min || 1

  // Sparkline SVG path
  const w = 56
  const h = 20
  const points = sparkline.map((v, i) => {
    const x = (i / (sparkline.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const valStr = value != null ? String(value) : ''
  const valLen = valStr.length
  const isLongValue = valLen > 11

  return (
    <div
      className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden relative flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Top: Title & Icon */}
        <div className="flex items-start justify-between mb-2.5 gap-2">
          <span
            className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate"
            title={title}
          >
            {title}
          </span>
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-[#EAF4FF] text-[#1266D6] flex items-center justify-center shrink-0">
              <Icon size={18} />
            </div>
          )}
        </div>

        {/* Middle: Value & Micro Sparkline */}
        <div className="my-1">
          <div className="flex items-center justify-between gap-2 min-w-0">
            {/* The full value is ALWAYS displayed in full without truncation */}
            <div
              className={`font-extrabold text-[#06245B] tracking-tight whitespace-nowrap min-w-0 ${
                valLen > 16
                  ? 'text-base sm:text-lg'
                  : valLen > 12
                  ? 'text-lg sm:text-xl'
                  : valLen > 8
                  ? 'text-xl sm:text-2xl'
                  : 'text-2xl sm:text-3xl'
              }`}
            >
              {value}
            </div>

            {/* Sparkline alongside value when number is short */}
            {!isLongValue && (
              <div className="shrink-0 overflow-hidden flex items-center ms-auto">
                <svg
                  viewBox={`0 0 ${w} ${h}`}
                  className="w-12 h-5 overflow-hidden opacity-75 shrink-0 block"
                  preserveAspectRatio="none"
                >
                  <polyline
                    fill="none"
                    stroke={isPositive ? '#10B981' : '#EF4444'}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Sparkline placed neatly below value when number is long, so it never squeezes or truncates the number */}
          {isLongValue && (
            <div className="mt-1 flex items-center justify-end">
              <svg
                viewBox={`0 0 ${w} ${h}`}
                className="w-16 h-3.5 overflow-hidden opacity-75 block"
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke={isPositive ? '#10B981' : '#EF4444'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Change badge & Period */}
      {change && (
        <div className="mt-3 flex items-center gap-1.5 text-xs flex-wrap min-w-0">
          <span
            className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0 ${
              isPositive
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-red-700 bg-red-50'
            }`}
          >
            {isPositive ? (
              <TrendingUp size={12} className="shrink-0" />
            ) : (
              <TrendingDown size={12} className="shrink-0" />
            )}
            <span>{change}</span>
          </span>
          {period && (
            <span
              className="text-slate-400 text-[11px] truncate min-w-0"
              title={period}
            >
              {period}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
