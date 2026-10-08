import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { ALL_DECREES, DecreeSystem } from '../../systems/DecreeSystem'
import { DecreeCardCompact } from '../gameplay/DecreeBar'
import { YakuRepetitionDetails } from './YakuRepetitionDetails'
import { RUN_YAKU_IDS } from '../../config/consumableUnlocks'

afterEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
})
it.each(SUPPORTED_LANGUAGES)(
  'localizes all real streak families and the exact rule in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    for (const key of ['name', 'description', 'title', 'streak', 'empty'])
      expect(
        i18n.getResource(language, 'translation', `yakuRepetition.${key}`)
      ).toBeTruthy()
    const history = {
      previousRoundYakuIds: new Set(RUN_YAKU_IDS),
      previousRoundYakuStreaks: { ittsu: 3 },
    }
    const { container } = render(<YakuRepetitionDetails history={history} />)
    expect(container.querySelectorAll('[data-yaku-streak]')).toHaveLength(21)
    expect(container).not.toHaveTextContent('menzen_tsumo')
    expect(container).not.toHaveTextContent('seven_pairs')
    expect(container).not.toHaveTextContent('yaku.')
    expect(
      container.querySelector('[data-yaku-streak="ittsu"]')
    ).toHaveTextContent(
      i18n.t('yakuRepetition.streak', { name: i18n.t('yaku.ittsu'), rounds: 3 })
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
