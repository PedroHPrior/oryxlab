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
        // Pre-cache the SPA shell + data files. RealmEye sprite CDN is cached
        // on first visit per item.
        globPatterns: ['**/*.{js,css,html,svg,woff2,json}'],
        // 1500-item items.json is ~800KB — bump default 2MB cap to avoid
        // workbox refusing to precache it.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // RealmEye sprites — cache opportunistically with a long TTL.
            urlPattern: /^https:\/\/www\.realmeye\.com\/s\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'realmeye-sprites',
              expiration: { maxEntries: 2000, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
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
