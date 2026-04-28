import { useMemo } from "react"
import { ComparatorView } from "../../sections/comparator/ComparatorView"
import comparatorData from "../../../product/sections/comparator/data.json"
import type { Item, PlayerClass, PresetStarterCard, ScenarioPreset, SavedBuildSnapshot } from "../../../product/sections/comparator/types"
import { useOryxLab } from "../state"
import { loadSavedBuilds } from "../storage"

export function ComparatorRoute() {
  const { state, actions } = useOryxLab()

  const classes = useMemo<PlayerClass[]>(() => {
    if (state.classesData.length === 0) return comparatorData.classes as PlayerClass[]
    return state.classesData.map((c) => ({
      id: c.id,
      name: c.name,
      portraitColor: c.portraitColor,
      weaponType: (c.weaponType ?? "wand") as PlayerClass["weaponType"],
      abilityType: (c.abilityType ?? "spell") as PlayerClass["abilityType"],
      armorType: (c.armorType ?? "robe") as PlayerClass["armorType"],
      imageUrl: c.imageUrl ?? undefined,
    } as PlayerClass & { imageUrl?: string }))
  }, [state.classesData])

  const items = state.items.length > 0 ? state.items : (comparatorData.items as Item[])

  // Read saved snapshots straight from localStorage on every render , the list
  // rarely exceeds a few entries and React Compiler will memoize automatically.
  const stored = loadSavedBuilds()
  const savedSnapshots: SavedBuildSnapshot[] =
    stored.length === 0
      ? (comparatorData.savedBuildSnapshots as SavedBuildSnapshot[])
      : stored.map((s) => ({
          id: s.id,
          name: s.name,
          classId: s.classId,
          dps: s.build.derivedStats?.dps ?? 0,
          lastModified: s.savedAt,
          tags: s.tags,
        }))

  return (
    <ComparatorView
      viewMode={state.comparatorViewMode}
      globalScenario={state.globalScenario}
      scenarioPresets={comparatorData.scenarioPresets as ScenarioPreset[]}
      classes={classes}
      items={items}
      builds={state.builds}
      savedBuildSnapshots={savedSnapshots}
      presetStarterCards={comparatorData.presetStarterCards as PresetStarterCard[]}
      onViewModeChange={actions.setComparatorViewMode}
      onGlobalScenarioChange={actions.setGlobalScenario}
      onSelectScenarioPreset={actions.applyScenarioPreset}
      onAddBuild={actions.addBuild}
      onApplyStarterCard={actions.applyStarterCard}
      onChangeBuildSlot={actions.changeBuildSlot}
      onChangeBuildClass={actions.changeBuildClass}
      onRenameBuild={actions.renameBuild}
      onToggleCustomScenario={actions.toggleCustomScenario}
      onChangeBuildScenario={actions.changeBuildScenario}
      onChangeExaltations={actions.changeExaltations}
      onDuplicateBuild={actions.duplicateBuild}
      onRemoveBuild={actions.removeBuild}
      onSaveBuild={actions.saveBuild}
      onOpenInEditor={actions.navigateToEditor}
      onShareComparator={actions.shareComparator}
    />
  )
}
