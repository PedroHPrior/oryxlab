import type {
  Constraint,
  ConstraintPaletteEntry,
} from "../../../../product/sections/optimizer/types"

interface ConstraintsPanelProps {
  constraints: Constraint[]
  palette: ConstraintPaletteEntry[]
  onAdd?: (entry: ConstraintPaletteEntry) => void
  onUpdateValue?: (id: string, value: number | string) => void
  onRemove?: (id: string) => void
}

export function ConstraintsPanel({
  constraints,
  palette,
  onAdd,
  onUpdateValue,
  onRemove,
}: ConstraintsPanelProps) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <header>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Constraints
        </h3>
        <p className="text-xs text-zinc-500">
          The optimizer must satisfy every constraint below.
        </p>
      </header>

      {constraints.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {constraints.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300"
            >
              <span>
                {c.kind === "stat"
                  ? `${c.stat.toUpperCase()} ${opLabel(c.op)}`
                  : ruleLabel(c)}
              </span>
              {c.kind === "stat" || (c.kind === "rule" && typeof c.value === "number") ? (
                <input
                  type="number"
                  value={Number(c.value)}
                  onChange={(e) => onUpdateValue?.(c.id, Number(e.target.value))}
                  className="w-12 rounded bg-amber-400/10 px-1 text-right text-amber-800 focus:outline-none dark:bg-zinc-950 dark:text-amber-200"
                  style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
                />
              ) : null}
              <button
                type="button"
                onClick={() => onRemove?.(c.id)}
                aria-label="Remove constraint"
                className="text-amber-700/70 hover:text-rose-500 dark:text-amber-300/70"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Add constraint
        </span>
        <div className="flex flex-wrap gap-1.5">
          {palette.map((entry, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onAdd?.(entry)}
              className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-600 hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {entry.label}
              {typeof entry.default === "number" && ` ${entry.default}`}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function opLabel(op: string): string {
  if (op === "gte") return "≥"
  if (op === "lte") return "≤"
  return "="
}

function ruleLabel(c: Constraint): string {
  if (c.kind !== "rule") return ""
  switch (c.rule) {
    case "max-uts":
      return "Max UTs"
    case "max-st-pieces":
      return "Max ST"
    case "weapon-type":
      return `Weapon: ${c.value}`
  }
}
