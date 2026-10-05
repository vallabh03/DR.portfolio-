import DrawLine from './DrawLine'

/**
 * Editorial column grid drawn behind a composition on page entrance:
 * 4 columns on phones, 12 on desktop. A faint, single-pass supporting detail
 * that draws after the primary motion has landed. Decorative only.
 */
export default function GridLines({ delay = 0 }: { delay?: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-50">
      <div className="container-page relative grid h-full grid-cols-4 lg:grid-cols-12">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`relative ${i >= 4 ? 'hidden lg:block' : ''}`}>
            <DrawLine axis="y" immediate delay={delay + i * 0.02} duration={1.2} className="absolute inset-y-0 left-0 bg-line" />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-y-0 right-5 md:right-8 lg:right-14">
          <DrawLine axis="y" immediate delay={delay + 0.24} duration={1.2} className="absolute inset-y-0 right-0 bg-line" />
        </div>
      </div>
    </div>
  )
}
