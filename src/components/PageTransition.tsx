import { Suspense, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { chapters } from '../data/chapters'
import { ScrollerContext, useChapters } from '../context/ChapterContext'
import { useSwipeNavigation } from '../hooks/useSwipeNavigation'

const EASE = [0.16, 1, 0.3, 1] as const

const variants: Variants = {
  enter: (dir: number) => ({
    opacity: 0,
    scale: 1.02,
    x: dir > 0 ? '5%' : dir < 0 ? '-5%' : 0,
  }),
  center: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { duration: 0.85, ease: EASE, opacity: { duration: 0.6, delay: 0.08 } },
  },
  exit: (dir: number) => ({
    opacity: 0,
    scale: 0.98,
    x: dir > 0 ? '-4%' : dir < 0 ? '4%' : 0,
    pointerEvents: 'none',
    transition: { duration: 0.55, ease: EASE },
  }),
}

/** One full-screen chapter: animated wrapper + its own vertical scroll container. */
export function PageTransition({ index, direction, children }: { index: number; direction: number; children: ReactNode }) {
  const { registerScroller, scrollProgress, consumeFocusRequest, index: active } = useChapters()
  const ref = useRef<HTMLDivElement>(null)
  const isActive = index === active

  useEffect(() => {
    const el = ref.current
    registerScroller(index, el)
    if (el && consumeFocusRequest()) el.focus({ preventScroll: true })
    return () => registerScroller(index, null)
  }, [index, registerScroller, consumeFocusRequest])

  const onScroll = useCallback(() => {
    const el = ref.current
    if (!el || !isActive) return
    const max = el.scrollHeight - el.clientHeight
    scrollProgress.set(max > 0 ? el.scrollTop / max : 0)
  }, [isActive, scrollProgress])

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 will-change-transform"
      style={{ zIndex: isActive ? 2 : 1 }}
    >
      <div
        ref={ref}
        id={isActive ? 'main' : undefined}
        tabIndex={-1}
        role="region"
        aria-label={chapters[index].title}
        onScroll={onScroll}
        className="chapter-scroller h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain outline-none"
      >
        <ScrollerContext.Provider value={ref}>{children}</ScrollerContext.Provider>
      </div>
    </motion.div>
  )
}

function ChapterFallback() {
  return (
    <div className="flex h-full items-center justify-center" aria-hidden>
      <span className="h-1.5 w-1.5 animate-ping rounded-full bg-accent" />
    </div>
  )
}

/** The full-viewport stage that swaps chapters with directional transitions. */
export function ChapterStage() {
  const { index, direction } = useChapters()
  const stageRef = useRef<HTMLDivElement>(null)
  useSwipeNavigation(stageRef)
  const { Component } = chapters[index]

  return (
    <div ref={stageRef} className="fixed inset-0 overflow-hidden">
      <AnimatePresence initial={false} custom={direction}>
        {/* AnimatePresence hands the latest `custom` to the exiting page, so both
            pages move in the direction of travel. */}
        <PageTransition key={index} index={index} direction={direction}>
          <Suspense fallback={<ChapterFallback />}>
            <Component />
          </Suspense>
        </PageTransition>
      </AnimatePresence>
    </div>
  )
}
