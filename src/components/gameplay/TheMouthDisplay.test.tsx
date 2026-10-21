import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { HandScorePreview } from './HandScorePreview'
import { PlayToast } from './PlayToast'
import { BossMandateBadge } from './RunHeader'
import { THE_MOUTH } from '../../config/mandateDefinitions'
import { SUPPORTED_LANGUAGES } from '../../i18n'

afterEach(cleanup)

const locales = import.meta.glob<{
  default: {
    mandateConsequence: Record<string, string>
    gameplay: Record<string, string>
  }
}>('../../i18n/locales/*.json', { eager: true })

it.each(SUPPORTED_LANGUAGES)('words the hand-type lock in %s', (lang) => {
  const copy = locales[`../../i18n/locales/${lang}.json`].default
  expect(copy.mandateConsequence.single_play_pattern).toBeTruthy()
  expect(copy.mandateConsequence.single_play_pattern_locked).toContain(
    '{{pattern}}'
  )
  expect(copy.mandateConsequence).not.toHaveProperty('single_yaku_type')
  expect(copy.gameplay.notAllowed).toBeTruthy()
})

const mouth = {
  id: THE_MOUTH.id,
  effect: THE_MOUTH.effect,
  name: THE_MOUTH.name,
  description: THE_MOUTH.description,
}

it('says which hand type The Mouth wants once the first play sets it', () => {
  const { rerender } = render(<BossMandateBadge mandate={mouth} />)
  expect(screen.getByRole('button')).toHaveAccessibleName(
    'The Mouth: One hand type only'
  )
  rerender(<BossMandateBadge mandate={{ ...mouth, lockedPattern: 'pair' }} />)
  expect(screen.getByRole('button')).toHaveAccessibleName(
    'The Mouth: Only Pair scores'
  )
})

it('marks a forbidden hand in the preview, with no points or Mult', () => {
  const { container } = render(
    <HandScorePreview
      preview={{
        pattern: 'sequence',
        points: 0,
        mult: 0,
        total: 0,
        blocked: true,
      }}
      lastPlay={null}
    />
  )
  const section = screen.getByLabelText('Hand score')
  expect(section).toHaveAttribute('data-hand-score-blocked', 'true')
  expect(section).toHaveTextContent('SequenceNot allowed—×—=0')
  expect(
    container.querySelector('[data-hand-score-not-allowed]')
  ).not.toBeNull()
})

it('names a forbidden play in its toast without cheering it', () => {
  render(
    <PlayToast
      toast={{
        id: 1,
        pattern: 'sequence',
        score: 0,
        intensity: 0,
        blocked: true,
      }}
      onDone={() => {}}
    />
  )
  const toast = screen.getByRole('status')
  expect(toast).toHaveAttribute('data-play-toast-blocked', 'true')
  expect(toast).toHaveTextContent('SequenceNot allowed+0')
  expect(toast).not.toHaveTextContent('Sequence!')
})
