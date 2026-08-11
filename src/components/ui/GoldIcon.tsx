import { illustrationAssets } from '../../utils/assets'

export interface GoldIconProps {
  className?: string
  label?: string
}

/**
 * Tensho's currency mark. The amount beside it remains text so economy
 * information stays readable and localizable at every size.
 */
export function GoldIcon({ className = '', label }: GoldIconProps) {
  return (
    <img
      src={illustrationAssets.currency.gold}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      className={`gold-emblem game-illustration shrink-0 object-contain ${className}`}
      draggable={false}
    />
  )
}

export default GoldIcon
