import type {
  Build,
  BuildSlots,
  DerivedStats,
  Exaltations,
  Item,
  Scenario,
} from "../../product/sections/comparator/types"
import type { ItemSet } from "../../product/sections/catalog/types"
import balance from "../../product/data/balance.json"

export interface PlayerClassDef {
  id: string
  stats: Record<string, { base: number; cap: number; atMax: number }>
}

export interface ComputeInput {
  build: Build
  scenario: Scenario
  classDef: PlayerClassDef
  itemMap: Map<string, Item>
  /** Optional set definitions used to apply set bonuses when full sets are equipped. */
  itemSets?: ItemSet[]
}

const EXALT_GAIN: Record<keyof Exaltations, number> = {
  hp: 5, mp: 5, att: 1, def: 1, spd: 1, dex: 1, vit: 1, wis: 1,
}

const STAT_KEYS: (keyof Exaltations)[] = ["hp", "mp", "att", "def", "spd", "dex", "vit", "wis"]

// Tunable balance constants live in product/data/balance.json so they can
// be iterated on without touching engine code. Edit them there; tests pin
// today's values to detect accidental changes.
const STATUS_DAMAGE_TAKEN: Record<string, number> = balance.statusDamageTaken

// Weapon-applied debuffs auto-amplify DPS even if scenario has no statuses set.
// Modeled as `uptime × damage-taken-bonus` since most procs have ~50–60% uptime
// in sustained combat. Armor-Broken is handled separately via def bypass.
//
// Tags appear in two forms in the corpus:
//   - new prefixed form from the proc scraper: "inflicts-cursed"
//   - legacy bare form from the catalog scrape: "curse"
// Both map to the same scenario status they imply.
const WEAPON_INFLICT_BONUS: Record<string, number> = balance.weaponInflictBonus

// Map status-implying tags onto the scenario status id used by the rest of the engine.
// Used to avoid double-counting when the scenario already includes a status.
const TAG_TO_SCENARIO_STATUS: Record<string, string> = {
  "inflicts-exposed": "exposed",
  exposed: "exposed",
  "inflicts-cursed": "cursed",
  "inflicts-curse": "cursed",
  curse: "cursed",
  cursed: "cursed",
  "inflicts-bleeding": "bleeding",
  bleeding: "bleeding",
}

// Self-buffs from weapons/abilities modeled as small DPS multipliers, since they
// have limited uptime tied to procs (~25–35% uptime).
// Both prefixed (`self-berserk`) and legacy bare (`berserk`) tag forms map here.
const WEAPON_SELF_BUFF_DPS: Record<string, number> = balance.weaponSelfBuffDps

// Party buffs on caster — multiplicative damage-dealt bonus
// Modeled as effective_uptime × peak_bonus (e.g. Bard Crescendo peaks +20% but cycles ~60% uptime)
const PARTY_BUFF_DAMAGE_DEALT: Record<string, number> = balance.partyBuffDamageDealt

const PARTY_BUFF_FLAT_STATS: Record<string, Partial<Record<keyof Exaltations, number>>> = {
  paladinSeal: { att: 8, def: 0 },
  warriorHelm: { att: 12, dex: 12 },
  bardInspire: { dex: 8 },
  bardCrescendo: { att: 6, dex: 6 },
  bardEncore: { att: 12, dex: 12 },
}

// Per-class DPS modifiers — captures class-unique mechanics that aren't reflected in
// equipped item stats alone.
//
//  - Trickster Prism: clone fires its own shots, effectively ~1.6x weapon DPS while active
//  - Summoner: minion provides additional flat DPS source (modeled as +0.4x)
//  - Necromancer: skull provides AoE multi-target + lifesteal; for single-target DPS, +0.15x
//  - Samurai: exposed status applied by Honorable Touch ability (already factored as scenario)
//  - Sorcerer: scepter chains lightning, modest ranged advantage in groups (+0.10x for AoE-ish)
//  - Bard: lute is bow-like but main role is buffer; weaker DPS modeled by lower base RoF
const CLASS_DPS_MULT: Record<string, number> = balance.classDpsMultiplier

// AoE multiplier when weapon is AoE — assumes 2-3 enemies hit on average
const AOE_MULT = 1.6

