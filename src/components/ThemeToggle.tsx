import { motion } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'

/** Sun ↔ moon morph. The theme change radiates from the button (View Transitions). */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
      }}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full text-fg transition-colors hover:bg-accent-soft ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <mask id="theme-moon-mask">
          <rect width="24" height="24" fill="white" />
          <motion.circle
            r="7"
            fill="black"
            initial={false}
            animate={dark ? { cx: 17, cy: 7 } : { cx: 30, cy: -6 }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          />
        </mask>
        <motion.circle
          cx="12"
          cy="12"
          fill="currentColor"
          stroke="none"
          mask="url(#theme-moon-mask)"
          initial={false}
          animate={{ r: dark ? 8 : 4.5 }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
        />
        <motion.g
          initial={false}
          animate={{ opacity: dark ? 0 : 1, rotate: dark ? -45 : 0, scale: dark ? 0.6 : 1 }}
          style={{ originX: '12px', originY: '12px' }}
          transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          strokeLinecap="round"
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4
            return (
              <line
                key={i}
                x1={12 + Math.cos(a) * 7.5}
                y1={12 + Math.sin(a) * 7.5}
                x2={12 + Math.cos(a) * 9.8}
                y2={12 + Math.sin(a) * 9.8}
              />
            )
          })}
        </motion.g>
      </svg>
    </button>
  )
}
