import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Fichas (src/data/models) e anúncios pesquisados (src/data/market) vão no bundle principal.
  build: { chunkSizeWarningLimit: 1000 },
})
