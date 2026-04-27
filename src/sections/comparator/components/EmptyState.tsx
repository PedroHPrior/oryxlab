import type { PresetStarterCard } from "../../../../product/sections/comparator/types"

interface EmptyStateProps {
  cards: PresetStarterCard[]
  onApplyCard?: (cardId: string) => void
  onAddBuild?: () => void
}

export function EmptyState({ cards, onApplyCard, onAddBuild }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 py-10 text-center">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          Compare any builds in OryxLab
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Pick from a starter, or add your first build manually. Everything updates live as you tweak slots and scenario.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => onApplyCard?.(card.id)}
            className="group flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-amber-400/60 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-400/40"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-300">
              <StarterIcon name={card.icon} />
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {card.title}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {card.subtitle}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddBuild}
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
      >
        + Add build manually
      </button>
    </div>
  )
}

function StarterIcon({ name }: { name: string }) {
  if (name === "trophy") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8M12 17v4M17 4h3v3a4 4 0 0 1-4 4M7 4H4v3a4 4 0 0 0 4 4" />
        <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
      </svg>
    )
  }
  if (name === "history") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M6 9v6a3 3 0 0 0 3 3h6" />
      <path d="M18 15V9a3 3 0 0 0-3-3H9" />
    </svg>
  )
}
