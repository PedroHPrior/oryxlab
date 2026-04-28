import type {
  OptimizerMode,
  OptimizerProps,
} from "../../../product/sections/optimizer/types"
import type { Item } from "../../../product/sections/comparator/types"
import { ClassPicker, ConstraintsPanel, ResultCard } from "./components"

const MODE_TABS: { id: OptimizerMode; label: string; description: string }[] = [
  { id: "bis", label: "Best in Slot", description: "Across the whole catalog" },
  { id: "inventory", label: "With My Inventory", description: "Only items you own" },
  { id: "constraints", label: "With Constraints", description: "Satisfy hard rules" },
]

interface OptimizerViewProps extends OptimizerProps {
  /** Optional catalog items to render slot details (passed from container). */
  items?: Item[]
}

export function OptimizerView({
  request,
  classes,
  objectives,
  constraintPalette,
  results,
  isRunning,
  lastRunDuration,
  items = [],
  onSelectClass,
  onSelectMode,
  onSelectObjective,
  onAddConstraint,
  onUpdateConstraintValue,
  onRemoveConstraint,
  onRun,
  onSendResultToComparator,
  onOpenResultInEditor,
  onSaveResult,
  onApplySwapSuggestion,
  onGoToInventory,
}: OptimizerViewProps) {
  return (
    <div
      className="flex flex-col gap-4"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Optimizer
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Pick a class and objective, the engine returns the top builds.
        </p>
      </header>

      <ClassPicker
        classes={classes}
        activeClassId={request.classId}
        onSelect={onSelectClass}
      />

      <div className="inline-flex items-center self-start rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
        {MODE_TABS.map((tab) => {
          const active = tab.id === request.mode
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectMode?.(tab.id)}
              title={tab.description}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "rounded-md bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <section className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {objectives.map((obj) => {
          const active = obj.id === request.objective
          return (
            <button
              key={obj.id}
              type="button"
              onClick={() => onSelectObjective?.(obj.id)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                active
                  ? "border-amber-400 ring-1 ring-amber-400/40"
                  : "border-zinc-200 hover:border-amber-400/60 dark:border-zinc-800"
              } bg-white dark:bg-zinc-900`}
              aria-pressed={active}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {obj.label}
                </span>
                {active && (
                  <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                    Selected
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{obj.description}</p>
            </button>
          )
        })}
      </section>

      {request.mode === "inventory" && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {request.ownedItemsCount > 0 ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Inventory ready
                </h3>
                <p className="text-xs text-zinc-500">
                  You own <span className="text-amber-600 dark:text-amber-400">{request.ownedItemsCount}</span> items.
                </p>
              </div>
              <button
                type="button"
                onClick={onGoToInventory}
                className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:border-amber-400/60 dark:border-zinc-700"
              >
                Manage inventory
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                No inventory yet
              </h3>
              <p className="text-xs text-zinc-500">
                Mark which items you own (or import from RealmEye) before running this mode.
              </p>
              <button
                type="button"
                onClick={onGoToInventory}
                className="rounded-md border border-amber-400/60 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-400/20 dark:text-amber-300"
              >
                Set up Inventory
              </button>
            </div>
          )}
        </section>
      )}

      {request.mode === "constraints" && (
        <ConstraintsPanel
          constraints={request.constraints}
          palette={constraintPalette}
          onAdd={onAddConstraint}
          onUpdateValue={onUpdateConstraintValue}
          onRemove={onRemoveConstraint}
        />
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            isRunning
              ? "cursor-wait bg-amber-400/40 text-zinc-700 dark:text-zinc-300"
              : "bg-amber-400 text-zinc-950 hover:bg-amber-300"
          }`}
        >
          {isRunning ? "Running…" : "Run optimization"}
        </button>
        {lastRunDuration && !isRunning && (
          <span className="text-xs text-zinc-500">Last run · {lastRunDuration}ms</span>
        )}
      </div>

      {results.length > 0 && (
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {results.map((r) => (
            <ResultCard
              key={r.id}
              result={r}
              items={items}
              onSendToComparator={() => onSendResultToComparator?.(r.id)}
              onOpenInEditor={() => onOpenResultInEditor?.(r.id)}
              onSave={() => onSaveResult?.(r.id)}
              onApplySwap={(slot) => onApplySwapSuggestion?.(r.id, slot)}
            />
          ))}
        </section>
      )}

      {results.length === 0 && !isRunning && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/40 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/40">
          Pick a class, mode, and objective , then hit "Run optimization".
        </div>
      )}
    </div>
  )
}
