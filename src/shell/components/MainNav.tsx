export interface NavItem {
  label: string
  href: string
  isActive?: boolean
}

interface MainNavProps {
  items: NavItem[]
  orientation?: "horizontal" | "vertical"
  onNavigate?: (href: string) => void
}

export function MainNav({ items, orientation = "horizontal", onNavigate }: MainNavProps) {
  const isVertical = orientation === "vertical"

  return (
    <nav
      aria-label="Main"
      className={
        isVertical
          ? "flex flex-col gap-1"
          : "flex items-center gap-1"
      }
    >
      {items.map((item) => {
        const active = item.isActive
        const baseClasses = isVertical
          ? "px-3 py-2 rounded-md text-sm font-medium transition-colors"
          : "relative inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors"

        const stateClasses = active
          ? isVertical
            ? "bg-amber-400/10 text-amber-700 dark:text-amber-300"
            : "text-amber-700 dark:text-amber-300"
          : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100"

        return (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => {
              e.preventDefault()
              onNavigate?.(item.href)
            }}
            className={`${baseClasses} ${stateClasses}`}
            aria-current={active ? "page" : undefined}
            data-tour={`nav-${item.label.toLowerCase()}`}
          >
            {item.label}
            {!isVertical && active && (
              <span
                aria-hidden="true"
                className="absolute -bottom-[15px] left-3 right-3 h-0.5 rounded-full bg-amber-400"
              />
            )}
          </a>
        )
      })}
    </nav>
  )
}
