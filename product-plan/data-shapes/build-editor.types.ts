import type {
  Build,
  BuildSlots,
  Exaltations,
  Item,
  Scenario,
} from "../comparator/types"

export type StatKey =
  | "att"
  | "dex"
  | "wis"
  | "vit"
  | "spd"
  | "def"
  | "hp"
  | "mp"

export interface BuildEditorBuild extends Build {
  className: string
  notes: string
  scenario: Scenario
}

export interface AlternativeItem {
  id: string
  name: string
  tier: string
  stats: Item["stats"]
  delta: number
  deltaPercent: number
}

export interface AlternativeItemsBySlot {
  weapon?: AlternativeItem[]
  ability?: AlternativeItem[]
  armor?: AlternativeItem[]
  ring?: AlternativeItem[]
  talisman?: AlternativeItem[]
}

export interface StatBreakdown {
  base: number
  items: number
  exalts: number
  buffs: number
  total: number
}

export type StatBreakdownMap = Partial<Record<StatKey, StatBreakdown>>

export interface CalculationStep {
  label: string
  expr: string
  value: number
  unit: string
  note?: string
}

export interface KeyboardShortcut {
  keys: string[]
  label: string
}

export interface BuildEditorProps {
  build: BuildEditorBuild
  items: Item[]
  alternativeItems: AlternativeItemsBySlot
  statBreakdowns: StatBreakdownMap
  calculationSteps: CalculationStep[]
  shortcuts: KeyboardShortcut[]

  /** Return to the comparator with this build's changes applied. */
  onBackToComparator?: () => void
  /** Save the build (in-place) to localStorage. */
  onSave?: () => void
  /** Save the build as a new entry, leaving the original untouched. */
  onSaveAsNew?: () => void
  /** Discard local edits and revert. */
  onDiscard?: () => void
  /** Rename the build inline. */
  onRename?: (name: string) => void
  /** Update notes. */
  onChangeNotes?: (notes: string) => void
  /** Replace the item in a slot. */
  onChangeSlot?: (slot: keyof BuildSlots, itemId: string | null) => void
  /** Update the build's exaltations. */
  onChangeExaltations?: (exaltations: Exaltations) => void
  /** Toggle whether this build uses its own scenario. */
  onToggleCustomScenario?: (useCustom: boolean) => void
  /** Update this build's scenario. */
  onChangeScenario?: (scenario: Scenario) => void
}
