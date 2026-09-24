import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split heavy visualisation libraries into their own lazy-loaded chunks
        // so the initial page load does not pay the cost of recharts (~300 KB)
        // or leaflet (~150 KB) until the component that needs them is rendered.
        //
        // recharts  → loaded when TrendChart mounts (advisor tab)
        // leaflet   → loaded when RouteMap mounts (compare tab)
        //
        // Vite 8 uses rolldown which requires manualChunks as a function.
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/recharts/')) {
            return 'vendor-recharts'
          }
          if (
            id.includes('node_modules/leaflet') ||
            id.includes('node_modules/react-leaflet') ||
            id.includes('node_modules/@react-leaflet')
          ) {
            return 'vendor-leaflet'
          }
        },
      },
    },
  },
})
