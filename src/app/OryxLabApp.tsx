import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { AppShell } from "../shell/components/AppShell"
import type { Scenario, ScenarioPreset, ViewMode, BuildSlots, Exaltations, Build, Item } from "../../product/sections/comparator/types"
import type { CatalogFilters, CatalogViewMode, SortKey, QuickCompareState } from "../../product/sections/catalog/types"
import type { Constraint, OptimizationRequest } from "../../product/sections/optimizer/types"
import type { InventoryView as InventoryViewMode, RealmEyeImportState, ManualSelectionState, OwnedSummary, InventoryEntry } from "../../product/sections/inventory/types"
import comparatorData from "../../product/sections/comparator/data.json"
import optimizerData from "../../product/sections/optimizer/data.json"
import inventoryData from "../../product/sections/inventory/data.json"
import catalogData from "../../product/sections/catalog/data.json"
import type { ItemSet } from "../../product/sections/catalog/types"
import { OryxLabContext, type OryxLabActions, type OryxLabState } from "./state"
import { fetchClasses, fetchItems, importRealmEye, type ApiClass } from "./api"
import { computeDerivedStats } from "../engine/dps"
import {
  loadBuilds, saveBuilds,
  loadScenario, saveScenario,
  loadInventory, saveInventory,
  loadSavedBuilds, addSavedBuild as storageSaveBuild,
} from "./storage"
import { buildShareUrl, decodeShareState } from "./share"
import { createLogger } from "./logger"
import { useToast } from "../sections/_shared"

const log = createLogger("oryxlab.app")

const SCENARIO_PRESETS = comparatorData.scenarioPresets as ScenarioPreset[]
const STARTER_BUILDS = comparatorData.builds as Build[]

// Distinct colors for build columns / chart curves. Picked to be visually
// separable in both dark and light mode, and to map cleanly onto Tailwind
// utility classes (`text-{color}-400`, `bg-{color}-400/10`).
const BUILD_COLORS = ["violet", "amber", "lime", "rose", "sky", "emerald"] as const

// Returns the first color from BUILD_COLORS that's not already used by
// an existing build. Falls back to a hash-based pick after 6 builds (the
// hard cap for the comparator) so duplicates can't sneak in via odd flows.
function pickBuildColor(existing: Pick<Build, "color">[]): Build["color"] {
  const used = new Set(existing.map((b) => b.color))
  for (const c of BUILD_COLORS) if (!used.has(c)) return c
  // All six slots used; deterministic fallback so the same new-build click
  // always yields the same color.
  return BUILD_COLORS[existing.length % BUILD_COLORS.length]
}

const NAV_ITEMS_DEFAULT = [
  { label: "Comparator", href: "/app", isActive: false },
  { label: "Catalog", href: "/app/catalog", isActive: false },
  { label: "Optimizer", href: "/app/optimizer", isActive: false },
  { label: "Inventory", href: "/app/inventory", isActive: false },
]

const DEFAULT_FILTERS: CatalogFilters = {
  types: [],
  classes: [],
  tierMin: 0,
  tierMax: 15,
  rarities: [],
  mechanicsTags: [],
  statThresholds: [],
}

