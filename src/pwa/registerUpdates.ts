export class UpdateError extends Error {
  constructor(public readonly reason: 'tabs' | 'update') {
    super(reason)
  }
}

/** No unconditional reload listener: this document must accept and save first. */
export async function registerUpdates(
  container: ServiceWorkerContainer,
  base: string,
  announce: (activate: () => Promise<void>) => void,
  reload: () => void = () => window.location.reload()
): Promise<void> {
  // Preserve Workbox's non-immediate registration behavior: do not compete
  // with the initial page load while installing the complete offline cache.
  if (document.readyState !== 'complete') {
    await new Promise<void>((resolve) => {
      window.addEventListener('load', () => resolve(), { once: true })
    })
  }
  const originalController = container.controller
  const registration = await container.register(`${base}sw.js`, {
    scope: base,
    updateViaCache: 'none',
  })
  let finishActivation: (() => void) | null = null
  const activate = async () => {
    const worker = registration.waiting
    if (!worker) {
      // Another tab may have activated it while this dialog was open. The
      // caller still ran this document's save guards before reaching here.
      if (container.controller && container.controller !== originalController) {
        reload()
        return
      }
      throw new UpdateError('update')
    }
    await new Promise<void>((resolve, reject) => {
      const channel = new MessageChannel()
      const cleanup = () => {
        clearTimeout(timer)
        finishActivation = null
        channel.port1.close()
        channel.port2.close()
      }
      const fail = (reason: 'tabs' | 'update') => {
        cleanup()
        reject(new UpdateError(reason))
      }
      const timer = setTimeout(() => fail('update'), 15_000)
      finishActivation = () => {
        cleanup()
        resolve()
        reload()
      }
      channel.port1.onmessage = (event) => {
        if (event.data?.error)
          fail(event.data.error === 'tabs' ? 'tabs' : 'update')
      }
      try {
        worker.postMessage({ type: 'TENSHO_ACTIVATE_UPDATE' }, [channel.port2])
      } catch {
        fail('update')
      }
    })
  }
  container.addEventListener('controllerchange', () => {
    if (finishActivation) finishActivation()
    else if (originalController && container.controller !== originalController)
      announce(activate)
  })
  const waiting = () => {
    if (registration.waiting && container.controller) announce(activate)
  }
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing
    worker?.addEventListener('statechange', waiting)
  })
  // Registration can complete after installation has already started.
  registration.installing?.addEventListener('statechange', waiting)
  waiting()
}
