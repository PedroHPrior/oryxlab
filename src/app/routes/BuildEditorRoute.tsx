import { useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { BuildEditorView } from "../../sections/build-editor/BuildEditorView"
import buildEditorData from "../../../product/sections/build-editor/data.json"
import comparatorData from "../../../product/sections/comparator/data.json"
import catalogData from "../../../product/sections/catalog/data.json"
import type { Item } from "../../../product/sections/comparator/types"
import type { BuildEditorBuild, CalculationStep, KeyboardShortcut, StatBreakdownMap } from "../../../product/sections/build-editor/types"
import { useOryxLab } from "../state"
import { buildItemMap, computeStatBreakdown, type PlayerClassDef } from "../../engine/dps"
import { useBuildHistory } from "../useBuildHistory"

export function BuildEditorRoute() {
  const navigate = useNavigate()
  const { buildId } = useParams<{ buildId: string }>()
  const { state, actions } = useOryxLab()

  const mergedItems = useMemo<Item[]>(() => {
    const map = new Map<string, Item>()
    // Live API items first (real catalog of 1500). Fall back to seed data
    // only while items are still loading at startup.
    const source = state.items.length > 0
      ? state.items
      : (catalogData.items as unknown as Item[])
    for (const i of source) map.set(i.id, i)
    for (const i of comparatorData.items as Item[]) {
      if (!map.has(i.id)) map.set(i.id, i)
    }
    return Array.from(map.values())
  }, [state.items])

  const liveBuild = state.builds.find((b) => b.id === buildId) ?? state.builds[0]

  // Cmd/Ctrl-Z undo + Shift-Cmd/Ctrl-Z redo, scoped to the active build.
  useBuildHistory({
    build: liveBuild,
    onApply: (snapshot) => {
      if (liveBuild) actions.replaceBuild(liveBuild.id, snapshot)
    },
  })

  // Compute stat breakdown live from the equipped slots so the right-side
  // "Stat sources" panel reflects the current build, not stale seed data.
  const liveStatBreakdowns = useMemo<StatBreakdownMap>(() => {
    if (!liveBuild) return {}
    const cls = state.classesData.find((c) => c.id === liveBuild.classId) as PlayerClassDef | undefined
    if (!cls) return {}
    const itemMap = buildItemMap(mergedItems)
    const scenario = liveBuild.useCustomScenario && liveBuild.scenarioOverride
      ? liveBuild.scenarioOverride
      : state.globalScenario
    const result = computeStatBreakdown({
      build: liveBuild, scenario, classDef: cls, itemMap, itemSets: state.itemSets,
    })
    // Map to the StatBreakdownMap shape the view expects.
    return {
      att: result.att,
      dex: result.dex,
      wis: result.wis,
      vit: result.vit,
      spd: result.spd,
      def: result.def,
      hp: result.hp,
      mp: result.mp,
    }
  }, [liveBuild, mergedItems, state.classesData, state.globalScenario, state.itemSets])

  const fallback = buildEditorData.build as BuildEditorBuild
  const build: BuildEditorBuild = liveBuild
    ? {
        ...fallback,
        ...liveBuild,
        className:
          comparatorData.classes.find((c) => c.id === liveBuild.classId)?.name ??
          fallback.className,
        notes: liveBuild.notes ?? fallback.notes,
        scenario: liveBuild.useCustomScenario && liveBuild.scenarioOverride
          ? liveBuild.scenarioOverride
          : state.globalScenario,
      }
    : fallback

  return (
    <BuildEditorView
      build={build}
      items={mergedItems}
      alternativeItems={buildEditorData.alternativeItems}
      statBreakdowns={
        Object.keys(liveStatBreakdowns).length > 0
          ? liveStatBreakdowns
          : (buildEditorData.statBreakdowns as StatBreakdownMap)
      }
      calculationSteps={buildEditorData.calculationSteps as CalculationStep[]}
      shortcuts={buildEditorData.shortcuts as KeyboardShortcut[]}
      onBackToComparator={() => navigate("/app")}
      onSave={() => actions.saveBuild?.(build.id)}
      onSaveAsNew={() => actions.duplicateBuild?.(build.id)}
      onDiscard={() => navigate("/app")}
      onRename={(name) => actions.renameBuild?.(build.id, name)}
      onChangeNotes={(notes) => actions.changeBuildNotes(build.id, notes)}
      onChangeSlot={(slot, itemId) => actions.changeBuildSlot?.(build.id, slot, itemId)}
      onChangeExaltations={(exalts) => actions.changeExaltations?.(build.id, exalts)}
      onToggleCustomScenario={(useCustom) => actions.toggleCustomScenario?.(build.id, useCustom)}
      onChangeScenario={(scenario) => actions.changeBuildScenario?.(build.id, scenario)}
    />
  )
}
