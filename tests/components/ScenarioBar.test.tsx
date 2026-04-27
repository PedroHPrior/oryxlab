import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { ScenarioBar, type Scenario } from "../../src/shell/components/ScenarioBar"

const scenario: Scenario = {
  presetId: "party-o3",
  targetDefense: 50,
  targetStatuses: ["armorBroken"],
  partyBuffs: ["paladinSeal"],
}

describe("<ScenarioBar />", () => {
  it("collapsed mode shows ▾ Scenario button", () => {
    render(<ScenarioBar scenario={scenario} open={false} />)
    expect(screen.getByText(/Scenario/)).toBeInTheDocument()
  })

  it("expanded mode renders all status chips", () => {
    render(<ScenarioBar scenario={scenario} open={true} />)
    expect(screen.getByText("Armor Broken")).toBeInTheDocument()
    expect(screen.getByText("Bleeding")).toBeInTheDocument()
    expect(screen.getByText("Exposed")).toBeInTheDocument()
  })

  it("toggling a buff calls onChange", () => {
    const onChange = vi.fn()
    render(<ScenarioBar scenario={scenario} open={true} onChange={onChange} />)
    fireEvent.click(screen.getByText("Warrior Helm"))
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls[0][0].partyBuffs).toContain("warriorHelm")
  })

  it("changing target defense calls onChange", () => {
    const onChange = vi.fn()
    render(<ScenarioBar scenario={scenario} open={true} onChange={onChange} />)
    const slider = screen.getByLabelText(/Target Def/i)
    fireEvent.change(slider, { target: { value: "60" } })
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls[0][0].targetDefense).toBe(60)
  })
})
