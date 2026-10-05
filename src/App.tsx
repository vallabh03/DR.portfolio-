import { useEffect, useLayoutEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigationType, useParams } from 'react-router'
import SiteHeader from './components/SiteHeader'
import Footer from './components/Footer'
import MobileBookBar from './components/MobileBookBar'
import HomePage from './pages/HomePage'
import ConsultationPage from './pages/ConsultationPage'
import { doctor } from './data/doctor'
import { BOOK_PATH, sections } from './data/navigation'

/**
 * On every navigation: scroll to the #section if there is one (and move focus
 * to it for keyboard and screen-reader users), otherwise start at the top.
 */
function ScrollManager() {
  const { pathname, hash, key } = useLocation()
  const navType = useNavigationType()

  useLayoutEffect(() => {
    const id = decodeURIComponent(hash.slice(1))
    const target = id ? document.getElementById(id) : null
    if (!target) {
      // Back/forward without a #section: let the browser restore its position.
      if (navType === 'POP') return
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth', block: 'start' })
    target.focus({ preventScroll: true })
  }, [pathname, hash, key, navType])

  useEffect(() => {
    document.title = pathname === BOOK_PATH ? `Book a consultation — ${doctor.name}` : doctor.name
  }, [pathname])

  return null
}

/** Old chapter URLs (/about, /experience, …) land on their home-page section. */
function LegacyRedirect() {
  const { slug = '' } = useParams()
  return <Navigate to={sections.some((s) => s.id === slug) ? `/#${slug}` : '/'} replace />
}

export default function App() {
  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-3 z-[120] -translate-y-24 rounded-md bg-fg px-5 py-3 text-sm font-medium text-bg transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <ScrollManager />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path={BOOK_PATH} element={<ConsultationPage />} />
          <Route path="/:slug" element={<LegacyRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <MobileBookBar />
    </>
  )
}
