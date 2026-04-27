import type {
  Build,
  Item,
  PlayerClass,
  Scenario,
} from "../../../../product/sections/comparator/types"
import { BuildColumn } from "./BuildColumn"
import { DpsCurveChart } from "./DpsCurveChart"
import { ClassPortrait } from "../../_shared/ClassPortrait"

interface FocusViewProps {
  builds: Build[]
  classes: PlayerClass[]
  items: Item[]
  globalScenario: Scenario
  onSetFocusBuilds?: (a: string, b: string) => void
}

const STAT_BARS: { key: keyof Build["derivedStats"]; label: string }[] = [
  { key: "dps", label: "DPS" },
  { key: "ehp", label: "EHP" },
  { key: "att", label: "ATT" },
  { key: "dex", label: "DEX" },
  { key: "wis", label: "WIS" },
  { key: "def", label: "DEF" },
  { key: "hp", label: "HP" },
  { key: "mp", label: "MP" },
]

export function FocusView({
  builds,
  classes,
  items,
  globalScenario,
  onSetFocusBuilds,
}: FocusViewProps) {
  if (builds.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
        Add at least two builds to enter Focus mode.
      </div>
    )
  }

  const [a, b] = builds
  const classMap = new Map(classes.map((c) => [c.id, c]))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="uppercase tracking-wider">Focus pair:</span>
        {builds.slice(0, 6).map((bld, i) => {
          const isInPair = bld.id === a.id || bld.id === b.id
          return (
            <button
              key={bld.id}
              type="button"
              onClick={() => {
                if (i === 0) return
                onSetFocusBuilds?.(a.id, bld.id)
              }}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
                isInPair
                  ? "border-amber-400/60 bg-amber-400/10 text-amber-700 dark:text-amber-300"
                  : "border-zinc-200 text-zinc-500 hover:border-amber-400/40 hover:text-zinc-900 dark:border-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              <ClassPortrait
                classId={bld.classId}
                name={classMap.get(bld.classId)?.name ?? bld.classId}
                color={bld.color}
                size="xs"
              />
              {bld.name}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BuildColumn
          build={a}
          reference={null}
          playerClass={classMap.get(a.classId)}
          items={items}
          globalScenario={globalScenario}
        />
        <BuildColumn
          build={b}
          reference={a}
          playerClass={classMap.get(b.classId)}
          items={items}
          globalScenario={globalScenario}
        />
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            DPS vs target defense
          </h2>
          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-3 rounded-sm"
                style={{ backgroundColor: colorHex(a.color) }}
              />
              {a.name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-3 rounded-sm"
                style={{ backgroundColor: colorHex(b.color) }}
              />
              {b.name}
            </span>
          </div>
        </header>
        <DpsCurveChart
          curves={[
            { id: a.id, name: a.name, color: a.color, values: a.derivedStats.dpsCurve },
            { id: b.id, name: b.name, color: b.color, values: b.derivedStats.dpsCurve },
          ]}
          highlightDef={globalScenario.targetDefense}
          width={720}
          height={260}
        />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Stat-by-stat diff
        </h2>
        <div className="flex flex-col gap-2">
          {STAT_BARS.map((stat) => {
            const va = Number(a.derivedStats[stat.key])
            const vb = Number(b.derivedStats[stat.key])
            const max = Math.max(va, vb, 1)
            return (
              <div
                key={stat.key}
                className="grid grid-cols-[60px_1fr_60px] items-center gap-2 text-xs"
              >
                <div
                  className="text-right text-zinc-700 dark:text-zinc-300"
                  style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontFeatureSettings: '"tnum"' }}
                >
                  {va.toLocaleString()}
                </div>
                <div className="relative h-3 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${(va / max) * 50}%`,
                      backgroundColor: colorHex(a.color),
                      opacity: 0.8,
                    }}
                  />
                  <div
                    className="absolute inset-y-0 right-0 rounded-full"
                    style={{
                      width: `${(vb / max) * 50}%`,
                      backgroundColor: colorHex(b.color),
                      opacity: 0.8,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
                    {stat.label}
                  </span>
                </div>
                <div
                  className="text-zinc-700 dark:text-zinc-300"
                  style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontFeatureSettings: '"tnum"' }}
                >
                  {vb.toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function colorHex(name: string): string {
  return (
    {
      violet: "#a78bfa",
      purple: "#c084fc",
      amber: "#fbbf24",
      lime: "#a3e635",
      rose: "#fb7185",
      emerald: "#34d399",
      sky: "#38bdf8",
      fuchsia: "#e879f9",
      cyan: "#22d3ee",
      indigo: "#818cf8",
      pink: "#f472b6",
      teal: "#2dd4bf",
    }[name] ?? "#fbbf24"
  )
}
