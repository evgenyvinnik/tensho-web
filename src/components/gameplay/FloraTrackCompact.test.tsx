import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Tile, TileSuit } from '../../core/Tile'
import { FlowerSystem } from '../../systems/FlowerSystem'
import { SeasonSystem } from '../../systems/SeasonSystem'
import { changeLanguage } from '../../i18n'
import en from '../../i18n/locales/en.json'
import es from '../../i18n/locales/es.json'
import { useSettingsStore } from '../../stores/settingsStore'
import { getTileImagePath } from '../../utils/assets'
import { FloraTrackCompact } from './FloraTrackCompact'

function fixture() {
  const system = new SeasonSystem()
  system.forceSetSeason('Spring')
  const spring = { ...system.getSeasonStack()[0], id: 'spring' }
  system.forceSetSeason('Summer', true)
  const drought = { ...system.getSeasonStack()[0], id: 'drought' }
  system.forceSetSeason('Autumn', true)
  const decay = { ...system.getSeasonStack()[0], id: 'decay' }
  return {
    flowers: new FlowerSystem().getCollection(),
    seasons: [spring, drought, decay, { ...spring, id: 'spring-again' }],
    flowersSuppressed: true,
    flowersProtected: false,
    decayPenalty: 20,
    bambooSummerProtection: false,
  }
}

afterEach(async () => {
  await act(async () => {
    useSettingsStore.setState({ reducedMotion: false })
    await changeLanguage('en')
  })
})

