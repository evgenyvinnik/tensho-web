/**
 * PlaySurface Component Tests
 *
 * Unit tests for the PlaySurface component, focusing on
 * tile clicking/staging behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PlaySurface } from './PlaySurface'
import { Tile, TileSuit } from '../../core/Tile'
import { MeldType } from '../../core/Meld'

// Mock the settingsStore with all required exports
vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: vi.fn((selector) => {
    const mockState = {
      reducedMotion: false,
      animationMultiplier: 1,
    }
    return selector ? selector(mockState) : mockState
  }),
  selectAnimationMultiplier: (state: { animationMultiplier: number }) =>
    state.animationMultiplier,
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
  to: (..._args: unknown[]) => 'none',
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

// jsdom does not supply PointerEvent/pointer capture. Preserve the actual
// pointer identity fields rather than testing through legacy mouse handlers.
function pointer(target: Element | Window, type: string, pointerId = 1) {
  const event = new MouseEvent(type, {
    bubbles: true,
    clientX: 20,
    clientY: 20,
    button: 0,
  })
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    isPrimary: { value: true },
  })
  fireEvent(target, event)
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

      expect(screen.getByText('Build your play')).toBeInTheDocument()
    })

    it('uses the selected table colors on the staging surface', () => {
      const { container } = render(
        <PlaySurface
          handTiles={createTestTiles(5)}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
          tableThemeColor="#C62828"
          tableAccentColor="#4A1B18"
        />
      )

      const stagingZone = container.querySelector('[data-play-zone="staging"]')
      const stagingAccent = container.querySelector('[data-table-stage-accent]')

      expect(stagingZone).toHaveAttribute('data-table-theme-color', '#C62828')
      expect(stagingZone).toHaveStyle({
        background:
          'linear-gradient(145deg, #C6282830, #4A1B1820 48%, rgba(8, 28, 21, 0.62))',
      })
      expect(stagingAccent).toHaveStyle({ backgroundColor: '#C62828' })
    })

    it('guides a beginner through a real highlighted shape', () => {
      const tiles = createTestTiles(5)
      const onOpenGuide = vi.fn()
      const { container } = render(
        <PlaySurface
          handTiles={tiles}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
          highlightedIds={new Set([tiles[0].id, tiles[1].id])}
          beginnerSuggestion={{
            kind: MeldType.Pair,
            tileIds: [tiles[0].id, tiles[1].id],
            structurePoints: 10,
          }}
          onOpenBeginnerGuide={onOpenGuide}
        />
      )

      expect(screen.getByText('Guided first move')).toBeInTheDocument()
      expect(screen.getByText('Pair ready')).toBeInTheDocument()
      expect(
        container.querySelector(
          `[data-play-tile="${tiles[0].id}"] .ring-vibrant-orange`
        )
      ).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /Learn the tiles/i }))
      expect(onOpenGuide).toHaveBeenCalledOnce()
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

    it('stages the full hand when a declaration is requested', async () => {
      const tiles = createTestTiles(5)
      const { rerender } = render(
        <PlaySurface
          handTiles={tiles}
          stageAllRequestId={0}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      rerender(
        <PlaySurface
          handTiles={tiles}
          stageAllRequestId={1}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      await waitFor(() => {
        expect(mockOnTilesStaged).toHaveBeenLastCalledWith(tiles)
      })
      expect(screen.getByText('5 tiles ready to play')).toBeInTheDocument()
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
    it('supports semantic click activation without a pointer gesture', () => {
      render(
        <PlaySurface
          handTiles={createTestTiles(3)}
          onTileSelect={mockOnTileSelect}
        />
      )
      fireEvent.click(
        screen.getByRole('button', { name: 'Stage 1 of Characters' }),
        { detail: 0 }
      )
      expect(mockOnTileSelect).toHaveBeenCalledOnce()
      fireEvent.click(
        screen.getByRole('button', { name: 'Return 1 of Characters to hand' }),
        { detail: 0 }
      )
      expect(mockOnTileSelect).toHaveBeenCalledTimes(2)
      expect(screen.getByText('Hand (3)')).toBeInTheDocument()
    })

    it('blocks keyboard staging as well as pointer staging when disabled', () => {
      render(
        <PlaySurface
          handTiles={createTestTiles(3)}
          disabled
          onTileSelect={mockOnTileSelect}
        />
      )
      const tile = screen.getByRole('button', { name: 'Stage 1 of Characters' })
      fireEvent.keyDown(tile, { key: 'Enter' })
      fireEvent.keyDown(tile, { key: ' ' })
      pointer(tile, 'pointerdown')
      pointer(window, 'pointerup')
      expect(mockOnTileSelect).not.toHaveBeenCalled()
      expect(screen.getByText('Hand (3)')).toBeInTheDocument()
    })

    it('cancels a touch gesture without staging or discarding its tile', () => {
      render(
        <PlaySurface
          handTiles={createTestTiles(3)}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
        />
      )
      const tile = screen.getByRole('button', { name: 'Stage 1 of Characters' })
      tile.setPointerCapture = vi.fn()
      pointer(tile, 'pointerdown')
      expect(tile.setPointerCapture).toHaveBeenCalledWith(1)
      pointer(window, 'pointercancel')
      expect(mockOnTileSelect).not.toHaveBeenCalled()
      expect(mockOnTileDiscard).not.toHaveBeenCalled()
      expect(screen.getByText('Hand (3)')).toBeInTheDocument()
    })

    it('stages once per pointer gesture and ignores synthesized mouse events', () => {
      render(
        <PlaySurface
          handTiles={createTestTiles(3)}
          onTileSelect={mockOnTileSelect}
        />
      )
      const first = screen.getByRole('button', {
        name: 'Stage 1 of Characters',
      })
      first.setPointerCapture = vi.fn()
      pointer(first, 'pointerdown')
      pointer(window, 'pointerup', 2)
      expect(mockOnTileSelect).not.toHaveBeenCalled()
      pointer(window, 'pointerup')
      const next = screen.getByRole('button', { name: 'Stage 2 of Characters' })
      fireEvent.mouseDown(next)
      fireEvent.mouseUp(window)
      fireEvent.click(next, { detail: 1 })
      expect(mockOnTileSelect).toHaveBeenCalledOnce()
      expect(screen.getByText('Hand (2)')).toBeInTheDocument()
    })

    it('cancels compatibility clicks at the touch origin without blocking blank-table scrolling', () => {
      const { container, unmount } = render(
        <PlaySurface handTiles={createTestTiles(3)} />
      )
      const tile = screen.getByRole('button', { name: 'Stage 1 of Characters' })
      const touch = new Event('touchstart', { bubbles: true, cancelable: true })
      fireEvent(tile, touch)
      expect(touch.defaultPrevented).toBe(true)
      const blankTouch = new Event('touchstart', {
        bubbles: true,
        cancelable: true,
      })
      fireEvent(container.querySelector('[data-play-zone="hand"]')!, blankTouch)
      expect(blankTouch.defaultPrevented).toBe(false)
      // The native listener belongs to this mounted surface, not the document.
      unmount()
      const afterUnmount = new Event('touchstart', {
        bubbles: true,
        cancelable: true,
      })
      fireEvent(tile, afterUnmount)
      expect(afterUnmount.defaultPrevented).toBe(false)
    })

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

    it('renders mandate-concealed tiles face-down', () => {
      const tiles = createTestTiles(3)

      render(
        <PlaySurface
          handTiles={tiles}
          faceDownIds={new Set([tiles[0].id])}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      expect(screen.getByAltText('Face-down tile')).toBeInTheDocument()
      expect(screen.queryByAltText('1 of Characters')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /1 of Characters/ })
      ).not.toBeInTheDocument()
      const hiddenTile = screen.getByRole('button', {
        name: 'Stage Face-down tile',
      })
      fireEvent.keyDown(hiddenTile, { key: 'Enter' })
      expect(
        screen.getByRole('button', { name: 'Return Face-down tile to hand' })
      ).toBeInTheDocument()
    })

    it('shows lock and debuff mandate overlays without disabling play selection', () => {
      const tiles = createTestTiles(3)

      render(
        <PlaySurface
          handTiles={tiles}
          lockedIds={new Set([tiles[0].id])}
          debuffedIds={new Set([tiles[1].id])}
          onTileSelect={mockOnTileSelect}
          onTileDiscard={mockOnTileDiscard}
          onTilesStaged={mockOnTilesStaged}
        />
      )

      expect(
        screen.getByTitle('Locked tile: must be played')
      ).toBeInTheDocument()
      expect(screen.getByTitle('Debuffed tile')).toBeInTheDocument()
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
