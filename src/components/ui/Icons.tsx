/** Generated raster controls and tile-modifier art. Functional labels remain live. */
import type { FC } from 'react'
import { ControlIcon } from './ControlIcon'
import {
  getGeneratedArt,
  type ControlArtId,
  type GeneratedArtCategory,
} from '../../utils/generatedArt'

export interface IconProps {
  className?: string
  size?: number | string
  color?: string
}
function control(name: ControlArtId): FC<IconProps> {
  return function GeneratedControl({ className = 'w-6 h-6', size }) {
    return (
      <ControlIcon
        name={name}
        size={size}
        className={className}
        style={
          size === undefined
            ? { width: undefined, height: undefined }
            : undefined
        }
      />
    )
  }
}
function modifier(category: GeneratedArtCategory, id: string): FC<IconProps> {
  return function GeneratedModifier({ className = 'w-6 h-6', size }) {
    return (
      <img
        src={getGeneratedArt(category, id)}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
}
export const VolumeOnIcon = control('sound')
export const SettingsIcon = control('settings')
export const TrophyIcon = control('trophy')
export const CloseIcon = control('close')
export const MenuIcon = control('home')
export const PlayIcon = control('play')
export const RefreshIcon = control('redraw')
export const ArrowRightIcon = control('next')
export const ArrowLeftIcon = control('back')
export const InfoIcon = control('info')
export const CoinIcon = control('coin')
export const StarIcon = control('score')
export const CheckIcon = control('check')
export const VolumeMutedIcon: FC<IconProps> = ({
  className = 'w-6 h-6',
  size,
}) => (
  <span
    className={`relative inline-block ${className}`}
    style={{ width: size, height: size }}
  >
    <ControlIcon name="sound" size="100%" />
    <ControlIcon name="ban" size="55%" className="absolute bottom-0 right-0" />
  </span>
)
export const PauseIcon: FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <span
    aria-hidden="true"
    className={`inline-flex items-center justify-center font-black ${className}`}
    style={{ width: size, height: size }}
  >
    Ⅱ
  </span>
)
export const PlusIcon: FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <span
    aria-hidden="true"
    className={`inline-flex items-center justify-center font-black ${className}`}
    style={{ width: size, height: size }}
  >
    +
  </span>
)
export const MinusIcon: FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <span
    aria-hidden="true"
    className={`inline-flex items-center justify-center font-black ${className}`}
    style={{ width: size, height: size }}
  >
    −
  </span>
)
export const EnhancementBonusIcon = modifier('enhancements', 'bonus')
export const EnhancementMultIcon = modifier('enhancements', 'mult')
export const EnhancementWildIcon = modifier('enhancements', 'wild')
export const EnhancementGlassIcon = modifier('enhancements', 'glass')
export const EnhancementSteelIcon = modifier('enhancements', 'steel')
export const EnhancementStoneIcon = modifier('enhancements', 'stone')
export const EnhancementGoldIcon = modifier('enhancements', 'gold')
export const EnhancementLuckyIcon = modifier('enhancements', 'lucky')
export const SealGoldIcon = modifier('seals', 'gold')
export const SealRedIcon = modifier('seals', 'red')
export const SealBlueIcon = modifier('seals', 'blue')
export const SealPurpleIcon = modifier('seals', 'purple')
export const EditionFoilIcon = modifier('editions', 'foil')
export const EditionHoloIcon = modifier('editions', 'holographic')
export const EditionPolyIcon = modifier('editions', 'polychrome')
export const EditionNegativeIcon = modifier('editions', 'negative')

export default {
  VolumeOnIcon,
  VolumeMutedIcon,
  SettingsIcon,
  TrophyIcon,
  CloseIcon,
  MenuIcon,
  PlayIcon,
  PauseIcon,
  RefreshIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  InfoIcon,
  CoinIcon,
  StarIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  // Enhancement Icons
  EnhancementBonusIcon,
  EnhancementMultIcon,
  EnhancementWildIcon,
  EnhancementGlassIcon,
  EnhancementSteelIcon,
  EnhancementStoneIcon,
  EnhancementGoldIcon,
  EnhancementLuckyIcon,
  // Seal Icons
  SealGoldIcon,
  SealRedIcon,
  SealBlueIcon,
  SealPurpleIcon,
  // Edition Icons
  EditionFoilIcon,
  EditionHoloIcon,
  EditionPolyIcon,
  EditionNegativeIcon,
}
