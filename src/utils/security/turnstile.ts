// src/utils/security/turnstile.ts
// Loader + renderer for Cloudflare Turnstile (explicit widget). Keeps last token.

let scriptLoaded = false
let widgetId: string | null = null
let lastToken: string | null = null

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const SITE_KEY = (import.meta as any)?.env?.VITE_TURNSTILE_SITE_KEY || ''
const CALLBACK_NAME = '__onTurnstileLoaded'

declare global {
  interface Window {
    turnstile?: { render: (el: string | HTMLElement, opts: Record<string, any>) => string; reset: (id?: string) => void }
    [key: string]: any
  }
}

/** Inject Turnstile script once and resolve when ready. */
// relative/file/path: src/utils/security/turnstile.ts
export function loadTurnstile(): Promise<void> {
    if (window.turnstile) return Promise.resolve()
  
    if (scriptLoaded) {
      return new Promise<void>((resolve) => {
        const wait = (): void => {
          if (window.turnstile) {
            resolve()
          } else {
            window.setTimeout(wait, 50)
          }
        }
        wait()
      })
    }
  
    if (!SITE_KEY) {
      console.error('[turnstile] Missing VITE_TURNSTILE_SITE_KEY at build-time.')
      return Promise.reject(new Error('Missing VITE_TURNSTILE_SITE_KEY'))
    }
  
    scriptLoaded = true
    return new Promise<void>((resolve, reject) => {
      window[CALLBACK_NAME] = () => resolve()
      const s = document.createElement('script')
      s.src = `${SRC}?render=explicit&onload=${CALLBACK_NAME}`
      s.async = true
      s.defer = true
      s.onerror = () => {
        console.error('[turnstile] Script failed to load.')
        reject(new Error('Failed to load Turnstile'))
      }
      document.head.appendChild(s)
    })
  }
  

const normalizeTarget = (t: string | HTMLElement) =>
  typeof t === 'string' && !t.startsWith('#') ? '#' + t : t

/** Render Turnstile into container and keep token fresh. */
export async function renderTurnstile(
  container: string | HTMLElement,
  onSuccess?: (t: string) => void,
  onExpired?: () => void
) {
  await loadTurnstile()
  if (!window.turnstile) throw new Error('turnstile unavailable')

  if (widgetId) {
    try { window.turnstile.reset(widgetId) } catch {}
  }

  widgetId = window.turnstile.render(normalizeTarget(container) as any, {
    sitekey: SITE_KEY,
    callback: (t: string) => { lastToken = t; onSuccess && onSuccess(t) },
    'expired-callback': () => { lastToken = null; onExpired && onExpired() },
    'error-callback': () => { lastToken = null; console.warn('[turnstile] widget error (wrong site key / domain?)') }
  })
}

export const getTurnstileToken = () => lastToken
export function resetTurnstile() { if (widgetId && window.turnstile) try { window.turnstile.reset(widgetId) } catch {}; lastToken = null }
