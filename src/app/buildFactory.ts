import type {
  Build,
  BuildSlots,
  DerivedStats,
  Exaltations,
} from "../../product/sections/comparator/types"

const ZERO_EXALTS: Exaltations = {
  att: 0, dex: 0, wis: 0, vit: 0, spd: 0, def: 0, hp: 0, mp: 0,
}

const ZERO_SLOTS: BuildSlots = {
  weapon: null, ability: null, armor: null, ring: null,
}

const ZERO_DERIVED: DerivedStats = {
  dps: 0, dpsAtZeroDef: 0, ehp: 0,
  att: 0, dex: 0, spd: 0, vit: 0, wis: 0, def: 0, hp: 0, mp: 0,
  timeToKill1k: 0, dpsCurve: [],
}

interface MakeEmptyBuildInput {
  classId: string
  color: string
  /** Override the generated id; useful for snapshot tests. */
  id?: string
  /** Override the default "New build" name. */
  name?: string
}

/**
 * Produce a fresh comparator build column with no items, zero exaltations,
 * and the global scenario active. Returned by the "+ Add build" action so
 * users get a clean slate instead of a pre-filled Wizard preset that they
 * have to clear before customizing.
 *
 * Surfaced from a r/RotMG launch-thread comment: "shouldn't a new build
 * be blank instead of a preset with gear and exalts already pre-configured?"
 */
export function makeEmptyBuild(input: MakeEmptyBuildInput): Build {
  return {
    id: input.id ?? `build-new-${Date.now()}`,
    name: input.name ?? "New build",
    classId: input.classId,
    color: input.color,
    tags: [],
    slots: { ...ZERO_SLOTS },
    exaltations: { ...ZERO_EXALTS },
    useCustomScenario: false,
    derivedStats: { ...ZERO_DERIVED, dpsCurve: [] },
  }
}
