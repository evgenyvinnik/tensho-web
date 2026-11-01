/**
 * Resolve application URLs against Vite's deployment base.
 *
 * Local development and the tensho.app build use `/`; VITE_BASE_PATH serves a
 * build from a sub-path instead. Keeping this in one place prevents assets and
 * hard reloads from escaping that sub-path.
 */
export const APP_BASE_URL = import.meta.env.BASE_URL

export const APP_ROUTER_BASENAME = APP_BASE_URL.replace(/\/$/, '') || '/'

export function withBasePath(path = ''): string {
  return `${APP_BASE_URL}${path.replace(/^\/+/, '')}`
}
