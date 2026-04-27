import type { ItemType } from "../comparator/types"

export type InventoryView = "empty" | "populated" | "manual-select"

export type RealmEyeImportStep = "enter-username" | "preview" | "confirmed"

export interface InventoryEntry {
  itemId: string
  name: string
  tier: string
  type: ItemType
  sprite: string
  addedAt: string
  imageUrl?: string
}

export interface OwnedSummaryEntry {
  owned: number
  total: number
}

export type OwnedSummary = Record<ItemType, OwnedSummaryEntry>

export interface RealmEyeCharacter {
  id: string
  classId: string
  className: string
  /** Items currently equipped on this character — slug + display name as
   * RealmEye returns. The catalog map them to local item ids. */
  equippedItems: Array<string | null | { slug: string; name: string }>
}

export interface RealmEyeImportDelta {
  added: number
  removed: number
  unchanged: number
}

export interface RealmEyeImportPreview {
  username: string
  vaultCount: number
  characterCount: number
  characters: RealmEyeCharacter[]
  delta: RealmEyeImportDelta
}

export interface RealmEyeImportState {
  open: boolean
  step: RealmEyeImportStep
  input: string
  preview: RealmEyeImportPreview | null
  /** Raw items returned by the proxy — kept until confirm so we can persist them. */
  pendingItems?: { slug: string; name: string; imageUrl?: string }[]
}

export interface ManualSelectionState {
  open: boolean
  pendingAdds: string[]
  pendingRemoves: string[]
}

export interface InventoryProps {
  view: InventoryView
  search: string
  ownedSummary: OwnedSummary
  ownedEntries: InventoryEntry[]
  realmEyeImport: RealmEyeImportState
  manualSelection: ManualSelectionState

  /** Switch between empty / populated / manual-select views. */
  onSwitchView?: (view: InventoryView) => void
  /** Update the inline search query. */
  onSearchChange?: (q: string) => void

  /** Open the manual selection mode (catalog with checkboxes). */
  onOpenManualSelect?: () => void
  /** Toggle a single item in manual selection mode. */
  onToggleManualItem?: (itemId: string) => void
  /** Commit pending manual selection changes. */
  onCommitManualChanges?: () => void
  /** Cancel manual selection without saving. */
  onCancelManualChanges?: () => void

  /** Open the RealmEye import drawer. */
  onOpenRealmEyeImport?: () => void
  /** Update the RealmEye username/URL input. */
  onChangeRealmEyeInput?: (value: string) => void
  /** Fetch a preview from RealmEye. */
  onFetchRealmEyePreview?: () => void
  /** Confirm an import — overwrite the existing inventory. */
  onConfirmRealmEyeOverwrite?: () => void
  /** Confirm an import — merge with the existing inventory. */
  onConfirmRealmEyeMerge?: () => void
  /** Close the RealmEye import drawer. */
  onCloseRealmEyeImport?: () => void

  /** Remove a single owned entry. */
  onRemoveEntry?: (itemId: string) => void
  /** Remove every owned entry (with confirmation in the UI). */
  onClearAll?: () => void
  /** Export inventory as a JSON file. */
  onExport?: () => void
  /** Import inventory from a JSON file. */
  onImport?: () => void
}
