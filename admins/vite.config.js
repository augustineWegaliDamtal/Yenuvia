import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // 🟢 1. Lock the port so it never changes!
    port: 5174,
    strictPort: true,
    
    // 🔥 THE FIX: Allows Cloudflare tunnels to access this Admin Vite server
    allowedHosts: true,
    
    // 🟢 2. Keep your existing proxy exactly as it is, AND ADD SOCKETS
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        secure: false
      },
      // 🔥 THE FIX: Forwards phone/tunnel socket connections to the backend
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true, 
      }
    },
  },
  plugins: [
    react(), 
    tailwindcss(),
    // 🔥 2. INJECT ADMIN PWA ENGINE
    VitePWA({
      registerType: 'autoUpdate', // Admins get silent background updates
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'], 
      manifest: {
        name: 'Yenuvia Command Center',
        short_name: 'Yenuvia Admin',
        description: 'Superadmin secure gateway.',
        theme_color: '#dc2626', // Admin Red
        background_color: '#000000', // Black
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/admin-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/admin-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/admin-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true, 
        clientsClaim: true,
        skipWaiting: true,
        // 🛑 CRITICAL: Tells the PWA to NEVER cache your Node.js API or Socket traffic!
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/] 
      }
    })
  ],
})