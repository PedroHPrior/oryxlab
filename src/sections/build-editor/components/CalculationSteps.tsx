import { useState } from "react"
import type { CalculationStep } from "../../../../product/sections/build-editor/types"

interface CalculationStepsProps {
  steps: CalculationStep[]
}

export function CalculationSteps({ steps }: CalculationStepsProps) {
  const [open, setOpen] = useState(false)

  return (
    <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Show calculation
        </h2>
        <span className="text-xs text-zinc-500">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <ol className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          {steps.map((s, idx) => (
            <li
              key={idx}
              className="grid grid-cols-[200px_1fr_auto] items-center gap-3 border-b border-zinc-100 py-1.5 text-xs last:border-b-0 dark:border-zinc-800"
            >
              <span className="text-zinc-700 dark:text-zinc-300">
                {s.label}
              </span>
              <span
                className="text-zinc-500"
                style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
              >
                {s.expr}
              </span>
              <span
                className="text-right font-semibold text-amber-700 dark:text-amber-300"
                style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontFeatureSettings: '"tnum"' }}
              >
                {typeof s.value === "number" ? s.value.toLocaleString("en-US") : s.value} <span className="text-zinc-500">{s.unit}</span>
              </span>
              {s.note && (
                <span className="col-span-3 -mt-1 text-[11px] italic text-zinc-500">
                  {s.note}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
