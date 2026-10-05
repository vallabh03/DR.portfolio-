import { useEffect, type RefObject } from 'react'
import { useChapters } from '../context/ChapterContext'

const SWIPE_DISTANCE = 64 // px a finger must travel horizontally
const SWIPE_VELOCITY = 0.45 // px/ms — a fast flick can be shorter
const FLICK_MIN_DISTANCE = 32
const AXIS_LOCK = 10 // px before we decide which axis the gesture is on
const AXIS_RATIO = 1.35 // horizontal must dominate vertical by this much
const WHEEL_THRESHOLD = 90
const WHEEL_LOCK_MS = 900

const ignoreTarget = (t: EventTarget | null) =>
  t instanceof Element && !!t.closest('input, textarea, select, [contenteditable="true"], [data-swipe-ignore]')

/**
 * Horizontal swipes (touch) and horizontal trackpad gestures move between chapters.
 * Vertical gestures are left to native scrolling, so reading a chapter never
 * triggers accidental navigation.
 */
export function useSwipeNavigation(ref: RefObject<HTMLElement | null>, enabled = true) {
  const { next, prev, menuOpen } = useChapters()

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    let startX = 0
    let startY = 0
    let startT = 0
    let axis: 'x' | 'y' | null = null
    let tracking = false

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || menuOpen || ignoreTarget(e.target)) {
        tracking = false
        return
      }
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
      startT = performance.now()
      axis = null
      tracking = true
    }

    const onMove = (e: TouchEvent) => {
      if (!tracking) return
      if (e.touches.length !== 1) {
        tracking = false
        return
      }
      const t = e.touches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      if (!axis && (Math.abs(dx) > AXIS_LOCK || Math.abs(dy) > AXIS_LOCK)) {
        axis = Math.abs(dx) > Math.abs(dy) * AXIS_RATIO ? 'x' : 'y'
      }
      // Once a horizontal swipe is recognised, stop the page from also scrolling.
      if (axis === 'x' && e.cancelable) e.preventDefault()
    }

    const onEnd = (e: TouchEvent) => {
      if (!tracking || axis !== 'x') {
        tracking = false
        return
      }
      tracking = false
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dt = Math.max(1, performance.now() - startT)
      const velocity = Math.abs(dx) / dt
      if (Math.abs(dx) >= SWIPE_DISTANCE || (velocity >= SWIPE_VELOCITY && Math.abs(dx) >= FLICK_MIN_DISTANCE)) {
        if (dx < 0) next()
        else prev()
      }
    }

    // Trackpad horizontal gestures
    let wheelAcc = 0
    let wheelTimer = 0
    let wheelLockedUntil = 0
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || menuOpen) return
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2) return
      if (ignoreTarget(e.target)) return
      e.preventDefault()
      const now = performance.now()
      if (now < wheelLockedUntil) return
      wheelAcc += e.deltaX
      window.clearTimeout(wheelTimer)
      wheelTimer = window.setTimeout(() => (wheelAcc = 0), 180)
      if (Math.abs(wheelAcc) > WHEEL_THRESHOLD) {
        if (wheelAcc > 0) next()
        else prev()
        wheelAcc = 0
        wheelLockedUntil = now + WHEEL_LOCK_MS
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', () => (tracking = false), { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('wheel', onWheel)
      window.clearTimeout(wheelTimer)
    }
  }, [ref, enabled, next, prev, menuOpen])
}
