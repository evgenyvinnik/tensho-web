import { afterEach, describe, expect, it } from 'vitest'
import { eventBus } from '../game/EventBus'
import { VFXSystem } from './VFXSystem'

describe('VFXSystem lifecycle', () => {
  let system: VFXSystem | null = null

  afterEach(() => {
    system?.destroy()
    system = null
  })

  it('subscribes to gameplay events once and fully detaches on destroy', () => {
    system = new VFXSystem()
    const scorePopups: number[] = []
    system.onScorePopup((popup) => scorePopups.push(popup.value))

    system.initialize()
    system.initialize()
    eventBus.emit('roundEnd', { won: true, score: 420, target: 300 })

    expect(scorePopups).toEqual([420])

    system.destroy()
    eventBus.emit('roundEnd', { won: true, score: 900, target: 800 })
    expect(scorePopups).toEqual([420])
  })
})
