import type { CapacitorConfig } from '@capacitor/cli'

// The iOS app wraps the `--mode native` build (see vite.config.ts).
// `bun run build:ios` rebuilds it and copies it into ios/.
const config: CapacitorConfig = {
  appId: 'com.evgenyvinnik.tensho',
  appName: 'Tensho',
  webDir: 'dist-native',
  // Matches the manifest's background so launch never flashes white.
  backgroundColor: '#1a3a2a',
}

export default config
