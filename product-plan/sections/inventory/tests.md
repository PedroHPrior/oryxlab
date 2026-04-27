# Inventory — UI Behavior Tests

## Empty state

- [ ] Two CTA cards: "Mark items I own" (manual) and "Import from RealmEye".
- [ ] Manual CTA opens the catalog in selection mode.
- [ ] RealmEye CTA opens the import modal at step 1.

## Manual selection mode

- [ ] Catalog displays with persistent checkboxes on each card.
- [ ] Selected count badge appears in the sticky header.
- [ ] "Save (n)" button is amber when there are pending changes.
- [ ] Cancel discards pending changes.

## RealmEye import

- [ ] Step 1: text input for username or full URL; "Fetch preview" button is disabled until input is non-empty.
- [ ] Step 2: shows username, vault count, character count, list of characters with class portraits.
- [ ] Delta indicators (+added / −removed / =unchanged) are color-coded.
- [ ] Two confirm buttons: "Merge with current" and "Overwrite all".
- [ ] Step 3: confirmation checkmark, modal closes after a short delay.

## Populated view

- [ ] Owned summary cards (5 types) with progress bars.
- [ ] Items grouped by type, each section collapsible.
- [ ] Each row: sprite, name, tier badge, "added on" date, remove (×) button.

## Bulk actions

- [ ] Footer with Export JSON / Import JSON / Remove all.
- [ ] Export downloads a valid JSON file.
- [ ] Import validates schema before applying.
- [ ] Remove all asks for confirmation.

## Persistence

- [ ] Inventory data persists across page reload via localStorage.
- [ ] Removing entries updates the summary cards immediately.
- [ ] The Optimizer's "owned items count" badge updates in real time.
