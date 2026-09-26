import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it, vi } from 'vitest'

const source = readFileSync('public/sw-update.js', 'utf8')
const scope = 'https://example.test/tensho-web/'
async function request(windows: { id: string; url: string }[], reject = false) {
  const skipWaiting = vi.fn().mockResolvedValue(undefined)
  const postMessage = vi.fn()
  const matchAll = reject
    ? vi.fn().mockRejectedValue(new Error('denied'))
    : vi.fn().mockResolvedValue(windows)
  let handler!: (event: unknown) => void
  let pending!: Promise<void>
  runInNewContext(source, {
    self: {
      addEventListener: (_: string, listener: typeof handler) => {
        handler = listener
      },
      clients: { matchAll },
      registration: { scope },
      skipWaiting,
    },
  })
  handler({
    data: { type: 'TENSHO_ACTIVATE_UPDATE' },
    source: { id: 'current' },
    ports: [{ postMessage }],
    waitUntil: (p: Promise<void>) => {
      pending = p
    },
  })
  await pending
  return { skipWaiting, postMessage, matchAll }
}

it('activates for the accepting window and ignores other scoped applications', async () => {
  const r = await request([
    { id: 'current', url: scope + 'en/' },
    { id: 'unrelated', url: 'https://example.test/another-app/' },
  ])
  expect(r.skipWaiting).toHaveBeenCalledOnce()
  expect(r.postMessage).toHaveBeenCalledWith({ accepted: true })
  expect(r.matchAll).toHaveBeenCalledWith({
    type: 'window',
    includeUncontrolled: true,
  })
})
it('defers activation while another scoped window could need the old chunks', async () => {
  const r = await request([
    { id: 'current', url: scope + 'en/settings' },
    { id: 'sibling', url: scope + 'en/table-loop' },
  ])
  expect(r.skipWaiting).not.toHaveBeenCalled()
  expect(r.postMessage).toHaveBeenCalledWith({ error: 'tabs' })
})
it('does not activate if the window inventory fails', async () => {
  const r = await request([], true)
  expect(r.skipWaiting).not.toHaveBeenCalled()
  expect(r.postMessage).toHaveBeenCalledWith({ error: 'update' })
})
