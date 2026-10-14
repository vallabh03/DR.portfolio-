import { motion } from 'motion/react'
import { Link, useParams } from 'react-router'
import { doctor } from '../data/doctor'
import { findPost, formatPostDate, readingMinutes } from '../data/blog'
import { BOOK_PATH } from '../data/navigation'
import { useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import Markdown from '../components/Markdown'
import { ArrowRight } from '../components/Button'
import NotFound from './NotFound'

/** One article, set for reading, with a note that it is general information. */
export default function BlogPost() {
  const { slug } = useParams()
  const post = findPost(slug)
  const entrance = useEntrance()
  if (!post) return <NotFound />

  return (
    <article aria-labelledby="post-title" className="container-page pb-20 pt-10 md:pb-28 md:pt-16 lg:pt-20">
      <div className="mx-auto max-w-[44rem]">
        <motion.div {...entrance(0)}>
          <Link to="/blog" className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover">
            <span aria-hidden className="inline-block rotate-180 transition-transform duration-300 group-hover:-translate-x-1">
              <ArrowRight />
            </span>
            <span className="link-underline">All articles</span>
          </Link>
          <p className="mt-6 text-sm text-muted">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time> · {readingMinutes(post.body)} min read · {doctor.name}
          </p>
        </motion.div>
        <RevealText
          as="h1"
          id="post-title"
          lines={[post.title]}
          className="mt-4 font-serif text-[clamp(2.125rem,1.6rem+2.2vw,3.5rem)] leading-[1.08] tracking-[-0.02em]"
          delay={0.1}
          immediate
        />
        <motion.p className="mt-6 text-[1.1875rem] leading-[1.7] text-fg/80" {...entrance(0.3)}>
          {post.summary}
        </motion.p>

        <motion.div className="mt-10 border-t border-line pt-10" {...entrance(0.4)}>
          <Markdown source={post.body} />
        </motion.div>

        <aside className="mt-14 rounded-2xl border border-line bg-surface p-6 text-sm leading-relaxed text-muted sm:p-7">
          This article is general information and is not medical advice for any individual. Please discuss your own situation with your doctor.{' '}
          <Link to={BOOK_PATH} className="font-semibold text-accent hover:text-accent-hover">
            Book a consultation
          </Link>
          .
        </aside>
      </div>
    </article>
  )
}
