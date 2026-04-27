import { useMemo } from "react"
import type {
  InventoryEntry,
  InventoryProps,
} from "../../../product/sections/inventory/types"
import type { ItemType } from "../../../product/sections/comparator/types"
import { ItemSprite } from "../_shared/ItemSprite"
import { TierBadge } from "../_shared/TierBadge"
import { OwnedSummaryCards, RealmEyeImportPanel } from "./components"

const TYPE_LABEL: Record<ItemType, string> = {
  weapon: "Weapons",
  ability: "Abilities",
  armor: "Armors",
  ring: "Rings",
  talisman: "Talismans",
}

export function InventoryView({
  view,
  search,
  ownedSummary,
  ownedEntries,
  realmEyeImport,
  onSearchChange,
  onOpenManualSelect,
  onOpenRealmEyeImport,
  onChangeRealmEyeInput,
  onFetchRealmEyePreview,
  onConfirmRealmEyeOverwrite,
  onConfirmRealmEyeMerge,
  onCloseRealmEyeImport,
  onRemoveEntry,
  onClearAll,
  onExport,
  onImport,
}: InventoryProps) {
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = ownedEntries.filter((e) => (q ? e.name.toLowerCase().includes(q) : true))
    const groups: Record<ItemType, InventoryEntry[]> = {
      weapon: [],
      ability: [],
      armor: [],
      ring: [],
      talisman: [],
    }
    filtered.forEach((e) => groups[e.type].push(e))
    return groups
  }, [ownedEntries, search])

  if (view === "empty") {
    return (
      <div
        className="mx-auto flex max-w-3xl flex-col items-center gap-6 py-10 text-center"
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            Set up your inventory
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Choose how to populate the items you own. Stays in your browser only.
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpenManualSelect}
            className="flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-left hover:border-amber-400/60 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-300">
              ☑
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Mark items I own
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Browse the catalog and tick what's in your vault.
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenRealmEyeImport}
            className="flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-left hover:border-amber-400/60 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/15 text-amber-600 dark:text-amber-300">
              ⤓
            </span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Import from RealmEye
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Pull your vault and characters straight from your public profile.
            </span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-4"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Inventory
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {ownedEntries.length} owned items · used by Optimizer's "with my inventory" mode
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search owned…"
            className="w-56 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={onOpenManualSelect}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:border-amber-400/60 dark:border-zinc-700"
          >
            + Mark items
          </button>
          <button
            type="button"
            onClick={onOpenRealmEyeImport}
            className="rounded-md border border-amber-400/60 bg-amber-400/10 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-400/20 dark:text-amber-300"
          >
            Import RealmEye
          </button>
        </div>
      </header>

      <OwnedSummaryCards summary={ownedSummary} />

      <div className="flex flex-col gap-4">
        {(Object.keys(grouped) as ItemType[]).map((type) => {
          const list = grouped[type]
          if (list.length === 0) return null
          return (
            <section
              key={type}
              className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {TYPE_LABEL[type]}
                </h2>
                <span className="text-[11px] text-zinc-500">{list.length} items</span>
              </header>
              <ul>
                {list.map((entry) => (
                  <li
                    key={entry.itemId}
                    className="flex items-center gap-3 border-b border-zinc-100 px-3 py-2 last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                  >
                    <ItemSprite
                      spriteId={entry.sprite}
                      imageUrl={entry.imageUrl}
                      name={entry.name}
                      itemType={entry.type}
                      rarity={entry.tier === "UT" ? "ut" : entry.tier === "Talisman" ? "talisman" : "tiered"}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {entry.name}
                        </span>
                        <TierBadge
                          tier={entry.tier}
                          rarity={entry.tier === "UT" ? "ut" : entry.tier === "Talisman" ? "talisman" : "tiered"}
                          size="xs"
                        />
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        added {new Date(entry.addedAt).toLocaleDateString("en-US")}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveEntry?.(entry.itemId)}
                      aria-label="Remove from inventory"
                      className="rounded-md p-1 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-zinc-500">Bulk actions</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onExport} className="rounded-md border border-zinc-200 px-2.5 py-1 hover:border-amber-400/60 dark:border-zinc-700">
            Export JSON
          </button>
          <button type="button" onClick={onImport} className="rounded-md border border-zinc-200 px-2.5 py-1 hover:border-amber-400/60 dark:border-zinc-700">
            Import JSON
          </button>
          <button type="button" onClick={onClearAll} className="rounded-md border border-rose-400/40 px-2.5 py-1 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400">
            Remove all
          </button>
        </div>
      </footer>

      <RealmEyeImportPanel
        state={realmEyeImport}
        onChangeInput={onChangeRealmEyeInput}
        onFetch={onFetchRealmEyePreview}
        onConfirmOverwrite={onConfirmRealmEyeOverwrite}
        onConfirmMerge={onConfirmRealmEyeMerge}
        onClose={onCloseRealmEyeImport}
      />
    </div>
  )
}
