import {
  getDecreeIllustration,
  illustrationAssets,
} from '../../../utils/assets'
import type { DecreeIconProps } from './decree-icons/types'
export type {
  DecreeIconProps,
  IconFn,
  DecreeIconMap,
} from './decree-icons/types'
export function DecreeUniqueIcon({
  decreeId,
  size = 48,
  className = '',
}: DecreeIconProps) {
  return (
    <img
      src={getDecreeIllustration(decreeId) ?? illustrationAssets.codex.decrees}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={size}
      height={size}
      className={`game-illustration object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
export default DecreeUniqueIcon
