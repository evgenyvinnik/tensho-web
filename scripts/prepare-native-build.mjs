/** Trim the app's web layer and stamp the native project's version.
 * Run after `vite build --mode native`:
 *   node scripts/prepare-native-build.mjs <ios|android> [dist-native]
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { illustrationCopies } from './lib/illustration-delivery.mjs'
import { nativeVersions } from './lib/native-versions.mjs'

const platform = process.argv[2]
assert.ok(
  platform === 'ios' || platform === 'android',
  'Usage: prepare-native-build.mjs <ios|android> [dist-native]'
)
const root = resolve(process.argv[3] ?? 'dist-native')
assert.ok(existsSync(resolve(root, 'index.html')), `No native build in ${root}`)
assert.ok(!existsSync(resolve(root, 'sw.js')), 'Native build ships a service worker')

// The website keeps the original PNGs for clients cached before the WebP
// copies existed. A fresh app install has no such client.
for (const { source, copies } of illustrationCopies) {
  for (const { path } of copies)
    assert.ok(existsSync(resolve(root, path)), `Delivery copy missing: ${path}`)
  rmSync(resolve(root, source), { force: true })
}
// Website-only: the service worker hook, crawler and link-preview files.
for (const file of [
  'sw-update.js',
  'robots.txt',
  'browserconfig.xml',
  'og-image.png',
  'og-image.svg',
  'screenshot-narrow.png',
  'screenshot-narrow.svg',
  'screenshot-wide.png',
  'screenshot-wide.svg',
])
  rmSync(resolve(root, file), { force: true })

const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
const { ios, android } = nativeVersions(version)

/** Rewrite each pattern's match in a native project file; every one must hit. */
function stamp(file, setup, replacements) {
  const project = resolve(file)
  assert.ok(existsSync(project), `No ${platform} project: run \`${setup}\` first`)
  const source = readFileSync(project, 'utf8')
  let stamped = source
  for (const [pattern, value] of replacements) {
    assert.match(source, pattern, `${file} has no ${pattern}`)
    stamped = stamped.replace(pattern, value)
  }
  if (stamped !== source) writeFileSync(project, stamped)
}

if (platform === 'ios') {
  stamp('ios/App/App.xcodeproj/project.pbxproj', 'bunx cap add ios', [
    [/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${ios.marketing};`],
    [/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${ios.build};`],
  ])
  console.log(`iOS app ${ios.marketing} (${ios.build})`)
} else {
  stamp('android/app/build.gradle', 'bunx cap add android', [
    [/versionCode \d+/, `versionCode ${android.code}`],
    [/versionName "[^"]*"/, `versionName "${android.name}"`],
  ])
  console.log(`Android app ${android.name} (${android.code})`)
}
