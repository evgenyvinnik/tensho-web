import type { Page } from '@playwright/test'

/**
 * A profile that has cleared every lower Stake on Green Felt and chose
 * `tier` there, so the run starts through the real setup path rather than a
 * direct engine call. Call before the first navigation.
 */
export async function chooseStake(page: Page, tier: number): Promise<void> {
  await page.addInitScript((tier) => {
    localStorage.setItem(
      'tensho-stake-progress',
      JSON.stringify({
        state: {
          currentWallId: 'green_felt',
          currentStakeTier: tier,
          wallProgress: {
            green_felt: {
              wallId: 'green_felt',
              highestCompleted: tier - 1,
              victories: [],
            },
          },
          globalHighestCompleted: tier - 1,
        },
        version: 0,
      })
    )
  }, tier)
}
