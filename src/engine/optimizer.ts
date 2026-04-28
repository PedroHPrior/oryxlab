import type {
  Build,
  BuildSlots,
  Item,
  Scenario,
} from "../../product/sections/comparator/types"
import type {
  Constraint,
  ObjectiveId,
  OptimizationResult,
  OptimizerMode,
} from "../../product/sections/optimizer/types"
import type { ItemSet } from "../../product/sections/catalog/types"
import { computeDerivedStats, type PlayerClassDef } from "./dps"

export interface OptimizerInput {
  classId: string
  mode: OptimizerMode
  objective: ObjectiveId
  slotLocks: Record<keyof BuildSlots, string | null>
  constraints: Constraint[]
  scenario: Scenario
  classDef: PlayerClassDef
  allItems: Item[]
  ownedItemIds?: Set<string>
  itemSets?: ItemSet[]
  topN?: number
}

const SLOTS: (keyof BuildSlots)[] = ["weapon", "ability", "armor", "ring"]

interface ScoredCandidate {
  build: Build
  score: number
  dps: number
  ehp: number
  satisfies: boolean
  reasons: string[]
}

function makeBuild(classId: string, slots: BuildSlots, idx: number): Build {
  return {
    id: `opt-${idx}`,
    name: `${classId} candidate ${idx}`,
    classId,
    color: "violet",
    tags: [],
    slots,
    exaltations: { att: 5, dex: 5, wis: 5, vit: 5, spd: 5, def: 5, hp: 5, mp: 5 },
    useCustomScenario: false,
    derivedStats: {
      dps: 0, dpsAtZeroDef: 0, ehp: 0,
      att: 0, dex: 0, spd: 0, vit: 0, wis: 0, def: 0, hp: 0, mp: 0,
      timeToKill1k: 0, dpsCurve: [],
    },
  }
}

// Maps an ability sub-type to the class that can equip it. Used as a fallback
// when the catalog has an empty `classes` array (some scraped abilities lack it).
const ABILITY_TYPE_TO_CLASS: Record<string, string[]> = {
  spell: ["wizard"],
  tome: ["priest"],
  quiver: ["archer"],
  skull: ["necromancer"],
  cloak: ["rogue", "assassin", "trickster"],
  helm: ["warrior", "knight", "paladin"],
  seal: ["paladin"],
  wakizashi: ["kensei"],
  prism: ["trickster"],
  scepter: ["sorcerer"],
  orb: ["mystic"],
  star: ["ninja"],
  trap: ["huntress"],
  sigil: ["druid"],
  shield: ["knight"],
  poison: ["assassin"],
  dagger: ["rogue", "assassin"],
}

const WEAPON_TYPE_TO_CLASSES: Record<string, string[]> = {
  wand: ["wizard", "necromancer", "mystic", "summoner"],
  staff: ["wizard", "necromancer", "mystic"],
  bow: ["archer", "huntress"],
  sword: ["knight", "paladin", "warrior"],
  dagger: ["rogue", "assassin", "trickster"],
  katana: ["samurai", "kensei"],
  lute: ["bard"],
  mace: ["priest"],
}

function classCanEquip(item: Item, classId: string): boolean {
  if (item.classes?.includes(classId)) return true
  if (item.classes && item.classes.length > 0) return false
  // Empty classes , fall back to ability-type or weapon-type inference.
  if (item.type === "ability" && item.abilityType) {
    const compatible = ABILITY_TYPE_TO_CLASS[item.abilityType]
    if (compatible) return compatible.includes(classId)
  }
  if (item.type === "weapon" && item.weaponType) {
    const compatible = WEAPON_TYPE_TO_CLASSES[item.weaponType]
    if (compatible) return compatible.includes(classId)
  }
  // Armor / ring with empty classes are usually class-agnostic in ROTMG
  // (rings especially) , keep the permissive default for those.
  return item.type === "ring" || item.type === "armor"
}

function compatibleItemsForSlot(
  slot: keyof BuildSlots,
  allItems: Item[],
  classId: string,
  ownedItemIds?: Set<string>,
): Item[] {
  return allItems.filter((it) => {
    if (ownedItemIds && !ownedItemIds.has(it.id)) return false
    if (!classCanEquip(it, classId)) return false
    if (slot === "weapon") return it.type === "weapon"
    if (slot === "ability") return it.type === "ability"
    if (slot === "armor") return it.type === "armor"
    if (slot === "ring") return it.type === "ring"
    return false
  })
}

