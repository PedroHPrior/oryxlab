import type { Item, ItemType, Rarity } from "../comparator/types"

export type CatalogViewMode = "cards" | "list" | "sets"

export type SortKey =
  | "name-asc"
  | "name-desc"
  | "tier-desc"
  | "tier-asc"
  | "dps-desc"
  | "recent"

export interface CatalogItem extends Item {
  tierNumeric: number
  dropsFrom: string[]
  lore: string
  owned: boolean
}

export interface ItemSet {
  id: string
  name: string
  classId: string | null
  items: string[]
  setBonus: string
  /** Parsed stat bonus applied when all `items` are equipped. */
  setBonusStats?: Partial<Record<"att" | "dex" | "wis" | "vit" | "spd" | "def" | "hp" | "mp", number>>
  sprite: string
}

export interface DropSource {
  id: string
  name: string
  tier: string
}

export interface StatThreshold {
  stat: string
  min: number
}

export interface CatalogFilters {
  types: ItemType[]
  classes: string[]
  tierMin: number
  tierMax: number
  rarities: Rarity[]
  mechanicsTags: string[]
  statThresholds: StatThreshold[]
}

export interface QuickCompareState {
  open: boolean
  selectedIds: string[]
}

export interface CatalogProps {
  viewMode: CatalogViewMode
  ownedOnly: boolean
  search: string
  sort: SortKey
  filters: CatalogFilters
  items: CatalogItem[]
  itemSets: ItemSet[]
  dropSources: DropSource[]
  tagPalette: string[]
  quickCompare: QuickCompareState

  /** Switch between Cards / List / Sets. */
  onViewModeChange?: (mode: CatalogViewMode) => void
  /** Toggle the owned-only filter. */
  onToggleOwnedOnly?: () => void
  /** Update the search input. */
  onSearchChange?: (q: string) => void
  /** Change the sort order. */
  onSortChange?: (sort: SortKey) => void
  /** Update any filter. */
  onFiltersChange?: (filters: CatalogFilters) => void
  /** Reset all filters to defaults. */
  onClearFilters?: () => void
  /** Toggle an item's selection in Quick Compare. */
  onToggleQuickCompareItem?: (itemId: string) => void
  /** Open the Quick Compare drawer with current selection. */
  onOpenQuickCompare?: () => void
  /** Close Quick Compare. */
  onCloseQuickCompare?: () => void
  /** Open an item's detail panel. */
  onOpenItemDetail?: (itemId: string) => void
  /** Add a single item to the active comparator. */
  onAddItemToComparator?: (itemId: string) => void
  /** Open the Build Editor pre-loaded with this item under a given class. */
  onOpenInEditorWithClass?: (itemId: string, classId: string) => void
}
