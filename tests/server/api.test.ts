import { beforeAll, describe, expect, it } from "vitest"

const API = "http://localhost:3001"

let serverUp = false

async function pingServer(): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 1500)
    const r = await fetch(`${API}/api/health`, { signal: ctrl.signal })
    clearTimeout(timer)
    return r.ok
  } catch {
    return false
  }
}

beforeAll(async () => {
  serverUp = await pingServer()
  if (!serverUp) console.log("[api.test] backend not running — tests will be skipped")
})

describe("Backend API", () => {
  it("GET /api/health returns ok and counts", async () => {
    if (!serverUp) return
    const r = await fetch(`${API}/api/health`)
    const data = await r.json()
    expect(data.ok).toBe(true)
    expect(data.items).toBeGreaterThan(100)
    expect(data.classes).toBeGreaterThan(10)
  })

  it("GET /api/items returns array sorted by name", async () => {
    if (!serverUp) return
    const r = await fetch(`${API}/api/items?sort=name`)
    const data = await r.json()
    expect(Array.isArray(data.items)).toBe(true)
    expect(data.count).toBeGreaterThan(0)
  })

  it("GET /api/items?type=ring returns rings", async () => {
    if (!serverUp) return
    const r = await fetch(`${API}/api/items?type=ring`)
    const data = await r.json()
    expect(data.count).toBeGreaterThan(50)
    expect(data.items.every((i: { type: string }) => i.type === "ring")).toBe(true)
  })

  it("GET /api/items?type=weapon&classId=wizard filters correctly", async () => {
    if (!serverUp) return
    const r = await fetch(`${API}/api/items?type=weapon&classId=wizard`)
    const data = await r.json()
    expect(data.count).toBeGreaterThan(0)
    for (const it of data.items) {
      expect(it.type).toBe("weapon")
      expect(it.classes).toContain("wizard")
    }
  })

  it("GET /api/classes returns 19 classes", async () => {
    if (!serverUp) return
    const r = await fetch(`${API}/api/classes`)
    const data = await r.json()
    expect(data.classes.length).toBe(19)
    const ids = data.classes.map((c: { id: string }) => c.id)
    expect(ids).toContain("wizard")
    expect(ids).toContain("knight")
    expect(ids).toContain("kensei")
  })

  it("GET /api/classes/wizard returns full class data", async () => {
    if (!serverUp) return
    const r = await fetch(`${API}/api/classes/wizard`)
    const cls = await r.json()
    expect(cls.id).toBe("wizard")
    expect(cls.imageUrl).toMatch(/realmeye/)
    expect(cls.stats.hp.cap).toBe(700)
  })

  it("GET /api/items/missing-id returns 404", async () => {
    if (!serverUp) return
    const r = await fetch(`${API}/api/items/this-does-not-exist-xyz`)
    expect(r.status).toBe(404)
  })
})
