import { useState } from "react"
import type { OptimizationResult } from "../../../../product/sections/optimizer/types"
import type { BuildSlots, Item } from "../../../../product/sections/comparator/types"
import { ItemSprite } from "../../_shared/ItemSprite"
import { TierBadge } from "../../_shared/TierBadge"
import { Stat } from "../../_shared/Stat"

interface ResultCardProps {
  result: OptimizationResult
  items: Item[]
  onSendToComparator?: () => void
  onOpenInEditor?: () => void
  onSave?: () => void
  onApplySwap?: (slot: keyof BuildSlots) => void
}

const SLOTS: { key: keyof BuildSlots; label: string }[] = [
  { key: "weapon", label: "Weapon" },
  { key: "ability", label: "Ability" },
  { key: "armor", label: "Armor" },
  { key: "ring", label: "Ring" },
  { key: "talisman", label: "Talisman" },
]

export function ResultCard({
  result,
  items,
  onSendToComparator,
  onOpenInEditor,
  onSave,
  onApplySwap,
}: ResultCardProps) {
  const [explainOpen, setExplainOpen] = useState(false)
  const itemMap = new Map(items.map((i) => [i.id, i]))

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-base font-bold text-zinc-950">
          {result.rank}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{result.name}</h3>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">
            {result.scoreLabel} score · {result.score.toFixed(1)}
          </p>
        </div>
        <Stat label={result.scoreLabel === "Max DPS" ? "DPS" : "DPS"} value={result.derivedStats.dps.toLocaleString("en-US")} size="md" />
      </header>

      <div className="grid grid-cols-3 gap-2 rounded-lg bg-zinc-100/60 p-2 dark:bg-zinc-950/60">
        <Stat label="EHP" value={result.derivedStats.ehp.toLocaleString("en-US")} size="sm" />
        <Stat label="DEF" value={result.derivedStats.def} size="sm" />
        <Stat label="HP" value={result.derivedStats.hp} size="sm" />
        <Stat label="ATT" value={result.derivedStats.att} size="sm" />
        <Stat label="DEX" value={result.derivedStats.dex} size="sm" />
        <Stat label="WIS" value={result.derivedStats.wis} size="sm" />
      </div>

      <ul className="flex flex-col gap-1.5">
        {SLOTS.map(({ key, label }) => {
          const itemId = result.slots[key]
          const item = itemId ? itemMap.get(itemId) : undefined
          const isLocked = result.lockedSlots.includes(key)
          return (
            <li
              key={key}
              className="flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1.5 dark:border-zinc-800"
            >
              {item ? (
                <ItemSprite spriteId={item.sprite} imageUrl={item.imageUrl} name={item.name} itemType={item.type} weaponType={item.weaponType} abilityType={item.abilityType} rarity={item.rarity} size="sm" />
              ) : (
                <span className="inline-flex h-7 w-7 items-center justify-center rounded border border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-700">
                  —
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {item?.name ?? "—"}
                  </span>
                  {item && <TierBadge tier={item.tier} rarity={item.rarity} size="xs" />}
                </div>
              </div>
              {isLocked && (
                <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                  Locked
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <details
        className="rounded-lg bg-zinc-100/40 px-3 py-2 dark:bg-zinc-950/40"
        open={explainOpen}
        onToggle={(e) => setExplainOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-zinc-500 outline-none">
          Why this build
        </summary>
        <ul className="mt-2 flex flex-col gap-1 pl-4 text-xs text-zinc-600 dark:text-zinc-300">
          {result.explanations.map((exp, i) => (
            <li key={i} className="list-disc">
              {exp}
            </li>
          ))}
        </ul>
      </details>

      {result.swapSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.swapSuggestions.map((s) => {
            const positive = s.deltaDps > 0 || s.deltaEhp > 0
            return (
              <button
                key={`${s.slot}-${s.to}`}
                type="button"
                onClick={() => onApplySwap?.(s.slot)}
                className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                  positive
                    ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-700 hover:bg-emerald-400/20 dark:text-emerald-300"
                    : "border-rose-400/60 bg-rose-400/10 text-rose-700 hover:bg-rose-400/20 dark:text-rose-300"
                }`}
              >
                Swap {s.slot}: {s.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onSendToComparator}
          className="flex-1 rounded-md border border-amber-400/60 bg-amber-400/10 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-400/20 dark:text-amber-300"
        >
          Send to comparator
        </button>
        <button
          type="button"
          onClick={onOpenInEditor}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Editor
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Save
        </button>
      </div>
    </article>
  )
}
