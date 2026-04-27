# Milestone 4 — Catalog

## Goal

Browsable, filterable, virtualized catalog of every item in OryxLab. Three views (Cards, List, Sets) and a Quick Compare drawer.

## Files in this package

- `sections/catalog/CatalogView.tsx`
- `sections/catalog/components/FilterRail.tsx` — sticky left filter rail
- `sections/catalog/components/ItemCard.tsx` — square card with sprite + key stats
- `sections/catalog/data.json` — sample items (~ 15 entries, including ST sets, Talismans, items with `owned: true`)
- `data-shapes/catalog.types.ts` — `CatalogItem`, `CatalogFilters`, `QuickCompareState`, `CatalogProps`

## Steps

1. Render the filter rail as `<aside>` with sticky positioning, sized 280px on desktop.
2. Filtering is client-side (in-memory). Apply: type, class, tier range, rarity, mechanics tags, owned-only, search.
3. Sorting: by name (asc/desc), tier (asc/desc), and ideally DPS contribution (compute from sample stats).
4. Multi-select (checkbox on hover) drives Quick Compare. When at least one is selected, show a floating "Compare selected (n) →" pill.
5. Sets view shows ST sets as horizontal cards with all 4 items inline.
6. List view is a dense row layout — sprite (32px), name, stats inline, "Compare" button on the right.
7. Use a virtualization library if your real catalog has 1000+ items. The sample is small.

## Tests

- All filters update results within 200ms.
- "Owned only" requires Inventory to be populated; the toggle is disabled if not.
- Quick Compare drawer slides up from the bottom (desktop) / full-sheet (mobile).
- View-mode switch preserves the current filters.
- Empty state shows when no items match, with a "Clear filters" link.
