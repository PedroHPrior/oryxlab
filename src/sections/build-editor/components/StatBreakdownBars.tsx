import type { StatBreakdown, StatBreakdownMap, StatKey } from "../../../../product/sections/build-editor/types"

interface StatBreakdownBarsProps {
  breakdowns: StatBreakdownMap
}

const SOURCES: { key: keyof StatBreakdown; label: string; color: string }[] = [
  { key: "base", label: "Base", color: "bg-zinc-400 dark:bg-zinc-500" },
  { key: "items", label: "Items", color: "bg-amber-400" },
  { key: "exalts", label: "Exalts", color: "bg-emerald-400" },
  { key: "buffs", label: "Buffs", color: "bg-sky-400" },
]

const STAT_LABELS: Record<StatKey, string> = {
  att: "ATT",
  dex: "DEX",
  wis: "WIS",
  vit: "VIT",
  spd: "SPD",
  def: "DEF",
  hp: "HP",
  mp: "MP",
}

export function StatBreakdownBars({ breakdowns }: StatBreakdownBarsProps) {
  const stats = Object.entries(breakdowns) as [StatKey, StatBreakdown][]
  const max = Math.max(1, ...stats.map(([, b]) => b.total))

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Stat sources
        </h2>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          {SOURCES.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1">
              <span className={`inline-block h-2 w-2 rounded-sm ${s.color}`} />
              {s.label}
            </span>
          ))}
        </div>
      </header>
      <ul className="flex flex-col gap-2">
        {stats.map(([statKey, b]) => (
          <li
            key={statKey}
            className="grid grid-cols-[44px_1fr_56px] items-center gap-3 text-xs"
          >
            <span className="text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {STAT_LABELS[statKey]}
            </span>
            <div className="flex h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              {SOURCES.map((s) => {
                const v = b[s.key] as number
                if (!v) return null
                return (
                  <div
                    key={s.key}
                    className={`${s.color}`}
                    style={{ width: `${(v / max) * 100}%` }}
                    title={`${s.label}: ${v}`}
                  />
                )
              })}
            </div>
            <span
              className="text-right text-zinc-700 dark:text-zinc-300"
              style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontFeatureSettings: '"tnum"' }}
            >
              {b.total}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
