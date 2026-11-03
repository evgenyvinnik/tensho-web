import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { ALL_DECREES, DecreeSystem } from '../../systems/DecreeSystem'
import { DecreeCardCompact } from '../gameplay/DecreeBar'
import { YakuRepetitionDetails } from './YakuRepetitionDetails'
import { PLAY_PATTERN_IDS } from '../../rules/PlayPattern'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})
it.each(SUPPORTED_LANGUAGES)(
  'localizes every play pattern streak and the exact rule in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    for (const key of ['name', 'description', 'title', 'streak', 'empty'])
      expect(
        i18n.getResource(language, 'translation', `yakuRepetition.${key}`)
      ).toBeTruthy()
    // Older saves can still list Yaku: they are not play patterns.
    const history = {
      previousRoundYakuIds: new Set([...PLAY_PATTERN_IDS, 'ittsu']),
      previousRoundYakuStreaks: { two_pairs: 3 },
    }
    const { container } = render(<YakuRepetitionDetails history={history} />)
    expect(container.querySelectorAll('[data-yaku-streak]')).toHaveLength(
      PLAY_PATTERN_IDS.length
    )
    expect(container.querySelector('[data-yaku-streak="ittsu"]')).toBeNull()
    expect(container).not.toHaveTextContent('two_pairs')
    expect(container).not.toHaveTextContent('patterns.')
    expect(
      container.querySelector('[data-yaku-streak="two_pairs"]')
    ).toHaveTextContent(
      i18n.t('yakuRepetition.streak', {
        name: i18n.t('patterns.two_pairs.name'),
        rounds: 3,
      })
    )
    cleanup()
    const decree = new DecreeSystem().acquireDecree(
      ALL_DECREES.find((d) => d.id === 'yaku_repetition_charter')!
    )!
    const { rerender } = render(
      <DecreeCardCompact decree={decree} yakuHistory={history} />
    )
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: i18n.t('yakuRepetition.name') })
      )
    })
    expect(screen.getByRole('dialog')).toHaveTextContent(
      i18n.t('yakuRepetition.description')
    )
    expect(
      screen.getByRole('dialog').querySelector('[data-yaku-repetition-details]')
    ).not.toBeNull()
    rerender(
      <DecreeCardCompact decree={decree} yakuHistory={history} faceDown />
    )
    expect(document.querySelector('[data-yaku-repetition-details]')).toBeNull()
    expect(
      document.querySelector('img[src$="yaku-repetition.webp"]')
    ).toBeNull()
  }
)
