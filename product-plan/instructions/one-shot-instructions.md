# OryxLab — One-Shot Implementation Instructions

Build OryxLab in this order. Each milestone is self-contained and testable.

## Milestone 1 — Application Shell

See `instructions/incremental/01-shell.md`.

The shell wraps every screen. Build it first so the section work just slots into the `<Outlet />`. Components: `AppShell`, `MainNav`, `ShellActions`, `ScenarioBar`. Routes: `/`, `/catalog`, `/optimizer`, `/inventory`, `/editor/:buildId?`.

## Milestone 2 — Comparator (home)

See `instructions/incremental/02-comparator.md`.

The Comparator is the landing screen. It shows up to six builds as side-by-side cards with inline slot editing. Includes Focus mode (1v1 with a DPS-vs-defense chart) and Table mode (dense N-way stat table).

## Milestone 3 — Build Editor

See `instructions/incremental/03-build-editor.md`.

A full-screen deep-dive view of a single build. Reached from the Comparator's "Open in Editor" button. Includes exaltations editor, stat-source breakdown, calculation explainability panel, and per-build scenario.

## Milestone 4 — Catalog

See `instructions/incremental/04-catalog.md`.

Filterable browser of every item: weapons, abilities, armors, rings, talismans, ST sets. Includes Quick Compare (multi-select up to 4 items, show side-by-side without committing to a build).

## Milestone 5 — Optimizer

See `instructions/incremental/05-optimizer.md`.

Three modes (BIS, With My Inventory, With Constraints). Pick a class and objective, get ranked candidate builds with explanations and swap suggestions.

## Milestone 6 — Inventory

See `instructions/incremental/06-inventory.md`.

Opt-in screen for marking owned items, with manual selection or RealmEye profile import.

---

## Cross-cutting concerns

- **Persistence**: localStorage only in v1. Save scenario + builds + inventory under namespaced keys (`oryxlab.scenario`, `oryxlab.builds`, `oryxlab.inventory`). Each entry is schema-versioned for forward migration.
- **URL share**: serialize the active comparator state into a compact URL fragment (`?b=...&s=...`). On load, deserialize and apply.
- **PWA**: register a service worker that pre-caches the catalog JSON + app shell on first visit. The app should work fully offline after that.
- **Performance**: catalog has 1000+ items in production. Use virtualization (react-virtual, tanstack/virtual, or react-window) for the cards grid and list view.
- **Calculation engine**: see `data-shapes/comparator.types.ts` for `DerivedStats`. The math itself is described in the OryxLab PRD §6 — implement as `(BuildConfig, Scenario) → DerivedStats` in a pure module.
