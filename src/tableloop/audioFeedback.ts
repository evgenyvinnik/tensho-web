import { playSFX, audioSystem } from '../systems/AudioSystem'
import {
  GAME_SOUNDS,
  SPECIAL_SOUNDS,
  TILE_SOUNDS,
  SHOP_SOUNDS,
  FEEDBACK_SOUNDS,
} from '../config/audioDefinitions'
import { flourishLevel } from './flourish'
import type { SavedAction } from './savedRun'
import type { TableLoopState } from './types'

/** Called only for live actions, never forecasts, replay, loading or rerenders. */
export function playTableAction(
  action: SavedAction,
  success: boolean,
  state: Pick<TableLoopState, 'phase' | 'lastResolution'>
) {
  if (!success) {
    playSFX(FEEDBACK_SOUNDS.invalidAction)
    return
  }
  if (action.type === 'place' || action.type === 'revise') {
    const level = flourishLevel(state.lastResolution)
    playSFX(
      level === 'completion'
        ? SPECIAL_SOUNDS.yakumanScored
        : level === 'milestone'
          ? SPECIAL_SOUNDS.yakuScored
          : GAME_SOUNDS.handPlayed
    )
  } else if (action.type === 'buyDecree') playSFX(SHOP_SOUNDS.purchase)
  else if (
    action.type === 'chooseStarter' ||
    action.type === 'takePracticeDecree'
  )
    playSFX(SPECIAL_SOUNDS.decreeAcquired)
  else if (action.type === 'redraw') playSFX(TILE_SOUNDS.discard)
  else if (
    ['claimDraft', 'passDraft', 'recoverFromRiver'].includes(action.type)
  )
    playSFX(TILE_SOUNDS.draw)
  else if (action.type === 'finishRound')
    playSFX(
      state.phase === 'runComplete'
        ? GAME_SOUNDS.victory
        : GAME_SOUNDS.roundComplete
    )
  if (state.phase === 'runFailed') playSFX(GAME_SOUNDS.roundFailed)
  if (action.type === 'openShop') audioSystem.playMusic('shop')
  if (action.type === 'nextRound' || action.type === 'chooseStarter')
    audioSystem.playMusic('gameplay')
  if (state.phase === 'runComplete') audioSystem.playMusic('victory')
  if (state.phase === 'runFailed') audioSystem.playMusic('gameOver')
}
