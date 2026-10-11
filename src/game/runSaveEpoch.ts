/** Opaque reset fence, not earned progress. Reset changes it while holding both
 * run locks, fencing queued first saves that observed empty storage before reset.
 */
export const RUN_SAVE_EPOCH_KEY = 'tensho-run-save-epoch'
