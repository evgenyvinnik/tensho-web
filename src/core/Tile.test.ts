/**
 * Tile Core Logic Tests
 *
 * Unit tests for the Tile class and related functionality.
 */

import { describe, it, expect } from 'vitest'
import { Tile, TileSuit } from '../core/Tile'

describe('Tile', () => {
  describe('constructor', () => {
    it('should create a numbered tile correctly', () => {
      const tile = new Tile(TileSuit.Manzu, 5, 'test-1')
      expect(tile.suit).toBe(TileSuit.Manzu)
      expect(tile.rank).toBe(5)
      expect(tile.id).toBe('test-1')
    })

    it('should create a wind tile correctly', () => {
      const tile = new Tile(TileSuit.Wind, 1, 'test-2') // East
      expect(tile.suit).toBe(TileSuit.Wind)
      expect(tile.rank).toBe(1)
    })

    it('should create a dragon tile correctly', () => {
      const tile = new Tile(TileSuit.Dragon, 3, 'test-3') // Red
      expect(tile.suit).toBe(TileSuit.Dragon)
      expect(tile.rank).toBe(3)
    })

    it('should create a red five correctly', () => {
      const tile = new Tile(TileSuit.Manzu, 5, 'test-4', true)
      expect(tile.isRed).toBe(true)
    })
  })

  describe('isTerminal', () => {
    it('should return true for rank 1', () => {
      const tile = new Tile(TileSuit.Pinzu, 1, 'test-5')
      expect(tile.isTerminal).toBe(true)
    })

    it('should return true for rank 9', () => {
      const tile = new Tile(TileSuit.Souzu, 9, 'test-6')
      expect(tile.isTerminal).toBe(true)
    })

    it('should return false for simples', () => {
      const tile = new Tile(TileSuit.Manzu, 5, 'test-7')
      expect(tile.isTerminal).toBe(false)
    })

    it('should return false for honor tiles', () => {
      const tile = new Tile(TileSuit.Wind, 1, 'test-8')
      expect(tile.isTerminal).toBe(false)
    })
  })

  describe('isSimple', () => {
    it('should return true for tiles 2-8', () => {
      for (let rank = 2; rank <= 8; rank++) {
        const tile = new Tile(TileSuit.Pinzu, rank, `test-simple-${rank}`)
        expect(tile.isSimple).toBe(true)
      }
    })

    it('should return false for terminals', () => {
      const tile1 = new Tile(TileSuit.Manzu, 1, 'test-9')
      const tile9 = new Tile(TileSuit.Manzu, 9, 'test-10')
      expect(tile1.isSimple).toBe(false)
      expect(tile9.isSimple).toBe(false)
    })

    it('should return false for honors', () => {
      const tile = new Tile(TileSuit.Dragon, 2, 'test-11')
      expect(tile.isSimple).toBe(false)
    })
  })

  describe('isHonor', () => {
    it('should return true for wind tiles', () => {
      const tile = new Tile(TileSuit.Wind, 2, 'test-12')
      expect(tile.isHonor).toBe(true)
    })

    it('should return true for dragon tiles', () => {
      const tile = new Tile(TileSuit.Dragon, 1, 'test-13')
      expect(tile.isHonor).toBe(true)
    })

    it('should return false for numbered tiles', () => {
      const tile = new Tile(TileSuit.Souzu, 5, 'test-14')
      expect(tile.isHonor).toBe(false)
    })
  })

  describe('isSuited', () => {
    it('should return true for manzu', () => {
      const tile = new Tile(TileSuit.Manzu, 3, 'test-15')
      expect(tile.isSuited).toBe(true)
    })

    it('should return true for pinzu', () => {
      const tile = new Tile(TileSuit.Pinzu, 7, 'test-16')
      expect(tile.isSuited).toBe(true)
    })

    it('should return true for souzu', () => {
      const tile = new Tile(TileSuit.Souzu, 1, 'test-17')
      expect(tile.isSuited).toBe(true)
    })

    it('should return false for honors', () => {
      const tile = new Tile(TileSuit.Wind, 3, 'test-18')
      expect(tile.isSuited).toBe(false)
    })
  })

  describe('isBonus', () => {
    it('should return true for flower tiles', () => {
      const tile = new Tile(TileSuit.Flower, 1, 'test-19')
      expect(tile.isBonus).toBe(true)
    })

    it('should return true for season tiles', () => {
      const tile = new Tile(TileSuit.Season, 2, 'test-20')
      expect(tile.isBonus).toBe(true)
    })

    it('should return false for numbered tiles', () => {
      const tile = new Tile(TileSuit.Manzu, 5, 'test-21')
      expect(tile.isBonus).toBe(false)
    })
  })

  describe('isTerminalOrHonor', () => {
    it('should return true for terminals', () => {
      const tile = new Tile(TileSuit.Pinzu, 1, 'test-22')
      expect(tile.isTerminalOrHonor).toBe(true)
    })

    it('should return true for honors', () => {
      const tile = new Tile(TileSuit.Dragon, 3, 'test-23')
      expect(tile.isTerminalOrHonor).toBe(true)
    })

    it('should return false for simples', () => {
      const tile = new Tile(TileSuit.Souzu, 5, 'test-24')
      expect(tile.isTerminalOrHonor).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for same tile id', () => {
      const tile1 = new Tile(TileSuit.Manzu, 5, 'test-25')
      const tile2 = new Tile(TileSuit.Manzu, 5, 'test-25') // Same ID
      expect(tile1.equals(tile2)).toBe(true)
    })

    it('should return false for different id even with same suit/rank', () => {
      const tile1 = new Tile(TileSuit.Manzu, 5, 'test-25')
      const tile2 = new Tile(TileSuit.Manzu, 5, 'test-26') // Different ID
      expect(tile1.equals(tile2)).toBe(false)
    })
  })

  describe('typeKey', () => {
    it('should return same typeKey for same suit and rank', () => {
      const tile1 = new Tile(TileSuit.Manzu, 5, 'test-27')
      const tile2 = new Tile(TileSuit.Manzu, 5, 'test-28')
      expect(tile1.typeKey).toBe(tile2.typeKey)
    })

    it('should return different typeKey for different suit', () => {
      const tile1 = new Tile(TileSuit.Manzu, 5, 'test-29')
      const tile2 = new Tile(TileSuit.Pinzu, 5, 'test-30')
      expect(tile1.typeKey).not.toBe(tile2.typeKey)
    })

    it('should return different typeKey for different rank', () => {
      const tile1 = new Tile(TileSuit.Manzu, 5, 'test-31')
      const tile2 = new Tile(TileSuit.Manzu, 6, 'test-32')
      expect(tile1.typeKey).not.toBe(tile2.typeKey)
    })
  })

  describe('toString', () => {
    it('should return readable string for numbered tiles', () => {
      const tile = new Tile(TileSuit.Manzu, 5, 'test-31')
      expect(tile.toString()).toBeDefined()
      expect(typeof tile.toString()).toBe('string')
    })

    it('should return readable string for wind tiles', () => {
      const tile = new Tile(TileSuit.Wind, 1, 'test-32') // East
      const str = tile.toString()
      expect(str).toBeDefined()
    })

    it('should return readable string for dragon tiles', () => {
      const tile = new Tile(TileSuit.Dragon, 3, 'test-33') // Red
      const str = tile.toString()
      expect(str).toBeDefined()
    })
  })

  describe('hasModifiers', () => {
    it('should return false for default modifiers', () => {
      const tile = new Tile(TileSuit.Manzu, 5, 'test-34')
      expect(tile.hasModifiers).toBe(false)
    })
  })
})
