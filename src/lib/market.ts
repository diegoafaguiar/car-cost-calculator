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
  sources: { label: string; url: string }[]
}

interface SearchPattern {
  pattern: string
  example?: string
  note?: string
}

const files = import.meta.glob<{ default: MarketData }>('../data/market/*@*.json', { eager: true })
const patterns = import.meta.glob<{ default: Record<string, SearchPattern> }>('../data/market/_search_urls.json', { eager: true })

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

const PATTERNS: Record<string, SearchPattern> = Object.values(patterns)[0]?.default ?? {}

/**
 * Links de busca nos marketplaces. Usa os padrões confirmados na pesquisa (src/data/market/_search_urls.json)
 * e, para os demais, uma busca no Google restrita ao site.
 */
export function searchLinks(brand: string, model: string, year?: number): { source: string; url: string }[] {
  const q = `${brand} ${model}${year ? ` ${year}` : ''}`
  const fill = (p: string) =>
    p
      .replace('{marca}', slug(brand))
      .replace('{modelo}', slug(model))
      .replace('{ano}', year ? String(year) : '')
      .replace('{q}', encodeURIComponent(q))
  const sites: [string, string][] = [
    ['Webmotors', 'webmotors.com.br'],
    ['OLX', 'olx.com.br'],
    ['iCarros', 'icarros.com.br'],
    ['Mobiauto', 'mobiauto.com.br'],
  ]
  return sites.map(([name, domain]) => ({
    source: name,
    url: PATTERNS[name]?.pattern
      ? fill(PATTERNS[name].pattern)
      : `https://www.google.com/search?q=${encodeURIComponent(`${q} site:${domain}`)}`,
  }))
}
