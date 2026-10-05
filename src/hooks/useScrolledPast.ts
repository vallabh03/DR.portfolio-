import { useEffect, useState } from 'react'

/** True once the page has been scrolled further than `offset` pixels. */
export function useScrolledPast(offset: number) {
  const [past, setPast] = useState(() => typeof window !== 'undefined' && window.scrollY > offset)

  useEffect(() => {
    const update = () => setPast(window.scrollY > offset)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [offset])

  return past
}
