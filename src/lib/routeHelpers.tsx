import { Suspense, type ReactNode } from "react"
import { ErrorBoundary } from "@/app/ErrorBoundary"

/**
 * Generic skeleton shown while a lazy route chunk is downloading.
 * Visually matches the rest of the app's loading affordances.
 */
export function RouteFallback() {
  return (
    <div
      className="flex h-[60vh] items-center justify-center text-sm text-zinc-500"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <span className="oryx-skeleton inline-block h-3 w-32 rounded-full" />
    </div>
  )
}

/**
 * Wraps a lazy route in both a Suspense fallback and an ErrorBoundary so a
 * single route's crash never tears down the shell. The ErrorBoundary uses
 * `area` to label its fallback UI.
 */
export function LazyRoute({
  area,
  children,
}: {
  area: string
  children: ReactNode
}) {
  return (
    <ErrorBoundary area={area}>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </ErrorBoundary>
  )
}
