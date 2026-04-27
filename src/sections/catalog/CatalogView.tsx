import { useMemo } from "react"
import type {
  CatalogProps,
  CatalogViewMode,
} from "../../../product/sections/catalog/types"
import { ItemCard, FilterRail } from "./components"
import { ItemSprite } from "../_shared/ItemSprite"
import { TierBadge } from "../_shared/TierBadge"

const VIEW_MODES: { id: CatalogViewMode; label: string }[] = [
  { id: "cards", label: "Cards" },
  { id: "list", label: "List" },
  { id: "sets", label: "Sets" },
]

export function CatalogView({
  viewMode,
  ownedOnly,
  search,
  sort,
  filters,
  items,
  itemSets,
  tagPalette,
  quickCompare,
  onViewModeChange,
  onToggleOwnedOnly,
  onSearchChange,
  onSortChange,
  onFiltersChange,
  onClearFilters,
  onToggleQuickCompareItem,
  onOpenQuickCompare,
  onCloseQuickCompare,
  onOpenItemDetail,
  onAddItemToComparator,
}: CatalogProps) {
  const classOptions = useMemo(() => {
    const set = new Set<string>()
    items.forEach((i) => i.classes.forEach((c) => set.add(c)))
    return Array.from(set).map((id) => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1) }))
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      if (ownedOnly && !i.owned) return false
      if (filters.types.length > 0 && !filters.types.includes(i.type)) return false
      if (filters.classes.length > 0 && !i.classes.some((c) => filters.classes.includes(c))) return false
      if (filters.rarities.length > 0 && !filters.rarities.includes(i.rarity)) return false
      if (filters.tierMin && i.tierNumeric < filters.tierMin && i.rarity === "tiered") return false
      if (filters.tierMax && i.tierNumeric > filters.tierMax && i.rarity === "tiered") return false
      if (filters.mechanicsTags.length > 0 && !i.tags.some((t) => filters.mechanicsTags.includes(t))) return false
      if (q && !i.name.toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name)
      if (sort === "name-desc") return b.name.localeCompare(a.name)
      if (sort === "tier-desc") return b.tierNumeric - a.tierNumeric
      if (sort === "tier-asc") return a.tierNumeric - b.tierNumeric
      return 0
    })
  }, [items, search, sort, filters, ownedOnly])

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  return (
    <div
      className="flex flex-col gap-4"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Catalog
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {filtered.length} of {items.length} items
            {ownedOnly && " · Owned only"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search items…"
            className="w-56 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={onToggleOwnedOnly}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              ownedOnly
                ? "border-amber-400/60 bg-amber-400/10 text-amber-700 dark:text-amber-300"
                : "border-zinc-300 text-zinc-700 hover:border-amber-400/40 dark:border-zinc-700 dark:text-zinc-300"
            }`}
          >
            Owned only
          </button>
          <select
            value={sort}
            onChange={(e) => onSortChange?.(e.target.value as typeof sort)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm focus:border-amber-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="tier-desc">Tier ↓</option>
            <option value="tier-asc">Tier ↑</option>
          </select>
          <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
            {VIEW_MODES.map((m) => {
              const active = m.id === viewMode
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onViewModeChange?.(m.id)}
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
        </div>
      </header>

      <div className="flex gap-4">
        <FilterRail
          filters={filters}
          tagPalette={tagPalette}
          classOptions={classOptions}
          items={items}
          onChange={onFiltersChange}
          onClear={onClearFilters}
        />

        <div className="min-w-0 flex-1">
          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
              <div className="text-3xl">🔎</div>
              <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                No items match these filters
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Try removing a filter or broadening the tier range.
              </p>
              <button
                type="button"
                onClick={onClearFilters}
                className="mt-4 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                Clear all filters
              </button>
            </div>
          )}
          {filtered.length > 0 && viewMode === "cards" && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {filtered.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  selected={quickCompare.selectedIds.includes(item.id)}
                  selectable
                  onToggleSelect={() => onToggleQuickCompareItem?.(item.id)}
                  onOpenDetail={() => onOpenItemDetail?.(item.id)}
                />
              ))}
            </div>
          )}

          {filtered.length > 0 && viewMode === "list" && (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <ul>
                {filtered.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 border-b border-zinc-100 px-3 py-2 last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                  >
                    <ItemSprite spriteId={item.sprite} imageUrl={item.imageUrl} name={item.name} itemType={item.type} weaponType={item.weaponType} abilityType={item.abilityType} rarity={item.rarity} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </span>
                        <TierBadge tier={item.tier} rarity={item.rarity} size="xs" />
                        {item.owned && (
                          <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                            Owned
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1 text-[10px] text-zinc-500">
                        {item.tags.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddItemToComparator?.(item.id)}
                      className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100"
                    >
                      Compare
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {viewMode === "sets" && (
            <div className="flex flex-col gap-3">
              {itemSets.map((set) => (
                <article
                  key={set.id}
                  className="rounded-xl border border-rose-400/30 bg-white p-4 dark:border-rose-400/30 dark:bg-zinc-900"
                >
                  <header className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {set.name}
                      </h3>
                      <p className="text-xs text-zinc-500">{set.classId} · ST set</p>
                    </div>
                    <span className="rounded-full bg-rose-400/10 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                      ST
                    </span>
                  </header>
                  <div className="flex flex-wrap items-center gap-3">
                    {set.items.map((id) => {
                      const item = itemMap.get(id)
                      if (!item) return null
                      return (
                        <div key={id} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-2 py-1.5 dark:border-zinc-800">
                          <ItemSprite spriteId={item.sprite} imageUrl={item.imageUrl} name={item.name} itemType={item.type} weaponType={item.weaponType} abilityType={item.abilityType} rarity={item.rarity} size="sm" />
                          <div>
                            <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-zinc-500">{item.tier}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <p className="mt-3 rounded-md bg-rose-400/5 p-2 text-xs text-rose-700 dark:text-rose-300">
                    Set bonus: {set.setBonus}
                  </p>
                </article>
              ))}
            </div>
          )}

          {/* The richer empty state for cards/list views is rendered earlier
              in this column. The "sets" view doesn't render an empty state
              because the set list isn't filter-gated. */}
        </div>
      </div>

      {quickCompare.selectedIds.length > 0 && !quickCompare.open && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full border border-amber-400/60 bg-zinc-950 px-4 py-2 text-sm text-amber-300 shadow-2xl">
          <button
            type="button"
            onClick={onOpenQuickCompare}
            className="flex items-center gap-2 font-medium"
          >
            Compare selected ({quickCompare.selectedIds.length}) →
          </button>
        </div>
      )}

      {/* The actual quick-compare panel is rendered by CatalogRoute so it can
          access live class/scenario data and run the engine for each candidate.
          We only render the floating "Compare selected" tab here. */}
    </div>
  )
}
