/** Preços de anúncios de seminovos coletados em marketplaces (amostra pesquisada, com data e link). */
export interface Listing {
  title: string
  price: number
  km: number | null
  city: string | null
  source: string
  url: string
  date: string
}

export interface MarketData {
  modelId: string
  modelYear: number
  version: string | null
  fipe: { price: number; reference: string; source: string } | null
  listings: Listing[]
  summary: { count: number; min: number; median: number; max: number } | null
  notes: string | null
  /** Falso quando os anúncios são de outra versão que a do catálogo (não entram no cálculo). */
  useForPrice?: boolean
  sources: { label: string; url: string }[]
}

const files = import.meta.glob<{ default: MarketData }>('../data/market/*@*.json', { eager: true })

export const MARKET: Record<string, MarketData> = Object.fromEntries(
  Object.values(files).map((m) => [`${m.default.modelId}@${m.default.modelYear}`, m.default]),
)

export const marketFor = (modelId: string, modelYear: number): MarketData | undefined => MARKET[`${modelId}@${modelYear}`]

export const marketYears = (modelId: string): MarketData[] =>
  Object.values(MARKET)
    .filter((m) => m.modelId === modelId)
    .sort((a, b) => b.modelYear - a.modelYear)

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/**
 * Links de busca nos marketplaces, com padrões de URL confirmados em páginas reais (pesquisa de out/2026).
 * Filtram por marca, modelo e, quando o site aceita, ano-modelo.
 */
export function searchLinks(brand: string, model: string, year?: number): { source: string; url: string }[] {
  const b = slug(brand)
  const m = slug(model)
  return [
    {
      source: 'Webmotors',
      url: `https://www.webmotors.com.br/carros-usados/estoque/${b}/${m}${year ? `/de.${year}/ate.${year}` : ''}`,
    },
    { source: 'OLX', url: `https://www.olx.com.br/autos-e-pecas/carros-vans-e-utilitarios/${b}/${m}${year ? `/${year}` : ''}` },
    { source: 'Mobiauto', url: `https://www.mobiauto.com.br/comprar/carros-usados/brasil/${b}/${m}${year ? `/ano-${year}` : ''}` },
    { source: 'iCarros', url: `https://www.icarros.com.br/comprar/${b}/${m}` },
  ]
}
