import { describe, expect, it } from 'vitest'
import { EnhancementType } from '../../core/TileModifier'
import { generatedArtPaths } from '../../utils/generatedArt'
import { tileSizes } from '../../styles/theme'
import { FRAME_WINDOW } from '../ui/tile-modifier/frameRegistration'
import {
  enhancedFaceLayout,
  TILE_ART,
  TILE_FACE_CROP,
} from './enhancedFaceLayout'

/** The union of every tile face's glyphs, in art pixels (measured). */
const GLYPHS = { left: 21, top: 21, right: 486, bottom: 619 }
/** Where the raised side begins on the right and below the face. */
const FACE_EDGE = { right: 501, bottom: 637 }

const TILE_HEIGHT = tileSizes.medium.height / tileSizes.medium.width
const pct = (value: unknown) => {
  expect(value).toMatch(/^-?[\d.]+%$/)
  return parseFloat(String(value)) / 100
}
const marks = Object.values(EnhancementType).filter(
  (mark) => mark !== EnhancementType.None
)

describe('enhancedFaceLayout', () => {
  it('has an opening for every Mark frame', () => {
    expect(Object.keys(generatedArtPaths.enhancements).sort()).toEqual(
      [...marks].sort()
    )
    for (const mark of marks) expect(FRAME_WINDOW[mark]).toBeDefined()
    expect(enhancedFaceLayout(EnhancementType.None)).toBeNull()
  })

  it('crops to the face, around every glyph', () => {
    expect(TILE_FACE_CROP.left).toBeLessThan(GLYPHS.left)
    expect(TILE_FACE_CROP.top).toBeLessThan(GLYPHS.top)
    expect(TILE_FACE_CROP.right).toBeGreaterThan(GLYPHS.right)
    expect(TILE_FACE_CROP.bottom).toBeGreaterThan(GLYPHS.bottom)
    expect(TILE_FACE_CROP.right).toBeLessThan(FACE_EDGE.right)
    expect(TILE_FACE_CROP.bottom).toBeLessThan(FACE_EDGE.bottom)
  })

  it.each(marks)('fits and centres the face in the %s frame', (mark) => {
    const layout = enhancedFaceLayout(mark)!
    const opening = FRAME_WINDOW[mark]
    // Tile widths: the box is 1 wide and TILE_HEIGHT tall.
    const panel = {
      left: pct(layout.panel.left),
      top: pct(layout.panel.top) * TILE_HEIGHT,
      width: pct(layout.panel.width),
      height: pct(layout.panel.height) * TILE_HEIGHT,
    }
    const art = {
      left: panel.left + pct(layout.art.left) * panel.width,
      top: panel.top + pct(layout.art.top) * panel.height,
      width: pct(layout.art.width) * panel.width,
      height: pct(layout.art.height) * panel.height,
    }
    const scale = art.width / TILE_ART.width
    expect(art.height / TILE_ART.height).toBeCloseTo(scale, 5)
    const at = (x: number, y: number) => ({
      x: art.left + x * scale,
      y: art.top + y * scale,
    })
    const open = {
      left: opening.left / 100,
      right: 1 - opening.right / 100,
      top: (opening.top / 100) * TILE_HEIGHT,
      bottom: (1 - opening.bottom / 100) * TILE_HEIGHT,
    }

    // Every glyph shows inside the opening, never under the frame.
    const glyphTopLeft = at(GLYPHS.left, GLYPHS.top)
    const glyphBottomRight = at(GLYPHS.right, GLYPHS.bottom)
    expect(glyphTopLeft.x).toBeGreaterThan(open.left)
    expect(glyphTopLeft.y).toBeGreaterThan(open.top)
    expect(glyphBottomRight.x).toBeLessThan(open.right)
    expect(glyphBottomRight.y).toBeLessThan(open.bottom)

    // The crop fills the opening's width and sits at its centre.
    const cropTopLeft = at(TILE_FACE_CROP.left, TILE_FACE_CROP.top)
    const cropBottomRight = at(TILE_FACE_CROP.right, TILE_FACE_CROP.bottom)
    expect(cropTopLeft.x).toBeCloseTo(open.left, 4)
    expect(cropBottomRight.x).toBeCloseTo(open.right, 4)
    expect((cropTopLeft.y + cropBottomRight.y) / 2).toBeCloseTo(
      (open.top + open.bottom) / 2,
      4
    )

    // The panel covers the whole opening, so no table shows at its edge.
    expect(panel.left).toBeLessThan(open.left)
    expect(panel.top).toBeLessThan(open.top)
    expect(panel.left + panel.width).toBeGreaterThan(open.right)
    expect(panel.top + panel.height).toBeGreaterThan(open.bottom)

    // Only the face is drawn: the raised side is clipped away.
    const [top, right, bottom, left] = String(layout.art.clipPath)
      .match(/^inset\((.+) round .+\)$/)![1]
      .split(' ')
      .map(pct)
    expect(left * TILE_ART.width).toBeCloseTo(TILE_FACE_CROP.left, 1)
    expect(top * TILE_ART.height).toBeCloseTo(TILE_FACE_CROP.top, 1)
    expect((1 - right) * TILE_ART.width).toBeCloseTo(TILE_FACE_CROP.right, 1)
    expect((1 - bottom) * TILE_ART.height).toBeCloseTo(TILE_FACE_CROP.bottom, 1)
  })
})
