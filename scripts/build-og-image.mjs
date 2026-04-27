// Generate the social-share OG image (1200x630 PNG) used by /index.html.
// Run with `node scripts/build-og-image.mjs`. Output: public/og-image.png.
//
// We hand-author the SVG inline so the image stays in source control and
// every change is reviewable in a git diff. Re-render whenever the brand
// text, palette, or stat callouts change.

import { Resvg } from "@resvg/resvg-js"
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = resolve(__dirname, "../public/og-image.png")

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0a0b"/>
      <stop offset="1" stop-color="#1a1714"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fbbf24"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.6">
      <stop offset="0" stop-color="#fbbf24" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#fbbf24" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27272a" stroke-width="1" opacity="0.3"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Logo mark: stylized Oryx eye icon -->
  <g transform="translate(80, 80)">
    <circle cx="34" cy="34" r="34" fill="url(#accent)"/>
    <circle cx="34" cy="34" r="14" fill="#0a0a0b"/>
    <circle cx="38" cy="30" r="4" fill="#fbbf24"/>
  </g>

  <!-- Wordmark + tagline -->
  <text x="180" y="135" font-family="DM Sans, Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="#fafafa">OryxLab</text>
  <text x="180" y="170" font-family="JetBrains Mono, ui-monospace, monospace" font-size="20" font-weight="500" fill="#fbbf24" letter-spacing="2">DPS · BUILDS · OPTIMIZER</text>

  <!-- Hero title -->
  <text x="80" y="305" font-family="DM Sans, Inter, system-ui, sans-serif" font-size="78" font-weight="700" fill="#fafafa">The DPS calculator</text>
  <text x="80" y="395" font-family="DM Sans, Inter, system-ui, sans-serif" font-size="78" font-weight="700" fill="#fafafa">for <tspan fill="url(#accent)">Realm of the Mad God</tspan>.</text>

  <!-- Stat callouts -->
  <g font-family="JetBrains Mono, ui-monospace, monospace" font-weight="500">
    <g transform="translate(80, 470)">
      <rect width="220" height="80" rx="12" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
      <text x="20" y="34" font-size="14" fill="#71717a" letter-spacing="1">CATALOG</text>
      <text x="20" y="64" font-size="28" font-weight="700" fill="#fafafa">1,500 items</text>
    </g>
    <g transform="translate(320, 470)">
      <rect width="220" height="80" rx="12" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
      <text x="20" y="34" font-size="14" fill="#71717a" letter-spacing="1">CLASSES</text>
      <text x="20" y="64" font-size="28" font-weight="700" fill="#fafafa">19 modeled</text>
    </g>
    <g transform="translate(560, 470)">
      <rect width="220" height="80" rx="12" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
      <text x="20" y="34" font-size="14" fill="#71717a" letter-spacing="1">ENGINE</text>
      <text x="20" y="64" font-size="28" font-weight="700" fill="#fafafa">Pure / typed</text>
    </g>
    <g transform="translate(800, 470)">
      <rect width="320" height="80" rx="12" fill="#18181b" stroke="#fbbf24" stroke-width="1"/>
      <text x="20" y="34" font-size="14" fill="#fbbf24" letter-spacing="1">OPTIMIZER</text>
      <text x="20" y="64" font-size="28" font-weight="700" fill="#fafafa">Beam-search · Worker</text>
    </g>
  </g>

  <!-- Footer URL -->
  <text x="80" y="600" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" fill="#71717a">oryxlab.app</text>
  <text x="1120" y="600" text-anchor="end" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" fill="#71717a">github.com/PedroHPrior/oryxlab</text>
</svg>`

const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng()
writeFileSync(OUT_PATH, png)
console.log(`✓ Wrote ${OUT_PATH} (${(png.length / 1024).toFixed(1)} KB)`)
