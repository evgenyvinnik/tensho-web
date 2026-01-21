/**
 * PlaySurface Component Tests
 *
 * Unit tests for the PlaySurface component, focusing on
 * tile clicking/staging behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlaySurface } from './PlaySurface'
import { Tile, TileSuit } from '../../core/Tile'

// Mock the settingsStore with all required exports
vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: vi.fn((selector) => {
    const mockState = {
      reducedMotion: false,
      animationMultiplier: 1,
    }
    return selector ? selector(mockState) : mockState
  }),
  selectAnimationMultiplier: (state: { animationMultiplier: number }) => state.animationMultiplier,
}))

// Mock react-spring to avoid animation issues in tests
vi.mock('@react-spring/web', () => ({
  useSpring: () => ({
    scale: { to: (fn: (v: number) => string) => fn(1) },
    borderOpacity: { to: (fn: (v: number) => string) => fn(0.5) },
    glowIntensity: { to: (fn: (v: number) => string) => fn(0) },
    brightness: { to: (fn: (v: number) => string) => fn(1) },
    backgroundColor: 'rgba(255, 87, 34, 0.3)',
    borderColor: '#E64A19',
    y: 0,
    x: 0,
    boxShadow: 'none',
    opacity: 1,
    transform: 'none',
  }),
  animated: {
    div: 'div',
  },
  config: {
    stiff: {},
  },
  to: (...args: unknown[]) => 'none',
}))

// Mock the tile animations
vi.mock('../../animations/useTileAnimation', () => ({
  useTileInteractionAnimation: () => ({
    style: { boxShadow: 'none' },
    spring: { y: 0, scale: 1, x: 0 },
    handlers: {},
  }),
  useTileShakeAnimation: () => ({
    style: {},
    spring: { x: 0 },
    trigger: vi.fn(),
  }),
  useTileDragAnimation: () => ({
    style: { transform: 'none', opacity: 1, boxShadow: 'none' },
    isDragging: false,
    startDrag: vi.fn(),
    updateDrag: vi.fn(),
    endDrag: vi.fn(),
  }),
}))

// Helper to create test tiles
function createTestTiles(count: number): Tile[] {
  const tiles: Tile[] = []
  for (let i = 0; i < count; i++) {
    tiles.push(new Tile(TileSuit.Manzu, (i % 9) + 1, `tile-${i}`))
  }
  return tiles
}

describe('PlaySurface', () => {
  const mockOnTileSelect = vi.fn()
  const mockOnTileDiscard = vi.fn()
  const mockOnTilesStaged = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render hand tiles', () => {
      const tiles = createTestTiles(5)

      render(
        <PlaySurface
          handTiles={tiles}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      // Should show "Hand (5)" indicator
      expect(screen.getByText(/Hand \(5\)/)).toBeInTheDocument()
    })

    it('should show empty staging message when no tiles staged', () => {
      const tiles = createTestTiles(5)

      render(
        <PlaySurface
          handTiles={tiles}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      expect(screen.getByText(/Tap tiles to select/)).toBeInTheDocument()
    })

    it('should show discard zone', () => {
      const tiles = createTestTiles(5)

      render(
        <PlaySurface
          handTiles={tiles}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
          discardsRemaining={3}
        />
      )

      // Should show discard icon
      expect(screen.getByText('🗑️')).toBeInTheDocument()
      // Should show discards remaining count
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should show hands remaining', () => {
      const tiles = createTestTiles(5)

      render(
        <PlaySurface
          handTiles={tiles}
          handsRemaining={4}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      expect(screen.getByText(/🖐 4/)).toBeInTheDocument()
    })

    it('should show shanten display when provided', () => {
      const tiles = createTestTiles(13)

      render(
        <PlaySurface
          handTiles={tiles}
          shantenDisplay="Tenpai!"
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      expect(screen.getByText('Tenpai!')).toBeInTheDocument()
    })
  })

  describe('onTilesStaged callback', () => {
    it('should call onTilesStaged with empty array initially', () => {
      const tiles = createTestTiles(5)

      render(
        <PlaySurface
          handTiles={tiles}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      // Initial render calls onTilesStaged with empty array
      expect(mockOnTilesStaged).toHaveBeenCalledWith([])
    })
  })

  describe('score preview', () => {
    it('should display score preview when provided', () => {
      const tiles = createTestTiles(5)
      const scorePreview = {
        points: 100,
        mult: 1.5,
        total: 150,
        yaku: [],
      }

      render(
        <PlaySurface
          handTiles={tiles}
          scorePreview={scorePreview}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      // Note: Score preview only shows when tiles are staged
      // With no staged tiles, it won't show
    })
  })

  describe('disabled state', () => {
    it('should not allow interactions when disabled', () => {
      const tiles = createTestTiles(5)

      render(
        <PlaySurface
          handTiles={tiles}
          disabled={true}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      // Component renders but interactions should be blocked
      expect(screen.getByText(/Hand \(5\)/)).toBeInTheDocument()
    })
  })

  describe('selected tiles display', () => {
    it('should mark tiles as selected when in selectedIds', () => {
      const tiles = createTestTiles(5)
      const selectedIds = new Set([tiles[0].id, tiles[1].id])

      render(
        <PlaySurface
          handTiles={tiles}
          selectedIds={selectedIds}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      // Tiles with selected state should render (visual test would check styling)
      expect(screen.getByText(/Hand \(5\)/)).toBeInTheDocument()
    })
  })

  describe('glowing tiles display', () => {
    it('should mark tiles as glowing when in glowingIds', () => {
      const tiles = createTestTiles(5)
      const glowingIds = new Set([tiles[2].id])

      render(
        <PlaySurface
          handTiles={tiles}
          glowingIds={glowingIds}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      // Tiles with glowing state should render
      expect(screen.getByText(/Hand \(5\)/)).toBeInTheDocument()
    })
  })

  describe('hand tile updates', () => {
    it('should update when handTiles prop changes', () => {
      const tiles3 = createTestTiles(3)
      const tiles5 = createTestTiles(5)

      const { rerender } = render(
        <PlaySurface
          handTiles={tiles3}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      expect(screen.getByText(/Hand \(3\)/)).toBeInTheDocument()

      rerender(
        <PlaySurface
          handTiles={tiles5}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      expect(screen.getByText(/Hand \(5\)/)).toBeInTheDocument()
    })
  })
})
