import { youtubeThumbnail, youtubeUrl, type YouTubeVideo } from '../data/gallery'

/**
 * A row of YouTube videos that drifts sideways on its own, all the time.
 * Tapping a card opens the video on YouTube (the app on phones that have it).
 * The row pauses only while a card has keyboard focus.
 */
export default function VideoStrip({ videos }: { videos: YouTubeVideo[] }) {
  // About five seconds per card keeps titles readable as they pass.
  const duration = `${Math.max(20, videos.length * 5)}s`

  return (
    <div className="video-strip relative overflow-hidden">
      <ul className="video-strip-track flex w-max py-2" style={{ animationDuration: duration }}>
        {[...videos, ...videos].map((v, i) => {
          // The second copy only completes the loop; it is hidden from screen readers and the keyboard.
          // Spacing is padding on each card (not a gap) so the two copies are exactly equal and the loop is seamless.
          const copy = i >= videos.length
          return (
            <li key={`${v.id}-${i}`} aria-hidden={copy || undefined} className="w-[18.25rem] shrink-0 pr-5 sm:w-[21.25rem]">
              <a
                href={youtubeUrl(v)}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={copy ? -1 : undefined}
                className="group block overflow-hidden rounded-2xl border border-line bg-bg shadow-[0_24px_48px_-36px_rgba(27,95,140,0.45)] transition-transform duration-300 hover:-translate-y-1"
              >
                <span className="relative block aspect-video overflow-hidden bg-surface-2">
                  <img
                    src={youtubeThumbnail(v)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Play badge */}
                  <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors duration-300 group-hover:bg-black/25">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#c4302b] shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6" fill="currentColor">
                        <path d="M8 5.5v13l11-6.5z" />
                      </svg>
                    </span>
                  </span>
                </span>
                {/* Fixed-height text area, so every card is exactly the same size */}
                <span className="block p-5">
                  <span className="line-clamp-3 block h-[4.125em] font-semibold leading-[1.375] text-fg">{v.title}</span>
                  <span className="mt-3 flex items-center gap-1.5 whitespace-nowrap text-sm text-muted">
                    <span className="truncate">{v.channel}</span>
                    <span aria-hidden>·</span>
                    <span className="shrink-0">YouTube</span>
                    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 11 11 5M6 5h5v5" />
                    </svg>
                  </span>
                  {!copy && <span className="sr-only"> (opens YouTube in a new tab)</span>}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
