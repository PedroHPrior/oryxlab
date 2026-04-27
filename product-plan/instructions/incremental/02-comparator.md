# Milestone 2 — Comparator (home)

## Goal

The Comparator IS the home screen. Up to six builds side-by-side as cards, with inline slot editing. Two alternate views: Focus (1v1 + DPS-vs-defense graph) and Table (dense N-way).

## Files in this package

- `sections/comparator/ComparatorView.tsx` — top-level
- `sections/comparator/components/BuildColumn.tsx` — single build card with editable slots and stats
- `sections/comparator/components/SlotPicker.tsx` — modal item picker (compatible items only)
- `sections/comparator/components/EmptyState.tsx` — landing CTAs
- `sections/comparator/components/ViewModeToggle.tsx` — Cards / Focus / Table
- `sections/comparator/components/FocusView.tsx` — 2-build focus layout with chart and stat-by-stat diff
- `sections/comparator/components/TableView.tsx` — dense table with best-value highlighting
- `sections/comparator/components/DpsCurveChart.tsx` — SVG line chart, multiple curves overlaid
- `sections/comparator/data.json` — sample builds, classes, items, presets
- `data-shapes/comparator.types.ts` — `Build`, `BuildSlots`, `Item`, `Scenario`, `ComparatorProps`, etc.

## Steps

1. Read `sections/comparator/spec.md` end-to-end.
2. Wire `<ComparatorView>` to your data source. Sample data has 4 builds; in production this comes from URL state and/or localStorage.
3. The Comparator owns the local state for "which builds are in the grid". The global Scenario lives in the shell; the Comparator reads it via prop or context.
4. `BuildColumn` is the centerpiece — review it carefully. It includes:
   - editable name (click → input)
   - 5 editable slots → `SlotPicker` modal
   - per-build "Custom Scenario" toggle
   - kebab menu (Open in Editor, Duplicate, Save, Remove)
   - delta indicators against the leftmost build
5. Wire `onOpenInEditor(buildId)` to navigate to `/editor/:buildId`.
6. Wire `onShare` to copy the URL with serialized comparator state.

## DPS calculation

Use `derivedStats` from sample data initially. Replace with a real engine in `lib/engine/dps.ts` later. See OryxLab PRD §6 for formulas.

## Tests

- Empty state shows three preset CTAs and an "Add build" button.
- Adding a build appends a column, capped at 6.
- Switching slots updates DPS and the deltas in other columns immediately.
- Reorder by moving the leftmost build resets all deltas.
- Focus view requires ≥ 2 builds; below that it shows a friendly placeholder.
- Table view shows best value per row in emerald.
- Mobile: cards stack vertically, swipe between them.
