import type { ViewMode } from "../../../../product/sections/comparator/types"

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (v: ViewMode) => void
}

const MODES: { id: ViewMode; label: string }[] = [
  { id: "cards", label: "Cards" },
  { id: "focus", label: "Focus" },
  { id: "table", label: "Table" },
]

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Comparator view"
      className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {MODES.map((m) => {
        const active = m.id === value
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.id)}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "rounded-md bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
