import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    css: false,
    include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}", "server/**/*.test.{mjs,ts}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: [
        "src/engine/**/*.ts",
        "src/sections/**/*.{ts,tsx}",
        "src/shell/**/*.{ts,tsx}",
        "src/app/**/*.{ts,tsx}",
        "server/**/*.mjs",
      ],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/index.ts",
        "src/sections/_shared/Toast.tsx",
        "src/shell/ShellPreview.tsx",
      ],
      thresholds: {
        lines: 30,
        functions: 25,
        branches: 25,
        statements: 30,
      },
    },
  },
})
