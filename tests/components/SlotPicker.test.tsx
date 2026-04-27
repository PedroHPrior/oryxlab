import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { SlotPicker } from "../../src/sections/comparator/components/SlotPicker"
import type { Item } from "../../product/sections/comparator/types"

const items: Item[] = [
  {
    id: "crystal-wand", name: "Crystal Wand", tier: "UT", rarity: "ut",
    type: "weapon", weaponType: "wand", classes: ["wizard"],
    stats: { dmgMin: 100, dmgMax: 180, shotsPerSec: 1.5, shots: 1 },
    tags: [], sprite: "crystal-wand",
  },
  {
    id: "wand-of-the-bulwark", name: "Wand of the Bulwark", tier: "UT", rarity: "ut",
    type: "weapon", weaponType: "wand", classes: ["wizard"],
    stats: { dmgMin: 50, dmgMax: 110, shotsPerSec: 1.6, shots: 2 },
    tags: ["multi-shot"], sprite: "wand-bulwark",
  },
  {
    id: "demon-blade", name: "Demon Blade", tier: "UT", rarity: "ut",
    type: "weapon", weaponType: "sword", classes: ["knight"],
    stats: { dmgMin: 320, dmgMax: 360 }, tags: [], sprite: "demon-blade",
  },
]

describe("<SlotPicker />", () => {
  it("filters items by slot type and class", () => {
    render(
      <SlotPicker
        slot="weapon"
        classId="wizard"
        currentItemId={null}
        items={items}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    )
    expect(screen.getByText("Crystal Wand")).toBeInTheDocument()
    expect(screen.getByText("Wand of the Bulwark")).toBeInTheDocument()
    // Demon Blade is for knight, not wizard — not shown
    expect(screen.queryByText("Demon Blade")).toBeNull()
  })

  it("search box filters items", () => {
    render(
      <SlotPicker
        slot="weapon"
        classId="wizard"
        currentItemId={null}
        items={items}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    )
    fireEvent.change(screen.getByPlaceholderText(/Search/), { target: { value: "Crystal" } })
    expect(screen.getByText("Crystal Wand")).toBeInTheDocument()
    expect(screen.queryByText("Wand of the Bulwark")).toBeNull()
  })

  it("clicking an item fires onSelect", () => {
    const onSelect = vi.fn()
    render(
      <SlotPicker
        slot="weapon"
        classId="wizard"
        currentItemId={null}
        items={items}
        onSelect={onSelect}
        onClose={() => {}}
      />,
    )
    fireEvent.click(screen.getByText("Crystal Wand"))
    expect(onSelect).toHaveBeenCalledWith("crystal-wand")
  })

  it("Esc key fires onClose", () => {
    const onClose = vi.fn()
    render(
      <SlotPicker
        slot="weapon"
        classId="wizard"
        currentItemId={null}
        items={items}
        onSelect={() => {}}
        onClose={onClose}
      />,
    )
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })

  it('"Unequip" appears when an item is currently equipped', () => {
    const onSelect = vi.fn()
    render(
      <SlotPicker
        slot="weapon"
        classId="wizard"
        currentItemId="crystal-wand"
        items={items}
        onSelect={onSelect}
        onClose={() => {}}
      />,
    )
    fireEvent.click(screen.getByText(/Unequip/i))
    expect(onSelect).toHaveBeenCalledWith(null)
  })
})
