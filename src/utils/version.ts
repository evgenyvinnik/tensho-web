/** Build version injected by Vite from package.json or VITE_APP_VERSION. */
export const APP_VERSION =
  typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'development'

export const FORMATTED_APP_VERSION = `v${APP_VERSION}`
