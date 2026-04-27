# Inventory Specification

## Overview
The Inventory is an opt-in screen where the user records which items they own. It feeds the Optimizer's "With My Inventory" mode and powers the optional "Owned only" filter elsewhere in the app. v1 is a binary toggle (own / don't own) — quantities are not tracked. Data persists in localStorage. Users can also import their public RealmEye profile (vault + characters) to populate the inventory automatically.

## User Flows
- Land on Inventory empty state → see two paths: "Mark items I own" (manual) and "Import from RealmEye" (URL or username)
- Manual mode → opens the catalog inline in selection mode → user toggles checkboxes on items they own → "Save (n)" button at the bottom commits to localStorage
- RealmEye import → input field accepts username or full profile URL → "Fetch" button runs preview → preview shows items grouped by source (Vault, Char 1, Char 2…) with counts → "Import & overwrite" / "Import & merge" / "Cancel" buttons → on confirm, inventory updates
- Inventory populated state → list of owned items grouped by type (Weapons, Abilities, Armors, Rings, Talismans), each with sprite + name + tier + tier badge + remove (×)
- Search and filter by type/class/tier inside the populated view
- Bulk actions: "Remove all", "Export inventory as JSON", "Import JSON"
- Re-import from RealmEye anytime — preview shows what will change vs current inventory before confirming

## UI Requirements
- Empty state: centered hero with two large CTA cards side by side (Manual / RealmEye), 56% / 44% width on desktop, stacked on mobile
- RealmEye import flow has 3 steps shown as a stepper (Enter username → Preview → Confirm)
- Preview view: shows total count, per-character breakdown (with class portrait), and a delta indicator vs current ("+182 new, 14 removed, 21 unchanged")
- Manual selection mode: same UI as Catalog Cards view but with persistent checkbox overlay; selected count badge in the sticky header; "Save" button is amber-400 when there are pending changes
- Populated view: section dividers per item type, each section collapsible with item count; rows are dense (32×32 sprite + name + tier badge + remove ×)
- Stats summary at top of populated view: 5 small cards (Weapons 87, Abilities 42, Armors 38, Rings 51, Talismans 12) with progress vs catalog total ("87 / 240 weapons owned")
- Sticky footer on populated view with bulk actions
- All state changes update the Optimizer's "owned items count" badge in real time
- Toast/inline confirmation when import succeeds
- Mobile: stats summary becomes a horizontal scrollable strip; bulk actions move into a kebab menu; section dividers stay sticky

## Configuration
- shell: true
