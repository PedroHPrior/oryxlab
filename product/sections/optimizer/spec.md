# Optimizer Specification

## Overview
The Optimizer is a build-search tool. The user picks a class and an objective (Max DPS, Max EHP, Balanced) and the engine returns the top candidate builds — either across the entire item catalog (Best in Slot), only across items the user owns (With My Inventory), or under hard constraints the user defines (With Constraints, e.g., Def ≥ 60, no UTs). Results render as comparator-style columns the user can edit, save, or send to the comparator/editor.

## User Flows
- Land on Optimizer → choose a class → mode tab defaults to BIS → pick objective → click "Run" → results appear
- Switch to "With My Inventory" tab → if Inventory is empty, see a CTA to populate it; if populated, run uses owned items only
- Switch to "With Constraints" tab → add constraints from a chip palette (Def ≥, HP ≥, Spd ≥, no UTs, max 1 ST piece, weapon must be type X, etc.) with numeric inputs → run
- Lock specific slots before running ("must use Crystal Wand"); locked slots are pinned in the result
- Inspect a result candidate: click → expands to show full slot breakdown, why it ranks where it does ("uses Crystal Wand for highest DPS, but is fragile — EHP 1842"), and a swap-suggestion list for each slot
- Send a result to the comparator (adds as a new column) or open in the Build Editor for refinement
- Save a result directly as a Saved Build
- Re-run with adjusted objective without losing context

## UI Requirements
- Top of page: large class picker (16-class tile grid with portraits and names; selected one is amber-bordered)
- Mode tabs: BIS · With My Inventory · With Constraints (segmented control)
- Objective selector: card row with three options (Max DPS / Max EHP / Balanced); Balanced is default; selected card has amber-400 ring
- BIS tab: optional slot locks panel (5 slots, each with a "Lock" toggle and item picker); "Run optimization" CTA button
- Inventory tab: shows owned items count badge ("You own 247 items") and inventory health hints; if no inventory, big CTA "Set up Inventory" linking to /inventory
- Constraints tab: constraint chip palette grouped by category (Stats / Item rules / Slot rules); active constraints listed as removable chips with numeric inputs inline; constraint validation messages (e.g., "No build satisfies these constraints")
- Results panel: ranked list/grid of up to 5 candidates as build columns (same visual language as comparator cards) with rank badge (1, 2, 3…)
- Each candidate: build name (auto-generated, e.g., "DPS-1: Wiz with Crystal Wand"), key derived stat highlighted (DPS for max-DPS objective, EHP for max-EHP, balanced score for Balanced), full slots, locked-pinned indicators
- "Why this build" expandable: 2–3 short bullet explanations
- Swap-suggestions inside each result: "Try Wand of the Bulwark instead of Crystal Wand → DPS −12%, EHP +180" (clickable chips)
- Per-result actions: "Send to comparator" (primary), "Open in editor", "Save build"
- Run button shows a brief loader (200–600ms) and disables while processing
- Empty state before running: hero illustration of a forge/lab + 1-line tagline + "Pick a class and objective to begin"
- Mobile: class picker collapses to a horizontal scroll row; mode tabs stack; results become single-column

## Configuration
- shell: true
