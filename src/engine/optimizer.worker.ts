/// <reference lib="webworker" />
//
// Web Worker wrapper around the optimizer. Keeps the main thread responsive
// during heavy beam-search runs. The worker receives an `OptimizerInput`
// payload, runs `optimize()`, and posts the resulting array of
// `OptimizationResult`s back.
//
// Loaded from the main thread via `new Worker(new URL(...), { type: "module" })`.

import { optimize, type OptimizerInput } from "./optimizer"
import type { OptimizationResult } from "../../product/sections/optimizer/types"

interface WorkerRequest {
  id: number
  input: OptimizerInput
}

interface WorkerSuccess {
  id: number
  ok: true
  results: OptimizationResult[]
  durationMs: number
}

interface WorkerFailure {
  id: number
  ok: false
  error: string
}

type WorkerResponse = WorkerSuccess | WorkerFailure

const ctx = self as unknown as DedicatedWorkerGlobalScope

ctx.addEventListener("message", (e: MessageEvent<WorkerRequest>) => {
  const { id, input } = e.data
  // Restore Set instances stripped by structured clone (Set survives clone in
  // modern engines, but keep the type-cast defensive for older environments).
  const ownedItemIds = input.ownedItemIds instanceof Set
    ? input.ownedItemIds
    : input.ownedItemIds
      ? new Set<string>(input.ownedItemIds as unknown as string[])
      : undefined
  const start = performance.now()
  try {
    const results = optimize({ ...input, ownedItemIds })
    const response: WorkerSuccess = {
      id, ok: true, results, durationMs: performance.now() - start,
    }
    ctx.postMessage(response)
  } catch (err) {
    const response: WorkerFailure = {
      id, ok: false, error: String((err as Error)?.message ?? err),
    }
    ctx.postMessage(response)
  }
})

export type { WorkerRequest, WorkerResponse, WorkerSuccess, WorkerFailure }
