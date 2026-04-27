# OryxLab — Product Requirements Document (PRD)

**DPS Calculator & Build Comparator for Realm of the Mad God**

- **Document version:** 1.0
- **Date:** 2026-04-26
- **Status:** Approved for implementation
- **Owner:** Pedro Prior
- **Working title (codebase):** `dpsCalculator`
- **Product name:** OryxLab

---

## 1. Vision & Positioning

### 1.1 One-liner

OryxLab is the definitive web tool to **build, compare, and optimize Realm of the Mad God characters** — with theorycrafter-grade calculation fidelity wrapped in a UI fast enough to answer *"is this drop an upgrade?"* in seconds.

### 1.2 Problem

Realm of the Mad God ships with ~16 playable classes, thousands of items across multiple rarity tiers (T0–T14, Untiered/UT, Set Tiered/ST, Talismans), an exaltations system, and dozens of party buffs, debuffs, and status effects that interact non-trivially. Today, players rely on:

- Outdated/abandoned community calculators
- Personal spreadsheets shared on Discord
- RealmEye (great for stats lookup, but does not calculate DPS under realistic combat scenarios)
- Trial-and-error in-game

There is no single, current, complete, free tool that:
1. Hosts the full ROTMG item catalog with up-to-date stats
2. Calculates DPS at the fidelity level theorycrafters need
3. Stays approachable enough for a mid-game player to use during a 5-minute drop decision

### 1.3 Vision

OryxLab fills that gap by making the **comparator the front door of the product**. The user lands directly inside the tool that solves their #1 question. Editing a build, browsing the catalog, optimizing, and saving are all in service of comparison.

### 1.4 Success criteria (qualitative, v1)

- A mid-game player can compare two specific items (e.g., two daggers) in under 30 seconds from landing.
- A theorycrafter can see DPS broken down by target defense, with all relevant buffs/exaltations factored in.
- The catalog covers 100% of currently-obtainable items in production ROTMG.
- The product works offline once visited (PWA cache) and runs comfortably on a mid-range phone.

---

## 2. Target Users

| Tier | Persona | Primary need | Design weight in v1 |
|---|---|---|---|
| **Primary** | Mid-game player | "Is this drop an upgrade?" / "What's the best build I can make right now?" | **High** — UI defaults optimize for this user |
| Secondary | Theorycrafter / endgame | Deep numerical breakdowns, exaltations, optimizer with constraints | Medium — depth available on demand, never in the default view |
| Tertiary | New / casual player | Learn what DPS, EHP, Armor Break mean | **Out of scope for v1** — no educational layer; planned for v2 |

Design rule of thumb: **default view = mid-game**, advanced controls hidden behind explicit affordances ("Open in Editor", "Show breakdown").

---

## 3. Scope

### 3.1 In scope (v1)

**Content (catalog):**
- All 16+ playable classes
- All weapon tiers T0–T14 plus all Untiered (UT) weapons
- All Set Tiered (ST) sets, including seasonal
- All abilities, armors (Robe / Leather / Heavy), rings — tiered + UT + ST
- All Talismans
- Exaltations system (per-class stat bonuses)
- Item-level mechanics: piercing, ricochet, true damage, AoE, multi-shot, directional shot patterns, on-proc effects

**Features:**
- Comparator (N-way grid + 1v1 drill-down)
- Inline build editing inside the comparator
- Dedicated full-screen Build Editor for deep dives
- Catalog browser with filters and quick item-vs-item compare
- Optimizer with three modes (BIS / with-my-inventory / with-constraints)
- Inventory management (manual toggle + RealmEye import)
- Saved Builds (localStorage)
- URL-encoded share links
- Scenario panel (target defense, status effects, party buffs) with presets + fine-tuning
- Responsive web + PWA install + offline catalog

**Calculation fidelity (level C — "Complete"):**
- Base formula: damage per shot × shots per second × multi-shot count
- Target defense (slider 0–80, plus typed input for custom values)
- Status effects active on target: Armor Break, Bleeding, Exposed, Curse
- Party buffs active on caster: Paladin Seal, Warrior Helm, Mystic Curse, Bard buffs
- Self bonuses: ATT/DEX from full set, exaltations, talisman bonuses
- Special projectile mechanics: piercing, armor-piercing, true damage, AoE, ricochet, directional patterns
- On-proc effects from UT/ST items
- Distinguishes standing-DPS vs moving-DPS where shot pattern differs

