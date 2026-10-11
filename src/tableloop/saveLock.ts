/** All current Table Loop writers and explicit deletion share this origin lock.
 * Unsupported locking is a visible storage failure, never an unlocked write.
 */
export const TABLE_SAVE_LOCK = 'tensho-table-loop-write'
export function withTableSaveLock<T>(operation: () => T): Promise<T> {
  if (!globalThis.navigator?.locks)
    return Promise.reject(new Error('Save locking unavailable'))
  return navigator.locks.request(
    TABLE_SAVE_LOCK,
    { mode: 'exclusive' },
    operation
  )
}