// Items where the proc damage is wildly larger than the base shot damage are
// almost certainly mis-scraped (the original parser mis-attributed Awakened
// Enchantment damage to procDamage on items that don't actually have a proc).
// We demote these so they don't dominate optimizer suggestions.
function isInflatedItem(it: Item): boolean {
  const s = it.stats
  if (typeof s.procDamage !== "number" || s.procDamage <= 0) return false
  const baseAvg = ((s.dmgMin ?? 0) + (s.dmgMax ?? 0)) / 2
  if (baseAvg === 0) return false
  return s.procDamage / baseAvg > 5
}

function pickTopByDps(items: Item[], k: number): Item[] {
  // Heuristic: sort by avg damage * shots * RoF estimate for weapons,
  // by total stat sum for abilities/armors/rings.
  // Inflated items get a 0.4× score penalty so the optimizer prefers
  // matchingly powerful but well-attested alternatives.
  const score = (it: Item) => {
    let raw: number
    if (it.type === "weapon") {
      const dmgAvg = ((it.stats.dmgMin ?? 0) + (it.stats.dmgMax ?? 0)) / 2
      const shots = it.stats.shots ?? 1
      raw = dmgAvg * shots
    } else {
      const s = it.stats
      raw =
        (s.att ?? 0) * 3 +
        (s.dex ?? 0) * 3 +
        (s.wis ?? 0) +
        (s.def ?? 0) * 2 +
        (s.hp ?? 0) * 0.05 +
        (s.mp ?? 0) * 0.02 +
        (s.spd ?? 0) +
        (s.vit ?? 0)
    }
    return isInflatedItem(it) ? raw * 0.4 : raw
  }
  return items
    .slice()
    .sort((a, b) => score(b) - score(a))
    .slice(0, k)
}

function checkConstraints(
  build: Build,
  constraints: Constraint[],
  itemIdsUsed: string[],
  itemMap: Map<string, Item>,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = []
  for (const c of constraints) {
    if (c.kind === "stat") {
      const v = (build.derivedStats as unknown as Record<string, number>)[c.stat] ?? 0
      const target = Number(c.value)
      if (c.op === "gte" && v < target) {
        reasons.push(`${c.stat} ${v} < ${target}`)
      }
      if (c.op === "lte" && v > target) {
        reasons.push(`${c.stat} ${v} > ${target}`)
      }
    }
    if (c.kind === "rule") {
      if (c.rule === "max-uts") {
        const uts = itemIdsUsed.filter((id) => itemMap.get(id)?.rarity === "ut").length
        if (uts > Number(c.value)) reasons.push(`${uts} UTs > ${c.value}`)
      }
      if (c.rule === "max-st-pieces") {
        const sts = itemIdsUsed.filter((id) => itemMap.get(id)?.rarity === "st").length
        if (sts > Number(c.value)) reasons.push(`${sts} ST pieces > ${c.value}`)
      }
      if (c.rule === "weapon-type") {
        const w = itemIdsUsed.find((id) => itemMap.get(id)?.type === "weapon")
        const wt = w ? itemMap.get(w)?.weaponType : null
        if (wt !== c.value) reasons.push(`weapon type ${wt} != ${c.value}`)
      }
    }
  }
  return { ok: reasons.length === 0, reasons }
}

function objectiveScore(objective: ObjectiveId, ds: { dps: number; ehp: number }): number {
  switch (objective) {
    case "max-dps":
      return ds.dps
    case "max-ehp":
      return ds.ehp
    case "balanced":
      return ds.dps * 0.55 + ds.ehp * 0.45
  }
}

const TOP_PER_SLOT = 6 // beam-search: pick top 6 per slot, then enumerate combinations

