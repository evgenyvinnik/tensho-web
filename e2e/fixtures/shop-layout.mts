// Controlled saved-run fixture, usable against native, production and hosted UI.
// Only the target, balance and first offer are arranged. Settlement, purchase,
// reroll, sale, persistence and exit use the real engine/browser paths.
import { GameOrchestrator } from '../../src/game/GameOrchestrator'
import { ALL_DECREES } from '../../src/systems/DecreeSystem'
import { parseClassicSavedRun } from '../../src/game/classicSavedRun'

const game = new GameOrchestrator()
game.startNewRun(7)
const state = game.getState()
state.targetScore = 1
state.roundManager.getCurrentRound().scoreTarget = 1
const play = game.processAction({
  type: 'play',
  tileIds: state.handTiles.slice(0, 2).map((tile) => tile.id),
})
if (!play.success || !game.shop.open()) throw new Error('Shop fixture failed')
state.gold = 50
const offer = game.shop.state.itemOfferings[0]
const item = ALL_DECREES.find((decree) => decree.id === 'decree-jade-tablet')!
Object.assign(offer, {
  itemType: 'Decree',
  item,
  finalCost: 4,
  baseCost: 4,
  editionCost: 0,
  edition: undefined,
  isPurchased: false,
  isLocked: false,
})
const raw = JSON.stringify({
  format: 1,
  runId: 'shop-layout-run',
  owner: 'shop-layout-fixture',
  revision: 1,
  createdAt: 1791731727055,
  updatedAt: 1791731727055,
  snapshot: game.captureRun(),
})
parseClassicSavedRun(raw)
console.log(raw)
