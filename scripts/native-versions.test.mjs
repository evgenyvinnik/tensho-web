import assert from 'node:assert/strict'
import { test } from 'node:test'
import { nativeVersions } from './lib/native-versions.mjs'

test('iOS keeps three integers and moves the release into the build', () => {
  assert.deepEqual(nativeVersions('1.0.261102-6').ios, {
    marketing: '1.0.261102',
    build: '261102.6',
  })
  assert.deepEqual(nativeVersions('1.0.261102').ios, {
    marketing: '1.0.261102',
    build: '261102.0',
  })
})

test('Android names the full version and codes it as an integer', () => {
  assert.deepEqual(nativeVersions('1.0.261102-6').android, {
    name: '1.0.261102-6',
    code: 26110206,
  })
})

test('Android codes rise across releases and days', () => {
  const codes = ['1.0.261102-6', '1.0.261102-12', '1.0.261103', '1.0.261103-1'].map(
    (version) => nativeVersions(version).android.code
  )
  assert.deepEqual(
    codes,
    [...codes].sort((a, b) => a - b)
  )
  assert.equal(new Set(codes).size, codes.length)
  // Play's ceiling, even at the last day of 2099.
  assert.ok(nativeVersions('1.0.991231-99').android.code <= 2_100_000_000)
})

test('rejects versions the stores cannot order', () => {
  assert.throws(() => nativeVersions('1.0'), /No store version/)
  assert.throws(() => nativeVersions('1.0.261102-beta'), /No store version/)
  assert.throws(() => nativeVersions('1.0.261102-100'), /overflows/)
})
