# Comparator Specification

## Overview
The Comparator is the home screen and heart of OryxLab. It shows up to six builds (or raw items) side-by-side as cards, lets the user edit each slot inline, and surfaces the DPS/EHP/stat deltas vs the leftmost reference build. A Focus mode collapses the grid to two builds with a richer 1v1 view including a DPS-vs-defense graph; a Table mode swaps the cards for a dense N-way stat table.

## User Flows
- Land on empty state → choose "Compare two of my drops", "Best in slot for class", or "+ Add build" / "+ Add item" → first column populates → user adds more
- Click any equipped slot in a column → item picker opens (filtered to compatible items for the column's class) → user selects → DPS recalculates immediately and deltas refresh
- Toggle a build's Custom Scenario → per-build scenario controls reveal → that column ignores the global Scenario bar
- Switch between Cards view (default), Focus mode (pick 2 builds), and Table view (dense N-way) via segmented control
- Click "Open in Editor" on any column → routes to /editor/:buildId for full-screen deep dive
- Save a build → name + tags prompt → stored to localStorage → appears in Saved Builds drawer
- Share comparator → URL with all build configs + scenario serialized → copied to clipboard
- Duplicate a column to fork a variant; remove a column to free a slot
- Reorder columns by drag handle (leftmost is the reference for delta math)

## UI Requirements
- Empty state: centered hero with three preset CTAs and a secondary "+ Add build" affordance
- Build column card (≈ 280–320px wide on desktop): class portrait, build name (editable inline), 5 slot rows (Weapon / Ability / Armor / Ring / Talisman) with sprite thumbnails, derived stats block (DPS, EHP, ATT, DEX, SPD, VIT, WIS, DEF, HP, MP), per-build scenario chip, kebab menu (Open in Editor / Duplicate / Save / Remove)
- Delta indicators: leftmost column shows raw values; other columns show value + colored delta (emerald-400 for upgrade, rose-500 for downgrade) — tabular figures, monospaced
- Slot picker popover: searchable list of compatible items with sprite, name, key stats; preview hover shows full item card
- Focus mode: 2 columns max, each takes 50% width, plus a shared DPS-vs-defense line chart and a stat-by-stat bar diff
- Table view: rows = metrics (DPS, DPS/0def, DPS/30def, DPS/50def, DPS/80def, EHP, raw stats…), columns = builds; hover a cell to see breakdown
- Per-column "Custom Scenario" reveals an inline mini-Scenario panel (def slider, status chips, buff chips) inside the card
- Drag-to-reorder columns with a clear handle; keyboard accessible (move-left / move-right buttons)
- Empty slots ("no weapon yet") show a dashed "+ Add weapon" placeholder
- Mobile: cards stack vertically, swipe between them; Table view becomes a horizontally scrollable area; Focus mode tabs A/B
- All interactions update derived stats in under 50ms and animate number changes (150ms ease-out)

## Configuration
- shell: true
