# Build Editor — UI Behavior Tests

## Layout

- [ ] Three-pane layout on desktop (left ~ 320px, center flex, right ~ 360px).
- [ ] Tablet collapses right pane into tabs above the center pane.
- [ ] Mobile uses a horizontal tab bar (Slots / Stats / Graphs / Scenario).

## Slots panel

- [ ] Each of 5 slots renders sprite, name, tier badge, tags.
- [ ] Click → opens slot picker drawer; selecting commits and animates the change.
- [ ] Empty slot shows a dashed placeholder with "Choose a [slot]" CTA.

## Exaltations

- [ ] Each of 8 stat rows has − and + steppers in 0–5 range.
- [ ] Progress bar fills proportional to the value.
- [ ] Decreasing below 0 or increasing above 5 is disabled.

## Stat panel

- [ ] DPS is rendered in 5xl font size with tabular figures.
- [ ] All 12+ stats show with monospaced values.
- [ ] Time-to-kill and DPS at 0 def display below the main DPS.

## Stat sources breakdown

- [ ] Stacked bar shows base, items, exalts, buffs, color-coded.
- [ ] Hovering reveals each source's value.

## Calculation steps

- [ ] "Show calculation" expands to a numbered list of per-shot steps.
- [ ] Operands and result are monospaced.
- [ ] Notes appear as italic subtext below their step.

## Scenario panel (per build)

- [ ] When "Custom" is off, controls are disabled and read from global.
- [ ] When "Custom" is on, all controls become live.
- [ ] Toggling "Custom" preserves current values.

## Graphs

- [ ] DPS-vs-defense chart renders an amber line with a vertical line at the current target def.
- [ ] Hover shows DPS at the hovered defense value.

## Keyboard

- [ ] ⌘/Ctrl+S saves the build.
- [ ] Esc closes any open drawer.
- [ ] `?` opens the shortcuts overlay.
