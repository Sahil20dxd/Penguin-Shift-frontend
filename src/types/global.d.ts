// src/types/global.d.ts
export {}

declare global {
interface Window {
turnstile?: {
render: (el: string | HTMLElement, opts: Record<string, any>) => string
reset: (id?: string) => void
}
}

interface ImportMetaEnv {
readonly VITE_API_BASE?: string
readonly VITE_TURNSTILE_SITE_KEY?: string
}
interface ImportMeta {
readonly env: ImportMetaEnv
}

}
