import { useState } from 'react'

/**
 * Interactive Area Trend Chart
 * Renders an SVG spline curve with gradient fill and hover cursor.
 */
export default function AreaTrendChart({
  data = [],
  height = 200,
  valueFormatter = (v) => v,
  className = '',
}) {
  const [activePoint, setActivePoint] = useState(null)

  if (!data || data.length < 2) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl"
      >
        Insufficient trend data
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const minValue = Math.min(...data.map((d) => d.value), 0)
  const range = maxValue - minValue || 1

  const width = 500
  const padX = 30
  const padY = 25
  const chartW = width - padX * 2
  const chartH = height - padY * 2

  // Map coordinates
  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * chartW
    const y = padY + chartH - ((d.value - minValue) / range) * chartH
    return { x, y, ...d }
  })

  // Build SVG path
  const linePath = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = points[i - 1]
    const cx1 = prev.x + (p.x - prev.x) / 2
    const cy1 = prev.y
    const cx2 = prev.x + (p.x - prev.x) / 2
    const cy2 = p.y
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`
  }, '')

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00D9F5" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#1266D6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Background grid line */}
          <line
            x1={padX}
            y1={height - padY}
            x2={width - padX}
            y2={height - padY}
            stroke="#E2E8F0"
            strokeWidth="1"
          />

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#1266D6"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Data Points */}
          {points.map((p, i) => {
            const isActive = activePoint === i

            return (
              <g
                key={i}
                onMouseEnter={() => setActivePoint(i)}
                onMouseLeave={() => setActivePoint(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 6 : 4}
                  fill={isActive ? '#00D9F5' : '#06245B'}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                <text
                  x={p.x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748B"
                  fontWeight="500"
                >
                  {p.label}
                </text>

                {isActive && (
                  <g>
                    <rect
                      x={p.x - 45}
                      y={p.y - 30}
                      width="90"
                      height="22"
                      rx="4"
                      fill="#06245B"
                    />
                    <text
                      x={p.x}
                      y={p.y - 16}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#FFFFFF"
                      fontWeight="600"
                    >
                      {valueFormatter(p.value)}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

