import type { RealmEyeImportState } from "../../../../product/sections/inventory/types"
import { ClassPortrait } from "../../_shared/ClassPortrait"

interface RealmEyeImportPanelProps {
  state: RealmEyeImportState
  onChangeInput?: (value: string) => void
  onFetch?: () => void
  onConfirmOverwrite?: () => void
  onConfirmMerge?: () => void
  onClose?: () => void
}

export function RealmEyeImportPanel({
  state,
  onChangeInput,
  onFetch,
  onConfirmOverwrite,
  onConfirmMerge,
  onClose,
}: RealmEyeImportPanelProps) {
  if (!state.open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Import from RealmEye
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ×
          </button>
        </header>

        <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
          <Stepper step={state.step} />
        </div>

        {state.step === "enter-username" && (
          <div className="flex flex-col gap-3 p-4">
            <p className="text-xs text-zinc-500">
              Enter your RealmEye username (or full profile URL). Only public profiles can be imported.
            </p>
            <input
              autoFocus
              type="text"
              value={state.input}
              onChange={(e) => onChangeInput?.(e.target.value)}
              placeholder="username or https://realmeye.com/player/…"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={onFetch}
              disabled={!state.input.trim()}
              className="self-start rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Fetch preview
            </button>
          </div>
        )}

        {state.step === "preview" && state.preview && (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between rounded-lg bg-zinc-100/60 px-3 py-2 dark:bg-zinc-950/60">
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {state.preview.username}
                </div>
                <div className="text-xs text-zinc-500">
                  Vault: {state.preview.vaultCount} · Characters: {state.preview.characterCount}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-emerald-600 dark:text-emerald-400">+{state.preview.delta.added}</span>
                <span className="text-rose-600 dark:text-rose-400">−{state.preview.delta.removed}</span>
                <span className="text-zinc-500">={state.preview.delta.unchanged}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Characters ({state.preview.characters.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {state.preview.characters.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1.5 dark:border-zinc-800"
                  >
                    <ClassPortrait classId={c.classId} name={c.className} color="violet" size="xs" />
                    <div>
                      <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {c.className}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {c.equippedItems.filter(Boolean).length} / 5 equipped
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onConfirmMerge}
                className="flex-1 rounded-md border border-amber-400/60 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-400/20 dark:text-amber-300"
              >
                Merge with current
              </button>
              <button
                type="button"
                onClick={onConfirmOverwrite}
                className="flex-1 rounded-md border border-rose-400/60 bg-rose-400/10 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-400/20 dark:text-rose-300"
              >
                Overwrite all
              </button>
            </div>
          </div>
        )}

        {state.step === "confirmed" && (
          <div className="p-6 text-center">
            <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-500">
              ✓
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Inventory imported successfully.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Stepper({ step }: { step: RealmEyeImportState["step"] }) {
  const steps = [
    { id: "enter-username", label: "Username" },
    { id: "preview", label: "Preview" },
    { id: "confirmed", label: "Done" },
  ] as const
  const idx = steps.findIndex((s) => s.id === step)
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
      {steps.map((s, i) => (
        <span key={s.id} className="inline-flex items-center gap-1.5">
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
              i <= idx
                ? "bg-amber-400 text-zinc-950"
                : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {i + 1}
          </span>
          <span className={i === idx ? "text-zinc-900 dark:text-zinc-100" : ""}>{s.label}</span>
          {i < steps.length - 1 && <span className="text-zinc-300 dark:text-zinc-700">→</span>}
        </span>
      ))}
    </div>
  )
}
