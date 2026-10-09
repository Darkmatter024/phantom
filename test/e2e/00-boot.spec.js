// Cold boot — the harness's own precondition and the app's first gate.
// If this fails, nothing below it in the suite means anything.

const { test, expect } = require('./fixtures');

test.describe('cold boot', () => {
  test('enters past the splash into the redesign shell', async ({ phantom, page }) => {
    await phantom.boot();

    // The redesign house is the default UI since v1.14.101 (bare URL boots body.rd).
    await expect.poll(() => phantom.isRedesign(), { message: 'body.rd not applied on a bare URL' }).toBe(true);

    // #app is the live surface; #boot is hidden, not removed (launch() :18383).
    await expect(page.locator('#app')).toHaveClass(/visible/);
    await expect(page.locator('#boot')).toBeHidden();
  });

  test('boots with no uncaught exception and no console error', async ({ phantom }) => {
    await phantom.boot();

    const hard = phantom.hardErrors();
    expect(hard, `console errors on cold boot:\n${hard.map((e) => `  [${e.type}] ${e.text}`).join('\n')}`).toEqual([]);
  });

  test('serves the same version the working tree carries', async ({ phantom }) => {
    await phantom.boot();
    const v = await phantom.liveVersion();
    expect(v).toMatch(/^phantom-v1\.\d+\.\d+$/);
  });

  test('the shell does not overflow horizontally', async ({ phantom }) => {
    await phantom.boot();
    await phantom.assertNoHorizontalOverflow();
  });
});
