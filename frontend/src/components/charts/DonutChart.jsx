/**
 * Interactive Donut Chart for Industrial Taxonomy & Category Distribution
 */
export default function DonutChart({
  data = [],
  centerLabel = 'Total',
  centerValue = '',
  size = 180,
  strokeWidth = 24,
  className = '',
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius

  const defaultColors = ['#00D9F5', '#1266D6', '#06245B', '#10B981', '#F59E0B']

  let accumulatedPercent = 0

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-6 ${className}`}>
      {/* Donut SVG */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
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
                className="transition-all duration-300 hover:opacity-80"
              />
            )
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {centerLabel}
          </span>
          <span className="text-lg font-bold text-[#06245B] leading-tight">
            {centerValue || total}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 flex-1 w-full">
        {data.map((item, idx) => {
          const color = item.color || defaultColors[idx % defaultColors.length]
          const pct = Math.round((item.value / total) * 100)

          return (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-slate-700 truncate max-w-[140px]">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-500">{item.value}</span>
                <span className="font-bold text-[#06245B] w-8 text-end">{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

