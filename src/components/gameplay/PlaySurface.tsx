/**
 * PlaySurface Component
 *
 * A redesigned, intuitive play surface for the Tensho Mahjong Roguelike.
 * Features:
 * - Central staging area where tiles can be freely arranged
 * - Hand area at the bottom with smooth drag-and-drop
 * - Small discard square next to the hand tiles
 * - Clear visual hierarchy and feedback
 */

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated, config } from '@react-spring/web'
import { Tile } from '../../core/Tile'
import { AnimatedTile } from '../tiles/AnimatedTile'
import { TileSize, tileSizes } from '../../styles/theme'
import { useSettingsStore } from '../../stores/settingsStore'
import type { BeginnerSuggestion } from '../../gameplay/beginnerCoach'
import { illustrationAssets } from '../../utils/assets'
import { tileName } from '../../i18n/tileText'
import type { PartialHandRules } from '../../rules/PartialHandParser'
import { groupHand, type HandClusterKind } from '../../gameplay/handGroups'
import { useHandTileSize } from '../../hooks/useHandTileSize'

// =============================================================================
// TYPES
// =============================================================================

export interface PlaySurfaceProps {
  /** Tiles in hand */
  handTiles: Tile[]
  /** Size of tiles; 'fit' picks the largest size the rack has room for. */
  tileSize?: TileSize | 'fit'
  /** Selected tile IDs */
  selectedIds?: Set<string>
  /** Glowing tile IDs (winning tiles) */
  glowingIds?: Set<string>
  /** Tile IDs highlighted by contextual teaching or hint systems */
  highlightedIds?: Set<string>
  /** Tile IDs concealed by active hidden-information effects. */
  faceDownIds?: Set<string>
  /** Tile IDs that must be included in the next play. */
  lockedIds?: Set<string>
  /** Tile IDs whose scoring contributions are suppressed. */
  debuffedIds?: Set<string>
  /** Handler for tile selection */
  onTileSelect?: (tile: Tile) => void
  /** Handler for tile discard */
  onTileDiscard?: (tile: Tile) => void
  /** Handler when tiles are staged for play */
  onTilesStaged?: (tiles: Tile[]) => void
  /** Increment to move the complete hand into the staging zone */
  stageAllRequestId?: number
  /** Exact declaration to stage; omitted for legacy whole-rack requests. */
  stageRequestTileIds?: readonly string[]
  /** Whether interactions are disabled */
  disabled?: boolean
  /** Shanten display text */
  shantenDisplay?: string
  /** Plain-language meaning of the shanten text, for newcomers. */
  shantenHelp?: string
  /** Hands remaining */
  handsRemaining?: number
  /** Discards remaining */
  discardsRemaining?: number
  /** Primary color of the selected table style */
  tableThemeColor?: string
  /** Secondary color of the selected table style */
  tableAccentColor?: string
  /** First-move teaching suggestion derived from the current hand */
  beginnerSuggestion?: BeginnerSuggestion | null
  /** Opens the concise visual tile and pattern guide */
  onOpenBeginnerGuide?: () => void
  onOpenHandBuilder?: () => void
  riichiControl?: React.ReactNode
  /**
   * When set, the rack is laid out as the scorer's groups (Pairs, Sequences,
   * Triplets), each labelled, followed by loose tiles. Null keeps rack order.
   */
  groupRules?: PartialHandRules | null
  /**
   * Content above the staging zone (inventory, guidance, forecast). It shares
   * the board's scroll area, so on short screens the rack below never scrolls
   * out of reach.
   */
  boardHeader?: React.ReactNode
  /** Extra detail under staged tiles (for example why a hand is complete). */
  stagingFooter?: React.ReactNode
  /** Translation function */
  t?: (key: string) => string
  /** Optional legacy preview contract used by embedded play-surface consumers. */
  scorePreview?: {
    points: number
    mult: number
    total: number
    yaku: unknown[]
  }
}

interface DragState {
  pointerId: number
  tile: Tile
  startX: number
  startY: number
  currentX: number
  currentY: number
  originZone: 'hand' | 'staging'
}

type DropZone = 'hand' | 'staging' | 'discard' | null

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Space (px) beyond the staging zone that a pinned rack must leave above it.
 * The board then can always show the whole staging zone, where tapped tiles
 * land; on phones in Safari (390×664, 375×667) the full rack stays on screen
 * with the first-move tip open. Below that, the rack scrolls with the board.
 */
