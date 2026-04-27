import { useState } from "react"

interface ItemSpriteProps {
  spriteId: string
  imageUrl?: string | null
  name?: string
  itemType?: "weapon" | "ability" | "armor" | "ring" | "talisman"
  weaponType?: string
  abilityType?: string
  rarity?: "tiered" | "ut" | "st" | "talisman"
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

const SIZE_PX: Record<NonNullable<ItemSpriteProps["size"]>, number> = {
  xs: 20,
  sm: 28,
  md: 40,
  lg: 56,
  xl: 96,
}

const RARITY_BG: Record<NonNullable<ItemSpriteProps["rarity"]>, string> = {
  tiered: "from-zinc-700 via-zinc-800 to-zinc-900",
  ut: "from-amber-500 via-amber-700 to-amber-900",
  st: "from-rose-500 via-rose-700 to-rose-900",
  talisman: "from-violet-500 via-violet-700 to-violet-900",
}

const RARITY_RING: Record<NonNullable<ItemSpriteProps["rarity"]>, string> = {
  tiered: "ring-zinc-600/40",
  ut: "ring-amber-300/60",
  st: "ring-rose-300/60",
  talisman: "ring-violet-300/60",
}

const RARITY_GLOW: Record<NonNullable<ItemSpriteProps["rarity"]>, string> = {
  tiered: "",
  ut: "shadow-[inset_0_0_8px_rgba(251,191,36,0.4)]",
  st: "shadow-[inset_0_0_8px_rgba(251,113,133,0.4)]",
  talisman: "shadow-[inset_0_0_8px_rgba(167,139,250,0.4)]",
}

export function ItemSprite({
  spriteId,
  imageUrl,
  name,
  itemType = "weapon",
  weaponType,
  abilityType,
  rarity = "tiered",
  size = "md",
  className = "",
}: ItemSpriteProps) {
  const px = SIZE_PX[size]
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = imageUrl && !imgFailed

  const seed = hashCode(spriteId || name || "")

  return (
    <span
      className={`oryx-sprite-hover inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br ${RARITY_BG[rarity]} ring-1 ${RARITY_RING[rarity]} ${RARITY_GLOW[rarity]} shadow-sm ${className}`}
      style={{ width: px, height: px }}
      title={name}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={name ?? spriteId}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      ) : (
        <SpriteIcon
          itemType={itemType}
          weaponType={weaponType}
          abilityType={abilityType}
          seed={seed}
          px={px}
        />
      )}
    </span>
  )
}

