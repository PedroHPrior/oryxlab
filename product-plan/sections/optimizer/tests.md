# Optimizer — UI Behavior Tests

## Class picker

- [ ] 16 classes render in a tile grid.
- [ ] Selected class has an amber border and tinted background.
- [ ] Class portrait initials reflect the class name.

## Mode tabs

- [ ] "Best in Slot", "With My Inventory", "With Constraints" segmented control.
- [ ] Switching mode preserves class and objective selection.

## Objectives

- [ ] Three full-width objective cards (Max DPS / Max EHP / Balanced).
- [ ] Selected card has an amber ring and "Selected" badge.

## Inventory mode

- [ ] If inventory is empty, shows CTA "Set up Inventory" linking to /inventory.
- [ ] If populated, shows the count: "You own N items" with a manage link.

## Constraints mode

- [ ] Constraint palette is grouped (Stats / Item rules).
- [ ] Clicking a palette chip adds an active constraint chip with editable value.
- [ ] Active constraints have inline numeric input and a remove (×) button.

## Run

- [ ] "Run optimization" button shows a 200–600ms loader.
- [ ] During run, the button is disabled and shows "Running…".
- [ ] After run, "Last run · Nms" appears next to the button.

## Results

- [ ] Up to 5 ranked result cards.
- [ ] Rank badge (1, 2, 3…) is amber-filled.
- [ ] Each card shows score, slots, derived stats, explanations, swap suggestions.
- [ ] Locked slots have a "Locked" pill.
- [ ] Swap suggestions are color-coded chips (emerald for positive, rose for negative).
- [ ] "Send to comparator" navigates to / with the result loaded.
- [ ] "Editor" navigates to /editor/:id.

## Empty state

- [ ] Before running, shows a placeholder hinting at "Pick a class, mode, and objective — then hit Run".