### 3.2 Out of scope (v1)

- User accounts / cloud sync (planned v2)
- Educational layer / glossary / class guides (planned v2)
- Boss-specific damage simulation (Oryx 3 phases, Sanctuary mechanics) — fidelity level D, planned v2
- Pet abilities and pet stones (treated as flat self-buff modifiers if at all)
- Live multiplayer party simulation (modeled via static buff toggles, not real-time)
- In-app realm pricing / market data
- Authentication, friend lists, leaderboards
- Localization beyond English

### 3.3 Non-goals

- OryxLab is not a wiki replacement. It is not designed for lore, achievements, dungeon guides, or drop tables.
- OryxLab does not aim to be the in-game inventory manager. The Inventory feature exists *only* to feed the optimizer and as an optional filter.

---

## 4. Information Architecture

OryxLab v1 has **5 top-level destinations**. The Home screen *is* the Comparator — there is no separate dashboard.

```
┌─ Home (Comparator)        ← landing screen, default view
├─ Catalog                   ← browse all items, filter, quick compare
├─ Optimizer                 ← 3 modes: BIS / Inventory / Constraints
├─ Inventory                 ← (opt-in) mark owned items, import RealmEye
└─ Saved Builds              ← drawer/menu, localStorage-backed
```

**Persistent shell elements:**
- Top nav: 5 destinations + global Scenario summary chip + Save/Share menu
- Global Scenario panel (collapsible bar at top of every screen): target defense slider, active status effects, party buffs, scenario preset selector

The Build Editor is **not a top-level destination**. It is a route reachable via "Open in Editor" from any build column in the comparator. The full-screen editor is the same data model as a comparator column, just with more space for breakdowns and graphs.

---

## 5. Feature Specifications

### 5.1 Home / Comparator

**Default empty state:** A grid with up to 6 build slots, each labeled "+ Add build". A secondary affordance "+ Add item" allows comparing raw items (e.g., Wand A vs Wand B) without picking a class.

**Primary interactions:**
- Click an empty slot → choose: "Start from class" / "Start from item" / "Load saved build" / "Paste share link"
- Each filled column shows: class portrait, equipped slots (Weapon, Ability, Armor, Ring), key derived stats (DPS, EHP, ATT, DEX, Spd, Vit, Wis, Def, HP, MP), and a delta indicator vs the leftmost build (highlighted green/red)
- Inline edit any slot: click the slot → item picker opens (filtered to compatible items for the class)
- Buffs/exaltations chip per build (override scenario) — defaults to global scenario
- Per-column actions: "Open in Editor" (full-screen), "Duplicate", "Save", "Remove"

**Drill-down (1v1):** Toggle on top of the grid: select 2 builds → enter "Focus mode" — hides others, shows side-by-side with stat-by-stat diff and DPS-vs-defense graph overlay.

**N-way table view:** Toggle to switch from card grid to dense table — builds in columns, metrics in rows. Best for theorycrafter use.

**Empty-state guidance (mid-game friendly):** Three preset starting points pinned at the top: "Compare two of my drops", "Best in slot for [class]", "What's better for me right now?" — each prefills the comparator.

### 5.2 Build Editor (full-screen)

**Layout:** Left panel — equipped slots with item pickers. Center — large stat panel with full breakdown (per-shot, per-tick, with/without each buff). Right — graphs (DPS vs defense, DPS over time, EHP curve).

**Interactions:**
- Slot pickers identical to inline editor in comparator, but with extra detail (full item tooltip, sprite preview, comparison vs currently-equipped on hover)
- Stat breakdown is expandable: click "DPS" → see decomposition (base × ATT mod × buff mod × multi-shot × pierce factor)
- Exaltations editor (click stat → set exaltation level 0–5)
- Scenario override: full per-build scenario controls (target def, statuses, party buffs)
- "Back to comparator" returns the build to its column with all changes applied

### 5.3 Catalog

**Layout:** Sidebar of filters + main grid/list of items.

**Filters:**
- Item type (Weapon / Ability / Armor / Ring / Talisman)
- Class compatibility (multi-select)
- Tier range (slider)
- Rarity (Tiered / UT / ST / Seasonal)
- Specific properties (piercing, AoE, on-proc, etc.) via tag chips
- Stat bonus filters (e.g., "+5 ATT or more")
- Owned-only toggle (if Inventory is populated)

