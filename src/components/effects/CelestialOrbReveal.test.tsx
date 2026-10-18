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
      orbId: 'pluto_orb',
      yakuCategory: 'SevenPairs',
      newLevel: 2,
      source: 'generated',
      levels: [{ yaku: 'SevenPairs', from: 1, to: 2 }],
    })
    eventBus.emit('celestialOrbUsed', {
      orbId: 'pluto_orb',
      yakuCategory: 'SevenPairs',
      newLevel: 2,
      source: 'purchase',
      levels: [],
    })
    expect(useOrbRevealQueue.getState().queue).toEqual([])
    eventBus.emit('celestialOrbUsed', {
      orbId: 'pluto_orb',
      yakuCategory: 'SevenPairs',
      newLevel: 2,
      source: 'purchase',
      levels: [{ yaku: 'SevenPairs', from: 1, to: 2 }],
    })
    eventBus.emit('celestialOrbUsed', {
      orbId: 'black_hole_orb',
      yakuCategory: 'All',
      newLevel: 0,
      source: 'pack_open',
      levels: [
        { yaku: 'Pairs', from: 1, to: 2 },
        { yaku: 'Tanyao', from: 3, to: 4 },
      ],
    })
    const queue = useOrbRevealQueue.getState().queue
    expect(queue.map((entry) => entry.orb.id)).toEqual([
      'pluto_orb',
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
      orbId: 'pluto_orb',
      yakuCategory: 'SevenPairs',
      newLevel: 3,
      source: 'purchase',
      levels: [{ yaku: 'SevenPairs', from: 2, to: 3 }],
    })
    render(<CelestialOrbReveal />)
    const dialog = screen.getByRole('dialog', {
      name: 'Pluto Orb used: Yaku upgraded',
    })
    expect(dialog).toHaveAttribute('data-orb-reveal', 'pluto_orb')
    expect(dialog).toHaveTextContent('Celestial Orb used')
    const row = dialog.querySelector('[data-orb-reveal-level="SevenPairs"]')!
    expect(row).toHaveAttribute('data-orb-reveal-to', '3')
    expect(row).toHaveTextContent('Seven Pairs: level 2 → 3')
    expect(row).toHaveTextContent('+70 base points · +6 Mult')
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
          { yaku: 'Tanyao', from: 1, to: 2 },
          { yaku: 'Kokushi', from: 9, to: 10 },
        ],
      },
      {
        key: 2,
        orb: {
          id: 'pluto_orb',
          name: 'Pluto Orb',
          description: '',
          effect: {
            targetYaku: 'SevenPairs',
            multPerLevel: 3,
            chipsPerLevel: 35,
            description: '',
          },
        },
        levels: [{ yaku: 'SevenPairs', from: 1, to: 2 }],
      },
    ],
  })
  render(<CelestialOrbReveal />)
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveTextContent('Every family +1 level')
  expect(dialog.querySelectorAll('[data-orb-reveal-level]')).toHaveLength(3)
  fireEvent.click(screen.getByRole('button', { name: 'Next (1 more)' }))
  expect(screen.getByRole('dialog')).toHaveAttribute(
    'data-orb-reveal',
    'pluto_orb'
  )
})
