// src/utils/security/turnstile.ts
// --------------------------------------------------------------------
// Loader + renderer for Cloudflare Turnstile (explicit widget).
// Caches widget id and last token for submit.
// --------------------------------------------------------------------
let scriptLoaded = false
let widgetId: string | null = null
let lastToken: string | null = null

const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const SITE_KEY = (import.meta as any)?.env?.VITE_TURNSTILE_SITE_KEY || ''
const CALLBACK_NAME = '__onTurnstileLoaded'

declare global {
interface Window {
turnstile?: {
render: (el: string | HTMLElement, opts: Record<string, any>) => string
reset: (id?: string) => void
}
[key: string]: any
}
}

/** Inject Turnstile script once and resolve when ready. */
export function loadTurnstile(): Promise<void> {
if (window.turnstile) return Promise.resolve()

if (scriptLoaded) {
return new Promise((resolve) => {
const wait = (): void => {
if (window.turnstile) resolve()
else window.setTimeout(wait, 50)
}
wait()
})
}

scriptLoaded = true
return new Promise((resolve, reject) => {
window[CALLBACK_NAME] = () => resolve()
const s = document.createElement('script')
s.src = SRC + '?render=explicit&onload=' + CALLBACK_NAME
s.async = true
s.defer = true
s.onerror = () => reject(new Error('Failed to load Turnstile'))
document.body.appendChild(s)
})
}

/** Render Turnstile into containerId and keep token fresh. */
export async function renderTurnstile(
containerId: string,
onSuccess?: (token: string) => void,
onExpired?: () => void
): Promise<void> {
if (!SITE_KEY) throw new Error('VITE_TURNSTILE_SITE_KEY is missing')
await loadTurnstile()
if (!window.turnstile) throw new Error('turnstile unavailable')

if (widgetId) {
try { window.turnstile.reset(widgetId) } catch {}
}

widgetId = window.turnstile.render(containerId, {
sitekey: SITE_KEY,
callback: (t: string) => { lastToken = t; onSuccess && onSuccess(t) },
'expired-callback': () => { lastToken = null; onExpired && onExpired() },
'error-callback': () => { lastToken = null }
})
}

/** Get the last issued token (or null). */
export function getTurnstileToken(): string | null {
return lastToken
}

/** Reset widget and clear token. */
export function resetTurnstile(): void {
if (widgetId && window.turnstile) {
try { window.turnstile.reset(widgetId) } catch {}
}
lastToken = null
}