// Hit rate factor: weapons with very short range (under 5 tiles) get reduced effective DPS
// at typical 6-7 tile combat distance. Long-range weapons (8+ tiles) get full DPS.
// Community DPS calculators (NilLY, RealmEye's stat tools, etc.) report
// "max DPS at optimal range" — they don't penalize short-range weapons
// for being short-range. We follow that convention so the comparator
// matches what players see elsewhere; range is shown in the item modal
// for the player to weigh themselves.
function hitRateFactor(weapon: Item): number {
  const range = weapon.stats.range
  if (typeof range !== "number") return 1
  // Only penalize weapons with documented projectile-pattern issues
  // (boomerangs that miss on target shape, etc) — those carry tags.
  return 1
}

// Multi-shot directional weapons (katanas, etc.) only land all bullets on stationary targets.
// We assume 80% effective shots on average for directional weapons.
function multiShotFactor(weapon: Item): number {
  const tags = weapon.tags ?? []
  if (tags.includes("directional")) return 0.80
  return 1
}

// Piercing weapons hit multiple targets in line and boomerangs/parametric shots
// often clip extra mobs in dungeons. For typical mid-game encounters we apply a
// modest multiplier consistent with how AOE_MULT is already baked in.
//   - aoe              → 1.60×  (AoE explosion / circle)
//   - piercing/wavy/parametric/boomerang → 1.10× (occasional 2-target hits)
// "armor piercing" is a different mechanic (def bypass) handled elsewhere.
const MULTI_TARGET_TAGS = ["piercing", "wavy", "parametric", "boomerang"]

function aoeMultiplier(weapon: Item): number {
  const tags = weapon.tags ?? []
  if (tags.includes("aoe")) return AOE_MULT
  if (MULTI_TARGET_TAGS.some((t) => tags.includes(t))) return 1.10
  return 1
}

export interface StatBreakdownEntry {
  base: number
  items: number
  exalts: number
  buffs: number
  total: number
}
export type StatBreakdownResult = Record<keyof Exaltations, StatBreakdownEntry>

/**
 * Like `computeDerivedStats`, but returns the per-stat breakdown (base + items
 * + exalts + buffs) instead of the DPS-focused output. Used by the Build Editor
 * so the "Stat sources" panel reflects the live build accurately.
 */
export function computeStatBreakdown(input: ComputeInput): StatBreakdownResult {
  const { build, scenario, classDef, itemMap, itemSets } = input
  const equipped: Item[] = []
  for (const slot of Object.keys(build.slots) as (keyof BuildSlots)[]) {
    const id = build.slots[slot]
    if (id) {
      const item = itemMap.get(id)
      if (item) equipped.push(item)
    }
  }
  const stats: StatBreakdownResult = {
    hp: { base: classDef.stats.hp?.cap ?? 700, items: 0, exalts: 0, buffs: 0, total: 0 },
    mp: { base: classDef.stats.mp?.cap ?? 252, items: 0, exalts: 0, buffs: 0, total: 0 },
    att: { base: classDef.stats.att?.cap ?? 50, items: 0, exalts: 0, buffs: 0, total: 0 },
    def: { base: classDef.stats.def?.cap ?? 25, items: 0, exalts: 0, buffs: 0, total: 0 },
    spd: { base: classDef.stats.spd?.cap ?? 50, items: 0, exalts: 0, buffs: 0, total: 0 },
    dex: { base: classDef.stats.dex?.cap ?? 50, items: 0, exalts: 0, buffs: 0, total: 0 },
    vit: { base: classDef.stats.vit?.cap ?? 40, items: 0, exalts: 0, buffs: 0, total: 0 },
    wis: { base: classDef.stats.wis?.cap ?? 40, items: 0, exalts: 0, buffs: 0, total: 0 },
  }
  for (const item of equipped) {
    for (const k of STAT_KEYS) {
      const v = (item.stats as Record<string, number | undefined>)[k]
      if (typeof v === "number") stats[k].items += v
    }
  }
  for (const k of STAT_KEYS) {
    const lvl = build.exaltations[k] ?? 0
    stats[k].exalts = lvl * EXALT_GAIN[k]
  }
  for (const buffId of scenario.partyBuffs) {
    const flat = PARTY_BUFF_FLAT_STATS[buffId]
    if (!flat) continue
    for (const k of STAT_KEYS) {
      const v = flat[k]
      if (typeof v === "number") stats[k].buffs += v
    }
  }
  const equippedIds = new Set(equipped.map((it) => it.id))
  for (const set of fullyEquippedSets(equippedIds, itemSets)) {
    if (!set.setBonusStats) continue
    for (const k of STAT_KEYS) {
      const v = set.setBonusStats[k]
      if (typeof v === "number") stats[k].buffs += v
    }
  }
  for (const k of STAT_KEYS) {
    stats[k].total = stats[k].base + stats[k].items + stats[k].exalts + stats[k].buffs
  }
  return stats
}

