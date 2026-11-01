/**
 * Where a tile's face sits inside a Mark (enhancement) frame.
 *
 * The tile art is a raised tile: a white face with its side drawn below and
 * to the right. Shrunk whole into a frame, that side shows inside the opening
 * and pulls the face up and left, and the pips come out small. Instead, only
 * the face is shown: one crop, shared by every tile so pips keep one scale,
 * fitted to the frame's own opening and centred in it, on a face-coloured
 * panel that runs a little under the frame so no table shows at its edge.
 * A Stone tile, which has no face, fills the same panel with stone.
 */

import type { CSSProperties } from 'react'
import { tileSizes } from '../../styles/theme'
import { FRAME_WINDOW } from '../ui/tile-modifier/frameRegistration'

/** Tile box height over width (5:7 at every named size). */
const TILE_HEIGHT = tileSizes.medium.height / tileSizes.medium.width

/** The tile face art's pixel size (`Dots (2).png` and its siblings). */
export const TILE_ART = { width: 568, height: 711 } as const

/**
 * The white face of the tile art, in art pixels, without its rounded corners'
 * edge or the raised side. Every tile's glyphs lie inside it (their union is
 * 21–486 across, 21–619 down), and it is centred on them.
 */
export const TILE_FACE_CROP = {
  left: 8,
  top: 8,
  right: 496,
  bottom: 628,
} as const

/**
 * How far the face panel runs under the frame, in tile widths. The frame's
 * inner edge is soft for about a pixel; the panel, not the table, shows there.
 */
const PANEL_BLEED = 0.025

/** The face's own colour, top to bottom, behind any space around the crop. */
export const TILE_FACE_BACKGROUND =
  'linear-gradient(to bottom, #fffdfa, #fff8f1 70%, #f5ebdf)'

export interface EnhancedFaceLayout {
  /** The frame's opening plus a little bleed, positioned in the tile box. */
  panel: CSSProperties
  /** The tile art, positioned in the panel and clipped to its face. */
  art: CSSProperties
}

const percent = (value: number) => `${(value * 100).toFixed(3)}%`

/**
 * Lay out the face inside the frame of `enhancement`, or null when that Mark
 * has no frame opening (no Mark, or one without generated art).
 */
export function enhancedFaceLayout(
  enhancement: string
): EnhancedFaceLayout | null {
  const opening = FRAME_WINDOW[enhancement]
  if (!opening) return null

  // Work in tile widths: the box is 1 wide and TILE_HEIGHT tall.
  const x0 = opening.left / 100
  const x1 = 1 - opening.right / 100
  const y0 = (opening.top / 100) * TILE_HEIGHT
  const y1 = (1 - opening.bottom / 100) * TILE_HEIGHT

  const crop = TILE_FACE_CROP
  const cropWidth = crop.right - crop.left
  const cropHeight = crop.bottom - crop.top
  // Tile widths per art pixel: the whole crop fits the opening.
  const scale = Math.min((x1 - x0) / cropWidth, (y1 - y0) / cropHeight)
  const artWidth = TILE_ART.width * scale
  const artHeight = TILE_ART.height * scale
  const artLeft = (x0 + x1) / 2 - ((crop.left + crop.right) / 2) * scale
  const artTop = (y0 + y1) / 2 - ((crop.top + crop.bottom) / 2) * scale

  const panelLeft = x0 - PANEL_BLEED
  const panelTop = y0 - PANEL_BLEED
  const panelWidth = x1 - x0 + 2 * PANEL_BLEED
  const panelHeight = y1 - y0 + 2 * PANEL_BLEED

  const insetTop = crop.top / TILE_ART.height
  const insetRight = 1 - crop.right / TILE_ART.width
  const insetBottom = 1 - crop.bottom / TILE_ART.height
  const insetLeft = crop.left / TILE_ART.width

  return {
    panel: {
      left: percent(panelLeft),
      top: percent(panelTop / TILE_HEIGHT),
      width: percent(panelWidth),
      height: percent(panelHeight / TILE_HEIGHT),
    },
    art: {
      left: percent((artLeft - panelLeft) / panelWidth),
      top: percent((artTop - panelTop) / panelHeight),
      width: percent(artWidth / panelWidth),
      height: percent(artHeight / panelHeight),
      clipPath: `inset(${percent(insetTop)} ${percent(insetRight)} ${percent(insetBottom)} ${percent(insetLeft)} round 6%)`,
    },
  }
}
