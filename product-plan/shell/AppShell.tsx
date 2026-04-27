import { useState, type ReactNode } from "react"
import { MainNav, type NavItem } from "./MainNav"
import { ShellActions } from "./ShellActions"
import { ScenarioBar, type Scenario } from "./ScenarioBar"

export interface AppShellProps {
  children: ReactNode
  navigationItems: NavItem[]
  scenario: Scenario
  scenarioPresets?: { id: string; label: string }[]
  scenarioBarDefaultOpen?: boolean
  savedBuildsCount?: number
  catalogVersion?: string
  onNavigate?: (href: string) => void
  onScenarioChange?: (next: Scenario) => void
  onScenarioPresetSelect?: (presetId: string) => void
  onOpenSavedBuilds?: () => void
  onShare?: () => void
  onToggleTheme?: () => void
  onToggleCompactMode?: () => void
  onExportData?: () => void
  onImportData?: () => void
}

export function AppShell({
  children,
  navigationItems,
  scenario,
  scenarioPresets,
  scenarioBarDefaultOpen = true,
  savedBuildsCount = 0,
  catalogVersion,
  onNavigate,
  onScenarioChange,
  onScenarioPresetSelect,
  onOpenSavedBuilds,
  onShare,
  onToggleTheme,
  onToggleCompactMode,
  onExportData,
  onImportData,
}: AppShellProps) {
  const [scenarioOpen, setScenarioOpen] = useState(scenarioBarDefaultOpen)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div
      className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              onNavigate?.("/")
            }}
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-400 text-zinc-950 shadow-sm">
              <span className="text-sm font-bold">O</span>
            </span>
            <span className="hidden sm:inline text-zinc-900 dark:text-zinc-100">
              OryxLab
            </span>
          </a>

          <div className="hidden md:block">
            <MainNav items={navigationItems} onNavigate={onNavigate} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ShellActions
              scenario={scenario}
              savedBuildsCount={savedBuildsCount}
              catalogVersion={catalogVersion}
              onClickScenarioChip={() => setScenarioOpen((v) => !v)}
              onOpenSavedBuilds={onOpenSavedBuilds}
              onShare={onShare}
              onToggleTheme={onToggleTheme}
              onToggleCompactMode={onToggleCompactMode}
              onExportData={onExportData}
              onImportData={onImportData}
            />
            <button
              type="button"
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={mobileNavOpen}
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-2 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
            <MainNav
              items={navigationItems}
              orientation="vertical"
              onNavigate={(href) => {
                setMobileNavOpen(false)
                onNavigate?.(href)
              }}
            />
          </div>
        )}

        <ScenarioBar
          scenario={scenario}
          presets={scenarioPresets}
          open={scenarioOpen}
          onChange={onScenarioChange}
          onPresetSelect={onScenarioPresetSelect}
          onToggle={() => setScenarioOpen((v) => !v)}
        />
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <footer className="border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 sm:px-6 dark:border-zinc-800 dark:text-zinc-500">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
          <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}>
            OryxLab · catalog {catalogVersion ?? "—"}
          </span>
          <span>Realm of the Mad God is © Deca Games. OryxLab is an unofficial fan tool.</span>
        </div>
      </footer>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}
