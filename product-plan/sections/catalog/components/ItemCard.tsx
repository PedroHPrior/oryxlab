import type {
  CatalogItem,
} from "../../../../product/sections/catalog/types"
import { ItemSprite } from "../../_shared/ItemSprite"
import { TierBadge } from "../../_shared/TierBadge"

interface ItemCardProps {
  item: CatalogItem
  selected?: boolean
  selectable?: boolean
  onToggleSelect?: () => void
  onOpenDetail?: () => void
}

export function ItemCard({
  item,
  selected,
  selectable,
  onToggleSelect,
  onOpenDetail,
}: ItemCardProps) {
  return (
    <article
      className={`group relative flex flex-col gap-2 rounded-xl border bg-white p-3 transition-all dark:bg-zinc-900 ${
        selected
          ? "border-amber-400/60 shadow-md ring-1 ring-amber-400/40"
          : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-700"
      }`}
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <button
        type="button"
        onClick={onOpenDetail}
        className="flex flex-col items-center gap-2 text-center"
        aria-label={`Open details for ${item.name}`}
      >
        <ItemSprite
          spriteId={item.sprite}
          itemType={item.type}
          rarity={item.rarity}
          size="xl"
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100" title={item.name}>
            {item.name}
          </h3>
          <div className="mt-0.5 flex items-center justify-center gap-1.5">
            <TierBadge tier={item.tier} rarity={item.rarity} size="xs" />
            {item.owned && (
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                Owned
              </span>
            )}
          </div>
        </div>
      </button>

      <div
        className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-zinc-600 dark:text-zinc-400"
        style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontFeatureSettings: '"tnum"' }}
      >
        {keyStats(item).map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-1.5">
            <span className="text-zinc-500">{s.label}</span>
            <span className="text-zinc-700 dark:text-zinc-300">{s.value}</span>
          </div>
        ))}
      </div>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 text-[10px]">
          {item.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {t}
            </span>
          ))}
          {item.tags.length > 2 && (
            <span className="text-zinc-500">+{item.tags.length - 2}</span>
          )}
        </div>
      )}

      {selectable && (
        <button
          type="button"
          onClick={onToggleSelect}
          className={`absolute left-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded border text-xs ${
            selected
              ? "border-amber-400 bg-amber-400 text-zinc-950"
              : "border-zinc-300 bg-white opacity-0 transition-opacity group-hover:opacity-100 dark:border-zinc-700 dark:bg-zinc-900"
          }`}
          aria-pressed={selected}
          aria-label={selected ? "Deselect" : "Select for compare"}
        >
          {selected && "✓"}
        </button>
      )}
    </article>
  )
}

function keyStats(item: CatalogItem): { label: string; value: string }[] {
  const s = item.stats
  if (item.type === "weapon" && s.dmgMin && s.dmgMax) {
    return [
      { label: "Dmg", value: `${s.dmgMin}–${s.dmgMax}` },
      { label: "RoF", value: `${s.shotsPerSec ?? "?"}/s` },
      ...(s.shots && s.shots > 1 ? [{ label: "Shots", value: `× ${s.shots}` }] : []),
    ]
  }
  if (item.type === "ability") {
    return [
      ...(s.mpCost ? [{ label: "MP", value: String(s.mpCost) }] : []),
      ...(s.dmgMin && s.dmgMax ? [{ label: "Dmg", value: `${s.dmgMin}–${s.dmgMax}` }] : []),
      ...(s.dmg ? [{ label: "Dmg", value: String(s.dmg) }] : []),
    ]
  }
  if (item.type === "armor") {
    return [
      { label: "DEF", value: String(s.def ?? 0) },
      ...(s.wis ? [{ label: "WIS", value: `+${s.wis}` }] : []),
      ...(s.att ? [{ label: "ATT", value: `+${s.att}` }] : []),
      ...(s.vit ? [{ label: "VIT", value: `+${s.vit}` }] : []),
    ]
  }
  const bits: { label: string; value: string }[] = []
  if (s.att) bits.push({ label: "ATT", value: `+${s.att}` })
  if (s.dex) bits.push({ label: "DEX", value: `+${s.dex}` })
  if (s.wis) bits.push({ label: "WIS", value: `+${s.wis}` })
  if (s.hp) bits.push({ label: "HP", value: `+${s.hp}` })
  if (s.mp) bits.push({ label: "MP", value: `+${s.mp}` })
  if (s.vit) bits.push({ label: "VIT", value: `+${s.vit}` })
  return bits.slice(0, 4)
}
