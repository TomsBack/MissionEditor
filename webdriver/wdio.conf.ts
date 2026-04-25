import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the built Tauri binary. tauri-driver wants an absolute path to the
// .exe (Windows) / binary (Linux) — NOT the installer or bundle. On Windows,
// `pnpm tauri build` puts it under src-tauri/target/release/<package>.exe.
const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_PATH = resolve(
  __dirname,
  "..",
  "src-tauri",
  "target",
  "release",
  process.platform === "win32" ? "missioneditor.exe" : "missioneditor",
);

if (!existsSync(APP_PATH)) {
  console.error(
    `\n  Tauri binary not found at:\n    ${APP_PATH}\n\n` +
    `  Run \`pnpm tauri build --no-bundle\` from the repo root first.\n`,
  );
  process.exit(1);
}

let tauriDriver: ChildProcess | undefined;

export const config: WebdriverIO.Config = {
  runner: "local",
  framework: "mocha",
  specs: ["./test/specs/**/*.e2e.ts"],

  // tauri-driver only supports a single window/session at a time.
  maxInstances: 1,

  // The "tauri:options" cap tells tauri-driver which binary to launch. Other
  // capabilities (browserName etc.) are inferred from the platform.
  capabilities: [
    {
      "tauri:options": { application: APP_PATH },
    },
  ],

  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    // Tauri cold-start + WebView2 attach can take a few seconds on Windows;
    // give each test a generous ceiling.
    timeout: 60_000,
  },

  // tauri-driver listens on 4444 by default.
  hostname: "127.0.0.1",
  port: 4444,
  logLevel: "info",
  bail: 0,
  baseUrl: "",
  waitforTimeout: 10_000,
  connectionRetryTimeout: 90_000,
  connectionRetryCount: 3,

  // Spawn tauri-driver before each session and tear it down after. Stdio is
  // wired through so its logs land in the test output if something goes
  // wrong (binary not found, port already bound, msedgedriver mismatch).
  beforeSession() {
    tauriDriver = spawn("tauri-driver", [], {
      stdio: [null, process.stdout, process.stderr],
    });
    tauriDriver.on("error", (err) => {
      console.error(
        "\n  Failed to spawn tauri-driver. Is it installed and on PATH?\n" +
        "  Install with:\n    cargo install tauri-driver\n",
      );
      throw err;
    });
  },

  afterSession() {
    tauriDriver?.kill();
    tauriDriver = undefined;
  },
};
