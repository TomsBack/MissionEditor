import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ["./vitest.setup.ts"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
    },
    include: ["src/**/*.test.{ts,tsx}"],
    typecheck: {
      enabled: false, // opt-in via the test:types script, since tsc runs slowly under watch
      include: ["src/**/*.test-d.ts"],
      tsconfig: "./tsconfig.json",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.test-d.ts",
        "src/main.tsx",
        "src/utils/i18n.ts",
        "src/utils/translations.ts",
        "src/utils/registry.ts",
        "src/utils/languages.ts",
        "src/components/Icons.tsx",
      ],
    },
  },
});
