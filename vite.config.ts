/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // selfDestroying ships a SW whose only job is to unregister itself and
      // wipe all caches. We're using it to clean up after a previous SW
      // generation that poisoned its CacheFirst entries with failed RealmEye
      // sprite responses AND a stale precache that mapped /assets/* URLs to
      // broken responses (causing 500s on the JS bundle and text/html on the
      // CSS for any returning user). Once telemetry confirms the install
      // base has wiped, flip this back to false and re-enable normal PWA
      // behavior in a follow-up deploy.
      selfDestroying: true,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'data/items.json', 'data/classes.json', 'data/sets.json'],
      manifest: {
        name: 'OryxLab — DPS Calculator',
        short_name: 'OryxLab',
        description:
          'DPS calculator and build optimizer for Realm of the Mad God. Compare items, optimize loadouts, and import your RealmEye inventory.',
        theme_color: '#fbbf24',
        background_color: '#09090b',
        display: 'standalone',
        start_url: '/app',
        scope: '/',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Pre-cache the SPA shell + data files.
        globPatterns: ['**/*.{js,css,html,svg,woff2,json}'],
        // 1500-item items.json is ~800KB — bump default 2MB cap to avoid
        // workbox refusing to precache it.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // The previous SW used a CacheFirst rule for /s/* on RealmEye that
        // poisoned itself with failed opaque responses when the server
        // briefly served Referrer-Policy: no-referrer. Even after the header
        // was fixed, CacheFirst kept replaying the broken cache entries —
        // every sprite stayed broken on returning visits. cleanupOutdatedCaches
        // drops the old precache; not adding a runtimeCaching rule for
        // RealmEye means the browser's HTTP cache handles it instead, which
        // is more robust (RealmEye already serves max-age=2592000).
        cleanupOutdatedCaches: true,
        // skipWaiting + clientsClaim make the new SW take over immediately
        // after install instead of waiting for all tabs to close. Without
        // these, users with the old (poisoned) SW would keep seeing broken
        // sprites until they manually quit the browser.
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // API responses — network-first with short cache for offline mode.
            urlPattern: /\/api\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'oryxlab-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
            },
          },
        ],
        navigateFallback: '/index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: false,
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}', 'server/**/*.test.{mjs,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'src/engine/**/*.ts',
        'src/sections/**/*.{ts,tsx}',
        'src/shell/**/*.{ts,tsx}',
        'src/app/**/*.{ts,tsx}',
        'server/**/*.mjs',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/index.ts',
        'src/sections/_shared/Toast.tsx',
        'src/shell/ShellPreview.tsx',
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
