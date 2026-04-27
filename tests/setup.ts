import "@testing-library/jest-dom/vitest"

// Polyfill for tests
if (!globalThis.fetch) {
  globalThis.fetch = (() => Promise.reject(new Error("fetch not mocked"))) as typeof fetch
}
