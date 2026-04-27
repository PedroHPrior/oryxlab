import { useState } from "react"
import { AppShell, type Scenario } from "./components"

const PRESETS = [
  { id: "solo-no-def", label: "Solo · no def" },
  { id: "party-o3", label: "Party O3 (Pal+Bard)" },
  { id: "sanctuary", label: "Sanctuary endgame" },
]

const PRESET_SCENARIOS: Record<string, Scenario> = {
  "solo-no-def": {
    presetId: "solo-no-def",
    targetDefense: 0,
    targetStatuses: [],
    partyBuffs: [],
  },
  "party-o3": {
    presetId: "party-o3",
    targetDefense: 50,
    targetStatuses: ["armorBroken"],
    partyBuffs: ["paladinSeal", "bardInspire"],
  },
  sanctuary: {
    presetId: "sanctuary",
    targetDefense: 65,
    targetStatuses: ["exposed"],
    partyBuffs: ["paladinSeal", "warriorHelm"],
  },
}

export default function ShellPreview() {
  const [activeHref, setActiveHref] = useState("/")
  const [scenario, setScenario] = useState<Scenario>(PRESET_SCENARIOS["party-o3"])

  const navigationItems = [
    { label: "Comparator", href: "/", isActive: activeHref === "/" },
    { label: "Catalog", href: "/catalog", isActive: activeHref === "/catalog" },
    { label: "Optimizer", href: "/optimizer", isActive: activeHref === "/optimizer" },
    { label: "Inventory", href: "/inventory", isActive: activeHref === "/inventory" },
  ]

  return (
    <AppShell
      navigationItems={navigationItems}
      scenario={scenario}
      scenarioPresets={PRESETS}
      savedBuildsCount={7}
      catalogVersion="v3.7.0"
      onNavigate={(href) => setActiveHref(href)}
      onScenarioChange={(next) =>
        setScenario({ ...next, presetId: null })
      }
      onScenarioPresetSelect={(presetId) => {
        if (presetId === "custom") {
          setScenario((s) => ({ ...s, presetId: null }))
        } else if (PRESET_SCENARIOS[presetId]) {
          setScenario(PRESET_SCENARIOS[presetId])
        }
      }}
      onOpenSavedBuilds={() => console.log("open saved builds drawer")}
      onShare={() => console.log("share comparator")}
      onToggleTheme={() => document.documentElement.classList.toggle("dark")}
      onToggleCompactMode={() => console.log("toggle compact mode")}
      onExportData={() => console.log("export data")}
      onImportData={() => console.log("import data")}
    >
      <div
        className="rounded-xl border border-dashed border-zinc-300 bg-zinc-100/50 p-10 text-center dark:border-zinc-800 dark:bg-zinc-900/40"
        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
      >
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Section content renders here
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Active route: <span className="font-mono text-zinc-700 dark:text-zinc-300">{activeHref}</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          Try toggling the scenario bar, switching nav items, or opening Settings.
        </p>
      </div>
    </AppShell>
  )
}
