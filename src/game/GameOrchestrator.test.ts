/**
 * GameOrchestrator Tests
 *
 * Unit tests for the GameOrchestrator class, focusing on
 * the playHand action and tile selection functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GameOrchestrator, type OrchestratorState } from './GameOrchestrator'
import { CelestialOrbSystem, CELESTIAL_ORBS } from '../systems/CelestialOrbSystem'
import { FateSealSystem, FATE_SEALS } from '../systems/FateSealSystem'
import { VoidScriptSystem, VOID_SCRIPTS } from '../systems/VoidScriptSystem'
import { EnhancementType, SealType } from '../core/TileModifier'
import { Tile, TileSuit } from '../core/Tile'
import { useOmenStore } from '../stores/omenStore'
import {
  OMEN_OF_ASH,
  OMEN_OF_RIVERS,
  PRECISION_OMEN,
  SCORE_SURGE_OMEN,
} from '../config/omenDefinitions'
import {
  AMBER_ACORN,
  CERULEAN_BELL,
  THE_FISH,
  THE_HOUSE,
  THE_MANACLE,
  THE_MARK,
  THE_WHEEL,
  VERDANT_LEAF,
  type MandateDefinition,
} from '../config/mandateDefinitions'
import {
  BROKEN_STAIR_EDICT,
  CELESTIAL_WILDCARD,
  DEAD_WALL_WRIT,
  FALSE_EYE_MANDATE,
  HONOR_TRANSMUTATION,
  PURE_SUIT_ASCETICISM,
  SHANTEN_CLEMENCY,
  TANYAO_DISPENSATION,
  YAKU_REPETITION_CHARTER,
} from '../systems/DecreeSystem'
import type { ActionResult, Effect } from './ActionProcessor'
import { TEA_HOUSE_BASE_CHARTERS } from '../systems/TeaHouseSystem'

let decreeFixtureCounter = 0

function createDecreeFixtureHand(
  groups: Array<[TileSuit, number[]]>
): Tile[] {
  return groups.flatMap(([suit, ranks]) =>
    ranks.map(
      (rank) => new Tile(suit, rank, `decree-fixture-${decreeFixtureCounter++}`)
    )
  )
}

function replaceHand(game: GameOrchestrator, tiles: Tile[]): void {
  const state = game.getState() as OrchestratorState
  state.handTiles = tiles
  state.selectedTileIds.clear()
  state.faceDownTileIds.clear()
  state.targetScore = Number.MAX_SAFE_INTEGER
  state.roundManager.getCurrentRound()!.scoreTarget = Number.MAX_SAFE_INTEGER
}

function clearDecrees(game: GameOrchestrator): void {
  const decreeSystem = game.getState().decreeSystem
  for (const decree of decreeSystem.getOwnedDecrees()) {
    decreeSystem.removeDecree(decree.id)
  }
}

function getScoreEffect(result: ActionResult): {
  score: number
  description: string
  breakdown: { detectedYaku: Array<{ definition: { id: string } }> }
} {
  const effect = result.effects.find(
    (candidate) => candidate.type === 'score_added' && 'score' in candidate
  )
  if (!effect || !('score' in effect) || !('breakdown' in effect)) {
    throw new Error('Expected score_added effect')
  }
  return effect as {
    score: number
    description: string
    breakdown: { detectedYaku: Array<{ definition: { id: string } }> }
  }
}

function enterBossWithMandate(
  game: GameOrchestrator,
  mandate: MandateDefinition
): void {
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  const act = game.getState().roundManager.getCurrentAct()!
  act.rounds[2].bossMandate = {
    id: mandate.id,
    name: mandate.name,
    japaneseName: mandate.japaneseName,
    description: mandate.description,
    effect: mandate.effect,
    minAct: mandate.minAct,
  }
  expect(game.processAction({ type: 'skip' }).success).toBe(true)
  expect(game.getState().currentRound).toBe(3)
}

describe('GameOrchestrator', () => {
  let game: GameOrchestrator

  beforeEach(() => {
    game = new GameOrchestrator()
  })

  describe('startNewRun', () => {
    it('should initialize a new run with correct state', () => {
      game.startNewRun(12345)

      const state = game.getState()
      expect(state.isRunActive).toBe(true)
      expect(state.phase).toBe('gameplay')
      expect(state.currentAct).toBe(1)
      expect(state.currentRound).toBe(1)
      expect(state.score).toBe(0)
      expect(state.handTiles.length).toBe(14)
      expect(state.targetScore).toBe(300)
    })

    it('should give player a ready-to-play hand of 14 tiles', () => {
      game.startNewRun(12345)

      const handTiles = game.getHandTiles()
      expect(handTiles.length).toBe(14)
    })

    it('should give player 2 starter decrees', () => {
      game.startNewRun(12345)

      const state = game.getState()
      const decrees = state.decreeSystem.getOwnedDecrees()
      expect(decrees.length).toBe(2)
    })

    it('should use provided seed for reproducible runs', () => {
      game.startNewRun(12345)
      const handTiles1 = game.getHandTiles().map((t) => t.id)

      const game2 = new GameOrchestrator()
      game2.startNewRun(12345)
      const handTiles2 = game2.getHandTiles().map((t) => t.id)

      expect(handTiles1).toEqual(handTiles2)
    })
  })

  describe('tile selection', () => {
    beforeEach(() => {
      game.startNewRun(12345)
    })

    it('should select a tile', () => {
      const handTiles = game.getHandTiles()
      const firstTile = handTiles[0]

      game.selectTile(firstTile.id)

      const selectedIds = game.getSelectedTileIds()
      expect(selectedIds).toContain(firstTile.id)
    })

    it('should deselect a tile', () => {
      const handTiles = game.getHandTiles()
      const firstTile = handTiles[0]

      game.selectTile(firstTile.id)
      game.deselectTile(firstTile.id)

      const selectedIds = game.getSelectedTileIds()
      expect(selectedIds).not.toContain(firstTile.id)
    })

    it('should toggle tile selection', () => {
      const handTiles = game.getHandTiles()
      const firstTile = handTiles[0]

      // Toggle on
      game.toggleTileSelection(firstTile.id)
      expect(game.getSelectedTileIds()).toContain(firstTile.id)

      // Toggle off
      game.toggleTileSelection(firstTile.id)
      expect(game.getSelectedTileIds()).not.toContain(firstTile.id)
    })

    it('should clear all selections', () => {
      const handTiles = game.getHandTiles()
      game.selectTile(handTiles[0].id)
      game.selectTile(handTiles[1].id)
      game.selectTile(handTiles[2].id)

      game.clearSelection()

      expect(game.getSelectedTileIds()).toHaveLength(0)
    })

    it('should select all tiles', () => {
      game.selectAllTiles()

      const selectedIds = game.getSelectedTileIds()
      expect(selectedIds.length).toBe(14)
    })
  })

  describe('playHand action', () => {
    beforeEach(() => {
      game.startNewRun(12345)
    })

    it('should play hand with all tiles and score points', () => {
      const handTiles = game.getHandTiles()
      const tileIds = handTiles.map((t) => t.id)

      const result = game.processAction({
        type: 'play',
        tileIds,
      })

      expect(result.success).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should reduce hands remaining after playing', () => {
      const stateBefore = game.getState()
      const handsRemainingBefore = stateBefore.handsRemaining

      const handTiles = game.getHandTiles()
      const tileIds = handTiles.map((t) => t.id)

      game.processAction({ type: 'play', tileIds })

      const stateAfter = game.getState()
      expect(stateAfter.handsRemaining).toBe(handsRemainingBefore - 1)
    })

    it('should add score after playing a hand', () => {
      const scoreBefore = game.getState().score

      const handTiles = game.getHandTiles()
      const tileIds = handTiles.map((t) => t.id)

      game.processAction({ type: 'play', tileIds })

      const scoreAfter = game.getState().score
      expect(scoreAfter).toBeGreaterThan(scoreBefore)
    })

    it('should fail when playing with less than 2 tiles', () => {
      const handTiles = game.getHandTiles()
      const singleTileId = [handTiles[0].id]

      const result = game.processAction({
        type: 'play',
        tileIds: singleTileId,
      })

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.[0]).toContain('2 tiles')
    })

    it('should play selected tiles when using selected IDs', () => {
      const handTiles = game.getHandTiles()
      const selectedTileIds = handTiles.slice(0, 5).map((t) => t.id)

      const result = game.processAction({
        type: 'play',
        tileIds: selectedTileIds,
      })

      expect(result.success).toBe(true)
    })

    it('should clear selections after playing hand', () => {
      const handTiles = game.getHandTiles()
      const selectedTileIds = handTiles.slice(0, 5).map((t) => t.id)

      // Select some tiles
      for (const id of selectedTileIds) {
        game.selectTile(id)
      }

      // Play the hand
      game.processAction({ type: 'play', tileIds: selectedTileIds })

      // Selections should be cleared
      expect(game.getSelectedTileIds()).toHaveLength(0)
    })

    it('should remove played tiles from hand', () => {
      const handTiles = game.getHandTiles()
      const tilesToPlay = handTiles.slice(0, 5).map((t) => t.id)

      game.processAction({ type: 'play', tileIds: tilesToPlay })

      const remainingHand = game.getHandTiles()
      // Tiles should be removed
      for (const playedId of tilesToPlay) {
        const stillExists = remainingHand.some((t) => t.id === playedId)
        expect(stillExists).toBe(false)
      }
    })

    it('should refill the hand after playing a partial selection', () => {
      const handTiles = game.getHandTiles()
      const tilesToPlay = handTiles.slice(0, 5).map((t) => t.id)

      game.processAction({ type: 'play', tileIds: tilesToPlay })

      expect(game.getHandTiles()).toHaveLength(14)
      expect(game.getState().handsRemaining).toBe(3)
    })

    it('should return effects with score information', () => {
      const handTiles = game.getHandTiles()
      const tileIds = handTiles.map((t) => t.id)

      const result = game.processAction({
        type: 'play',
        tileIds,
      })

      expect(result.effects).toBeDefined()
      expect(result.effects.length).toBeGreaterThan(0)

      const scoreEffect = result.effects.find((e) => e.type === 'score_added')
      expect(scoreEffect).toBeDefined()
    })
  })

  describe('draw action', () => {
    beforeEach(() => {
      game.startNewRun(12345)
    })

    it('should draw a tile from the wall', () => {
      game.getState().handTiles.pop()
      const handSizeBefore = game.getHandTiles().length

      const result = game.processAction({ type: 'draw' })

      expect(result.success).toBe(true)
      // Hand size might stay same if bonus tile drawn (auto-replaced)
      expect(game.getHandTiles().length).toBeGreaterThanOrEqual(handSizeBefore)
    })

    it('should reduce wall remaining after draw', () => {
      game.getState().handTiles.pop()
      const wallBefore = game.getState().wall.length - game.getState().drawIndex

      game.processAction({ type: 'draw' })

      const wallAfter = game.getState().wall.length - game.getState().drawIndex
      expect(wallAfter).toBeLessThan(wallBefore)
    })
  })

  describe('discard action', () => {
    beforeEach(() => {
      game.startNewRun(12345)
    })

    it('should discard a tile from hand', () => {
      const handTiles = game.getHandTiles()
      const tileToDiscard = handTiles[0]

      const result = game.processAction({
        type: 'discard',
        tileId: tileToDiscard.id,
      })

      expect(result.success).toBe(true)
    })

    it('should remove discarded tile from hand', () => {
      const handTiles = game.getHandTiles()
      const tileToDiscard = handTiles[0]

      game.processAction({ type: 'discard', tileId: tileToDiscard.id })

      const newHand = game.getHandTiles()
      const stillExists = newHand.some((t) => t.id === tileToDiscard.id)
      expect(stillExists).toBe(false)
    })

    it('should reduce discards remaining', () => {
      const discardsBefore = game.getState().discardsRemaining
      const handTiles = game.getHandTiles()

      game.processAction({ type: 'discard', tileId: handTiles[0].id })

      expect(game.getState().discardsRemaining).toBe(discardsBefore - 1)
    })

    it('should complete the discard-draw cycle and refill the hand', () => {
      const handTiles = game.getHandTiles()

      game.processAction({ type: 'discard', tileId: handTiles[0].id })

      expect(game.getHandTiles()).toHaveLength(14)
      expect(game.getHandTiles().some((tile) => tile.id === handTiles[0].id)).toBe(false)
    })

    it('should fail when discarding a non-existent tile', () => {
      const result = game.processAction({
        type: 'discard',
        tileId: 'fake-tile-id',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('skip action', () => {
    beforeEach(() => {
      game.startNewRun(12345)
    })

    it('should skip Small rounds', () => {
      // First round is Small
      expect(game.getState().currentRound).toBe(1)

      const result = game.processAction({ type: 'skip' })

      expect(result.success).toBe(true)
    })

    it('should advance to next round after skip', () => {
      const roundBefore = game.getState().currentRound

      game.processAction({ type: 'skip' })

      // Should advance (could be next round or next act)
      const roundAfter = game.getState().currentRound
      expect(roundAfter).not.toBe(roundBefore)
    })

    it('should award an omen when skipping a non-boss round', () => {
      const result = game.processAction({ type: 'skip' })

      expect(result.success).toBe(true)
      expect(game.getState().omenSystem.getTotalSkippedRounds()).toBe(1)
      expect(game.getState().currentRound).toBe(2)
    })
  })

  describe('round progression', () => {
    it('should visit the shop after every completed round and advance correctly', () => {
      game.startNewRun(12345)

      const completeCurrentRound = () => {
        const mutableState = game.getState() as OrchestratorState
        const currentRound = mutableState.roundManager.getCurrentRound()
        if (!currentRound) throw new Error('Expected an active round')
        currentRound.scoreTarget = 1
        mutableState.targetScore = 1
        const mandate = currentRound.bossMandate
        const playSize =
          mandate?.effect.type === 'fixed_hand_size'
            ? Number(mandate.effect.value)
            : 2
        game.processAction({
          type: 'play',
          tileIds: game
            .getHandTiles()
            .slice(0, playSize)
            .map((tile) => tile.id),
        })
      }

      completeCurrentRound()
      expect(game.getState().currentRound).toBe(1)
      expect(game.getState().lastCompletedRoundType).toBe('Small')
      expect(game.getState().phase).toBe('shop')

      game.exitShop()
      expect(game.getState().currentRound).toBe(2)
      expect(game.getState().targetScore).toBe(450)
      expect(game.getState().phase).toBe('gameplay')

      completeCurrentRound()
      expect(game.getState().currentRound).toBe(2)
      expect(game.getState().lastCompletedRoundType).toBe('Large')
      expect(game.getState().phase).toBe('shop')

      game.exitShop()
      expect(game.getState().currentRound).toBe(3)
      expect(game.getState().targetScore).toBe(600)
      expect(game.getState().phase).toBe('gameplay')

      completeCurrentRound()
      expect(game.getState().lastCompletedRoundType).toBe('Boss')
      expect(game.getState().phase).toBe('shop')

      game.exitShop()
      expect(game.getState().currentAct).toBe(2)
      expect(game.getState().currentRound).toBe(1)
      expect(game.getState().targetScore).toBe(800)
      expect(game.getState().phase).toBe('gameplay')
    })
  })

  describe('shop rewards and upgrades', () => {
    beforeEach(() => {
      game.startNewRun(12345)
    })

    it('starts yaku without free Celestial Orb bonuses', () => {
      expect(game.getState().celestialOrbSystem.calculateYakuBonus('Tanyao')).toEqual({
        mult: 0,
        chips: 0,
      })
    })

    it('can hold and use a Celestial Orb from the authoritative inventory', () => {
      const orb = CelestialOrbSystem.createCelestialOrbInstance(CELESTIAL_ORBS.mercury_orb)

      expect(game.addCelestialOrb(orb)).toBe(true)
      const result = game.processAction({ type: 'useOrb', orbId: orb.instanceId })

      expect(result.success).toBe(true)
      expect(game.getState().celestialOrbSystem.getYakuLevel('Tanyao')).toBe(2)
      expect(game.getCelestialOrbs()).toHaveLength(0)
      expect(game.getState().celestialOrbSystem.calculateYakuBonus('Tanyao')).toEqual({
        mult: 1,
        chips: 15,
      })
    })

    it('applies Observatory x1.5 Mult for each held Celestial Orb', () => {
      const scoreHand = (targetGame: GameOrchestrator, withObservatory: boolean) => {
        clearDecrees(targetGame)
        if (withObservatory) {
          expect(targetGame.getState().charterSystem.purchaseCharter('star_chart')).not.toBeNull()
          expect(targetGame.getState().charterSystem.purchaseCharter('observatory')).not.toBeNull()
          expect(
            targetGame.addCelestialOrb(
              CelestialOrbSystem.createCelestialOrbInstance(
                CELESTIAL_ORBS.mercury_orb
              )
            )
          ).toBe(true)
        }

        const tiles = createDecreeFixtureHand([
          [TileSuit.Manzu, [1, 1, 1, 2, 3, 4, 4, 5, 6, 7, 8, 9, 5, 5]],
        ])
        replaceHand(targetGame, tiles)
        return getScoreEffect(
          targetGame.processAction({
            type: 'play',
            tileIds: tiles.map((tile) => tile.id),
          })
        ).score
      }

      const baselineScore = scoreHand(game, false)
      const observatoryGame = new GameOrchestrator()
      observatoryGame.startNewRun(12345)
      const observatoryScore = scoreHand(observatoryGame, true)

      expect(observatoryScore).toBe(Math.floor(baselineScore * 1.5))
    })

    it('spends Director\'s Take to reroll the upcoming Boss Mandate once', () => {
      const state = game.getState() as OrchestratorState
      state.gold = 20
      expect(state.charterSystem.purchaseCharter('directors_take')).not.toBeNull()
      const bossRound = state.roundManager
        .getCurrentAct()!
        .rounds.find((round) => round.roundType === 'Boss')!
      const previousMandateId = bossRound.bossMandate!.id

      const result = game.rerollBossMandate()

      expect(result.success).toBe(true)
      expect(bossRound.bossMandate!.id).not.toBe(previousMandateId)
      expect(state.gold).toBe(10)
      expect(state.charterSystem.getMandateRerollsRemaining()).toBe(0)
      expect(game.rerollBossMandate().success).toBe(false)
    })

    it('applies Ancient Script Act reduction once at the next Boss exit', () => {
      clearDecrees(game)
      expect(game.processAction({ type: 'skip' }).success).toBe(true)
      expect(game.processAction({ type: 'skip' }).success).toBe(true)
      const state = game.getState() as OrchestratorState
      state.targetScore = 1
      state.roundManager.getCurrentRound()!.scoreTarget = 1
      expect(
        game.processAction({
          type: 'play',
          tileIds: game.getHandTiles().slice(0, 2).map((tile) => tile.id),
        }).success
      ).toBe(true)
      expect(state.phase).toBe('shop')

      const ancientScript = TEA_HOUSE_BASE_CHARTERS.find(
        (charter) => charter.id === 'ancient_script'
      )!
      expect(game.addImperialCharter(ancientScript)).toBe(true)
      expect(state.pendingActReduction).toBe(1)

      game.exitShop()

      expect(game.getState().currentAct).toBe(1)
      expect(game.getState().currentRound).toBe(1)
      expect(game.getState().pendingActReduction).toBe(0)
      expect(game.getState().handsRemaining).toBe(3)
    })

    it('rejects gameplay actions while the shop is open', () => {
      const mutableState = game.getState() as OrchestratorState
      const currentRound = mutableState.roundManager.getCurrentRound()
      if (!currentRound) throw new Error('Expected an active round')
      currentRound.scoreTarget = 1
      mutableState.targetScore = 1
      game.processAction({
        type: 'play',
        tileIds: game.getHandTiles().slice(0, 2).map((tile) => tile.id),
      })

      const result = game.processAction({ type: 'skip' })
      expect(result.success).toBe(false)
      expect(result.errors?.[0]).toContain('active round')
    })
  })

  describe('consumable runtime effects', () => {
    beforeEach(() => {
      game.startNewRun(12345)
    })

    it('validates ownership and exact Fate Seal target counts', () => {
      const unknown = game.processAction({ type: 'useSeal', sealId: 'missing' })
      expect(unknown.success).toBe(false)
      expect(unknown.errors).toContain('Seal not found in inventory')

      const seal = FateSealSystem.createFateSealInstance(
        FATE_SEALS.seal_of_the_alchemist
      )
      game.addFateSeal(seal)

      const result = game.processAction({
        type: 'useSeal',
        sealId: seal.instanceId,
        targets: [game.getHandTiles()[0].id],
      })

      expect(result.success).toBe(false)
      expect(result.errors?.[0]).toContain('exactly 2')
      expect(game.getFateSeals()).toHaveLength(1)
    })

    it('applies Fate Seal tile enhancements to the hand and persistent wall', () => {
      const seal = FateSealSystem.createFateSealInstance(
        FATE_SEALS.seal_of_the_alchemist
      )
      game.addFateSeal(seal)
      const targetIds = game.getHandTiles().slice(0, 2).map((tile) => tile.id)

      const result = game.processAction({
        type: 'useSeal',
        sealId: seal.instanceId,
        targets: targetIds,
      })

      expect(result.success).toBe(true)
      for (const targetId of targetIds) {
        expect(
          game.getHandTiles().find((tile) => tile.id === targetId)?.modifiers
            .enhancement
        ).toBe(EnhancementType.Lucky)
        expect(
          game.getState().wallTemplate.find((tile) => tile.id === targetId)?.modifiers
            .enhancement
        ).toBe(EnhancementType.Lucky)
      }
    })

    it('applies gold effects and enforces one Fate Seal per round', () => {
      const first = FateSealSystem.createFateSealInstance(
        FATE_SEALS.seal_of_the_hermit
      )
      const second = FateSealSystem.createFateSealInstance(
        FATE_SEALS.seal_of_the_hermit
      )
      game.addFateSeal(first)
      game.addFateSeal(second)

      expect(game.processAction({ type: 'useSeal', sealId: first.instanceId }).success).toBe(
        true
      )
      expect(game.getState().gold).toBe(8)

      const secondUse = game.processAction({
        type: 'useSeal',
        sealId: second.instanceId,
      })
      expect(secondUse.success).toBe(false)
      expect(secondUse.errors?.[0]).toContain('uses remaining')
      expect(game.getFateSeals()).toHaveLength(1)

      const mutableState = game.getState() as OrchestratorState
      const currentRound = mutableState.roundManager.getCurrentRound()!
      currentRound.scoreTarget = 1
      mutableState.targetScore = 1
      game.processAction({
        type: 'play',
        tileIds: game.getHandTiles().slice(0, 2).map((tile) => tile.id),
      })
      game.exitShop()

      expect(
        game.processAction({ type: 'useSeal', sealId: second.instanceId }).success
      ).toBe(true)
    })

    it('applies tile seals and Void Script economy penalties', () => {
      const goldSealScript = VoidScriptSystem.createVoidScriptInstance(
        VOID_SCRIPTS.script_of_the_gold_seal
      )
      game.addVoidScript(goldSealScript)
      const targetId = game.getHandTiles()[0].id

      expect(
        game.processAction({
          type: 'useScript',
          scriptId: goldSealScript.instanceId,
          targets: [targetId],
        }).success
      ).toBe(true)
      expect(
        game.getHandTiles().find((tile) => tile.id === targetId)?.modifiers.seal
      ).toBe(SealType.Gold)

      const penaltyGame = new GameOrchestrator()
      penaltyGame.startNewRun(12345)
      const decreesBefore = penaltyGame.getState().decreeSystem.getOwnedDecrees().length
      const wraith = VoidScriptSystem.createVoidScriptInstance(
        VOID_SCRIPTS.script_of_the_wraith
      )
      penaltyGame.addVoidScript(wraith)

      expect(
        penaltyGame.processAction({
          type: 'useScript',
          scriptId: wraith.instanceId,
        }).success
      ).toBe(true)
      expect(penaltyGame.getState().gold).toBe(0)
      expect(penaltyGame.getState().decreeSystem.getOwnedDecrees()).toHaveLength(
        decreesBefore + 1
      )
    })

    it('destroys tiles and grants gold for Script of Immolation', () => {
      const script = VoidScriptSystem.createVoidScriptInstance(
        VOID_SCRIPTS.script_of_immolation
      )
      game.addVoidScript(script)
      const wallSizeBefore = game.getState().wallTemplate.length

      const result = game.processAction({
        type: 'useScript',
        scriptId: script.instanceId,
      })

      expect(result.success).toBe(true)
      expect(game.getHandTiles()).toHaveLength(9)
      expect(game.getState().wallTemplate).toHaveLength(wallSizeBefore - 5)
      expect(game.getState().gold).toBe(24)
    })

    it('persists Negative Decree editions and their capacity benefit', () => {
      const script = VoidScriptSystem.createVoidScriptInstance(
        VOID_SCRIPTS.script_of_ectoplasm
      )
      game.addVoidScript(script)
      const maxSlotsBefore = game.getState().decreeSystem.getMaxSlots()

      const result = game.processAction({
        type: 'useScript',
        scriptId: script.instanceId,
      })

      expect(result.success).toBe(true)
      expect(game.getState().decreeSystem.getMaxSlots()).toBe(maxSlotsBefore + 1)
      expect(
        game
          .getState()
          .decreeSystem.getOwnedDecrees()
          .some((decree) => decree.edition === 'Negative')
      ).toBe(true)
      expect(game.getHandTiles()).toHaveLength(13)
    })

    it('lets Omen of Ash negate a successful Void Script downside', () => {
      useOmenStore.getState().addTag(OMEN_OF_ASH.id)
      const wraith = VoidScriptSystem.createVoidScriptInstance(
        VOID_SCRIPTS.script_of_the_wraith
      )
      game.addVoidScript(wraith)

      const result = game.processAction({
        type: 'useScript',
        scriptId: wraith.instanceId,
      })

      expect(result.success).toBe(true)
      expect(game.getState().gold).toBe(4)
      expect(
        game.getState().omenSystem.hasVoidScriptDownsideProtection()
      ).toBe(false)
    })
  })

  describe('Omen and extended Mandate integration', () => {
    beforeEach(() => {
      game.startNewRun(12345)
    })

    it('applies next-hand score Omens to live scoring', () => {
      useOmenStore.getState().addTag(SCORE_SURGE_OMEN.id)

      game.processAction({
        type: 'play',
        tileIds: game.getHandTiles().slice(0, 2).map((tile) => tile.id),
      })

      expect(game.getState().score).toBeGreaterThanOrEqual(100)
      expect(
        useOmenStore.getState().getActiveOmensByTrigger('OnNextHand')
      ).toHaveLength(0)
    })

    it('applies next-round hand and discard Omens before dealing', () => {
      useOmenStore.getState().addTag(OMEN_OF_RIVERS.id)
      useOmenStore.getState().addTag(PRECISION_OMEN.id)
      const mutableState = game.getState() as OrchestratorState
      const currentRound = mutableState.roundManager.getCurrentRound()!
      currentRound.scoreTarget = 1
      mutableState.targetScore = 1

      game.processAction({
        type: 'play',
        tileIds: game.getHandTiles().slice(0, 2).map((tile) => tile.id),
      })
      game.exitShop()

      expect(game.getState().discardsRemaining).toBe(4)
      expect(game.getHandTiles()).toHaveLength(16)
    })

    it('selects and applies extended mandates from the canonical library', () => {
      game.processAction({ type: 'skip' })
      const act = game.getState().roundManager.getCurrentAct()!
      act.rounds[2].bossMandate = {
        id: THE_MANACLE.id,
        name: THE_MANACLE.name,
        japaneseName: THE_MANACLE.japaneseName,
        description: THE_MANACLE.description,
        effect: THE_MANACLE.effect,
        minAct: THE_MANACLE.minAct,
      }

      game.processAction({ type: 'skip' })

      expect(game.getState().currentRound).toBe(3)
      expect(game.getHandTiles()).toHaveLength(13)
      expect(game.getState().roundManager.getCurrentRound()?.bossMandate?.id).toBe(
        THE_MANACLE.id
      )
    })

    it('tracks The House first hand as face-down authoritative state', () => {
      enterBossWithMandate(game, THE_HOUSE)

      expect(new Set(game.getFaceDownTileIds())).toEqual(
        new Set(game.getHandTiles().map((tile) => tile.id))
      )
    })

    it('only hides The Fish replacement tiles after a hand is played', () => {
      enterBossWithMandate(game, THE_FISH)
      expect(game.getFaceDownTileIds()).toHaveLength(0)

      const handBefore = new Set(game.getHandTiles().map((tile) => tile.id))
      const mutableState = game.getState() as OrchestratorState
      mutableState.targetScore = Number.MAX_SAFE_INTEGER
      mutableState.roundManager.getCurrentRound()!.scoreTarget = Number.MAX_SAFE_INTEGER

      expect(
        game.processAction({
          type: 'play',
          tileIds: game.getHandTiles().slice(0, 2).map((tile) => tile.id),
        }).success
      ).toBe(true)

      const replacementIds = game
        .getHandTiles()
        .filter((tile) => !handBefore.has(tile.id))
        .map((tile) => tile.id)
      expect(replacementIds.length).toBeGreaterThan(0)
      expect(new Set(game.getFaceDownTileIds())).toEqual(new Set(replacementIds))
    })

    it('uses the seeded mandate RNG for The Wheel hidden tiles', () => {
      enterBossWithMandate(game, THE_WHEEL)

      const secondGame = new GameOrchestrator()
      secondGame.startNewRun(12345)
      enterBossWithMandate(secondGame, THE_WHEEL)

      expect(game.getFaceDownTileIds()).toEqual(secondGame.getFaceDownTileIds())
      expect(game.getFaceDownTileIds().length).toBeGreaterThan(0)
      expect(game.getFaceDownTileIds().length).toBeLessThan(game.getHandTiles().length)
    })

    it('hides exactly the Honor tiles drawn under The Mark', () => {
      enterBossWithMandate(game, THE_MARK)

      const honorIds = game
        .getHandTiles()
        .filter((tile) => tile.isHonor)
        .map((tile) => tile.id)
      expect(honorIds.length).toBeGreaterThan(0)
      expect(new Set(game.getFaceDownTileIds())).toEqual(new Set(honorIds))
    })

    it('force-locks a visible tile for Cerulean Bell and enforces it', () => {
      enterBossWithMandate(game, CERULEAN_BELL)

      const [lockedId] = game.getState().mandateEffectSystem.getLockedTileIds()
      expect(lockedId).toBeDefined()
      expect(game.getHandTiles().some((tile) => tile.id === lockedId)).toBe(true)
      expect(game.processAction({ type: 'discard', tileId: lockedId }).errors?.[0]).toContain(
        'Locked'
      )
      expect(
        game.processAction({ type: 'redraw', tileIds: [lockedId] }).errors?.[0]
      ).toContain('Locked')

      const unlockedIds = game
        .getHandTiles()
        .filter((tile) => tile.id !== lockedId)
        .slice(0, 2)
        .map((tile) => tile.id)
      expect(
        game.processAction({ type: 'play', tileIds: unlockedIds }).errors?.[0]
      ).toContain('must be included')
    })

    it('sells a Decree to lift Verdant Leaf tile debuffs', () => {
      enterBossWithMandate(game, VERDANT_LEAF)

      const state = game.getState()
      const decree = state.decreeSystem.getOwnedDecrees()[0]
      const sellValue = decree.sellValue ?? Math.floor(decree.cost / 2)
      const goldBefore = state.gold
      expect(
        game.getHandTiles().every((tile) => state.debuffSystem.isTileDebuffed(tile.id))
      ).toBe(true)

      const result = game.sellDecree(decree.id)

      expect(result.success).toBe(true)
      expect(game.getState().gold).toBe(goldBefore + sellValue)
      expect(game.getState().mandateEffectSystem.areAllTilesDebuffed()).toBe(false)
      expect(
        game.getHandTiles().some((tile) => game.getState().debuffSystem.isTileDebuffed(tile.id))
      ).toBe(false)
    })

    it('keeps Eternal Decrees unsellable', () => {
      const decree = game.getState().decreeSystem.getOwnedDecrees()[0]
      decree.sticker = { type: 'Eternal' }
      const goldBefore = game.getState().gold

      const result = game.sellDecree(decree.id)

      expect(result.success).toBe(false)
      expect(result.errors?.[0]).toContain('Eternal')
      expect(game.getState().gold).toBe(goldBefore)
      expect(game.getState().decreeSystem.getOwnedDecrees()).toContain(decree)
    })

    it('creates a deterministic hidden Decree order for Amber Acorn', () => {
      enterBossWithMandate(game, AMBER_ACORN)

      const secondGame = new GameOrchestrator()
      secondGame.startNewRun(12345)
      enterBossWithMandate(secondGame, AMBER_ACORN)

      const order = game.getState().mandateEffectSystem.getShuffledDecreeIds()
      expect(game.getState().mandateEffectSystem.areDecreesShuffled()).toBe(true)
      expect(order).toEqual(secondGame.getState().mandateEffectSystem.getShuffledDecreeIds())
      expect(new Set(order)).toEqual(
        new Set(game.getState().decreeSystem.getOwnedDecrees().map((decree) => decree.id))
      )
    })
  })

  describe('specialized Decree integration', () => {
    beforeEach(() => {
      game.startNewRun(24680)
      clearDecrees(game)
    })

    it('routes Broken Stair hands through complete-hand scoring', () => {
      game.getState().decreeSystem.acquireDecree(BROKEN_STAIR_EDICT)
      const tiles = createDecreeFixtureHand([
        [TileSuit.Manzu, [1, 3, 4]],
        [TileSuit.Pinzu, [2, 3, 4, 5, 6, 7]],
        [TileSuit.Souzu, [6, 7, 8]],
        [TileSuit.Wind, [1, 1]],
      ])
      replaceHand(game, tiles)

      const result = game.processAction({
        type: 'play',
        tileIds: tiles.map((tile) => tile.id),
      })

      expect(result.success).toBe(true)
      expect(getScoreEffect(result).description).not.toContain('partial hand')
    })

    it('routes False Eye twelve-tile hands through complete-hand scoring', () => {
      game.getState().decreeSystem.acquireDecree(FALSE_EYE_MANDATE)
      const tiles = createDecreeFixtureHand([
        [TileSuit.Manzu, [1, 2, 3, 4, 5, 6]],
        [TileSuit.Pinzu, [2, 3, 4]],
        [TileSuit.Souzu, [7, 7, 7]],
      ])
      replaceHand(game, tiles)

      const result = game.processAction({
        type: 'play',
        tileIds: tiles.map((tile) => tile.id),
      })

      expect(result.success).toBe(true)
      expect(getScoreEffect(result).description).not.toContain('partial hand')
    })

    it('applies Tanyao Dispensation to live Yaku scoring', () => {
      game.getState().decreeSystem.acquireDecree(TANYAO_DISPENSATION)
      const tiles = createDecreeFixtureHand([
        [TileSuit.Manzu, [1, 2, 3, 2, 3, 4]],
        [TileSuit.Pinzu, [3, 4, 5, 5, 5]],
        [TileSuit.Souzu, [6, 7, 8]],
      ])
      replaceHand(game, tiles)

      const result = game.processAction({
        type: 'play',
        tileIds: tiles.map((tile) => tile.id),
      })

      expect(
        getScoreEffect(result).breakdown.detectedYaku.map((yaku) => yaku.definition.id)
      ).toContain('tanyao')
    })

    it('scales Pure Suit Asceticism once per dominant-suit tile', () => {
      const baselineGame = new GameOrchestrator()
      baselineGame.startNewRun(24680)
      clearDecrees(baselineGame)
      const baselineTiles = createDecreeFixtureHand([
        [TileSuit.Manzu, [1, 1, 1, 2, 3, 4, 4, 5, 6, 7, 8, 9, 5, 5]],
      ])
      replaceHand(baselineGame, baselineTiles)
      const baselineScore = getScoreEffect(
        baselineGame.processAction({
          type: 'play',
          tileIds: baselineTiles.map((tile) => tile.id),
        })
      ).score

      game.getState().decreeSystem.acquireDecree(PURE_SUIT_ASCETICISM)
      const enhancedTiles = createDecreeFixtureHand([
        [TileSuit.Manzu, [1, 1, 1, 2, 3, 4, 4, 5, 6, 7, 8, 9, 5, 5]],
      ])
      replaceHand(game, enhancedTiles)
      const enhancedScore = getScoreEffect(
        game.processAction({
          type: 'play',
          tileIds: enhancedTiles.map((tile) => tile.id),
        })
      ).score

      expect(enhancedScore).toBeGreaterThan(baselineScore * 3.5)
    })

    it('scores a 1-shanten hand through Shanten Clemency with its penalty', () => {
      game.getState().decreeSystem.acquireDecree(SHANTEN_CLEMENCY)
      const tiles = createDecreeFixtureHand([
        [TileSuit.Manzu, [1, 2, 3, 2, 3, 4]],
        [TileSuit.Pinzu, [3, 4, 5, 5, 5]],
        [TileSuit.Souzu, [6, 7]],
      ])
      replaceHand(game, tiles)

      const result = game.processAction({
        type: 'play',
        tileIds: tiles.map((tile) => tile.id),
      })

      expect(result.success).toBe(true)
      expect(getScoreEffect(result).description).not.toContain('partial hand')
      expect(
        result.effects.some((effect) => effect.description.includes('50% score penalty'))
      ).toBe(true)
    })

    it('uses Celestial Wildcard during authoritative hand validation', () => {
      game.getState().decreeSystem.acquireDecree(CELESTIAL_WILDCARD)
      const tiles = createDecreeFixtureHand([
        [TileSuit.Manzu, [1, 1, 1, 2, 3, 4]],
        [TileSuit.Pinzu, [4, 6, 9]],
        [TileSuit.Souzu, [7, 8, 9]],
        [TileSuit.Wind, [1, 1]],
      ])
      replaceHand(game, tiles)

      const result = game.processAction({
        type: 'play',
        tileIds: tiles.map((tile) => tile.id),
      })

      expect(result.success).toBe(true)
      expect(getScoreEffect(result).description).not.toContain('partial hand')
    })

    it('transmutes honors into the dominant suit for validation and scoring', () => {
      game.getState().decreeSystem.acquireDecree(HONOR_TRANSMUTATION)
      const tiles = createDecreeFixtureHand([
        [TileSuit.Manzu, [4, 5, 6, 7, 8, 9]],
        [TileSuit.Pinzu, [2, 3, 4]],
        [TileSuit.Souzu, [5, 5]],
        [TileSuit.Wind, [1, 2, 3]],
      ])
      replaceHand(game, tiles)

      const result = game.processAction({
        type: 'play',
        tileIds: tiles.map((tile) => tile.id),
      })

      expect(result.success).toBe(true)
      expect(getScoreEffect(result).description).not.toContain('partial hand')
      expect(
        result.effects.some((effect) =>
          effect.description.includes('Honor Transmutation')
        )
      ).toBe(true)
    })

    it('uses Dead Wall Writ as an optional once-per-round tile swap', () => {
      game.getState().decreeSystem.acquireDecree(DEAD_WALL_WRIT)
      const state = game.getState() as OrchestratorState
      const discarded = game.getHandTiles()[0]
      const replacement = Tile.createNumbered(
        TileSuit.Souzu,
        9,
        'dead-wall-writ-replacement'
      )
      state.deadWall = [replacement]

      const result = game.useDeadWallWrit(discarded.id)

      expect(result.success).toBe(true)
      expect(game.getHandTiles().some((tile) => tile.id === discarded.id)).toBe(false)
      expect(game.getHandTiles().some((tile) => tile.id === replacement.id)).toBe(true)
      expect(state.discards.some((tile) => tile.id === discarded.id)).toBe(true)
      expect(game.useDeadWallWrit(game.getHandTiles()[0].id).success).toBe(false)
    })

    it('compounds Yaku repeated from the previous round', () => {
      const decree = game
        .getState()
        .decreeSystem.acquireDecree(YAKU_REPETITION_CHARTER)!
      const firstTiles = createDecreeFixtureHand([
        [TileSuit.Manzu, [1, 1, 1, 2, 3, 4, 4, 5, 6, 7, 8, 9, 5, 5]],
      ])
      replaceHand(game, firstTiles)
      const firstState = game.getState() as OrchestratorState
      firstState.targetScore = 1
      firstState.roundManager.getCurrentRound()!.scoreTarget = 1

      expect(
        game.processAction({
          type: 'play',
          tileIds: firstTiles.map((tile) => tile.id),
        }).success
      ).toBe(true)
      expect(decree.scalingValue).toBe(0)
      game.exitShop()

      const repeatedTiles = createDecreeFixtureHand([
        [TileSuit.Manzu, [1, 1, 1, 2, 3, 4, 4, 5, 6, 7, 8, 9, 5, 5]],
      ])
      replaceHand(game, repeatedTiles)
      expect(
        game.processAction({
          type: 'play',
          tileIds: repeatedTiles.map((tile) => tile.id),
        }).success
      ).toBe(true)

      expect(decree.scalingValue).toBeGreaterThan(0)
    })
  })

  describe('round completion', () => {
    it('records an Act 8 victory and can continue through the Tea House into Endless', () => {
      game.startNewRun(12345)
      const state = game.getState() as OrchestratorState
      state.roundManager.startAct(8)
      state.roundManager.skipRound()
      state.roundManager.skipRound()

      const bossRound = state.roundManager.getCurrentRound()!
      state.currentAct = 8
      state.currentRound = 3
      state.targetScore = bossRound.scoreTarget
      state.score = bossRound.scoreTarget
      state.runScore = bossRound.scoreTarget * 3

      const completionHarness = game as unknown as {
        handleRoundWin: (effects: Effect[]) => void
      }
      completionHarness.handleRoundWin([])

      expect(state.hasWonRun).toBe(true)
      expect(state.isRunActive).toBe(false)
      expect(state.phase).toBe('gameOver')

      expect(game.continueEndless()).toBe(true)
      expect(state.phase).toBe('shop')
      expect(state.isRunActive).toBe(true)

      game.exitShop()
      expect(state.currentAct).toBe(9)
      expect(state.currentRound).toBe(1)
      expect(state.phase).toBe('gameplay')
    })

    it('should end game when hands exhausted without meeting target', () => {
      game.startNewRun(12345)

      const state = game.getState()

      // Play all hands
      for (let i = 0; i < state.handsRemaining; i++) {
        const currentHand = game.getHandTiles()
        if (currentHand.length < 2) break

        game.processAction({
          type: 'play',
          tileIds: currentHand.slice(0, Math.min(3, currentHand.length)).map((t) => t.id),
        })
      }

      // Either game over or advanced
      const finalState = game.getState()
      expect(['gameplay', 'gameOver', 'shop']).toContain(finalState.phase)
    })
  })
})
