import type { ComponentProps } from 'react'
import {
  getPavilionEmblem,
  illustrationAssets,
  type PavilionPage,
} from '../../utils/assets'
import { getControlArt, type ControlArtId } from '../../utils/generatedArt'
import type { ControlIcon } from './ControlIcon'

// Reference concepts use the same painted objects as the table, rather than
// generic chart, gamepad, puzzle-piece or document glyphs. Functional symbols
// retain their dedicated jade control art and the owning control's label.
const PAVILION_SYMBOLS: Partial<Record<ControlArtId, string>> = {
  archive: getPavilionEmblem('codex'),
  target: illustrationAssets.settlementLedger,
  puzzle: illustrationAssets.pairsUpgrade,
  coin: illustrationAssets.currency.gold,
  flower: illustrationAssets.plumBloom,
  chart: illustrationAssets.yakuLedger,
  scales: illustrationAssets.tableTools,
  dice: illustrationAssets.wall,
  mask: illustrationAssets.ceruleanBell,
  challenge: illustrationAssets.ceruleanBell,
  tiles: illustrationAssets.wall,
  hand: illustrationAssets.tableTools,
  score: illustrationAssets.settlementLedger,
  collection: illustrationAssets.decreeScrolls.LocalEdict,
  trophy: getPavilionEmblem('achievements'),
}

type IconProps = Omit<ComponentProps<typeof ControlIcon>, 'name'>

function PaintedIcon({
  src,
  size = 28,
  className = '',
  style,
  ...dataAttributes
}: IconProps & { src: string }) {
  return (
    <img
      {...dataAttributes}
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      className={`inline-block shrink-0 object-contain align-middle ${className}`}
      style={{ width: size, height: size, ...style }}
    />
  )
}

export function PavilionIcon({
  name,
  ...props
}: ComponentProps<typeof ControlIcon>) {
  return (
    <PaintedIcon
      {...props}
      data-pavilion-symbol={name}
      src={PAVILION_SYMBOLS[name] ?? getControlArt(name)}
    />
  )
}

/** A pavilion room's emblem at icon size, e.g. beside its menu entry. */
export function PavilionPageIcon({
  page,
  ...props
}: IconProps & { page: PavilionPage }) {
  return (
    <PaintedIcon
      {...props}
      data-pavilion-page={page}
      src={getPavilionEmblem(page)}
    />
  )
}
