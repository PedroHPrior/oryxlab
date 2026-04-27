// Main-thread client that talks to the optimizer worker. Falls back to
// running optimize() inline if Worker support is missing (SSR, vitest jsdom).
import type { OptimizerInput } from "./optimizer"
import type { OptimizationResult } from "../../product/sections/optimizer/types"
import type { WorkerResponse } from "./optimizer.worker"

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, { resolve: (r: { results: OptimizationResult[]; durationMs: number }) => void; reject: (e: Error) => void }>()

function getWorker(): Worker | null {
  if (typeof Worker === "undefined") return null
  if (worker) return worker
  try {
    worker = new Worker(new URL("./optimizer.worker.ts", import.meta.url), { type: "module" })
    worker.addEventListener("message", (e: MessageEvent<WorkerResponse>) => {
      const handler = pending.get(e.data.id)
      if (!handler) return
      pending.delete(e.data.id)
      if (e.data.ok) {
        handler.resolve({ results: e.data.results, durationMs: e.data.durationMs })
      } else {
        handler.reject(new Error(e.data.error))
      }
    })
    worker.addEventListener("error", (ev) => {
      // Reject every pending call when the worker itself dies.
      for (const handler of pending.values()) {
        handler.reject(new Error(ev.message ?? "Optimizer worker error"))
      }
      pending.clear()
      worker?.terminate()
      worker = null
    })
    return worker
  } catch {
    return null
  }
}

export async function runOptimizerAsync(input: OptimizerInput): Promise<{ results: OptimizationResult[]; durationMs: number }> {
  const w = getWorker()
  if (!w) {
    // Synchronous fallback (vitest, SSR)
    const { optimize } = await import("./optimizer")
    const start = typeof performance !== "undefined" ? performance.now() : Date.now()
    const results = optimize(input)
    const durationMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - start
    return { results, durationMs }
  }
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    // Set is structured-cloneable; the worker side detects + reconstructs.
    w.postMessage({ id, input })
  })
}
