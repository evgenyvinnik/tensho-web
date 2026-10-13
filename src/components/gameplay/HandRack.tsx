/**
 * HandRack: the player's tiles. Tap a tile to select it (it lifts); tap again
 * to put it back. Play hand and REDRAW act on the selection.
 *
 * With grouping on, every Pair, Sequence, Straight, Triplet and Quad the
 * scorer would pay for sits together above a bracket in its colour and
 * shape, among the loose tiles of its suit. The groups come from the same
 * search that prices plays, so the rack never promises a group the scorer
 * would not pay for. No status prose: the shape is the hint.
 *
 * @module components/gameplay/HandRack
 */

import { useMemo, useRef, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Tile } from '../../core/Tile'
import { AnimatedTile } from '../tiles/AnimatedTile'
import { tileSizes, type TileSize } from '../../styles/theme'
import { tileName } from '../../i18n/tileText'
import type { PartialHandRules } from '../../rules/PartialHandParser'
import { groupHand, type HandClusterKind } from '../../gameplay/handGroups'
import { useHandTileSize } from '../../hooks/useHandTileSize'

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
}

/** Bracket colour per group; the bracket's style also differs by kind. */
export const GROUP_COLORS: Record<HandClusterKind, string> = {
  pair: '#7dd3fc',
  sequence: '#6ee7b7',
  straight: '#a5b4fc',
  triplet: '#fcd34d',
  quad: '#f0abfc',
  loose: 'transparent',
}

/** Distinct bracket shapes, so a group is readable without colour. */
const GROUP_BORDER: Record<HandClusterKind, string> = {
  pair: 'solid',
  sequence: 'dashed',
  straight: 'double',
  triplet: 'solid',
  quad: 'double',
  loose: 'none',
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
}: HandRackProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
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
  const dimensions = tileSizes[fitted]
  const slotWidth = Math.max(44, dimensions.width)

  const renderTile = (tile: Tile) => {
    const selected = selectedIds.has(tile.id)
    return (
      <button
        key={tile.id}
        type="button"
        data-play-tile={tile.id}
        data-selected={selected ? 'true' : undefined}
        aria-pressed={selected}
        disabled={disabled}
        aria-label={tileName(tile, t, faceDownIds.has(tile.id))}
        onClick={() => onToggle(tile)}
        className="relative flex shrink-0 items-end justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        style={{
          width: slotWidth,
          minHeight: Math.max(44, dimensions.height) + 10,
          paddingTop: 10,
        }}
      >
        <AnimatedTile
          tile={tile}
          size={fitted}
          selected={selected}
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
    <div
      ref={containerRef}
      data-play-zone="hand"
      data-tutorial="hand"
      className="w-full"
    >
      <div
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
                        aria-hidden="true"
                        className="mt-0.5 w-full rounded-b-md border-x-2 border-b-[3px] pb-0.5 pt-0 text-center text-[9px] font-bold uppercase leading-3 tracking-normal"
                        style={
                          {
                            borderColor: GROUP_COLORS[cluster.kind],
                            borderStyle: GROUP_BORDER[cluster.kind],
                            borderTop: 'none',
                            color: GROUP_COLORS[cluster.kind],
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
  )
}

export default HandRack
