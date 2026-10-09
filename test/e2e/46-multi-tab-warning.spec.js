// ─────────────────────────────────────────────────────────────────────────────
// 46 — THE MULTI-TAB WARNING (v1.14.556)
//
// ⛔ THE GAP THIS CLOSES. PHANTOM warns that a second tab risks DATA LOSS — the pill's own tap text
// says "close it to avoid data loss" — but on the device that matters the warning could not appear:
//
//   · #phantom-tab-pill is hidden by `@media (max-width: 480px) { ... display: none !important }`
//     (:58619). That was a deliberate v1.14.391 call — the chrome wordmark overlapped the pill by
//     ~93px at 390 and something had to stand down — and tab_pillRefresh's inline
//     `display:inline-flex` can never beat an !important. So on every iPhone it updated a chip
//     nobody could see.
//   · showBanner() renders ONLY into `#boot .boot-items` and returns early once boot is dismissed,
//     by its own comment. It fires BEFORE a second tab is opened, and nothing fires after.
//
// So an operator who opened a second tab mid-shift was told nothing at all. The fix moves the
// warning off the pill and onto a toast, which has no viewport constraint.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

/** Seed a peer tab into the live Clone War map and drive one refresh, deterministically. */
const seedPeer = (page, id) => page.evaluate((tabId) => {
  window.__phantomClonewar.known[tabId] = Date.now();
  window.__phantomClonewar.refresh();
}, id);

const dropPeers = (page) => page.evaluate(() => {
  const k = window.__phantomClonewar.known;
  Object.keys(k).forEach((id) => { delete k[id]; });
  window.__phantomClonewar.refresh();
});

const toasts = (page) => page.evaluate(() => {
  const c = document.getElementById('toast-container');
  return c ? [...c.children].map((e) => e.textContent) : [];
});

test.describe('the multi-tab warning', () => {

  test('a second tab warns the operator, at PHONE width where the pill cannot show', async ({ phantom, page }) => {
    await page.setViewportSize({ width: 390, height: 844 });   // the device this exists for
    await phantom.boot();

    expect(await toasts(page), 'something toasted before a peer existed').toEqual([]);

    await seedPeer(page, 'peer-1');

    const shown = await toasts(page);
    expect(shown.length, 'a second tab raised NO warning — the operator is told nothing').toBe(1);
    expect(shown[0], 'the warning must name the risk, not just the count').toMatch(/data loss/i);
    expect(shown[0], 'the warning should say how many tabs are open').toMatch(/2 tabs/i);

    // And the pill genuinely cannot help here — this is why the toast had to exist.
    const pillVisible = await page.evaluate(() => {
      const p = document.getElementById('phantom-tab-pill');
      return !!p && getComputedStyle(p).display !== 'none';
    });
    expect(pillVisible, 'the pill is visible at 390 — then the media-query premise has changed').toBe(false);
  });

  test('it warns ONCE per arrival, not on every 20s poll', async ({ phantom, page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await phantom.boot();
    await seedPeer(page, 'peer-1');
    expect((await toasts(page)).length).toBe(1);

    // The poll keeps running while the other tab stays open. It must not nag.
    await page.evaluate(() => { window.__phantomClonewar.refresh(); window.__phantomClonewar.refresh(); });
    expect((await toasts(page)).length, 'the warning repeated while the same tab stayed open — nagging').toBe(1);
  });

  test('a NEW second tab warns again after the first one closes', async ({ phantom, page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await phantom.boot();
    await seedPeer(page, 'peer-1');
    expect((await toasts(page)).length).toBe(1);

    await dropPeers(page);              // the other tab closed; latch must clear
    await seedPeer(page, 'peer-2');     // a genuinely new one opens later in the shift

    expect((await toasts(page)).length, 'the latch never cleared — a real second warning was swallowed').toBe(2);
  });

  test('the pill still works where there IS room for it', async ({ phantom, page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await phantom.boot();
    await seedPeer(page, 'peer-1');

    const pill = await page.evaluate(() => {
      const p = document.getElementById('phantom-tab-pill');
      if (!p) return null;
      const t = p.querySelector('.tab-pill-text');
      return { display: getComputedStyle(p).display, text: t ? t.textContent : null };
    });
    expect(pill, '#phantom-tab-pill is gone').not.toBeNull();
    expect(pill.display, 'the pill stayed hidden above 480 — the richer affordance was lost').not.toBe('none');
    expect(pill.text).toMatch(/2 TABS/i);
  });

});
