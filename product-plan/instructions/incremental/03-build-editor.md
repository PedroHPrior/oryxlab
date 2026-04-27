# Milestone 3 — Build Editor

## Goal

Full-screen deep-dive view of one build. Reached from any Comparator column's "Open in Editor" button.

## Files in this package

- `sections/build-editor/BuildEditorView.tsx`
- `sections/build-editor/components/ExaltationsPanel.tsx` — 8 stat steppers with progress bars
- `sections/build-editor/components/StatBreakdownBars.tsx` — stacked bars showing base/items/exalts/buffs
- `sections/build-editor/components/CalculationSteps.tsx` — explainable per-shot math
- `sections/build-editor/data.json` — full sample build with breakdowns and steps
- `data-shapes/build-editor.types.ts` — extends comparator types with `BuildEditorBuild`, `StatBreakdown`, etc.

## Layout

Three panes on desktop:

- **Left** (~ 320px): equipped slots + exaltations + notes
- **Center**: large DPS, all stats grid, stat-source breakdown bars, calculation steps, scenario panel
- **Right** (~ 360px): DPS-vs-defense chart, swap suggestions

Tablet collapses right pane into tabs. Mobile uses a tab bar.

## Steps

1. Wire route `/editor/:buildId` → load that build from comparator state. If `:buildId` is absent, render the editor with a starter build.
2. Pull alternative items per slot for the slot-picker hover diff (sample data has these).
3. The "Show calculation" expandable section is the theorycrafter sweet spot — make sure each row is monospaced and clearly readable.
4. Per-build scenario: when "Custom" is off, the controls are disabled and read from global; when on, the build has its own scenario.
5. Save / Save as new / Discard buttons all act on local component state until committed.
6. Keyboard shortcuts overlay (`?` opens it).

## Tests

- Slot click opens picker; selecting an item updates DPS within 50ms.
- Exaltations stepper enforces 0–5 range.
- "Custom scenario" toggle disables/enables scenario controls.
- DPS-vs-defense chart highlights the current scenario def with a vertical line and label.
- ⌘/Ctrl+S triggers Save.
- Esc closes any open drawer or modal.
