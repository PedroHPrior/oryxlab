import { useEffect } from "react"
import type { CatalogItem } from "../../../../product/sections/catalog/types"
import { ItemSprite } from "../../_shared/ItemSprite"
import { TierBadge } from "../../_shared/TierBadge"

interface ItemDetailModalProps {
  item: CatalogItem | null
  onClose: () => void
  onSendToComparator?: (id: string) => void
  onMarkOwned?: (id: string) => void
  /** Whether the current item is already in the user's inventory. */
  isOwned?: boolean
}

const WEAPON_BASE_ROF: Record<string, number> = {
  wand: 1.5, staff: 1.5, bow: 1.8, katana: 1.8, dagger: 1.8, sword: 1.6, lute: 1.7, mace: 1.5,
}

// Plain-language explanation for each known tag , surfaced as tooltip in the modal.
const TAG_DESCRIPTIONS: Record<string, string> = {
  "on-equip": "Has special on-equip effects (see item description on RealmEye).",
  "self-berserk": "Briefly grants Berserk (faster fire rate) when proc fires.",
  berserk: "Briefly grants Berserk (faster fire rate) when proc fires.",
  "self-damaging": "Briefly grants Damaging (+25% damage dealt) when proc fires.",
  damaging: "Briefly grants Damaging (+25% damage dealt) when proc fires.",
  "self-inspired": "Briefly grants Inspired (faster projectile speed) when proc fires.",
  inspired: "Briefly grants Inspired (faster projectile speed) when proc fires.",
  "self-speedy": "Briefly grants Speedy (faster movement) when proc fires.",
  speedy: "Briefly grants Speedy (faster movement) when proc fires.",
  "self-armored": "Briefly grants Armored (+25% defense) when proc fires.",
  armored: "Briefly grants Armored (+25% defense).",
  "self-healing": "Triggers Healing on the wielder.",
  healing: "Triggers Healing on the wielder.",
  "self-invulnerable": "Brief Invulnerable status , immune to incoming damage.",
  invulnerable: "Brief Invulnerable status , immune to incoming damage.",
  "inflicts-cursed": "Applies Cursed to enemies , they take +25% damage.",
  cursed: "Applies Cursed to enemies , they take +25% damage.",
  curse: "Applies Cursed to enemies , they take +25% damage.",
  "inflicts-curse": "Applies Cursed to enemies , they take +25% damage.",
  "inflicts-exposed": "Applies Exposed to enemies , they take +20% damage.",
  exposed: "Applies Exposed to enemies , they take +20% damage.",
  "inflicts-paralyze": "Paralyzes enemies , they cannot move.",
  paralyze: "Paralyzes enemies , they cannot move.",
  "inflicts-paralyzed": "Paralyzes enemies , they cannot move.",
  "inflicts-slowed": "Slows enemies , reduces movement speed.",
  slowed: "Slows enemies , reduces movement speed.",
  "inflicts-stunned": "Stuns enemies , prevents shooting.",
  stunned: "Stuns enemies , prevents shooting.",
  "inflicts-bleeding": "Inflicts Bleeding , DoT that prevents healing.",
  bleeding: "Inflicts Bleeding , DoT that prevents healing.",
  "armor-piercing": "Bypasses target defense entirely.",
  "armor piercing": "Bypasses target defense entirely.",
  "true damage": "Bypasses target defense entirely.",
  piercing: "Projectile passes through enemies.",
  wavy: "Projectile follows a sine wave path.",
  parametric: "Projectile follows a parametric curve.",
  boomerang: "Projectile returns after reaching max range.",
  aoe: "Hits multiple enemies in an area.",
  directional: "Projectile fires in a fixed direction; needs aiming.",
}

function describeTag(tag: string): string {
  return TAG_DESCRIPTIONS[tag] ?? tag
}

