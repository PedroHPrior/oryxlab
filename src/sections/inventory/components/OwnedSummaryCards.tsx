import type { OwnedSummary } from "../../../../product/sections/inventory/types"
import type { ItemType } from "../../../../product/sections/comparator/types"

interface OwnedSummaryCardsProps {
  summary: OwnedSummary
}

const TYPE_LABEL: Record<ItemType, string> = {
  weapon: "Weapons",
  ability: "Abilities",
  armor: "Armors",
  ring: "Rings",
}

export function OwnedSummaryCards({ summary }: OwnedSummaryCardsProps) {
  const types = Object.keys(summary) as ItemType[]
  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
      {types.map((type) => {
        const entry = summary[type]
        const pct = (entry.owned / Math.max(1, entry.total)) * 100
        return (
          <div
            key={type}
            className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {TYPE_LABEL[type]}
            </div>
            <div
              className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100"
              style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontFeatureSettings: '"tnum"' }}
            >
              {entry.owned}
              <span className="ml-1 text-xs text-zinc-500">/ {entry.total}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </section>
  )
}
