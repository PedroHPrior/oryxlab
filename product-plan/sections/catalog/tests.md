# Catalog — UI Behavior Tests

## Filters

- [ ] All filters in the rail apply within 200ms.
- [ ] Active filters are reflected in the result count in the header.
- [ ] "Clear" per section resets only that section.
- [ ] Top-level "Clear" button resets all filters.

## Search

- [ ] Search input filters by item name (case-insensitive, substring match).
- [ ] `/` shortcut focuses the search input.

## View modes

- [ ] Cards (default), List, Sets toggle preserves filters.
- [ ] Cards view: 2 cols on mobile, up to 5 cols on xl.
- [ ] List view: dense rows with sprite, name, stats inline, "Compare" button.
- [ ] Sets view: each ST set as a horizontal card with all 4 items.

## Owned only

- [ ] Toggle is disabled when inventory is empty.
- [ ] When enabled, only items with `owned: true` are shown.

## Quick Compare

- [ ] Hovering a card reveals the multi-select checkbox in the corner.
- [ ] Selecting items shows a floating "Compare selected (n) →" pill.
- [ ] Clicking the pill opens a bottom-sheet drawer with all selected items as columns.

## Detail

- [ ] Clicking a card opens a detail panel (or expands inline) with full stats and lore.
- [ ] "Compare with…" CTA opens a follow-up picker.

## Empty state

- [ ] When no items match, an empty state with "Clear filters" link appears.

## Mobile

- [ ] Filter rail collapses behind a "Filters" sheet button.
- [ ] Cards become a single column.