// Identify which item sets are fully equipped given the equipped item ids.
function fullyEquippedSets(equippedIds: Set<string>, itemSets: ItemSet[] = []): ItemSet[] {
  const out: ItemSet[] = []
  for (const set of itemSets) {
    if (set.items.length === 0) continue
    if (set.items.every((id) => equippedIds.has(id))) out.push(set)
  }
  return out
}

export function computeDerivedStats(input: ComputeInput): DerivedStats {
  const { build, scenario, classDef, itemMap, itemSets } = input

  const equipped: Item[] = []
  for (const slot of Object.keys(build.slots) as (keyof BuildSlots)[]) {
    const id = build.slots[slot]
    if (id) {
      const item = itemMap.get(id)
      if (item) equipped.push(item)
    }
  }

  const stats: Record<keyof Exaltations, { base: number; items: number; exalts: number; buffs: number }> = {
    hp: { base: classDef.stats.hp?.cap ?? 700, items: 0, exalts: 0, buffs: 0 },
    mp: { base: classDef.stats.mp?.cap ?? 252, items: 0, exalts: 0, buffs: 0 },
    att: { base: classDef.stats.att?.cap ?? 50, items: 0, exalts: 0, buffs: 0 },
    def: { base: classDef.stats.def?.cap ?? 25, items: 0, exalts: 0, buffs: 0 },
    spd: { base: classDef.stats.spd?.cap ?? 50, items: 0, exalts: 0, buffs: 0 },
    dex: { base: classDef.stats.dex?.cap ?? 50, items: 0, exalts: 0, buffs: 0 },
    vit: { base: classDef.stats.vit?.cap ?? 40, items: 0, exalts: 0, buffs: 0 },
    wis: { base: classDef.stats.wis?.cap ?? 40, items: 0, exalts: 0, buffs: 0 },
  }

  for (const item of equipped) {
    for (const k of STAT_KEYS) {
      const v = (item.stats as Record<string, number | undefined>)[k]
      if (typeof v === "number") stats[k].items += v
    }
  }

  for (const k of STAT_KEYS) {
    const lvl = build.exaltations[k] ?? 0
    stats[k].exalts = lvl * EXALT_GAIN[k]
  }

  for (const buffId of scenario.partyBuffs) {
    const flat = PARTY_BUFF_FLAT_STATS[buffId]
    if (!flat) continue
    for (const k of STAT_KEYS) {
      const v = flat[k]
      if (typeof v === "number") stats[k].buffs += v
    }
  }

  // Set bonuses: when an entire set is equipped, add its parsed stat bonus.
  // Stored on `stats[k].buffs` so the breakdown surfaces it as a "buff" source.
  const equippedIdSet = new Set(equipped.map((it) => it.id))
  const activeSets = fullyEquippedSets(equippedIdSet, itemSets)
  for (const set of activeSets) {
    if (!set.setBonusStats) continue
    for (const k of STAT_KEYS) {
      const v = set.setBonusStats[k]
      if (typeof v === "number") stats[k].buffs += v
    }
  }

  const totals: Record<keyof Exaltations, number> = {
    hp: stats.hp.base + stats.hp.items + stats.hp.exalts + stats.hp.buffs,
    mp: stats.mp.base + stats.mp.items + stats.mp.exalts + stats.mp.buffs,
    att: stats.att.base + stats.att.items + stats.att.exalts + stats.att.buffs,
    def: stats.def.base + stats.def.items + stats.def.exalts + stats.def.buffs,
    spd: stats.spd.base + stats.spd.items + stats.spd.exalts + stats.spd.buffs,
    dex: stats.dex.base + stats.dex.items + stats.dex.exalts + stats.dex.buffs,
    vit: stats.vit.base + stats.vit.items + stats.vit.exalts + stats.vit.buffs,
    wis: stats.wis.base + stats.wis.items + stats.wis.exalts + stats.wis.buffs,
  }

  const weapon = equipped.find((i) => i.type === "weapon")
  const ability = equipped.find((i) => i.type === "ability")

  const dpsCurve = new Array(17).fill(0)
  let dpsAtZeroDef = 0
  let dpsAtScenarioDef = 0
  let totalAoeMult = 1

  // Modifiers that depend only on stats / scenario / class apply whether or not
  // a weapon is equipped, so we can show ability-only DPS for a build with a
  // damaging spell/skull/quiver but no weapon.
  if (weapon || ability) {
    const effectiveAtt = Math.min(totals.att, 150)
    // Real RotMG damage multiplier is 0.5 + ATT/50 — attack 0 still deals
    // 0.5× weapon damage, attack 50 deals 1.5×, attack 100 deals 2.5×.
    // Previous version omitted the 0.5 baseline → engine systematically
    // under-reported all weapon DPS by ~28% on maxed-stat builds.
    const attMod = 0.5 + effectiveAtt / 50
    const classMult = CLASS_DPS_MULT[build.classId] ?? 1.0

    // Tag bag includes weapon + ability tags so self-buffs / inflicts apply
    // regardless of which slot supplies them.
    const itemTagBag = new Set<string>([
      ...(weapon?.tags ?? []),
      ...(ability?.tags ?? []),
    ])

    // Buff multiplier (multiplicative)
    let buffMult = 1
    for (const buffId of scenario.partyBuffs) {
      buffMult *= 1 + (PARTY_BUFF_DAMAGE_DEALT[buffId] ?? 0)
    }
    const seenSelfBuffs = new Set<string>()
    for (const tag of itemTagBag) {
      const selfBonus = WEAPON_SELF_BUFF_DPS[tag]
      if (typeof selfBonus === "number" && selfBonus > 0) {
        const canon = tag.replace(/^self-/, "")
        if (seenSelfBuffs.has(canon)) continue
        seenSelfBuffs.add(canon)
        buffMult *= 1 + selfBonus
      }
    }

    // Status multiplier (additive damage-taken)
    let statusMult = 1
    const appliedStatuses = new Set<string>(scenario.targetStatuses)
    for (const statusId of scenario.targetStatuses) {
      statusMult += STATUS_DAMAGE_TAKEN[statusId] ?? 0
    }
    for (const tag of itemTagBag) {
      const statusName = TAG_TO_SCENARIO_STATUS[tag]
      if (statusName && appliedStatuses.has(statusName)) continue
      const weaponBonus = WEAPON_INFLICT_BONUS[tag]
      if (typeof weaponBonus === "number" && weaponBonus > 0) {
        statusMult += weaponBonus
        if (statusName) appliedStatuses.add(statusName)
      }
    }

    const armorBroken =
      scenario.targetStatuses.includes("armorBroken") ||
      itemTagBag.has("inflicts-armorbroken") ||
      itemTagBag.has("inflicts-armor-broken") ||
      itemTagBag.has("armor broken") ||
      itemTagBag.has("armor-broken")

    // Weapon DPS function (returns 0 if no weapon equipped)
    let computeWeaponAtDef: (def: number) => number = () => 0
    if (weapon) {
      const wStats = weapon.stats
      const dmgMin = wStats.dmgMin ?? 0
      const dmgMax = wStats.dmgMax ?? 0
      const baseAvgDmg = (dmgMin + dmgMax) / 2
      const baseShotsPerSec = wStats.shotsPerSec ?? estimateRoF(weapon)
      const rateOfFireMod = wStats.rateOfFireMod ?? 1
      const shotCount = wStats.shots ?? 1
      const tags = weapon.tags ?? []
      const armorPiercing =
        tags.includes("armor-piercing") || tags.includes("armor piercing") ||
        tags.includes("pierces armor") || tags.includes("true damage")

      const effectiveDex = Math.min(totals.dex, 100)
      // Real RotMG rate-of-fire formula: shotsPerSec_multiplier = 1 + DEX/75.
      // DEX 0 fires at the weapon's base RoF (1× baseline), DEX 75 doubles it,
      // DEX 100 caps the engine multiplier at ~2.33×. Previous version had a
      // 0.5 floor at DEX 0 which made low-DEX classes fire at half speed —
      // wrong for every single-class build that hasn't maxed DEX yet.
      const dexMod = 1 + effectiveDex / 75

      const hitRate = hitRateFactor(weapon)
      const multiShot = multiShotFactor(weapon)
      totalAoeMult = aoeMultiplier(weapon)

      const procDamage = (wStats as Record<string, unknown>).procDamage as number | undefined
      const procRate = (wStats as Record<string, unknown>).procRate as number | undefined
      const procContribution =
        typeof procDamage === "number" && typeof procRate === "number"
          ? procRate * procDamage
          : 0

      computeWeaponAtDef = (def: number) => {
        const effDef = armorBroken || armorPiercing ? 0 : def
        const perShotRaw = baseAvgDmg * attMod + procContribution
        const perShot = Math.max(perShotRaw * 0.1, perShotRaw - effDef)
        return (
          perShot *
          shotCount *
          multiShot *
          baseShotsPerSec *
          rateOfFireMod *
          dexMod *
          buffMult *
          statusMult *
          hitRate *
          classMult
        )
      }
    }

    // Ability DPS contribution — works even with no weapon equipped.
    const abilityCalc = abilityDpsAtDef(ability, totals, attMod, statusMult, classMult)

    for (let i = 0; i <= 16; i++) {
      const def = i * 5
      dpsCurve[i] = Math.round(computeWeaponAtDef(def) + abilityCalc(def))
    }
    dpsAtZeroDef = dpsCurve[0]
    dpsAtScenarioDef = Math.round(
      computeWeaponAtDef(scenario.targetDefense) + abilityCalc(scenario.targetDefense),
    )
  }

  const ehp = Math.round(totals.hp / Math.max(0.4, 1 - totals.def / 100))
  const timeToKill1k = dpsAtScenarioDef > 0 ? Math.round((1000 / dpsAtScenarioDef) * 100) / 100 : 0

  return {
    dps: Math.round(dpsAtScenarioDef * totalAoeMult),
    dpsAtZeroDef: Math.round(dpsAtZeroDef * totalAoeMult),
    ehp,
    att: totals.att,
    dex: totals.dex,
    spd: totals.spd,
    vit: totals.vit,
    wis: totals.wis,
    def: totals.def,
    hp: totals.hp,
    mp: totals.mp,
    timeToKill1k,
    dpsCurve,
  }
}

