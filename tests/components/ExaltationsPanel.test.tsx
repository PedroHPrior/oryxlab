import { describe, expect, it, vi } from "vitest"
import { render, fireEvent, screen } from "@testing-library/react"
import { ExaltationsPanel } from "../../src/sections/build-editor/components/ExaltationsPanel"

describe("<ExaltationsPanel />", () => {
  const empty = { att: 0, dex: 0, wis: 0, vit: 0, spd: 0, def: 0, hp: 0, mp: 0 }
  const maxed = { att: 5, dex: 5, wis: 5, vit: 5, spd: 5, def: 5, hp: 5, mp: 5 }

  it("renders all 8 stat rows", () => {
    render(<ExaltationsPanel exaltations={empty} />)
    expect(screen.getByText("ATT")).toBeInTheDocument()
    expect(screen.getByText("DEX")).toBeInTheDocument()
    expect(screen.getByText("WIS")).toBeInTheDocument()
    expect(screen.getByText("VIT")).toBeInTheDocument()
    expect(screen.getByText("SPD")).toBeInTheDocument()
    expect(screen.getByText("DEF")).toBeInTheDocument()
    expect(screen.getByText("HP")).toBeInTheDocument()
    expect(screen.getByText("MP")).toBeInTheDocument()
  })

  it("incrementing fires onChange with +1", () => {
    const onChange = vi.fn()
    render(<ExaltationsPanel exaltations={empty} onChange={onChange} />)
    const incButtons = screen.getAllByLabelText(/Increase/)
    fireEvent.click(incButtons[0])
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls[0][0].att).toBe(1)
  })

  it("decrement disabled at 0", () => {
    render(<ExaltationsPanel exaltations={empty} />)
    const decButtons = screen.getAllByLabelText(/Decrease/) as HTMLButtonElement[]
    expect(decButtons[0].disabled).toBe(true)
  })

  it("increment disabled at 5", () => {
    render(<ExaltationsPanel exaltations={maxed} />)
    const incButtons = screen.getAllByLabelText(/Increase/) as HTMLButtonElement[]
    expect(incButtons[0].disabled).toBe(true)
  })
})
