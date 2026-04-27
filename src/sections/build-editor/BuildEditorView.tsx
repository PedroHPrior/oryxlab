import { useState } from "react"
import type {
  BuildEditorProps,
} from "../../../product/sections/build-editor/types"
import type {
  BuildSlots,
} from "../../../product/sections/comparator/types"
import { ClassPortrait } from "../_shared/ClassPortrait"
import { ItemSprite } from "../_shared/ItemSprite"
import { TierBadge } from "../_shared/TierBadge"
import { Stat } from "../_shared/Stat"
import { SlotPicker } from "../comparator/components/SlotPicker"
import { DpsCurveChart } from "../comparator/components/DpsCurveChart"
import {
  CalculationSteps,
  ExaltationsPanel,
  StatBreakdownBars,
} from "./components"

const SLOTS: { key: keyof BuildSlots; label: string }[] = [
  { key: "weapon", label: "Weapon" },
  { key: "ability", label: "Ability" },
  { key: "armor", label: "Armor" },
  { key: "ring", label: "Ring" },
  { key: "talisman", label: "Talisman" },
]

export function BuildEditorView({
  build,
  items,
  statBreakdowns,
  calculationSteps,
  shortcuts,
  onBackToComparator,
  onSave,
  onSaveAsNew,
  onDiscard,
  onRename,
  onChangeNotes,
  onChangeSlot,
  onChangeExaltations,
  onToggleCustomScenario,
  onChangeScenario,
}: BuildEditorProps) {
  const itemMap = new Map(items.map((i) => [i.id, i]))
  const [openSlot, setOpenSlot] = useState<keyof BuildSlots | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(build.name)

  const ds = build.derivedStats

  return (
    <div
      className="flex flex-col gap-4"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToComparator}
            className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            ← Comparator
          </button>
          <ClassPortrait
            classId={build.classId}
            name={build.className}
            color={build.color}
            size="md"
          />
          <div>
            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={() => {
                  setEditingName(false)
                  if (nameDraft.trim() && nameDraft !== build.name) onRename?.(nameDraft.trim())
                }}
                className="rounded-md border border-amber-400/60 bg-zinc-50 px-2 py-1 text-lg font-semibold text-zinc-900 focus:outline-none dark:bg-zinc-950 dark:text-zinc-100"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="text-lg font-semibold text-zinc-900 hover:text-amber-600 dark:text-zinc-100 dark:hover:text-amber-400"
              >
                {build.name}
              </button>
            )}
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
              <span>{build.className}</span>
              {build.tags.map((t) => (
                <span key={t} className="rounded-full bg-zinc-200/70 px-1.5 text-[10px] dark:bg-zinc-800">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowShortcuts((v) => !v)}
            className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:hover:text-zinc-100"
          >
            ?
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-rose-400/60 hover:text-rose-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-rose-400"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSaveAsNew}
            className="rounded-md border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            Save as new
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-md border border-amber-400/60 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-400/20 dark:text-amber-300"
          >
            Save
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr_360px]">
        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Equipped slots
            </h2>
            <ul className="flex flex-col gap-2">
              {SLOTS.map(({ key, label }) => {
                const itemId = build.slots[key]
                const item = itemId ? itemMap.get(itemId) : undefined
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setOpenSlot(key)}
                      className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 text-left transition-colors hover:border-amber-400/60 hover:bg-amber-400/5 dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      {item ? (
                        <ItemSprite spriteId={item.sprite} imageUrl={item.imageUrl} name={item.name} itemType={item.type} weaponType={item.weaponType} abilityType={item.abilityType} rarity={item.rarity} size="lg" />
                      ) : (
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-700">
                          +
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                          {label}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {item?.name ?? `Choose ${label.toLowerCase()}`}
                          </span>
                          {item && <TierBadge tier={item.tier} rarity={item.rarity} size="xs" />}
                        </div>
                        {item && (
                          <div className="mt-0.5 flex flex-wrap gap-1 text-[10px] text-zinc-500">
                            {item.tags.slice(0, 3).map((t) => (
                              <span key={t} className="rounded bg-zinc-200/60 px-1 dark:bg-zinc-800">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <ExaltationsPanel
            exaltations={build.exaltations}
            onChange={onChangeExaltations}
          />

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <header className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Notes
              </h2>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                local only
              </span>
            </header>
            <textarea
              value={build.notes}
              onChange={(e) => onChangeNotes?.(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              placeholder="What this build is for, what to swap, etc."
            />
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-3 lg:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <Stat label="DPS" value={ds.dps.toLocaleString("en-US")} size="xl" />
              <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
                <span>at Def {build.scenario.targetDefense}</span>
                <span>·</span>
                <span>DPS@0def {ds.dpsAtZeroDef.toLocaleString("en-US")}</span>
                <span>·</span>
                <span>TTK 1k HP: {ds.timeToKill1k.toFixed(2)}s</span>
              </div>
            </div>
            <Stat label="EHP" value={ds.ehp.toLocaleString("en-US")} size="md" />
            <Stat label="ATT" value={ds.att} size="md" />
            <Stat label="DEX" value={ds.dex} size="md" />
            <Stat label="WIS" value={ds.wis} size="md" />
            <Stat label="VIT" value={ds.vit} size="md" />
            <Stat label="SPD" value={ds.spd} size="md" />
            <Stat label="DEF" value={ds.def} size="md" />
            <Stat label="HP" value={ds.hp} size="md" />
            <Stat label="MP" value={ds.mp} size="md" />
          </section>

          <StatBreakdownBars breakdowns={statBreakdowns} />
          <CalculationSteps steps={calculationSteps} />

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Scenario for this build
              </h2>
              <button
                type="button"
                onClick={() => onToggleCustomScenario?.(!build.useCustomScenario)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  build.useCustomScenario
                    ? "border-amber-400/60 bg-amber-400/10 text-amber-700 dark:text-amber-300"
                    : "border-zinc-200 text-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:hover:text-zinc-100"
                }`}
              >
                {build.useCustomScenario ? "Custom" : "Inherits global"}
              </button>
            </header>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Target Def</div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={build.scenario.targetDefense}
                  disabled={!build.useCustomScenario}
                  onChange={(e) =>
                    onChangeScenario?.({
                      ...build.scenario,
                      targetDefense: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full accent-amber-400"
                />
                <div
                  className="text-zinc-700 dark:text-zinc-300"
                  style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
                >
                  Def {build.scenario.targetDefense}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Active</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {[...build.scenario.partyBuffs, ...build.scenario.targetStatuses].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {build.scenario.partyBuffs.length === 0 && build.scenario.targetStatuses.length === 0 && (
                    <span className="text-zinc-500">No buffs / statuses active</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              DPS vs target defense
            </h2>
            <DpsCurveChart
              curves={[{ id: build.id, name: build.name, color: build.color, values: ds.dpsCurve }]}
              highlightDef={build.scenario.targetDefense}
              width={340}
              height={220}
            />
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Quick swap suggestions
            </h2>
            <ul className="flex flex-col gap-1.5 text-xs">
              <li className="flex items-center justify-between">
                <span>Swap weapon for Wand of the Bulwark</span>
                <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  −12%
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Swap robe for T14 Robe</span>
                <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  −5%
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Swap ring for UBHP</span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  +6% EHP
                </span>
              </li>
            </ul>
          </section>
        </aside>
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

      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Keyboard shortcuts
            </h3>
            <ul className="flex flex-col gap-1.5 text-xs">
              {shortcuts.map((s, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300">{s.label}</span>
                  <span className="flex items-center gap-1">
                    {s.keys.map((k, j) => (
                      <kbd
                        key={j}
                        className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800"
                        style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
