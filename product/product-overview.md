# OryxLab

## Description
OryxLab is a web-based DPS calculator and build comparator for Realm of the Mad God, with theorycrafter-grade calculation fidelity wrapped in a UI fast enough to answer "is this drop an upgrade?" in seconds. The comparator is the front door of the product — users land directly inside the tool that solves their primary question, with editing, catalog browsing, optimizing, and saving all in service of comparison.

## Problems & Solutions

### Problem 1: Existing tools are scattered, outdated, or incomplete
ROTMG players today rely on broken community calculators, Discord spreadsheets, and RealmEye (which lists stats but does not calculate DPS under realistic combat scenarios). OryxLab consolidates the full item catalog, full-fidelity DPS math, and side-by-side comparison into a single, current, free web app.

### Problem 2: Mid-game players struggle to evaluate drops quickly
"Is this new dagger an upgrade?" is the most common question and there is no fast tool to answer it. OryxLab makes the comparator the home screen, with empty-state shortcuts ("Compare two of my drops", "Best in slot for class") that let a mid-game player get an answer in under 30 seconds.

### Problem 3: Theorycrafters lack a tool that models full combat fidelity
Existing calculators ignore exaltations, party buffs, target status effects, on-proc UT/ST mechanics, and directional shot patterns. OryxLab models all of this, exposes a full DPS-vs-defense curve, and ships a "show calculation" debug mode so power users can verify the math.

### Problem 4: No optimizer accounts for what the player actually owns
BIS lists are everywhere, but they're useless if you don't own the BIS items. OryxLab's optimizer has three modes — absolute BIS, "best build with my inventory" (with optional RealmEye import), and "best build under constraints" (e.g., min HP/Def, no UTs) — turning theory into actionable recommendations.

### Problem 5: Catalog discovery and sharing are clunky
Players can't easily filter "every wand with piercing under T10", and sharing a build means screenshots and Discord messages. OryxLab's catalog supports rich filters (type, class, tier, rarity, mechanics, owned-only), quick item-vs-item compare without committing to a build, and deterministic URL share links for any build or full comparator state.

## Key Features
- N-way build comparator (up to 6 builds) with 1v1 focus mode and DPS-vs-defense graphs
- Inline build editing inside the comparator + dedicated full-screen Build Editor for deep dives
- Full ROTMG catalog (all classes, T0–T14, UTs, STs, Talismans, Exaltations) with filters and quick compare
- Optimizer with three modes: Best in Slot, With My Inventory, With Constraints
- Inventory management — manual toggle plus RealmEye profile import
- Global Scenario panel with presets (target defense, status effects, party buffs) and per-build overrides
- DPS engine modeling buffs, debuffs, status, exaltations, procs, multi-shot, piercing, ricochet, AoE, and directional patterns
- Saved Builds in localStorage with tags, notes, and one-click share via URL-encoded links
- Responsive web + installable PWA with offline catalog and calculation
- Modern dark-default data-tool aesthetic using authentic ROTMG sprites for item iconography
