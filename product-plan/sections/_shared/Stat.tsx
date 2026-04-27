import type { ReactNode } from "react"

interface StatProps {
  label: string
  value: ReactNode
  delta?: number
  unit?: string
  size?: "sm" | "md" | "lg" | "xl"
  positiveIsGood?: boolean
}

const VALUE_CLASS: Record<NonNullable<StatProps["size"]>, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-5xl",
}

const LABEL_CLASS: Record<NonNullable<StatProps["size"]>, string> = {
  sm: "text-[10px]",
  md: "text-[11px]",
  lg: "text-xs",
  xl: "text-sm",
}

export function Stat({
  label,
  value,
  delta,
  unit,
  size = "md",
  positiveIsGood = true,
}: StatProps) {
  const formattedDelta = formatDelta(delta)
  const deltaColor = !delta
    ? "text-zinc-500"
    : (delta > 0) === positiveIsGood
      ? "text-emerald-500 dark:text-emerald-400"
      : "text-rose-500 dark:text-rose-400"

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`uppercase tracking-wider text-zinc-500 ${LABEL_CLASS[size]}`}
      >
        {label}
      </span>
      <span
        className={`font-semibold leading-none text-zinc-900 dark:text-zinc-100 ${VALUE_CLASS[size]}`}
        style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontFeatureSettings: '"tnum"' }}
      >
        {value}
        {unit && (
          <span className="ml-1 text-xs font-normal text-zinc-500">{unit}</span>
        )}
      </span>
      {formattedDelta && (
        <span
          className={`text-[11px] font-medium ${deltaColor}`}
          style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontFeatureSettings: '"tnum"' }}
        >
          {formattedDelta}
        </span>
      )}
    </div>
  )
}

function formatDelta(d?: number): string | null {
  if (d === undefined || d === 0) return null
  const sign = d > 0 ? "+" : ""
  return `${sign}${d.toLocaleString()}`
}
