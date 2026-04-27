import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { MainNav } from "../../src/shell/components/MainNav"

describe("<MainNav />", () => {
  const items = [
    { label: "Comparator", href: "/app", isActive: true },
    { label: "Catalog", href: "/app/catalog" },
    { label: "Optimizer", href: "/app/optimizer" },
    { label: "Inventory", href: "/app/inventory" },
  ]

  it("renders all nav items", () => {
    render(<MainNav items={items} />)
    items.forEach((it) => expect(screen.getByText(it.label)).toBeInTheDocument())
  })

  it("calls onNavigate without default navigation", () => {
    const onNavigate = vi.fn()
    render(<MainNav items={items} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByText("Catalog"))
    expect(onNavigate).toHaveBeenCalledWith("/app/catalog")
  })

  it("active item gets aria-current=page", () => {
    render(<MainNav items={items} />)
    const active = screen.getByText("Comparator").closest("a")
    expect(active?.getAttribute("aria-current")).toBe("page")
  })

  it("renders vertical orientation", () => {
    const { container } = render(<MainNav items={items} orientation="vertical" />)
    expect(container.querySelector(".flex-col")).toBeTruthy()
  })
})
