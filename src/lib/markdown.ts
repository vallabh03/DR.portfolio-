/**
 * A small, safe reader for the formatting used in blog articles. It turns the
 * text into plain data (blocks and inline pieces) that the page renders as
 * React elements, so nothing in an article is ever inserted as raw HTML.
 */

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'link'; href: string; children: Inline[] }

export type Block =
  | { type: 'heading'; level: 2 | 3; children: Inline[] }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'quote'; children: Inline[] }

/** Only web and email links are kept; anything else is shown as plain text. */
const safeHref = (href: string) => (/^(https?:\/\/|mailto:|\/)/i.test(href.trim()) ? href.trim() : undefined)

export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  // Links, then **bold**, then *italic*; the first match in the text wins.
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|\*(.+?)\*/
  let rest = text
  while (rest) {
    const m = re.exec(rest)
    if (!m) {
      out.push({ type: 'text', text: rest })
      break
    }
    if (m.index > 0) out.push({ type: 'text', text: rest.slice(0, m.index) })
    if (m[1] !== undefined) {
      const href = safeHref(m[2])
      out.push(href ? { type: 'link', href, children: parseInline(m[1]) } : { type: 'text', text: m[0] })
    } else if (m[3] !== undefined) out.push({ type: 'strong', children: parseInline(m[3]) })
    else out.push({ type: 'em', children: parseInline(m[4]) })
    rest = rest.slice(m.index + m[0].length)
  }
  return out
}

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = []
  const chunks = source.replace(/\r\n?/g, '\n').split(/\n\s*\n/)
  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue
    const first = lines[0]
    const heading = /^(#{2,3})\s+(.*)$/.exec(first)
    if (heading && lines.length === 1) {
      blocks.push({ type: 'heading', level: heading[1].length as 2 | 3, children: parseInline(heading[2]) })
    } else if (lines.every((l) => /^[-*]\s+/.test(l))) {
      blocks.push({ type: 'list', ordered: false, items: lines.map((l) => parseInline(l.replace(/^[-*]\s+/, ''))) })
    } else if (lines.every((l) => /^\d+[.)]\s+/.test(l))) {
      blocks.push({ type: 'list', ordered: true, items: lines.map((l) => parseInline(l.replace(/^\d+[.)]\s+/, ''))) })
    } else if (lines.every((l) => l.startsWith('>'))) {
      blocks.push({ type: 'quote', children: parseInline(lines.map((l) => l.replace(/^>\s?/, '')).join(' ')) })
    } else {
      blocks.push({ type: 'paragraph', children: parseInline(lines.join(' ')) })
    }
  }
  return blocks
}
