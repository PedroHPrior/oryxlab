interface OryxLogoProps {
  size?: number
  variant?: "icon" | "wordmark"
  className?: string
}

/**
 * OryxLab logo , a horned silhouette (Oryx) inside a hex frame (lab/forge),
 * with an amber gem for the "eye". Pixel-art aesthetic to match ROTMG.
 */
export function OryxLogo({ size = 28, variant = "icon", className = "" }: OryxLogoProps) {
  if (variant === "wordmark") {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <OryxLogo size={size} variant="icon" />
        <span
          className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          style={{ fontFamily: '"Inter", system-ui, sans-serif', letterSpacing: "-0.01em" }}
        >
          OryxLab
        </span>
      </span>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="OryxLab logo"
    >
      <defs>
        <linearGradient id="oryx-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="oryx-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#27272a" />
          <stop offset="1" stopColor="#18181b" />
        </linearGradient>
        <radialGradient id="oryx-eye" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fef3c7" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#b45309" />
        </radialGradient>
      </defs>

      {/* Hex frame (lab/forge silhouette) */}
      <path
        d="M16 1.5 L28.7 8.6 L28.7 23.4 L16 30.5 L3.3 23.4 L3.3 8.6 Z"
        fill="url(#oryx-gold)"
        stroke="#92400e"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />

      {/* Inner hex (dark plate where Oryx silhouette sits) */}
      <path
        d="M16 4.5 L25.7 10 L25.7 22 L16 27.5 L6.3 22 L6.3 10 Z"
        fill="url(#oryx-dark)"
      />

      {/* Oryx horns + face , stylized, two long horns rising up */}
      <g fill="#fbbf24">
        {/* Left horn */}
        <path d="M11 9 L10 14 L11.2 16 L12 14 L11.8 9 Z" />
        {/* Right horn */}
        <path d="M21 9 L22 14 L20.8 16 L20 14 L20.2 9 Z" />
        {/* Forehead crest */}
        <path d="M13 14 L14 12 L18 12 L19 14 L18.5 17 L13.5 17 Z" />
        {/* Lower jaw / chin */}
        <path d="M13.5 17 L18.5 17 L18 21 L16 22.5 L14 21 Z" />
      </g>

      {/* Eye gem (DPS focal point) */}
      <circle cx="16" cy="18" r="1.6" fill="url(#oryx-eye)" />
      <circle cx="15.5" cy="17.5" r="0.5" fill="#fef9c3" opacity="0.9" />
    </svg>
  )
}
