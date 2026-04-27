# Catalog Specification

## Overview
The Catalog is a virtualized browser of every item in OryxLab's database — weapons, abilities, armors, rings, talismans, and Set-Tiered (ST) sets — plus the class roster, exaltation tracks, and seasonal items. Filters narrow the visible items by type, class compatibility, tier, rarity, mechanics tag, and stat thresholds. A "Quick Compare" mode lets the user pick 2–4 items and view them side by side without committing to a build.

## User Flows
- Browse items as cards by default → click a card → opens a detail panel with full stats, drop sources, lore snippet, and a "Compare with…" button
- Apply filters from the left rail: type, class, tier slider, rarity multi-select, tag chips, stat threshold inputs (e.g., ATT ≥ 5)
- Search by name in the header search input → instant filter
- Toggle "Owned only" → catalog narrows to items in the user's Inventory (only available when Inventory is populated)
- Switch between Cards view (default), Compact list (rows), and Sets view (ST sets with their 4 items grouped)
- Multi-select items via checkbox on each card → "Compare selected (n)" button appears → click → opens Quick Compare drawer with selected items side by side
- Inside Quick Compare drawer: see stat-by-stat diff, mechanics tags, and an "Add to comparator" / "Open in editor with class…" CTA per item
- Sort menu: by Name (A–Z), by DPS contribution (estimated), by Tier, by Recently Added
- Reset filters button when at least one filter is active
- Empty state when no item matches: shows the active filters and a "Clear filters" button

## UI Requirements
- Two-pane layout on desktop: left filter rail ≈ 280px (sticky), right content area flexible
- Filter rail sections collapsible: Type, Class, Tier, Rarity, Mechanics, Stats; each with chip-toggle UI; "Clear" affordance per section
- Search input + view-mode segmented control (Cards / List / Sets) + sort dropdown in a sticky sub-header above the grid
- Item card (Cards view): square sprite (96×96), item name (truncate w/ tooltip), tier+rarity badge top-right, key stats in 2 columns (e.g., DMG 100–180, RoF 1.5/s), tag chips (max 2 visible, "+N more" if more), checkbox overlay on hover/multi-select mode
- Compact list row: sprite (32×32), name + tier badge, all key stats inline, tags collapsed
- Sets view: each ST set as a horizontal card with the 4 items inline (weapon → ability → armor → ring) and the set bonus listed below
- Detail panel (slides in from right, 480px desktop / full mobile): large sprite, full stats list, mechanics tags, "drops from" list with dungeon thumbnails, lore snippet, "Compare with…" / "Add to current comparator" / "View in editor with class…" CTAs
- Quick Compare drawer (slides up from bottom on desktop, full sheet on mobile): up to 4 items as columns with stat-by-stat diff (deltas in emerald/rose), close button, share-this-comparison link
- Virtualized scrolling — render only visible cards
- Filter chips apply with a 200ms debounce on slider/numeric inputs
- Active-filter badges shown above the grid (e.g., "Type: Weapon × · Class: Wizard × · Rarity: UT ×") with individual remove and a "Clear all"
- Mobile: filter rail collapses behind a "Filters" sheet button; the search input becomes full-width; cards become a single column
- Keyboard: `/` focuses search, `f` toggles filter sheet on mobile, `c` toggles multi-select mode

## Configuration
- shell: true
