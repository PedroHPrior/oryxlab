import { useState } from "react"

const STORAGE_KEY = "oryxlab.v2.welcome.dismissed"

/**
 * One-time onboarding banner shown above the Comparator on first visit.
 * Dismissal persists in localStorage so returning users see a clean page.
 */
export function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      return true
    }
  })

  if (dismissed) return null

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      /* ignore quota errors */
    }
    setDismissed(true)
  }

  return (
    <div
      role="region"
      aria-label="Welcome to OryxLab"
      className="relative overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-50 via-amber-50/50 to-transparent p-5 dark:border-amber-400/30 dark:from-amber-400/10 dark:via-amber-400/5"
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss welcome banner"
        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400/20 sm:inline-flex">
          <span aria-hidden="true" className="text-xl">👋</span>
        </div>
        <div className="flex-1 pr-8">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Welcome to OryxLab
          </h2>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            Compare any two builds side-by-side and see exactly which item swap
            wins. A few ways to start:
          </p>
          <ul className="mt-2 grid gap-1.5 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-amber-600 dark:text-amber-400">→</span>
              <span><b>Click any slot</b> to swap weapons, abilities, or armor</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-amber-600 dark:text-amber-400">→</span>
              <span>Open <b>Catalog</b> and "Send to comparator" on any item</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-amber-600 dark:text-amber-400">→</span>
              <span>Try the <b>Optimizer</b> to find the best loadout for a class</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true" className="text-amber-600 dark:text-amber-400">→</span>
              <span>Import your <b>RealmEye</b> inventory in the Inventory tab</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
