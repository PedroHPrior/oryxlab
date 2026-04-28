import { useMemo, useState } from "react"
import type { CatalogItem } from "../../../../product/sections/catalog/types"
import type { Build, BuildSlots, Item, Scenario } from "../../../../product/sections/comparator/types"
import { computeDerivedStats, type PlayerClassDef } from "../../../engine/dps"
import { ItemSprite } from "../../_shared/ItemSprite"
import { TierBadge } from "../../_shared/TierBadge"

interface QuickComparePanelProps {
  items: CatalogItem[]
  classes: PlayerClassDef[]
  scenario: Scenario
  onClose: () => void
  onRemove: (id: string) => void
  onSendToComparator?: (id: string) => void
}

const SLOT_BY_TYPE: Record<string, keyof BuildSlots> = {
  weapon: "weapon",
  ability: "ability",
  armor: "armor",
  ring: "ring",
}

// Returns the most appropriate baseline class to equip an item on. Falls back
// to the first listed class on the item, then to Wizard.
function pickClassForItem(item: CatalogItem, classes: PlayerClassDef[]): PlayerClassDef {
  const ownClass = classes.find((c) => item.classes?.includes(c.id))
  if (ownClass) return ownClass
  return classes.find((c) => c.id === "wizard") ?? classes[0]
}

function makeTestBuild(classId: string, slots: BuildSlots): Build {
  return {
    id: "test", name: "test", classId, color: "violet", tags: [],
    slots,
    exaltations: { att: 5, dex: 5, wis: 5, vit: 5, spd: 5, def: 5, hp: 5, mp: 5 },
    useCustomScenario: false,
    derivedStats: { dps: 0, dpsAtZeroDef: 0, ehp: 0, att: 0, dex: 0, spd: 0, vit: 0, wis: 0, def: 0, hp: 0, mp: 0, timeToKill1k: 0, dpsCurve: [] },
  }
}

interface CompareRow {
  item: CatalogItem
  dps: number
  ehp: number
  att: number
  dex: number
  wis: number
  def: number
  hp: number
  /** Per-defense DPS curve (17 points: def 0, 5, 10, …, 80). */
  curve: number[]
}

const COMPARE_COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb923c"]

