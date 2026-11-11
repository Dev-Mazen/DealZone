import { TrendingUp, TrendingDown } from 'lucide-react'

/**
 * Enhanced Stat KPI Card with Trend Badge and Micro-Sparkline
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
      <div className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs ${className}`}>
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-slate-300" />
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="h-8 w-24 bg-slate-200/80 rounded-xl animate-pulse" />
          <div className="h-5 w-16 bg-slate-100 rounded-lg animate-pulse" />
        </div>

        <div className="mt-3 h-4 w-36 bg-slate-100 rounded animate-pulse" />
      </div>
    )
  }

  const min = Math.min(...sparkline)
  const max = Math.max(...sparkline)
  const range = max - min || 1

  // Sparkline SVG path
  const w = 70
  const h = 24
  const points = sparkline.map((v, i) => {
    const x = (i / (sparkline.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-[#EAF4FF] text-[#1266D6] flex items-center justify-center shrink-0">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-extrabold text-[#06245B] tracking-tight">
          {value}
        </div>

        {/* Micro sparkline */}
        <svg width={w} height={h} className="shrink-0 overflow-visible opacity-70">
          <polyline
            fill="none"
            stroke={isPositive ? '#10B981' : '#EF4444'}
            strokeWidth="2"
            strokeLinecap="round"
            points={points}
          />
        </svg>
      </div>

      {change && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-md ${
              isPositive
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-red-700 bg-red-50'
            }`}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change}
          </span>
          <span className="text-slate-400 text-[11px]">{period}</span>
        </div>
      )}
    </div>
  )
}

