import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { CatalogView } from "../../src/sections/catalog/CatalogView"
import type { CatalogFilters, CatalogItem } from "../../product/sections/catalog/types"

const items: CatalogItem[] = [
  { id: "a", name: "Crystal Wand", tier: "UT", tierNumeric: 99, rarity: "ut", type: "weapon", weaponType: "wand", classes: ["wizard"], stats: { dmgMin: 100, dmgMax: 180 }, tags: [], sprite: "a", dropsFrom: [], lore: "", owned: true },
  { id: "b", name: "Demon Blade", tier: "UT", tierNumeric: 99, rarity: "ut", type: "weapon", weaponType: "sword", classes: ["knight"], stats: { dmgMin: 320, dmgMax: 360 }, tags: [], sprite: "b", dropsFrom: [], lore: "", owned: false },
  { id: "c", name: "Ring of Decades", tier: "UT", tierNumeric: 99, rarity: "ut", type: "ring", classes: ["wizard"], stats: { hp: 200 }, tags: [], sprite: "c", dropsFrom: [], lore: "", owned: false },
]

const filters: CatalogFilters = {
  types: [], classes: [], tierMin: 0, tierMax: 14, rarities: [], mechanicsTags: [], statThresholds: [],
}

describe("<CatalogView />", () => {
  it("renders item count and items", () => {
    render(
      <CatalogView
        viewMode="cards" ownedOnly={false} search="" sort="name-asc"
        filters={filters} items={items} itemSets={[]} dropSources={[]} tagPalette={[]}
        quickCompare={{ open: false, selectedIds: [] }}
      />,
    )
    expect(screen.getByText(/3 of 3 items/)).toBeInTheDocument()
    expect(screen.getByText("Crystal Wand")).toBeInTheDocument()
    expect(screen.getByText("Demon Blade")).toBeInTheDocument()
    expect(screen.getByText("Ring of Decades")).toBeInTheDocument()
  })

  it("filters by type=ring", () => {
    render(
      <CatalogView
        viewMode="cards" ownedOnly={false} search="" sort="name-asc"
        filters={{ ...filters, types: ["ring"] }} items={items} itemSets={[]} dropSources={[]} tagPalette={[]}
        quickCompare={{ open: false, selectedIds: [] }}
      />,
    )
    expect(screen.getByText("Ring of Decades")).toBeInTheDocument()
    expect(screen.queryByText("Demon Blade")).toBeNull()
  })

  it("ownedOnly filters to owned items", () => {
    render(
      <CatalogView
        viewMode="cards" ownedOnly={true} search="" sort="name-asc"
        filters={filters} items={items} itemSets={[]} dropSources={[]} tagPalette={[]}
        quickCompare={{ open: false, selectedIds: [] }}
      />,
    )
    expect(screen.getByText("Crystal Wand")).toBeInTheDocument()
    expect(screen.queryByText("Demon Blade")).toBeNull()
  })

  it("search filters by name", () => {
    render(
      <CatalogView
        viewMode="cards" ownedOnly={false} search="demon" sort="name-asc"
        filters={filters} items={items} itemSets={[]} dropSources={[]} tagPalette={[]}
        quickCompare={{ open: false, selectedIds: [] }}
      />,
    )
    expect(screen.getByText("Demon Blade")).toBeInTheDocument()
    expect(screen.queryByText("Crystal Wand")).toBeNull()
  })

  it("List view mode renders rows", () => {
    render(
      <CatalogView
        viewMode="list" ownedOnly={false} search="" sort="name-asc"
        filters={filters} items={items} itemSets={[]} dropSources={[]} tagPalette={[]}
        quickCompare={{ open: false, selectedIds: [] }}
      />,
    )
    expect(screen.getAllByText("Compare").length).toBeGreaterThan(0)
  })

  it("clicking owned-only toggle fires callback", () => {
    const onToggle = vi.fn()
    render(
      <CatalogView
        viewMode="cards" ownedOnly={false} search="" sort="name-asc"
        filters={filters} items={items} itemSets={[]} dropSources={[]} tagPalette={[]}
        quickCompare={{ open: false, selectedIds: [] }}
        onToggleOwnedOnly={onToggle}
      />,
    )
    fireEvent.click(screen.getByText("Owned only"))
    expect(onToggle).toHaveBeenCalled()
  })

  it("empty results show clear-filters message", () => {
    render(
      <CatalogView
        viewMode="cards" ownedOnly={false} search="zzznotfound" sort="name-asc"
        filters={filters} items={items} itemSets={[]} dropSources={[]} tagPalette={[]}
        quickCompare={{ open: false, selectedIds: [] }}
      />,
    )
    expect(screen.getByText(/No items match/)).toBeInTheDocument()
  })
})
