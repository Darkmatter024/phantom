// ────────────────────────────────────────────────────────────────────────────
// 55 — INTEL-DOCK SHIP 1: the dock's fourth slot is the ghost, and EXIT lives in SYS
//      (owner rulings 2026-09-10 — OWNER-RULINGS.md INTEL-DOCK items 1 and 3)
//
// THE RULING THIS PINS. Option A: FOUR slots — COMMAND · BUILD · TOOLS · GHOST — and EXIT (hold)
// leaves the dock for the last row of SYS. Option B (five slots, SHIFT restored) was REJECTED.
// The ghost does not ADD a slot; it takes the one EXIT vacates.
//
// ⛔ WHY THIS IS ONE SHIP AND NOT TWO. #rd-botnav is grid-template-columns:repeat(4,1fr). The
// ghost cannot occupy slot 4 unless EXIT leaves in the same edit, or the row renders with a
// visibly empty cell. The two halves are one atomic change.
//
// ⚠ WHAT THIS SHIP DELIBERATELY DOES NOT DO. Retiring the Command assistant card (#cc-asst) is
// ruling 2 and is a SECOND visible change on a different surface, so it is Ship 2. Until it lands
// the assistant has two doors and the door ledger is +1, which is stated rather than hidden.
// The offline "needs signal" sheet is also not here: the ghost keeps the existing canonical
// opener, exactly as #cc-asst does today.
//
// ⭐ THE OFFLINE ASSERTION IS THE INTERESTING ONE. The app already has a generic offline hook,
// [data-requires-net="1"], but it sets pointer-events:none and stamps an "OFFLINE" pill via
// ::after. On a ~94px dock cell that is both cramped and WRONG: a dead tappable control violates
// Contract B14 ("a tappable control that does nothing is a violation"). So the ghost dims but
// stays tappable, and this spec pins BOTH halves of that — dim AND alive.
// ────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const dockIds = (page) => page.evaluate(() =>
  Array.from(document.querySelectorAll('#rd-botnav .botitem')).map((el) => el.id));

