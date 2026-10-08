import { ALL_DECREES } from './decreeDefinitions'

/** Profile eligibility is separate from current-run slots and Flower catalysts. */
export type DecreeUnlockResolver = (decreeId: string) => boolean

const conditions = new Map(
  ALL_DECREES.filter((decree) => decree.unlockCondition).map((decree) => [
    decree.id,
    decree.unlockCondition!,
  ])
)

export function getDecreeUnlockCondition(id: string): string | undefined {
  return conditions.get(id)
}

export function isDecreeAvailable(
  id: string,
  isUnlocked: DecreeUnlockResolver = () => false
): boolean {
  return !conditions.has(id) || isUnlocked(id)
}
