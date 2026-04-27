import type { Exaltations } from "../../../../product/sections/comparator/types"

interface ExaltationsPanelProps {
  exaltations: Exaltations
  onChange?: (exaltations: Exaltations) => void
}

const ROWS: { key: keyof Exaltations; label: string; max: number; color: string }[] = [
  { key: "att", label: "ATT", max: 5, color: "bg-rose-400" },
  { key: "dex", label: "DEX", max: 5, color: "bg-yellow-400" },
  { key: "wis", label: "WIS", max: 5, color: "bg-violet-400" },
  { key: "vit", label: "VIT", max: 5, color: "bg-lime-400" },
  { key: "spd", label: "SPD", max: 5, color: "bg-amber-400" },
  { key: "def", label: "DEF", max: 5, color: "bg-sky-400" },
  { key: "hp", label: "HP", max: 5, color: "bg-emerald-400" },
  { key: "mp", label: "MP", max: 5, color: "bg-cyan-400" },
]

export function ExaltationsPanel({ exaltations, onChange }: ExaltationsPanelProps) {
  const update = (key: keyof Exaltations, delta: number) => {
    const next = { ...exaltations, [key]: clamp(exaltations[key] + delta, 0, 5) }
    onChange?.(next)
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Exaltations
        </h2>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          0 – 5 per stat
        </span>
      </header>
      <ul className="flex flex-col gap-1.5">
        {ROWS.map((row) => {
          const value = exaltations[row.key]
          return (
            <li
              key={row.key}
              className="grid grid-cols-[40px_1fr_auto] items-center gap-3"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {row.label}
              </span>
              <div className="relative h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full ${row.color} transition-all`}
                  style={{ width: `${(value / row.max) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => update(row.key, -1)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded border border-zinc-200 text-xs text-zinc-700 hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100"
                  aria-label={`Decrease ${row.label}`}
                  disabled={value <= 0}
                >
                  −
                </button>
                <span
                  className="inline-block w-6 text-center text-xs text-zinc-700 dark:text-zinc-300"
                  style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
                >
                  {value}
                </span>
                <button
                  type="button"
                  onClick={() => update(row.key, 1)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded border border-zinc-200 text-xs text-zinc-700 hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100"
                  aria-label={`Increase ${row.label}`}
                  disabled={value >= 5}
                >
                  +
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}
