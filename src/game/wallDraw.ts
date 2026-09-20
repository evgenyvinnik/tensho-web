import type { Tile } from '../core/Tile'
import { runRandom } from './RunRandom'

/** The physical draw state, also used by read-only replacement simulations. */
export interface WallDrawState {
  wall: Tile[]
  deadWall: Tile[]
  drawIndex: number
}

type DrawRandom = Pick<typeof runRandom, 'int'>

/** Monsoon samples the remaining physical tiles without replacement. */
export function takeWallTile(
  state: WallDrawState,
  randomized: boolean,
  random: DrawRandom = runRandom
): Tile | null {
  const remaining = state.wall.length - state.drawIndex
  if (remaining <= 0) return null
  const index = state.drawIndex
  if (randomized && remaining > 1) {
    const picked = index + random.int('wall', remaining)
    ;[state.wall[index], state.wall[picked]] = [
      state.wall[picked],
      state.wall[index],
    ]
  }
  state.drawIndex++
  return state.wall[index]
}

/** Bonus replacements follow the same Season rule; replenishment stays tail-first. */
export function takeDeadWallTile(
  state: WallDrawState,
  randomized: boolean,
  random: DrawRandom = runRandom
): Tile | null {
  if (!state.deadWall.length) return null
  const index =
    randomized && state.deadWall.length > 1
      ? random.int('wall', state.deadWall.length)
      : 0
  const [tile] = state.deadWall.splice(index, 1)
  if (state.wall.length > state.drawIndex)
    state.deadWall.push(state.wall.pop()!)
  return tile
}
