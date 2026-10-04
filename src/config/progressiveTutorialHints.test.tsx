import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { describe, expect, it } from 'vitest'
import { SUPPORTED_LANGUAGES } from '../router/routeManifest'
import { ProgressiveHintCard } from '../components/ui/ProgressiveHint'
import { useProgressiveTutorial } from '../hooks/useProgressiveTutorial'
import { getProgressiveHints } from './progressiveTutorialHints'
import { MeldType } from '../core/Meld'

const locales = import.meta.glob('../i18n/locales/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, unknown>>
const resources = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((language) => [
    language,
    { translation: locales[`../i18n/locales/${language}.json`] },
  ])
)
const keys = [
  ...['discard', 'yaku', 'flora', 'shop', 'decrees', 'boss'].flatMap((hint) =>
    ['title', 'content'].map((field) => `progressiveHints.${hint}.${field}`)
  ),
  'progressiveHints.gotIt',
  'progressiveHints.dontShow',
]

describe('localized progressive guidance', () => {
  it.each(SUPPORTED_LANGUAGES)(
    'supplies all contextual copy in %s without fallback',
    async (language) => {
      const i18n = createInstance()
      await i18n.init({ lng: language, fallbackLng: false, resources })
      for (const key of keys) {
        expect(i18n.exists(key), `${language}: ${key}`).toBe(true)
        expect(i18n.t(key).trim()).not.toBe('')
        if (language !== 'en' && key.endsWith('.content'))
          expect(i18n.t(key)).not.toBe(i18n.getFixedT('en')(key))
      }
      const hints = getProgressiveHints(i18n.t, MeldType.Pair)
      for (const hint of hints.slice(1)) {
        expect(hint.title).not.toContain('progressiveHints.')
        expect(hint.content).not.toContain('{{')
      }
    }
  )

  it('translates visible and queued lessons and controls without acknowledging or restarting them', async () => {
    const i18n = createInstance()
    await i18n.init({ lng: 'en', fallbackLng: false, resources })
    function Harness() {
      const { t } = useTranslation()
      const hints = useMemo(() => getProgressiveHints(t), [t])
      const tutorial = useProgressiveTutorial(hints)
      return (
        <>
          <button
            onClick={() => {
              tutorial.triggerHints('firstDiscard')
              tutorial.triggerHints('shopEntered')
            }}
          >
            Queue lessons
          </button>
          <output data-testid="queue">
            {tutorial.hintQueue.map((hint) => hint.id).join(',')}
          </output>
          <ProgressiveHintCard
            hint={tutorial.currentHint}
            queueCount={tutorial.hintQueue.length}
            onDismiss={tutorial.dismissHint}
            onDisableHints={tutorial.disableHints}
          />
        </>
      )
    }
    render(
      <I18nextProvider i18n={i18n}>
        <Harness />
      </I18nextProvider>
    )
    fireEvent.click(screen.getByText('Queue lessons'))
    const english = i18n.getFixedT('en')
    await waitFor(() =>
      expect(
        screen.getByText(english('progressiveHints.discard.content'))
      ).toBeVisible()
    )
    fireEvent.click(screen.getByText(english('progressiveHints.discard.title')))
    await act(() => i18n.changeLanguage('es'))
    const spanish = i18n.getFixedT('es')
    expect(screen.getByTestId('queue')).toHaveTextContent(
      'discard-intro,shop-intro'
    )
    // Changing language must not reopen a deliberately collapsed lesson.
    expect(
      screen.getByText(spanish('progressiveHints.discard.content'))
    ).not.toBeVisible()
    fireEvent.click(screen.getByText(spanish('progressiveHints.discard.title')))
    fireEvent.click(
      screen.getByRole('button', { name: spanish('progressiveHints.gotIt') })
    )
    await waitFor(() =>
      expect(
        screen.getByText(spanish('progressiveHints.shop.content'))
      ).toBeVisible()
    )
    expect(screen.getByTestId('queue')).toHaveTextContent('shop-intro')
    fireEvent.click(
      screen.getByRole('button', { name: spanish('progressiveHints.dontShow') })
    )
    fireEvent.click(screen.getByText('Queue lessons'))
    expect(screen.getByTestId('queue')).toBeEmptyDOMElement()
  })
})
