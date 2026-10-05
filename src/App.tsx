import { useEffect, useLayoutEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Navigate, Route, Routes, useLocation, useNavigationType, type NavigationType } from 'react-router'
import SiteHeader from './components/SiteHeader'
import Footer from './components/Footer'
import MobileBookBar from './components/MobileBookBar'
import Home from './pages/Home'
import About from './pages/About'
import Expertise from './pages/Expertise'
import Experience from './pages/Experience'
import Research from './pages/Research'
import Contact from './pages/Contact'
import Consultation from './pages/Consultation'
import { BOOK_PATH, documentTitle, legacyRedirects } from './data/navigation'
import { EASE_EXIT } from './lib/motion'

/* ── Scroll positions per history entry, so Back/Forward return to where you were ── */
const STORE = 'at-scroll'
const readPositions = (): Record<string, number> => {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) ?? '{}')
  } catch {
    return {}
  }
}
const positions = readPositions()
const savePosition = (key: string, y: number) => {
  positions[key] = y
  try {
    sessionStorage.setItem(STORE, JSON.stringify(positions))
  } catch {
    /* storage unavailable: positions still work for this visit */
  }
}

let firstPage = true

/** Entries opened directly all share React Router's "default" key, so add the path. */
const entryKey = (key: string, pathname: string) => (key === 'default' ? `default:${pathname}` : key)

/** On first load, restore only for a reload or a browser Back/Forward into the site. */
const firstLoadRestores = () => {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  return nav?.type === 'reload' || nav?.type === 'back_forward'
}
/** The history entry whose page is on screen (lags the URL during a transition). */
let displayedKey: string | null = null

/**
 * Runs when a page has finished entering (it mounts after the previous page's
 * exit). New navigations start at the top; Back/Forward restores the saved
 * position. Focus moves to the page heading for keyboard and screen-reader users.
 */
function PageEnter({ locationKey, pathname, navType }: { locationKey: string; pathname: string; navType: NavigationType }) {
  useLayoutEffect(() => {
    const key = entryKey(locationKey, pathname)
    if (displayedKey === key) return // already handled (React StrictMode re-runs effects in development)
    displayedKey = key
    document.title = documentTitle(pathname)
    const saved = positions[key]
    const restore = navType === 'POP' && saved !== undefined && (!firstPage || firstLoadRestores())
    if (restore) window.scrollTo({ top: saved, behavior: 'instant' })
    else if (!firstPage) window.scrollTo({ top: 0, behavior: 'instant' })

    if (!firstPage) document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true })
    firstPage = false
  }, [locationKey, pathname, navType])
  return null
}

export default function App() {
  const location = useLocation()
  const navType = useNavigationType()

  // We restore scroll ourselves, after the page transition.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    const onLeave = () => displayedKey && savePosition(displayedKey, window.scrollY)
    window.addEventListener('pagehide', onLeave)
    return () => window.removeEventListener('pagehide', onLeave)
  }, [])

  // Before the page on screen animates away, remember where it was scrolled to.
  useLayoutEffect(() => {
    if (displayedKey && displayedKey !== entryKey(location.key, location.pathname)) savePosition(displayedKey, window.scrollY)
  }, [location.key, location.pathname])

  return (
    <>
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
        className="fixed left-4 top-3 z-[120] -translate-y-24 rounded-md bg-fg px-5 py-3 text-sm font-medium text-bg transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3, ease: 'linear' } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.22, ease: EASE_EXIT } }}
          >
            <PageEnter locationKey={location.key} pathname={location.pathname} navType={navType} />
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/expertise" element={<Expertise />} />
              <Route path="/experience" element={<Experience />} />
              <Route path="/research" element={<Research />} />
              <Route path="/contact" element={<Contact />} />
              <Route path={BOOK_PATH} element={<Consultation />} />
              {Object.entries(legacyRedirects).map(([from, to]) => (
                <Route key={from} path={from} element={<Navigate to={to} replace />} />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <MobileBookBar />
    </>
  )
}
