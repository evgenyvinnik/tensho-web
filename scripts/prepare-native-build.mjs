/** Trim the iOS app's web layer and stamp the Xcode project's version.
 * Run after `vite build --mode native`: node scripts/prepare-native-build.mjs [dist-native]
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { illustrationCopies } from './lib/illustration-delivery.mjs'

const root = resolve(process.argv[2] ?? 'dist-native')
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

// App Store versions are at most three integers, so 1.0.261023-2 ships as
// version 1.0.261023, build 261023.2. Builds then rise with every release.
const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
const parts = /^(\d+)\.(\d+)\.(\d+)(?:-(\d+))?$/.exec(version)
assert.ok(parts, `No App Store version for package version ${version}`)
const [, major, minor, patch, release = '0'] = parts
const project = resolve('ios/App/App.xcodeproj/project.pbxproj')
assert.ok(existsSync(project), 'No iOS project: run `bunx cap add ios` first')
const source = readFileSync(project, 'utf8')
assert.match(source, /MARKETING_VERSION = /)
assert.match(source, /CURRENT_PROJECT_VERSION = /)
const stamped = source
  .replace(
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${major}.${minor}.${patch};`
  )
  .replace(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${patch}.${release};`
  )
if (stamped !== source) writeFileSync(project, stamped)
console.log(`iOS app ${major}.${minor}.${patch} (${patch}.${release})`)
