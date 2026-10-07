import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // As fichas pesquisadas (src/data/models) vão no bundle principal; ~155 kB gzip no total.
  build: { chunkSizeWarningLimit: 700 },
})
