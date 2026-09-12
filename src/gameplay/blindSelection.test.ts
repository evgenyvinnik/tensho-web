import { describe, expect, it, vi } from 'vitest'
import { chooseBlindSelection } from './blindSelection'

describe('identity-only concealed-rack fallback', () => {
  it('uses visible positions and includes required physical tiles before filling to five', () => {
    expect(
      chooseBlindSelection(['a', 'b', 'c', 'd', 'e', 'f'], ['f'], () => true)
    ).toEqual(['f', 'a', 'b', 'c', 'd'])
  })
  it('respects an exact-size mandate through the authoritative validator', () => {
    const validate = vi.fn((ids: string[]) => ids.length === 3)
    expect(
      chooseBlindSelection(['a', 'b', 'c', 'd', 'e'], [], validate)
    ).toEqual(['a', 'b', 'c'])
    expect(validate.mock.calls.map(([ids]) => ids.length)).toEqual([5, 4, 3])
  })
  it('does not invent tiles or silently omit forced tiles', () => {
    expect(chooseBlindSelection(['a'], [], () => true)).toBeNull()
    expect(chooseBlindSelection(['a', 'b'], ['missing'], () => true)).toBeNull()
    expect(
      chooseBlindSelection(
        ['a', 'b', 'c', 'd', 'e', 'f'],
        ['a', 'b', 'c', 'd', 'e', 'f'],
        () => true
      )
    ).toBeNull()
  })
  it('returns no play when every permitted size is illegal and never repeats an identity', () => {
    expect(chooseBlindSelection(['a', 'b', 'c'], [], () => false)).toBeNull()
    expect(
      chooseBlindSelection(['a', 'a', 'b'], ['a', 'a'], () => true)
    ).toEqual(['a', 'b'])
  })
})
