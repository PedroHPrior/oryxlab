import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import type { PlayerClass } from "../../../../product/sections/comparator/types"
import { ClassPortrait } from "../../_shared/ClassPortrait"

interface ClassPickerProps {
  classes: PlayerClass[]
  currentClassId: string
  onSelect: (classId: string) => void
  onClose: () => void
}

/**
 * Modal that lets the user reassign a build column to a different class.
 * Selecting a class wipes the build's weapon / ability / armor slots since
 * those are class-restricted; rings stay (class-agnostic).
 *
 * Rendered via portal so the modal always anchors to the viewport — the
 * BuildColumn's `oryx-card-hover` class applies a hover transform which
 * creates a containing block and would otherwise capture `position: fixed`.
 */
export function ClassPicker({ classes, currentClassId, onSelect, onClose }: ClassPickerProps) {
  const [search, setSearch] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [onClose])

  const q = search.trim().toLowerCase()
  const filtered = q
    ? classes.filter((c) => c.name.toLowerCase().includes(q))
    : classes

  const modal = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a class"
        className="oryx-no-scrollbar w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Change class
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Switching clears Weapon · Ability · Armor — rings stay.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="px-5 py-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <SearchIcon />
            </span>
            <input
              autoFocus
              type="text"
              placeholder="Search classes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-9 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="oryx-no-scrollbar max-h-[min(70vh,520px)] overflow-y-auto px-5 pb-5">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((c) => {
              const active = c.id === currentClassId
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-pressed={active}
                    className={`group flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
                      active
                        ? "border-amber-400 bg-amber-400/10 text-amber-700 shadow-sm dark:text-amber-300"
                        : "border-zinc-200/60 text-zinc-700 hover:-translate-y-0.5 hover:border-amber-400/60 hover:bg-amber-400/5 hover:text-zinc-900 hover:shadow-md dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-amber-400/5"
                    }`}
                  >
                    <ClassPortrait
                      classId={c.id}
                      name={c.name}
                      imageUrl={(c as PlayerClass & { imageUrl?: string }).imageUrl}
                      color={c.portraitColor}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold tracking-tight">
                        {c.name}
                      </div>
                      <div className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                        {c.weaponType}
                      </div>
                    </div>
                    {active && (
                      <span aria-hidden="true" className="text-amber-500">
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-zinc-500">
              No classes match.
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === "undefined") return null
  return createPortal(modal, document.body)
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