function SpriteIcon({
  itemType,
  weaponType,
  abilityType,
  seed,
  px,
}: {
  itemType: NonNullable<ItemSpriteProps["itemType"]>
  weaponType?: string
  abilityType?: string
  seed: number
  px: number
}) {
  const subtype = itemType === "weapon" ? weaponType : abilityType
  const path = pickPath(itemType, subtype)
  const hue = (seed % 60) - 30
  const filter = `hue-rotate(${hue}deg) saturate(1.1)`

  return (
    <svg
      viewBox="0 0 32 32"
      width={px - 4}
      height={px - 4}
      className="drop-shadow-sm"
      style={{ filter }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`grad-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.55)" />
        </linearGradient>
      </defs>
      <g
        fill={`url(#grad-${seed})`}
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="0.5"
        strokeLinejoin="round"
      >
        {path}
      </g>
    </svg>
  )
}

function pickPath(itemType: string, subtype?: string) {
  if (itemType === "weapon") {
    switch (subtype) {
      case "wand":
        return WAND
      case "staff":
        return STAFF
      case "bow":
        return BOW
      case "sword":
        return SWORD
      case "katana":
        return KATANA
      case "dagger":
        return DAGGER
      case "lute":
        return LUTE
      default:
        return SWORD
    }
  }
  if (itemType === "ability") {
    switch (subtype) {
      case "spell":
        return SPELL
      case "tome":
        return TOME
      case "quiver":
        return QUIVER
      case "skull":
        return SKULL
      case "cloak":
        return CLOAK
      case "helm":
        return HELM
      case "seal":
        return SEAL
      case "wakizashi":
        return KATANA
      case "prism":
        return PRISM
      case "scepter":
        return WAND
      case "orb":
        return ORB
      case "star":
        return STAR
      case "trap":
        return TRAP
      default:
        return SPELL
    }
  }
  if (itemType === "armor") return ARMOR
  if (itemType === "ring") return RING
  if (itemType === "talisman") return TALISMAN
  return SWORD
}

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const WAND = (
  <>
    <path d="M22 6 L26 10 L14 22 L10 18 Z" />
    <circle cx="24" cy="8" r="2.2" />
    <path d="M11 20 L8 23 L6 25 L7 26 L9 25 L12 22 Z" />
  </>
)

const STAFF = (
  <>
    <path d="M16 6 L18 4 L22 4 L22 8 L20 10 L24 14 L20 14 L17 10" />
    <rect x="14" y="10" width="3" height="20" rx="1" />
    <circle cx="20" cy="6" r="1.2" />
  </>
)

const BOW = (
  <>
    <path d="M8 4 Q24 8 24 16 Q24 24 8 28" fill="none" strokeWidth="2.5" stroke="currentColor" />
    <line x1="8" y1="4" x2="8" y2="28" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />
    <path d="M10 16 L24 16 L22 14 L24 16 L22 18 Z" fill="rgba(255,255,255,0.85)" />
  </>
)

const SWORD = (
  <>
    <path d="M16 4 L18 4 L18 22 L21 22 L21 24 L18 24 L18 27 L16 27 L16 24 L13 24 L13 22 L16 22 Z" />
    <rect x="11" y="22" width="12" height="2" />
    <rect x="15" y="24" width="4" height="3" />
  </>
)

const KATANA = (
  <>
    <path d="M6 26 Q14 12 26 6 L28 8 Q16 14 8 28 Z" />
    <rect x="4" y="24" width="6" height="3" rx="0.5" />
    <rect x="2" y="26" width="3" height="3" rx="0.5" />
  </>
)

const DAGGER = (
  <>
    <path d="M14 4 L18 4 L17 18 L15 18 Z" />
    <rect x="12" y="18" width="8" height="2" />
    <rect x="14" y="20" width="4" height="6" rx="1" />
  </>
)

const LUTE = (
  <>
    <ellipse cx="16" cy="22" rx="8" ry="6" />
    <rect x="14" y="6" width="4" height="14" rx="1" />
    <line x1="14" y1="10" x2="18" y2="10" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
    <line x1="14" y1="13" x2="18" y2="13" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
    <circle cx="16" cy="22" r="1.5" fill="rgba(0,0,0,0.5)" />
  </>
)

const SPELL = (
  <>
    <path d="M16 4 L19 14 L29 14 L21 20 L24 30 L16 24 L8 30 L11 20 L3 14 L13 14 Z" />
  </>
)

const TOME = (
  <>
    <rect x="6" y="6" width="20" height="22" rx="1.5" />
    <line x1="16" y1="6" x2="16" y2="28" stroke="rgba(0,0,0,0.4)" strokeWidth="0.6" />
    <path d="M16 12 L20 12 M16 16 L20 16 M16 20 L20 20" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
  </>
)

const QUIVER = (
  <>
    <rect x="10" y="6" width="12" height="22" rx="2" />
    <path d="M14 6 L13 4 L13 6 M16 6 L15 2 L15 6 M19 6 L20 4 L20 6" stroke="currentColor" strokeWidth="1.2" />
    <line x1="10" y1="14" x2="22" y2="14" stroke="rgba(0,0,0,0.4)" />
  </>
)

const SKULL = (
  <>
    <path d="M16 6 Q24 6 24 16 Q24 22 22 24 L20 28 L12 28 L10 24 Q8 22 8 16 Q8 6 16 6 Z" />
    <circle cx="13" cy="16" r="2" fill="rgba(0,0,0,0.6)" />
    <circle cx="19" cy="16" r="2" fill="rgba(0,0,0,0.6)" />
    <path d="M13 22 L15 20 L17 22 L19 20" stroke="rgba(0,0,0,0.5)" fill="none" />
  </>
)

const CLOAK = (
  <>
    <path d="M16 4 L8 12 L6 28 L26 28 L24 12 Z" />
    <path d="M16 4 L16 28" stroke="rgba(0,0,0,0.3)" strokeWidth="0.6" />
  </>
)

const HELM = (
  <>
    <path d="M8 18 Q8 8 16 8 Q24 8 24 18 L24 22 L20 22 L20 26 L12 26 L12 22 L8 22 Z" />
    <rect x="14" y="14" width="4" height="2" fill="rgba(0,0,0,0.5)" />
  </>
)

const SEAL = (
  <>
    <circle cx="16" cy="16" r="11" />
    <path d="M16 6 L18 14 L26 16 L18 18 L16 26 L14 18 L6 16 L14 14 Z" fill="rgba(0,0,0,0.45)" />
  </>
)

const PRISM = (
  <>
    <path d="M16 4 L26 16 L16 28 L6 16 Z" />
    <path d="M16 4 L16 28" stroke="rgba(0,0,0,0.4)" />
    <path d="M6 16 L26 16" stroke="rgba(0,0,0,0.4)" />
  </>
)

const ORB = (
  <>
    <circle cx="16" cy="16" r="11" />
    <ellipse cx="13" cy="13" rx="3" ry="2" fill="rgba(255,255,255,0.5)" />
  </>
)

const STAR = (
  <>
    <path d="M16 4 L18 12 L26 14 L20 18 L22 26 L16 22 L10 26 L12 18 L6 14 L14 12 Z" />
  </>
)

const TRAP = (
  <>
    <circle cx="16" cy="16" r="10" />
    <circle cx="16" cy="16" r="6" fill="rgba(0,0,0,0.3)" />
    <path d="M16 6 L16 26 M6 16 L26 16" stroke="rgba(0,0,0,0.5)" strokeWidth="0.8" />
  </>
)

const ARMOR = (
  <>
    <path d="M10 6 L22 6 L24 10 L24 22 Q24 26 16 28 Q8 26 8 22 L8 10 Z" />
    <path d="M16 8 L16 26" stroke="rgba(0,0,0,0.35)" strokeWidth="0.6" />
    <path d="M10 14 L22 14" stroke="rgba(0,0,0,0.35)" strokeWidth="0.5" />
  </>
)

const RING = (
  <>
    <circle cx="16" cy="20" r="8" fill="none" strokeWidth="3" stroke="currentColor" />
    <path d="M12 12 L16 4 L20 12 L18 14 L14 14 Z" />
  </>
)

const TALISMAN = (
  <>
    <path d="M16 4 L24 10 L24 22 L16 28 L8 22 L8 10 Z" />
    <circle cx="16" cy="16" r="3" fill="rgba(0,0,0,0.4)" />
  </>
)
