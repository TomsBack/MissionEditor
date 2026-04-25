# End-to-end tests

These tests drive the real Tauri binary via [`tauri-driver`](https://v2.tauri.app/develop/tests/webdriver/) and [WebdriverIO](https://webdriver.io). They complement the in-process integration tests under `src/App.integration.test.tsx`, which run the React app against a mocked Tauri runtime in vitest's browser mode.

## Prerequisites

You need three things on your machine before the suite can run:

1. **`tauri-driver`** (Rust binary, on PATH):
   ```bash
   cargo install tauri-driver --locked
   ```

2. **Platform WebDriver** matching the WebView the app uses:
   - **Windows**: a `msedgedriver` whose version matches the installed WebView2 runtime. From `webdriver/`:
     ```powershell
     pnpm setup:driver
     ```
     This runs `setup-driver.ps1`, which detects your WebView2 version, downloads the matching driver, and drops it in `webdriver/.bin/` (gitignored). `wdio.conf.ts` then passes `--native-driver` to `tauri-driver` automatically. Re-run this if WebView2 auto-updates and the driver starts throwing `session not created`.
   - **Linux**: `WebKitWebDriver` (ships with `webkit2gtk`); needs to be on PATH.
   - **macOS**: not officially supported by `tauri-driver` yet.

3. **Built Tauri binary**:
   ```bash
   pnpm tauri build --no-bundle
   ```
   `wdio.conf.ts` looks for `src-tauri/target/release/missioneditor.exe` (or `missioneditor` on Linux). The `--no-bundle` flag skips the NSIS installer step, which is unnecessary for the raw binary.

## Install the test harness

From this directory:

```bash
pnpm install --ignore-workspace
# or use the wrapper script:
pnpm install:deps
```

`--ignore-workspace` is necessary because the repo root has a `pnpm-workspace.yaml`; without it pnpm tries to resolve `webdriver/` against the workspace and skips the install. The harness is intentionally kept off the workspace so the WDIO + Mocha + chai dependency tree doesn't bleed into the app build.

## Run

```bash
pnpm test               # all specs
pnpm test:smoke         # just the smoke check
```

Each run does roughly:

1. WDIO starts.
2. `beforeSession` spawns `tauri-driver` (which in turn spawns the WebView's WebDriver).
3. `tauri-driver` launches the app binary and attaches.
4. Specs run against the live window via WebDriver protocol commands.
5. `afterSession` kills `tauri-driver`, which closes the app.

## Writing tests

Selectors use WDIO's [query syntax](https://webdriver.io/docs/selectors). Examples:

```ts
await $("button=New")              // text equals "New"
await $('input[value="abc"]')      // CSS attribute selector
await $("//div[contains(@class,'foo')]")  // XPath
```

For keyboard input use `browser.keys([...])`. Modifier-held shortcuts (Ctrl+Z etc.) need the modifier key passed explicitly: `browser.keys(["Control", "z"])`.

## Troubleshooting

- **"Failed to spawn tauri-driver"**: install via `cargo install tauri-driver --locked` and confirm `tauri-driver` is on PATH (`where tauri-driver` on Windows).
- **"Tauri binary not found"**: run `pnpm tauri build --no-bundle` from the repo root.
- **`session not created` from msedgedriver**: the driver version doesn't match your WebView2. Download a matching version from [Microsoft Edge WebDriver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/) and put it on PATH.
- **Tests hang on cold start**: the default 60s timeout in `mochaOpts` is usually enough on Windows; bump it if your machine is slow.
