interface TierBadgeProps {
  tier: string
  rarity?: "tiered" | "ut" | "st"
  size?: "xs" | "sm"
}

const RARITY_CLASS: Record<NonNullable<TierBadgeProps["rarity"]>, string> = {
  tiered: "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  ut: "border-amber-400/60 bg-amber-400/10 text-amber-700 dark:text-amber-300",
  st: "border-rose-400/60 bg-rose-400/10 text-rose-700 dark:text-rose-300",
}

const SIZE_CLASS = {
  xs: "px-1.5 py-0 text-[10px]",
  sm: "px-2 py-0.5 text-xs",
}

export function TierBadge({ tier, rarity = "tiered", size = "sm" }: TierBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border font-medium ${RARITY_CLASS[rarity]} ${SIZE_CLASS[size]}`}
      style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
    >
      {tier}
    </span>
  )
}
