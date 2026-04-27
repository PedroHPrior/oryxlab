# Build Editor Specification

## Overview
The Build Editor is the full-screen deep-dive view of a single build. It exists for theorycrafters and for any user who wants more than the inline editor in the comparator: every stat is broken down line by line, exaltations are first-class controls, the DPS-vs-defense curve is a real chart, and the per-build scenario is fully editable. The editor is reached via "Open in Editor" from any comparator column.

## User Flows
- Land on /editor/:buildId from a comparator column → editor loads with that build's full state
- Or land on /editor with no id → start from a blank build, picking class first
- Edit any equipped slot via a richer item picker that shows full item details, stat comparison vs the currently equipped, and tag chips
- Edit exaltation level (0–5) per stat with steppers
- Toggle custom scenario for this build → adjust target def, status effects, party buffs inline
- Inspect "Show calculation" panel that exposes the per-shot math (base × ATT mod × buff mod × multi-shot × pierce), useful for theorycrafter validation
- Watch DPS update live as inputs change; numbers tick over a 150ms ease-out
- Save build (name + tags + notes), Save as new, or Discard changes
- "Back to comparator" returns to comparator with all changes applied to the originating column

## UI Requirements
- Three-pane layout on desktop: left rail (slots + exaltations) ≈ 320px, center (stat panel + breakdown) flexible, right rail (graphs) ≈ 360px
- Tablet collapses right rail into tabs above center; mobile becomes a tab bar (Slots / Stats / Graphs / Scenario) with the full panel below
- Header inside the editor: build name (large, editable inline), class portrait, "Back to comparator" button (left), Save / Save as new / Discard (right)
- Slots panel: 5 large slot cards (Weapon, Ability, Armor, Ring, Talisman) each with sprite, name, key stats; click → item picker drawer
- Item picker drawer (right-side slide-over, 480px on desktop, full on mobile): search, filter by tier/rarity/tag, list of compatible items with sprite, name, and inline diff vs currently equipped
- Exaltations panel: 8 stat rows (ATT, DEX, WIS, VIT, SPD, DEF, HP, MP) with 0–5 stepper, current value, max, and a thin progress bar in amber-400
- Stat panel: large DPS number (5xl, tabular figures, amber-400) with delta vs unmodified build under "no scenario"; below, a 4×3 grid of stats (DPS at scenario, DPS@0def, EHP, TTK1k, ATT, DEX, SPD, VIT, WIS, DEF, HP, MP)
- "Show calculation" expandable section: for each shot, list base damage range, ATT modifier, buff modifiers, multi-shot factor, pierce factor, final per-shot damage, then total DPS computation; presented as a bullet list with monospaced numbers
- Graphs panel: DPS-vs-defense line chart (0–80 def on x-axis, DPS on y-axis, smoothed line in amber-400 with point at current scenario def); secondary chart: stacked bar showing stat sources (base / items / exalts / buffs) for selected stat
- Scenario panel inside the editor: full controls (preset selector, def slider, status chips, buff chips) — when the build uses global scenario, controls are read-only with a "Customize" affordance; when custom, controls are live
- All number changes animate (150ms ease-out); slot swaps animate with a soft fade
- Empty slots show dashed placeholders with "Choose a [slot]" CTA
- Keyboard: ⌘/Ctrl+S saves, Esc closes any open drawer, ?/h shows shortcuts overlay

## Configuration
- shell: true
