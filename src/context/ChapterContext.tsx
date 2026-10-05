import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useMotionValue, type MotionValue } from 'framer-motion'
import { chapters, chapterIndexByPath, type Chapter } from '../data/chapters'
import { doctor } from '../data/doctor'

type GoOptions = { focus?: boolean }

type ChapterCtx = {
  index: number
  count: number
  chapter: Chapter
  /** -1 moving left, 1 moving right, 0 initial */
  direction: number
  go: (i: number, opts?: GoOptions) => void
  next: () => void
  prev: () => void
  /** Scroll the current chapter vertically by roughly half a viewport. */
  scrollStep: (dir: 1 | -1) => void
  scrollToTop: () => void
  registerScroller: (index: number, el: HTMLElement | null) => void
  /** 0 → 1 vertical progress of the active chapter */
  scrollProgress: MotionValue<number>
  consumeFocusRequest: () => boolean
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
}

const Ctx = createContext<ChapterCtx | null>(null)

const NAV_COOLDOWN = 420

export function ChapterProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const found = chapterIndexByPath(location.pathname)
  const index = found === -1 ? 0 : found

  // Unknown paths fall back to home.
  useEffect(() => {
    if (found === -1) navigate('/', { replace: true })
  }, [found, navigate])

  // Derive direction from index changes (covers browser back/forward too).
  const [nav, setNav] = useState({ index, direction: 0 })
  if (nav.index !== index) setNav({ index, direction: index > nav.index ? 1 : -1 })

  const scrollers = useRef(new Map<number, HTMLElement>())
  const lastNav = useRef(0)
  const focusRequest = useRef(false)
  const scrollProgress = useMotionValue(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const go = useCallback(
    (i: number, opts?: GoOptions) => {
      const target = Math.max(0, Math.min(chapters.length - 1, i))
      if (target === index) {
        if (opts?.focus) {
          const el = scrollers.current.get(index)
          el?.scrollTo({ top: 0, behavior: 'smooth' })
          el?.focus({ preventScroll: true })
        }
        return
      }
      const now = performance.now()
      if (now - lastNav.current < NAV_COOLDOWN) return
      lastNav.current = now
      focusRequest.current = !!opts?.focus
      navigate(chapters[target].path)
    },
    [index, navigate],
  )

  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  const scrollStep = useCallback(
    (dir: 1 | -1) => {
      const el = scrollers.current.get(index)
      if (!el) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollBy({ top: dir * el.clientHeight * 0.45, behavior: reduce ? 'auto' : 'smooth' })
    },
    [index],
  )

  const scrollToTop = useCallback(() => {
    const el = scrollers.current.get(index)
    el?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [index])

  const registerScroller = useCallback((i: number, el: HTMLElement | null) => {
    if (el) scrollers.current.set(i, el)
    else scrollers.current.delete(i)
  }, [])

  const consumeFocusRequest = useCallback(() => {
    const r = focusRequest.current
    focusRequest.current = false
    return r
  }, [])

  // Document title per chapter.
  useEffect(() => {
    const c = chapters[index]
    document.title = c.id === 'home' ? `${doctor.name}` : `${c.title} — ${doctor.name}`
    scrollProgress.set(0)
  }, [index, scrollProgress])

  const value = useMemo<ChapterCtx>(
    () => ({
      index,
      count: chapters.length,
      chapter: chapters[index],
      direction: nav.direction,
      go,
      next,
      prev,
      scrollStep,
      scrollToTop,
      registerScroller,
      scrollProgress,
      consumeFocusRequest,
      menuOpen,
      setMenuOpen,
    }),
    [index, nav.direction, go, next, prev, scrollStep, scrollToTop, registerScroller, scrollProgress, consumeFocusRequest, menuOpen],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useChapters() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useChapters must be used inside ChapterProvider')
  return ctx
}

/** True once the loading screen has finished. */
export const AppReadyContext = createContext(false)
export const useAppReady = () => useContext(AppReadyContext)

/** The scroll container of the chapter a component lives in. */
export const ScrollerContext = createContext<React.RefObject<HTMLDivElement | null> | null>(null)
export const useScroller = () => useContext(ScrollerContext)
