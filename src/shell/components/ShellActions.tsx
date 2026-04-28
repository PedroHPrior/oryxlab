import { useEffect, useRef, useState, type ReactNode } from "react"
import type { Scenario } from "./ScenarioBar"

interface ShellActionsProps {
  scenario: Scenario
  savedBuildsCount?: number
  catalogVersion?: string
  onClickScenarioChip?: () => void
  onOpenSavedBuilds?: () => void
  onShare?: () => void
  onToggleTheme?: () => void
  onToggleCompactMode?: () => void
  onExportData?: () => void
  onImportData?: () => void
}

export function ShellActions({
  scenario,
  savedBuildsCount = 0,
  catalogVersion,
  onClickScenarioChip,
  onOpenSavedBuilds,
  onShare,
  onToggleTheme,
  onToggleCompactMode,
  onExportData,
  onImportData,
}: ShellActionsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <ScenarioChip scenario={scenario} onClick={onClickScenarioChip} />

      <IconButton
        label="Saved builds"
        onClick={onOpenSavedBuilds}
        badge={savedBuildsCount > 0 ? savedBuildsCount : undefined}
      >
        <BookmarkIcon />
      </IconButton>

      <IconButton label="Share comparator state" onClick={onShare}>
        <ShareIcon />
      </IconButton>

      <SettingsMenu
        catalogVersion={catalogVersion}
        onToggleTheme={onToggleTheme}
        onToggleCompactMode={onToggleCompactMode}
        onExportData={onExportData}
        onImportData={onImportData}
      />
    </div>
  )
}

function ScenarioChip({
  scenario,
  onClick,
}: {
  scenario: Scenario
  onClick?: () => void
}) {
  const summary = summarizeScenario(scenario)

  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden lg:inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-amber-400/60 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-amber-400/60 dark:hover:text-zinc-100"
      aria-label="Open scenario panel"
      title={summary.full}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
      <span className="text-zinc-500 dark:text-zinc-500">Scenario</span>
      <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}>
        {summary.short}
      </span>
    </button>
  )
}

function IconButton({
  children,
  label,
  onClick,
  badge,
}: {
  children: ReactNode
  label: string
  onClick?: () => void
  badge?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"
    >
      {children}
      {badge !== undefined && (
        <span
          className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-semibold text-zinc-950"
          style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  )
}

function SettingsMenu({
  catalogVersion,
  onToggleTheme,
  onToggleCompactMode,
  onExportData,
  onImportData,
}: {
  catalogVersion?: string
  onToggleTheme?: () => void
  onToggleCompactMode?: () => void
  onExportData?: () => void
  onImportData?: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <IconButton label="Settings" onClick={() => setOpen((v) => !v)}>
        <SettingsIcon />
      </IconButton>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 w-60 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <MenuItem onClick={onToggleTheme} icon={<MoonSunIcon />}>Toggle theme</MenuItem>
          <MenuItem onClick={onToggleCompactMode} icon={<RowsIcon />}>Compact mode</MenuItem>
          <Divider />
          <MenuItem onClick={onExportData} icon={<DownloadIcon />}>Export my data</MenuItem>
          <MenuItem onClick={onImportData} icon={<UploadIcon />}>Import data</MenuItem>
          <Divider />
          <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-zinc-500">
            <div className="flex items-center justify-between">
              <span>Catalog</span>
              <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}>
                {catalogVersion ?? ", "}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  icon,
}: {
  children: ReactNode
  onClick?: () => void
  icon?: ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      <span className="text-zinc-500 dark:text-zinc-400">{icon}</span>
      <span>{children}</span>
    </button>
  )
}

function Divider() {
  return <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
}

function summarizeScenario(s: Scenario) {
  const parts: string[] = [`Def ${s.targetDefense}`]
  const buffs = s.partyBuffs.filter(Boolean)
  if (buffs.length > 0) {
    const labels = buffs
      .map((b) => SHORT_BUFF[b] ?? b)
      .filter(Boolean)
      .slice(0, 3)
    parts.push(labels.join("+"))
  }
  const statuses = s.targetStatuses.filter(Boolean)
  if (statuses.length > 0) parts.push(statuses.length === 1 ? SHORT_STATUS[statuses[0]] ?? statuses[0] : `${statuses.length} statuses`)

  const short = parts.join(" · ")
  const full = `Target Def ${s.targetDefense}; buffs: ${buffs.join(", ") || "none"}; statuses: ${statuses.join(", ") || "none"}`

  return { short, full }
}

const SHORT_BUFF: Record<string, string> = {
  paladinSeal: "Pal",
  warriorHelm: "War",
  mysticCurse: "Mys",
  bardInspire: "BInsp",
  bardCrescendo: "BCres",
  bardEncore: "BEnc",
}

const SHORT_STATUS: Record<string, string> = {
  armorBroken: "AB",
  bleeding: "Bleed",
  exposed: "Exp",
  cursed: "Curse",
}

function BookmarkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function MoonSunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function RowsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="6" rx="1" />
      <rect x="3" y="14" width="18" height="6" rx="1" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}
