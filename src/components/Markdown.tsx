import type { ReactNode } from 'react'
import { parseMarkdown, type Inline } from '../lib/markdown'

/** Renders an article's text (see src/lib/markdown.ts) as React elements. */
export default function Markdown({ source }: { source: string }) {
  return (
    <div className="article-body">
      {parseMarkdown(source).map((b, i) => {
        if (b.type === 'heading') return b.level === 2 ? <h2 key={i}>{inline(b.children)}</h2> : <h3 key={i}>{inline(b.children)}</h3>
        if (b.type === 'quote') return <blockquote key={i}>{inline(b.children)}</blockquote>
        if (b.type === 'list') {
          const items = b.items.map((it, j) => <li key={j}>{inline(it)}</li>)
          return b.ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>
        }
        return <p key={i}>{inline(b.children)}</p>
      })}
    </div>
  )
}

function inline(parts: Inline[]): ReactNode[] {
  return parts.map((p, i) => {
    if (p.type === 'text') return p.text
    if (p.type === 'strong') return <strong key={i}>{inline(p.children)}</strong>
    if (p.type === 'em') return <em key={i}>{inline(p.children)}</em>
    const external = /^https?:\/\//i.test(p.href)
    return (
      <a key={i} href={p.href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {inline(p.children)}
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    )
  })
}
