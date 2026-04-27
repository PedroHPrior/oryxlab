import { useMemo, useState } from "react"
import { OptimizerView } from "../../sections/optimizer/OptimizerView"
import optimizerData from "../../../product/sections/optimizer/data.json"
import type {
  ConstraintPaletteEntry,
  Objective,
  OptimizerClass,
  OptimizationResult,
} from "../../../product/sections/optimizer/types"
import { useOryxLab } from "../state"
import { runOptimizerAsync } from "../../engine/optimizer-client"

export function OptimizerRoute() {
  const { state, actions } = useOryxLab()
  const [results, setResults] = useState<OptimizationResult[]>([])
  const [lastDuration, setLastDuration] = useState<number | undefined>(undefined)

  const classes = useMemo<OptimizerClass[]>(() => {
    if (state.classesData.length === 0) return optimizerData.classes as OptimizerClass[]
    return state.classesData.map((c) => ({
      id: c.id,
      name: c.name,
      portraitColor: c.portraitColor,
      imageUrl: c.imageUrl ?? undefined,
    }))
  }, [state.classesData])

  const handleRun = () => {
    actions.runOptimizer()
    const start = performance.now()
    const cls = state.classesData.find((c) => c.id === state.optimizerRequest.classId)
    if (!cls) {
      setResults([])
      return
    }
    const ownedItemIds =
      state.optimizerRequest.mode === "inventory"
        ? new Set(state.inventoryOwnedEntries.map((e) => e.itemId))
        : undefined

    runOptimizerAsync({
      classId: state.optimizerRequest.classId,
      mode: state.optimizerRequest.mode,
      objective: state.optimizerRequest.objective,
      slotLocks: state.optimizerRequest.slotLocks,
      constraints: state.optimizerRequest.constraints,
      scenario: state.globalScenario,
      classDef: cls,
      allItems: state.items,
      ownedItemIds,
      itemSets: state.itemSets,
      topN: 5,
    })
      .then(({ results, durationMs }) => {
        setResults(results)
        setLastDuration(Math.round(durationMs))
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error("optimize failed", e)
        setResults([])
      })
    // Reference `start` so eslint doesn't complain about unused var. The worker
    // returns its own duration, but having a fallback timer here is harmless.
    void start
  }

  return (
    <OptimizerView
      request={{
        ...state.optimizerRequest,
        ownedItemsCount: state.inventoryOwnedEntries.length,
      }}
      classes={classes}
      objectives={optimizerData.objectives as Objective[]}
      constraintPalette={optimizerData.constraintPalette as ConstraintPaletteEntry[]}
      results={results}
      isRunning={state.optimizerIsRunning}
      lastRunDuration={lastDuration}
      items={state.items}
      onSelectClass={actions.setOptimizerClass}
      onSelectMode={actions.setOptimizerMode}
      onSelectObjective={actions.setOptimizerObjective}
      onAddConstraint={actions.addOptimizerConstraint}
      onUpdateConstraintValue={actions.updateOptimizerConstraint}
      onRemoveConstraint={actions.removeOptimizerConstraint}
      onRun={handleRun}
      onSendResultToComparator={(id) => {
        const result = results.find((r) => r.id === id)
        if (result) actions.addBuildFromSlots(result.classId, result.slots, result.name)
      }}
      onOpenResultInEditor={(id) => actions.navigateToEditor(id)}
      onSaveResult={(id) => {
        const result = results.find((r) => r.id === id)
        if (result) actions.saveOptimizerResult(result.classId, result.slots, result.name)
      }}
      onApplySwapSuggestion={(id, slot) => {
        const result = results.find((r) => r.id === id)
        if (!result) return
        const suggestion = result.swapSuggestions?.find((s) => s.slot === slot)
        if (suggestion) actions.applySwapToBuild(id, slot, suggestion.to)
      }}
      onGoToInventory={actions.navigateToInventory}
    />
  )
}
