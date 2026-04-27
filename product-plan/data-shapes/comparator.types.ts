export type WeaponType =
  | "wand"
  | "staff"
  | "bow"
  | "sword"
  | "dagger"
  | "katana"
  | "lute"

export type AbilityType =
  | "spell"
  | "tome"
  | "quiver"
  | "skull"
  | "cloak"
  | "helm"
  | "seal"
  | "wakizashi"
  | "prism"
  | "scepter"
  | "orb"
  | "star"
  | "trap"

export type ArmorType = "robe" | "leather" | "heavy"

export type ItemType = "weapon" | "ability" | "armor" | "ring" | "talisman"

export type Rarity = "tiered" | "ut" | "st" | "talisman"

export type StatusEffectId = "armorBroken" | "bleeding" | "exposed" | "cursed"

export type PartyBuffId =
  | "paladinSeal"
  | "warriorHelm"
  | "mysticCurse"
  | "bardInspire"
  | "bardCrescendo"
  | "bardEncore"

export type ViewMode = "cards" | "focus" | "table"

export interface PlayerClass {
  id: string
  name: string
  portraitColor: string
  weaponType: WeaponType
  abilityType: AbilityType
  armorType: ArmorType
}

export interface ItemStats {
  dmgMin?: number
  dmgMax?: number
  shotsPerSec?: number
  shots?: number
  mpCost?: number
  dmg?: number
  def?: number
  att?: number
  dex?: number
  spd?: number
  vit?: number
  wis?: number
  hp?: number
  mp?: number
}

export interface Item {
  id: string
  name: string
  tier: string
  rarity: Rarity
  type: ItemType
  weaponType?: WeaponType
  abilityType?: AbilityType
  classes: string[]
  stats: ItemStats
  tags: string[]
  sprite: string
}

export interface BuildSlots {
  weapon: string | null
  ability: string | null
  armor: string | null
  ring: string | null
  talisman: string | null
}

export interface Exaltations {
  att: number
  dex: number
  wis: number
  vit: number
  spd: number
  def: number
  hp: number
  mp: number
}

export interface Scenario {
  presetId: string | null
  targetDefense: number
  targetStatuses: StatusEffectId[]
  partyBuffs: PartyBuffId[]
}

export interface ScenarioPreset extends Scenario {
  id: string
  label: string
}

export interface DerivedStats {
  dps: number
  dpsAtZeroDef: number
  ehp: number
  att: number
  dex: number
  spd: number
  vit: number
  wis: number
  def: number
  hp: number
  mp: number
  timeToKill1k: number
  dpsCurve: number[]
}

export interface Build {
  id: string
  name: string
  classId: string
  color: string
  tags: string[]
  slots: BuildSlots
  exaltations: Exaltations
  useCustomScenario: boolean
  scenarioOverride?: Scenario
  derivedStats: DerivedStats
}

export interface SavedBuildSnapshot {
  id: string
  name: string
  classId: string
  dps: number
  lastModified: string
  tags: string[]
}

export interface PresetStarterCard {
  id: string
  title: string
  subtitle: string
  icon: string
}

export interface ComparatorProps {
  viewMode: ViewMode
  globalScenario: Scenario
  scenarioPresets: ScenarioPreset[]
  classes: PlayerClass[]
  items: Item[]
  builds: Build[]
  savedBuildSnapshots: SavedBuildSnapshot[]
  presetStarterCards: PresetStarterCard[]

  /** Switch between cards / focus / table views. */
  onViewModeChange?: (mode: ViewMode) => void
  /** Update global scenario from inside a column or top control. */
  onGlobalScenarioChange?: (scenario: Scenario) => void
  /** Apply a scenario preset by id. */
  onSelectScenarioPreset?: (presetId: string) => void
  /** Add a new build column (empty / starter). */
  onAddBuild?: () => void
  /** Apply a starter preset card. */
  onApplyStarterCard?: (cardId: string) => void
  /** Replace the item in a slot for a given build. */
  onChangeBuildSlot?: (
    buildId: string,
    slot: keyof BuildSlots,
    itemId: string | null,
  ) => void
  /** Edit a build's name. */
  onRenameBuild?: (buildId: string, name: string) => void
  /** Toggle whether a build uses its own scenario or the global one. */
  onToggleCustomScenario?: (buildId: string, useCustom: boolean) => void
  /** Update a build's per-build scenario override. */
  onChangeBuildScenario?: (buildId: string, scenario: Scenario) => void
  /** Update a build's exaltations. */
  onChangeExaltations?: (buildId: string, exaltations: Exaltations) => void
  /** Reorder columns. */
  onReorderBuilds?: (orderedIds: string[]) => void
  /** Duplicate a build column. */
  onDuplicateBuild?: (buildId: string) => void
  /** Remove a build column. */
  onRemoveBuild?: (buildId: string) => void
  /** Open a build in the full-screen Build Editor. */
  onOpenInEditor?: (buildId: string) => void
  /** Save a build to localStorage. */
  onSaveBuild?: (buildId: string) => void
  /** Load a saved build snapshot into a column slot. */
  onLoadSavedBuild?: (snapshotId: string) => void
  /** Copy share link for the current comparator state. */
  onShareComparator?: () => void
  /** Pick from focus mode. */
  onSetFocusBuilds?: (a: string, b: string) => void
}
