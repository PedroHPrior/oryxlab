# Milestone 6 — Inventory

## Goal

Opt-in screen for marking owned items. Two paths: manual selection (browse catalog with checkboxes) or RealmEye profile import.

## Files in this package

- `sections/inventory/InventoryView.tsx`
- `sections/inventory/components/OwnedSummaryCards.tsx` — 5 cards (Weapons, Abilities, Armors, Rings, Talismans) with progress bars
- `sections/inventory/components/RealmEyeImportPanel.tsx` — modal stepper (enter username → preview → confirm)
- `sections/inventory/data.json` — empty + populated states + RealmEye preview sample
- `data-shapes/inventory.types.ts` — `InventoryEntry`, `RealmEyeImportState`, `OwnedSummary`, `InventoryProps`

## States

- **Empty** — hero with two CTAs (Manual / RealmEye)
- **Populated** — header + summary cards + grouped owned list + bulk actions footer

## Steps

1. Empty state is the first paint when localStorage is empty.
2. Manual mode opens the catalog in selection mode — same UI as Catalog Cards view but with persistent checkboxes.
3. RealmEye import is a 3-step modal:
   - Step 1: text input for username or full profile URL
   - Step 2: preview with vault count, character cards, and a delta indicator (+182 / −14 / =21)
   - Step 3: choose "Merge with current" or "Overwrite all", then commit
4. Populated view groups owned items by type (Weapons, Abilities, Armors, Rings, Talismans).
5. Bulk actions footer: Export JSON, Import JSON, Remove all.
6. RealmEye fetch in production: server-side proxy or a serverless function to avoid CORS. (RealmEye doesn't have a public CORS-friendly API.)

## Tests

- Empty state's two CTAs both navigate or open the right flow.
- RealmEye preview shows the delta in colored numbers.
- Removing an entry from the owned list updates the summary cards.
- Export JSON downloads a valid file; Import JSON validates schema before applying.
- Inventory data persists across page reload via localStorage.
