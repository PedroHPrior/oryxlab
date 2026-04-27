import type {
  ComparatorProps,
} from "../../../product/sections/comparator/types"
import {
  BuildColumn,
  DpsCurveChart,
  EmptyState,
  FocusView,
  TableView,
  ViewModeToggle,
  OnboardingTour,
} from "./components"

export function ComparatorView({
  viewMode,
  globalScenario,
  classes,
  items,
  builds,
  presetStarterCards,
  onViewModeChange,
  onAddBuild,
  onApplyStarterCard,
  onChangeBuildSlot,
  onChangeBuildClass,
  onRenameBuild,
  onToggleCustomScenario,
  onChangeBuildScenario,
  onChangeExaltations,
  onOpenInEditor,
  onSaveBuild,
  onDuplicateBuild,
  onRemoveBuild,
  onShareComparator,
  onSetFocusBuilds,
}: ComparatorProps) {
  const classMap = new Map(classes.map((c) => [c.id, c]))
  const reference = builds[0] ?? null

  const isEmpty = builds.length === 0

  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>
      <OnboardingTour />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Comparator
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isEmpty
              ? "Build your first comparison."
              : `${builds.length} build${builds.length === 1 ? "" : "s"} side by side · scenario at Def ${globalScenario.targetDefense}`}
          </p>
        </div>
        {!isEmpty && (
          <div className="flex items-center gap-2">
            <ViewModeToggle value={viewMode} onChange={(v) => onViewModeChange?.(v)} />
            <button
              type="button"
              onClick={onAddBuild}
              data-tour="add-build"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              + Add build
            </button>
            <button
              type="button"
              onClick={onShareComparator}
              data-tour="share"
              className="rounded-md border border-amber-400/60 bg-amber-400/10 px-3 py-1.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-400/20 dark:text-amber-300"
            >
              Share
            </button>
          </div>
        )}
      </header>

      {isEmpty && (
        <EmptyState
          cards={presetStarterCards}
          onApplyCard={onApplyStarterCard}
          onAddBuild={onAddBuild}
        />
      )}

      {!isEmpty && viewMode === "cards" && builds.length >= 2 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <header className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                DPS vs Target Defense
              </h2>
              <p className="text-[11px] text-zinc-500">
                Each curve shows how the build's DPS scales with the target's defense
              </p>
            </div>
            <span
              className="rounded-md border border-amber-400/60 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300"
              style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
            >
              scenario · def {globalScenario.targetDefense}
            </span>
          </header>
          <DpsCurveChart
            curves={builds.slice(0, 6).map((b) => ({
              id: b.id,
              name: b.name,
              color: b.color,
              values: b.derivedStats.dpsCurve,
            }))}
            highlightDef={globalScenario.targetDefense}
            width={1200}
            height={320}
            variant="prominent"
          />
        </section>
      )}

      {!isEmpty && viewMode === "cards" && (
        <div className="flex flex-wrap gap-4 lg:flex-nowrap lg:overflow-x-auto lg:pb-4">
          {builds.map((b) => (
            <BuildColumn
              key={b.id}
              build={b}
              reference={reference}
              playerClass={classMap.get(b.classId)}
              items={items}
              classes={classes}
              globalScenario={globalScenario}
              onChangeSlot={(slot, itemId) => onChangeBuildSlot?.(b.id, slot, itemId)}
              onChangeClass={(classId) => onChangeBuildClass?.(b.id, classId)}
              onRename={(name) => onRenameBuild?.(b.id, name)}
              onToggleCustomScenario={(useCustom) => onToggleCustomScenario?.(b.id, useCustom)}
              onChangeScenario={(scenario) => onChangeBuildScenario?.(b.id, scenario)}
              onChangeExaltations={(exalts) => onChangeExaltations?.(b.id, exalts)}
              onOpenInEditor={() => onOpenInEditor?.(b.id)}
              onSave={() => onSaveBuild?.(b.id)}
              onDuplicate={() => onDuplicateBuild?.(b.id)}
              onRemove={() => onRemoveBuild?.(b.id)}
            />
          ))}
          {builds.length < 6 && (
            <button
              type="button"
              onClick={onAddBuild}
              className="flex h-auto min-h-[420px] w-[280px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/40 text-sm text-zinc-500 transition-colors hover:border-amber-400/50 hover:bg-amber-400/5 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:text-zinc-100 sm:w-[300px]"
            >
              <span className="text-2xl">+</span>
              <span>Add build</span>
            </button>
          )}
        </div>
      )}

      {!isEmpty && viewMode === "focus" && (
        <FocusView
          builds={builds}
          classes={classes}
          items={items}
          globalScenario={globalScenario}
          onSetFocusBuilds={onSetFocusBuilds}
        />
      )}

      {!isEmpty && viewMode === "table" && (
        <TableView
          builds={builds}
          classes={classes}
          onOpenInEditor={onOpenInEditor}
        />
      )}
    </div>
  )
}
