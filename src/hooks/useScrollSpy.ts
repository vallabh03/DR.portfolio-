import { useEffect, useState } from 'react'

/**
 * Returns the id of the section currently crossing the middle of the viewport,
 * or null when none is (e.g. while the hero is in view).
 */
export function useScrollSpy(ids: readonly string[], enabled = true) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setActive(null)
      return
    }
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (els.length === 0) return

    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id)
          else visible.delete(e.target.id)
        }
        // Keep page order so the topmost crossing section wins.
        setActive(ids.find((id) => visible.has(id)) ?? null)
      },
      { rootMargin: '-45% 0px -54% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [ids, enabled])

  return active
}
