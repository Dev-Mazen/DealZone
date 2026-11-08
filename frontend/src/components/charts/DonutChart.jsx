/**
 * Interactive Donut Chart for Industrial Taxonomy & Category Distribution
 * Fully responsive across desktop, tablet, and mobile with zero label clipping.
 */
export default function DonutChart({
  data = [],
  centerLabel = 'Total',
  centerValue = '',
  size = 160,
  strokeWidth = 20,
  layout = 'vertical', // 'vertical' (stacked) or 'horizontal' (side-by-side)
  className = '',
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  const defaultColors = ['#00D9F5', '#1266D6', '#06245B', '#10B981', '#F59E0B', '#8B5CF6']

  let accumulatedPercent = 0

  const containerClasses =
    layout === 'horizontal'
      ? `flex flex-col md:flex-row items-center justify-center gap-6 w-full ${className}`
      : `flex flex-col items-center gap-5 w-full ${className}`

  return (
    <div className={containerClasses}>
      {/* Donut SVG */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg] overflow-visible"
        >
          {data.map((item, idx) => {
            const percent = item.value / total
            const strokeDasharray = `${percent * circumference} ${circumference}`
            const strokeDashoffset = -(accumulatedPercent * circumference)
            accumulatedPercent += percent
            const color = item.color || defaultColors[idx % defaultColors.length]

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 hover:opacity-80"
              />
            )
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {centerLabel}
          </span>
          <span className="text-lg font-extrabold text-[#06245B] leading-tight">
            {centerValue || total}
          </span>
        </div>
      </div>

      {/* Legend — full width, no overflow clipping */}
      <div className="w-full space-y-2.5">
        {data.map((item, idx) => {
          const color = item.color || defaultColors[idx % defaultColors.length]
          const pct = Math.round((item.value / total) * 100)

          return (
            <div
              key={idx}
              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 me-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: color }}
                />
                <span
                  className="font-medium text-slate-700 truncate"
                  title={item.label}
                >
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono shrink-0">
                <span className="text-slate-500 text-[11px]">{item.value}</span>
                <span className="font-bold text-[#06245B] text-xs w-9 text-end">
                  {pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
