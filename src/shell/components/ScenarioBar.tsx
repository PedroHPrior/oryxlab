export type StatusEffectId = "armorBroken" | "bleeding" | "exposed" | "cursed"
export type PartyBuffId =
  | "paladinSeal"
  | "warriorHelm"
  | "mysticCurse"
  | "bardInspire"
  | "bardCrescendo"
  | "bardEncore"

export interface Scenario {
  presetId: string | null
  targetDefense: number
  targetStatuses: StatusEffectId[]
  partyBuffs: PartyBuffId[]
}

interface ScenarioPreset {
  id: string
  label: string
}

interface ScenarioBarProps {
  scenario: Scenario
  presets?: ScenarioPreset[]
  open: boolean
  onChange?: (next: Scenario) => void
  onPresetSelect?: (presetId: string) => void
  onToggle?: () => void
}

const STATUS_OPTIONS: { id: StatusEffectId; label: string }[] = [
  { id: "armorBroken", label: "Armor Broken" },
  { id: "bleeding", label: "Bleeding" },
  { id: "exposed", label: "Exposed" },
  { id: "cursed", label: "Cursed" },
]

const BUFF_OPTIONS: { id: PartyBuffId; label: string }[] = [
  { id: "paladinSeal", label: "Paladin Seal" },
  { id: "warriorHelm", label: "Warrior Helm" },
  { id: "mysticCurse", label: "Mystic Curse" },
  { id: "bardInspire", label: "Bard Inspire" },
  { id: "bardCrescendo", label: "Bard Crescendo" },
  { id: "bardEncore", label: "Bard Encore" },
]

export function ScenarioBar({
  scenario,
  presets,
  open,
  onChange,
  onPresetSelect,
  onToggle,
}: ScenarioBarProps) {
  if (!open) {
    return (
      <div className="border-t border-zinc-200 bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center justify-between px-4 py-1.5 sm:px-6">
          <button
            type="button"
            onClick={onToggle}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ▾ Scenario
          </button>
        </div>
      </div>
    )
  }

  const updateStatus = (id: StatusEffectId) => {
    const has = scenario.targetStatuses.includes(id)
    onChange?.({
      ...scenario,
      targetStatuses: has
        ? scenario.targetStatuses.filter((s) => s !== id)
        : [...scenario.targetStatuses, id],
    })
  }

  const updateBuff = (id: PartyBuffId) => {
    const has = scenario.partyBuffs.includes(id)
    onChange?.({
      ...scenario,
      partyBuffs: has
        ? scenario.partyBuffs.filter((b) => b !== id)
        : [...scenario.partyBuffs, id],
    })
  }

  return (
    <div className="border-t border-zinc-200 bg-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <label className="text-[11px] uppercase tracking-wider text-zinc-500">
            Preset
          </label>
          <select
            value={scenario.presetId ?? "custom"}
            onChange={(e) => onPresetSelect?.(e.target.value)}
            aria-label="Scenario preset"
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {(presets ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="target-defense"
            className="text-[11px] uppercase tracking-wider text-zinc-500"
          >
            Target Def
          </label>
          <input
            id="target-defense"
            type="range"
            min={0}
            max={80}
            value={scenario.targetDefense}
            onChange={(e) =>
              onChange?.({ ...scenario, targetDefense: Number(e.target.value) })
            }
            className="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-zinc-300 accent-amber-400 dark:bg-zinc-700"
          />
          <input
            type="number"
            min={0}
            max={120}
            value={scenario.targetDefense}
            onChange={(e) =>
              onChange?.({ ...scenario, targetDefense: Number(e.target.value) })
            }
            className="w-14 rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-right text-xs text-zinc-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
          />
        </div>

        <ChipGroup
          label="Status on target"
          options={STATUS_OPTIONS}
          activeIds={scenario.targetStatuses}
          onToggle={(id) => updateStatus(id as StatusEffectId)}
          accent="rose"
        />

        <ChipGroup
          label="Party buffs"
          options={BUFF_OPTIONS}
          activeIds={scenario.partyBuffs}
          onToggle={(id) => updateBuff(id as PartyBuffId)}
          accent="amber"
        />

        <button
          type="button"
          onClick={onToggle}
          className="ml-auto rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
        >
          ▴ Hide
        </button>
      </div>
    </div>
  )
}

function ChipGroup({
  label,
  options,
  activeIds,
  onToggle,
  accent,
}: {
  label: string
  options: { id: string; label: string }[]
  activeIds: string[]
  onToggle: (id: string) => void
  accent: "amber" | "rose"
}) {
  const active = (id: string) => activeIds.includes(id)
  const accentActive =
    accent === "amber"
      ? "border-amber-400/60 bg-amber-400/10 text-amber-700 dark:text-amber-300"
      : "border-rose-400/60 bg-rose-400/10 text-rose-700 dark:text-rose-300"

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((opt) => {
          const isActive = active(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                isActive
                  ? accentActive
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
              }`}
              aria-pressed={isActive}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
