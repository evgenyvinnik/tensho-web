/**
 * HandRack: the player's tiles. Tap a tile to move it onto the felt (see
 * PlayFelt); tap it there to bring it back. Play hand and REDRAW act on the
 * tiles on the felt.
 *
 * With grouping on, every Pair, Sequence, Straight, Triplet and Quad the
 * scorer would pay for sits together above a bracket in its colour and
 * shape, among the loose tiles of its suit. The groups come from the same
 * search that prices plays, so the rack never promises a group the scorer
 * would not pay for. No status prose: the shape is the hint. While a round's
 * deal is still flying tiles in, the brackets wait (keeping their place) and
 * fade in a beat after the last tile lands.
 *
 * @module components/gameplay/HandRack
 */

import {
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Tile } from '../../core/Tile'
import { AnimatedTile } from '../tiles/AnimatedTile'
import { tileSizes, type TileSize } from '../../styles/theme'
import { tileName } from '../../i18n/tileText'
import type { PartialHandRules } from '../../rules/PartialHandParser'
import { groupHand, type HandClusterKind } from '../../gameplay/handGroups'
import { useHandTileSize } from '../../hooks/useHandTileSize'
import { useNoLoneTile } from '../../hooks/useNoLoneTile'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import {
  recordTilePositions,
  useKeepInPlace,
  useTileFlights,
} from '../../animations/useTileFlights'
import { PlayFelt } from './PlayFelt'

export interface HandRackProps {
  tiles: Tile[]
  selectedIds: ReadonlySet<string>
  faceDownIds?: ReadonlySet<string>
  lockedIds?: ReadonlySet<string>
  debuffedIds?: ReadonlySet<string>
  onToggle: (tile: Tile) => void
  /** Group rules when grouping is on; null shows the rack in plain order. */
  groupRules?: PartialHandRules | null
  disabled?: boolean
  /** Shown between the felt and the rack, e.g. Select all. */
  rackHeader?: ReactNode
  /**
   * Hold the group brackets back while the deal flies the tiles in; they keep
   * their space, then fade in once this turns false.
   */
  hintsHeld?: boolean
}

/** After the deal lands, the group brackets wait this long, then fade in. */
export const HINT_FADE_DELAY_MS = 250
export const HINT_FADE_MS = 350

/** Bracket colour per group; the bracket's style also differs by kind. */
export const GROUP_COLORS: Record<HandClusterKind, string> = {
  pair: '#7dd3fc',
  sequence: '#6ee7b7',
  straight: '#a5b4fc',
  triplet: '#fcd34d',
  quad: '#f0abfc',
  // Secret: rack groups never show one (see parsePartialHand).
  honors: '#c4b5fd',
  loose: 'transparent',
}

/** Distinct bracket shapes, so a group is readable without colour. */
const GROUP_BORDER: Record<HandClusterKind, string> = {
  pair: 'solid',
  sequence: 'dashed',
  straight: 'double',
  triplet: 'solid',
  quad: 'double',
  honors: 'dotted',
  loose: 'none',
}

/**
 * Renders nothing: keeps the rack still while the felt above it changes.
 * Rendered ahead of the felt so it runs before any flight is measured.
 */
function RackAnchor({
  rack,
  selection,
}: {
  rack: RefObject<HTMLElement | null>
  selection: string
}) {
  useKeepInPlace(rack, selection)
  return null
}

