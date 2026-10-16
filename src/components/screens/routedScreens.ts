/**
 * Every routed screen, loaded lazily as one chunk.
 *
 * Opening a screen must not make the browser stream a burst of module chunks.
 * Chromium compiles each streamed script on its own thread-pool task. On
 * Linux, a burst that fills the pool (three tasks on a 4-core machine) can
 * freeze the page for good: the compile tasks wait for a garbage collection
 * on the main thread, while the main thread waits on a synchronous font
 * lookup that is answered through the same, now full, pool. Opening /play as
 * GameplayScreen plus ten shared chunks did exactly that on CI. One chunk is
 * one task.
 *
 * Load screens lazily only through this module. A dynamic import of a
 * screen's own file would split it, and the code it shares, into chunks of
 * their own again (`bun run build` fails if that happens).
 */
export { MenuScreen } from './MenuScreen'
export { GameplayScreen } from './GameplayScreen'
export { ShopScreen } from './ShopScreen'
export { GameOverScreen } from './GameOverScreen'
export { AchievementsScreen } from './AchievementsScreen'
export { CodexScreen } from './CodexScreen'
export { CollectionScreen } from './CollectionScreen'
export { SettingsScreen } from './SettingsScreen'
