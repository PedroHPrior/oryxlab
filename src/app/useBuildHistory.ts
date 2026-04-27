import { useEffect, useReducer } from "react"
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

interface HistoryState {
  stack: Build[]
  pointer: number
  fingerprint: string
}

type HistoryAction =
  | { type: "record"; build: Build; capacity: number }
  | { type: "move"; pointer: number }

const initialState: HistoryState = {
  stack: [],
  pointer: -1,
  fingerprint: "",
}

function fingerprintOf(b: Build): string {
  // Stable identity for change detection — recomputing derivedStats every
  // render mustn't trigger a new history entry. We hash only the user-
  // controlled fields.
  return JSON.stringify({
    slots: b.slots,
    exaltations: b.exaltations,
    classId: b.classId,
    name: b.name,
    notes: b.notes ?? "",
    useCustomScenario: b.useCustomScenario,
    scenarioOverride: b.scenarioOverride,
  })
}

function reducer(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === "record") {
    const fp = fingerprintOf(action.build)
    if (fp === state.fingerprint) return state
    // A new edit truncates redo history beyond the current pointer.
    const trimmed =
      state.pointer < state.stack.length - 1
        ? state.stack.slice(0, state.pointer + 1)
        : state.stack
    const next = [...trimmed, structuredClone(action.build)]
    // Cap stack size — drop oldest entries first.
    const overflow = Math.max(0, next.length - action.capacity)
    const cappedStack = overflow > 0 ? next.slice(overflow) : next
    return {
      stack: cappedStack,
      pointer: Math.min(action.capacity - 1, state.pointer + 1),
      fingerprint: fp,
    }
  }
  return { ...state, pointer: action.pointer }
}

/**
 * Tracks slot/exalt changes on a single build and exposes undo/redo, both
 * programmatically and via ⌘Z / ⌘⇧Z keybindings.
 *
 * History lives in memory only — a page reload clears it, which matches
 * users' mental model of an editor undo stack.
 */
export function useBuildHistory({
  build,
  onApply,
  capacity = 50,
}: UseBuildHistoryOptions): BuildHistory {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (!build) return
    dispatch({ type: "record", build, capacity })
  }, [build, capacity])

  // ⌘Z / Ctrl-Z and ⌘⇧Z / Ctrl-⇧Z keybindings.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmd = e.metaKey || e.ctrlKey
      if (!cmd || e.key.toLowerCase() !== "z") return
      e.preventDefault()
      if (e.shiftKey) {
        if (state.pointer < state.stack.length - 1) {
          const next = state.pointer + 1
          dispatch({ type: "move", pointer: next })
          onApply(state.stack[next])
        }
      } else if (state.pointer > 0) {
        const prev = state.pointer - 1
        dispatch({ type: "move", pointer: prev })
        onApply(state.stack[prev])
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [state.stack, state.pointer, onApply])

  return {
    canUndo: state.pointer > 0,
    canRedo: state.pointer < state.stack.length - 1,
    undo: () => {
      if (state.pointer > 0) {
        const prev = state.pointer - 1
        dispatch({ type: "move", pointer: prev })
        onApply(state.stack[prev])
      }
    },
    redo: () => {
      if (state.pointer < state.stack.length - 1) {
        const next = state.pointer + 1
        dispatch({ type: "move", pointer: next })
        onApply(state.stack[next])
      }
    },
  }
}