// Ability DPS contribution at a given target defense.
// Returns a function of `def` so callers can plot the curve consistently with weapons.
//
// Sources of damage:
//   - Spells with `dmgMin/dmgMax` + `shots` (e.g. Fire Spray, Fire Nova)
//   - Spells/skulls with a flat `procDamage` (e.g. Genesis Spell, Brain of the Golem)
//
// Cycle time = max(declared cooldown, mana-bottleneck cycle).
// Mana regen formula approximating ROTMG community model:
//   mp/sec ≈ 2 + 0.25 × wis  (≈14.5/s at wis=50, ≈26.75/s at wis=99)
function abilityDpsAtDef(
  ability: Item | undefined,
  totals: { att: number; wis: number; mp: number },
  weaponAttMod: number,
  statusMult: number,
  classMult: number,
): (def: number) => number {
  if (!ability) return () => 0
  const s = ability.stats

  let dmgMinPerCast = 0
  let dmgMaxPerCast = 0
  if (typeof s.dmgMin === "number" && typeof s.dmgMax === "number") {
    const shots = s.shots ?? 1
    dmgMinPerCast = s.dmgMin * shots
    dmgMaxPerCast = s.dmgMax * shots
  } else if (typeof s.procDamage === "number" && s.procDamage > 0) {
    dmgMinPerCast = s.procDamage
    dmgMaxPerCast = s.procDamage
  } else {
    return () => 0
  }

  const avgPerCast = (dmgMinPerCast + dmgMaxPerCast) / 2
  if (avgPerCast <= 0) return () => 0

  const declaredCooldown = s.cooldown ?? 0
  const mpCost = s.mpCost ?? 0
  const mpRegen = 2 + 0.25 * totals.wis
  const manaBottleneck = mpCost > 0 ? mpCost / mpRegen : 0
  // When mpCost is missing from the catalog, fall back to a typical 5s cast
  // cycle for damaging abilities so we don't divide by an artificially small
  // declared cooldown. Real ROTMG quivers / spells average 4-8s practical cycle.
  const fallbackCycle = mpCost > 0 ? 0.5 : 5.0
  const cycleTime = Math.max(declaredCooldown, manaBottleneck, fallbackCycle)

  // Abilities scale with player ATT just like weapon shots; apply same modifier.
  const perCastRaw = avgPerCast * weaponAttMod
  const armorPiercing = (ability.tags ?? []).some(
    (t) => t === "armor-piercing" || t === "armor piercing" || t === "true damage",
  )

  return (def: number) => {
    const effDef = armorPiercing ? 0 : def
    const perCast = Math.max(perCastRaw * 0.1, perCastRaw - effDef * (s.shots ?? 1))
    return (perCast / cycleTime) * statusMult * classMult
  }
}

function estimateRoF(weapon: Item): number {
  switch (weapon.weaponType) {
    case "wand":
    case "staff":
      return 1.5
    case "bow":
      return 1.8
    case "katana":
      return 1.8
    case "dagger":
      return 1.8
    case "sword":
      return 1.6
    case "lute":
      return 1.7
    case "mace":
      return 1.5
    default:
      return 1.5
  }
}

export function buildItemMap(items: Item[]): Map<string, Item> {
  return new Map(items.map((i) => [i.id, i]))
}
