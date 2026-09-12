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

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpring, animated, config } from '@react-spring/web'
import { Tile } from '../../core/Tile'
import { AnimatedTile } from '../tiles/AnimatedTile'
import { TileSize, tileSizes } from '../../styles/theme'
import { useSettingsStore } from '../../stores/settingsStore'
import type { BeginnerSuggestion } from '../../gameplay/beginnerCoach'

// =============================================================================
// TYPES
// =============================================================================

export interface PlaySurfaceProps {
  /** Tiles in hand */
  handTiles: Tile[]
  /** Size of tiles */
  tileSize?: TileSize
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
  /** Whether interactions are disabled */
  disabled?: boolean
  /** Shanten display text */
  shantenDisplay?: string
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

// =============================================================================
// PLAY SURFACE COMPONENT
// =============================================================================

export const PlaySurface: React.FC<PlaySurfaceProps> = ({
  handTiles,
  tileSize = 'medium',
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
  disabled = false,
  shantenDisplay = '',
  handsRemaining = 0,
  discardsRemaining = 0,
  tableThemeColor = '#C8B273',
  tableAccentColor = '#2D5F4A',
  beginnerSuggestion = null,
  onOpenBeginnerGuide,
  t: _t = (key) => key,
}) => {
  const { t } = useTranslation()
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const dimensions = tileSizes[tileSize]
  const stagingZoneMinHeight = Math.max(96, dimensions.height + 12)
  const tileTargetWidth = Math.max(44, dimensions.width)
  const beginnerPatternLabel =
    beginnerSuggestion?.kind && beginnerSuggestion.kind !== 'redraw'
      ? t(`melds.${beginnerSuggestion.kind}`, beginnerSuggestion.kind)
      : null

  // Refs for zone detection
  const containerRef = useRef<HTMLDivElement>(null)
  const discardZoneRef = useRef<HTMLDivElement>(null)
  const stagingZoneRef = useRef<HTMLDivElement>(null)
  const handZoneRef = useRef<HTMLDivElement>(null)

  // Drag state
  const [dragState, setDragState] = useState<DragState | null>(null)
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
      if (disabled || e.button !== 0 || !e.isPrimary) return

      const { clientX, clientY } = e
      e.currentTarget.setPointerCapture(e.pointerId)

      // Determine origin zone
      const originZone = stagedTiles.some((t) => t.id === tile.id)
        ? 'staging'
        : 'hand'

      setDragState({
        pointerId: e.pointerId,
        tile,
        startX: clientX,
        startY: clientY,
        currentX: clientX,
        currentY: clientY,
        originZone,
      })
    },
    [disabled, stagedTiles]
  )

  // Handle drag move
  const handleDragMove = useCallback(
    (e: PointerEvent) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return

      const { clientX, clientY } = e

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              currentX: clientX,
              currentY: clientY,
            }
          : null
      )

      // Update current drop zone for visual feedback
      const zone = getDropZone(clientX, clientY)
      setCurrentDropZone(zone)
    },
    [dragState, getDropZone]
  )

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!dragState) return

    const { tile, originZone, startX, startY, currentX, currentY } = dragState

    // Calculate movement distance
    const dx = Math.abs(currentX - startX)
    const dy = Math.abs(currentY - startY)
    const movedDistance = Math.sqrt(dx * dx + dy * dy)

    // If minimal movement (< 10px), treat as a click - toggle staging
    const CLICK_THRESHOLD = 10
    if (movedDistance < CLICK_THRESHOLD) {
      toggleStagedTile(tile, originZone)
      setDragState(null)
      setCurrentDropZone(null)
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

    setDragState(null)
    setCurrentDropZone(null)
  }, [dragState, getDropZone, onTileDiscard, toggleStagedTile])

  // Global event listeners for drag
  useEffect(() => {
    if (dragState) {
      const moveHandler = (e: PointerEvent) => {
        if (e.pointerId !== dragState.pointerId) return
        e.preventDefault()
        handleDragMove(e)
      }
      const endHandler = (e: PointerEvent) => {
        if (e.pointerId === dragState.pointerId) handleDragEnd()
      }
      const cancelHandler = (e: PointerEvent) => {
        if (e.pointerId !== dragState.pointerId) return
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
    }
  }, [dragState, handleDragMove, handleDragEnd])

  // Notify parent when staged tiles change
  useEffect(() => {
    onTilesStaged?.(stagedTiles)
  }, [stagedTiles, onTilesStaged])

  // A complete-hand declaration is deliberately two-step: the action bar
  // moves every tile here first, then the player confirms the staged hand.
  useEffect(() => {
    if (stageAllRequestId <= handledStageAllRequestRef.current) return
    handledStageAllRequestRef.current = stageAllRequestId
    setStagedTiles([...handTiles])
  }, [stageAllRequestId, handTiles])

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

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-full w-full flex-col select-none"
      style={{
        touchAction: 'pan-y',
      }}
    >
      {/* ===== STAGING/PLAY ZONE ===== */}
      <animated.div
        ref={stagingZoneRef}
        data-play-zone="staging"
        data-table-theme-color={tableThemeColor}
        className="relative flex-1 flex flex-col items-center justify-center mx-2 my-2 rounded-xl border-2 py-3"
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
        {stagedTiles.length > 0 ? (
          <>
            {/* Staged tiles */}
            <div className="flex w-full flex-wrap items-center justify-center gap-2 px-2 py-2">
              {stagedTiles.map((tile) => {
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
                      // Assistive technology may activate a button without a
                      // pointer gesture. Pointer-generated clicks are already
                      // settled on pointerup and must not stage twice.
                      if (event.detail === 0) toggleStagedTile(tile, 'staging')
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return
                      event.preventDefault()
                      toggleStagedTile(tile, 'staging')
                    }}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    aria-disabled={disabled}
                    aria-label={`Return ${faceDownIds.has(tile.id) ? t('tiles.faceDown', 'Face-down tile') : tile.displayName} to hand`}
                  >
                    <AnimatedTile
                      tile={tile}
                      size={tileSize}
                      selected={selectedIds.has(tile.id)}
                      highlighted={highlightedIds.has(tile.id)}
                      glowing={glowingIds.has(tile.id)}
                      faceDown={faceDownIds.has(tile.id)}
                      locked={lockedIds.has(tile.id)}
                      debuffed={debuffedIds.has(tile.id)}
                      disabled={disabled}
                    />
                  </div>
                )
              })}
            </div>
            {beginnerSuggestion ? (
              <div
                data-beginner-coach
                data-beginner-suggestion={beginnerSuggestion.kind}
                className="mx-3 mt-2 max-w-xl rounded-lg border border-amber-300/30 bg-black/25 px-3 py-2 text-center"
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
              <p className="mt-2 text-center text-sm text-[var(--color-beige-white)] opacity-60">
                {t('gameplay.tilesReady', '{{count}} tiles ready to play', {
                  count: stagedTiles.length,
                })}
              </p>
            )}
          </>
        ) : (
          <div className="text-center px-3">
            <span
              data-table-stage-accent
              aria-hidden="true"
              className="mx-auto mb-2 block h-1 w-16 rounded-full transition-[background-color,box-shadow] duration-500"
              style={{
                backgroundColor: tableThemeColor,
                boxShadow: `0 0 14px ${tableThemeColor}`,
              }}
            />
            {beginnerSuggestion ? (
              <div
                data-beginner-coach
                data-beginner-suggestion={beginnerSuggestion.kind}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-golden-yellow)]">
                  {t('gameplay.guidedMove', 'Guided first move')}
                </p>
                <p
                  className="game-play-instruction mt-1 text-base font-bold sm:text-xl"
                  style={{
                    color: `color-mix(in srgb, ${tableThemeColor} 42%, white)`,
                    textShadow: `0 0 16px ${tableThemeColor}75`,
                  }}
                >
                  {beginnerSuggestion.kind === 'redraw'
                    ? t(
                        'gameplay.beginnerRedrawTitle',
                        'Refresh isolated tiles'
                      )
                    : t('gameplay.beginnerPatternReady', '{{pattern}} ready', {
                        pattern: beginnerPatternLabel,
                      })}
                </p>
                <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-[var(--color-beige-white)]/65 sm:text-sm">
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
              <>
                <p
                  className="game-play-instruction text-sm font-semibold sm:text-lg"
                  style={{
                    color: `color-mix(in srgb, ${tableThemeColor} 48%, white)`,
                    textShadow: `0 0 16px ${tableThemeColor}75`,
                  }}
                >
                  {t('gameplay.stageHint', 'Build your play')}
                </p>
                <p className="mt-1 hidden text-sm text-[var(--color-beige-white)] opacity-50 sm:block">
                  {t(
                    'gameplay.stageUnlockHint',
                    'Complete hands unlock a two-step Stage Hand declaration'
                  )}
                </p>
              </>
            )}
            {onOpenBeginnerGuide && (
              <button
                type="button"
                data-open-beginner-guide
                onClick={onOpenBeginnerGuide}
                className="mt-2 min-h-9 rounded-full border border-[var(--color-metallic-gold)]/45 bg-black/20 px-3 py-1 text-xs font-semibold text-[var(--color-metallic-gold)] transition-colors hover:border-[var(--color-golden-yellow)] hover:text-[var(--color-golden-yellow)]"
              >
                ? {t('gameplay.learnPatterns', 'Learn the tiles')}
              </button>
            )}
          </div>
        )}
      </animated.div>

      {/* ===== HAND ZONE ===== */}
      <animated.div
        ref={handZoneRef}
        data-play-zone="hand"
        className="relative flex shrink-0 flex-col gap-3 rounded-t-xl px-3 py-3"
        style={{
          backgroundColor: 'rgba(28, 58, 46, 0.8)',
          filter: handZoneSpring.brightness.to((b) => `brightness(${b})`),
        }}
      >
        {/* Secondary controls occupy a real row, never tile hit areas. */}
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[var(--color-beige-white)] text-sm opacity-70">
              {t('gameplay.handCount', 'Hand ({{count}})', {
                count: tilesInHand.length,
              })}
            </span>
            <span
              data-tutorial="hands-remaining"
              className="text-blue-400 text-sm"
            >
              🖐 {handsRemaining}
            </span>
          </div>

          {/* Shanten/Tenpai display - always visible */}
          {shantenDisplay && (
            <div className="px-2 py-1 rounded-full bg-[var(--color-dark-forest)] border border-[var(--color-metallic-gold)]">
              <span className="text-[var(--color-golden-yellow)] font-bold text-sm">
                {shantenDisplay}
              </span>
            </div>
          )}
          <animated.div
            ref={discardZoneRef}
            data-play-zone="discard"
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-lg border-2 border-dashed px-2"
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

        {/* Wrap whole tiles instead of hiding identities beneath a fan. */}
        <div
          className="flex w-full flex-wrap items-center justify-center gap-2 py-2"
          style={{ minHeight: dimensions.height + 16 }}
        >
          {tilesInHand.map((tile) => {
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
                  if (event.detail === 0) toggleStagedTile(tile, 'hand')
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return
                  event.preventDefault()
                  toggleStagedTile(tile, 'hand')
                }}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-disabled={disabled}
                aria-label={`Stage ${faceDownIds.has(tile.id) ? t('tiles.faceDown', 'Face-down tile') : tile.displayName}`}
              >
                <AnimatedTile
                  tile={tile}
                  size={tileSize}
                  selected={selectedIds.has(tile.id)}
                  highlighted={highlightedIds.has(tile.id)}
                  glowing={glowingIds.has(tile.id)}
                  faceDown={faceDownIds.has(tile.id)}
                  locked={lockedIds.has(tile.id)}
                  debuffed={debuffedIds.has(tile.id)}
                  disabled={disabled}
                />
              </div>
            )
          })}
        </div>
      </animated.div>

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
            selected={selectedIds.has(dragState.tile.id)}
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
