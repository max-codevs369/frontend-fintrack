import { defineConfig } from 'vite' 
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: '/', 
        name: 'Fintrack Money',
        short_name: 'Fintrack',
        description: 'Aplikasi pencatatan keuangan pribadi',
        theme_color: '#ffffff',
        start_url: '/', 
        display: 'standalone',
        icons: [
          { 
            src: '/wallet-icon-192.png',
            sizes: '192x192', 
            type: 'image/png',
            purpose: 'any' 
          },
          { 
            src: '/wallet-icon-512.png',
            sizes: '512x512', 
            type: 'image/png',
            purpose: 'any maskable' 
          }
        ]
      }
    })
  ]
})