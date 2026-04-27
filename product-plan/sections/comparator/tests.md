# Comparator — UI Behavior Tests

## Empty state

- [ ] Empty state shows three preset CTAs and an "Add build manually" button.
- [ ] Clicking a preset card populates the comparator with starter builds.
- [ ] "Add build" appends an empty slot ready for picking a class.

## Build column

- [ ] Build name is editable inline (click → input, Enter or blur to commit).
- [ ] Each of the 5 slots opens a modal item picker filtered to compatible items for the class.
- [ ] Selecting an item updates DPS and the deltas in other columns within 50ms.
- [ ] Kebab menu has: Open in Editor, Duplicate, Save build, Remove column.
- [ ] "Custom Scenario" toggle reveals per-build scenario controls.

## Delta indicators

- [ ] Leftmost column shows raw values, no deltas.
- [ ] Other columns show value + colored delta (emerald for upgrade, rose for downgrade).
- [ ] All numeric values use tabular figures (monospaced, aligned).

## View modes

- [ ] Cards / Focus / Table segmented control switches the view.
- [ ] Focus mode requires ≥ 2 builds; below that, shows a friendly placeholder.
- [ ] Focus mode renders the DPS-vs-defense chart with two curves overlaid.
- [ ] Focus mode's stat-by-stat diff bar shows both values mirrored from center.
- [ ] Table view highlights the best value per row in emerald.

## Sharing

- [ ] "Share" button copies a URL with comparator state to the clipboard.
- [ ] Loading the shared URL restores the comparator state.

## Mobile

- [ ] Cards stack vertically on < 640px.
- [ ] Table view becomes horizontally scrollable on small screens.
- [ ] Slot picker becomes a bottom sheet on mobile.
