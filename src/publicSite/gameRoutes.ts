import { ROUTES, SUPPORTED_LANGUAGES } from '../router/routeManifest'

/** Router-relative pathname (deployment basename already removed). */
export function gameRouteRobots(pathname: string): string {
  const path = pathname.replace(/^\//, '').replace(/\/$/, '')
  return !path || SUPPORTED_LANGUAGES.some((lang) => lang === path)
    ? 'index, follow'
    : 'noindex, follow'
}

/**
 * GitHub Pages cannot rewrite known SPA routes to HTTP 200. Emit real entry
 * documents using Vite's final shell, keeping hashed assets and deployment base.
 * This is not SSR or translated editorial content; menu aliases retain the root
 * canonical. State/reference screens are excluded from indexing in raw HTML.
 */
export function gameShellEntries(shell: string): Map<string, string> {
  const robots = /<meta\b[^>]*\bname=["']robots["'][^>]*>/gi
  if (shell.match(robots)?.length !== 1)
    throw new Error('Game shell must contain exactly one robots meta tag')
  const noIndex = shell.replace(
    robots,
    '<meta name="robots" content="noindex, follow">'
  )
  const entries = new Map<string, string>()
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const route of Object.values(ROUTES)) {
      const path = [lang, route].filter(Boolean).join('/')
      entries.set(`${path}/index.html`, route ? noIndex : shell)
    }
  }
  return entries
}
