# Plan A — UX Quick Wins

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Land two UX changes that materially improve first-time user experience: empty-by-default new builds and a "simple mode" that hides power-user knobs.

**Architecture:** No engine changes. State additions in `useOryxLab` reducer (one new field for `uiMode`), persisted via existing v2 localStorage migration. Conditional rendering in `ScenarioBar`, `BuildEditorView`, `BuildColumn` driven by the new state.

**Tech Stack:** React 19, TypeScript strict, Tailwind v4, existing storage.ts schema.

**Closes:** [#15](https://github.com/PedroHPrior/oryxlab/issues/15), [#16](https://github.com/PedroHPrior/oryxlab/issues/16)

---

## Investigation findings

### #16 — current behavior of `addBuild`

`src/app/OryxLabApp.tsx:277-287` — when user clicks "+ Add build":

```ts
addBuild: () =>
  setBuilds((curr) => [
    ...curr,
    {
      ...STARTER_BUILDS[0],     // ← spreads "Wiz BIS Glass" preset entirely
      id: `build-new-${Date.now()}`,
      name: "New build",
      color: pickBuildColor(curr),
      tags: [],
    },
  ]),
```

`STARTER_BUILDS[0]` is the seeded "Wiz BIS Glass" build (Wizard, Crystal Wand + Ring of Unbound Health, exalts att=5/dex=5/wis=5). The new column inherits all of that. The user sees a fully-built Wizard column when they expected a blank slate.

### #15 — power-user knobs in the current UI

Surveyed `src/shell/components/ScenarioBar.tsx:31-45` and `src/sections/comparator/components/BuildColumn.tsx`:

- ScenarioBar exposes: scenario preset dropdown, target def slider, 4 status checkboxes (armorBroken/bleeding/exposed/cursed), 6 party-buff toggles
- BuildEditor / BuildColumn exposes: per-build scenario override toggle, exaltation block (8 stat sliders), tags, notes

Simple mode should default to: Solo @ def 0, no statuses, no buffs, all exalts at max. Build editor still exposes class/items but hides exaltation sliders + scenario override.

---

## Task 1: Empty-by-default new builds

**Files:**
- Modify: `src/app/OryxLabApp.tsx:277-287`
- Test: `tests/components/OryxLabApp.test.tsx` (create if missing) OR add to nearest existing test

**Step 1: Find or create the right test file**

Run: `find tests -name "*OryxLab*" -o -name "*addBuild*"`

If no match, create `tests/app/addBuild.test.ts`. If a match exists, append to it.

**Step 2: Write the failing test**

```ts
import { describe, it, expect } from "vitest"
import type { Build } from "../../product/sections/comparator/types"

// Pure function we'll extract from the addBuild action so it's testable.
import { makeEmptyBuild } from "../../src/app/buildFactory"

describe("makeEmptyBuild", () => {
  it("returns a build with no items in any slot", () => {
    const b = makeEmptyBuild({ classId: "wizard", color: "violet" })
    expect(b.slots.weapon).toBeNull()
    expect(b.slots.ability).toBeNull()
    expect(b.slots.armor).toBeNull()
    expect(b.slots.ring).toBeNull()
  })

  it("returns a build with all exaltations at zero", () => {
    const b = makeEmptyBuild({ classId: "wizard", color: "violet" })
    for (const stat of ["att", "dex", "wis", "vit", "spd", "def", "hp", "mp"] as const) {
      expect(b.exaltations[stat]).toBe(0)
    }
  })

  it("uses the provided classId and color", () => {
    const b = makeEmptyBuild({ classId: "knight", color: "amber" })
    expect(b.classId).toBe("knight")
    expect(b.color).toBe("amber")
  })

  it("sets useCustomScenario to false", () => {
    const b = makeEmptyBuild({ classId: "wizard", color: "violet" })
    expect(b.useCustomScenario).toBe(false)
  })

  it("derivedStats start zeroed", () => {
    const b = makeEmptyBuild({ classId: "wizard", color: "violet" })
    expect(b.derivedStats.dps).toBe(0)
    expect(b.derivedStats.dpsCurve).toEqual([])
  })
})
```

**Step 3: Run, see failure**

Run: `npx vitest run tests/app/addBuild.test.ts`
Expected: FAIL — `Cannot find module '../../src/app/buildFactory'`

**Step 4: Create the factory**

Create `src/app/buildFactory.ts`:

```ts
import type { Build, BuildSlots, Exaltations, DerivedStats } from "../../product/sections/comparator/types"

const ZERO_EXALTS: Exaltations = {
  att: 0, dex: 0, wis: 0, vit: 0, spd: 0, def: 0, hp: 0, mp: 0,
}

const ZERO_SLOTS: BuildSlots = {
  weapon: null, ability: null, armor: null, ring: null,
}

const ZERO_DERIVED: DerivedStats = {
  dps: 0, dpsAtZeroDef: 0, ehp: 0,
  att: 0, dex: 0, spd: 0, vit: 0, wis: 0, def: 0, hp: 0, mp: 0,
  timeToKill1k: 0, dpsCurve: [],
}

interface MakeEmptyBuildInput {
  classId: string
  color: string
  /** Override the generated id; useful for snapshot tests. */
  id?: string
  /** Override the default "New build" name. */
  name?: string
}

/**
 * Produce a fresh comparator build column with no items, zero exaltations,
 * and the global scenario active. Used by the "+ Add build" action and any
 * code path that wants a clean slate.
 */
export function makeEmptyBuild(input: MakeEmptyBuildInput): Build {
  return {
    id: input.id ?? `build-new-${Date.now()}`,
    name: input.name ?? "New build",
    classId: input.classId,
    color: input.color,
    tags: [],
    slots: { ...ZERO_SLOTS },
    exaltations: { ...ZERO_EXALTS },
    useCustomScenario: false,
    derivedStats: { ...ZERO_DERIVED },
  }
}
```

**Step 5: Run, see pass**

Run: `npx vitest run tests/app/addBuild.test.ts`
Expected: PASS, all 5 cases.

**Step 6: Wire factory into addBuild action**

Modify `src/app/OryxLabApp.tsx`. At the top imports, add:

```ts
import { makeEmptyBuild } from "./buildFactory"
```

Replace lines 277–287:

```ts
addBuild: () =>
  setBuilds((curr) => {
    // Pick the most recent column's class as the default for the new
    // column. New users don't have to think about it; power users get
    // the class they were just looking at.
    const defaultClass = curr[curr.length - 1]?.classId ?? "wizard"
    return [
      ...curr,
      makeEmptyBuild({
        classId: defaultClass,
        color: pickBuildColor(curr),
      }),
    ]
  }),
```

**Step 7: Run lint + typecheck + tests**

```bash
npm run lint && npm run typecheck && npm test
```

Expected: clean lint, clean typecheck, all tests pass.

**Step 8: Commit**

```bash
git add src/app/buildFactory.ts src/app/OryxLabApp.tsx tests/app/addBuild.test.ts
git commit -m "fix(ux): new build column starts empty (#16)"
```

---

## Task 2: Add `uiMode` state + persistence

**Files:**
- Modify: `src/app/storage.ts` — add accessor functions
- Modify: `src/app/OryxLabApp.tsx` — that's where the hook actually lives. (`src/app/state.ts` only contains type definitions + a `createContext` — no `useState` calls. Verified by grepping for `useState` in state.ts: zero matches.)
- Test: `tests/app/storage-uimode.test.ts` (create)

**Step 1: Confirm the hook location**

```bash
grep -n "useState" src/app/OryxLabApp.tsx | head -3
grep -n "useState" src/app/state.ts | wc -l   # should be 0
```

The hook's `useState` calls are clustered around the existing theme state (search for `loadTheme` or `saveTheme`). Add the new state next to that pattern.

**Step 2: Write the failing test for storage**

Create `tests/app/storage-uimode.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest"
import { loadUiMode, saveUiMode } from "../../src/app/storage"

describe("uiMode persistence", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("defaults to 'simple' when nothing is stored", () => {
    expect(loadUiMode()).toBe("simple")
  })

  it("round-trips a saved value", () => {
    saveUiMode("advanced")
    expect(loadUiMode()).toBe("advanced")
  })

  it("ignores garbage stored values and returns 'simple'", () => {
    window.localStorage.setItem("oryxlab.v2.uiMode", JSON.stringify("garbage"))
    expect(loadUiMode()).toBe("simple")
  })
})
```

**Step 3: Run, see failure**

Run: `npx vitest run tests/app/storage-uimode.test.ts`
Expected: FAIL with import error.

**Step 4: Add storage helpers**

In `src/app/storage.ts`, add to `KEYS`:

```ts
const KEYS = {
  builds: `oryxlab.v${CURRENT_SCHEMA}.builds`,
  scenario: `oryxlab.v${CURRENT_SCHEMA}.scenario`,
  inventory: `oryxlab.v${CURRENT_SCHEMA}.inventory`,
  savedBuilds: `oryxlab.v${CURRENT_SCHEMA}.savedBuilds`,
  theme: `oryxlab.v${CURRENT_SCHEMA}.theme`,
  uiMode: `oryxlab.v${CURRENT_SCHEMA}.uiMode`,  // NEW
}
```

After `loadTheme` / `saveTheme`, add:

```ts
export type UiMode = "simple" | "advanced"

export function loadUiMode(): UiMode {
  const raw = safeGet<string>(KEYS.uiMode)
  return raw === "advanced" ? "advanced" : "simple"
}

export function saveUiMode(mode: UiMode) {
  safeSet(KEYS.uiMode, mode)
}
```

**Step 5: Run, see pass**

Run: `npx vitest run tests/app/storage-uimode.test.ts`
Expected: PASS.

**Step 6: Wire into useOryxLab state**

In `src/app/OryxLabApp.tsx` (the hook lives here, not in state.ts which is types-only), find where `theme` state is initialized (search for `loadTheme`). Add a parallel `uiMode` state next to it:

```ts
const [uiMode, setUiMode] = useState<UiMode>(() => loadUiMode())
useEffect(() => { saveUiMode(uiMode) }, [uiMode])
```

Expose via the actions object:

```ts
toggleUiMode: () => setUiMode((m) => (m === "simple" ? "advanced" : "simple")),
```

And via state:

```ts
return {
  state: { ..., uiMode },
  actions: { ..., toggleUiMode },
}
```

**Step 7: Run lint + typecheck + tests**

```bash
npm run lint && npm run typecheck && npm test
```

**Step 8: Commit**

```bash
git add src/app/storage.ts src/app/OryxLabApp.tsx tests/app/storage-uimode.test.ts
git commit -m "feat(state): add uiMode (simple/advanced) with persistence (#15)"
```

---

## Task 3: ScenarioBar collapses in simple mode

**Files:**
- Modify: `src/shell/components/AppShell.tsx` (or wherever ScenarioBar is rendered)
- Modify: `src/shell/components/ScenarioBar.tsx`

**Step 1: Pass `uiMode` prop to ScenarioBar**

Find where ScenarioBar is rendered (probably AppShell.tsx). Pass `uiMode={state.uiMode}` to it.

**Step 2: Add `uiMode` to ScenarioBarProps**

In `ScenarioBar.tsx:22-29`, extend the props:

```ts
interface ScenarioBarProps {
  scenario: Scenario
  presets?: ScenarioPreset[]
  open: boolean
  uiMode: "simple" | "advanced"  // NEW
  onChange?: (next: Scenario) => void
  onPresetSelect?: (presetId: string) => void
  onToggle?: () => void
}
```

**Step 3: Conditional render — early return for simple mode**

After the `if (!open) return …` block, add another early return:

```ts
if (uiMode === "simple") {
  // Simple mode hides the entire scenario bar. Power users flip the
  // toggle in ShellActions to expose it.
  return null
}
```

**Step 4: Add the toggle button to ShellActions**

Find `src/shell/components/ShellActions.tsx`. Add a button:

```tsx
<button
  type="button"
  onClick={onToggleUiMode}
  className="oryx-press rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-600 hover:border-amber-400/60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
  title={uiMode === "simple" ? "Show advanced controls" : "Hide advanced controls"}
>
  {uiMode === "simple" ? "Advanced" : "Simple"}
</button>
```

**Step 5: Visual smoke test**

Run: `npm run dev`, open localhost, confirm the ScenarioBar disappears in simple mode and the toggle button label is "Advanced". Click → ScenarioBar reappears, label flips to "Simple".

**Step 6: Run all checks**

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

**Step 7: Commit**

```bash
git add src/shell/components/AppShell.tsx src/shell/components/ScenarioBar.tsx src/shell/components/ShellActions.tsx
git commit -m "feat(ux): scenario bar hidden in simple mode + toggle (#15)"
```

---

## Task 4: BuildEditor hides exaltations in simple mode

**Files:**
- Modify: `src/sections/build-editor/BuildEditorView.tsx`

**Step 1: Pass `uiMode` to BuildEditorView**

In the route component (`src/app/routes/BuildEditorRoute.tsx`), pull `state.uiMode` from `useOryxLab()` and pass through.

**Step 2: Conditional render**

In `BuildEditorView.tsx`, find the JSX block that renders the exaltation sliders. Wrap:

```tsx
{uiMode === "advanced" && (
  <ExaltationsBlock ... />
)}
{uiMode === "advanced" && (
  <ScenarioOverrideBlock ... />
)}
```

(Find the actual component names — they may be inline JSX rather than extracted components. If inline, wrap the whole block.)

**Step 3: Manual smoke test**

Open a build in the editor. In simple mode, exaltations and scenario override should be hidden. Stats still update from items. In advanced mode, both panels show.

**Step 4: Run all checks + commit**

```bash
npm run lint && npm run typecheck && npm test
git add -A
git commit -m "feat(ux): build editor hides exaltations + scenario override in simple mode (#15)"
```

---

## Task 5: Verify, push, close issues

**Step 1: Build prod, deploy, smoke test**

```bash
npm run build
git push origin main
```

Wait ~90s for Railway deploy.

**Step 2: Smoke test in incognito**

Visit https://www.oryxlab.app/app in incognito. Confirm:
- New columns are empty (no auto-Wizard build with items)
- Top header shows "Advanced" toggle button
- Default mode is simple (scenario bar hidden, exaltations hidden in editor)
- Click "Advanced" → scenario bar appears, exaltations appear

**Step 3: Close the GitHub issues**

```bash
gh issue close 15 --comment "Shipped — simple mode default, toggle in header. Confirmed in production."
gh issue close 16 --comment "Shipped — new build column now starts empty + zero exalts. Confirmed in production."
```

---

## Done criteria

- [ ] Tests: 32+ files, all green, including new addBuild + storage-uimode tests
- [ ] Lint + typecheck clean
- [ ] Bundle size unchanged or +<5KB
- [ ] Smoke test in production confirms simple mode is default + toggle works
- [ ] Issues #15 and #16 closed
