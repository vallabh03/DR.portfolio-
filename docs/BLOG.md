# Writing a blog article

Articles live in one file: `src/data/blog.ts`. Each article is one entry in the `posts` list. After adding or changing an entry, commit and deploy; the article appears at `/blog` and gets its own page at `/blog/<slug>`, with its own search details and a place in the sitemap.

## An entry

```ts
{
  slug: 'what-to-expect-after-thyroid-surgery',
  title: 'What to expect after thyroid surgery',
  date: '2026-10-20',
  summary: 'Recovery in the first weeks after thyroid surgery: wound care, voice, calcium levels and when to call the hospital.',
  body: `First paragraph.

## A heading

Another paragraph.`,
},
```

| Field | What to write |
|---|---|
| `slug` | The web address. Lower-case words joined by hyphens, unique for each article. |
| `title` | The article title. |
| `date` | Publication date as `YYYY-MM-DD`. The list is sorted newest first. |
| `summary` | One or two sentences (70–160 characters). Shown in the list and in Google results. |
| `body` | The article text, between backticks. |
| `draft` | Optional. `draft: true` keeps the article off the site until it is ready. |

## Formatting in the body

Leave a blank line between paragraphs.

| Write | Shows as |
|---|---|
| `## Heading` | A section heading |
| `### Subheading` | A smaller heading |
| `- item` (one per line) | A bulleted list |
| `1. item` (one per line) | A numbered list |
| `> text` | A highlighted quotation |
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `[link text](https://…)` | A link (web links open in a new tab) |

## Before publishing

- Write only what the doctor has written or approved.
- Do not include patient names, photographs or other details that could identify a patient.
- Every article is shown with a note that it is general information, not personal medical advice.
- Run `npm test`: it checks that slugs are unique, dates are real and summaries are a suitable length.
