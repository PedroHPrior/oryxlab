import type { BuildSlots } from "../comparator/types"

export type OptimizerMode = "bis" | "inventory" | "constraints"
export type ObjectiveId = "max-dps" | "max-ehp" | "balanced"
export type ConstraintOp = "gte" | "lte" | "eq"
export type ConstraintRule =
  | "max-uts"
  | "max-st-pieces"
  | "weapon-type"

export interface OptimizerClass {
  id: string
  name: string
  portraitColor: string
  imageUrl?: string
}

export interface Objective {
  id: ObjectiveId
  label: string
  description: string
}

export interface StatConstraint {
  id: string
  kind: "stat"
  stat: string
  op: ConstraintOp
  value: number
}

export interface RuleConstraint {
  id: string
  kind: "rule"
  rule: ConstraintRule
  value: number | string | null
}

export type Constraint = StatConstraint | RuleConstraint

export interface ConstraintPaletteEntry {
  kind: "stat" | "rule"
  stat?: string
  rule?: ConstraintRule
  label: string
  default: number | string | null
}

export type SlotLocks = Record<keyof BuildSlots, string | null>

export interface OptimizationRequest {
  classId: string
  mode: OptimizerMode
  objective: ObjectiveId
  slotLocks: SlotLocks
  constraints: Constraint[]
  ownedItemsCount: number
}

export interface ResultDerivedStats {
  dps: number
  ehp: number
  att: number
  dex: number
  wis: number
  def: number
  hp: number
  mp: number
  spd: number
  vit: number
}

export interface SwapSuggestion {
  slot: keyof BuildSlots
  to: string
  deltaDps: number
  deltaEhp: number
  label: string
}

export interface OptimizationResult {
  rank: number
  id: string
  name: string
  classId: string
  score: number
  scoreLabel: string
  slots: BuildSlots
  derivedStats: ResultDerivedStats
  explanations: string[]
  swapSuggestions: SwapSuggestion[]
  lockedSlots: (keyof BuildSlots)[]
}

export interface OptimizerProps {
  request: OptimizationRequest
  classes: OptimizerClass[]
  objectives: Objective[]
  constraintPalette: ConstraintPaletteEntry[]
  results: OptimizationResult[]
  isRunning: boolean
  lastRunDuration?: number

  /** Pick the active class. */
  onSelectClass?: (classId: string) => void
  /** Switch the optimizer mode. */
  onSelectMode?: (mode: OptimizerMode) => void
  /** Pick the optimization objective. */
  onSelectObjective?: (objective: ObjectiveId) => void
  /** Lock or unlock a slot to a specific item. */
  onSetSlotLock?: (slot: keyof BuildSlots, itemId: string | null) => void
  /** Add a new constraint. */
  onAddConstraint?: (entry: ConstraintPaletteEntry) => void
  /** Update an existing constraint's value. */
  onUpdateConstraintValue?: (
    constraintId: string,
    value: number | string,
  ) => void
  /** Remove a constraint by id. */
  onRemoveConstraint?: (constraintId: string) => void
  /** Run the optimization. */
  onRun?: () => void
  /** Send a result to the comparator as a new column. */
  onSendResultToComparator?: (resultId: string) => void
  /** Open a result in the Build Editor. */
  onOpenResultInEditor?: (resultId: string) => void
  /** Save a result as a Saved Build. */
  onSaveResult?: (resultId: string) => void
  /** Apply a swap suggestion to a result. */
  onApplySwapSuggestion?: (resultId: string, slot: keyof BuildSlots) => void
  /** Navigate user to populate Inventory. */
  onGoToInventory?: () => void
}
