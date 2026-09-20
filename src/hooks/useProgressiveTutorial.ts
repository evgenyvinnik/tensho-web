import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  type ProgressiveHint,
  type TutorialTrigger,
  getHintsForTrigger,
  PROGRESSIVE_HINTS_STORAGE_KEY,
  HINTS_DISABLED_STORAGE_KEY,
} from '../config/progressiveTutorialHints'

function readPreferences() {
  const shown = new Set<string>()
  let disabled = false
  try {
    const ids: unknown = JSON.parse(
      localStorage.getItem(PROGRESSIVE_HINTS_STORAGE_KEY) ?? '[]'
    )
    if (Array.isArray(ids))
      for (const id of ids) if (typeof id === 'string') shown.add(id)
  } catch {
    /* Invalid lesson history must not undo an independent opt-out preference. */
  }
  try {
    disabled = localStorage.getItem(HINTS_DISABLED_STORAGE_KEY) === 'true'
  } catch {
    /* Continue in memory. */
  }
  return { shown, disabled }
}

/** Persistent, acknowledged guidance. No reading deadline or timer-driven layout shift. */
export function useProgressiveTutorial(allHints: ProgressiveHint[]) {
  const [state, setState] = useState(() => ({
    ...readPreferences(),
    queue: [] as string[],
  }))
  // Preferences are best-effort; storage restrictions must not break gameplay.
  useEffect(() => {
    try {
      localStorage.setItem(
        PROGRESSIVE_HINTS_STORAGE_KEY,
        JSON.stringify([...state.shown])
      )
      if (state.disabled)
        localStorage.setItem(HINTS_DISABLED_STORAGE_KEY, 'true')
      else localStorage.removeItem(HINTS_DISABLED_STORAGE_KEY)
    } catch {
      /* Continue in memory. */
    }
  }, [state.shown, state.disabled])

  const triggerHints = useCallback(
    (trigger: TutorialTrigger) => {
      const candidates = getHintsForTrigger(allHints, trigger).map(
        (hint) => hint.id
      )
      setState((current) => {
        if (current.disabled) return current
        const additions = candidates.filter(
          (id) => !current.shown.has(id) && !current.queue.includes(id)
        )
        return additions.length
          ? {
              ...current,
              queue: [...current.queue, ...additions].sort(
                (a, b) =>
                  (allHints.find((hint) => hint.id === a)?.priority ?? 1) -
                  (allHints.find((hint) => hint.id === b)?.priority ?? 1)
              ),
            }
          : current
      })
    },
    [allHints]
  )

  const dismissHint = useCallback(() => {
    setState((current) => {
      const [id, ...queue] = current.queue
      return id
        ? { ...current, queue, shown: new Set([...current.shown, id]) }
        : current
    })
  }, [])

  // An accomplished lesson should not appear late or remain queued as a first step.
  const completeTrigger = useCallback(
    (trigger: TutorialTrigger) => {
      const ids = getHintsForTrigger(allHints, trigger).map((hint) => hint.id)
      setState((current) => ({
        ...current,
        shown: new Set([...current.shown, ...ids]),
        queue: current.queue.filter((id) => !ids.includes(id)),
      }))
    },
    [allHints]
  )

  const disableHints = useCallback(
    () => setState((current) => ({ ...current, disabled: true, queue: [] })),
    []
  )
  const enableHints = useCallback(
    () => setState((current) => ({ ...current, disabled: false })),
    []
  )
  const resetAllHints = useCallback(
    () => setState({ shown: new Set(), disabled: false, queue: [] }),
    []
  )
  const hasHintBeenShown = useCallback(
    (id: string) => state.shown.has(id),
    [state.shown]
  )
  // Resolve by ID so a locale switch updates visible and queued copy together.
  const hintQueue = useMemo(
    () =>
      state.queue.flatMap((id) => {
        const hint = allHints.find((candidate) => candidate.id === id)
        return hint ? [hint] : []
      }),
    [state.queue, allHints]
  )

  return useMemo(
    () => ({
      currentHint: hintQueue[0] ?? null,
      hintQueue,
      isDisabled: state.disabled,
      triggerHints,
      dismissHint,
      completeTrigger,
      disableHints,
      enableHints,
      resetAllHints,
      hasHintBeenShown,
    }),
    [
      hintQueue,
      state.disabled,
      triggerHints,
      dismissHint,
      completeTrigger,
      disableHints,
      enableHints,
      resetAllHints,
      hasHintBeenShown,
    ]
  )
}
