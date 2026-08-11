import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const deploymentBase = process.env.VITE_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base: deploymentBase,
  plugins: [
    react({
      // React Compiler is experimental - uncomment when using React 19+
      // babel: {
      //   plugins: [
      //     ['babel-plugin-react-compiler', {}],
      //   ],
      // },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'icon-192x192.png',
        'icon-512x512.png',
        'robots.txt',
        'sitemap.xml',
      ],
      manifest: {
        name: 'Tensho (天翔) - Mahjong Roguelike',
        short_name: 'Tensho',
        description:
          'A strategic roguelike deck-builder inspired by Riichi Mahjong. Build powerful tile combinations, collect Decrees, and master Yaku patterns.',
        theme_color: '#1a3a2a',
        background_color: '#1a3a2a',
        display: 'standalone',
        orientation: 'portrait',
        scope: deploymentBase,
        start_url: deploymentBase,
        id: deploymentBase,
        categories: ['games', 'entertainment', 'puzzle'],
        lang: 'en',
        dir: 'ltr',
        prefer_related_applications: false,
        screenshots: [
          {
            src: 'screenshot-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Tensho gameplay on desktop',
          },
          {
            src: 'screenshot-narrow.png',
            sizes: '720x1280',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Tensho gameplay on mobile',
          },
        ],
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,webp,svg,mp3,ttf,woff,woff2}',
        ],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024, // 15 MB for large font files
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:mp3|wav|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
