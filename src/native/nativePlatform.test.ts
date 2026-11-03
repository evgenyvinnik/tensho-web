import { describe, expect, it } from 'vitest'
import { nativePlatform } from './nativePlatform'

describe('nativePlatform', () => {
  it("names the platform from Capacitor's injected bridge", () => {
    expect(nativePlatform({ Capacitor: { getPlatform: () => 'ios' } })).toBe(
      'ios'
    )
    expect(
      nativePlatform({ Capacitor: { getPlatform: () => 'android' } })
    ).toBe('android')
  })

  it('is empty without a bridge', () => {
    expect(nativePlatform({})).toBe('')
    expect(nativePlatform({ Capacitor: {} })).toBe('')
    expect(nativePlatform()).toBe('')
  })
})
