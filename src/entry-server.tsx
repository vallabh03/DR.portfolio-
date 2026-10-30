import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { MotionConfig } from 'motion/react'
import { ThemeProvider } from './hooks/useTheme'
import App from './App'

/**
 * Build-time rendering (scripts/prerender.mjs): the HTML of one page, so each
 * built page file contains its real headings, text, links and images for search
 * engines and link previews, not only an empty <div id="root">.
 *
 * In the browser, src/main.tsx then starts the app as before and replaces this
 * markup, so the site behaves exactly as it does without prerendering.
 */
export function render(url: string) {
  return renderToString(
    <StaticRouter location={url}>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </ThemeProvider>
    </StaticRouter>,
  )
}
