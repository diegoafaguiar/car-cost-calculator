import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// @ts-expect-error módulo JS sem tipos, usado só no build
import { routeMeta, withMeta } from './scripts/route-meta.mjs'

/**
 * Gera um HTML por rota pública (/carro/x.html, /marca/y.html…) com título, descrição e Open Graph próprios.
 * O app continua sendo uma SPA: cada arquivo carrega o mesmo bundle; só as metatags mudam (prévia do link compartilhado).
 */
function prerenderMeta(): Plugin {
  let outDir = 'dist'
  return {
    name: 'prerender-meta',
    apply: 'build',
    configResolved(c) {
      outDir = join(c.root, c.build.outDir)
    },
    closeBundle() {
      const html = readFileSync(join(outDir, 'index.html'), 'utf8')
      const routes: { path: string; title: string; description: string }[] = routeMeta(process.cwd())
      for (const r of routes) {
        const file = join(outDir, `${r.path.slice(1)}.html`)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, withMeta(html, r))
      }
      this.info(`${routes.length} páginas com metatags geradas`)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), prerenderMeta()],
  // Fichas (src/data/models) e anúncios pesquisados (src/data/market) vão no bundle principal.
  build: { chunkSizeWarningLimit: 1000 },
})
