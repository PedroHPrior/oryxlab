import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { DpsCurveChart } from "../../src/sections/comparator/components/DpsCurveChart"

describe("<DpsCurveChart />", () => {
  const curve1 = {
    id: "a",
    name: "Wiz BIS",
    color: "violet",
    values: [6420, 6320, 6210, 6100, 5990, 5915, 5840, 5725, 5610, 5495, 5380, 5260, 5140, 5020, 4900, 4780, 4660],
  }

  it("renders an SVG", () => {
    const { container } = render(<DpsCurveChart curves={[curve1]} highlightDef={50} />)
    expect(container.querySelector("svg")).toBeTruthy()
  })

  it("draws a path for each curve", () => {
    const { container } = render(<DpsCurveChart curves={[curve1, { ...curve1, id: "b", name: "Other" }]} />)
    const paths = container.querySelectorAll("path[stroke]")
    expect(paths.length).toBeGreaterThanOrEqual(2)
  })

  it("includes the highlightDef label", () => {
    const { container } = render(<DpsCurveChart curves={[curve1]} highlightDef={50} />)
    expect(container.textContent).toMatch(/def 50/)
  })
})