export function QuickComparePanel({ items, classes, scenario, onClose, onRemove, onSendToComparator }: QuickComparePanelProps) {
  // User can override which class context to compare in. Default: best class
  // for the first item.
  const [classOverride, setClassOverride] = useState<string | null>(null)

  const itemTypes = useMemo(() => Array.from(new Set(items.map((i) => i.type))), [items])
  const sameType = itemTypes.length === 1
  const slotKey = sameType ? SLOT_BY_TYPE[itemTypes[0]] : null

  const activeClass = useMemo(() => {
    if (classOverride) return classes.find((c) => c.id === classOverride) ?? classes[0]
    return pickClassForItem(items[0], classes)
  }, [classOverride, classes, items])

  // Compute DPS impact for each item by equipping it on a baseline build.
  // For weapon comparisons, we test the weapon alone.
  // For ability comparisons, we put a generic baseline weapon for the class.
  // For armor/ring comparisons, we equip the item plus the canonical
  // weapon for the active class so DPS values are comparable.
  const rows = useMemo<CompareRow[]>(() => {
    if (!activeClass || !slotKey) return []
    const itemMap = new Map<string, Item>()
    for (const it of items) itemMap.set(it.id, it as unknown as Item)

    return items.map((item) => {
      const slots: BuildSlots = {
        weapon: null, ability: null, armor: null, ring: null,
        [slotKey]: item.id,
      } as BuildSlots
      const ds = computeDerivedStats({
        build: makeTestBuild(activeClass.id, slots),
        scenario,
        classDef: activeClass,
        itemMap,
      })
      return {
        item,
        dps: ds.dps,
        ehp: ds.ehp,
        att: ds.att,
        dex: ds.dex,
        wis: ds.wis,
        def: ds.def,
        hp: ds.hp,
        curve: ds.dpsCurve.slice(),
      }
    })
  }, [items, activeClass, scenario, slotKey])

  // Pick winners per metric (highest wins for everything except cycleTime which
  // we don't show here).
  const winners = useMemo(() => {
    const metrics: (keyof Omit<CompareRow, "item">)[] = ["dps", "ehp", "att", "dex", "wis", "def", "hp"]
    const out: Record<string, string> = {}
    for (const m of metrics) {
      let best: CompareRow | null = null
      for (const r of rows) {
        if (!best || r[m] > best[m]) best = r
      }
      if (best) out[m] = best.item.id
    }
    return out
  }, [rows])

  // Overall verdict: which item wins on DPS, given that's the primary catalog use case
  const verdict = useMemo(() => {
    if (rows.length < 2) return null
    const dpsRows = rows.slice().sort((a, b) => b.dps - a.dps)
    const winner = dpsRows[0]
    const runner = dpsRows[1]
    if (winner.dps === 0 && runner.dps === 0) {
      // Non-DPS items: pick by combined stat power
      const score = (r: CompareRow) =>
        r.att * 3 + r.dex * 3 + r.wis + r.def * 2 + r.hp * 0.05 + r.ehp * 0.05
      const ranked = rows.slice().sort((a, b) => score(b) - score(a))
      return {
        winnerName: ranked[0].item.name,
        metric: "stat power",
        delta: `+${(score(ranked[0]) - score(ranked[1])).toFixed(0)} score`,
      }
    }
    const pct = runner.dps > 0 ? (((winner.dps - runner.dps) / runner.dps) * 100).toFixed(0) : "∞"
    return {
      winnerName: winner.item.name,
      metric: "DPS",
      delta: `+${winner.dps - runner.dps} DPS (${pct}%) vs ${runner.item.name}`,
    }
  }, [rows])

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-zinc-950/40 backdrop-blur"
      onClick={onClose}
      role="dialog"
      aria-label="Quick compare"
    >
      <div
        className="w-full rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "85vh" }}
      >
        <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Quick compare · {items.length} items
          </h2>
          <div className="flex items-center gap-3">
            <label className="text-xs text-zinc-500">
              Class context:{" "}
              <select
                value={activeClass?.id ?? ""}
                onChange={(e) => setClassOverride(e.target.value)}
                className="ml-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Verdict banner */}
        {verdict && (
          <div className="mx-5 mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-700/50 dark:bg-amber-500/10">
            <div className="font-semibold text-amber-900 dark:text-amber-200">
              ✦ {verdict.winnerName} wins on {verdict.metric}
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300">{verdict.delta}</div>
          </div>
        )}

        {!sameType && (
          <div className="mx-5 mt-4 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
            Items of mixed types selected ({itemTypes.join(", ")}) , DPS comparison disabled.
            Compare items of the same type for a meaningful verdict.
          </div>
        )}

        {/* DPS-vs-defense curve , only meaningful when items are weapons or
            damaging abilities. We render it whenever any row has a non-zero
            curve so users can see how each candidate scales. */}
        {sameType && rows.some((r) => r.curve.some((v) => v > 0)) && (
          <div className="px-5 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              DPS vs target defense
            </h3>
            <CompareDpsCurve rows={rows} />
          </div>
        )}

        {/* Comparison table */}
        <div className="overflow-x-auto px-5 py-4">
          <table
            className="w-full border-collapse text-sm"
            style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontFeatureSettings: '"tnum"' }}
          >
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Metric</th>
                {rows.map((r) => (
                  <th key={r.item.id} className="px-3 py-2 text-left">
                    <div className="flex items-start gap-2">
                      <ItemSprite
                        spriteId={r.item.sprite}
                        imageUrl={r.item.imageUrl}
                        name={r.item.name}
                        itemType={r.item.type}
                        weaponType={r.item.weaponType}
                        abilityType={r.item.abilityType}
                        rarity={r.item.rarity}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                          title={r.item.name}
                        >
                          {r.item.name}
                        </div>
                        <TierBadge tier={r.item.tier} rarity={r.item.rarity} size="xs" />
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(r.item.id)}
                        aria-label="Remove from compare"
                        className="text-xs text-zinc-400 hover:text-rose-500"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sameType && <MetricRow label="DPS" rows={rows} field="dps" winnerId={winners.dps} bold />}
              <MetricRow label="EHP" rows={rows} field="ehp" winnerId={winners.ehp} />
              <MetricRow label="ATT" rows={rows} field="att" winnerId={winners.att} />
              <MetricRow label="DEX" rows={rows} field="dex" winnerId={winners.dex} />
              <MetricRow label="WIS" rows={rows} field="wis" winnerId={winners.wis} />
              <MetricRow label="DEF" rows={rows} field="def" winnerId={winners.def} />
              <MetricRow label="HP" rows={rows} field="hp" winnerId={winners.hp} />
            </tbody>
          </table>
        </div>

        {/* Per-item action row */}
        <footer className="flex items-center justify-between gap-3 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <div
            className="text-xs text-zinc-500"
            style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
          >
            Test bench: maxed {activeClass?.id ?? ""} · scenario at Def {scenario.targetDefense}
          </div>
          {onSendToComparator && (
            <div className="flex flex-wrap gap-2">
              {rows.map((r) => (
                <button
                  key={r.item.id}
                  type="button"
                  onClick={() => onSendToComparator(r.item.id)}
                  className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs hover:border-amber-400 dark:border-zinc-700 dark:bg-zinc-900"
                  style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                >
                  Send {r.item.name} →
                </button>
              ))}
            </div>
          )}
        </footer>
      </div>
    </div>
  )
}

