// PHANTOM regression harness — device matrix per SIX-WEEK DIRECTIVE §9.2.
//
// READ THIS BEFORE TRUSTING A GREEN RUN:
// WebKit-on-Windows is NOT iOS Safari. Every field bug of the last two months was
// iOS-WebKit-specific (the .390-.405 blank aisle, display:contents over a measured
// WebGL mount, position:fixed under a transformed host, border-box glass on a raw
// <button>, async GPU context reclaim). This suite catches NONE of those.
// What it does catch: JS exceptions, console errors, dead doors, missing hosts,
// storage loss, offline boot failure, horizontal overflow, sub-minimum tap targets,
// absent first frames. The physical iPhone gate stays mandatory.

const { defineConfig, devices } = require('@playwright/test');

const PORT = Number(process.env.PHANTOM_PORT || 4317);
const BASE = `http://127.0.0.1:${PORT}`;
// ⭐ 2026-09-11 — THE SECURE ORIGIN. server.js listens on both; this is the sibling port.
// The app gates its own register() call on `location.protocol === 'https:'`, so on the http BASE
// above it never registers a service worker at all — measured: registrations 0, controller false,
// on every project. See the sw-https-chromium project below and the note in server.js.
const HTTPS_PORT = Number(process.env.PHANTOM_HTTPS_PORT || PORT + 1);
const HTTPS_BASE = `https://127.0.0.1:${HTTPS_PORT}`;

module.exports = defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  // The app is a 3.3MB single file that parses, registers a SW and may build a WebGL
  // scene. 45s is the observed ceiling for a cold WebKit boot, not a guess-and-pad.
  timeout: 45_000,
  expect: { timeout: 10_000 },
  // Serial by default: several specs assert on storage and service-worker state, which
  // are per-origin and would race across workers on one shared origin.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0, // A flaky field app must fail loudly. Retries would hide exactly what we hunt.
  reporter: [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }]],

  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      // The primary field device. Everything must pass here first.
      name: 'phone-webkit',
      use: { ...devices['iPhone 13'], browserName: 'webkit', viewport: { width: 390, height: 844 } },
    },
    {
      name: 'tablet-webkit',
      use: { browserName: 'webkit', viewport: { width: 834, height: 1194 }, hasTouch: true, isMobile: false },
    },
    {
      name: 'laptop-chromium',
      use: { browserName: 'chromium', viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'desktop-chromium',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'reduced-motion',
      use: { browserName: 'webkit', viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' },
    },
    {
      // ⭐ THE ONLY PROJECT WHERE THE APP'S OWN SERVICE-WORKER PATH ACTUALLY RUNS.
      //
      // Everything above serves http, where dct-ios.html's `location.protocol === 'https:'` gate
      // means register() is never called — so registration, updatefound, the version backstop and
      // the whole update-coordination path executed in NO test on ANY project. That is how two
      // ungated page reloaders survived 130 versions under a green 430-test suite.
      //
      // ⚠ SCOPED ON PURPOSE, AND THE SCOPE IS THE POINT. This does NOT flip the suite to https.
      // The five projects above are untouched, so the pinned Windows baseline
      // (docs/PLAYWRIGHT-BASELINE.md — 413 passed / 13 skipped / 4 failed) stays comparable
      // row-for-row and a new failure here cannot be confused with baseline noise. Only the specs
      // that actually assert service-worker behaviour opt in; adding a file to testMatch is a
      // deliberate act, not a default.
      //
      // Chromium, not WebKit: 39-sw-update-path already records that WebKit-on-Windows does not
      // install service workers, and 05-offline harness truth #2 records that it cannot serve a
      // navigation from one while emulated-offline. Chromium does both correctly.
      //
      // ⚠ NOT RUNNABLE IN CI AS THE WORKFLOW STANDS. .github/workflows/e2e-full-serial.yml installs
      // WebKit only ("Installing all three browsers costs minutes and disk for nothing") and
      // defaults its project input to phone-webkit, so this project never runs there — and a
      // workflow_dispatch that selects it would fail on a missing browser, not on a real defect.
      // Running it in CI is a deliberate change to that job: add chromium to the install step.
      name: 'sw-https-chromium',
      testMatch: [
        /00-boot\.spec\.js$/,
        /05-offline\.spec\.js$/,
        /39-sw-update-path\.spec\.js$/,
        /56-update-coordination\.spec\.js$/,
      ],
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
        baseURL: HTTPS_BASE,
        // The cert is self-signed and generated per clone; see server.js ensureCert().
        ignoreHTTPSErrors: true,
        // ⛔ ignoreHTTPSErrors IS NOT ENOUGH, AND THE GAP IS EXACTLY THE THING UNDER TEST.
        // It covers page navigations and page fetches, but Chromium validates the certificate
        // chain separately when it fetches a SERVICE WORKER SCRIPT. Measured here: the page was
        // isSecureContext:true and the app's own register() did fire, and it still failed with
        // "An SSL certificate error occurred when fetching the script." — which the app then
        // swallowed into its own console.warn, looking for all the world like the registration
        // had simply not happened. The launch flag is what makes the self-signed cert acceptable
        // to that second, stricter fetch.
        launchOptions: { args: ['--ignore-certificate-errors', '--allow-insecure-localhost'] },
      },
    },
  ],

  webServer: {
    command: 'node server.js',
    url: BASE + '/version.json',
    reuseExistingServer: true,
    timeout: 20_000,
    cwd: __dirname,
  },
});
