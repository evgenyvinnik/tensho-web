import type { ComponentProps } from 'react'
import { illustrationAssets } from '../../utils/assets'
import { getControlArt, type ControlArtId } from '../../utils/generatedArt'
import { withBasePath } from '../../utils/basePath'
import type { ControlIcon } from './ControlIcon'

// Reference concepts use the same painted objects as the table, rather than
// generic chart, gamepad, puzzle-piece or document glyphs. Functional symbols
// retain their dedicated jade control art and the owning control's label.
const PAVILION_SYMBOLS: Partial<Record<ControlArtId, string>> = {
  archive: withBasePath('assets/illustrations/pavilion/codex.webp'),
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
  trophy: withBasePath('assets/illustrations/pavilion/achievements.webp'),
}

export function PavilionIcon({
  name,
  size = 28,
  className = '',
  style,
}: ComponentProps<typeof ControlIcon>) {
  return (
    <img
      data-pavilion-symbol={name}
      src={PAVILION_SYMBOLS[name] ?? getControlArt(name)}
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
