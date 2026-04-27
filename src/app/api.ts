import type { Item } from "../../product/sections/comparator/types"
import type { PlayerClassDef } from "../engine/dps"

export interface ApiClass extends PlayerClassDef {
  id: string
  name: string
  portraitColor: string
  imageUrl: string | null
  weaponType: string | null
  abilityType: string | null
  armorType: string | null
}

// Static data paths — bundled in /public/data and served as-is.
// Vercel serves these as static files. In dev, Vite serves them from public/.
async function getJSON<T>(path: string): Promise<T> {
  const r = await fetch(path)
  if (!r.ok) throw new Error(`Failed to fetch ${path}: ${r.status}`)
  return r.json() as Promise<T>
}

export async function fetchItems(): Promise<Item[]> {
  // Try static first (works in production); fall back to dev backend if proxy is on
  try {
    return await getJSON<Item[]>("/data/items.json")
  } catch {
    const data = await getJSON<{ items: Item[] }>("/api/items?sort=name")
    return data.items
  }
}

export async function fetchClasses(): Promise<ApiClass[]> {
  try {
    return await getJSON<ApiClass[]>("/data/classes.json")
  } catch {
    const data = await getJSON<{ classes: ApiClass[] }>("/api/classes")
    return data.classes
  }
}

export async function importRealmEye(username: string): Promise<{
  username: string
  preview: {
    username: string
    vaultCount: number
    characterCount: number
    characters: {
      id: string
      classId: string
      className: string
      equippedItems: Array<string | null | { slug: string; name: string }>
    }[]
    delta: { added: number; removed: number; unchanged: number }
  }
  items: { slug: string; name: string; imageUrl: string }[]
  isPrivate?: boolean
}> {
  // Try Vercel-style endpoint first, fall back to dev backend
  let url = "/api/inventory-import"
  let r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  })
  if (r.status === 404) {
    url = "/api/inventory/realmeye-import"
    r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
  }
  if (!r.ok) throw new Error(`import failed: ${r.status}`)
  return r.json()
}
