import type {
  Build,
  PlayerClass,
} from "../../../../product/sections/comparator/types"
import { ClassPortrait } from "../../_shared/ClassPortrait"

interface TableViewProps {
  builds: Build[]
  classes: PlayerClass[]
  onOpenInEditor?: (buildId: string) => void
}

const ROWS: { key: keyof Build["derivedStats"]; label: string; goodWhen: "high" | "low" }[] = [
  { key: "dps", label: "DPS (scenario)", goodWhen: "high" },
  { key: "dpsAtZeroDef", label: "DPS @ 0 def", goodWhen: "high" },
  { key: "ehp", label: "EHP", goodWhen: "high" },
  { key: "timeToKill1k", label: "TTK 1k HP (s)", goodWhen: "low" },
  { key: "att", label: "ATT", goodWhen: "high" },
  { key: "dex", label: "DEX", goodWhen: "high" },
  { key: "wis", label: "WIS", goodWhen: "high" },
  { key: "vit", label: "VIT", goodWhen: "high" },
  { key: "spd", label: "SPD", goodWhen: "high" },
  { key: "def", label: "DEF", goodWhen: "high" },
  { key: "hp", label: "HP", goodWhen: "high" },
  { key: "mp", label: "MP", goodWhen: "high" },
]

export function TableView({ builds, classes, onOpenInEditor }: TableViewProps) {
  const classMap = new Map(classes.map((c) => [c.id, c]))

  if (builds.length === 0) return null

  return (
    <div
      className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <table className="w-full min-w-[640px]">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
          <tr>
            <th className="sticky left-0 z-10 bg-zinc-50 px-4 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/60">
              Metric
            </th>
            {builds.map((b) => {
              const cls = classMap.get(b.classId)
              return (
                <th key={b.id} className="px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => onOpenInEditor?.(b.id)}
                    className="flex items-center gap-2 text-left"
                  >
                    <ClassPortrait
                      classId={b.classId}
                      name={cls?.name ?? b.classId}
                      color={b.color}
                      size="xs"
                    />
                    <div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {b.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                        {cls?.name}
                      </div>
                    </div>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, rowIdx) => {
            const values = builds.map((b) => Number(b.derivedStats[row.key]))
            const ext =
              row.goodWhen === "high"
                ? Math.max(...values)
                : Math.min(...values)
            return (
              <tr
                key={row.key}
                className={`border-b border-zinc-100 last:border-b-0 dark:border-zinc-800 ${rowIdx % 2 === 0 ? "" : "bg-zinc-50/40 dark:bg-zinc-900/30"}`}
              >
                <td className="sticky left-0 z-10 bg-inherit px-4 py-2 text-xs font-medium text-zinc-500">
                  {row.label}
                </td>
                {builds.map((b, idx) => {
                  const v = values[idx]
                  const isBest = v === ext && builds.length > 1
                  return (
                    <td key={b.id} className="px-4 py-2">
                      <span
                        className={`inline-block text-sm ${isBest ? "text-emerald-600 font-semibold dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"}`}
                        style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontFeatureSettings: '"tnum"' }}
                      >
                        {formatVal(row.key, v)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function formatVal(key: string, v: number): string {
  if (key === "timeToKill1k") return v.toFixed(2)
  return v.toLocaleString("en-US")
}