test.describe('INTEL-DOCK — the dock is four slots and the fourth is the ghost', () => {

  test('⛔ the dock holds four .botitem slots, ending in the ghost, and #rd-exit is NOT among them', async ({ phantom, page }) => {
    await phantom.boot();
    const ids = await dockIds(page);
    expect(ids, 'the dock is not four slots ending in the ghost').toEqual(
      ['bn-command', 'bn-work', 'bn-ref', 'bn-ghost']);

    // EXIT must be GONE from the dock — removed, not hidden. A hidden control still occupies the
    // grid and still answers querySelector, which is how a "removed" thing comes back.
    const exitInDock = await page.evaluate(() => !!document.querySelector('#rd-botnav #rd-exit'));
    expect(exitInDock, 'EXIT is still inside the dock').toBe(false);
  });

  test('every dock control still clears the 44px gloved-hand floor', async ({ phantom, page }) => {
    await phantom.boot();
    const boxes = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#rd-botnav .botitem')).map((el) => {
        const r = el.getBoundingClientRect();
        return { id: el.id, w: Math.round(r.width), h: Math.round(r.height) };
      }));
    expect(boxes.length).toBe(4);
    for (const b of boxes) {
      expect(b.w, `${b.id} is ${b.w}px wide, under the gloved floor`).toBeGreaterThanOrEqual(44);
      expect(b.h, `${b.id} is ${b.h}px tall, under the gloved floor`).toBeGreaterThanOrEqual(44);
    }
  });

  test('the ghost renders its own art, not a borrowed glyph', async ({ phantom, page }) => {
    await phantom.boot();
    const img = await page.evaluate(() => {
      const el = document.querySelector('#bn-ghost .bicon');
      if (!el) return null;
      return { src: el.getAttribute('src'), natural: el.naturalWidth, complete: el.complete };
    });
    expect(img, '#bn-ghost has no icon').not.toBeNull();
    expect(img.src, 'the ghost is not drawing its own commissioned cut').toMatch(/phantom-nav-ghost-v1-256\.webp$/);
    // A 404 would still "render" as an empty box, so assert the bytes actually decoded.
    expect(img.natural, 'the ghost icon did not decode — check the file actually shipped').toBeGreaterThan(0);
  });

  test('tapping the ghost opens the assistant sheet', async ({ phantom, page }) => {
    await phantom.boot();
    await page.locator('#bn-ghost').click();
    await expect.poll(() => page.evaluate(() => {
      const s = document.getElementById('vaSheet');
      if (!s) return 'missing';
      const cs = getComputedStyle(s);
      return (cs.display !== 'none' && cs.visibility !== 'hidden') ? 'open' : 'closed';
    }), { message: 'the ghost did not open the assistant sheet' }).toBe('open');
  });

  test('⛔ offline the ghost DIMS but stays tappable — dim means dim, dead means broken', async ({ phantom, page }) => {
    await phantom.boot();
    const lit = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.querySelector('#bn-ghost .bicon')).opacity));

    await page.evaluate(() => { document.body.dataset.net = 'offline'; });

    // ⚠ POLL, DO NOT READ ONCE. .bicon carries transition:opacity .2s, so getComputedStyle
    // immediately after the attribute flips returns the value the icon is transitioning FROM, not
    // the one it is heading to. The first cut of this test read once and failed against correct
    // code at exactly 0.82 — the start value. Same trap spec 37's settle() header records: wait on
    // the state, never sample the animation.
    await expect
      .poll(() => page.evaluate(() =>
        parseFloat(getComputedStyle(document.querySelector('#bn-ghost .bicon')).opacity)),
      { message: 'offline never visibly dimmed the ghost', timeout: 5000 })
      .toBeLessThan(lit);

    const pointer = await page.evaluate(() =>
      getComputedStyle(document.getElementById('bn-ghost')).pointerEvents);
    expect(pointer, 'the offline ghost is unclickable — a dead tappable control (Contract B14)')
      .not.toBe('none');
  });
});

test.describe('INTEL-DOCK — EXIT is the last row of SYS', () => {

  test('EXIT exists, is the LAST row of the SYS panel, and is not a dock tab', async ({ phantom, page }) => {
    await phantom.boot();
    const where = await page.evaluate(() => {
      const ex = document.getElementById('rd-exit');
      if (!ex) return { found: false };
      const panel = document.getElementById('hdr-agg-panel');
      const rows = panel ? Array.from(panel.querySelectorAll('.hdr-agg-row')) : [];
      return {
        found: true,
        inPanel: !!(panel && panel.contains(ex)),
        isLastRow: rows.length > 0 && rows[rows.length - 1].id === 'rd-exit',
        isBotitem: ex.classList.contains('botitem'),
      };
    });
    expect(where.found, 'EXIT vanished entirely — it must MOVE, never be deleted').toBe(true);
    expect(where.inPanel, 'EXIT is not inside the SYS panel').toBe(true);
    expect(where.isLastRow, 'EXIT is in SYS but not the LAST row').toBe(true);
    expect(where.isBotitem, 'EXIT became a dock tab — it is hold-only, never a landable slot').toBe(false);
  });

  test('⛔ EXIT is still HOLD-only: a plain tap does not freeze the app', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate(() => {
      const p = document.getElementById('hdr-agg-panel');
      if (p) p.style.display = 'block';
    });
    await page.locator('#rd-exit').click();
    const frozen = await page.evaluate(() =>
      document.getElementById('rd-freeze-curtain').classList.contains('up'));
    expect(frozen, 'a TAP froze the app — the hold gesture is the whole safety of this control').toBe(false);
  });

  test('the hold gesture is wired to the moved control', async ({ phantom, page }) => {
    await phantom.boot();
    const wired = await page.evaluate(() => {
      const ex = document.getElementById('rd-exit');
      return !!(ex && ex._rdWired);
    });
    expect(wired, 'rd_initExit never wired the moved EXIT — the hold would be inert').toBe(true);
  });
});
