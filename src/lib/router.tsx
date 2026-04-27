import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { OryxLabApp } from '@/app/OryxLabApp'
import { ErrorBoundary } from '@/app/ErrorBoundary'

// Lazy-load section routes — splits Catalog (1.7K items), Optimizer, BuildEditor, Inventory off initial bundle
const ComparatorRoute = lazy(() => import('@/app/routes/ComparatorRoute').then((m) => ({ default: m.ComparatorRoute })))
const CatalogRoute = lazy(() => import('@/app/routes/CatalogRoute').then((m) => ({ default: m.CatalogRoute })))
const OptimizerRoute = lazy(() => import('@/app/routes/OptimizerRoute').then((m) => ({ default: m.OptimizerRoute })))
const InventoryRoute = lazy(() => import('@/app/routes/InventoryRoute').then((m) => ({ default: m.InventoryRoute })))
const BuildEditorRoute = lazy(() => import('@/app/routes/BuildEditorRoute').then((m) => ({ default: m.BuildEditorRoute })))

function RouteFallback() {
  return (
    <div
      className="flex h-[60vh] items-center justify-center text-sm text-zinc-500"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <span className="oryx-skeleton inline-block h-3 w-32 rounded-full" />
    </div>
  )
}

function lazyRoute(node: React.ReactNode, area: string) {
  return (
    <ErrorBoundary area={area}>
      <Suspense fallback={<RouteFallback />}>{node}</Suspense>
    </ErrorBoundary>
  )
}

export const router = createBrowserRouter([
  // Root → comparator. The Design OS planning surface that used to live here
  // graduated into the actual product; the planning files in product/ are now
  // build artifacts, not user-facing pages.
  {
    path: '/',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '/app',
    element: <OryxLabApp />,
    children: [
      { index: true, element: lazyRoute(<ComparatorRoute />, "Comparator") },
      { path: 'catalog', element: lazyRoute(<CatalogRoute />, "Catalog") },
      { path: 'optimizer', element: lazyRoute(<OptimizerRoute />, "Optimizer") },
      { path: 'inventory', element: lazyRoute(<InventoryRoute />, "Inventory") },
      { path: 'editor', element: lazyRoute(<BuildEditorRoute />, "Build Editor") },
      { path: 'editor/:buildId', element: lazyRoute(<BuildEditorRoute />, "Build Editor") },
    ],
  },
  // Catch-all: anything else lands on the comparator too.
  {
    path: '*',
    element: <Navigate to="/app" replace />,
  },
])
