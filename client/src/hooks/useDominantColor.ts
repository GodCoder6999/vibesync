import { useEffect, useState } from 'react'

const cache = new Map<string, string>()

/** Extract a single dominant RGB color from an image URL via canvas
 * sampling. Returns a CSS color string suitable for a hero gradient.
 * Falls back to a neutral grey if the image can't be loaded or is
 * blocked by CORS. */
export function useDominantColor(url?: string): string {
  const [color, setColor] = useState<string>('#535353')

  useEffect(() => {
    if (!url) { setColor('#535353'); return }
    if (cache.has(url)) { setColor(cache.get(url)!); return }

    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const w = 50, h = 50
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, w, h)
        const { data } = ctx.getImageData(0, 0, w, h)
        let r = 0, g = 0, b = 0, n = 0
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3]
          if (alpha < 200) continue
          // Skip near-white & near-black so the gradient stays vibrant
          const lum = (data[i] + data[i + 1] + data[i + 2]) / 3
          if (lum > 240 || lum < 25) continue
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++
        }
        if (n === 0) return
        // Push toward darker side for hero readability
        const dim = 0.55
        const ar = Math.floor((r / n) * dim)
        const ag = Math.floor((g / n) * dim)
        const ab = Math.floor((b / n) * dim)
        const result = `rgb(${ar},${ag},${ab})`
        cache.set(url, result)
        if (!cancelled) setColor(result)
      } catch { /* CORS or decode failure → keep fallback */ }
    }
    img.src = url
    return () => { cancelled = true }
  }, [url])

  return color
}
