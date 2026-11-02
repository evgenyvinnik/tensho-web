import React from 'react'
import { createRoot } from 'react-dom/client'
import { TileImage } from '../../src/components/tiles/TileImage'
import { TileRoundContext } from '../../src/components/tiles/TileRoundContext'
import { Tile, TileSuit, EnhancementType } from '../../src/core/Tile'

const tile = new Tile(TileSuit.Pinzu, 5, 'frame-fixture')
const variants = [
  ['base', tile],
  ...Object.values(EnhancementType)
    .filter((value) => value !== EnhancementType.None)
    .map((value) => [value, tile.withEnhancement(value)] as const),
] as const

/** The roll a Lucky tile shows while a round is being played. */
export const LUCKY_ROUND = {
  act: 2,
  luckyRolls: { 'frame-fixture': { multiplier: 1.75, points: 60 } },
}

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
          <TileRoundContext.Provider value={LUCKY_ROUND}>
            <div data-frame-case="lucky-round">
              <div style={{ fontSize: 10 }}>lucky in a round</div>
              <TileImage
                tile={tile.withEnhancement(EnhancementType.Lucky)}
                size={size}
                showTooltip={false}
              />
            </div>
          </TileRoundContext.Provider>
        </section>
      ))}
      <div data-frame-case="selected">
        <TileImage
          tile={tile.withEnhancement(EnhancementType.Gold)}
          selected
          showIndex
          onClick={() => {}}
        />
      </div>
    </>
  )
}
