import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { registerUpdates } from './registerUpdates'

class Port {
  onmessage: ((event: { data: unknown }) => void) | null = null
  close = vi.fn()
}
const channels: { port1: Port; port2: Port }[] = []
beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('complete')
  vi.stubGlobal(
    'MessageChannel',
    class {
      port1 = new Port()
      port2 = new Port()
      constructor() {
        channels.push(this)
      }
    }
  )
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  channels.length = 0
})

it('waits for page load before starting the offline installation', async () => {
  vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading')
  const registration = Object.assign(new EventTarget(), {
    waiting: null,
    installing: null,
  })
  const container = Object.assign(new EventTarget(), {
    controller: null,
    register: vi.fn().mockResolvedValue(registration),
  })
  const pending = registerUpdates(
    container as unknown as ServiceWorkerContainer,
    '/tensho-web/',
    vi.fn()
  )
  expect(container.register).not.toHaveBeenCalled()
  window.dispatchEvent(new Event('load'))
  await pending
  expect(container.register).toHaveBeenCalledOnce()
  window.dispatchEvent(new Event('load'))
  expect(container.register).toHaveBeenCalledOnce()
})

async function setup(controlled = true, waiting = true, installing = false) {
  const worker = Object.assign(new EventTarget(), { postMessage: vi.fn() })
  const registration = Object.assign(new EventTarget(), {
    waiting: waiting ? worker : null,
    installing: installing ? worker : (null as EventTarget | null),
  })
  const container = Object.assign(new EventTarget(), {
    controller: controlled ? {} : null,
    register: vi.fn().mockResolvedValue(registration),
  })
  const announce = vi.fn()
  const reload = vi.fn()
  await registerUpdates(
    container as unknown as ServiceWorkerContainer,
    '/tensho-web/',
    announce,
    reload
  )
  return {
    worker,
    registration,
    container,
    announce,
    reload,
    activate: () => (announce.mock.lastCall![0] as () => Promise<void>)(),
  }
}

it('uses the deployment scope and does not prompt on first installation', async () => {
  const s = await setup(false)
  expect(s.container.register).toHaveBeenCalledWith('/tensho-web/sw.js', {
    scope: '/tensho-web/',
    updateViaCache: 'none',
  })
  expect(s.announce).not.toHaveBeenCalled()
  s.container.controller = {}
  s.container.dispatchEvent(new Event('controllerchange'))
  expect(s.announce).not.toHaveBeenCalled()
  expect(s.reload).not.toHaveBeenCalled()
})

it('announces a waiting update and activates only on acceptance', async () => {
  const s = await setup()
  expect(s.announce).toHaveBeenCalledOnce()
  expect(s.worker.postMessage).not.toHaveBeenCalled()
  const pending = s.activate()
  expect(s.worker.postMessage).toHaveBeenCalledWith(
    { type: 'TENSHO_ACTIVATE_UPDATE' },
    [channels[0].port2]
  )
  expect(s.reload).not.toHaveBeenCalled()
  s.container.controller = {}
  s.container.dispatchEvent(new Event('controllerchange'))
  await pending
  expect(s.reload).toHaveBeenCalledOnce()
  expect(channels[0].port1.close).toHaveBeenCalledOnce()
  expect(vi.getTimerCount()).toBe(0)
})

it('does not force a sibling update reload', async () => {
  const s = await setup()
  s.registration.waiting = null
  s.container.controller = {}
  s.container.dispatchEvent(new Event('controllerchange'))
  expect(s.reload).not.toHaveBeenCalled()
  await s.activate()
  expect(s.reload).toHaveBeenCalledOnce()
})

it('announces newly started installation', async () => {
  const s = await setup(true, false)
  s.registration.installing = s.worker
  s.registration.dispatchEvent(new Event('updatefound'))
  s.registration.waiting = s.worker
  s.worker.dispatchEvent(new Event('statechange'))
  expect(s.announce).toHaveBeenCalledOnce()
})

it('observes an installation already underway when registration resolves', async () => {
  const s = await setup(true, false, true)
  s.registration.waiting = s.worker
  s.worker.dispatchEvent(new Event('statechange'))
  expect(s.announce).toHaveBeenCalledOnce()
})

it.each(['tabs', 'update'])(
  'reports worker refusal (%s) without reloading and can retry',
  async (error) => {
    const s = await setup()
    const pending = s.activate()
    channels[0].port1.onmessage!({ data: { error } })
    await expect(pending).rejects.toMatchObject({ reason: error })
    expect(s.reload).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    const retry = s.activate()
    s.container.dispatchEvent(new Event('controllerchange'))
    await retry
    expect(s.reload).toHaveBeenCalledOnce()
  }
)

it('cleans up a postMessage failure without a delayed reload', async () => {
  const s = await setup()
  s.worker.postMessage.mockImplementationOnce(() => {
    throw new Error('gone')
  })
  await expect(s.activate()).rejects.toMatchObject({ reason: 'update' })
  s.container.dispatchEvent(new Event('controllerchange'))
  expect(s.reload).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})

it('reports an activation timeout, without reloading if activation happens late', async () => {
  const s = await setup()
  const check = expect(s.activate()).rejects.toMatchObject({ reason: 'update' })
  await vi.advanceTimersByTimeAsync(15_000)
  await check
  s.container.dispatchEvent(new Event('controllerchange'))
  expect(s.reload).not.toHaveBeenCalled()
  expect(channels[0].port1.close).toHaveBeenCalledOnce()
})

it('does not reload when a vanished waiting worker was not activated', async () => {
  const s = await setup()
  s.registration.waiting = null
  await expect(s.activate()).rejects.toMatchObject({ reason: 'update' })
  expect(s.reload).not.toHaveBeenCalled()
})
