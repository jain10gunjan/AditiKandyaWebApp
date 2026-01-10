import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize asset handling
    assetsInlineLimit: 4096, // Only inline assets smaller than 4kb
    rollupOptions: {
      output: {
        // Better chunking for videos
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.mp4')) {
            return 'assets/videos/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  // Optimize video loading
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  }
})
