import { useSyncExternalStore } from 'react'
import { initializeClassicPersistence } from './classicPersistenceApp'

export function useClassicPersistence() {
  const service = initializeClassicPersistence()
  const state = useSyncExternalStore(
    service.subscribe,
    service.getSnapshot,
    service.getSnapshot
  )
  return { service, ...state }
}
