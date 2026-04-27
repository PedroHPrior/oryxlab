import { useEffect, useMemo, useState } from "react"
import type {
  BuildSlots,
  Item,
} from "../../../../product/sections/comparator/types"
import { ItemSprite } from "../../_shared/ItemSprite"
import { TierBadge } from "../../_shared/TierBadge"

interface SlotPickerProps {
  slot: keyof BuildSlots
  classId: string
  currentItemId: string | null
  items: Item[]
  onSelect: (itemId: string | null) => void
  onClose: () => void
}

const SLOT_TO_TYPE: Record<keyof BuildSlots, Item["type"]> = {
  weapon: "weapon",
  ability: "ability",
  armor: "armor",
  ring: "ring",
  talisman: "talisman",
}

export function SlotPicker({
  slot,
  classId,
  currentItemId,
  items,
  onSelect,
  onClose,
}: SlotPickerProps) {
  const [search, setSearch] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const filtered = useMemo(() => {
    const wantedType = SLOT_TO_TYPE[slot]
    const q = search.trim().toLowerCase()
    return items
      .filter((i) => i.type === wantedType && i.classes.includes(classId))
      .filter((i) => (q ? i.name.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        if (a.rarity !== b.rarity) return a.rarity === "ut" ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [items, slot, classId, search])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-4 backdrop-blur sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`Choose ${slot}`}
        className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Choose a {slot}
            </h3>
            <p className="text-xs text-zinc-500">
              {filtered.length} compatible items
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
          <input
            autoFocus
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <ul className="max-h-[420px] overflow-y-auto">
          {currentItemId && (
            <li>
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="flex w-full items-center gap-3 border-b border-zinc-200 px-4 py-2 text-left text-xs text-rose-600 transition-colors hover:bg-rose-500/5 dark:border-zinc-800 dark:text-rose-400"
              >
                Unequip current item
              </button>
            </li>
          )}
          {filtered.map((item) => {
            const active = item.id === currentItemId
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                    active
                      ? "bg-amber-400/10 text-amber-700 dark:text-amber-300"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  <ItemSprite
                    spriteId={item.sprite}
                    imageUrl={item.imageUrl}
                    name={item.name}
                    itemType={item.type}
                    weaponType={item.weaponType}
                    abilityType={item.abilityType}
                    rarity={item.rarity}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{item.name}</span>
                      <TierBadge tier={item.tier} rarity={item.rarity} size="xs" />
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-zinc-500">
                      {summarizeStats(item)}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-zinc-500">
              No items match.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

const WEAPON_BASE_ROF: Record<string, number> = {
  wand: 1.5, staff: 1.5, bow: 1.8, katana: 1.8, dagger: 1.8, sword: 1.6, lute: 1.7, mace: 1.5,
}

function summarizeStats(item: Item): string {
  const s = item.stats
  if (s.dmgMin && s.dmgMax) {
    if (item.type === "ability") {
      const cycle = typeof s.cooldown === "number" && s.cooldown > 0 ? `cd ${s.cooldown}s`
        : typeof s.mpCost === "number" ? `${s.mpCost} mp` : ""
      const shotsTxt = s.shots && s.shots > 1 ? ` × ${s.shots}` : ""
      return `Dmg ${s.dmgMin}–${s.dmgMax}${shotsTxt}${cycle ? ` · ${cycle}` : ""}`
    }
    const baseRof = item.weaponType ? WEAPON_BASE_ROF[item.weaponType] : undefined
    const rof = typeof s.shotsPerSec === "number"
      ? s.shotsPerSec * (s.rateOfFireMod ?? 1)
      : typeof baseRof === "number" ? baseRof * (s.rateOfFireMod ?? 1) : null
    return `Dmg ${s.dmgMin}–${s.dmgMax} · ${rof != null ? `${rof.toFixed(2)}/s` : "?/s"}${s.shots && s.shots > 1 ? ` × ${s.shots}` : ""}`
  }
  if (s.def !== undefined) return `DEF ${s.def}${s.wis ? ` · WIS ${s.wis}` : ""}${s.att ? ` · ATT ${s.att}` : ""}`
  const bits: string[] = []
  if (s.att) bits.push(`ATT ${s.att}`)
  if (s.dex) bits.push(`DEX ${s.dex}`)
  if (s.wis) bits.push(`WIS ${s.wis}`)
  if (s.hp) bits.push(`HP ${s.hp}`)
  if (s.mp) bits.push(`MP ${s.mp}`)
  if (s.dmg) bits.push(`Dmg ${s.dmg}`)
  return bits.join(" · ") || item.tags.join(" · ")
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