export function ItemDetailModal({ item, onClose, onSendToComparator, onMarkOwned, isOwned }: ItemDetailModalProps) {
  useEffect(() => {
    if (!item) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [item, onClose])

  if (!item) return null

  const s = item.stats
  const baseRof = item.weaponType ? WEAPON_BASE_ROF[item.weaponType] : undefined
  const effectiveRoF =
    item.type === "weapon"
      ? typeof s.shotsPerSec === "number"
        ? s.shotsPerSec * (s.rateOfFireMod ?? 1)
        : typeof baseRof === "number"
        ? baseRof * (s.rateOfFireMod ?? 1)
        : null
      : null

  const numericFields: { label: string; value: string }[] = []
  if (item.type === "weapon" && typeof s.dmgMin === "number" && typeof s.dmgMax === "number") {
    numericFields.push({ label: "Damage", value: `${s.dmgMin}–${s.dmgMax}` })
    if (effectiveRoF != null) numericFields.push({ label: "Rate of Fire", value: `${effectiveRoF.toFixed(2)}/s` })
    if (typeof s.shots === "number" && s.shots > 1) numericFields.push({ label: "Shots", value: `× ${s.shots}` })
    if (typeof s.range === "number") numericFields.push({ label: "Range", value: `${s.range} tiles` })
  }
  if (item.type === "ability") {
    if (typeof s.dmgMin === "number" && typeof s.dmgMax === "number") {
      numericFields.push({ label: "Damage", value: `${s.dmgMin}–${s.dmgMax}` })
    } else if (typeof s.procDamage === "number" && s.procDamage > 0) {
      numericFields.push({ label: "Damage", value: `${s.procDamage}` })
    }
    if (typeof s.shots === "number" && s.shots > 1) numericFields.push({ label: "Shots", value: `× ${s.shots}` })
    if (typeof s.cooldown === "number") numericFields.push({ label: "Cooldown", value: `${s.cooldown}s` })
    if (typeof s.mpCost === "number") numericFields.push({ label: "MP Cost", value: `${s.mpCost}` })
    if (typeof s.duration === "number") numericFields.push({ label: "Duration", value: `${s.duration}s` })
  }
  if (item.type === "weapon" && typeof s.procDamage === "number" && typeof s.procRate === "number") {
    numericFields.push({
      label: "Proc",
      value: `${s.procDamage} dmg @ ${(s.procRate * 100).toFixed(0)}% rate`,
    })
  }
  if (item.type === "armor" && typeof s.def === "number") {
    numericFields.push({ label: "DEF", value: `${s.def}` })
  }

  const statBonuses: { label: string; value: string }[] = []
  for (const k of ["att", "dex", "wis", "vit", "spd", "def", "hp", "mp", "luck"] as const) {
    const v = (s as Record<string, number | undefined>)[k]
    if (typeof v === "number" && v > 0) {
      statBonuses.push({ label: k.toUpperCase(), value: `+${v}` })
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Item details: ${item.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          ✕
        </button>

        <div className="flex items-start gap-4">
          <ItemSprite
            spriteId={item.sprite}
            imageUrl={item.imageUrl}
            name={item.name}
            itemType={item.type}
            weaponType={item.weaponType}
            abilityType={item.abilityType}
            rarity={item.rarity}
            size="xl"
          />
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-100" title={item.name}>
              {item.name}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <TierBadge tier={item.tier} rarity={item.rarity} size="sm" />
              <span className="text-xs uppercase tracking-wider text-zinc-500">{item.type}</span>
            </div>
          </div>
        </div>

        {numericFields.length > 0 && (
          <div
            className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40"
            style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontFeatureSettings: '"tnum"' }}
          >
            {numericFields.map((f) => (
              <div key={f.label} className="flex items-baseline justify-between gap-2">
                <span className="text-xs uppercase tracking-wider text-zinc-500">{f.label}</span>
                <span className="text-zinc-900 dark:text-zinc-100">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {statBonuses.length > 0 && (
          <div className="mt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Stat bonuses</h3>
            <div
              className="mt-1.5 flex flex-wrap gap-1.5"
              style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
            >
              {statBonuses.map((b) => (
                <span
                  key={b.label}
                  className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                >
                  {b.value} {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {item.tags.length > 0 && (
          <div className="mt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Effects / tags</h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <span
                  key={t}
                  title={describeTag(t)}
                  className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {item.classes.length > 0 && (
          <div className="mt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Equipped by</h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.classes.map((c) => (
                <span
                  key={c}
                  className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs capitalize text-amber-700 dark:text-amber-300"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          {onMarkOwned && (
            <button
              type="button"
              onClick={() => onMarkOwned(item.id)}
              disabled={isOwned}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                isOwned
                  ? "cursor-not-allowed border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              {isOwned ? "✓ Owned" : "+ Mark as owned"}
            </button>
          )}
          {onSendToComparator && (
            <button
              type="button"
              onClick={() => onSendToComparator(item.id)}
              className="rounded-md bg-amber-400 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
            >
              Send to comparator
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
