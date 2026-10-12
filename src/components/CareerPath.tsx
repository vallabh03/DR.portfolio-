import { motion } from 'motion/react'
import { EASE, EASE_IN_OUT, useDecorativeMotion } from '../lib/motion'

const pad = (n: number) => String(n).padStart(2, '0')

export type PathStop = {
  /** Shown in the index, e.g. the institution. */
  label: string
  /** The period, shown under the active stop's label. */
  period?: string
}

/* Isometric tile geometry (SVG user units). */
const TILE_W = 64
const TILE_H = 32
const DEPTH = 7
const STEP_Y = 58
const VIEW_W = 220
const TOP = 56

/** Stops zigzag down and to the left, newest at the top, like steps on a path. */
const tilePosition = (i: number) => ({ x: 150 - i * 24 - (i % 2 ? 70 : 0), y: TOP + i * STEP_Y })

/** The top face plus the two visible sides of one tile, centred on (x, y). */
function Tile({ x, y, n, active }: { x: number; y: number; n: number; active: boolean }) {
  const w = TILE_W / 2
  const h = TILE_H / 2
  const top = `M${x} ${y - h} L${x + w} ${y} L${x} ${y + h} L${x - w} ${y} Z`
  const left = `M${x - w} ${y} L${x} ${y + h} L${x} ${y + h + DEPTH} L${x - w} ${y + DEPTH} Z`
  const right = `M${x + w} ${y} L${x} ${y + h} L${x} ${y + h + DEPTH} L${x + w} ${y + DEPTH} Z`
  return (
    <g className="transition-colors duration-500" style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}>
      <path d={left} fill="var(--surface-2)" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
      <path d={right} fill="var(--surface-2)" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
      <path
        d={top}
        className="transition-[fill] duration-500"
        fill={active ? 'var(--accent-soft)' : 'var(--surface)'}
        stroke="currentColor"
        strokeWidth={active ? 1.2 : 0.8}
        strokeLinejoin="round"
      />
      <text x={x} y={y + 2.5} textAnchor="middle" fontSize="9" fontFamily="var(--font-sans)" fill="currentColor" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {pad(n)}
      </text>
    </g>
  )
}

/**
 * A career path drawn as isometric stepping stones. The doctor's portrait sits on
 * the stop being read and hops to the next one as the reader scrolls; the index
 * beneath highlights the same stop and jumps to its entry when chosen.
 *
 * `active` is driven by the page's own scroll tracking. Under reduced motion the
 * portrait moves between stops without travelling or hopping.
 */
export default function CareerPath({
  stops,
  active,
  onSelect,
  avatarSrc,
  topLabel = 'Now',
  bottomLabel,
}: {
  stops: PathStop[]
  active: number
  onSelect: (index: number) => void
  avatarSrc: string
  topLabel?: string
  bottomLabel?: string
}) {
  const animated = useDecorativeMotion()
  const points = stops.map((_, i) => tilePosition(i))
  const viewH = TOP + (stops.length - 1) * STEP_Y + 50
  const current = points[active] ?? points[0]
  const AVATAR = 36 // SVG units

  return (
    <div>
      {/* The path: decorative, the index below carries the same information */}
      <div aria-hidden className="relative w-full max-w-[19rem]">
        <svg viewBox={`0 0 ${VIEW_W} ${viewH}`} className="block w-full overflow-visible">
          {/* Dotted trail between stops */}
          <polyline
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          {points.map((p, i) => (
            <Tile key={i} x={p.x} y={p.y} n={i + 1} active={i === active} />
          ))}
          <text x={points[0].x + TILE_W / 2 + 10} y={points[0].y - 22} fontSize="8" fontFamily="var(--font-sans)" fill="var(--muted)">
            {topLabel}
          </text>
          {bottomLabel && (
            <text x={points.at(-1)!.x + 4} y={points.at(-1)!.y + TILE_H / 2 + DEPTH + 13} fontSize="8" fontFamily="var(--font-sans)" fill="var(--muted)">
              {bottomLabel}
            </text>
          )}

          {/* The portrait travels to the active stop, then hops once as it lands */}
          <motion.g
            initial={false}
            animate={{ x: current.x, y: current.y - TILE_H / 2 - AVATAR / 2 - 6 }}
            transition={{ duration: animated ? 0.7 : 0, ease: EASE_IN_OUT }}
          >
            <motion.g
              key={active}
              initial={false}
              animate={animated ? { y: [0, -12, 0] } : { y: 0 }}
              transition={{ duration: 0.7, ease: EASE, times: [0, 0.45, 1] }}
            >
              <defs>
                <clipPath id="career-avatar-clip">
                  <circle cx="0" cy="0" r={AVATAR / 2} />
                </clipPath>
              </defs>
              <circle cx="0" cy="0" r={AVATAR / 2 + 1.6} fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.2" />
              <image
                href={avatarSrc}
                x={-AVATAR / 2}
                y={-AVATAR / 2}
                width={AVATAR}
                height={AVATAR * 1.13}
                preserveAspectRatio="xMidYMin slice"
                clipPath="url(#career-avatar-clip)"
              />
              {/* Pointer to the tile beneath */}
              <path d={`M-4 ${AVATAR / 2 + 3} L0 ${AVATAR / 2 + 7} L4 ${AVATAR / 2 + 3}`} fill="none" stroke="var(--foreground)" strokeWidth="1" strokeLinecap="round" />
            </motion.g>
          </motion.g>
        </svg>
      </div>

      {/* Index: the active stop is highlighted; choosing one scrolls to its entry */}
      <ol className="mt-8 space-y-1">
        {stops.map((s, i) => {
          const isActive = i === active
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={isActive ? 'step' : undefined}
                className={`relative flex w-full items-baseline gap-4 rounded-md px-4 py-3 text-left transition-colors duration-300 ${
                  isActive ? 'text-fg' : 'text-muted hover:text-fg'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="career-path-highlight"
                    aria-hidden
                    className="absolute inset-0 rounded-md bg-surface"
                    transition={{ duration: animated ? 0.45 : 0, ease: EASE }}
                  />
                )}
                <span className="relative text-xs tabular-nums">{pad(i + 1)}</span>
                <span className="relative min-w-0">
                  <span className={`block leading-snug ${isActive ? 'font-semibold' : ''}`}>{s.label}</span>
                  {s.period && (
                    <span
                      className={`grid text-sm text-brass transition-[grid-template-rows,opacity] duration-500 ${
                        isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <span className="overflow-hidden">
                        <span className="block pt-1">{s.period}</span>
                      </span>
                    </span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
