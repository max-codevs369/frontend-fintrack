import { defineConfig } from 'vite' 
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Fintrack Money',
        short_name: 'Fintrack',
        description: 'Aplikasi pencatatan keuangan pribadi',
        theme_color: '#ffffff',
        icons: [
          { 
            src: 'dompet.png', 
            sizes: '192x192', 
            type: 'image/png',
            purpose: 'maskable'
          },
          { 
            src: 'dompet.png', 
            sizes: '512x512', 
            type: 'image/png',
            purpose: 'any' 
          }
        ]
      }
    })
  ]
})