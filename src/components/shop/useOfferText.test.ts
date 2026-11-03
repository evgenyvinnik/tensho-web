import { renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { BlessingPack } from '../../systems/types'
import { useOfferText } from './useOfferText'

function packText(choiceCount: number) {
  const pack: BlessingPack = {
    id: 'pack_test',
    type: 'Arcana',
    size: 'Normal',
    cost: 4,
    choiceCount,
    selectCount: 1,
  }
  return renderHook(() =>
    useOfferText({ itemType: 'BlessingPack', item: pack })
  ).result.current
}

it('keeps the catalog text for a pack with its usual counts', () => {
  expect(packText(3)).toMatchObject({
    kind: 'Blessing Pack · choose 1 of 3',
    description: 'Choose 1 from 3 Fate Seals',
  })
})

it('states the real counts when Crystal Lens adds an offer', () => {
  const text = packText(4)
  expect(text.kind).toBe('Blessing Pack · choose 1 of 4')
  expect(text.description).toBe(
    'Choose up to 1 of 4 rewards: this pack offers more than usual.'
  )
})
