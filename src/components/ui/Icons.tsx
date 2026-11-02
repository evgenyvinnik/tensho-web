/** Generated raster controls. Functional labels remain live. */
import type { FC } from 'react'
import { ControlIcon } from './ControlIcon'
import { type ControlArtId } from '../../utils/generatedArt'

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
export const VolumeMutedIcon = control('sound-off')
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
}
