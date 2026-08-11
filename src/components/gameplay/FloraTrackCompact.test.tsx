import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TileSuit } from '../../core/Tile'
import { getTileImagePath } from '../../utils/assets'
import { FloraTrackCompact } from './FloraTrackCompact'

describe('FloraTrackCompact artwork', () => {
  it('uses the native Mahjong season tile instead of duplicate illustration art', () => {
    const { container } = render(
      <FloraTrackCompact flowers={[]} activeSeason="Spring" />
    )

    const expectedSource = getTileImagePath(TileSuit.Season, 1)
    const seasonTile = Array.from(container.querySelectorAll('img')).find(
      (image) => image.getAttribute('src') === expectedSource
    )

    expect(seasonTile).toBeDefined()
    expect(container.querySelector('img[src*="season-spring.png"]')).toBeNull()
  })
})