export function HandRack({
  tiles,
  selectedIds,
  faceDownIds = new Set(),
  lockedIds = new Set(),
  debuffedIds = new Set(),
  onToggle,
  groupRules = null,
  disabled = false,
  rackHeader,
  hintsHeld = false,
}: HandRackProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const rackRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  // In the order they were picked.
  const feltTiles = useMemo(
    () =>
      [...selectedIds].flatMap((id) => tiles.filter((tile) => tile.id === id)),
    [tiles, selectedIds]
  )
  // Grouped from the whole hand: a selected tile leaves an empty slot, so
  // nothing in the rack shifts under the next tap.
  const clusters = useMemo(
    () => (groupRules ? groupHand(tiles, faceDownIds, groupRules) : null),
    [tiles, faceDownIds, groupRules]
  )
  const suitBreaks = (clusters ?? []).filter(
    (cluster, index, all) => index > 0 && cluster.suit !== all[index - 1].suit
  ).length
  const fitted: TileSize = useHandTileSize(
    containerRef,
    tiles.length,
    clusters ? clusters.filter((c) => c.kind !== 'loose').length + 1 : 0,
    16,
    true,
    suitBreaks
  )
  // Ahead of the flights, so tiles fly to the rows they finally take.
  useNoLoneTile(
    containerRef,
    rackRef,
    [
      fitted,
      ...(clusters ?? [{ kind: 'loose', tiles }]).map(
        (cluster) =>
          `${cluster.kind}:${cluster.tiles.map((tile) => tile.id).join(',')}`
      ),
      [...selectedIds].join(','),
    ].join(' ')
  )
  useTileFlights(
    containerRef,
    tiles
      .filter((tile) => !selectedIds.has(tile.id))
      .map((tile) => tile.id)
      .join(' '),
    reducedMotion
  )
  const dimensions = tileSizes[fitted]
  const slotWidth = Math.max(44, dimensions.width)

  const renderTile = (tile: Tile) => {
    const slotStyle = {
      width: slotWidth,
      minHeight: Math.max(44, dimensions.height) + 10,
      paddingTop: 10,
    }
    // On the felt: its place in the rack waits, empty, for it to come back.
    if (selectedIds.has(tile.id))
      return (
        <span
          key={tile.id}
          data-rack-slot={tile.id}
          aria-hidden="true"
          className="relative flex shrink-0 items-end justify-center"
          style={slotStyle}
        >
          <span
            className="rounded-md border-2 border-dashed border-white/20 bg-black/15"
            style={{ width: dimensions.width, height: dimensions.height }}
          />
        </span>
      )
    return (
      <button
        key={tile.id}
        type="button"
        data-play-tile={tile.id}
        aria-pressed={false}
        disabled={disabled}
        aria-label={tileName(tile, t, faceDownIds.has(tile.id))}
        onClick={() => {
          recordTilePositions()
          onToggle(tile)
        }}
        className="relative flex shrink-0 items-end justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        style={slotStyle}
      >
        <AnimatedTile
          tile={tile}
          size={fitted}
          faceDown={faceDownIds.has(tile.id)}
          locked={lockedIds.has(tile.id)}
          debuffed={debuffedIds.has(tile.id)}
          disabled={disabled}
        />
      </button>
    )
  }

  const groupLabel = (kind: HandClusterKind, count: number) =>
    `${t(`melds.${kind}`, kind)}${count > 1 ? ` ×${count}` : ''}`

  return (
    <>
      <RackAnchor rack={containerRef} selection={[...selectedIds].join(' ')} />
      {/* The felt takes the middle of the table's free space, not the edge
          of the rack, so the play sits near the centre of the screen. */}
      <div data-felt-area className="flex flex-1 flex-col justify-center">
        <PlayFelt
          tiles={feltTiles}
          faceDownIds={faceDownIds}
          lockedIds={lockedIds}
          debuffedIds={debuffedIds}
          onToggle={onToggle}
          size={fitted}
          disabled={disabled}
        />
      </div>
      {rackHeader}
      <div
        ref={containerRef}
        data-play-zone="hand"
        data-tutorial="hand"
        className="w-full"
      >
        <div
          ref={rackRef}
          data-hand-rack
          role="group"
          aria-label={t('gameplay.yourTiles', 'Your tiles')}
          className={`flex w-full flex-wrap items-start justify-center py-1 ${
            clusters ? 'gap-x-1 gap-y-1' : 'gap-1'
          }`}
        >
          {clusters
            ? clusters.flatMap((cluster, index) => [
                ...(index > 0 && cluster.suit !== clusters[index - 1].suit
                  ? [
                      <span
                        key={`suit-break-${cluster.suit ?? 'concealed'}-${index}`}
                        data-rack-suit-break
                        aria-hidden="true"
                        className="shrink-0"
                        style={{ width: 'var(--rack-suit-gap, 8px)' }}
                      />,
                    ]
                  : []),
                ...(cluster.kind === 'loose'
                  ? cluster.tiles.map(renderTile)
                  : [
                      <div
                        key={`${cluster.kind}-${cluster.tiles[0].id}`}
                        data-hand-group={cluster.kind}
                        data-rack-group
                        data-hand-group-count={cluster.groupCount}
                        className="mx-0.5 flex shrink-0 flex-col items-center"
                      >
                        <div
                          className="flex"
                          style={{ gap: 'var(--rack-group-gap, 4px)' }}
                        >
                          {cluster.tiles.map(renderTile)}
                        </div>
                        <span
                          data-hand-group-label
                          data-hint-held={hintsHeld || undefined}
                          aria-hidden="true"
                          className="mt-0.5 w-full rounded-b-md border-x-2 border-b-[3px] pb-0.5 pt-0 text-center text-[9px] font-bold uppercase leading-3 tracking-normal"
                          style={
                            {
                              borderColor: GROUP_COLORS[cluster.kind],
                              borderStyle: GROUP_BORDER[cluster.kind],
                              borderTop: 'none',
                              color: GROUP_COLORS[cluster.kind],
                              // Hidden at once, revealed after a pause.
                              opacity: hintsHeld ? 0 : 1,
                              transition:
                                hintsHeld || reducedMotion
                                  ? 'none'
                                  : `opacity ${HINT_FADE_MS}ms ease-out ${HINT_FADE_DELAY_MS}ms`,
                            } as CSSProperties
                          }
                        >
                          {groupLabel(cluster.kind, cluster.groupCount)}
                        </span>
                      </div>,
                    ]),
              ])
            : tiles.map(renderTile)}
        </div>
      </div>
    </>
  )
}

export default HandRack
