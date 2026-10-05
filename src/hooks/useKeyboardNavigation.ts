import { useEffect } from 'react'
import { useChapters } from '../context/ChapterContext'

const isTypingTarget = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  const tag = el.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type
    return !['button', 'submit', 'reset', 'checkbox', 'radio'].includes(type)
  }
  return !!el.closest('[data-keyboard-ignore]')
}

/**
 * ← / → move between chapters, ↑ / ↓ scroll the current chapter.
 * Never interferes with typing in form fields or with modifier shortcuts.
 */
export function useKeyboardNavigation(enabled = true) {
  const { next, prev, scrollStep, menuOpen } = useChapters()

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if (menuOpen || document.querySelector('[data-modal-open]')) return
      if (isTypingTarget(e.target)) return

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          next()
          break
        case 'ArrowLeft':
          e.preventDefault()
          prev()
          break
        case 'ArrowDown':
          e.preventDefault()
          scrollStep(1)
          break
        case 'ArrowUp':
          e.preventDefault()
          scrollStep(-1)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, next, prev, scrollStep, menuOpen])
}
