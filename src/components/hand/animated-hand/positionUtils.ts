/**
 * Hand Position Utilities
 *
 * Functions for calculating tile positions in different layouts.
 */

/**
 * Position data for a tile in the hand layout
 */
export interface TilePosition {
  x: number
  rotation: number
  zIndex: number
}

/**
 * Calculate tile positions for fanned layout
 */
export function calculateFannedPositions(
  count: number,
  tileWidth: number,
  maxAngle: number,
  overlap: boolean
): TilePosition[] {
  if (count === 0) return []

  const positions: TilePosition[] = []
  const midIndex = (count - 1) / 2
  const angleStep = maxAngle / Math.max(count - 1, 1)
  const overlapFactor = overlap ? 0.7 : 1
  const baseSpacing = tileWidth * overlapFactor

  for (let i = 0; i < count; i++) {
    const offset = i - midIndex
    positions.push({
      x: offset * baseSpacing,
      rotation: offset * angleStep,
      zIndex: count - Math.abs(offset), // Center tiles on top when fanned
    })
  }

  return positions
}

/**
 * Calculate tile positions for straight layout
 */
export function calculateStraightPositions(
  count: number,
  tileWidth: number,
  overlap: boolean
): TilePosition[] {
  if (count === 0) return []

  const positions: TilePosition[] = []
  const overlapFactor = overlap ? 0.7 : 1
  const baseSpacing = tileWidth * overlapFactor
  const totalWidth = (count - 1) * baseSpacing
  const startX = -totalWidth / 2

  for (let i = 0; i < count; i++) {
    positions.push({
      x: startX + i * baseSpacing,
      rotation: 0,
      zIndex: i,
    })
  }

  return positions
}
