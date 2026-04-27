interface DpsCurveChartProps {
  curves: { id: string; name: string; color: string; values: number[] }[]
  highlightDef?: number
  width?: number
  height?: number
  variant?: "compact" | "prominent"
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
  width = 720,
  height = 320,
  variant = "prominent",
}: DpsCurveChartProps) {
  const isProminent = variant === "prominent"
  const padding = isProminent
    ? { top: 24, right: 24, bottom: 44, left: 60 }
    : { top: 16, right: 16, bottom: 28, left: 40 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const allValues = curves.flatMap((c) => c.values)
  const yMax = Math.max(...allValues, 1) * 1.08
  const yMin = 0

  const xFor = (i: number) =>
    padding.left + (i / (DEF_STEPS - 1)) * innerW
  const yFor = (v: number) =>
    padding.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH

  const path = (values: number[]) =>
    values
      .map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`)
      .join(" ")

  // Empty values arrays show up briefly when builds are decoded from a share
  // URL — derivedStats.dpsCurve starts as [] until the recompute pass runs,
  // and `path([])` yields a string with no leading M, which the browser logs
  // as a "Expected moveto" SVG path error. Returning `undefined` skips the
  // <path d=…> attribute entirely for that frame instead.
  const path2 = (values: number[]) => (values.length > 0 ? path(values) : undefined)

  const areaPath = (values: number[]) => {
    if (values.length === 0) return undefined
    const top = path(values)
    const lastX = xFor(values.length - 1).toFixed(1)
    const baseY = (padding.top + innerH).toFixed(1)
    const firstX = xFor(0).toFixed(1)
    return `${top} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`
  }

  const yTicks = isProminent ? 5 : 4
  const xTicks = [0, 20, 40, 60, 80]

  const highlightX =
    highlightDef !== undefined
      ? padding.left + ((highlightDef - DEF_RANGE[0]) / (DEF_RANGE[1] - DEF_RANGE[0])) * innerW
      : null

  const fontBase = isProminent ? 12 : 9
  const fontTick = isProminent ? 11 : 9

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
      <defs>
        {curves.map((curve) => {
          const color = COLOR_HEX[curve.color] ?? "#fbbf24"
          return (
            <linearGradient
              id={`dps-grad-${curve.id}`}
              key={curve.id}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0" stopColor={color} stopOpacity="0.45" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          )
        })}
      </defs>

      {/* y-axis grid + labels */}
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
              strokeOpacity={isProminent ? 0.4 : 0.3}
              strokeDasharray={isProminent ? "3 4" : "2 3"}
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={fontTick}
              fontWeight={500}
              fill="currentColor"
              fillOpacity={0.85}
            >
              {v.toLocaleString("en-US")}
            </text>
          </g>
        )
      })}

      {/* y-axis label */}
      {isProminent && (
        <text
          x={padding.left - 44}
          y={padding.top + innerH / 2}
          fontSize={11}
          fill="currentColor"
          fillOpacity={0.65}
          textAnchor="middle"
          transform={`rotate(-90 ${padding.left - 44} ${padding.top + innerH / 2})`}
          fontWeight={600}
        >
          DPS
        </text>
      )}

      {/* x-axis ticks */}
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
              y2={padding.top + innerH + 5}
              stroke="currentColor"
              strokeOpacity={0.6}
              strokeWidth={1}
            />
            <text
              x={x}
              y={padding.top + innerH + 18}
              textAnchor="middle"
              fontSize={fontTick}
              fill="currentColor"
              fillOpacity={0.85}
              fontWeight={500}
            >
              {d}
            </text>
          </g>
        )
      })}
      <text
        x={padding.left + innerW / 2}
        y={height - 6}
        textAnchor="middle"
        fontSize={fontBase}
        fill="currentColor"
        fillOpacity={0.65}
        fontWeight={600}
      >
        Target Defense
      </text>

      {/* Highlighted scenario column */}
      {highlightX !== null && (
        <g>
          <line
            x1={highlightX}
            x2={highlightX}
            y1={padding.top}
            y2={padding.top + innerH}
            stroke="#fbbf24"
            strokeOpacity={0.75}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <rect
            x={highlightX - 28}
            y={padding.top - 8}
            width={56}
            height={20}
            rx={4}
            fill="#fbbf24"
          />
          <text
            x={highlightX}
            y={padding.top + 6}
            textAnchor="middle"
            fontSize={isProminent ? 11 : 9}
            fontWeight={700}
            fill="#0c0a09"
          >
            def {highlightDef}
          </text>
        </g>
      )}

      {/* Filled area under curve */}
      {curves.map((curve) => (
        <path
          key={`area-${curve.id}`}
          d={areaPath(curve.values)}
          fill={`url(#dps-grad-${curve.id})`}
        />
      ))}

      {/* Curves */}
      {curves.map((curve) => {
        const color = COLOR_HEX[curve.color] ?? "#fbbf24"
        return (
          <g key={curve.id}>
            <path
              d={path2(curve.values)}
              fill="none"
              stroke={color}
              strokeWidth={isProminent ? 3 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {curve.values.map((v, i) => (
              <circle
                key={`pt-${curve.id}-${i}`}
                cx={xFor(i)}
                cy={yFor(v)}
                r={isProminent ? 3 : 1.5}
                fill={color}
                stroke="white"
                strokeWidth={isProminent ? 1 : 0}
                strokeOpacity={0.6}
              />
            ))}
          </g>
        )
      })}

      {/* Legend (prominent) */}
      {isProminent && curves.length > 0 && (
        <g>
          {curves.map((curve, idx) => {
            const color = COLOR_HEX[curve.color] ?? "#fbbf24"
            const lx = padding.left + 12 + idx * 180
            const ly = padding.top + 4
            return (
              <g key={`leg-${curve.id}`}>
                <rect x={lx - 4} y={ly - 12} width={170} height={22} rx={4} fill="currentColor" fillOpacity={0.06} />
                <line x1={lx} y1={ly - 1} x2={lx + 22} y2={ly - 1} stroke={color} strokeWidth={3} strokeLinecap="round" />
                <text x={lx + 28} y={ly + 3} fontSize={11} fill="currentColor" fillOpacity={0.85} fontWeight={600}>
                  {curve.name.length > 18 ? curve.name.slice(0, 17) + "…" : curve.name}
                </text>
              </g>
            )
          })}
        </g>
      )}
    </svg>
  )
}
