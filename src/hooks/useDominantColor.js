import { useEffect, useState } from 'react'

// Samples an average color from an image via canvas (downscaled to a small
// grid for speed) — used to tint the Now Playing background per-track.
// Returns null until the image has loaded and been sampled, or if sampling
// fails (e.g. a CORS-tainted canvas from an image host without CORS headers).
export function useDominantColor(imageUrl) {
  const [color, setColor] = useState(null)

  useEffect(() => {
    if (!imageUrl) {
      setColor(null)
      return
    }

    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl

    img.onload = () => {
      if (cancelled) return
      try {
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        let r = 0
        let g = 0
        let b = 0
        let count = 0
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count += 1
        }
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)

        if (!cancelled) setColor(`rgb(${r}, ${g}, ${b})`)
      } catch {
        if (!cancelled) setColor(null)
      }
    }

    img.onerror = () => {
      if (!cancelled) setColor(null)
    }

    return () => {
      cancelled = true
    }
  }, [imageUrl])

  return color
}
