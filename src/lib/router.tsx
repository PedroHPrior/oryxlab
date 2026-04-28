import { lazy } from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { OryxLabApp } from "@/app/OryxLabApp"
import { NotFoundRoute } from "@/app/routes/NotFoundRoute"
import { LazyRoute } from "./routeHelpers"

// Code-splits the Catalog (1.5K items), Optimizer (Web Worker), Build Editor,
// and Inventory routes off the initial bundle. NotFoundRoute is intentionally
// NOT lazy , it should render instantly for users hitting a dead link.
const ComparatorRoute = lazy(() => import("@/app/routes/ComparatorRoute").then((m) => ({ default: m.ComparatorRoute })))
const CatalogRoute = lazy(() => import("@/app/routes/CatalogRoute").then((m) => ({ default: m.CatalogRoute })))
const OptimizerRoute = lazy(() => import("@/app/routes/OptimizerRoute").then((m) => ({ default: m.OptimizerRoute })))
const InventoryRoute = lazy(() => import("@/app/routes/InventoryRoute").then((m) => ({ default: m.InventoryRoute })))
const BuildEditorRoute = lazy(() => import("@/app/routes/BuildEditorRoute").then((m) => ({ default: m.BuildEditorRoute })))

export const router = createBrowserRouter([
  // The actual product lives under /app. The bare root redirects there.
  { path: "/", element: <Navigate to="/app" replace /> },
  {
    path: "/app",
    element: <OryxLabApp />,
    children: [
      { index: true, element: <LazyRoute area="Comparator"><ComparatorRoute /></LazyRoute> },
      { path: "catalog", element: <LazyRoute area="Catalog"><CatalogRoute /></LazyRoute> },
      { path: "optimizer", element: <LazyRoute area="Optimizer"><OptimizerRoute /></LazyRoute> },
      { path: "inventory", element: <LazyRoute area="Inventory"><InventoryRoute /></LazyRoute> },
      { path: "editor", element: <LazyRoute area="Build Editor"><BuildEditorRoute /></LazyRoute> },
      { path: "editor/:buildId", element: <LazyRoute area="Build Editor"><BuildEditorRoute /></LazyRoute> },
    ],
  },
  // Unknown paths render the themed 404 , outside the app shell so the page
  // can take over the full viewport without nav chrome competing for focus.
  { path: "*", element: <NotFoundRoute /> },
])
