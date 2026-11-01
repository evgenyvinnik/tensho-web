import React from 'react'
import { createRoot } from 'react-dom/client'
import { TileImage } from '../../src/components/tiles/TileImage'
import {
  Tile,
  TileSuit,
  EditionType,
  EnhancementType,
  SealType,
} from '../../src/core/Tile'

const tile = new Tile(TileSuit.Pinzu, 5, 'frame-fixture')
const variants = [
  ['base', tile],
  ...Object.values(EditionType)
    .filter((value) => value !== EditionType.Base)
    .map((value) => [value, tile.withEdition(value)] as const),
  ...Object.values(EnhancementType)
    .filter((value) => value !== EnhancementType.None)
    .map((value) => [value, tile.withEnhancement(value)] as const),
  ['seal', tile.withSeal(SealType.Red)],
] as const

export const mountTileFrames = () => {
  const host = document.createElement('div')
  host.id = 'tile-frame-fixture'
  host.style.cssText =
    'position:fixed;inset:0;z-index:9999;background:#1c3a2e;overflow:auto;padding:20px;color:white'
  document.body.append(host)
  createRoot(host).render(
    <>
      {(['small', 'medium', 'xlarge'] as const).map((size) => (
        <section
          key={size}
          data-frame-size={size}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            marginBottom: 24,
          }}
        >
          {variants.map(([name, value]) => (
            <div key={name} data-frame-case={name}>
              <div style={{ fontSize: 10 }}>{name}</div>
              <TileImage tile={value} size={size} showTooltip={false} />
            </div>
          ))}
        </section>
      ))}
      <div data-frame-case="selected">
        <TileImage
          tile={tile.withEdition(EditionType.Holographic)}
          selected
          showIndex
          onClick={() => {}}
        />
      </div>
    </>
  )
}
