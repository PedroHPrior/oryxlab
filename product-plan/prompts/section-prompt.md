# OryxLab — Section Implementation Prompt (template)

Use this prompt to implement **one section at a time**. Replace `[SECTION]` with one of: `comparator`, `build-editor`, `catalog`, `optimizer`, `inventory`.

---

You are implementing the **[SECTION]** section of OryxLab, a DPS calculator and build comparator for *Realm of the Mad God*.

Context files (attach all of these):

- `product-plan/product-overview.md`
- `product-plan/sections/[SECTION]/spec.md` — what this section does
- `product-plan/sections/[SECTION]/data.json` — sample data with `_meta` describing entities
- `product-plan/data-shapes/[SECTION].types.ts` — TypeScript interfaces and Props type
- `product-plan/sections/[SECTION]/components/` — starter React components
- `product-plan/sections/_shared/` — `ItemSprite`, `ClassPortrait`, `Stat`, `TierBadge` shared primitives
- `product-plan/shell/` — the `AppShell` your section will render inside
- `product-plan/design-system/colors.json` and `typography.json`
- `product-plan/sections/[SECTION]/tests.md` — the UI behaviors I'll verify after

## Step 1 — Ask me

Before writing code:

1. Have I already implemented the **shell** (`AppShell`, `MainNav`, `ShellActions`, `ScenarioBar`)? If not, do that first.
2. What's my router setup? (React Router, TanStack, Next.js app, etc.)
3. What's my data source for `[SECTION]`? Sample data from `data.json`, or real?
4. Where does the section's state live? (Local component state, context, a store like Zustand?)

## Step 2 — Build

Use the components in `sections/[SECTION]/components/` as the starting point. They're already props-based and accept the types from `data-shapes/[SECTION].types.ts`. Wire them into your routing and connect them to your data layer.

Key interactions to preserve:

- All numeric values use tabular figures (Inter with `font-feature-settings: "tnum"` or JetBrains Mono).
- Color semantics: amber-400 for primary CTAs and active nav, emerald-400 for positive deltas, rose-500 for negative deltas, zinc neutrals everywhere else.
- Dark mode default; ensure every color has a `dark:` variant.
- Responsive: section's spec calls out mobile/tablet/desktop layouts — implement all three.

## Step 3 — Verify

Walk through `tests.md` and confirm each behavior works.

## Out of scope

Per the v1 spec, do NOT build:

- User accounts / login flows
- Educational tooltips / new-player guides
- Boss-specific damage simulation
- Localization beyond English
