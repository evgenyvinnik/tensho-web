import type { Tile } from '../core/Tile'
import type { SeasonTile } from '../systems/types'
import { SUMMER_WALL_RETAINED_PERCENT } from '../systems/SeasonSystem'

export interface SeasonWallState {
  wall: Tile[]
  drawIndex: number
  summerReserve: Tile[]
  bambooSummerProtection?: boolean
}

/** Apply a newly revealed Season once, in both real draws and their dry runs. */
export function applySeasonWallEffect(
  state: SeasonWallState,
  season: SeasonTile | null
): void {
  if (
    !season ||
    season.type !== 'Summer' ||
    season.isCorrupted ||
    state.bambooSummerProtection
  )
    return
  const remaining = Math.max(0, state.wall.length - state.drawIndex)
  // Multiply before dividing to avoid floating ratio drift for stacked Seasons.
  const retained = Math.floor((remaining * SUMMER_WALL_RETAINED_PERCENT) / 100)
  state.summerReserve.push(...state.wall.splice(state.drawIndex + retained))
}

/** Earned round reward: return the withheld physical tiles, never clone them. */
export function protectSummerWall(state: SeasonWallState): number {
  const restored = state.summerReserve.length
  state.wall.push(...state.summerReserve)
  state.summerReserve = []
  state.bambooSummerProtection = true
  return restored
}
