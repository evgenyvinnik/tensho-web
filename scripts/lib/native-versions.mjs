import assert from 'node:assert/strict'

/**
 * The store versions of a package version such as 1.0.261023-2.
 *
 * App Store versions are at most three integers, so iOS ships version
 * 1.0.261023, build 261023.2. Google Play shows any version name but orders
 * releases by an integer code, so Android ships 1.0.261023-2 as code
 * 26102302. Both rise with every release, as long as a day has fewer than
 * 100 of them.
 */
export function nativeVersions(version) {
  const parts = /^(\d+)\.(\d+)\.(\d+)(?:-(\d+))?$/.exec(version)
  assert.ok(parts, `No store version for package version ${version}`)
  const [, major, minor, patch, release = '0'] = parts
  assert.ok(Number(release) < 100, `Release ${release} overflows the Android version code`)
  return {
    ios: { marketing: `${major}.${minor}.${patch}`, build: `${patch}.${release}` },
    android: { name: version, code: Number(patch) * 100 + Number(release) },
  }
}
