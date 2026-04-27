import type {
  CatalogFilters,
} from "../../../../product/sections/catalog/types"
import type {
  ItemType,
  Rarity,
} from "../../../../product/sections/comparator/types"

interface FilterRailProps {
  filters: CatalogFilters
  tagPalette: string[]
  classOptions: { id: string; name: string }[]
  onChange?: (filters: CatalogFilters) => void
  onClear?: () => void
}

const TYPE_OPTIONS: { id: ItemType; label: string }[] = [
  { id: "weapon", label: "Weapon" },
  { id: "ability", label: "Ability" },
  { id: "armor", label: "Armor" },
  { id: "ring", label: "Ring" },
  { id: "talisman", label: "Talisman" },
]

const RARITY_OPTIONS: { id: Rarity; label: string }[] = [
  { id: "tiered", label: "Tiered" },
  { id: "ut", label: "UT" },
  { id: "st", label: "ST" },
  { id: "talisman", label: "Talisman" },
]

export function FilterRail({
  filters,
  tagPalette,
  classOptions,
  onChange,
  onClear,
}: FilterRailProps) {
  const toggle = <K extends keyof CatalogFilters>(
    key: K,
    value: CatalogFilters[K] extends Array<infer U> ? U : never,
  ) => {
    const arr = filters[key] as unknown as Array<unknown>
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value]
    onChange?.({ ...filters, [key]: next } as CatalogFilters)
  }

  return (
    <aside
      className="hidden lg:block lg:w-[280px] lg:shrink-0"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <div className="sticky top-32 flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <header className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Filters
          </h2>
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Clear
          </button>
        </header>

        <Section title="Type">
          <div className="flex flex-wrap gap-1">
            {TYPE_OPTIONS.map((t) => (
              <Chip
                key={t.id}
                label={t.label}
                active={filters.types.includes(t.id)}
                onClick={() => toggle("types", t.id)}
              />
            ))}
          </div>
        </Section>

        <Section title="Class">
          <div className="flex flex-wrap gap-1">
            {classOptions.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                active={filters.classes.includes(c.id)}
                onClick={() => toggle("classes", c.id)}
              />
            ))}
          </div>
        </Section>

        <Section title="Tier range">
          <div className="flex items-center gap-2 text-xs">
            <input
              type="number"
              min={0}
              max={14}
              value={filters.tierMin}
              onChange={(e) => onChange?.({ ...filters, tierMin: Number(e.target.value) })}
              className="w-14 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-right dark:border-zinc-700 dark:bg-zinc-950"
              style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
            />
            <span className="text-zinc-500">to</span>
            <input
              type="number"
              min={0}
              max={14}
              value={filters.tierMax}
              onChange={(e) => onChange?.({ ...filters, tierMax: Number(e.target.value) })}
              className="w-14 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-right dark:border-zinc-700 dark:bg-zinc-950"
              style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
            />
          </div>
        </Section>

        <Section title="Rarity">
          <div className="flex flex-wrap gap-1">
            {RARITY_OPTIONS.map((r) => (
              <Chip
                key={r.id}
                label={r.label}
                active={filters.rarities.includes(r.id)}
                onClick={() => toggle("rarities", r.id)}
              />
            ))}
          </div>
        </Section>

        <Section title="Mechanics">
          <div className="flex flex-wrap gap-1">
            {tagPalette.slice(0, 12).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                active={filters.mechanicsTags.includes(tag)}
                onClick={() => toggle("mechanicsTags", tag)}
              />
            ))}
          </div>
        </Section>
      </div>
    </aside>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
        active
          ? "border-amber-400/60 bg-amber-400/10 text-amber-700 dark:text-amber-300"
          : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}
