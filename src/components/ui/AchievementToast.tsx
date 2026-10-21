import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getAchievementDefinition,
  useAchievementStore,
} from '../../stores/achievementStore'
import { useProgressionStore } from '../../stores/progressionStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { getGeneratedArt } from '../../utils/generatedArt'
import { ControlIcon } from './ControlIcon'
import './achievementToast.css'

/** Lives above routes: a round-ending unlock survives the move to the shop.
 * Only new unlock transitions are celebrated, never hydrated save history. */
export function AchievementToast() {
  const [queue, setQueue] = useState<string[]>([])
  const fullUnlock = useProgressionStore((state) => state.fullUnlockEnabled)
  useEffect(
    () =>
      useAchievementStore.subscribe((state, previous) => {
        if (state.achievements === previous.achievements) return
        const fresh = Object.values(state.achievements)
          .filter(
            (item) =>
              item.unlocked &&
              !item.seen &&
              !previous.achievements[item.id]?.unlocked &&
              getAchievementDefinition(item.id)
          )
          .map((item) => item.id)
        setQueue((current) =>
          [...new Set([...current, ...fresh])].filter(
            (id) =>
              state.achievements[id]?.unlocked && !state.achievements[id]?.seen
          )
        )
      }),
    []
  )
  const id = queue[0]
  const dismiss = useCallback(() => {
    if (!id) return
    useAchievementStore.getState().markAsSeen(id)
    setQueue((current) => current.filter((item) => item !== id))
  }, [id])
  return (
    <div
      className="achievement-toast-region"
      aria-live="polite"
      aria-atomic="true"
    >
      {!fullUnlock && id && (
        <AchievementNotice key={id} id={id} onDismiss={dismiss} />
      )}
    </div>
  )
}

function AchievementNotice({
  id,
  onDismiss,
}: {
  id: string
  onDismiss: () => void
}) {
  const { t } = useTranslation()
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(document.hidden)
  const definition = getAchievementDefinition(id)!
  useEffect(() => {
    const update = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => {
    if (hovered || focused || hidden) return
    const timer = setTimeout(onDismiss, 8000)
    return () => clearTimeout(timer)
  }, [hovered, focused, hidden, onDismiss])
  return (
    <article
      className="achievement-toast"
      data-achievement-toast={id}
      data-reduced-motion={reducedMotion || undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false)
      }}
    >
      <img
        className="achievement-toast-art"
        src={getGeneratedArt('achievements', definition.icon)}
        width={80}
        height={80}
        alt=""
        aria-hidden="true"
      />
      <div className="achievement-toast-copy">
        <p className="achievement-toast-eyebrow">
          {t('achievements.earned', 'Achievement unlocked')}
        </p>
        <h2>{t(definition.nameKey)}</h2>
        <p className="achievement-toast-description">
          {t(definition.descriptionKey)}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('common.close')}
        className="achievement-toast-close"
      >
        <ControlIcon name="close" size={18} />
      </button>
    </article>
  )
}
