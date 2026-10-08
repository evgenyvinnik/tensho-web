import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import i18n, { loadLanguage, SUPPORTED_LANGUAGES } from '../../i18n'
import { ALL_DECREES, DecreeSystem } from '../../systems/DecreeSystem'
import { runRandom } from '../../game/RunRandom'
import { DecreeCardCompact } from '../gameplay/DecreeBar'
import { RandomCopyDetails } from './RandomCopyDetails'

afterEach(async () => {
  cleanup()
  runRandom.reset()
  await i18n.changeLanguage('en')
})
function fixture() {
  runRandom.start(7)
  const system = new DecreeSystem()
  const target = system.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'decree-ancient-scroll')!
  )!
  const copy = system.acquireDecree(
    ALL_DECREES.find((d) => d.id === 'decree-doppelganger')!
  )!
  return { target, copy, owned: system.getOwnedDecrees() }
}
it.each(SUPPORTED_LANGUAGES)(
  'shows authored rules, physical target and suppression in %s',
  async (language) => {
    await loadLanguage(language)
    await i18n.changeLanguage(language)
    const { copy, owned, target } = fixture()
    const { rerender } = render(
      <RandomCopyDetails decree={copy} owned={owned} />
    )
    for (const key of [
      'description',
      'target',
      'waiting',
      'missing',
      'inactive',
      'rules',
    ])
      expect(
        i18n.getResource(language, 'translation', `randomCopy.${key}`)
      ).toBeTruthy()
    expect(
      screen.getByText(
        i18n.t('randomCopy.target', {
          name: i18n.t(`decrees.items.${target.id}.name`, target.name),
          slot: new Intl.NumberFormat(language).format(1),
        })
      )
    ).toBeVisible()
    expect(screen.getByText(i18n.t('randomCopy.rules'))).toBeVisible()
    rerender(
      <RandomCopyDetails
        decree={copy}
        owned={owned}
        disabledIds={new Set([target.instanceId!])}
      />
    )
    expect(screen.getByText(i18n.t('randomCopy.inactive'))).toBeVisible()
    rerender(<RandomCopyDetails decree={copy} owned={[copy]} />)
    expect(screen.getByText(i18n.t('randomCopy.missing'))).toBeVisible()
    rerender(
      <RandomCopyDetails
        decree={{ ...copy, randomCopyTargetId: null }}
        owned={[copy]}
      />
    )
    expect(screen.getByText(i18n.t('randomCopy.waiting'))).toBeVisible()
  }
)

it('shows the new art and details on tap, but leaks neither while face-down', async () => {
  const { copy, owned } = fixture()
  const { container, rerender } = render(
    <DecreeCardCompact decree={copy} ownedDecrees={owned} />
  )
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    expect.stringMatching(/doppelganger\.webp$/)
  )
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Doppelganger' }))
  )
  expect(
    screen.getByRole('dialog').querySelector('[data-random-copy-details]')
  ).not.toBeNull()
  rerender(<DecreeCardCompact decree={copy} ownedDecrees={owned} faceDown />)
  expect(document.querySelector('img[src$="doppelganger.webp"]')).toBeNull()
  expect(document.querySelector('[data-random-copy-details]')).toBeNull()
})
