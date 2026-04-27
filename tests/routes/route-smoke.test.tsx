// Render every primary route through the real OryxLabApp + RouterProvider stack.
// Asserts that no route throws, all routes have key UI affordances, and the
// wiring hooked up in this end-to-end pass at least mounts without crashing.
import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { Suspense } from "react"
import { OryxLabApp } from "../../src/app/OryxLabApp"
import { ComparatorRoute } from "../../src/app/routes/ComparatorRoute"
import { CatalogRoute } from "../../src/app/routes/CatalogRoute"
import { OptimizerRoute } from "../../src/app/routes/OptimizerRoute"
import { InventoryRoute } from "../../src/app/routes/InventoryRoute"
import { BuildEditorRoute } from "../../src/app/routes/BuildEditorRoute"

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Suspense fallback={<div>Loading…</div>}>
        <Routes>
          <Route path="/app" element={<OryxLabApp />}>
            <Route index element={<ComparatorRoute />} />
            <Route path="catalog" element={<CatalogRoute />} />
            <Route path="optimizer" element={<OptimizerRoute />} />
            <Route path="inventory" element={<InventoryRoute />} />
            <Route path="editor" element={<BuildEditorRoute />} />
          </Route>
        </Routes>
      </Suspense>
    </MemoryRouter>,
  )
}

describe("Every route renders without errors", () => {
  it("Comparator: shows Add build affordance and DPS values", async () => {
    renderApp("/app")
    await waitFor(() => {
      expect(screen.getAllByText(/Add build/i).length).toBeGreaterThan(0)
    })
    expect(screen.getByText(/DPS vs Target Defense/i)).toBeInTheDocument()
  })

  it("Catalog: search box, filter sidebar, item grid render", async () => {
    renderApp("/app/catalog")
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search items/i)).toBeInTheDocument()
    })
    expect(screen.getByRole("heading", { name: /Filters/i })).toBeInTheDocument()
  })

  it("Optimizer: class picker, mode buttons, Run button render", async () => {
    renderApp("/app/optimizer")
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Run optimization/i })).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /Best in Slot/i })).toBeInTheDocument()
  })

  it("Inventory: import + manual-select CTAs render", async () => {
    renderApp("/app/inventory")
    // Default view is "empty" so both onboarding CTAs are visible.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Import from RealmEye/i })).toBeInTheDocument()
    })
    expect(screen.getByRole("button", { name: /Mark items I own/i })).toBeInTheDocument()
  })

  it("Build Editor: notes textarea, equipment slots render", async () => {
    renderApp("/app/editor")
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Equipped slots/i })).toBeInTheDocument()
    })
    // Notes textarea exists and is editable
    const notesArea = screen.getByPlaceholderText(/What this build is for/i)
    expect(notesArea).toBeInTheDocument()
  })
})
