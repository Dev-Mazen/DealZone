import { useState } from 'react'

/**
 * Interactive Responsive SVG Bar Chart
 * Zero dependencies, React 19 compatible, DealZone branded.
 */
export default function BarChart({
  data = [],
  height = 220,
  valueFormatter = (v) => v,
  className = '',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl"
      >
        No chart data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const paddingX = 40
  const paddingY = 30
  const chartHeight = height - paddingY * 2
  const barWidth = 28
  const chartWidth = 500

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="barGradientPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00D9F5" />
              <stop offset="100%" stopColor="#1266D6" />
            </linearGradient>
            <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1266D6" />
              <stop offset="100%" stopColor="#06245B" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = height - paddingY - pct * chartHeight
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - 10}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94A3B8"
                  className="font-mono"
                >
                  {Math.round(pct * maxValue)}
                </text>
              </g>
            )
          })}

          {/* Bars */}
          {data.map((item, idx) => {
            const step = (chartWidth - paddingX - 20) / data.length
            const x = paddingX + idx * step + step / 2 - barWidth / 2
            const bHeight = (item.value / maxValue) * chartHeight
            const y = height - paddingY - bHeight
            const isHovered = hoveredIdx === idx

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Bar rectangle */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={bHeight}
                  rx="6"
                  fill={isHovered ? 'url(#barGradientHover)' : 'url(#barGradientPrimary)'}
                  className="transition-all duration-300"
                />

                {/* X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isHovered ? '#06245B' : '#64748B'}
                  fontWeight={isHovered ? '700' : '500'}
                >
                  {item.label}
                </text>

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={x + barWidth / 2 - 40}
                      y={y - 28}
                      width="80"
                      height="22"
                      rx="4"
                      fill="#06245B"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 14}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#FFFFFF"
                      fontWeight="600"
                    >
                      {valueFormatter(item.value)}
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