const PINNED_BOARD_MARGIN = 24

/** Label and underline colour per group; loose tiles are never labelled. */
const GROUP_COLORS: Record<HandClusterKind, string> = {
  pair: '#7dd3fc',
  sequence: '#6ee7b7',
  triplet: '#fcd34d',
  quad: '#f0abfc',
  loose: 'transparent',
}

// =============================================================================
// PLAY SURFACE COMPONENT
// =============================================================================

export const PlaySurface: React.FC<PlaySurfaceProps> = ({
  handTiles,
  tileSize: requestedTileSize = 'medium',
  selectedIds = new Set(),
  glowingIds = new Set(),
  highlightedIds = new Set(),
  faceDownIds = new Set(),
  lockedIds = new Set(),
  debuffedIds = new Set(),
  onTileSelect,
  onTileDiscard,
  onTilesStaged,
  stageAllRequestId = 0,
  stageRequestTileIds,
  disabled = false,
  shantenDisplay = '',
  shantenHelp,
  handsRemaining = 0,
  discardsRemaining = 0,
  tableThemeColor = '#C8B273',
  tableAccentColor = '#2D5F4A',
  beginnerSuggestion = null,
  onOpenBeginnerGuide,
  onOpenHandBuilder,
  riichiControl,
  groupRules = null,
  boardHeader,
  stagingFooter,
  t: _t = (key) => key,
}) => {
  const { t } = useTranslation()
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  // Refs for zone detection
  const containerRef = useRef<HTMLDivElement>(null)
  // Groups are read from the whole rack, not what is left after staging, so
  // tiles neither move nor resize while the player is choosing them.
  const rackGroups = useMemo(
    () => (groupRules ? groupHand(handTiles, faceDownIds, groupRules) : null),
    [handTiles, faceDownIds, groupRules]
  )
  const fittedTileSize = useHandTileSize(
    containerRef,
    handTiles.length,
    rackGroups?.length ?? 0,
    24,
    requestedTileSize === 'fit'
  )
  const tileSize =
    requestedTileSize === 'fit' ? fittedTileSize : requestedTileSize
  const dimensions = tileSizes[tileSize]
  const stagingZoneMinHeight = Math.max(64, dimensions.height + 12)
  const minBoardWindowRef = useRef(0)
  minBoardWindowRef.current = stagingZoneMinHeight + PINNED_BOARD_MARGIN
  const tileTargetWidth = Math.max(44, dimensions.width)
  const beginnerPatternLabel =
    beginnerSuggestion?.kind && beginnerSuggestion.kind !== 'redraw'
      ? t(`melds.${beginnerSuggestion.kind}`, beginnerSuggestion.kind)
      : null

  const discardZoneRef = useRef<HTMLDivElement>(null)
  const stagingZoneRef = useRef<HTMLDivElement>(null)
  const handZoneRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  // Pin the rack only while the board above it keeps a usable window.
  const [rackPinned, setRackPinned] = useState(false)
  const [rackHeight, setRackHeight] = useState(0)
  useLayoutEffect(() => {
    const board = boardRef.current
    const hand = handZoneRef.current
    if (!board || !hand) return
    // On a screen too short to pin the rack (320×568), open on the hand:
    // keep the board at its end while content settles (the tip arrives
    // after mount), until the player first touches or scrolls the board.
    let playerMoved = false
    const markMoved = () => {
      playerMoved = true
    }
    const measure = () => {
      const pinned =
        board.clientHeight - hand.offsetHeight >= minBoardWindowRef.current
      setRackHeight(hand.offsetHeight)
      setRackPinned(pinned)
      if (!pinned && !playerMoved) board.scrollTop = board.scrollHeight
    }
    measure()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(board)
    observer?.observe(hand)
    // Content growth inside the board (tip, notices) resizes its children.
    for (const child of Array.from(board.children)) observer?.observe(child)
    const moves = ['pointerdown', 'wheel', 'touchstart', 'keydown'] as const
    for (const type of moves)
      board.addEventListener(type, markMoved, { passive: true })
    return () => {
      observer?.disconnect()
      for (const type of moves) board.removeEventListener(type, markMoved)
    }
  }, [])

  // Drag state
  const [dragState, setDragState] = useState<DragState | null>(null)
  // Input can finish before React paints the first drag frame. Keep gesture
  // ownership synchronous; state is only its visual projection.
  const dragRef = useRef<DragState | null>(null)
  const [currentDropZone, setCurrentDropZone] = useState<DropZone>(null)

  // Staged tiles (tiles moved to staging area)
  const [stagedTiles, setStagedTiles] = useState<Tile[]>([])
  const handledStageAllRequestRef = useRef(stageAllRequestId)

  useEffect(() => {
    const surface = containerRef.current!
    // Pointerup moves the tile to another parent. A later compatibility click
    // can then hit a different control at the old coordinates (such as Flora).
    // Cancel that native touch default at its origin, while retaining pointer
    // gestures, keyboard/AT activation, and panning on the blank table. React's
    // delegated touch listeners are passive, so this listener must be native.
    const suppressCompatibilityClick = (event: TouchEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('[data-play-tile]')
      ) {
        event.preventDefault()
      }
    }
    surface.addEventListener('touchstart', suppressCompatibilityClick, {
      passive: false,
    })
    return () =>
      surface.removeEventListener('touchstart', suppressCompatibilityClick)
  }, [])

  const toggleStagedTile = useCallback(
    (tile: Tile, originZone: 'hand' | 'staging') => {
      if (disabled) return
      setStagedTiles((previous) =>
        originZone === 'staging'
          ? previous.filter((staged) => staged.id !== tile.id)
          : previous.some((staged) => staged.id === tile.id)
            ? previous
            : [...previous, tile]
      )
      onTileSelect?.(tile)
    },
    [disabled, onTileSelect]
  )

  // Tiles remaining in hand (excluding staged)
  const tilesInHand = useMemo(() => {
    const stagedIds = new Set(stagedTiles.map((t) => t.id))
    return handTiles.filter((t) => !stagedIds.has(t.id))
  }, [handTiles, stagedTiles])

  // The rack keeps every position while tiles are staged: a staged tile
  // leaves an empty slot, so the next tile never moves under the player's
  // finger. A group with a tile on the board keeps its place but loses its
  // label, because what remains in the rack is no longer that group.
  const stagedIds = useMemo(
    () => new Set(stagedTiles.map((tile) => tile.id)),
    [stagedTiles]
  )
  const handClusters = useMemo(() => {
    if (!rackGroups)
      return [{ kind: 'loose' as const, tiles: handTiles, structurePoints: 0 }]
    return rackGroups
  }, [rackGroups, handTiles])

  // Determine which zone a point is in
  const getDropZone = useCallback((x: number, y: number): DropZone => {
    // Check discard zone first (it's a small square, need precise detection)
    if (discardZoneRef.current) {
      const discardRect = discardZoneRef.current.getBoundingClientRect()
      if (
        x >= discardRect.left &&
        x <= discardRect.right &&
        y >= discardRect.top &&
        y <= discardRect.bottom
      ) {
        return 'discard'
      }
    }

    // Both zones can wrap to several rows. Hit-test their rendered bounds,
    // not a fixed-height strip or the space outside the table.
    for (const [zone, ref] of [
      ['hand', handZoneRef],
      ['staging', stagingZoneRef],
    ] as const) {
      const rect = ref.current?.getBoundingClientRect()
      if (
        rect &&
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return zone
      }
    }
    return null
  }, [])

  // Handle drag start
  const handleDragStart = useCallback(
    (tile: Tile, e: React.PointerEvent) => {
      if (disabled || e.button !== 0 || !e.isPrimary || dragRef.current) return

      const { clientX, clientY } = e
      e.currentTarget.setPointerCapture(e.pointerId)

      // Determine origin zone
      const originZone = stagedTiles.some((t) => t.id === tile.id)
        ? 'staging'
        : 'hand'

      const gesture: DragState = {
        pointerId: e.pointerId,
        tile,
        startX: clientX,
        startY: clientY,
        currentX: clientX,
        currentY: clientY,
        originZone,
      }
      dragRef.current = gesture
      setDragState(gesture)
    },
    [disabled, stagedTiles]
  )

  // Handle drag move
  const handleDragMove = useCallback(
    (e: PointerEvent) => {
      const gesture = dragRef.current
      if (!gesture || e.pointerId !== gesture.pointerId) return

      const { clientX, clientY } = e

      const moved = { ...gesture, currentX: clientX, currentY: clientY }
      dragRef.current = moved
      setDragState(moved)

      // Update current drop zone for visual feedback
      const zone = getDropZone(clientX, clientY)
      setCurrentDropZone(zone)
    },
    [getDropZone]
  )

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: PointerEvent) => {
      const gesture = dragRef.current
      if (!gesture || event.pointerId !== gesture.pointerId) return
      // Consume once, before callbacks can synchronously dispatch more input.
      dragRef.current = null
      setDragState(null)
      setCurrentDropZone(null)
      if (disabled) return

      const { tile, originZone, startX, startY } = gesture
      // React may not have painted the final move yet. The release event is
      // authoritative for both the click threshold and the drop target.
      const { clientX: currentX, clientY: currentY } = event

      // Calculate movement distance
      const dx = Math.abs(currentX - startX)
      const dy = Math.abs(currentY - startY)
      const movedDistance = Math.sqrt(dx * dx + dy * dy)

      // If minimal movement (< 10px), treat as a click - toggle staging
      const CLICK_THRESHOLD = 10
      if (movedDistance < CLICK_THRESHOLD) {
        toggleStagedTile(tile, originZone)
        return
      }

      // Otherwise, handle as a drag
      const dropZone = getDropZone(currentX, currentY)
      if (dropZone === 'discard') {
        // Discard the tile
        onTileDiscard?.(tile)
        // Remove from staged if it was there
        setStagedTiles((prev) => prev.filter((t) => t.id !== tile.id))
      } else if (dropZone === 'staging' && originZone === 'hand') {
        // Move from hand to staging
        setStagedTiles((prev) => [...prev, tile])
      } else if (dropZone === 'hand' && originZone === 'staging') {
        // Move from staging back to hand
        setStagedTiles((prev) => prev.filter((t) => t.id !== tile.id))
      }
      // If dropped in same zone, just reset
    },
    [disabled, getDropZone, onTileDiscard, toggleStagedTile]
  )

  // Global event listeners for drag
  useEffect(() => {
    const moveHandler = (e: PointerEvent) => {
      if (e.pointerId !== dragRef.current?.pointerId) return
      e.preventDefault()
      handleDragMove(e)
    }
    const endHandler = (e: PointerEvent) => {
      handleDragEnd(e)
    }
    const cancelHandler = (e: PointerEvent) => {
      if (e.pointerId !== dragRef.current?.pointerId) return
      dragRef.current = null
      setDragState(null)
      setCurrentDropZone(null)
    }

    window.addEventListener('pointermove', moveHandler, { passive: false })
    window.addEventListener('pointerup', endHandler)
    window.addEventListener('pointercancel', cancelHandler)

    return () => {
      window.removeEventListener('pointermove', moveHandler)
      window.removeEventListener('pointerup', endHandler)
      window.removeEventListener('pointercancel', cancelHandler)
    }
  }, [handleDragMove, handleDragEnd])

  // Notify parent when staged tiles change
  useEffect(() => {
    onTilesStaged?.(stagedTiles)
  }, [stagedTiles, onTilesStaged])

  // On a short screen the board may be scrolled to its guidance. A tile that
  // was just staged must still be seen to have landed.
  const stagedCountRef = useRef(stagedTiles.length)
  useEffect(() => {
    const grew = stagedTiles.length > stagedCountRef.current
    stagedCountRef.current = stagedTiles.length
    if (grew)
      stagingZoneRef.current?.scrollIntoView?.({
        block: 'nearest',
        behavior: reducedMotion ? 'auto' : 'smooth',
      })
  }, [stagedTiles.length, reducedMotion])

  // A complete-hand declaration is deliberately two-step: the action bar
  // moves only the declared subset here, then the player confirms it.
  useEffect(() => {
    if (stageAllRequestId <= handledStageAllRequestRef.current) return
    handledStageAllRequestRef.current = stageAllRequestId
    setStagedTiles(
      stageRequestTileIds
        ? handTiles.filter((tile) => stageRequestTileIds.includes(tile.id))
        : [...handTiles]
    )
  }, [stageAllRequestId, stageRequestTileIds, handTiles])

  // Clear staged tiles when hand changes significantly
  useEffect(() => {
    const handIds = new Set(handTiles.map((t) => t.id))
    setStagedTiles((prev) => {
      const filtered = prev.filter((t) => handIds.has(t.id))
      return filtered.length === prev.length ? prev : filtered
    })
  }, [handTiles])

  // Discard zone spring animation
  const discardZoneSpring = useSpring({
    scale: currentDropZone === 'discard' ? 1.1 : 1,
    backgroundColor:
      currentDropZone === 'discard'
        ? 'rgba(255, 87, 34, 0.8)'
        : dragState
          ? 'rgba(255, 87, 34, 0.5)'
          : 'rgba(255, 87, 34, 0.3)',
    borderColor:
      currentDropZone === 'discard'
        ? '#FF5722'
        : dragState
          ? '#FF8A65'
          : '#E64A19',
    config: config.stiff,
    immediate: reducedMotion,
  })

  // Staging zone active state (moved before springs that use it)
  const stagingZoneActive = stagedTiles.length > 0 || dragState !== null

  // Staging zone spring animation
  const stagingZoneSpring = useSpring({
    scale: currentDropZone === 'staging' ? 1.01 : 1,
    borderOpacity:
      currentDropZone === 'staging' ? 1 : stagingZoneActive ? 0.6 : 0.3,
    glowIntensity: currentDropZone === 'staging' ? 0.5 : 0,
    config: config.stiff,
    immediate: reducedMotion,
  })

  // Hand zone spring animation
  const handZoneSpring = useSpring({
    brightness: currentDropZone === 'hand' ? 1.1 : 1,
    config: config.stiff,
    immediate: reducedMotion,
  })

  const beginnerProgress = beginnerSuggestion
    ? beginnerSuggestion.tileIds.filter((tileId) =>
        stagedTiles.some((tile) => tile.id === tileId)
      ).length
    : 0
  const beginnerSuggestionComplete = Boolean(
    beginnerSuggestion &&
    beginnerProgress === beginnerSuggestion.tileIds.length &&
    stagedTiles.length === beginnerSuggestion.tileIds.length
  )

  const renderTile = (tile: Tile, zone: 'hand' | 'staging') => {
    const isDraggingThis = dragState?.tile.id === tile.id
    return (
      <div
        key={tile.id}
        data-play-tile={tile.id}
        data-beginner-highlighted={
          highlightedIds.has(tile.id) ? 'true' : undefined
        }
        className="relative flex shrink-0 cursor-pointer items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        style={{
          width: tileTargetWidth,
          minHeight: Math.max(44, dimensions.height),
          touchAction: 'none',
          zIndex: isDraggingThis ? 1000 : undefined,
          opacity: isDraggingThis ? 0.5 : 1,
        }}
        onPointerDown={(e) => handleDragStart(tile, e)}
        onClick={(event) => {
          // Assistive technology may activate a button without a pointer
          // gesture. Pointer-generated clicks are already settled on
          // pointerup and must not stage twice.
          if (event.detail === 0) toggleStagedTile(tile, zone)
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          toggleStagedTile(tile, zone)
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={t(
          zone === 'hand' ? 'tileDetails.stage' : 'tileDetails.return',
          {
            tile: tileName(tile, t, faceDownIds.has(tile.id)),
          }
        )}
      >
        <AnimatedTile
          tile={tile}
          size={tileSize}
          selected={zone === 'hand' && selectedIds.has(tile.id)}
          highlighted={highlightedIds.has(tile.id)}
          glowing={glowingIds.has(tile.id)}
          faceDown={faceDownIds.has(tile.id)}
          locked={lockedIds.has(tile.id)}
          debuffed={debuffedIds.has(tile.id)}
          disabled={disabled}
        />
      </div>
    )
  }

  const rackSlot = (tile: Tile) =>
    stagedIds.has(tile.id) ? (
      <div
        key={`slot-${tile.id}`}
        data-rack-slot
        aria-hidden="true"
        className="shrink-0 rounded border border-dashed border-white/15 bg-black/10"
        style={{
          width: tileTargetWidth,
          height: Math.max(44, dimensions.height),
        }}
      />
    ) : (
      renderTile(tile, 'hand')
    )

  const groupLabel = (kind: HandClusterKind, points: number) =>
    t('gameplay.groups.label', '{{group}} +{{points}}', {
      group: t(`melds.${kind}`, kind),
      points,
    })

  return (
    <div
      ref={containerRef}
      className="relative flex h-full min-h-0 w-full flex-col select-none"
      style={{
        touchAction: 'pan-y',
      }}
    >
      {/* The board scrolls. When there is room, the rack is pinned to its
          bottom so it never leaves the screen; on very short screens it
          scrolls with everything else instead of hiding the board. */}
      <div
        ref={boardRef}
        data-gameplay-scroll
        data-rack-pinned={rackPinned ? 'true' : undefined}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain scroll-pt-3 [&>*]:shrink-0"
        style={{
          scrollPaddingBottom: rackPinned ? rackHeight + 8 : 8,
        }}
      >
        {boardHeader}
        {/* ===== STAGING/PLAY ZONE ===== */}
        <animated.div
          ref={stagingZoneRef}
          data-play-zone="staging"
          data-table-theme-color={tableThemeColor}
          // Grow to fill the board, but never below its content: a fixed
          // minimum with centred overflow would spill staged tiles upward.
          className="relative mx-1 my-1 flex flex-[1_0_auto] flex-col items-center justify-center rounded-xl border-2 py-2"
          style={{
            minHeight: stagingZoneMinHeight,
            background: `linear-gradient(145deg, ${tableThemeColor}30, ${tableAccentColor}20 48%, rgba(8, 28, 21, 0.62))`,
            borderColor: stagingZoneSpring.borderOpacity.to(
              (o) =>
                `${tableThemeColor}${Math.round(Math.min(1, o) * 190)
                  .toString(16)
                  .padStart(2, '0')}`
            ),
            borderStyle: stagedTiles.length > 0 ? 'solid' : 'dashed',
            transform: stagingZoneSpring.scale.to((s) => `scale(${s})`),
            boxShadow: stagingZoneSpring.glowIntensity.to(
              (i) =>
                `inset 0 0 ${18 + i * 30}px ${tableThemeColor}${Math.round(
                  24 + i * 36
                )
                  .toString(16)
                  .padStart(2, '0')}, 0 0 ${8 + i * 14}px ${tableThemeColor}24`
            ),
          }}
        >
          <span
            data-table-stage-accent
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1 block h-1 w-16 -translate-x-1/2 rounded-full transition-[background-color,box-shadow] duration-500"
            style={{
              backgroundColor: tableThemeColor,
              boxShadow: `0 0 14px ${tableThemeColor}`,
            }}
          />
          {stagedTiles.length > 0 ? (
            <>
              {/* Staged tiles */}
              <div className="flex w-full flex-wrap items-center justify-center gap-1.5 px-2 py-1">
                {stagedTiles.map((tile) => renderTile(tile, 'staging'))}
              </div>
              {beginnerSuggestion ? (
                <div
                  data-beginner-coach
                  data-beginner-suggestion={beginnerSuggestion.kind}
                  className="mx-3 mt-1 max-w-xl rounded-lg border border-amber-300/30 bg-black/25 px-3 py-1.5 text-center"
                >
                  <p className="text-xs font-semibold leading-relaxed text-[var(--color-beige-white)]/80 sm:text-sm">
                    {beginnerSuggestionComplete
                      ? beginnerSuggestion.kind === 'redraw'
                        ? t(
                            'gameplay.beginnerRedrawReady',
                            'Ready — press Redraw to replace these isolated tiles.'
                          )
                        : t(
                            'gameplay.beginnerPatternComplete',
                            'Beautiful — this {{pattern}} earns +{{points}} shape points. Check the forecast, then Play.',
                            {
                              pattern: beginnerPatternLabel,
                              points: beginnerSuggestion.structurePoints,
                            }
                          )
                      : t(
                          'gameplay.beginnerSelectedProgress',
                          '{{current}} of {{total}} glowing tiles staged',
                          {
                            current: beginnerProgress,
                            total: beginnerSuggestion.tileIds.length,
                          }
                        )}
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-center text-sm text-[var(--color-beige-white)] opacity-60">
                  {t('gameplay.tilesReady', '{{count}} tiles ready to play', {
                    count: stagedTiles.length,
                  })}
                </p>
              )}
              {stagingFooter && (
                <div className="mt-1 w-full max-w-xl px-3">{stagingFooter}</div>
              )}
            </>
          ) : beginnerSuggestion ? (
            <div
              data-beginner-coach
              data-beginner-suggestion={beginnerSuggestion.kind}
              className="max-w-xl px-3 text-center"
            >
              <p
                className="game-play-instruction text-sm font-bold sm:text-base"
                style={{
                  color: `color-mix(in srgb, ${tableThemeColor} 42%, white)`,
                  textShadow: `0 0 16px ${tableThemeColor}75`,
                }}
              >
                {beginnerSuggestion.kind === 'redraw'
                  ? t('gameplay.beginnerRedrawTitle', 'Refresh isolated tiles')
                  : t('gameplay.beginnerPatternReady', '{{pattern}} ready', {
                      pattern: beginnerPatternLabel,
                    })}
              </p>
              <p className="mt-0.5 hidden text-sm leading-relaxed text-[var(--color-beige-white)]/70 sm:block">
                {beginnerSuggestion.kind === 'redraw'
                  ? t(
                      'gameplay.beginnerRedrawHelp',
                      'Tap the glowing isolated tiles, then press Redraw to look for a Pair, Sequence, or Triplet.'
                    )
                  : t(
                      'gameplay.beginnerTapGlowing',
                      'Tap the {{count}} glowing tiles below. They already form a scoring shape.',
                      { count: beginnerSuggestion.tileIds.length }
                    )}
              </p>
            </div>
          ) : (
            <div className="px-3 text-center">
              <p
                className="game-play-instruction text-sm font-semibold sm:text-base"
                style={{
                  color: `color-mix(in srgb, ${tableThemeColor} 48%, white)`,
                  textShadow: `0 0 16px ${tableThemeColor}75`,
                }}
              >
                {t('gameplay.stageHint', 'Build your play')}
              </p>
              <p className="mt-0.5 hidden text-xs text-[var(--color-beige-white)] opacity-50 sm:block">
                {t(
                  'gameplay.stageUnlockHint',
                  'Complete hands unlock a two-step Stage Hand declaration'
                )}
              </p>
            </div>
          )}
        </animated.div>

        {/* ===== HAND ZONE ===== */}
        <animated.div
          ref={handZoneRef}
          data-play-zone="hand"
          data-tutorial="hand"
          className={`flex shrink-0 flex-col gap-1 rounded-t-xl px-2 pb-2 pt-1.5 ${
            rackPinned
              ? 'sticky bottom-0 z-10 mt-auto shadow-[0_-10px_24px_rgba(0,0,0,0.35)]'
              : 'relative'
          }`}
          style={{
            // The table's own cloth, nearly opaque so a pinned rack reads.
            backgroundColor:
              'color-mix(in srgb, var(--color-dark-forest) 97%, transparent)',
            filter: handZoneSpring.brightness.to((b) => `brightness(${b})`),
          }}
        >
          {/* Reserve the action column: text/font reflow must not move a drop
            target across the rack while the player is already dragging. */}
          <div className="grid w-full grid-cols-[minmax(0,1fr)_56px] items-center gap-2">
            {/* One row everywhere: phones scroll it sideways instead of
              spending a second row of rack height on secondary buttons. */}
            <div className="scroll-rail flex min-w-0 items-center gap-x-2 overflow-x-auto pl-3 sm:flex-wrap sm:pl-0 sm:gap-x-3 sm:gap-y-1 sm:overflow-visible [&>*]:shrink-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="whitespace-nowrap text-sm leading-5 text-[var(--color-beige-white)] opacity-70">
                  {t('gameplay.handCount', 'Hand ({{count}})', {
                    count: tilesInHand.length,
                  })}
                </span>
                <span
                  data-tutorial="hands-remaining"
                  title={t('gameplay.handsRemaining', 'Hands remaining')}
                  className="shrink-0 text-sm leading-5 text-blue-400"
                >
                  🖐 {handsRemaining}
                </span>
              </div>

              {shantenDisplay && (
                <div
                  data-shanten-display
                  title={shantenHelp}
                  className="max-w-full rounded-full border border-[var(--color-metallic-gold)] bg-[var(--color-dark-forest)] px-2 py-0.5"
                >
                  <span className="block whitespace-nowrap text-sm font-bold leading-5 text-[var(--color-golden-yellow)]">
                    {shantenDisplay}
                  </span>
                  {shantenHelp && (
                    <span className="sr-only">{shantenHelp}</span>
                  )}
                </div>
              )}
              <div className="flex gap-1.5 sm:max-w-full sm:flex-wrap">
                {onOpenBeginnerGuide && (
                  <button
                    type="button"
                    data-open-beginner-guide
                    onClick={onOpenBeginnerGuide}
                    aria-label={t('gameplay.learnPatterns', 'Learn the tiles')}
                    title={t('gameplay.learnPatterns', 'Learn the tiles')}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-metallic-gold)]/45 bg-black/20 px-2 text-xs font-semibold text-[var(--color-metallic-gold)] transition-colors hover:border-[var(--color-golden-yellow)] hover:text-[var(--color-golden-yellow)]"
                  >
                    <img
                      src={illustrationAssets.beginnerGuidebook}
                      alt=""
                      width={28}
                      height={28}
                      className="h-7 w-7 shrink-0 object-contain"
                    />
                    <span aria-hidden="true" className="hidden md:inline">
                      {t('gameplay.learnPatterns', 'Learn the tiles')}
                    </span>
                  </button>
                )}
                {onOpenHandBuilder && (
                  <button
                    type="button"
                    data-open-hand-builder
                    onClick={onOpenHandBuilder}
                    className="min-h-11 shrink-0 whitespace-nowrap rounded-lg border border-amber-200/35 px-2 py-1 text-left text-sm text-amber-200 sm:max-w-full sm:whitespace-normal sm:[overflow-wrap:anywhere]"
                  >
                    {t('handBuilder.title')}
                  </button>
                )}
                {riichiControl}
              </div>
            </div>
            <animated.div
              ref={discardZoneRef}
              data-play-zone="discard"
              className="flex h-11 w-14 items-center justify-center gap-1 self-start rounded-lg border-2 border-dashed px-2"
              style={{
                transform: discardZoneSpring.scale.to((s) => `scale(${s})`),
                backgroundColor: discardZoneSpring.backgroundColor,
                borderColor: discardZoneSpring.borderColor,
              }}
              title={t('gameplay.discard', 'Discard')}
            >
              <span aria-hidden="true">🗑️</span>
              <span
                data-tutorial="discards-remaining"
                className="text-xs font-bold text-white"
              >
                {discardsRemaining}
              </span>
            </animated.div>
          </div>

          {/* Wrap whole tiles instead of hiding identities beneath a fan. With
            tile hints on, each group the scorer would pay for sits together
            above a labelled underline, and loose tiles follow unmarked. */}
          <div
            data-hand-rack
            className={`flex w-full flex-wrap items-start justify-center py-1 ${
              groupRules ? 'gap-x-1 gap-y-1.5' : 'gap-1.5'
            }`}
            style={{ minHeight: dimensions.height + 8 }}
          >
            {groupRules
              ? handClusters.map((cluster, index) =>
                  cluster.kind === 'loose' ? (
                    // Loose tiles wrap one by one so rows stay full.
                    cluster.tiles.map(rackSlot)
                  ) : (
                    <div
                      key={`${cluster.kind}-${cluster.tiles[0]?.id ?? index}`}
                      data-hand-group={
                        cluster.tiles.some((tile) => stagedIds.has(tile.id))
                          ? undefined
                          : cluster.kind
                      }
                      data-rack-group
                      className="mx-1 flex shrink-0 flex-col items-center"
                      style={{
                        width:
                          cluster.tiles.length * tileTargetWidth +
                          (cluster.tiles.length - 1) * 4,
                      }}
                    >
                      <div className="flex gap-1">
                        {cluster.tiles.map(rackSlot)}
                      </div>
                      <span
                        data-hand-group-label
                        className="mt-0.5 h-7 w-full whitespace-normal break-words border-t-2 pt-0.5 text-center text-[10px] font-bold uppercase leading-3 tracking-normal"
                        style={{
                          visibility: cluster.tiles.some((tile) =>
                            stagedIds.has(tile.id)
                          )
                            ? 'hidden'
                            : 'visible',
                          borderColor: GROUP_COLORS[cluster.kind],
                          color: GROUP_COLORS[cluster.kind],
                        }}
                      >
                        {groupLabel(cluster.kind, cluster.structurePoints)}
                      </span>
                    </div>
                  )
                )
              : handTiles.map(rackSlot)}
          </div>
        </animated.div>
      </div>

      {/* ===== DRAGGING TILE OVERLAY ===== */}
      {dragState && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: dragState.currentX - dimensions.width / 2,
            top: dragState.currentY - dimensions.height / 2,
            zIndex: 9999,
            transform: 'scale(1.15)',
            filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4))',
          }}
        >
          <AnimatedTile
            tile={dragState.tile}
            size={tileSize}
            selected={
              dragState.originZone === 'hand' &&
              selectedIds.has(dragState.tile.id)
            }
            glowing={glowingIds.has(dragState.tile.id)}
            faceDown={faceDownIds.has(dragState.tile.id)}
            locked={lockedIds.has(dragState.tile.id)}
            debuffed={debuffedIds.has(dragState.tile.id)}
            disabled
          />
        </div>
      )}
    </div>
  )
}

export default PlaySurface
