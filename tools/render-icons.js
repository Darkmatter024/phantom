// PHANTOM icon render pipeline — regenerates every PNG from the committed SVG masters.
// The SVGs (icon.svg, icon-maskable.svg, favicon.svg, og.svg) are the source of truth;
// PNGs are derived artifacts — NEVER hand-edit a PNG, re-run this instead.
//
// Setup (one-time, outside the repo so node_modules/font aren't committed):
//   npm install @resvg/resvg-js
//   curl -L -o Audiowide-Regular.ttf \
//     https://github.com/google/fonts/raw/main/ofl/audiowide/Audiowide-Regular.ttf
// Run:  node tools/render-icons.js /path/to/Audiowide-Regular.ttf
//
// Requires @resvg/resvg-js on the module path. Pass the Audiowide TTF path as argv[2]
// (needed only for og.svg's wordmark).

const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const FONT = process.argv[2] || path.join(REPO, 'Audiowide-Regular.ttf');
const fontOpt = fs.existsSync(FONT)
  ? { font: { fontFiles: [FONT], loadSystemFonts: true, defaultFontFamily: 'Audiowide' } }
  : {};

function render(svgFile, outFile, size, extra) {
  const svg = fs.readFileSync(path.join(REPO, svgFile), 'utf8');
  const r = new Resvg(svg, Object.assign({ fitTo: { mode: 'width', value: size } }, extra || {}));
  fs.writeFileSync(path.join(REPO, outFile), r.render().asPng());
  console.log(outFile, size + 'px');
}

render('icon.svg',          'apple-touch-icon.png',  180);
render('icon.svg',          'icon-192.png',          192);
render('icon.svg',          'icon-512.png',          512);
render('icon-maskable.svg', 'icon-512-maskable.png', 512);
render('icon.svg',          'favicon-32.png',        32);
render('favicon.svg',       'favicon-16.png',        16);
render('og.svg',            'manifest-og.png',       1200, fontOpt);

// apple-touch-icon must be OPAQUE with no alpha channel (iOS dislikes alpha). resvg emits
// RGBA, so flatten it via sharp when available (optional dep: `npm install sharp`).
try {
  const sharp = require('sharp');
  const p = path.join(REPO, 'apple-touch-icon.png');
  sharp(fs.readFileSync(p)).flatten({ background: '#020408' }).removeAlpha().png().toBuffer()
    .then(out => { fs.writeFileSync(p, out); console.log('apple-touch-icon.png flattened (opaque RGB)'); });
} catch (e) {
  console.log('(sharp not installed — apple-touch left as opaque RGBA; `npm i sharp` to flatten the alpha channel)');
}
console.log('PHANTOM icons regenerated.');