**Item card:** Sprite, name, tier, key stats, rarity badge. Click → full detail panel with all stats, drop locations (if data available), variants.

**Quick compare:** Multi-select items (checkbox) → "Compare selected" button → opens a focused comparator with just those items (no full builds, just the items vs each other).

### 5.4 Optimizer

**Three modes (selected via tab):**

1. **BIS (Best in Slot)** — pick class + objective ("Max DPS", "Max EHP", "Balanced"). Optionally lock specific items. Output: top 3 build candidates with reasoning ("uses Crystal Wand for highest DPS, but T7 Wand still 92% as effective").

2. **With My Inventory** — requires Inventory to be populated. Same controls as BIS, but only considers items the user owns. Output: best build with current vault.

3. **With Constraints** — multi-objective. User defines hard constraints (e.g., "Def ≥ 60", "HP ≥ 700", "no UTs", "max 1 ST piece"). Output: builds satisfying all constraints, ranked by chosen objective.

**All modes:** results render as comparator columns the user can edit, save, or share.

### 5.5 Inventory

**Default state:** empty, opt-in.

**Interactions:**
- "Mark items I own" → opens catalog in selection mode, user toggles items (binary: own / don't own — no quantity tracking in v1)
- "Import from RealmEye" → text input for RealmEye username or profile URL → app fetches public character + vault data → preview → confirm import (overwrites or merges)
- "Clear inventory"
- Inventory data stored in localStorage; export/import as JSON file for backup

### 5.6 Saved Builds

**Access:** Drawer from the top-right (icon: bookmark).

**Each build entry:** name (editable), class portrait, last-modified date, key DPS number, tags (free-text), notes field, "Load into comparator" button, "Copy share link" button, "Delete".

**Storage:** localStorage. No cloud sync in v1.

### 5.7 Scenario panel (global)

Persistent collapsible bar at the top of every screen.

**Controls:**
- Preset selector ("Solo no def", "Party O3 with Pal+Bard", "Sanctuary endgame", "Custom")
- Target defense (slider 0–80 + numeric input)
- Status effects (toggle chips): Armor Broken, Bleeding, Exposed, Cursed, Petrified, Stasis-immune (informational)
- Party buffs (toggle chips): Paladin Seal, Warrior Helm, Mystic Curse, Bard Inspire, Bard Crescendo, Bard Encore, Necromancer Skull (in-flight)
- Self consumables (toggle chips): DEX/ATT pots active (informational only — does not modify stats but signals "running with pots")

**Override:** Each build in the comparator has a "Custom scenario" toggle that detaches it from the global scenario.

### 5.8 Sharing

Every build has a deterministic URL encoding. Format target: query string with compact identifiers, e.g., `?b=wzr.cw.ep.ce.es.[exalts].[scenario]`.

- All localStorage entries can be exported to a share URL
- A whole comparator state can be shared (multiple builds in one URL)
- Share URLs are stable across versions when possible; breaking changes get a version prefix (`?v=2&b=...`)

---

## 6. DPS Calculation Model

### 6.1 Inputs (per build)

- **Class** (defines stat caps, base stats, allowed slots)
- **Weapon** (damage range, RoF, projectile count, pattern, special mechanics)
- **Ability** (effects: buffs, debuffs, AoE, summons; mostly affects scenario but some abilities boost weapon DPS directly, e.g., Ninja Star)
- **Armor** (Def, secondary stats)
- **Ring** (stats, special effects)
- **Talisman** (modifiers, on-equip effects)
- **Exaltations** (per-stat 0–5 level)

### 6.2 Inputs (per scenario)

- Target defense (0–80, numeric)
- Status effects on target: Armor Broken (Def → 0), Bleeding (DPS pressure), Exposed (Samurai +20% dmg taken), Cursed (Mystic +20–25% dmg taken), Armor Pierced (per-shot ignore Def)
- Party buffs on self: Paladin Seal (+ATT/DEF or +DMG), Warrior Helm (+ATT/+DEX/+SPD), Mystic Curse stack-aware, Bard Inspire/Crescendo/Encore (cycle-aware: average buff uptime)
- Self toggles: DEX/ATT pots (info only)

### 6.3 Core formula (per weapon shot)

```
effective_dmg = max(min_dmg_after_def, raw_dmg − target_def_after_breaks)
              × (1 + atk_modifier_from_buffs_and_stats)
              × (1 + dmg_taken_modifier_on_target)
              × shot_multiplier (multi-shot, ricochet expected hits, pierce expected hits)

shots_per_second = base_RoF × (1 + dex_modifier)

dps = effective_dmg × shots_per_second
```

**Special cases handled:**
- True damage projectiles (skip Def entirely)
- Armor-piercing projectiles (skip Def per-shot)
- Multi-shot weapons (sum dmg across all bullets, not just primary)
- Directional patterns (e.g., katanas have a fixed 5-bullet fan): standing-DPS = all bullets hit, moving-DPS = primary-only
- Ricochet: multiply by expected_hits coefficient (data-driven, default 2 for standard ricochet)
- Piercing weapons (daggers): expected_hits coefficient based on enemy line-up assumption (default 1 for single-target, 2.5 for grouped)
- AoE / explosive shots: separate AoE-DPS metric reported alongside single-target DPS
- On-proc effects (UT/ST): proc rate × proc damage averaged into DPS

### 6.4 Outputs (per build, derived stats)

- **DPS** (single-target, at scenario defense)
- **DPS (zero def)** — reference number
- **DPS (avg vs scaling defs 0/30/50/80)** — single representative number
- **EHP** (effective HP given Def + Vit + class HP cap)
- **All raw stats** — ATT, DEX, SPD, VIT, WIS, DEF, HP, MP (with breakdown: base + items + exalts + buffs)
- **Time-to-kill** for a reference HP target (configurable)
- **AoE DPS** (when applicable)
- **DPS curve** — array of DPS values for defense 0..80, used for graph rendering

### 6.5 Calculation engine architecture

- Pure-functional TypeScript module: `(BuildConfig, ScenarioContext) → DerivedStats`
- Stateless, deterministic, fully unit-testable
- Catalog data injected as a separate parameter, not imported
- All formulas live in a single file (`src/engine/dps.ts`) with each special case clearly named
- A separate `src/engine/__tests__/` folder validates known reference builds against community-confirmed numbers

---

## 7. Data Sources & Catalog

### 7.1 Strategy

Hybrid maximum-coverage scrape:

- **RealmEye** — primary source for structured item stats (clean tables, mechanical data)
- **RotMG Wiki (Fandom)** — secondary source for descriptions, lore, sprite URLs, drop locations, edge-case mechanics not on RealmEye
- **Any other public structured ROTMG dataset** — community JSON dumps, GitHub repos with extracted game data — used to cross-validate
- **Manual curation pass** — for items where sources disagree or are silent on a mechanic relevant to DPS (e.g., proc rates), maintainer fills the gap with a documented assumption

### 7.2 Pipeline

1. **Scraper scripts** (Node, run manually or on a cron — not part of the runtime app) fetch and parse each source
2. **Normalizer** maps each source to OryxLab's canonical schema
3. **Reconciler** merges sources, prefers RealmEye for stats, Wiki for descriptions/sprites, flags conflicts
4. **Output** — canonical JSON files committed to the repo: `src/data/items.json`, `src/data/classes.json`, `src/data/exaltations.json`, etc.
5. **Versioning** — each scrape run timestamps and versions the dataset; breaking changes increment a major version

### 7.3 Update cadence

V1 ships a one-shot snapshot. Subsequent scrapes are manual (run when ROTMG patches drop new items). No live runtime fetching — keeps the app fast and PWA-offline-capable.

### 7.4 Data shape (entities)

| Entity | Description | Key relationships |
|---|---|---|
| **Class** | Playable class definition | has many `AbilityType`, `WeaponType` compatibility, base stats, stat caps |
| **Item** | Any equippable item (weapon, ability, armor, ring, talisman) | belongs to one or more `Class` (compatibility), has `Tier`, `Rarity`, `ItemType`, stat bonuses, special mechanics |
| **WeaponType** | Bow, Wand, Staff, Sword, Dagger, etc. | constrains which `Class` can equip |
| **AbilityType** | Spell, Tome, Quiver, Skull, Cloak, Helm, Seal, etc. | belongs to a class |
| **Set (ST)** | Set Tiered set: a named bundle of 4 items (weapon + ability + armor + ring) with a set bonus | references 4 `Item`s, has set-bonus rule |
| **Exaltation** | Per-class stat bonus from completing exaltation quests | belongs to one `Class`, has 5 levels |
| **StatusEffect** | On-target effect (Armor Break, Curse, etc.) | scenario inputs |
| **PartyBuff** | On-self party buff (Paladin Seal, Bard Inspire, etc.) | scenario inputs |
| **Build** | User-created build configuration | references one `Class` + 4–5 `Item`s + exaltation levels + scenario override |
| **Inventory** | User's owned-items list | array of `Item` IDs |
| **Scenario** | Calculation context | defense, status effects, party buffs |

Detailed schemas (TypeScript interfaces) live in `src/data/types.ts` and are shipped to coding agents as part of the export package.

---

## 8. Design System

### 8.1 Aesthetic direction

**"Modern data tool with ROTMG identity."** Clean, dense, dark-default, sans-serif. ROTMG identity comes from **using authentic in-game item sprites** as iconography throughout the UI — not from pixel fonts or skeumorphic medieval chrome.

### 8.2 Color tokens

**Base (neutrals):** Tailwind `zinc` scale (zinc-950 background, zinc-900 surfaces, zinc-800 borders, zinc-100 text).

**Primary accent: Realm Gold.** Tailwind candidate: `amber-400` / `amber-500` for interactive elements, hovers, key CTAs, brand accents. Evokes ROTMG drop highlight color and endgame loot.

**Semantic colors (multi-accent):**
- DPS / damage / "gain" → `emerald-400`
- Damage taken / HP / loss → `rose-500`
- Defense / shield / mitigation → `sky-400`
- Mana / wisdom / ability → `violet-400`
- Speed / dexterity → `yellow-300`
- Vitality / regen → `lime-400`

**Light mode:** supported but not the design priority. Dark is default.

### 8.3 Typography

- **UI text** — `Inter` (sans-serif, neutral, readable at small sizes for dense tables)
- **Numbers / stats** — tabular figures (`Inter` with `font-feature-settings: "tnum"`) so columns of numbers align cleanly
- **Code / data dumps** (export view, share URLs, debug) — `JetBrains Mono`

(All loaded from Google Fonts. No pixel fonts in v1 to keep stat tables maximally readable.)

### 8.4 Iconography & imagery

- All item icons: original ROTMG sprites (ripped from sources like RealmEye/wiki, served as PNG/WebP)
- Class portraits: official class portraits from the game
- UI icons (chevrons, filters, settings, etc.): `lucide-react` for consistency

### 8.5 Density

- Default: comfortable density (good for mid-game user)
- "Compact mode" toggle: reduces row heights, hides decorative whitespace — for theorycrafter's N-way table

### 8.6 Motion

- Subtle fade-ins (200ms) on panel switches
- No bouncy animations
- Number tickers (when DPS recalculates) animate over 150ms with `ease-out` so the user can see *what* changed

---

## 9. Persistence & Sharing

### 9.1 Persistence (v1)

- All user data (saved builds, inventory, custom scenarios, preferences) lives in `localStorage`
- Schema-versioned: each entry has `version` field; on load, migrations bring old entries to current schema
- Export-to-JSON button on Saved Builds and Inventory for user-driven backup
- Import-from-JSON to restore

### 9.2 Sharing (v1)

- Every build serializes to a compact URL fragment
- A whole comparator state (multiple builds + scenario) also serializes to a URL
- Share button generates and copies link to clipboard
- Share URLs survive minor data updates; major catalog changes that break encoding bump a `v=N` prefix

### 9.3 Out of scope (v2+)

- Cloud sync via account
- Build collections / folders
- Public profile pages
- "Trending builds" / community feed

---

## 10. Platform & Performance

### 10.1 Form factor

- Single-page web application
- Responsive — designed for both desktop (≥ 1280px, dense N-way comparator default) and mobile (< 640px, vertical scroll, tab-based section switching)
- Tablet (640–1280px) gets the desktop layout with reduced grid columns

### 10.2 PWA

- Installable on desktop and mobile
- Service worker caches catalog data + app shell on first visit → fully offline-capable for browsing and calculation
- Online connection only required for: RealmEye inventory import, sharing (clipboard), and (eventually) v2 cloud sync

### 10.3 Performance budgets

- First meaningful paint < 1.5s on 4G mid-range mobile
- Time-to-interactive < 3s on the same
- Catalog browse renders 1000+ items via virtualized list (no full DOM)
- Calculation engine: any single build recompute < 5ms; full comparator (6 builds) recompute < 30ms

### 10.4 Tech stack notes (recommended, not prescriptive)

- React 18+, TypeScript strict, Vite
- Tailwind CSS v4 (per project conventions)
- Zustand or similar lightweight state for comparator/scenario state
- React Router for the 5 destinations
- Workbox for PWA service worker
- No backend in v1

---

## 11. Roadmap

### v1.0 — Core launch (this PRD)

Everything in §3.1.

### v1.x — Polish & expansion

- Boss-defense presets (Oryx 3, Sanctuary, Lost Halls — per-phase defense values pre-loaded)
- Build comparison "diff explanations" (text: "Build B is 12% better DPS, 8% lower EHP because…")
- Catalog: drop-source filter (find items dropped by specific dungeons)
- Inventory: quantity tracking (have 3 Crystal Wands)
- Share-link previews (Open Graph images with build summary)
- Light mode polish

### v2.0 — Major expansion

- User accounts + cloud sync
- Educational layer for tertiary user (tooltips, glossary, "first build" guides)
- Boss-specific damage simulation (fidelity level D — phase-aware, hitbox-aware, invulnerability windows)
- Pet integration (pet abilities as scenario inputs)
- Localization (PT-BR first)
- Public build sharing / community profiles

### v3.0+ — Speculative

- Theorycrafter API (machine-readable catalog + calculator endpoint)
- In-app patch-note diffs ("after the latest patch, your saved Wizard build lost 3% DPS")

---

## 12. Open Questions & Risks

### 12.1 Open product questions

- **Inventory granularity:** v1 ships binary toggle per item. Quantity tracking pushed to v1.x — is that acceptable given the optimizer can't recommend "use both your Crystal Wands across two characters" without it?
- **Bard cycle modeling:** Bard's buff cycle has uptime/downtime depending on play pattern. v1 model = "average buff active." Is that good enough or does a "Bard playstyle: aggressive / passive" toggle matter?
- **Trickster Prism / Summoner minions:** these multiply effective DPS in a way that's hard to model statelessly. v1 plan = expose as a multiplier toggle in scenario panel. Validate with theorycrafters before launch.

### 12.2 Data risks

- **Wiki/RealmEye scraping fragility** — sources can change HTML structure. Mitigation: scrapers are run manually on patch days, output is committed to the repo, and runtime app reads only static JSON.
- **Dataset completeness** — some UT mechanics aren't documented anywhere reliably. Mitigation: maintain an `assumptions.md` in the data folder noting every gap and the assumption used.
- **Patch lag** — when ROTMG patches drop new items, OryxLab is out-of-date until a maintainer reruns the scraper. Acceptable for v1 (community will report); v1.x could add an in-app "data version" indicator.

### 12.3 UX risks

- **Comparator-as-home is unconventional** — onboarding moment matters. The empty state must be inviting and the three preset starting points (§5.1) must work. A/B alternative: dashboard-like home with "+ Open comparator" CTA, kept as fallback if user-testing kills the comparator-first idea.
- **Scenario panel cognitive load** — many toggles. Mitigation: presets cover 80% of cases; advanced toggles collapsed by default.

### 12.4 Engineering risks

- **Calculation engine correctness** — DPS math is the product. Bugs here destroy trust. Mitigation: large unit-test corpus seeded with community-validated reference builds; visible "show calculation" debug mode in the UI for theorycrafters to verify.
- **Catalog size and performance on mobile** — 1000+ items in localStorage and rendered grids. Mitigation: virtualization, lazy sprite loading, IndexedDB for catalog storage if localStorage becomes a bottleneck.

---

## 13. Glossary

- **DPS** — damage per second (single-target unless noted)
- **EHP** — effective HP, accounting for Def
- **BIS** — best in slot
- **UT** — Untiered (rare unique item)
- **ST** — Set Tiered (themed set with set bonus)
- **Talisman** — newer item type with passive effects
- **Exaltation** — per-class permanent stat bonus
- **RoF** — rate of fire (shots per second base)
- **Armor Break** — status: target defense → 0
- **Curse / Exposed** — status: target takes more damage
- **Paladin Seal / Bard Inspire / etc.** — party buffs (caster receives bonus)

---

**End of PRD v1.0**
