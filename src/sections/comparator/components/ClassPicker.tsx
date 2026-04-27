import { useEffect, useState } from "react"
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
 * those are class-restricted; rings + talismans stay (they're class-agnostic).
 */
export function ClassPicker({ classes, currentClassId, onSelect, onClose }: ClassPickerProps) {
  const [search, setSearch] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const q = search.trim().toLowerCase()
  const filtered = q
    ? classes.filter((c) => c.name.toLowerCase().includes(q))
    : classes

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-4 backdrop-blur sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Choose a class"
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Change class
            </h3>
            <p className="text-xs text-zinc-500">
              Switching class clears Weapon / Ability / Armor — rings + talismans stay.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
          <input
            autoFocus
            type="text"
            placeholder="Search classes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <ul className="grid max-h-[440px] grid-cols-2 gap-2 overflow-y-auto p-3 sm:grid-cols-3">
          {filtered.map((c) => {
            const active = c.id === currentClassId
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-amber-400 bg-amber-400/10 text-amber-700 dark:text-amber-300"
                      : "border-zinc-200 text-zinc-700 hover:border-amber-400/60 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-800/40"
                  }`}
                >
                  <ClassPortrait
                    classId={c.id}
                    name={c.name}
                    imageUrl={(c as PlayerClass & { imageUrl?: string }).imageUrl}
                    color={c.portraitColor}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{c.name}</div>
                    <div className="text-[11px] text-zinc-500">
                      {c.weaponType} · {c.abilityType} · {c.armorType}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
          {filtered.length === 0 && (
            <li className="col-span-full py-6 text-center text-sm text-zinc-500">
              No classes match.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
