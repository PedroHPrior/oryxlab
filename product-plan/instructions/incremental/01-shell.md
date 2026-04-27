# Milestone 1 — Application Shell

## Goal

Build the persistent chrome that wraps every screen of OryxLab.

## Files in this package

- `shell/AppShell.tsx` — top-level wrapper (header + scenario bar + content + footer)
- `shell/MainNav.tsx` — horizontal nav (4 items + mobile vertical fallback)
- `shell/ShellActions.tsx` — Scenario chip + Saved Builds button + Share + Settings dropdown
- `shell/ScenarioBar.tsx` — global collapsible Scenario panel (preset selector, def slider, status/buff chips)
- `shell/index.ts` — barrel exports

## Routes to set up

| Path | Component | Purpose |
|---|---|---|
| `/` | `<AppShell><ComparatorView/></AppShell>` | Home = Comparator |
| `/catalog` | `<AppShell><CatalogView/></AppShell>` | Catalog |
| `/optimizer` | `<AppShell><OptimizerView/></AppShell>` | Optimizer |
| `/inventory` | `<AppShell><InventoryView/></AppShell>` | Inventory |
| `/editor` | `<AppShell><BuildEditorView/></AppShell>` | New build |
| `/editor/:buildId` | `<AppShell><BuildEditorView/></AppShell>` | Edit existing |

## Steps

1. **Install fonts** — add Google Fonts links for `Inter` (400/500/600/700) and `JetBrains Mono` (400/500/600) in your `index.html` or root layout.
2. **Apply Tailwind tokens** — `colors.json` says `primary: amber, secondary: emerald, neutral: zinc`. Use these as the canonical accents.
3. **Drop in the shell components** — adjust import paths. They have no external dependencies beyond React.
4. **Wire shell-level state** — `Scenario`, `savedBuildsCount`, `catalogVersion`. Persist scenario to localStorage under `oryxlab.scenario`.
5. **Wire `onShare`** to copy the current URL (with comparator state appended) to clipboard.
6. **Wire `onToggleTheme`** to toggle `class="dark"` on `<html>`. Persist under `oryxlab.theme`.
7. **Wire `onToggleCompactMode`** to toggle a `class="compact"` on `<html>`. (Compact-mode CSS is your call.)
8. **Saved Builds drawer** — the header has a button. Implement a slide-over panel at `right-0` with the snapshots from localStorage.

## Tests

- Header is sticky on scroll.
- Scenario bar collapses/expands; the chip in the actions cluster reflects the current state.
- Mobile (< 640px): nav becomes a hamburger that opens vertically.
- Settings dropdown closes on click-outside.
- Theme toggle flips the entire app between dark and light.
- Catalog version pill in the footer is monospaced.

## Out of scope

- Authentication / user menu (no accounts in v1)
- Catalog scraping / data fetching (catalog is a static JSON the app reads)
