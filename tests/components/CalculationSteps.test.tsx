import { describe, expect, it } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { CalculationSteps } from "../../src/sections/build-editor/components/CalculationSteps"

describe("<CalculationSteps />", () => {
  const steps = [
    { label: "Base shot damage", expr: "(min 100 + max 180) / 2", value: 140, unit: "dmg" },
    { label: "ATT modifier", expr: "1 + (att 78 / 50) × 0.5", value: 1.78, unit: "×" },
  ]

  it("collapsed by default; expanding reveals steps", () => {
    render(<CalculationSteps steps={steps} />)
    expect(screen.queryByText("Base shot damage")).toBeNull()
    fireEvent.click(screen.getByText(/Show calculation/))
    expect(screen.getByText("Base shot damage")).toBeInTheDocument()
    expect(screen.getByText("ATT modifier")).toBeInTheDocument()
  })
})
