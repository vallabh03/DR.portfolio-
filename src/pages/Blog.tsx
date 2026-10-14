import { motion } from 'motion/react'
import { Link } from 'react-router'
import { doctor } from '../data/doctor'
import { formatPostDate, postPath, publishedPosts, readingMinutes } from '../data/blog'
import { useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import { ArrowRight } from '../components/Button'

/**
 * Blog: the doctor's articles, newest first. Until the first article is
 * published the page says so plainly rather than showing placeholders.
 */
export default function Blog() {
  const entrance = useEntrance()

  return (
    <>
      <section aria-labelledby="blog-title" className="container-page pb-12 pt-10 md:pb-16 md:pt-16 lg:pt-20">
        <motion.p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-accent" {...entrance(0)}>
          <span aria-hidden className="h-px w-10 bg-accent" />
          Blog
        </motion.p>
        <RevealText
          as="h1"
          id="blog-title"
          lines={['Articles and notes']}
          className="mt-6 font-serif text-[clamp(2.5rem,1.7rem+3vw,4.5rem)] leading-[1.02] tracking-[-0.025em]"
          delay={0.1}
          immediate
        />
        <motion.p className="measure mt-6 text-[1.0625rem] leading-[1.8] text-fg/75" {...entrance(0.35)}>
          Writing by {doctor.name} on head and neck cancer care, for patients and families.
        </motion.p>
      </section>

      <section aria-label="Articles" className="container-page pb-20 md:pb-28">
        {publishedPosts.length === 0 ? (
          <motion.div className="rounded-[1.75rem] border border-line bg-surface px-6 py-12 text-center sm:px-10" {...entrance(0.45)}>
            <p className="font-serif text-[clamp(1.5rem,1.3rem+0.8vw,2rem)]">No articles yet</p>
            <p className="mt-3 text-muted">New articles will appear here.</p>
          </motion.div>
        ) : (
          <ul className="border-t border-line">
            {publishedPosts.map((p) => (
              <li key={p.slug} className="border-b border-line">
                <Link
                  to={postPath(p)}
                  className="group -mx-3 block rounded-xl px-3 py-8 transition-colors duration-300 hover:bg-surface focus-visible:bg-surface sm:-mx-4 sm:px-4 md:py-10"
                >
                  <p className="text-sm text-muted">
                    <time dateTime={p.date}>{formatPostDate(p.date)}</time> · {readingMinutes(p.body)} min read
                  </p>
                  <h2 className="mt-3 font-serif text-[clamp(1.5rem,1.3rem+0.8vw,2rem)] leading-snug tracking-[-0.01em] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
                    {p.title}
                  </h2>
                  <p className="measure mt-3 leading-relaxed text-fg/80">{p.summary}</p>
                  <span className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent group-hover:text-accent-hover">
                    <span className="link-underline">Read article</span>
                    <ArrowRight />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