export function optimize(input: OptimizerInput): OptimizationResult[] {
  const { classId, objective, slotLocks, constraints, scenario, classDef, allItems, ownedItemIds, topN = 5 } = input

  const itemMap = new Map(allItems.map((i) => [i.id, i]))

  // Build candidate pool per slot
  const candidatesBySlot: Record<keyof BuildSlots, (Item | null)[]> = {
    weapon: [], ability: [], armor: [], ring: [],
  }

  for (const slot of SLOTS) {
    const lock = slotLocks[slot]
    if (lock) {
      const item = itemMap.get(lock)
      candidatesBySlot[slot] = item ? [item] : [null]
      continue
    }
    const compatible = compatibleItemsForSlot(slot, allItems, classId, ownedItemIds)
    if (compatible.length === 0) {
      candidatesBySlot[slot] = [null]
      continue
    }
    candidatesBySlot[slot] = pickTopByDps(compatible, TOP_PER_SLOT)
  }

  // Enumerate combinations (capped); compute score for each
  const results: ScoredCandidate[] = []
  const weaponCands = candidatesBySlot.weapon
  const abilityCands = candidatesBySlot.ability
  const armorCands = candidatesBySlot.armor
  const ringCands = candidatesBySlot.ring

  let candidateIdx = 0
  for (const w of weaponCands) {
    for (const ab of abilityCands) {
      for (const ar of armorCands) {
        for (const r of ringCands) {
          candidateIdx++
          const slots: BuildSlots = {
            weapon: w?.id ?? null,
            ability: ab?.id ?? null,
            armor: ar?.id ?? null,
            ring: r?.id ?? null,
          }
          const build = makeBuild(classId, slots, candidateIdx)
          try {
            const ds = computeDerivedStats({
              build, scenario, classDef, itemMap, itemSets: input.itemSets,
            })
            build.derivedStats = ds
            const itemIdsUsed = Object.values(slots).filter(Boolean) as string[]
            const constraintCheck = checkConstraints(build, constraints, itemIdsUsed, itemMap)
            results.push({
              build,
              score: objectiveScore(objective, ds),
              dps: ds.dps,
              ehp: ds.ehp,
              satisfies: constraintCheck.ok,
              reasons: constraintCheck.reasons,
            })
          } catch {
            /* skip */
          }
          if (results.length > 5000) break // safety cap
        }
      }
    }
  }

  // Filter to those that satisfy constraints; if none, return top by score regardless
  const satisfying = results.filter((r) => r.satisfies)
  const sorted = (satisfying.length > 0 ? satisfying : results).sort((a, b) => b.score - a.score)

  // Pre-compute baseline (empty build) stats for delta-vs-baseline explanations.
  const baseStats = computeDerivedStats({
    build: makeBuild(classId, {
      weapon: null, ability: null, armor: null, ring: null,
    } as BuildSlots, -1),
    scenario, classDef, itemMap,
  })

  return sorted.slice(0, topN).map((cand, i) => {
    const explanations: string[] = []
    explanations.push(
      `Total: ${cand.dps.toLocaleString("en-US")} DPS · ${cand.ehp.toLocaleString("en-US")} EHP · TTK 1k HP ${cand.build.derivedStats.timeToKill1k}s`,
    )
    if (objective === "balanced") {
      explanations.push(`Balanced score = 0.55 × DPS + 0.45 × EHP = ${cand.score.toFixed(0)}`)
    } else if (objective === "max-dps") {
      explanations.push(`Max-DPS objective ranks builds by DPS at scenario defense`)
    } else if (objective === "max-ehp") {
      explanations.push(`Max-EHP objective ranks builds by survivability vs incoming damage`)
    }

    // Per-slot contribution headlines , what each piece adds vs an empty slot
    const ds = cand.build.derivedStats
    const dDps = ds.dps - baseStats.dps
    const dEhp = ds.ehp - baseStats.ehp
    if (dDps > 0) explanations.push(`Setup contributes +${dDps.toLocaleString("en-US")} DPS over empty slots`)
    if (dEhp > 0) explanations.push(`Setup contributes +${dEhp.toLocaleString("en-US")} EHP over empty slots`)

    // Notable items: call out UTs and STs by name
    for (const slot of SLOTS) {
      const id = cand.build.slots[slot]
      if (!id) continue
      const item = itemMap.get(id)
      if (!item) continue
      if (item.rarity === "ut") {
        explanations.push(`${slot.toUpperCase()}: ${item.name} (UT) , selected for ${item.tags.length > 0 ? item.tags.slice(0, 2).join(", ") : "stat profile"}`)
      } else if (item.rarity === "st") {
        explanations.push(`${slot.toUpperCase()}: ${item.name} , part of an ST set, may grant set bonus when paired`)
      }
    }

    if (!cand.satisfies && cand.reasons.length > 0) {
      explanations.push(`⚠ Best-effort (does not fully satisfy): ${cand.reasons.join(", ")}`)
    }
    const result: OptimizationResult = {
      rank: i + 1,
      id: `opt-${i + 1}`,
      name: `${classDef.id.charAt(0).toUpperCase() + classDef.id.slice(1)} #${i + 1}`,
      classId,
      score: Math.round(cand.score * 10) / 10,
      scoreLabel:
        objective === "max-dps" ? "Max DPS" : objective === "max-ehp" ? "Max EHP" : "Balanced",
      slots: cand.build.slots,
      derivedStats: {
        dps: cand.build.derivedStats.dps,
        ehp: cand.build.derivedStats.ehp,
        att: cand.build.derivedStats.att,
        dex: cand.build.derivedStats.dex,
        wis: cand.build.derivedStats.wis,
        def: cand.build.derivedStats.def,
        hp: cand.build.derivedStats.hp,
        mp: cand.build.derivedStats.mp,
        spd: cand.build.derivedStats.spd,
        vit: cand.build.derivedStats.vit,
      },
      explanations,
      swapSuggestions: [],
      lockedSlots: SLOTS.filter((s) => slotLocks[s]),
    }
    return result
  })
}
