// PHANTOM static server — test fixture only.
// The app registers a service worker, which requires a secure context; file:// is not one.
// 127.0.0.1 is treated as secure by both Chromium and WebKit, so the SW path is exercised
// exactly as it is on Pages. No caching headers: every test run sees the working tree.
//
// ⛔ 2026-09-11 — THAT LAST SENTENCE WAS HALF TRUE, AND THE HALF THAT WAS FALSE HID A DEFECT.
// 127.0.0.1 is a secure context and WILL accept a registration, but the APP does not ask:
// dct-ios.html gates its own register() call on `location.protocol === 'https:'`, which is
// narrower than the platform rule. Measured on this server: with the app booted, every project
// reported `registrations: 0, controller: false, PHANTOM_SW_REG: false`. The app's entire
// service-worker path — registration, updatefound, the version backstop, the whole update
// coordination — therefore executed in NO test, on ANY project. 05-offline.spec.js had already
// written this down as harness truth #1 and filed it as a P2; two ungated page reloaders lived at
// the top of the file for 130 versions with a 430-test suite green over them.
//
// So this server now also listens on HTTPS, and a dedicated Playwright project points at it.
// ⚠ THE HTTP LISTENER IS UNCHANGED AND STILL THE DEFAULT. The five original projects keep using
// it, byte for byte. A global scheme flip would change the conditions under which all 430 tests
// run, and that cannot be judged from here: the pinned Windows baseline carries 4 known failures
// and 13 skips (docs/PLAYWRIGHT-BASELINE.md), the CI full-serial job runs phone-webkit only, and
// WebKit+SW is already documented as fragile in this harness (05-offline harness truth #2 — WebKit
// cannot serve a navigation from a SW while emulated-offline). Flipping everything is a separate,
// CI-validated decision; this change makes the path testable without betting the suite on it.

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PHANTOM_PORT || 4317);
// The https listener is a sibling, not a replacement. Default PORT+1 so a single PHANTOM_PORT
// override still moves both together.
const HTTPS_PORT = Number(process.env.PHANTOM_HTTPS_PORT || PORT + 1);
const CERT_DIR = path.join(__dirname, '.certs');
const KEY_FILE = path.join(CERT_DIR, 'localhost-key.pem');
const CRT_FILE = path.join(CERT_DIR, 'localhost-cert.pem');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

// ── The request handler, shared by both listeners ────────────────────────────────
// Extracted verbatim from the original single-server body. Both schemes must serve the SAME
// bytes from the SAME working tree, or an https-only failure could never be told apart from a
// difference between the two servers.
function handler(req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${PORT}`).pathname);
  } catch {
    res.writeHead(400).end('bad url');
    return;
  }

  if (urlPath === '/') urlPath = '/index.html';

  const abs = path.resolve(ROOT, '.' + urlPath);
  // Never serve outside the repo, and never serve git internals.
  if (!abs.startsWith(ROOT) || abs.includes(`${path.sep}.git${path.sep}`)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  fs.readFile(abs, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found: ' + urlPath);
      return;
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store, no-cache, must-revalidate',
      'service-worker-allowed': '/',
    });
    res.end(buf);
  });
}

// ── The self-signed certificate ──────────────────────────────────────────────────
// Generated on demand into test/.certs/ (gitignored) rather than committed: a private key in a
// repo is a bad habit even when it only protects a loopback test server, and a generated one can
// never go stale or be mistaken for something that matters. playwright.config.js sets
// ignoreHTTPSErrors, so self-signed is exactly right here.
//
// ⛔ IT FAILS LOUDLY, NOT SILENTLY. If openssl is missing the https listener does not start and
// this says so on stdout. A quiet fallback to http would be worse than no https at all: the
// sw-https project would then run against a plain origin, the app would skip register() again,
// and the tests would report green while proving nothing — which is the exact failure this whole
// change exists to end.
function ensureCert() {
  if (fs.existsSync(KEY_FILE) && fs.existsSync(CRT_FILE)) return true;
  try {
    fs.mkdirSync(CERT_DIR, { recursive: true });
    execFileSync('openssl', [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
      '-keyout', KEY_FILE,
      '-out', CRT_FILE,
      '-days', '3650',
      '-subj', '/CN=127.0.0.1',
      '-addext', 'subjectAltName=IP:127.0.0.1,IP:::1,DNS:localhost',
    ], { stdio: 'pipe' });
    console.log(`[phantom server] generated a self-signed test certificate in ${CERT_DIR}`);
    return true;
  } catch (e) {
    console.error('[phantom server] ⛔ COULD NOT GENERATE A TLS CERTIFICATE — https listener disabled.');
    console.error('[phantom server]    openssl is required for the sw-https project. Error: '
      + (e && e.message ? e.message.split('\n')[0] : String(e)));
    console.error('[phantom server]    The five http projects are unaffected and will run normally.');
    return false;
  }
}

// ── Listeners ────────────────────────────────────────────────────────────────────
http.createServer(handler).listen(PORT, '127.0.0.1', () => {
  console.log(`phantom static server on http://127.0.0.1:${PORT} (root: ${ROOT})`);
});

if (ensureCert()) {
  try {
    https
      .createServer({ key: fs.readFileSync(KEY_FILE), cert: fs.readFileSync(CRT_FILE) }, handler)
      .listen(HTTPS_PORT, '127.0.0.1', () => {
        console.log(`phantom static server on https://127.0.0.1:${HTTPS_PORT} (secure origin — the app registers its SW here)`);
      });
  } catch (e) {
    console.error('[phantom server] ⛔ https listener failed to start: ' + (e && e.message ? e.message : String(e)));
  }
}
