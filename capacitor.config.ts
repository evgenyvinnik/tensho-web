import type { CapacitorConfig } from '@capacitor/cli'

// The iOS and Android apps wrap the `--mode native` build (see vite.config.ts).
// `bun run build:ios` / `bun run build:android` rebuild it and copy it into
// ios/ or android/.
const config: CapacitorConfig = {
  appId: 'com.evgenyvinnik.tensho',
  appName: 'Tensho',
  webDir: 'dist-native',
  // Matches the manifest's background so launch never flashes white.
  backgroundColor: '#1a3a2a',
  plugins: {
    SystemBars: {
      // The table is always dark, so the status bar keeps light text even
      // when the phone is in light mode.
      style: 'DARK',
      // index.html asks for viewport-fit=cover; saying so up front lets
      // Android draw under the bars from the first frame without a jump.
      initialViewportFitValueHint: 'cover',
    },
  },
}

export default config
