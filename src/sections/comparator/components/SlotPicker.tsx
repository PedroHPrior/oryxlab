import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
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
}

type RarityFilter = "all" | "ut" | "st" | "tiered"
type SortKey = "tier-desc" | "name" | "dps"

const RARITY_LABEL: Record<RarityFilter, string> = {
  all: "All",
  ut: "UT",
  st: "ST",
  tiered: "Tiered",
}

const SORT_LABEL: Record<SortKey, string> = {
  "tier-desc": "Tier ↓",
  name: "A → Z",
  dps: "Damage ↓",
}

function tierRank(item: Item): number {
  if (item.tier === "UT") return 100
  if (item.tier === "ST") return 99
  const m = /^T(\d+)$/.exec(item.tier)
  return m ? parseInt(m[1], 10) : 0
}

function avgDmg(item: Item): number {
  const s = item.stats
  if (typeof s.dmgAvg === "number") return s.dmgAvg
  if (typeof s.dmgMin === "number" && typeof s.dmgMax === "number") {
    return (s.dmgMin + s.dmgMax) / 2
  }
  return 0
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
  const [rarity, setRarity] = useState<RarityFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("tier-desc")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const filtered = useMemo(() => {
    const wantedType = SLOT_TO_TYPE[slot]
    const q = search.trim().toLowerCase()
    const matched = items.filter((i) => {
      if (i.type !== wantedType) return false
      // Empty `classes` array means class-agnostic (rings and most generic
      // accessories). Restrict only when a class list is explicitly provided
      // AND non-empty.
      if (Array.isArray(i.classes) && i.classes.length > 0) {
        if (!i.classes.includes(classId)) return false
      }
      if (rarity !== "all" && i.rarity !== rarity) return false
      if (q && !i.name.toLowerCase().includes(q)) return false
      return true
    })
    matched.sort((a, b) => {
      if (sortKey === "tier-desc") {
        const r = tierRank(b) - tierRank(a)
        if (r !== 0) return r
        return a.name.localeCompare(b.name)
      }
      if (sortKey === "dps") {
        const r = avgDmg(b) - avgDmg(a)
        if (r !== 0) return r
        return a.name.localeCompare(b.name)
      }
      return a.name.localeCompare(b.name)
    })
    return matched
  }, [items, slot, classId, search, rarity, sortKey])

  const modal = (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Choose ${slot}`}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
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

        <div className="flex flex-col gap-2 border-b border-zinc-200 p-3 dark:border-zinc-800">
          <input
            autoFocus
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Rarity
            </span>
            {(Object.keys(RARITY_LABEL) as RarityFilter[]).map((r) => {
              const active = rarity === r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRarity(r)}
                  className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                    active
                      ? "border-amber-400 bg-amber-400/10 text-amber-700 dark:text-amber-300"
                      : "border-zinc-200 text-zinc-600 hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  {RARITY_LABEL[r]}
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Sort
            </span>
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => {
              const active = sortKey === k
              const showDps = slot === "weapon" || slot === "ability"
              if (k === "dps" && !showDps) return null
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSortKey(k)}
                  className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                    active
                      ? "border-amber-400 bg-amber-400/10 text-amber-700 dark:text-amber-300"
                      : "border-zinc-200 text-zinc-600 hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  {SORT_LABEL[k]}
                </button>
              )
            })}
          </div>
        </div>

        <ul className="oryx-no-scrollbar max-h-[min(60vh,440px)] overflow-y-auto">
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

  if (typeof document === "undefined") return null
  return createPortal(modal, document.body)
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
