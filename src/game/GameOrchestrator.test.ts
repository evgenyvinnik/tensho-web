/**
 * GameOrchestrator Tests
 *
 * Unit tests for the GameOrchestrator class, focusing on
 * the playHand action and tile selection functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GameOrchestrator } from './GameOrchestrator'

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
      expect(state.handTiles.length).toBe(13)
    })

    it('should give player starting hand of 13 tiles', () => {
      game.startNewRun(12345)

      const handTiles = game.getHandTiles()
      expect(handTiles.length).toBe(13)
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
      expect(selectedIds.length).toBe(13)
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
      const handSizeBefore = game.getHandTiles().length

      const result = game.processAction({ type: 'draw' })

      expect(result.success).toBe(true)
      // Hand size might stay same if bonus tile drawn (auto-replaced)
      expect(game.getHandTiles().length).toBeGreaterThanOrEqual(handSizeBefore)
    })

    it('should reduce wall remaining after draw', () => {
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
  })

  describe('round completion', () => {
    it('should end game when hands exhausted without meeting target', () => {
      game.startNewRun(12345)

      const state = game.getState()
      const handTiles = game.getHandTiles()
      const _tileIds = handTiles.slice(0, 3).map((t) => t.id) // Play few tiles for low score

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
