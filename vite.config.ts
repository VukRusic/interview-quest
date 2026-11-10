/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // GitHub Pages serves the repo at /interview-quest/.
  base: '/interview-quest/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Interview Quest',
        short_name: 'Quest',
        description: 'A calm daily path for interview prep.',
        theme_color: '#e8dcbc',
        background_color: '#e8dcbc',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            // Pyodide (pinned version) from jsDelivr: cache it so Python works offline after the first run.
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/pyodide\/v0\.26\.4\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pyodide-0.26.4',
              expiration: { maxEntries: 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
});
