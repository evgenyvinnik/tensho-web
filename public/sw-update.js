/* Loaded by the generated worker. Keep the check next to skipWaiting: an old
 * tab can still need its lazy chunks, which activation removes from precache.
 * Do not activate while another app window is open (even an uncontrolled one).
 * This is not a lock against a brand-new window opening during activation. */
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'TENSHO_ACTIVATE_UPDATE') return
  event.waitUntil(
    (async () => {
      try {
        const windows = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        const appWindows = windows.filter((client) =>
          client.url.startsWith(self.registration.scope)
        )
        if (appWindows.some((client) => client.id !== event.source?.id)) {
          event.ports[0]?.postMessage({ error: 'tabs' })
          return
        }
        await self.skipWaiting()
        event.ports[0]?.postMessage({ accepted: true })
      } catch {
        event.ports[0]?.postMessage({ error: 'update' })
      }
    })()
  )
})
