import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { CelestialOrbReveal } from './CelestialOrbReveal'
import {
  installOrbRevealQueue,
  useOrbRevealQueue,
} from '../../game/orbRevealQueue'
import { eventBus } from '../../game/EventBus'
import { changeLanguage } from '../../i18n'
import { useSettingsStore } from '../../stores/settingsStore'
import { CELESTIAL_ORBS } from '../../systems/CelestialOrbSystem'

afterEach(async () => {
  eventBus.clear()
  useOrbRevealQueue.setState({ queue: [] })
  await act(async () => {
    useSettingsStore.setState({ reducedMotion: false })
    await changeLanguage('en')
  })
})

it('queues only Tea House uses that changed a level, and forgets them on load', () => {
  const uninstall = installOrbRevealQueue()
  try {
    eventBus.emit('celestialOrbUsed', {
      orbId: 'planet_x_orb',
      yakuCategory: 'ThreePairs',
      newLevel: 2,
      source: 'generated',
      levels: [{ yaku: 'ThreePairs', from: 1, to: 2 }],
      onAcquire: false,
    })
    // A bought Orb from an older save, used from the rail at the table.
    eventBus.emit('celestialOrbUsed', {
      orbId: 'planet_x_orb',
      yakuCategory: 'ThreePairs',
      newLevel: 2,
      source: 'purchase',
      levels: [{ yaku: 'ThreePairs', from: 1, to: 2 }],
      onAcquire: false,
    })
    eventBus.emit('celestialOrbUsed', {
      orbId: 'planet_x_orb',
      yakuCategory: 'ThreePairs',
      newLevel: 2,
      source: 'purchase',
      levels: [],
      onAcquire: true,
    })
    expect(useOrbRevealQueue.getState().queue).toEqual([])
    eventBus.emit('celestialOrbUsed', {
      orbId: 'planet_x_orb',
      yakuCategory: 'ThreePairs',
      newLevel: 2,
      source: 'purchase',
      levels: [{ yaku: 'ThreePairs', from: 1, to: 2 }],
      onAcquire: true,
    })
    eventBus.emit('celestialOrbUsed', {
      orbId: 'black_hole_orb',
      yakuCategory: 'All',
      newLevel: 0,
      source: 'pack_open',
      onAcquire: true,
      levels: [
        { yaku: 'Pairs', from: 1, to: 2 },
        { yaku: 'TwoSequences', from: 3, to: 4 },
      ],
    })
    const queue = useOrbRevealQueue.getState().queue
    expect(queue.map((entry) => entry.orb.id)).toEqual([
      'planet_x_orb',
      'black_hole_orb',
    ])
    eventBus.emit('gameLoaded', {
      snapshotVersion: 1,
    } as never)
    expect(useOrbRevealQueue.getState().queue).toEqual([])
  } finally {
    uninstall()
  }
})

it('shows the family rising to its new level with its bonus, then dismisses', () => {
  useSettingsStore.setState({ reducedMotion: true })
  const uninstall = installOrbRevealQueue()
  try {
    eventBus.emit('celestialOrbUsed', {
      orbId: 'planet_x_orb',
      yakuCategory: 'ThreePairs',
      newLevel: 3,
      source: 'purchase',
      levels: [{ yaku: 'ThreePairs', from: 2, to: 3 }],
      onAcquire: true,
    })
    render(<CelestialOrbReveal />)
    const dialog = screen.getByRole('dialog', {
      name: 'Planet X Orb used: Yaku upgraded',
    })
    expect(dialog).toHaveAttribute('data-orb-reveal', 'planet_x_orb')
    // The planet names the Orb; the family it raises is the subtitle.
    expect(dialog.querySelector('[data-orb-reveal-family]')?.textContent).toBe(
      'Three Pairs'
    )
    expect(dialog).toHaveTextContent('Celestial Orb used')
    const row = dialog.querySelector('[data-orb-reveal-level="ThreePairs"]')!
    // The engine's level 3 is the family's second upgrade: players count
    // upgrades from 0.
    expect(row).toHaveAttribute('data-orb-reveal-to', '3')
    expect(row).toHaveTextContent('Three Pairs: level 1 → 2')
    const { chipsPerLevel, multPerLevel } = CELESTIAL_ORBS.planet_x_orb.effect
    expect(row).toHaveTextContent(
      `+${chipsPerLevel * 2} base points · +${multPerLevel * 2} Mult`
    )
    expect(dialog).not.toHaveTextContent('Every family')
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useOrbRevealQueue.getState().queue).toEqual([])
  } finally {
    uninstall()
  }
})

it('lists every family Black Hole raised and counts the reveals still waiting', () => {
  useSettingsStore.setState({ reducedMotion: true })
  useOrbRevealQueue.setState({
    queue: [
      {
        key: 1,
        orb: {
          id: 'black_hole_orb',
          name: 'Black Hole Orb',
          description: '',
          effect: {
            targetYaku: 'All',
            multPerLevel: 0,
            chipsPerLevel: 0,
            description: '',
          },
        },
        levels: [
          { yaku: 'Pairs', from: 1, to: 2 },
          { yaku: 'TwoSequences', from: 1, to: 2 },
          { yaku: 'Winds', from: 9, to: 10 },
          { yaku: 'Loose', from: 1, to: 2 },
        ],
      },
      {
        key: 2,
        orb: CELESTIAL_ORBS.planet_x_orb,
        levels: [{ yaku: 'ThreePairs', from: 1, to: 2 }],
      },
    ],
  })
  render(<CelestialOrbReveal />)
  const dialog = screen.getByRole('dialog')
  expect(dialog.querySelector('[data-orb-reveal-family]')?.textContent).toBe(
    'Every family +1 level'
  )
  expect(dialog.querySelectorAll('[data-orb-reveal-level]')).toHaveLength(4)
  // Loose Tiles pays base points for each loose tile, and no Mult.
  const loose = dialog.querySelector('[data-orb-reveal-level="Loose"]')!
  expect(loose).toHaveTextContent('Loose Tiles: level 0 → 1')
  expect(loose).toHaveTextContent(
    `+${CELESTIAL_ORBS.ceres_orb.effect.chipsPerLevel} base points per loose tile`
  )
  expect(loose).not.toHaveTextContent('Mult')
  fireEvent.click(screen.getByRole('button', { name: 'Next (1 more)' }))
  expect(screen.getByRole('dialog')).toHaveAttribute(
    'data-orb-reveal',
    'planet_x_orb'
  )
})
