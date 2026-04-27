import { useEffect, useRef, useState } from "react"

interface AnimatedNumberProps {
  value: number
  duration?: number
  format?: (n: number) => string
  className?: string
  style?: React.CSSProperties
}

export function AnimatedNumber({
  value,
  duration = 250,
  format = (n) => Math.round(n).toLocaleString("en-US"),
  className,
  style,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (display === value) return
    fromRef.current = display
    startRef.current = null
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const animate = (t: number) => {
      if (startRef.current === null) startRef.current = t
      const elapsed = t - startRef.current
      const k = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - k, 3)
      const next = fromRef.current + (value - fromRef.current) * eased
      setDisplay(next)
      if (k < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return (
    <span className={className} style={style}>
      {format(display)}
    </span>
  )
}
