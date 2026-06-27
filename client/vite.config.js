import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        secure: false
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000',
        secure: false
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        ws: true,
      }
    },
  },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Yenuvia Cultural Hub',
        short_name: 'Yenuvia',
        theme_color: '#eab308',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true, 
        clientsClaim: true,
        skipWaiting: true,
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
        // 🔥 FIX: This tells Workbox to IGNORE all Cloudinary video requests!
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes('cloudinary.com'),
            handler: 'NetworkOnly',
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
    })
  ],
})