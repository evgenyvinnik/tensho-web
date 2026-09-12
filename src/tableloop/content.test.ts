import { expect, it } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'
import { MeldType } from '../core/Meld'
import en from '../i18n/locales/en.json'
import { getTableDecree } from './content'
import { classifyGroup } from './groupRules'

it('advertises a legal one-gap example in the Gap Bridge fallback and English catalog', () => {
  const description = getTableDecree('gap_bridge').description
  const example = description.match(/(\d)·(\d)·(\d)/)
  expect(example).not.toBeNull()
  const tiles = example!
    .slice(1)
    .map(
      (rank, index) =>
        new Tile(TileSuit.Souzu, Number(rank), `gap-example-${index}`)
    )
  expect(classifyGroup(tiles, { allowGap: true })).toEqual({
    ok: true,
    type: MeldType.Sequence,
    usedGap: true,
  })
  expect(classifyGroup(tiles).ok).toBe(false)
  expect(description).toBe(en.tableLoop.decrees.gap_bridge.description)
})
