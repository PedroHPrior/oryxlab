# OryxLab — One-Shot Implementation Prompt

Paste this prompt into a coding agent (Claude Code, Cursor, etc.) along with the rest of `product-plan/` attached as context.

---

You are implementing **OryxLab**, a DPS calculator and build comparator for *Realm of the Mad God*.

The full UI design and product spec are in this `product-plan/` folder. Read them carefully:

- `product-overview.md` — product description, target users, problems, features
- `instructions/one-shot-instructions.md` — milestone-by-milestone implementation guide
- `design-system/colors.json` and `typography.json` — Tailwind tokens
- `shell/` — `AppShell`, `MainNav`, `ShellActions`, `ScenarioBar` components
- `sections/[name]/` — for each of the 5 sections (Comparator, Build Editor, Catalog, Optimizer, Inventory): a `spec.md`, `data.json`, `types.ts` (in `data-shapes/`), and React components in `components/`
- `sections/[name]/tests.md` — the UI behaviors I'll verify

## Step 1 — Ask me about my stack

Before writing code, ask me:

1. **Framework**: React (with what router? React Router? TanStack Router?), Next.js (app or pages router?), Remix, or another?
2. **Styling**: Tailwind v4 (the design tokens assume v4), or do I need to convert?
3. **Build tool**: Vite, Next, Webpack, etc.
4. **Persistence**: localStorage only (matching v1 spec) or do you have a backend?
5. **Data source**: Will the calculator use sample data, mock data, or do you have a real catalog endpoint?
6. **Calculation engine**: Should you stub the DPS engine using the sample data's `derivedStats`, or implement the formula in `instructions/01-shell.md`?
7. **PWA / offline**: Do I want service-worker caching? (Spec says yes for v1.)
8. **Testing**: Do I have a test framework set up (Vitest, Jest, Playwright)?

## Step 2 — Plan

Once I answer, lay out the milestones in order:

1. Shell + routing
2. Comparator (home)
3. Build Editor
4. Catalog
5. Optimizer
6. Inventory

For each milestone, summarize what files you'll create/modify. Wait for my OK before proceeding.

## Step 3 — Build

Implement milestone-by-milestone. After each milestone, walk me through what works and stop for review. Use the components in `shell/` and `sections/[name]/components/` as starting points — they're props-based and portable. Adjust import paths to fit my project structure.

## Constraints

- Match the visual design exactly (zinc base, amber primary, emerald for positive deltas, rose for negative). Use authentic ROTMG sprites for items if you can find a public sprite sheet; otherwise use the placeholder `<ItemSprite>` provided.
- Keep components props-based; don't hard-wire global stores into leaf components.
- Use `Inter` for UI text and `JetBrains Mono` (with tabular figures) for numbers.
- Dark mode is default; light mode must work via `dark:` variants.
- Fully responsive: desktop dense grids, mobile vertical scroll.
- The `AppShell`'s `ScenarioBar` is global state. The `Comparator` is the home screen.

## Out of scope (don't build)

- User accounts / authentication
- Backend services
- Educational layer / tooltips for new players
- Boss-specific damage simulation
- Localization beyond English

Ask me anything before starting.
