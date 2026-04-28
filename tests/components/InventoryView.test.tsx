import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { InventoryView } from "../../src/sections/inventory/InventoryView"
import type { InventoryEntry, OwnedSummary, RealmEyeImportState, ManualSelectionState } from "../../product/sections/inventory/types"

const summary: OwnedSummary = {
  weapon: { owned: 1, total: 240 },
  ability: { owned: 0, total: 180 },
  armor: { owned: 0, total: 160 },
  ring: { owned: 0, total: 220 },
  }

const entries: InventoryEntry[] = [
  { itemId: "a", name: "Crystal Wand", tier: "UT", type: "weapon", sprite: "a", addedAt: "2026-04-19T11:00:00Z" },
]

const realmEye: RealmEyeImportState = { open: false, step: "enter-username", input: "", preview: null }
const manualSel: ManualSelectionState = { open: false, pendingAdds: [], pendingRemoves: [] }

describe("<InventoryView />", () => {
  it("empty view shows two CTA cards", () => {
    render(
      <InventoryView
        view="empty" search="" ownedSummary={summary} ownedEntries={[]}
        realmEyeImport={realmEye} manualSelection={manualSel}
      />,
    )
    expect(screen.getByText(/Set up your inventory/)).toBeInTheDocument()
    expect(screen.getByText(/Mark items I own/)).toBeInTheDocument()
    expect(screen.getByText(/Import from RealmEye/)).toBeInTheDocument()
  })

  it("populated view shows owned entries grouped", () => {
    render(
      <InventoryView
        view="populated" search="" ownedSummary={summary} ownedEntries={entries}
        realmEyeImport={realmEye} manualSelection={manualSel}
      />,
    )
    expect(screen.getByText("Crystal Wand")).toBeInTheDocument()
    expect(screen.getByText(/owned items/)).toBeInTheDocument()
  })

  it("clicking remove button fires callback", () => {
    const onRemove = vi.fn()
    render(
      <InventoryView
        view="populated" search="" ownedSummary={summary} ownedEntries={entries}
        realmEyeImport={realmEye} manualSelection={manualSel}
        onRemoveEntry={onRemove}
      />,
    )
    fireEvent.click(screen.getByLabelText(/Remove from inventory/))
    expect(onRemove).toHaveBeenCalledWith("a")
  })

  it('search field fires onSearchChange', () => {
    const onSearch = vi.fn()
    render(
      <InventoryView
        view="populated" search="" ownedSummary={summary} ownedEntries={entries}
        realmEyeImport={realmEye} manualSelection={manualSel}
        onSearchChange={onSearch}
      />,
    )
    fireEvent.change(screen.getByPlaceholderText(/Search owned/), { target: { value: "wand" } })
    expect(onSearch).toHaveBeenCalledWith("wand")
  })

  it("export/import/clear buttons fire callbacks", () => {
    const onExport = vi.fn(), onImport = vi.fn(), onClear = vi.fn()
    render(
      <InventoryView
        view="populated" search="" ownedSummary={summary} ownedEntries={entries}
        realmEyeImport={realmEye} manualSelection={manualSel}
        onExport={onExport} onImport={onImport} onClearAll={onClear}
      />,
    )
    fireEvent.click(screen.getByText("Export JSON"))
    expect(onExport).toHaveBeenCalled()
    fireEvent.click(screen.getByText("Import JSON"))
    expect(onImport).toHaveBeenCalled()
    fireEvent.click(screen.getByText(/Remove all/))
    expect(onClear).toHaveBeenCalled()
  })
})
