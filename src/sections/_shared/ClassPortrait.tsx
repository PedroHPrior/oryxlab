import { useState } from "react"

interface ClassPortraitProps {
  classId: string
  name: string
  imageUrl?: string | null
  color?: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const SIZE_PX: Record<NonNullable<ClassPortraitProps["size"]>, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 64,
}

const COLOR_BG: Record<string, string> = {
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
  lime: "bg-lime-500",
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  fuchsia: "bg-fuchsia-500",
  cyan: "bg-cyan-500",
  indigo: "bg-indigo-500",
  pink: "bg-pink-500",
  teal: "bg-teal-500",
}

export function ClassPortrait({
  classId,
  name,
  imageUrl,
  color = "violet",
  size = "md",
  className = "",
}: ClassPortraitProps) {
  const px = SIZE_PX[size]
  const [imgFailed, setImgFailed] = useState(false)
  const initials = name.slice(0, 2).toUpperCase()
  const bg = COLOR_BG[color] ?? "bg-zinc-500"
  const showImage = imageUrl && !imgFailed

  if (showImage) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/20 shadow-sm ${bg} ${className}`}
        style={{ width: px, height: px }}
        data-class-id={classId}
        title={name}
      >
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm ring-1 ring-white/20 ${bg} ${className}`}
      style={{ width: px, height: px, fontSize: Math.max(10, px * 0.4) }}
      data-class-id={classId}
      aria-label={name}
      title={name}
    >
      {initials}
    </span>
  )
}
