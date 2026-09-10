// PHANTOM icon render pipeline — APP-ICON HALF RETIRED.
//
// ⛔ THE APP ICONS ARE NO LONGER DERIVED FROM ANYTHING. DO NOT RE-ADD GENERATION HERE.
//
// Owner ruling 2026-09-10 (OWNER-RULINGS.md): "retire the app-icon half. Delete, don't repoint.
// A script that silently reverts shipped state is a defect regardless of whether it can currently
// fire. 'sharp isn't installed' is a property of this laptop today, not a safeguard."
//
// WHAT THIS FILE USED TO DO, AND WHY THAT WAS DANGEROUS. Until v1.14.586 it regenerated all six
// app icons from `ghost.webp` via sharp — apple-touch-icon, icon-192, icon-512, favicon-32,
// favicon-16 and a maskable built with its own 410+51 padding math — under a header that read
// "Sources are the truth; PNGs are derived — re-run this, never hand-edit a PNG."
// v1.14.586 (ICON REFRESH) replaced those icons with owner-approved chrome-ghost art that did NOT
// come from `ghost.webp`, de-referenced favicon-16 entirely, and shipped a purpose-built maskable
// measured to sit inside the 204.8px safe-zone circle. From that moment `ghost.webp` was stale
// art, and running the old script would have silently reverted the entire ship — including
// resurrecting the favicon-16 the app no longer references. Nothing in the app calls this file;
// the only protection was that sharp is not installed on the build box, which is not protection.
//
// THE APP ICONS ARE NOW HAND-AUTHORED ASSETS, owner-supplied and owner-approved, each one
// measured before it landed (docs/ICON-REFRESH-PHASE0-EVIDENCE.md). They are committed files with
// no generator. If they need to change again, new art is supplied and measured the same way.
//
// ⚠ `ghost.webp` IS DELIBERATELY LEFT ON DISK. It is now an orphan — referenced by no served page
// and by no script — but deleting a committed source asset is its own ruling, not a side effect of
// this one. It is recorded as an orphan-cleanup candidate.
//
// ── THE ONE SURVIVING HALF, AND WHY IT ALSO REFUSES TO RUN TODAY ────────────────────────────
// The OG link card (og.svg -> a PNG, via resvg + Audiowide) is genuinely not app-icon work, so the
// ruling allows it to survive. Measured 2026-09-10, it does not currently produce a live asset
// either: it writes `manifest-og.png`, while dct-ios.html has referenced `manifest-og-v2.png`
// since v1.14.x — a different, later cut. Regenerating into the old name would write a file the
// app does not serve and report success, which is the same silent-no-effect defect in a smaller
// costume.
//
// So it fails loudly instead. The guard below reads what the app ACTUALLY references and refuses
// when this script's output is not that file. Fix the mismatch deliberately — pass the real target
// with --out, or retire this half too — but never let it write a stale name quietly.
//
// Setup (outside the repo so node_modules/font aren't committed):
//   npm install @resvg/resvg-js
//   curl -L -o Audiowide-Regular.ttf https://github.com/google/fonts/raw/main/ofl/audiowide/Audiowide-Regular.ttf
// Run:  node tools/render-icons.js [--out <name.png>] [/path/to/Audiowide-Regular.ttf]

const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const APP = path.join(REPO, 'dct-ios.html');
const DEFAULT_OG_OUT = 'manifest-og.png';

function die(lines) {
  console.error('\n  render-icons: REFUSING — nothing was written.\n');
  for (const l of lines) console.error('  ' + l);
  console.error('');
  process.exit(1);
}

/**
 * Retired on purpose. Kept as a named, throwing stub so that anything which still expects this
 * module to produce app icons fails loudly and says why, instead of silently producing nothing —
 * or, far worse, silently reverting shipped art.
 */
function regenerateAppIcons() {
  die([
    'APP-ICON GENERATION IS RETIRED (owner ruling 2026-09-10).',
    'The app icons are hand-authored, owner-approved assets as of v1.14.586 (ICON REFRESH).',
    'They are NOT derived from ghost.webp, which is stale art — regenerating from it would',
    'revert the shipped identity and resurrect the de-referenced favicon-16.',
    'If the icons must change, supply new art and measure it: docs/ICON-REFRESH-PHASE0-EVIDENCE.md.',
  ]);
}

/** What dct-ios.html actually serves as its OG image, read from source rather than assumed. */
function liveOgAsset() {
  const head = fs.readFileSync(APP, 'utf8').slice(0, 8000);
  const m = head.match(/og:image"\s+content="[^"]*\/([^"/]+\.png)"/);
  return m ? m[1] : null;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--icons')) regenerateAppIcons();

  const outIdx = argv.indexOf('--out');
  const out = outIdx >= 0 ? argv[outIdx + 1] : DEFAULT_OG_OUT;
  const font = argv.find((a) => a.endsWith('.ttf')) || path.join(REPO, 'Audiowide-Regular.ttf');

  const live = liveOgAsset();
  if (!live) {
    die([
      'Could not find an og:image reference in dct-ios.html, so there is nothing to verify against.',
      'This script refuses to write an asset it cannot prove the app serves.',
    ]);
  }
  if (out !== live) {
    die([
      `STALE TARGET. This script would write "${out}", but dct-ios.html serves "${live}".`,
      'Writing the old name would produce a file the app does not use and then report success —',
      'a silent no-effect regeneration, which is the defect this guard exists to prevent.',
      '',
      `Deliberate fix, if the OG card really needs regenerating:  --out ${live}`,
      'Otherwise retire this half too — it has no live consumer, and app-icon generation is',
      'already retired above (owner ruling 2026-09-10).',
    ]);
  }

  let Resvg;
  try { ({ Resvg } = require('@resvg/resvg-js')); }
  catch (e) { die(['@resvg/resvg-js is not installed: ' + e.message, 'npm install @resvg/resvg-js']); }

  const fontOpt = fs.existsSync(font)
    ? { font: { fontFiles: [font], loadSystemFonts: true, defaultFontFamily: 'Audiowide' } }
    : {};
  const svg = fs.readFileSync(path.join(REPO, 'og.svg'), 'utf8');
  const png = new Resvg(svg, Object.assign({ fitTo: { mode: 'width', value: 1200 } }, fontOpt))
    .render().asPng();
  fs.writeFileSync(path.join(REPO, out), png);
  console.log(out + ' written (' + png.length + ' bytes) — OG link card only. App icons are not generated.');
}

main();

module.exports = { regenerateAppIcons, liveOgAsset };
