import { useEffect, useRef, useState } from 'react'

const EASE_OUT = (t) => 1 - (1 - t) ** 3

// Counts up from 0 to `value` whenever `value` changes. `format` receives the
// current (possibly fractional, always rounded via Math.round for display)
// number and returns the string to render — use it to append units/commas.
export default function AnimatedNumber({ value, duration = 700, format = (n) => n.toLocaleString() }) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef(null)
  const reduceMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0

    if (reduceMotion.current) {
      setDisplay(target)
      return
    }

    const start = performance.now()
    const from = 0

    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / duration)
      setDisplay(from + (target - from) * EASE_OUT(progress))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])

  return <>{format(Math.round(display))}</>
}
