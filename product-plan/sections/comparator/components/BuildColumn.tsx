import { useState } from "react"
import type {
  Build,
  BuildSlots,
  Exaltations,
  Item,
  PlayerClass,
  Scenario,
} from "../../../../product/sections/comparator/types"
import { ClassPortrait } from "../../_shared/ClassPortrait"
import { ItemSprite } from "../../_shared/ItemSprite"
import { TierBadge } from "../../_shared/TierBadge"
import { Stat } from "../../_shared/Stat"
import { SlotPicker } from "./SlotPicker"

interface BuildColumnProps {
  build: Build
  reference?: Build | null
  playerClass: PlayerClass | undefined
  items: Item[]
  globalScenario: Scenario
  onChangeSlot?: (slot: keyof BuildSlots, itemId: string | null) => void
  onRename?: (name: string) => void
  onToggleCustomScenario?: (useCustom: boolean) => void
  onChangeScenario?: (scenario: Scenario) => void
  onChangeExaltations?: (exaltations: Exaltations) => void
  onOpenInEditor?: () => void
  onDuplicate?: () => void
  onSave?: () => void
  onRemove?: () => void
}

const SLOTS: { key: keyof BuildSlots; label: string }[] = [
  { key: "weapon", label: "Weapon" },
  { key: "ability", label: "Ability" },
  { key: "armor", label: "Armor" },
  { key: "ring", label: "Ring" },
  { key: "talisman", label: "Talisman" },
]

export function BuildColumn({
  build,
  reference,
  playerClass,
  items,
  globalScenario,
  onChangeSlot,
  onRename,
  onToggleCustomScenario,
  onOpenInEditor,
  onDuplicate,
  onSave,
  onRemove,
}: BuildColumnProps) {
  const [openSlot, setOpenSlot] = useState<keyof BuildSlots | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState(build.name)
  const [editingName, setEditingName] = useState(false)

  const itemMap = new Map(items.map((i) => [i.id, i]))
  const isReference = reference?.id === build.id || !reference

  const ds = build.derivedStats
  const refDs = reference?.derivedStats

  const delta = (key: keyof typeof ds): number | undefined => {
    if (!refDs || isReference) return undefined
    const a = ds[key]
    const b = refDs[key]
    if (typeof a !== "number" || typeof b !== "number") return undefined
    return Math.round((a - b) * 100) / 100
  }

  const scenarioInUse = build.useCustomScenario && build.scenarioOverride ? build.scenarioOverride : globalScenario

  return (
    <article
      className="relative flex w-[280px] shrink-0 flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:w-[300px]"
      data-build-id={build.id}
    >
      <header className="flex items-start gap-3">
        <ClassPortrait
          classId={build.classId}
          name={playerClass?.name ?? build.classId}
          color={build.color}
          size="md"
        />
        <div className="min-w-0 flex-1">
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={() => {
                setEditingName(false)
                if (nameDraft.trim() && nameDraft !== build.name) onRename?.(nameDraft.trim())
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur()
                if (e.key === "Escape") {
                  setNameDraft(build.name)
                  setEditingName(false)
                }
              }}
              className="w-full rounded-md border border-amber-400/60 bg-zinc-50 px-1.5 py-0.5 text-sm font-semibold text-zinc-900 focus:outline-none dark:bg-zinc-950 dark:text-zinc-100"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="truncate text-left text-sm font-semibold text-zinc-900 hover:text-amber-600 dark:text-zinc-100 dark:hover:text-amber-400"
              title={build.name}
            >
              {build.name}
            </button>
          )}
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">
              {playerClass?.name}
            </span>
            {build.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-full bg-zinc-200/70 px-1.5 py-0 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Build options"
          >
            <KebabIcon />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <MenuLink onClick={() => { setMenuOpen(false); onOpenInEditor?.() }}>Open in Editor</MenuLink>
              <MenuLink onClick={() => { setMenuOpen(false); onDuplicate?.() }}>Duplicate</MenuLink>
              <MenuLink onClick={() => { setMenuOpen(false); onSave?.() }}>Save build</MenuLink>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
              <MenuLink onClick={() => { setMenuOpen(false); onRemove?.() }} danger>Remove column</MenuLink>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-1.5">
        {SLOTS.map(({ key, label }) => {
          const itemId = build.slots[key]
          const item = itemId ? itemMap.get(itemId) : undefined
          return (
            <button
              key={key}
              type="button"
              onClick={() => setOpenSlot(key)}
              className="group flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-2 text-left transition-colors hover:border-amber-400/60 hover:bg-amber-400/5 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-amber-400/40"
            >
              {item ? (
                <ItemSprite
                  spriteId={item.sprite}
                  itemType={item.type}
                  rarity={item.rarity}
                  size="md"
                />
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-700">
                  +
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                  {label}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    {item?.name ?? `Choose ${label.toLowerCase()}`}
                  </span>
                  {item && <TierBadge tier={item.tier} rarity={item.rarity} size="xs" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-lg bg-zinc-100/60 p-3 dark:bg-zinc-950/60">
        <div className="col-span-3">
          <Stat
            label="DPS"
            value={ds.dps.toLocaleString()}
            delta={delta("dps")}
            size="lg"
          />
        </div>
        <Stat label="EHP" value={ds.ehp.toLocaleString()} delta={delta("ehp")} size="sm" />
        <Stat label="ATT" value={ds.att} delta={delta("att")} size="sm" />
        <Stat label="DEX" value={ds.dex} delta={delta("dex")} size="sm" />
        <Stat label="WIS" value={ds.wis} delta={delta("wis")} size="sm" />
        <Stat label="DEF" value={ds.def} delta={delta("def")} size="sm" />
        <Stat label="HP" value={ds.hp} delta={delta("hp")} size="sm" />
      </div>

      <button
        type="button"
        onClick={() => onToggleCustomScenario?.(!build.useCustomScenario)}
        className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-[11px] transition-colors ${
          build.useCustomScenario
            ? "border-amber-400/60 bg-amber-400/10 text-amber-700 dark:text-amber-300"
            : "border-zinc-200 text-zinc-500 hover:border-amber-400/40 hover:text-zinc-900 dark:border-zinc-800 dark:hover:text-zinc-100"
        }`}
      >
        <span className="uppercase tracking-wider">
          {build.useCustomScenario ? "Custom scenario" : "Global scenario"}
        </span>
        <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}>
          Def {scenarioInUse.targetDefense}
        </span>
      </button>

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onOpenInEditor}
          className="flex-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Open in Editor
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded-md border border-amber-400/60 bg-amber-400/10 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-400/20 dark:text-amber-300"
        >
          Save
        </button>
      </div>

      {openSlot && (
        <SlotPicker
          slot={openSlot}
          currentItemId={build.slots[openSlot]}
          classId={build.classId}
          items={items}
          onSelect={(itemId) => {
            onChangeSlot?.(openSlot, itemId)
            setOpenSlot(null)
          }}
          onClose={() => setOpenSlot(null)}
        />
      )}
    </article>
  )
}

function MenuLink({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-3 py-1.5 text-left transition-colors ${
        danger
          ? "text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  )
}

function KebabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  )
}
