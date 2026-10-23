import {
  getCelestialOrbByYaku,
  type YakuCategory,
} from '../../systems/CelestialOrbSystem'
import { getItemArt } from '../../utils/itemArt'

/** The earned family's illustration, shared with its upgrade reveal. */
export function YakuUpgradeArtwork({ family }: { family: YakuCategory }) {
  const orb = getCelestialOrbByYaku(family)
  return (
    <span
      aria-hidden="true"
      data-upgrade-art={family}
      className="block h-full w-full"
    >
      <img
        src={getItemArt('yakuUpgrades', family).src}
        data-upgrade-orb={orb?.id}
        alt=""
        draggable={false}
        className="game-illustration h-full w-full object-contain p-0.5"
      />
    </span>
  )
}
