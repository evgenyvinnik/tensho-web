import type { Page } from '@playwright/test'

/** Keep a test's async import chain reachable until Chromium returns its result.
 * CDP may otherwise report "Promise was collected", which Playwright rewrites
 * as an execution-context/navigation error. Only trusted test functions and
 * JSON-serializable fixture arguments belong here; never page-supplied code.
 * Poll a plain completion record instead of asking CDP to await its own derived
 * promise (retaining only the original promise is insufficient). Navigation
 * discards these test-only globals; only one fixture may run at a time per page.
 */
export async function evaluateFixture<Result, Argument = undefined>(
  page: Page,
  callback: (argument: Argument) => Promise<Result>,
  argument?: Argument
): Promise<Result> {
  await page.evaluate(
    `globalThis.__tenshoTestFixtureResult = { done: false };
     globalThis.__tenshoTestFixturePromise = (${callback.toString()})(${JSON.stringify(argument) ?? 'undefined'}).then(
       value => { globalThis.__tenshoTestFixtureResult = { done: true, value }; },
       error => { globalThis.__tenshoTestFixtureResult = { done: true, error: String(error?.stack ?? error) }; }
     );
     void 0;`
  )
  await page.waitForFunction('globalThis.__tenshoTestFixtureResult.done')
  return page.evaluate<Result>(`(() => {
    const result = globalThis.__tenshoTestFixtureResult;
    if (result.error) throw new Error(result.error);
    return result.value;
  })()`)
}
