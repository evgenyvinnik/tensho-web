import type { TableDecreeId } from '../../tableloop/types'
import { illustrationAssets } from '../../utils/assets'
import { withBasePath } from '../../utils/basePath'

const DECREE_ART: Partial<Record<TableDecreeId, string>> = {
  echoing_bamboo: 'echoing-bamboo',
  patient_pair: 'patient-pair',
  watch_fire: 'watch-fire',
  terminal_gate: 'terminal-gate',
  gap_bridge: 'gap-bridge',
}

/** Decorative art: the containing control supplies the localized identity. */
export function TableDecreeArt({
  id,
  className = '',
}: {
  id: TableDecreeId
  className?: string
}) {
  const artwork = DECREE_ART[id]
  return (
    <img
      src={
        artwork
          ? withBasePath(`assets/illustrations/table-loop/${artwork}.png`)
          : illustrationAssets.decreeScrolls.RegionalMandate
      }
      alt=""
      aria-hidden="true"
      width={96}
      height={96}
      draggable={false}
      className={`shrink-0 object-contain ${className}`}
    />
  )
}
