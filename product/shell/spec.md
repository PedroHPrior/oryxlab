# Application Shell Specification

## Overview

The OryxLab shell is the persistent chrome that wraps every section of the product. It exists to (a) keep the user oriented across the four top-level destinations, (b) surface the **global Scenario** that drives every DPS calculation in the app, and (c) give one-click access to **Saved Builds** without dedicating a top-nav slot to it. The shell is dark-default, sprite-friendly, and dense — it disappears once the user is working, but stays one click away when they need to navigate or change context.

## Layout Pattern

**Top navigation (horizontal header)** — chosen over a sidebar because:

- The Comparator (home) and the Build Editor benefit from full-width screen real estate (N-way grids, side-by-side panels, DPS-vs-defense graphs).
- Only four top-level destinations — too few to justify a permanent sidebar.
- Sets a "tool" tone (think RealmEye, Mobalytics) rather than an admin-panel tone.

The shell has three stacked rows:

1. **Header bar** — logo (left) + nav (center-left) + actions (right). 56px tall on desktop, 52px on mobile.
2. **Scenario bar** — collapsible. Shows the active scenario summary chip when collapsed; expands into the full scenario controls when toggled. Default state: collapsed on Catalog/Inventory, expanded on Comparator/Optimizer/Build Editor.
3. **Content area** — the section's screen renders here, full-width.

## Navigation Structure

Four destinations in the top nav:

- **Comparator** → `/` (Home, default)
- **Catalog** → `/catalog`
- **Optimizer** → `/optimizer`
- **Inventory** → `/inventory`

The **Build Editor** is intentionally not in the top nav — it is a destination reached by clicking "Open in Editor" from any column inside the Comparator. Its route is `/editor/:buildId` (or `/editor` for a fresh build), and the shell's nav highlights "Comparator" while the user is in the editor (since editing is a sub-flow of comparison).

**Saved Builds** is also not in the top nav — it is a slide-over drawer triggered by the bookmark button in the right-hand actions cluster.

## Right-hand Actions

Replaces the conventional User Menu (no accounts in v1).

- **Scenario summary chip** — compact, clickable. Reads e.g. "Def 50 · Pal+Bard · Armor Broken". Clicking expands the Scenario bar.
- **Saved Builds button** (bookmark icon) — opens the Saved Builds drawer.
- **Share button** (link icon) — copies a URL-encoded link to the current comparator state to the clipboard. Disabled when nothing is comparable.
- **Settings menu** (gear icon dropdown) — Theme toggle (Dark/Light), Compact mode toggle, "Export data" (download JSON of all localStorage), "Import data", catalog data version indicator, link to the GitHub repo.

No avatar, no logout, no profile — the v1 product has no accounts.

## Scenario Bar

A persistent, collapsible bar directly under the header. When expanded:

- **Preset selector** (dropdown): "Solo no def", "Party O3 (Pal+Bard)", "Sanctuary endgame", "Custom"
- **Target defense** — slider 0–80 plus numeric input
- **Status effects on target** — toggle chips: Armor Broken, Bleeding, Exposed, Cursed
- **Party buffs on caster** — toggle chips: Paladin Seal, Warrior Helm, Mystic Curse, Bard Inspire, Bard Crescendo, Bard Encore
- **Self consumables** (informational chips): DEX pot, ATT pot

When collapsed, only the summary chip in the header actions cluster is visible. Per-build overrides are surfaced inside each Comparator column / the Build Editor — the Scenario bar always represents the global default.

## Saved Builds Drawer

A right-side slide-over (480px wide on desktop, full-width on mobile) triggered by the bookmark button.

- List of saved builds: name, class portrait, key DPS number, last-modified date, tags
- Per-row actions: Load (replaces a comparator slot), Copy share link, Edit name/tags, Delete
- Top of drawer: search by name/tag, filter by class
- Bottom of drawer: "Export all" / "Import" buttons

## Responsive Behavior

- **Desktop (≥ 1280px)** — Full header with logo + 4 text nav items + actions cluster. Scenario bar shows all controls inline.
- **Tablet (640px–1279px)** — Logo + 4 icon-only nav items (label appears on hover/long-press) + actions cluster. Scenario bar wraps controls onto two rows when needed.
- **Mobile (< 640px)** — Logo (text only) + hamburger button (right) that opens a slide-over with the 4 nav items + actions. Scenario bar collapses to chip-only by default; expanding opens a bottom sheet with all controls.

The shell never produces horizontal scroll. Long titles in the Saved Builds drawer truncate with ellipsis.

## Design Notes

- **Colors:** zinc neutrals (zinc-950 background, zinc-900 surface, zinc-800 borders, zinc-100 primary text, zinc-400 secondary text). Amber-400 for active nav indicator and primary CTAs. Emerald-400 reserved for stat-context inside section content (deltas, "upgrade" badges) — not used in the shell itself to keep the chrome calm.
- **Typography:** Inter for all UI text. Tabular figures for the scenario summary chip's defense number and any other numeric bits in the shell.
- **Iconography:** lucide-react for shell icons (Bookmark, Share2, Settings, Menu, ChevronDown). Item sprites never appear in the shell — they live in section content.
- **Active state:** Active nav item gets a 2px amber-400 underline + amber-200 text in dark mode (amber-700 in light mode). Inactive items are zinc-400 with hover:text-zinc-100.
- **Density:** Default density. Compact mode (toggled in Settings) reduces header to 48px and tightens the scenario bar.
- **Dark/Light:** Dark default. Light mode supported via `dark:` variants — every color has an explicit light-mode pair.
