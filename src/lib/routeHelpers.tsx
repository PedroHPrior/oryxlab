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
  // The wrapping <div> drives the .oryx-route-enter animation on every route
  // change. `key={area}` re-keys the subtree per route so the animation
  // restarts; without it React would diff in place and the keyframe wouldn't
  // re-trigger on Comparator → Catalog → … navigations.
  return (
    <ErrorBoundary area={area}>
      <Suspense fallback={<RouteFallback />}>
        <div key={area} className="oryx-route-enter">{children}</div>
      </Suspense>
    </ErrorBoundary>
  )
}
