# Milestone 5 — Optimizer

## Goal

Three-mode build search. User picks a class + objective, gets ranked candidate builds with explanations and swap suggestions.

## Files in this package

- `sections/optimizer/OptimizerView.tsx`
- `sections/optimizer/components/ClassPicker.tsx` — 16-class portrait grid
- `sections/optimizer/components/ResultCard.tsx` — ranked build card with slots, deltas, explanations
- `sections/optimizer/components/ConstraintsPanel.tsx` — chip palette + active constraints with editable values
- `sections/optimizer/data.json` — sample request, classes, objectives, palette, results
- `data-shapes/optimizer.types.ts` — `OptimizationRequest`, `OptimizationResult`, `Constraint`, `OptimizerProps`

## Modes

- **BIS**: search the entire catalog
- **With My Inventory**: only items with `owned: true` in inventory
- **With Constraints**: hard constraints (Def ≥, HP ≥, max UTs, etc.)

## Steps

1. Class picker is a tile grid; selected one gets an amber border and amber-tinted background.
2. Mode tabs are a segmented control above the objective selector.
3. Objective selector is three full-width cards (Max DPS / Max EHP / Balanced). Selected one gets an amber ring.
4. Constraint palette (constraints mode only) shows chip buttons that add a typed input chip when clicked.
5. "Run optimization" button shows a 200–600ms loader (use `isRunning` flag), then renders results.
6. Results are 1–5 ranked cards. Each:
   - Rank badge (1, 2, 3…)
   - Build name
   - Score number
   - Stats grid (DPS, EHP, Def, HP, ATT, DEX, WIS)
   - Slot list (with "Locked" badge if constrained)
   - "Why this build" expandable explanations
   - Swap suggestion chips (clicking applies the swap)
   - Action buttons (Send to comparator / Editor / Save)

## Tests

- Inventory mode shows a CTA if inventory is empty, otherwise a count badge.
- Constraints mode validates: if no build can satisfy the constraints, show an inline message.
- Each result's swap suggestions are clickable and reflect the projected delta.
- "Send to comparator" navigates to `/` with the result loaded as a new column.
