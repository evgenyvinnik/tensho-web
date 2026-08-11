/**
 * Resolve application URLs against Vite's deployment base.
 *
 * Local development uses `/`, while the GitHub Pages build uses
 * `/tensho-web/`. Keeping this in one place prevents assets and hard reloads
 * from escaping the project site and landing on the account-level domain.
 */
export const APP_BASE_URL = import.meta.env.BASE_URL

export const APP_ROUTER_BASENAME = APP_BASE_URL.replace(/\/$/, '') || '/'

export function withBasePath(path = ''): string {
  return `${APP_BASE_URL}${path.replace(/^\/+/, '')}`
}