function CompareDpsCurve({ rows }: { rows: CompareRow[] }) {
  // Find global max for y-axis scale.
  const maxDps = Math.max(1, ...rows.flatMap((r) => r.curve))
  const W = 480
  const H = 160
  const padX = 28
  const padY = 16
  const innerW = W - padX * 2
  const innerH = H - padY * 2
  const points = (curve: number[]) =>
    curve
      .map((v, i) => {
        const x = padX + (i / (curve.length - 1)) * innerW
        const y = padY + innerH - (v / maxDps) * innerH
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(" ")

  return (
    <div className="mt-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="DPS vs target defense for compared items"
      >
        {/* Y axis grid lines (4 segments) */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padY + innerH * (1 - frac)
          return (
            <line
              key={frac}
              x1={padX}
              y1={y}
              x2={padX + innerW}
              y2={y}
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-zinc-300 dark:text-zinc-700"
            />
          )
        })}
        {rows.map((r, i) => (
          <g key={r.item.id}>
            <polyline
              fill="none"
              stroke={COMPARE_COLORS[i % COMPARE_COLORS.length]}
              strokeWidth={2}
              points={points(r.curve)}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
        {/* X-axis labels */}
        {[0, 4, 8, 12, 16].map((idx) => {
          const x = padX + (idx / 16) * innerW
          return (
            <text
              key={idx}
              x={x}
              y={H - 2}
              fontSize={9}
              textAnchor="middle"
              className="fill-zinc-500"
            >
              {idx * 5}
            </text>
          )
        })}
        <text
          x={padX}
          y={padY - 2}
          fontSize={9}
          className="fill-zinc-500"
        >
          {Math.round(maxDps).toLocaleString("en-US")}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px]" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
        {rows.map((r, i) => (
          <span key={r.item.id} className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <span
              className="inline-block h-2 w-3 rounded-sm"
              style={{ backgroundColor: COMPARE_COLORS[i % COMPARE_COLORS.length] }}
            />
            {r.item.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function MetricRow({
  label, rows, field, winnerId, bold,
}: {
  label: string
  rows: CompareRow[]
  field: keyof Omit<CompareRow, "item">
  winnerId?: string
  bold?: boolean
}) {
  const allZero = rows.every((r) => r[field] === 0)
  if (allZero) return null

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
      <td className="py-1.5 pr-2 text-xs uppercase tracking-wider text-zinc-500">{label}</td>
      {rows.map((r) => {
        const isWinner = r.item.id === winnerId && rows.length > 1
        return (
          <td
            key={r.item.id}
            className={`px-3 py-1.5 ${
              isWinner
                ? "text-amber-700 dark:text-amber-300"
                : "text-zinc-700 dark:text-zinc-300"
            } ${bold ? "text-base font-semibold" : ""}`}
          >
            <span className="inline-flex items-center gap-1.5">
              {isWinner && <span aria-label="Winner">✦</span>}
              {r[field].toLocaleString("en-US")}
            </span>
          </td>
        )
      })}
    </tr>
  )
}
