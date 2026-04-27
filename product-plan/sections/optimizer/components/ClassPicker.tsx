import type { OptimizerClass } from "../../../../product/sections/optimizer/types"
import { ClassPortrait } from "../../_shared/ClassPortrait"

interface ClassPickerProps {
  classes: OptimizerClass[]
  activeClassId: string
  onSelect?: (classId: string) => void
}

export function ClassPicker({ classes, activeClassId, onSelect }: ClassPickerProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Class
      </h2>
      <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
        {classes.map((c) => {
          const active = c.id === activeClassId
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect?.(c.id)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors ${
                active
                  ? "border-amber-400 bg-amber-400/10 text-amber-700 dark:text-amber-300"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              }`}
              aria-pressed={active}
            >
              <ClassPortrait
                classId={c.id}
                name={c.name}
                color={c.portraitColor}
                size="sm"
              />
              <span className="text-[11px] font-medium">{c.name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
