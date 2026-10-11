// Título e descrição de cada rota pública, lidos dos arquivos de dados no momento do build.
// O HTML pré-gerado leva essas metatags, para o link compartilhado (WhatsApp, redes) mostrar o carro ou a marca certa.
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'Custo de Carro'

const normalize = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
export const brandSlug = (b) =>
  normalize(b)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const money = (v) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`

/** Lê os modelos do catálogo (src/lib/catalog.ts) sem executar o TypeScript. */
export function readCatalog(root) {
  const src = readFileSync(join(root, 'src/lib/catalog.ts'), 'utf8')
  const lines = src.split('\n').filter((l) => /^ {2}\{ id: '/.test(l))
  const get = (l, k) => l.match(new RegExp(`\\b${k}: '([^']*)'`))?.[1]
  return lines.map((l) => ({
    id: get(l, 'id'),
    infoId: get(l, 'infoId'),
    brand: get(l, 'brand'),
    model: get(l, 'model'),
    version: get(l, 'version'),
    price: Number(l.match(/refPriceNew: (\d+)/)?.[1] ?? 0),
  }))
}

const clip = (s, n = 160) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`)

export function routeMeta(root) {
  const cars = readCatalog(root)
  const summary = (c) => {
    const f = join(root, 'src/data/models', `${c.infoId ?? c.id}.json`)
    return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')).summary : null
  }
  const brands = [...new Set(cars.map((c) => c.brand))]
  const routes = [
    {
      path: '/carros',
      title: `Todos os carros — preço, custo e ficha técnica | ${SITE}`,
      description: `${cars.length} carros vendidos no Brasil com preço, consumo, equipamentos e custo total de ter em 1, 3 e 5 anos.`,
    },
    {
      path: '/marcas',
      title: `Marcas de carros no Brasil — modelos e preços | ${SITE}`,
      description: `${brands.length} marcas com os modelos à venda no Brasil, faixa de preço e motorizações.`,
    },
  ]
  for (const c of cars) {
    routes.push({
      path: `/carro/${c.id}`,
      title: `${c.brand} ${c.model} ${c.version}: preço, ficha e custo | ${SITE}`,
      description: clip(summary(c) ?? `${c.brand} ${c.model} ${c.version}: 0 km a partir de ${money(c.price)}, consumo e custo total de ter.`),
    })
  }
  for (const b of brands) {
    const ms = cars.filter((c) => c.brand === b)
    const min = Math.min(...ms.map((c) => c.price))
    const max = Math.max(...ms.map((c) => c.price))
    routes.push({
      path: `/marca/${brandSlug(b)}`,
      title: `${b}: modelos, preços e custo de ter | ${SITE}`,
      description: `${ms.length} ${ms.length === 1 ? 'modelo' : 'modelos'} da ${b} no Brasil (${min === max ? money(min) : `${money(min)} a ${money(max)}`}): ficha técnica, equipamentos, consumo e custo total em 1, 3 e 5 anos.`,
    })
  }
  return routes
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** Aplica título, descrição e Open Graph no index.html gerado. */
export function withMeta(html, { title, description }) {
  const tags = [
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE}" />`,
    `<meta name="twitter:card" content="summary" />`,
  ].join('\n    ')
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<!-- og -->[\s\S]*?<!-- \/og -->/, `<!-- og -->\n    ${tags}\n    <!-- /og -->`)
}
