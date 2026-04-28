import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { OryxLogo } from "../../shell/components/OryxLogo"

// Subtle floating-particle background, vanilla canvas (no library). Particles
// drift up like embers, gently push toward the cursor, and recycle when they
// leave the top edge. Feature-detected: respects prefers-reduced-motion and
// quietly skips on devices that report low memory.
function useParticleBackground(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number }
    const particles: Particle[] = []
    const TARGET_COUNT = Math.min(60, Math.max(20, Math.floor(window.innerWidth / 32)))

    function spawn(x?: number, y?: number): Particle {
      return {
        x: x ?? Math.random() * width,
        y: y ?? height + Math.random() * 40,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.15 - Math.random() * 0.4,
        r: 0.6 + Math.random() * 1.6,
        life: 0,
        max: 240 + Math.random() * 240,
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas!.width = Math.floor(width * dpr)
      canvas!.height = Math.floor(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    while (particles.length < TARGET_COUNT) particles.push(spawn(Math.random() * width, Math.random() * height))

    const mouse = { x: -9999, y: -9999, active: false }
    function onPointer(ev: PointerEvent) {
      const rect = canvas!.getBoundingClientRect()
      mouse.x = ev.clientX - rect.left
      mouse.y = ev.clientY - rect.top
      mouse.active = true
    }
    function onPointerLeave() {
      mouse.active = false
      mouse.x = -9999
      mouse.y = -9999
    }
    window.addEventListener("pointermove", onPointer, { passive: true })
    window.addEventListener("pointerleave", onPointerLeave, { passive: true })
    window.addEventListener("resize", resize, { passive: true })

    function frame() {
      ctx!.clearRect(0, 0, width, height)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.life++
        // Cursor influence , gentle push outward when close.
        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const d2 = dx * dx + dy * dy
          if (d2 < 9000) {
            const inv = 1 / Math.max(1, Math.sqrt(d2))
            p.vx += dx * inv * 0.04
            p.vy += dy * inv * 0.04
          }
        }
        p.vx *= 0.985
        p.vy *= 0.992
        p.x += p.vx
        p.y += p.vy

        if (p.life > p.max || p.y < -10 || p.x < -20 || p.x > width + 20) {
          particles[i] = spawn()
          continue
        }
        const fade = 1 - p.life / p.max
        const alpha = 0.05 + fade * 0.45
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(251, 191, 36, ${alpha})`
        ctx!.fill()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onPointer)
      window.removeEventListener("pointerleave", onPointerLeave)
      window.removeEventListener("resize", resize)
    }
  }, [canvasRef])
}

export function NotFoundRoute() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useParticleBackground(canvasRef)

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
      />

      {/* Radial vignette so text stays legible over the particle field. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.7)_70%)]"
      />

      <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="oryx-pulse-glow mb-8 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-700/20 p-5 ring-1 ring-amber-400/30 backdrop-blur-sm">
          <OryxLogo size={72} />
        </div>

        <p className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-amber-400/80">
          Error 404 · Lost in the Realm
        </p>

        <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight text-zinc-50 sm:text-6xl">
          Oryx ate this page.
        </h1>

        <p className="mb-10 max-w-md text-balance text-base text-zinc-400 sm:text-lg">
          The route you were chasing isn&rsquo;t in the dungeon anymore. Probably teleported by a cube god, or
          eaten by a Skull Shrine.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/app"
            className="oryx-press group inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300 hover:shadow-amber-400/40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to the Comparator
          </Link>
          <Link
            to="/app/catalog"
            className="oryx-press inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/50 px-5 py-2.5 text-sm font-medium text-zinc-200 backdrop-blur transition hover:border-amber-400/40 hover:text-amber-300"
          >
            Browse the catalog
          </Link>
        </div>

        <p className="mt-12 font-mono text-[11px] uppercase tracking-widest text-zinc-600">
          oryxlab · pure realm theorycraft
        </p>
      </main>
    </div>
  )
}
