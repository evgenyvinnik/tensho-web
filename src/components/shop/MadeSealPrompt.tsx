/**
 * MadeSealPrompt: a Seal the run makes is used the moment it is made.
 *
 * A Purple tile redrawn at the table, the Seal of the Emperor or the Seal of
 * the Fool can make a Fate Seal. One that needs no tiles has already worked
 * in the engine by the time this hears of it, and is announced. One that
 * takes tiles waits only for the player's choice: the wall picker opens at
 * once, with no cancel, so no Seal is ever held for later.
 *
 * @module components/shop/MadeSealPrompt
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tile } from '../../core/Tile'
import { FATE_SEALS, type FateSeal } from '../../systems/FateSealSystem'
import { useGameEvent } from '../../game/useGameController'
import { useDecreeRevealQueue } from '../../game/decreeRevealQueue'
import { useOrbRevealQueue } from '../../game/orbRevealQueue'
import { consumableTargetRange } from '../../gameplay/consumableTargeting'
import { previewWallSeal, type SealedTile } from '../../gameplay/wallSeals'
import { consumableMessage } from '../gameplay/consumableMessages'
import { SealWallDialog } from './SealWallDialog'

export interface UsedSeal {
  seal: FateSeal
  changes: SealedTile[]
}

export interface MadeSealPromptProps {
  /** Seals the run made that still wait on wall tiles, oldest first. */
  seals: readonly FateSeal[]
  /** The run's wall as the next Seal will find it. */
  wall: readonly Tile[]
  /** Holds the picker back while another dialog has the screen. */
  paused?: boolean
  /** Lay a waiting Seal on these tiles; why it was refused, or null. */
  settle: (instanceId: string, targets: string[]) => string | null
  /** Seals that have just worked, with what each made of the wall. */
  onUsed: (used: UsedSeal[]) => void
}

export function MadeSealPrompt({
  seals,
  wall,
  paused = false,
  settle,
  onUsed,
}: MadeSealPromptProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  // A Decree or Orb the same use made is revealed first.
  const decreeShowing = useDecreeRevealQueue((state) => state.queue.length > 0)
  const orbShowing = useOrbRevealQueue((state) => state.queue.length > 0)
  const waiting = paused || decreeShowing || orbShowing
  // A Seal settled here is announced here, with its tiles.
  const settling = useRef(false)
  const next = seals[0]
  const takesTiles = next ? consumableTargetRange(next.effect).max > 0 : false

  const lay = useCallback(
    (seal: FateSeal, targets: string[]) => {
      const changes = previewWallSeal(seal, wall, targets)
      settling.current = true
      let refusal: string | null
      try {
        refusal = settle(seal.instanceId, targets)
      } finally {
        settling.current = false
      }
      setError(refusal && consumableMessage(refusal, t))
      if (!refusal) onUsed([{ seal, changes }])
    },
    [wall, settle, onUsed, t]
  )

  // A made Seal that needs no tiles works in the engine as it is made. It is
  // announced after whatever made it, so the maker's own note comes first.
  useGameEvent(
    'fateSealUsed',
    useCallback(
      ({ sealId, source }) => {
        if (source !== 'generated' || settling.current) return
        const seal = {
          ...FATE_SEALS[sealId],
          instanceId: sealId,
          isUsed: false,
        }
        queueMicrotask(() => onUsed([{ seal, changes: [] }]))
      },
      [onUsed]
    )
  )

  // A save from before Seals were used at once may still hold one that needs
  // no tiles; it works now.
  useEffect(() => {
    if (next && !takesTiles && !waiting) lay(next, [])
  }, [next, takesTiles, waiting, lay])

  if (!next || !takesTiles || waiting) return null
  return (
    <SealWallDialog
      key={next.instanceId}
      seal={next}
      wall={wall}
      confirmLabel={t('consumableUse.confirm')}
      error={error}
      onConfirm={(targets) => lay(next, targets)}
    />
  )
}

export default MadeSealPrompt
