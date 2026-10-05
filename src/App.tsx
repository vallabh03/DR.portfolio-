import { useCallback, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { AppReadyContext, ChapterProvider, useChapters } from './context/ChapterContext'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { ChapterStage } from './components/PageTransition'
import Navbar from './components/Navbar'
import NavigationControls from './components/NavigationControls'
import LoadingScreen from './components/LoadingScreen'
import CustomCursor from './components/CustomCursor'
import { pad } from './data/chapters'

function Shell({ ready }: { ready: boolean }) {
  useKeyboardNavigation(ready)
  const { index, count, chapter } = useChapters()

  return (
    <>
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
        className="fixed left-4 top-4 z-[120] -translate-y-24 rounded-full bg-fg px-5 py-3 text-sm text-bg transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <div inert={!ready} aria-hidden={!ready}>
        <ChapterStage />
        <Navbar />
        <NavigationControls />
      </div>
      <div className="grain" aria-hidden />
      {/* Announce chapter changes for screen readers */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {ready ? `Chapter ${pad(index + 1)} of ${count}: ${chapter.title}` : ''}
      </p>
    </>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const onDone = useCallback(() => setReady(true), [])

  return (
    <AppReadyContext.Provider value={ready}>
      <ChapterProvider>
        <Shell ready={ready} />
        <CustomCursor />
        <AnimatePresence>{!ready && <LoadingScreen key="loader" onDone={onDone} />}</AnimatePresence>
      </ChapterProvider>
    </AppReadyContext.Provider>
  )
}
