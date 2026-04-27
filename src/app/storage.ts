import type { Build, Scenario } from "../../product/sections/comparator/types"
import type { InventoryEntry } from "../../product/sections/inventory/types"

// Bump CURRENT_SCHEMA when persisted shapes change in incompatible ways.
// On bump, register a migration in MIGRATIONS so saved data carries forward
// instead of being silently corrupted.
const CURRENT_SCHEMA = 2

const KEYS = {
  builds: `oryxlab.v${CURRENT_SCHEMA}.builds`,
  scenario: `oryxlab.v${CURRENT_SCHEMA}.scenario`,
  inventory: `oryxlab.v${CURRENT_SCHEMA}.inventory`,
  savedBuilds: `oryxlab.v${CURRENT_SCHEMA}.savedBuilds`,
  theme: `oryxlab.v${CURRENT_SCHEMA}.theme`,
}

interface MigrationCtx {
  read: (key: string) => unknown
  write: (key: string, value: unknown) => void
  remove: (key: string) => void
}

// Each migration brings storage from version N to N+1. Add new ones here
// when the persisted shape changes.
const MIGRATIONS: Record<number, (ctx: MigrationCtx) => void> = {
  // v1 → v2: introduced Build.notes (optional, no migration needed beyond key
  // rename so downgrade-after-upgrade is impossible).
  1: ({ read, write, remove }) => {
    for (const name of ["builds", "scenario", "inventory", "savedBuilds", "theme"]) {
      const oldKey = `oryxlab.v1.${name}`
      const value = read(oldKey)
      if (value !== null && value !== undefined) {
        write(`oryxlab.v2.${name}`, value)
        remove(oldKey)
      }
    }
  },
}

// Run any pending migrations exactly once on startup. Records the highest
// applied version so subsequent runs skip the work.
function runMigrations() {
  if (typeof window === "undefined") return
  const versionKey = "oryxlab.schemaVersion"
  let appliedVersion = 1
  try {
    const raw = window.localStorage.getItem(versionKey)
    if (raw) appliedVersion = parseInt(raw, 10) || 1
  } catch {
    return
  }
  if (appliedVersion >= CURRENT_SCHEMA) return
  const ctx: MigrationCtx = {
    read: (k) => {
      try {
        const raw = window.localStorage.getItem(k)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    },
    write: (k, v) => {
      try {
        window.localStorage.setItem(k, JSON.stringify(v))
      } catch { /* ignore */ }
    },
    remove: (k) => {
      try {
        window.localStorage.removeItem(k)
      } catch { /* ignore */ }
    },
  }
  while (appliedVersion < CURRENT_SCHEMA) {
    const migrate = MIGRATIONS[appliedVersion]
    if (!migrate) break
    try {
      migrate(ctx)
    } catch (e) {
       
      console.error(`[storage] migration v${appliedVersion} → v${appliedVersion + 1} failed:`, e)
      break
    }
    appliedVersion++
  }
  try {
    window.localStorage.setItem(versionKey, String(appliedVersion))
  } catch { /* ignore */ }
}

runMigrations()

function safeGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function safeSet<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota exceeded or storage disabled */
  }
}

function safeRemove(key: string) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function loadBuilds(): Build[] | null {
  return safeGet<Build[]>(KEYS.builds)
}

export function saveBuilds(builds: Build[]) {
  safeSet(KEYS.builds, builds)
}

export function loadScenario(): Scenario | null {
  return safeGet<Scenario>(KEYS.scenario)
}

export function saveScenario(scenario: Scenario) {
  safeSet(KEYS.scenario, scenario)
}

export function loadInventory(): InventoryEntry[] | null {
  return safeGet<InventoryEntry[]>(KEYS.inventory)
}

export function saveInventory(entries: InventoryEntry[]) {
  safeSet(KEYS.inventory, entries)
}

export interface SavedBuildEntry {
  id: string
  name: string
  classId: string
  color: string
  build: Build
  tags: string[]
  notes: string
  savedAt: string
}

export function loadSavedBuilds(): SavedBuildEntry[] {
  return safeGet<SavedBuildEntry[]>(KEYS.savedBuilds) ?? []
}

export function saveSavedBuilds(entries: SavedBuildEntry[]) {
  safeSet(KEYS.savedBuilds, entries)
}

export function addSavedBuild(entry: SavedBuildEntry) {
  const all = loadSavedBuilds()
  const idx = all.findIndex((e) => e.id === entry.id)
  if (idx >= 0) all[idx] = entry
  else all.push(entry)
  saveSavedBuilds(all)
}

export function removeSavedBuild(id: string) {
  saveSavedBuilds(loadSavedBuilds().filter((e) => e.id !== id))
}

export function loadTheme(): "light" | "dark" {
  return (safeGet<string>(KEYS.theme) as "light" | "dark") ?? "dark"
}

export function saveTheme(theme: "light" | "dark") {
  safeSet(KEYS.theme, theme)
}

export function exportAll() {
  return {
    schemaVersion: CURRENT_SCHEMA,
    builds: loadBuilds(),
    scenario: loadScenario(),
    inventory: loadInventory(),
    savedBuilds: loadSavedBuilds(),
  }
}

export function importAll(data: ReturnType<typeof exportAll>) {
  if (data.schemaVersion !== CURRENT_SCHEMA) {
    throw new Error(
      `Schema mismatch: file is v${data.schemaVersion}, app is v${CURRENT_SCHEMA}`,
    )
  }
  if (data.builds) saveBuilds(data.builds)
  if (data.scenario) saveScenario(data.scenario)
  if (data.inventory) saveInventory(data.inventory)
  if (data.savedBuilds) saveSavedBuilds(data.savedBuilds)
}

export function clearAll() {
  safeRemove(KEYS.builds)
  safeRemove(KEYS.scenario)
  safeRemove(KEYS.inventory)
  safeRemove(KEYS.savedBuilds)
}
