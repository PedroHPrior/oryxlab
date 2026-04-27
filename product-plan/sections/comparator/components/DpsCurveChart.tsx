interface DpsCurveChartProps {
  curves: { id: string; name: string; color: string; values: number[] }[]
  highlightDef?: number
  width?: number
  height?: number
}

const DEF_STEPS = 17
const DEF_RANGE = [0, 80]

const COLOR_HEX: Record<string, string> = {
  violet: "#a78bfa",
  purple: "#c084fc",
  amber: "#fbbf24",
  lime: "#a3e635",
  rose: "#fb7185",
  emerald: "#34d399",
  sky: "#38bdf8",
  fuchsia: "#e879f9",
  cyan: "#22d3ee",
  indigo: "#818cf8",
  pink: "#f472b6",
  teal: "#2dd4bf",
}

export function DpsCurveChart({
  curves,
  highlightDef,
  width = 360,
  height = 200,
}: DpsCurveChartProps) {
  const padding = { top: 16, right: 16, bottom: 28, left: 40 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const allValues = curves.flatMap((c) => c.values)
  const yMax = Math.max(...allValues, 1) * 1.05
  const yMin = 0

  const xFor = (i: number) =>
    padding.left + (i / (DEF_STEPS - 1)) * innerW
  const yFor = (v: number) =>
    padding.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH

  const path = (values: number[]) => {
    return values
      .map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`)
      .join(" ")
  }

  const yTicks = 4
  const xTicks = [0, 30, 50, 80]

  const highlightX =
    highlightDef !== undefined
      ? padding.left + ((highlightDef - DEF_RANGE[0]) / (DEF_RANGE[1] - DEF_RANGE[0])) * innerW
      : null

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="text-zinc-300 dark:text-zinc-700"
      style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
      role="img"
      aria-label="DPS vs target defense"
    >
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = padding.top + (i / yTicks) * innerH
        const v = Math.round(yMax - (i / yTicks) * (yMax - yMin))
        return (
          <g key={`yt-${i}`}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.3}
              strokeDasharray="2 3"
            />
            <text
              x={padding.left - 4}
              y={y + 3}
              textAnchor="end"
              fontSize={9}
              fill="currentColor"
              fillOpacity={0.7}
            >
              {v.toLocaleString()}
            </text>
          </g>
        )
      })}

      {xTicks.map((d) => {
        const x =
          padding.left +
          ((d - DEF_RANGE[0]) / (DEF_RANGE[1] - DEF_RANGE[0])) * innerW
        return (
          <g key={`xt-${d}`}>
            <line
              x1={x}
              x2={x}
              y1={padding.top + innerH}
              y2={padding.top + innerH + 4}
              stroke="currentColor"
              strokeOpacity={0.5}
            />
            <text
              x={x}
              y={padding.top + innerH + 14}
              textAnchor="middle"
              fontSize={9}
              fill="currentColor"
              fillOpacity={0.7}
            >
              {d}
            </text>
          </g>
        )
      })}
      <text
        x={padding.left + innerW / 2}
        y={height - 4}
        textAnchor="middle"
        fontSize={10}
        fill="currentColor"
        fillOpacity={0.7}
      >
        Target Defense
      </text>

      {highlightX !== null && (
        <g>
          <line
            x1={highlightX}
            x2={highlightX}
            y1={padding.top}
            y2={padding.top + innerH}
            stroke="#fbbf24"
            strokeOpacity={0.6}
            strokeWidth={1}
            strokeDasharray="3 2"
          />
          <rect
            x={highlightX - 18}
            y={padding.top - 2}
            width={36}
            height={14}
            rx={3}
            fill="#fbbf24"
            fillOpacity={0.15}
          />
          <text
            x={highlightX}
            y={padding.top + 8}
            textAnchor="middle"
            fontSize={9}
            fill="#fbbf24"
          >
            def {highlightDef}
          </text>
        </g>
      )}

      {curves.map((curve) => {
        const color = COLOR_HEX[curve.color] ?? "#fbbf24"
        return (
          <g key={curve.id}>
            <path d={path(curve.values)} fill="none" stroke={color} strokeWidth={2} />
            {curve.values.map((v, i) => (
              <circle
                key={`pt-${curve.id}-${i}`}
                cx={xFor(i)}
                cy={yFor(v)}
                r={1.5}
                fill={color}
                fillOpacity={0.9}
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}
