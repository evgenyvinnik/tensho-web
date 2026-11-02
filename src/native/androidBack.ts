/**
 * Android's Back closes whatever is on top, as Escape does on a keyboard: a
 * dialog, a popover, a reveal. With nothing open it sends the game to the
 * background. It never walks the router's history, so Back cannot leave a
 * run or return to a finished one. iPhones have no Back.
 */
export function closeTopLayer(doc: Document = document): boolean {
  // Modal dialogs sit in the top layer, above everything else.
  const dialogs = doc.querySelectorAll<HTMLDialogElement>('dialog[open]')
  const dialog = dialogs[dialogs.length - 1]
  if (dialog) {
    // As Escape would: the dialog's onCancel decides, or it simply closes.
    if (dialog.dispatchEvent(new Event('cancel', { cancelable: true })))
      dialog.close()
    return true
  }
  const popovers = Array.from(
    doc.querySelectorAll<HTMLElement>('[popover]')
  ).filter(isOpenPopover)
  const popover = popovers[popovers.length - 1]
  if (popover) {
    popover.hidePopover()
    return true
  }
  // Other overlays listen for Escape on themselves, the document or the
  // window, so it starts at the focused control and bubbles. One that needs
  // an explicit choice (an opened pack) ignores it, and Back does nothing.
  const overlay = Array.from(
    doc.querySelectorAll<HTMLElement>('[role="dialog"]')
  ).some((element) => !element.hasAttribute('popover'))
  if (overlay) {
    const target = doc.activeElement ?? doc.body
    target.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true,
        cancelable: true,
      })
    )
    return true
  }
  return false
}

function isOpenPopover(element: HTMLElement): boolean {
  try {
    return element.matches(':popover-open')
  } catch {
    // A WebView too old for popovers shows none.
    return false
  }
}

/** Only the Android app calls this; the website never loads Capacitor. */
export async function handleBackButton(): Promise<void> {
  const [{ App }, { Capacitor }] = await Promise.all([
    import('@capacitor/app'),
    import('@capacitor/core'),
  ])
  if (Capacitor.getPlatform() !== 'android') return
  await App.addListener('backButton', () => {
    if (!closeTopLayer()) void App.minimizeApp()
  })
}
