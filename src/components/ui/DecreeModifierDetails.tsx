import { useTranslation } from 'react-i18next'
import {
  decreeModifierText,
  type DecreeModifierSource,
} from '../../i18n/decreeModifiers'

export function DecreeModifierDetails({
  decree,
  id,
}: {
  decree: DecreeModifierSource
  id?: string
}) {
  const { t, i18n } = useTranslation()
  const entries = decreeModifierText(decree, t, i18n.language)
  if (!entries.length) return null
  return (
    <dl
      id={id}
      data-decree-modifiers
      className="mt-3 space-y-2 rounded-lg border border-amber-200/20 bg-black/20 p-2.5 text-left text-xs leading-relaxed break-words"
    >
      {entries.map((entry) => (
        <div key={entry.kind}>
          <dt className="font-bold text-[var(--color-golden-yellow)]">
            {entry.name}
          </dt>
          <dd className="text-[var(--color-beige-white)]/90">
            {entry.description}
          </dd>
        </div>
      ))}
    </dl>
  )
}
