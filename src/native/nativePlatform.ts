/**
 * The app's platform, `ios` or `android`, or '' when unknown. Read from the
 * bridge that Capacitor injects before any script runs, so it is known before
 * the first frame without bundling `@capacitor/core` into the website.
 */
export function nativePlatform(win: object = window): string {
  const { Capacitor } = win as { Capacitor?: { getPlatform?: () => string } }
  return Capacitor?.getPlatform?.() ?? ''
}
