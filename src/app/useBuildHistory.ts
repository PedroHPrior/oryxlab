import { useEffect, useRef, useState } from "react"
import type { Build } from "../../product/sections/comparator/types"

interface UseBuildHistoryOptions {
  build: Build | undefined
  onApply: (snapshot: Build) => void
  capacity?: number
}

interface BuildHistory {
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
}

/**
 * Tracks slot/exalt changes on a single build and exposes undo/redo.
 * Hooked up by the Build Editor route. Records a new snapshot whenever the
 * upstream build changes shape; ignores parent-driven re-renders that don't
 * actually change the build.
 *
 * History is kept in memory only — refreshing clears it (which matches what
 * users expect from a Cmd-Z stack in form-style UIs).
 */
export function useBuildHistory({ build, onApply, capacity = 50 }: UseBuildHistoryOptions): BuildHistory {
  const [stack, setStack] = useState<Build[]>([])
  const [pointer, setPointer] = useState<number>(-1)
  const lastFingerprintRef = useRef<string>("")

  useEffect(() => {
    if (!build) return
    // Stable identity for change detection — we don't want stat recomputation
    // (which mutates derivedStats on every parent render) to trigger a new
    // history entry. Track only the user-controlled fields.
    const fp = JSON.stringify({
      slots: build.slots,
      exaltations: build.exaltations,
      classId: build.classId,
      name: build.name,
      notes: build.notes ?? "",
      useCustomScenario: build.useCustomScenario,
      scenarioOverride: build.scenarioOverride,
    })
    if (fp === lastFingerprintRef.current) return
    lastFingerprintRef.current = fp

    setStack((curr) => {
      // Drop everything ahead of pointer (a new edit truncates redo history).
      const trimmed = pointer < curr.length - 1 ? curr.slice(0, pointer + 1) : curr
      const next = [...trimmed, structuredClone(build)]
      // Cap stack size — drop oldest entries first.
      const overflow = Math.max(0, next.length - capacity)
      return overflow > 0 ? next.slice(overflow) : next
    })
    setPointer((p) => Math.min(capacity - 1, p + 1))
  }, [build, pointer, capacity])

  // Cmd/Ctrl-Z and Shift-Cmd/Ctrl-Z keybindings.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmd = e.metaKey || e.ctrlKey
      if (!cmd || e.key.toLowerCase() !== "z") return
      e.preventDefault()
      if (e.shiftKey) {
        if (pointer < stack.length - 1) {
          const target = stack[pointer + 1]
          setPointer((p) => p + 1)
          onApply(target)
        }
      } else if (pointer > 0) {
        const target = stack[pointer - 1]
        setPointer((p) => p - 1)
        onApply(target)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [stack, pointer, onApply])

  return {
    canUndo: pointer > 0,
    canRedo: pointer < stack.length - 1,
    undo: () => {
      if (pointer > 0) {
        const target = stack[pointer - 1]
        setPointer((p) => p - 1)
        onApply(target)
      }
    },
    redo: () => {
      if (pointer < stack.length - 1) {
        const target = stack[pointer + 1]
        setPointer((p) => p + 1)
        onApply(target)
      }
    },
  }
}
