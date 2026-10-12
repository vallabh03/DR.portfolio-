/**
 * Viewer consent for sensitive gallery sections. The visitor confirms they are
 * 18 or older before surgical images or videos are shown. The confirmation is
 * remembered for the browser session only (sessionStorage), per section, and is
 * never sent anywhere. It is a self-declaration, not age verification.
 */

const KEY = 'at-gallery-consent'

type Store = Pick<Storage, 'getItem' | 'setItem'>

const session = (): Store | undefined => {
  try {
    return typeof window === 'undefined' ? undefined : window.sessionStorage
  } catch {
    return undefined // storage blocked: consent then lasts until the page is left
  }
}

const read = (store: Store | undefined): string[] => {
  try {
    const value: unknown = JSON.parse(store?.getItem(KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

const write = (store: Store | undefined, slugs: string[]) => {
  try {
    store?.setItem(KEY, JSON.stringify(slugs))
  } catch {
    /* storage full or blocked: consent still holds for this page view */
  }
}

export function hasConsent(slug: string, store: Store | undefined = session()) {
  return read(store).includes(slug)
}

export function giveConsent(slug: string, store: Store | undefined = session()) {
  const slugs = read(store)
  if (!slugs.includes(slug)) write(store, [...slugs, slug])
}

export function withdrawConsent(slug: string, store: Store | undefined = session()) {
  write(
    store,
    read(store).filter((s) => s !== slug),
  )
}
