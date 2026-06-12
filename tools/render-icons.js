// PHANTOM icon render pipeline. Regenerates every PNG from the committed sources:
//   ghost.webp  -> the app-icon set (via sharp)            [the icon source of truth]
//   og.svg      -> manifest-og.png link card (via resvg + Audiowide)
// Sources are the truth; PNGs are derived — re-run this, never hand-edit a PNG.
//
// NOTE (v1.7.5): the app icon is the AI-authored circuit-ghost raster (ghost.webp), an
// operator decision that reverses v1.7.4's SVG-authored/no-AI approach. The OG card stays
// the authored .ico-ghost SVG (og.svg).
//
// Setup (outside the repo so node_modules/font aren't committed):
//   npm install sharp @resvg/resvg-js
//   curl -L -o Audiowide-Regular.ttf https://github.com/google/fonts/raw/main/ofl/audiowide/Audiowide-Regular.ttf
// Run:  node tools/render-icons.js /path/to/Audiowide-Regular.ttf

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const SRC = path.join(REPO, 'ghost.webp');
const BG = { r: 2, g: 4, b: 8 }; // #020408 app bg

async function main() {
  const src = fs.readFileSync(SRC);
  const put = (n, buf) => { fs.writeFileSync(path.join(REPO, n), buf); console.log(n); };
  const cover = (size) => sharp(src).resize(size, size, { fit: 'cover' }).png().toBuffer();

  // apple-touch must be OPAQUE RGB, no alpha (iOS dislikes alpha)
  put('apple-touch-icon.png', await sharp(src).resize(180, 180, { fit: 'cover' })
    .flatten({ background: BG }).removeAlpha().png().toBuffer());
  put('icon-192.png',   await cover(192));
  put('icon-512.png',   await cover(512));
  put('favicon-32.png', await cover(32));
  put('favicon-16.png', await cover(16));
  // maskable: ghost padded into the central ~80% safe zone on a dark full-bleed canvas
  put('icon-512-maskable.png', await sharp(src).resize(410, 410, { fit: 'cover' })
    .extend({ top: 51, bottom: 51, left: 51, right: 51, background: BG }).png().toBuffer());

  // OG link card from the authored SVG (resvg + Audiowide) — optional
  try {
    const { Resvg } = require('@resvg/resvg-js');
    const FONT = process.argv[2] || path.join(REPO, 'Audiowide-Regular.ttf');
    const fontOpt = fs.existsSync(FONT)
      ? { font: { fontFiles: [FONT], loadSystemFonts: true, defaultFontFamily: 'Audiowide' } } : {};
    const og = new Resvg(fs.readFileSync(path.join(REPO, 'og.svg'), 'utf8'),
      Object.assign({ fitTo: { mode: 'width', value: 1200 } }, fontOpt));
    put('manifest-og.png', og.render().asPng());
  } catch (e) { console.log('(og.svg skipped — @resvg/resvg-js not installed: ' + e.message + ')'); }

  console.log('PHANTOM icons regenerated.');
}
main();