export function OryxLabApp() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [items, setItems] = useState<Item[]>([])
  const [classesData, setClassesData] = useState<ApiClass[]>([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [itemsError, setItemsError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchItems(), fetchClasses()])
      .then(([its, cls]) => {
        if (cancelled) return
        setItems(its)
        setClassesData(cls)
        setItemsLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setItemsError(String(err?.message ?? err))
        setItemsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const [comparatorViewMode, setComparatorViewMode] = useState<ViewMode>("cards")
  const [builds, setBuilds] = useState<Build[]>(() => loadBuilds() ?? STARTER_BUILDS)
  const [globalScenario, setGlobalScenarioState] = useState<Scenario>(
    () => loadScenario() ?? (comparatorData.globalScenario as Scenario),
  )

  // Mirror frequently-read state into refs so the giant `actions` object can
  // close over them without re-creating its identity on every keystroke. Each
  // ref is kept current via a write-only effect , readers never depend on the
  // ref itself, so the actions surface stays referentially stable.
  const buildsRef = useRef(builds)
  useEffect(() => {
    buildsRef.current = builds
    saveBuilds(builds)
  }, [builds])
  useEffect(() => {
    saveScenario(globalScenario)
  }, [globalScenario])

  // On mount: check for ?s=... share fragment and apply it
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("s")
    if (!code) return
    decodeShareState(code).then((decoded) => {
      if (!decoded) return
      setBuilds(decoded.builds)
      setGlobalScenarioState(decoded.scenario)
    })
     
  }, [])

  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const itemSets = useMemo<ItemSet[]>(() => (catalogData.itemSets as ItemSet[]) ?? [], [])

  const buildsWithComputedStats = useMemo(() => {
    if (!classesData.length || !items.length) return builds
    return builds.map((b) => {
      const cls = classesData.find((c) => c.id === b.classId)
      if (!cls) return b
      const scn = b.useCustomScenario && b.scenarioOverride ? b.scenarioOverride : globalScenario
      try {
        const ds = computeDerivedStats({ build: b, scenario: scn, classDef: cls, itemMap, itemSets })
        return { ...b, derivedStats: ds }
      } catch {
        return b
      }
    })
  }, [builds, classesData, items, itemMap, itemSets, globalScenario])

  const [catalogViewMode, setCatalogViewMode] = useState<CatalogViewMode>("cards")
  const [catalogOwnedOnly, setCatalogOwnedOnly] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState("")
  const [catalogSort, setCatalogSort] = useState<SortKey>("name-asc")
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(DEFAULT_FILTERS)
  const [catalogQuickCompare, setCatalogQuickCompare] = useState<QuickCompareState>({ open: false, selectedIds: [] })

  const [optimizerRequest, setOptimizerRequest] = useState<OptimizationRequest>(
    optimizerData.request as OptimizationRequest,
  )
  const [optimizerIsRunning, setOptimizerIsRunning] = useState(false)

  const [inventoryView, setInventoryView] = useState<InventoryViewMode>(
    inventoryData.view as InventoryViewMode,
  )
  const [inventorySearch, setInventorySearch] = useState("")
  const [inventoryOwnedSummary] = useState<OwnedSummary>(
    inventoryData.ownedSummary as OwnedSummary,
  )
  const [inventoryOwnedEntries, setInventoryOwnedEntries] = useState<InventoryEntry[]>(
    () => loadInventory() ?? (inventoryData.ownedEntries as InventoryEntry[]),
  )

  // Refs kept current for stale-free reads inside the `actions` closure.
  const itemsRef = useRef(items)
  useEffect(() => { itemsRef.current = items }, [items])
  const inventoryRef = useRef(inventoryOwnedEntries)
  useEffect(() => {
    inventoryRef.current = inventoryOwnedEntries
    saveInventory(inventoryOwnedEntries)
  }, [inventoryOwnedEntries])
  const scenarioRef = useRef(globalScenario)
  useEffect(() => { scenarioRef.current = globalScenario }, [globalScenario])
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast }, [toast])
  const [realmEyeImport, setRealmEyeImport] = useState<RealmEyeImportState>(
    inventoryData.realmEyeImport as RealmEyeImportState,
  )
  const [manualSelection, setManualSelection] = useState<ManualSelectionState>(
    inventoryData.manualSelection as ManualSelectionState,
  )

  const [isSavedBuildsOpen, setSavedBuildsOpen] = useState(false)
  const [savedBuildsCount, setSavedBuildsCount] = useState(() => loadSavedBuilds().length)

  const navItems = useMemo(() => {
    const path = location.pathname
    return NAV_ITEMS_DEFAULT.map((n) => ({
      ...n,
      isActive:
        n.href === "/app"
          ? path === "/app" || path === "/app/" || path.startsWith("/app/editor")
          : path.startsWith(n.href),
    }))
  }, [location.pathname])

  const setGlobalScenario = useCallback((s: Scenario) => {
    setGlobalScenarioState({ ...s, presetId: null })
  }, [])

  const applyScenarioPreset = useCallback((presetId: string) => {
    if (presetId === "custom") {
      setGlobalScenarioState((s) => ({ ...s, presetId: null }))
      return
    }
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId)
    if (preset) {
      setGlobalScenarioState({
        presetId: preset.id,
        targetDefense: preset.targetDefense,
        targetStatuses: preset.targetStatuses,
        partyBuffs: preset.partyBuffs,
      })
    }
  }, [])

  const updateBuild = useCallback((id: string, mut: (b: Build) => Build) => {
    setBuilds((curr) => curr.map((b) => (b.id === id ? mut(b) : b)))
  }, [])

  const actions: OryxLabActions = useMemo(
    () => ({
      setComparatorViewMode,
      setGlobalScenario,
      applyScenarioPreset,

      changeBuildSlot: (buildId, slot, itemId) =>
        updateBuild(buildId, (b) => ({
          ...b,
          slots: { ...b.slots, [slot]: itemId } as BuildSlots,
        })),
      renameBuild: (buildId, name) =>
        updateBuild(buildId, (b) => ({ ...b, name })),
      toggleCustomScenario: (buildId, useCustom) =>
        updateBuild(buildId, (b) => ({ ...b, useCustomScenario: useCustom })),
      changeBuildScenario: (buildId, scenario) =>
        updateBuild(buildId, (b) => ({ ...b, scenarioOverride: scenario })),
      changeExaltations: (buildId, exalts) =>
        updateBuild(buildId, (b) => ({ ...b, exaltations: exalts as Exaltations })),
      changeBuildNotes: (buildId: string, notes: string) =>
        updateBuild(buildId, (b) => ({ ...b, notes })),
      replaceBuild: (buildId: string, snapshot: Build) =>
        updateBuild(buildId, () => ({ ...snapshot, id: buildId })),
      duplicateBuild: (buildId) =>
        setBuilds((curr) => {
          const orig = curr.find((b) => b.id === buildId)
          if (!orig) return curr
          const copy: Build = {
            ...orig,
            id: `${orig.id}-copy-${Date.now()}`,
            name: `${orig.name} (copy)`,
            color: pickBuildColor(curr),
          }
          return [...curr, copy]
        }),
      removeBuild: (buildId) =>
        setBuilds((curr) => curr.filter((b) => b.id !== buildId)),
      saveBuild: (buildId) => {
        const b = buildsRef.current.find((x) => x.id === buildId)
        if (!b) return
        storageSaveBuild({
          id: `saved-${b.id}-${Date.now()}`,
          name: b.name,
          classId: b.classId,
          color: b.color,
          build: b,
          tags: b.tags,
          notes: "",
          savedAt: new Date().toISOString(),
        })
        const total = loadSavedBuilds().length
        setSavedBuildsCount(total)
        toastRef.current.push(`Saved “${b.name}” · ${total} build${total === 1 ? "" : "s"} in vault`, "success")
      },
      addBuild: () =>
        setBuilds((curr) => [
          ...curr,
          {
            ...STARTER_BUILDS[0],
            id: `build-new-${Date.now()}`,
            name: "New build",
            color: pickBuildColor(curr),
            tags: [],
          },
        ]),
      // Add a new build column populated with a single item placed in the
      // correct slot based on its type. Used by the Catalog's "Send to comparator"
      // and item-detail "Send to comparator" buttons.
      addBuildWithItem: (itemId: string) => {
        const item = itemsRef.current.find((i) => i.id === itemId)
        if (!item) return
        // Pick a starter build whose class can equip this item; fall back to the
        // first starter that includes the item's first class.
        const targetClass = item.classes?.[0] ?? STARTER_BUILDS[0].classId
        const slotKey: keyof BuildSlots =
          item.type === "weapon" ? "weapon"
          : item.type === "ability" ? "ability"
          : item.type === "armor" ? "armor"
          : "ring"
        setBuilds((curr) => [
          ...curr,
          {
            ...STARTER_BUILDS[0],
            id: `build-${itemId}-${Date.now()}`,
            name: `${item.name} build`,
            classId: targetClass,
            color: pickBuildColor(curr),
            tags: [],
            slots: {
              weapon: null,
              ability: null,
              armor: null,
              ring: null,
              [slotKey]: itemId,
            } as BuildSlots,
          },
        ])
      },
      // Add a new build column from optimizer result slots + class.
      addBuildFromSlots: (classId: string, slots: BuildSlots, name: string) => {
        setBuilds((curr) => [
          ...curr,
          {
            ...STARTER_BUILDS[0],
            id: `build-opt-${Date.now()}`,
            name,
            classId,
            color: pickBuildColor(curr),
            tags: [],
            slots,
          },
        ])
      },
      // Save an optimizer result directly to saved-builds storage without
      // first sending it to the comparator.
      saveOptimizerResult: (classId: string, slots: BuildSlots, name: string) => {
        const synthetic: Build = {
          ...STARTER_BUILDS[0],
          id: `build-opt-${Date.now()}`,
          name,
          classId,
          tags: [],
          slots,
        }
        storageSaveBuild({
          id: `saved-opt-${Date.now()}`,
          name,
          classId,
          color: synthetic.color,
          build: synthetic,
          tags: [],
          notes: "From optimizer",
          savedAt: new Date().toISOString(),
        })
        const total = loadSavedBuilds().length
        setSavedBuildsCount(total)
        toastRef.current.push(`Saved “${name}” · ${total} build${total === 1 ? "" : "s"} in vault`, "success")
      },
      // Apply a swap suggestion: change one slot in one build to a new item.
      applySwapToBuild: (buildId: string, slot: keyof BuildSlots, itemId: string) => {
        updateBuild(buildId, (b) => ({
          ...b,
          slots: { ...b.slots, [slot]: itemId },
        }))
      },
      // Reassign a build to a different class. Wipes class-restricted slots
      // (weapon / ability / armor) so the user doesn't end up with an item
      // that no longer fits the new class. Rings are class-agnostic and stay
      // equipped.
      changeBuildClass: (buildId: string, classId: string) => {
        updateBuild(buildId, (b) => ({
          ...b,
          classId,
          slots: {
            weapon: null,
            ability: null,
            armor: null,
            ring: b.slots.ring,
          } as BuildSlots,
        }))
      },
      applyStarterCard: () => setBuilds(STARTER_BUILDS.slice(0, 2)),

      setCatalogViewMode,
      toggleCatalogOwnedOnly: () => setCatalogOwnedOnly((v) => !v),
      setCatalogSearch,
      setCatalogSort,
      setCatalogFilters: (f) => setCatalogFilters(f),
      clearCatalogFilters: () => setCatalogFilters(DEFAULT_FILTERS),
      toggleQuickCompareItem: (itemId) =>
        setCatalogQuickCompare((s) => ({
          ...s,
          selectedIds: s.selectedIds.includes(itemId)
            ? s.selectedIds.filter((i) => i !== itemId)
            : [...s.selectedIds, itemId],
        })),
      openQuickCompare: () => setCatalogQuickCompare((s) => ({ ...s, open: true })),
      closeQuickCompare: () => setCatalogQuickCompare((s) => ({ ...s, open: false })),

      setOptimizerClass: (classId) =>
        setOptimizerRequest((r) => ({ ...r, classId })),
      setOptimizerMode: (mode) =>
        setOptimizerRequest((r) => ({ ...r, mode })),
      setOptimizerObjective: (objective) =>
        setOptimizerRequest((r) => ({ ...r, objective })),
      addOptimizerConstraint: (entry) =>
        setOptimizerRequest((r) => {
          const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
          const next: Constraint =
            entry.kind === "stat"
              ? { id, kind: "stat", stat: entry.stat!, op: "gte", value: Number(entry.default ?? 0) }
              : { id, kind: "rule", rule: entry.rule!, value: entry.default ?? null }
          return { ...r, constraints: [...r.constraints, next] }
        }),
      updateOptimizerConstraint: (id, value) =>
        setOptimizerRequest((r) => ({
          ...r,
          constraints: r.constraints.map((c) =>
            c.id === id ? ({ ...c, value } as Constraint) : c,
          ),
        })),
      removeOptimizerConstraint: (id) =>
        setOptimizerRequest((r) => ({
          ...r,
          constraints: r.constraints.filter((c) => c.id !== id),
        })),
      runOptimizer: () => {
        setOptimizerIsRunning(true)
        setTimeout(() => setOptimizerIsRunning(false), 500)
      },

      setInventoryView,
      setInventorySearch,
      openManualSelect: () => setManualSelection((s) => ({ ...s, open: true })),
      openRealmEyeImport: () =>
        setRealmEyeImport((s) => ({ ...s, open: true, step: "enter-username" })),
      changeRealmEyeInput: (value) =>
        setRealmEyeImport((s) => ({ ...s, input: value })),
      fetchRealmEyePreview: async () => {
        // Read current input via setState callback to avoid stale closure on the
        // outer `realmEyeImport` value when this handler is invoked just after
        // a typing event in the same React batch.
        let username = ""
        setRealmEyeImport((curr) => {
          username = curr.input?.trim() ?? ""
          return curr
        })
        if (!username) return
        try {
          const r = await importRealmEye(username)
          setRealmEyeImport((s) => ({
            ...s,
            step: "preview",
            preview: r.preview,
            pendingItems: r.items,
          }))
        } catch (e) {
          setRealmEyeImport((s) => ({
            ...s,
            step: "preview",
            preview: s.preview ?? (inventoryData.realmEyeImport.preview as RealmEyeImportState["preview"]),
          }))
          log.error("RealmEye import failed:", e)
        }
      },
      confirmRealmEyeOverwrite: () => {
        // Match imported items to our catalog by slug → id, then by lowercased
        // name. Items not found in the catalog (e.g. brand-new releases we
        // haven't scraped yet) are silently dropped.
        setRealmEyeImport((s) => {
          const pending = s.pendingItems ?? []
          const catalog = itemsRef.current
          const slugMap = new Map(catalog.map((i) => [i.id, i]))
          const nameMap = new Map(
            catalog.map((i) => [i.name.toLowerCase().replace(/\s*\(sb\)\s*$/, "").trim(), i]),
          )
          const entries: InventoryEntry[] = []
          const seen = new Set<string>()
          for (const p of pending) {
            const cleanName = p.name.toLowerCase().replace(/\s*\(sb\)\s*$/, "").trim()
            const it = slugMap.get(p.slug) ?? nameMap.get(cleanName)
            if (!it || seen.has(it.id)) continue
            seen.add(it.id)
            entries.push({
              itemId: it.id,
              name: it.name,
              tier: it.tier,
              type: it.type,
              sprite: it.sprite ?? it.id,
              imageUrl: it.imageUrl,
              addedAt: new Date().toISOString(),
            })
          }
          setInventoryOwnedEntries(entries)
          return { ...s, step: "confirmed", open: false, pendingItems: undefined }
        })
      },
      confirmRealmEyeMerge: () => {
        setRealmEyeImport((s) => {
          const pending = s.pendingItems ?? []
          const catalog = itemsRef.current
          const slugMap = new Map(catalog.map((i) => [i.id, i]))
          const nameMap = new Map(
            catalog.map((i) => [i.name.toLowerCase().replace(/\s*\(sb\)\s*$/, "").trim(), i]),
          )
          setInventoryOwnedEntries((curr) => {
            const existingIds = new Set(curr.map((e) => e.itemId))
            const additions: InventoryEntry[] = []
            for (const p of pending) {
              const cleanName = p.name.toLowerCase().replace(/\s*\(sb\)\s*$/, "").trim()
              const it = slugMap.get(p.slug) ?? nameMap.get(cleanName)
              if (!it || existingIds.has(it.id)) continue
              existingIds.add(it.id)
              additions.push({
                itemId: it.id,
                name: it.name,
                tier: it.tier,
                type: it.type,
                sprite: it.sprite ?? it.id,
                imageUrl: it.imageUrl,
                addedAt: new Date().toISOString(),
              })
            }
            return [...curr, ...additions]
          })
          return { ...s, step: "confirmed", open: false, pendingItems: undefined }
        })
      },
      closeRealmEyeImport: () =>
        setRealmEyeImport((s) => ({ ...s, open: false, step: "enter-username", input: "" })),
      removeInventoryEntry: (itemId) =>
        setInventoryOwnedEntries((curr) => curr.filter((e) => e.itemId !== itemId)),
      // Create a Comparator build from a RealmEye character's currently
      // equipped items. Slot assignment is type-driven from our catalog so
      // the build matches the player's actual loadout for fair comparison
      // against optimizer suggestions.
      createBuildFromCharacter: (
        classId: string,
        equipped: Array<{ slug: string; name: string }>,
      ) => {
        const catalog = itemsRef.current
        const slugMap = new Map(catalog.map((i) => [i.id, i]))
        const nameMap = new Map(
          catalog.map((i) => [i.name.toLowerCase().replace(/\s*\(sb\)\s*$/, "").trim(), i]),
        )
        const slots: BuildSlots = {
          weapon: null, ability: null, armor: null, ring: null,
        }
        for (const e of equipped) {
          const cleanName = e.name.toLowerCase().replace(/\s*\(sb\)\s*$/, "").trim()
          const item = slugMap.get(e.slug) ?? nameMap.get(cleanName)
          if (!item) continue
          if (item.type === "weapon" && !slots.weapon) slots.weapon = item.id
          else if (item.type === "ability" && !slots.ability) slots.ability = item.id
          else if (item.type === "armor" && !slots.armor) slots.armor = item.id
          else if (item.type === "ring" && !slots.ring) slots.ring = item.id
        }
        const className = classId.charAt(0).toUpperCase() + classId.slice(1)
        setBuilds((curr) => [
          ...curr,
          {
            ...STARTER_BUILDS[0],
            id: `build-char-${classId}-${Date.now()}`,
            name: `${className} (current)`,
            classId,
            color: pickBuildColor(curr),
            tags: ["from-realmeye"],
            slots,
          },
        ])
      },
      addInventoryEntry: (itemId: string) => {
        setInventoryOwnedEntries((curr) => {
          if (curr.some((e) => e.itemId === itemId)) return curr
          const item = itemsRef.current.find((i) => i.id === itemId)
          if (!item) return curr
          return [
            ...curr,
            {
              itemId,
              name: item.name,
              tier: item.tier,
              type: item.type,
              sprite: item.sprite ?? itemId,
              imageUrl: item.imageUrl,
              addedAt: new Date().toISOString(),
            },
          ]
        })
      },
      clearInventory: () => setInventoryOwnedEntries([]),
      // Download current inventory as a JSON file the user can re-upload later
      // or share between devices.
      exportInventoryJson: () => {
        const data = {
          version: 1,
          exportedAt: new Date().toISOString(),
          entries: inventoryRef.current,
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `oryxlab-inventory-${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      },
      importInventoryJson: async (file: File) => {
        try {
          const text = await file.text()
          const parsed = JSON.parse(text)
          if (!Array.isArray(parsed.entries)) {
            log.error("Inventory import: missing 'entries' array")
            return
          }
          // Validate each entry has at least an itemId before merging
          const validEntries = parsed.entries.filter(
            (e: unknown): e is InventoryEntry =>
              typeof e === "object" && e !== null && typeof (e as InventoryEntry).itemId === "string",
          )
          setInventoryOwnedEntries(validEntries)
        } catch (e) {
          log.error("Inventory import failed:", e)
        }
      },

      setOpenSavedBuildsDrawer: (open: boolean) => setSavedBuildsOpen(open),
      isSavedBuildsOpen,
      shareComparator: async () => {
        try {
          const url = await buildShareUrl(buildsRef.current, scenarioRef.current)
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            await navigator.clipboard.writeText(url)
            toastRef.current.push("Comparator link copied to clipboard", "success")
          } else {
            toastRef.current.push("Clipboard unavailable , open the URL bar to copy", "info")
          }
        } catch (e) {
          log.error("share failed", e)
          toastRef.current.push("Could not generate share link", "error")
        }
      },

      navigateToEditor: (buildId) => navigate(`/app/editor/${buildId}`),
      navigateToInventory: () => navigate("/app/inventory"),
    }),
    [
      applyScenarioPreset,
      isSavedBuildsOpen,
      navigate,
      setGlobalScenario,
      updateBuild,
    ],
  )

  const state: OryxLabState = {
    itemsLoading,
    itemsError,
    items,
    classesData,
    itemSets,
    comparatorViewMode,
    builds: buildsWithComputedStats,
    globalScenario,
    catalogViewMode,
    catalogOwnedOnly,
    catalogSearch,
    catalogSort,
    catalogFilters,
    catalogQuickCompare,
    optimizerRequest,
    optimizerIsRunning,
    inventoryView,
    inventorySearch,
    inventoryOwnedSummary,
    inventoryOwnedEntries,
    realmEyeImport,
    manualSelection,
  }

  return (
    <OryxLabContext.Provider value={{ state, actions }}>
      <AppShell
        navigationItems={navItems}
        scenario={globalScenario}
        scenarioPresets={SCENARIO_PRESETS}
        savedBuildsCount={savedBuildsCount}
        catalogVersion="v3.7.0"
        onNavigate={(href) => navigate(href)}
        onScenarioChange={setGlobalScenario}
        onScenarioPresetSelect={applyScenarioPreset}
        onOpenSavedBuilds={() => setSavedBuildsOpen(true)}
        onShare={actions.shareComparator}
        onToggleTheme={() => {
          const isDark = document.documentElement.classList.toggle("dark")
          try {
            window.localStorage.setItem("oryxlab.v2.theme", JSON.stringify(isDark ? "dark" : "light"))
          } catch { /* storage disabled */ }
        }}
        onToggleCompactMode={() => document.documentElement.classList.toggle("compact")}
      >
        <Outlet />
      </AppShell>

      {isSavedBuildsOpen && (
        <SavedBuildsDrawer
          onClose={() => setSavedBuildsOpen(false)}
          onLoad={(b) => {
            setBuilds((curr) => [...curr, { ...b, id: `b-${Date.now()}` }])
            setSavedBuildsOpen(false)
            toastRef.current.push(`Loaded “${b.name}” into comparator`, "success")
          }}
          onCountChange={setSavedBuildsCount}
        />
      )}
    </OryxLabContext.Provider>
  )
}

function SavedBuildsDrawer({
  onClose,
  onLoad,
  onCountChange,
}: {
  onClose: () => void
  onLoad: (b: Build) => void
  onCountChange?: (count: number) => void
}) {
  const [snapshots, setSnapshots] = useState(() => loadSavedBuilds())

  const remove = (id: string) => {
    const next = snapshots.filter((s) => s.id !== id)
    setSnapshots(next)
    onCountChange?.(next.length)
    // also clear from storage
    import("./storage").then((m) => m.saveSavedBuilds(next))
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-zinc-950/40 backdrop-blur" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Saved Builds</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ×
          </button>
        </header>
        {snapshots.length === 0 && (
          <div className="rounded-md border border-dashed border-zinc-300 p-4 text-center text-xs text-zinc-500 dark:border-zinc-700">
            No saved builds yet. Save a build from the comparator to see it here.
          </div>
        )}
        <ul className="flex flex-col gap-2">
          {snapshots.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <div>
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.name}</div>
                <div className="text-[11px] text-zinc-500">
                  {s.classId} · saved {new Date(s.savedAt).toLocaleDateString("en-US")}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.tags.map((t) => (
                    <span key={t} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onLoad(s.build)}
                  className="rounded-md border border-amber-400/60 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-700 hover:bg-amber-400/20 dark:text-amber-300"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  aria-label="Delete saved build"
                  className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] text-zinc-500 hover:border-rose-400/60 hover:text-rose-500 dark:border-zinc-700"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
