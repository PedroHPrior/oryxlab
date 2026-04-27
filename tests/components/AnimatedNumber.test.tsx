import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { AnimatedNumber } from "../../src/sections/_shared/AnimatedNumber"

describe("<AnimatedNumber />", () => {
  it("renders the initial value formatted", () => {
    render(<AnimatedNumber value={5840} />)
    expect(screen.getByText("5,840")).toBeInTheDocument()
  })

  it("respects custom format", () => {
    render(<AnimatedNumber value={0.17} format={(n) => n.toFixed(2)} />)
    expect(screen.getByText("0.17")).toBeInTheDocument()
  })
})