describe('FloraTrackCompact artwork', () => {
  it.each([
    ['en', en],
    ['es', es],
  ] as const)(
    'shows Summer artwork and the earned wall protection without exposing an unearned recipe (%s)',
    async (language, copy) => {
      await changeLanguage(language)
      useSettingsStore.setState({ reducedMotion: true })
      const system = new SeasonSystem()
      system.forceSetSeason('Summer')
      const normal = { ...system.getActiveSeason()!, id: 'normal-summer' }
      system.forceSetSeason('Summer', true)
      const flora = {
        ...fixture(),
        seasons: [normal, ...system.getSeasonStack()],
      }
      const { rerender } = render(<FloraTrackCompact flora={flora} />)
      fireEvent.click(screen.getByTestId('flora-details-trigger'))
      const dialog = screen.getByRole('dialog')
      expect(
        dialog.querySelectorAll('img[src*="summer-fan.webp"]')
      ).toHaveLength(1)
      expect(within(dialog).getByText(copy.flora.details.summer)).toBeVisible()
      expect(dialog.querySelector('[data-summer-sheltered]')).toBeNull()
      expect(within(dialog).queryByText(copy.flora.details.partial)).toBeNull()
      rerender(
        <FloraTrackCompact flora={{ ...flora, bambooSummerProtection: true }} />
      )
      expect(dialog.querySelector('[data-summer-sheltered]')).toHaveTextContent(
        copy.flora.details.summerSheltered
      )
      expect(within(dialog).queryByText(copy.flora.details.summer)).toBeNull()
      expect(within(dialog).getByText(copy.flora.details.drought)).toBeVisible()
    }
  )
  it('does not label normal Winter unfinished now that its power and Flower interaction are connected', () => {
    useSettingsStore.setState({ reducedMotion: true })
    const seasons = new SeasonSystem()
    seasons.forceSetSeason('Winter')
    render(
      <FloraTrackCompact
        flora={{ ...fixture(), seasons: seasons.getSeasonStack() }}
      />
    )
    fireEvent.click(screen.getByTestId('flora-details-trigger'))
    expect(
      within(screen.getByRole('dialog')).queryByText(en.flora.details.partial)
    ).toBeNull()
  })
  it.each([
    ['en', en],
    ['es', es],
  ] as const)(
    'illustrates normal Winter without misrepresenting Frostbite (%s)',
    async (language, copy) => {
      await changeLanguage(language)
      useSettingsStore.setState({ reducedMotion: true })
      const seasons = new SeasonSystem()
      seasons.forceSetSeason('Winter')
      const normal = { ...seasons.getSeasonStack()[0], id: 'normal-winter' }
      seasons.forceSetSeason('Winter', true)
      render(
        <FloraTrackCompact
          flora={{
            ...fixture(),
            seasons: [normal, ...seasons.getSeasonStack()],
          }}
        />
      )
      fireEvent.click(screen.getByTestId('flora-details-trigger'))
      const dialog = screen.getByRole('dialog')
      expect(
        dialog.querySelector('[data-flora-detail-season="normal-winter"]')
      ).toHaveTextContent(copy.flora.details.winter)
      expect(
        dialog.querySelectorAll('img[src*="winter-pine.webp"]')
      ).toHaveLength(1)
      expect(
        within(dialog).getByText(copy.flora.details.frostbite)
      ).toBeVisible()
    }
  )
  it.each([
    ['en', en],
    ['es', es],
  ] as const)(
    'shows normal Autumn resource rules and artwork, without giving them to Decay (%s)',
    async (language, copy) => {
      await changeLanguage(language)
      useSettingsStore.setState({ reducedMotion: true })
      const seasons = new SeasonSystem()
      seasons.forceSetSeason('Autumn')
      const normal = { ...seasons.getSeasonStack()[0], id: 'normal-autumn' }
      seasons.forceSetSeason('Autumn', true)
      render(
        <FloraTrackCompact
          flora={{
            ...fixture(),
            seasons: [normal, ...seasons.getSeasonStack()],
          }}
        />
      )
      fireEvent.click(screen.getByTestId('flora-details-trigger'))
      const dialog = screen.getByRole('dialog')
      const normalRow = dialog.querySelector(
        '[data-flora-detail-season="normal-autumn"]'
      )!
      expect(normalRow).toHaveTextContent(copy.flora.details.autumn)
      expect(
        dialog.querySelectorAll('img[src*="autumn-maple.webp"]')
      ).toHaveLength(1)
      expect(within(dialog).getByText(copy.flora.details.decay)).toBeVisible()
    }
  )
  it.each([2, 3, 4])(
    'marks the shop unlock from the actual %i-Flower bonus',
    (count) => {
      useSettingsStore.setState({ reducedMotion: true })
      const flowers = new FlowerSystem()
      for (let rank = 1; rank <= count; rank++) {
        flowers.addFlower(new Tile(TileSuit.Flower, rank, `flower-${rank}`))
      }
      const flora = { ...fixture(), flowers: flowers.getCollection() }
      const before = JSON.stringify(flora)
      render(<FloraTrackCompact flora={flora} />)
      fireEvent.click(screen.getByTestId('flora-details-trigger'))
      expect(screen.getByTestId('flora-flower-unlock')).toHaveTextContent(
        `${count >= 3 ? '✓ ' : ''}${en.flora.details.setThree}`
      )
      expect(
        screen.getByTestId('flora-flower-unlock').textContent?.startsWith('✓')
      ).toBe(count >= 3)
      expect(JSON.stringify(flora)).toBe(before)
    }
  )
  it.each([
    ['en', en],
    ['es', es],
  ] as const)(
    'describes active Monsoon draws without an unfinished-effect warning (%s)',
    async (language, copy) => {
      await changeLanguage(language)
      useSettingsStore.setState({ reducedMotion: true })
      const seasons = new SeasonSystem()
      seasons.forceSetSeason('Spring', true)
      render(
        <FloraTrackCompact
          flora={{
            ...fixture(),
            seasons: seasons.getSeasonStack(),
            flowersSuppressed: false,
          }}
        />
      )
      fireEvent.click(screen.getByTestId('flora-details-trigger'))
      expect(screen.getByText(copy.flora.details.monsoon)).toBeVisible()
      expect(
        screen.queryByText(copy.flora.details.unwired)
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText(copy.flora.details.partial)
      ).not.toBeInTheDocument()
    }
  )
  it('uses the native Mahjong season tile instead of duplicate illustration art', () => {
    const { container } = render(<FloraTrackCompact flora={fixture()} />)

    const expectedSource = getTileImagePath(TileSuit.Season, 1)
    const seasonTile = Array.from(container.querySelectorAll('img')).find(
      (image) => image.getAttribute('src') === expectedSource
    )

    expect(seasonTile).toBeDefined()
    expect(container.querySelector('img[src*="season-spring.png"]')).toBeNull()
  })

  it.each([
    ['en', en],
    ['es', es],
  ] as const)(
    'shows an ordered, localized stack without mislabelling a normal Season (%s)',
    async (language, copy) => {
      await changeLanguage(language)
      useSettingsStore.setState({ reducedMotion: true })
      const flora = fixture()
      const before = JSON.stringify(flora)
      const { container } = render(<FloraTrackCompact flora={flora} />)
      const spring = container.querySelector('[data-flora-season="spring"]')!
      expect(spring).toHaveAttribute('aria-label', copy.flora.spring)
      expect(spring.querySelector('img')).not.toHaveClass('grayscale')
      expect(
        container.querySelector('[data-flora-season="drought"] img')
      ).toHaveClass('grayscale')
      fireEvent.click(screen.getByTestId('flora-details-trigger'))
      const dialog = screen.getByRole('dialog')
      const rows = Array.from(
        dialog.querySelectorAll('[data-flora-detail-season]')
      )
      expect(
        rows.map((row) => row.getAttribute('data-flora-detail-season'))
      ).toEqual(['spring', 'drought', 'decay', 'spring-again'])
      expect(
        within(rows[1] as HTMLElement).getByText(copy.flora.details.drought)
      ).toBeVisible()
      expect(rows[1]).not.toHaveTextContent(copy.flora.details.summer)
      expect(
        within(rows[2] as HTMLElement).getByText(copy.flora.details.decay)
      ).toBeVisible()
      expect(screen.getByTestId('flora-decay-penalty')).toHaveTextContent('−20')
      expect(screen.getByTestId('flora-suppression')).toHaveTextContent(
        copy.flora.details.suppressed
      )
      expect(screen.getAllByText(copy.flora.details.spring)).toHaveLength(2)
      expect(
        screen.queryByText(copy.flora.details.unwired)
      ).not.toBeInTheDocument()
      expect(
        dialog.querySelectorAll('img[src*="spring-blossom.webp"]')
      ).toHaveLength(2)
      fireEvent.click(screen.getByRole('button', { name: copy.common.close }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByTestId('flora-details-trigger')).toHaveAttribute(
        'aria-expanded',
        'false'
      )
      expect(JSON.stringify(flora)).toBe(before)
    }
  )

  it('shows real doubled Flower rates, protection, and an explicit empty Season state', () => {
    useSettingsStore.setState({ reducedMotion: true })
    const flowers = new FlowerSystem()
    for (const rank of [1, 2, 3, 4])
      flowers.addFlower(new Tile(TileSuit.Flower, rank, 'flower-' + rank))
    const flora = {
      ...fixture(),
      flowers: flowers.getCollection(),
      flowersSuppressed: false,
      flowersProtected: true,
    }
    const { rerender } = render(<FloraTrackCompact flora={flora} />)
    fireEvent.click(screen.getByTestId('flora-details-trigger'))
    expect(screen.getByTestId('flora-suppression')).toHaveTextContent(
      en.flora.details.protected
    )
    expect(screen.getAllByText(/\+10% score/)).toHaveLength(4)
    expect(screen.getAllByText(en.flora.details.collected)).toHaveLength(4)
    rerender(
      <FloraTrackCompact
        flora={{ ...flora, seasons: [], flowersProtected: false }}
      />
    )
    expect(screen.getByText(en.flora.details.noSeasons)).toBeVisible()
    expect(screen.queryByTestId('flora-suppression')).not.toBeInTheDocument()
    expect(screen.queryByTestId('flora-decay-penalty')).not.toBeInTheDocument()
  })
})
