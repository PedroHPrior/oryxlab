import { createContext, useContext } from "react"
import type {
  Build,
  ComparatorProps,
  Item,
  Scenario,
  ViewMode,
} from "../../product/sections/comparator/types"
import type { CatalogProps, CatalogFilters, CatalogViewMode, QuickCompareState, SortKey, ItemSet } from "../../product/sections/catalog/types"
import type { OptimizerMode, ObjectiveId, OptimizationRequest, ConstraintPaletteEntry } from "../../product/sections/optimizer/types"
import type { InventoryView as InventoryViewMode, RealmEyeImportState, ManualSelectionState, OwnedSummary, InventoryEntry } from "../../product/sections/inventory/types"
import type { ApiClass } from "./api"

export interface OryxLabState {
  // Catalog data (from API)
  itemsLoading: boolean
  itemsError: string | null
  items: Item[]
  classesData: ApiClass[]
  itemSets: ItemSet[]

  // Comparator
  comparatorViewMode: ViewMode
  builds: Build[]
  globalScenario: Scenario

  // Catalog
  catalogViewMode: CatalogViewMode
  catalogOwnedOnly: boolean
  catalogSearch: string
  catalogSort: SortKey
  catalogFilters: CatalogFilters
  catalogQuickCompare: QuickCompareState

  // Optimizer
  optimizerRequest: OptimizationRequest
  optimizerIsRunning: boolean

  // Inventory
  inventoryView: InventoryViewMode
  inventorySearch: string
  inventoryOwnedSummary: OwnedSummary
  inventoryOwnedEntries: InventoryEntry[]
  realmEyeImport: RealmEyeImportState
  manualSelection: ManualSelectionState
}

export interface OryxLabActions {
  setComparatorViewMode: (mode: ViewMode) => void
  setGlobalScenario: (scenario: Scenario) => void
  applyScenarioPreset: (presetId: string) => void

  changeBuildSlot: ComparatorProps["onChangeBuildSlot"]
  renameBuild: ComparatorProps["onRenameBuild"]
  toggleCustomScenario: ComparatorProps["onToggleCustomScenario"]
  changeBuildScenario: ComparatorProps["onChangeBuildScenario"]
  changeExaltations: ComparatorProps["onChangeExaltations"]
  changeBuildNotes: (buildId: string, notes: string) => void
  replaceBuild: (buildId: string, snapshot: Build) => void
  duplicateBuild: ComparatorProps["onDuplicateBuild"]
  removeBuild: ComparatorProps["onRemoveBuild"]
  saveBuild: ComparatorProps["onSaveBuild"]
  addBuild: () => void
  addBuildWithItem: (itemId: string) => void
  addBuildFromSlots: (classId: string, slots: import("../../product/sections/comparator/types").BuildSlots, name: string) => void
  saveOptimizerResult: (classId: string, slots: import("../../product/sections/comparator/types").BuildSlots, name: string) => void
  applySwapToBuild: (buildId: string, slot: keyof import("../../product/sections/comparator/types").BuildSlots, itemId: string) => void
  exportInventoryJson: () => void
  importInventoryJson: (file: File) => Promise<void>
  applyStarterCard: (cardId: string) => void

  setCatalogViewMode: (mode: CatalogViewMode) => void
  toggleCatalogOwnedOnly: () => void
  setCatalogSearch: (q: string) => void
  setCatalogSort: (s: SortKey) => void
  setCatalogFilters: CatalogProps["onFiltersChange"]
  clearCatalogFilters: () => void
  toggleQuickCompareItem: (itemId: string) => void
  openQuickCompare: () => void
  closeQuickCompare: () => void

  setOptimizerClass: (classId: string) => void
  setOptimizerMode: (mode: OptimizerMode) => void
  setOptimizerObjective: (objective: ObjectiveId) => void
  addOptimizerConstraint: (entry: ConstraintPaletteEntry) => void
  updateOptimizerConstraint: (id: string, value: number | string) => void
  removeOptimizerConstraint: (id: string) => void
  runOptimizer: () => void

  setInventoryView: (view: InventoryViewMode) => void
  setInventorySearch: (q: string) => void
  openManualSelect: () => void
  openRealmEyeImport: () => void
  changeRealmEyeInput: (value: string) => void
  fetchRealmEyePreview: () => void
  confirmRealmEyeOverwrite: () => void
  confirmRealmEyeMerge: () => void
  closeRealmEyeImport: () => void
  removeInventoryEntry: (itemId: string) => void
  addInventoryEntry: (itemId: string) => void
  createBuildFromCharacter: (
    classId: string,
    equipped: Array<{ slug: string; name: string }>,
  ) => void
  clearInventory: () => void

  // Constraint applied across constraints array
  // Constraint applied across array index
  setOpenSavedBuildsDrawer: (open: boolean) => void
  isSavedBuildsOpen: boolean
  shareComparator: () => void

  navigateToEditor: (buildId: string) => void
  navigateToInventory: () => void
}

export interface OryxLabContextValue {
  state: OryxLabState
  actions: OryxLabActions
}

export const OryxLabContext = createContext<OryxLabContextValue | null>(null)

export function useOryxLab(): OryxLabContextValue {
  const ctx = useContext(OryxLabContext)
  if (!ctx) throw new Error("useOryxLab must be used inside <OryxLabApp />")
  return ctx
}
