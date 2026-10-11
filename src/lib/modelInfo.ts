/** Ficha pesquisada de um modelo (dados verificados na web, com fontes). */
export interface ModelInfo {
  id: string
  researchedAt: string
  displayName: string
  summary: string
  generation: string | null
  timeline: { modelYear: string; change: string }[]
  highlights: string[]
  watchOuts: string[]
  specs: {
    version: string | null
    engine: string | null
    powerCv: string | null
    torqueKgfm: string | null
    transmission: string | null
    trunkL: number | null
    lengthMm: number | null
    wheelbaseMm: number | null
    safety: string | null
    warranty: string | null
  }
  inmetro: {
    version: string | null
    cityGas: number | null
    roadGas: number | null
    cityEth: number | null
    roadEth: number | null
    cityKmKWh: number | null
    roadKmKWh: number | null
    year: string | null
    source: string | null
  }
  price0km: { version: string | null; price: number | null; date: string | null; source: string | null }
  versionsAndPrices: { version: string; price: number | null; date: string | null; source: string | null }[]
  launchModelYearBR: number | null
  catalogCheck: string | null
  wikipedia: { lang: string; title: string } | null
  officialUrl: string | null
  sources: { label: string; url: string }[]
  unverified: string[]
}

/** Campos usados fora da página do modelo (fotos, preços, ficha resumida). O resto da ficha carrega sob demanda. */
export type ModelInfoCore = Pick<ModelInfo, 'id' | 'researchedAt' | 'wikipedia' | 'price0km' | 'versionsAndPrices' | 'specs' | 'inmetro'>

// Cada glob importa só uma chave do JSON: o bundle principal não leva resumos, histórico e fontes.
const ids = import.meta.glob<string>('../data/models/*.json', { eager: true, import: 'id' })
const researchedAt = import.meta.glob<string>('../data/models/*.json', { eager: true, import: 'researchedAt' })
const wikipedia = import.meta.glob<ModelInfo['wikipedia']>('../data/models/*.json', { eager: true, import: 'wikipedia' })
const price0km = import.meta.glob<ModelInfo['price0km']>('../data/models/*.json', { eager: true, import: 'price0km' })
const versionsAndPrices = import.meta.glob<ModelInfo['versionsAndPrices']>('../data/models/*.json', { eager: true, import: 'versionsAndPrices' })
const specs = import.meta.glob<ModelInfo['specs']>('../data/models/*.json', { eager: true, import: 'specs' })
const inmetro = import.meta.glob<ModelInfo['inmetro']>('../data/models/*.json', { eager: true, import: 'inmetro' })

export const MODEL_INFO: Record<string, ModelInfoCore> = Object.fromEntries(
  Object.keys(ids).map((path) => [
    ids[path],
    {
      id: ids[path],
      researchedAt: researchedAt[path],
      wikipedia: wikipedia[path] ?? null,
      price0km: price0km[path],
      versionsAndPrices: versionsAndPrices[path] ?? [],
      specs: specs[path],
      inmetro: inmetro[path],
    },
  ]),
)

const full = import.meta.glob<{ default: ModelInfo }>('../data/models/*.json')
const pathOf = Object.fromEntries(Object.entries(ids).map(([path, id]) => [id, path]))

/** Ficha completa (resumo, histórico, fontes), carregada só quando a página do modelo abre. */
export async function loadModelInfo(id: string): Promise<ModelInfo | undefined> {
  const path = pathOf[id]
  return path ? (await full[path]()).default : undefined
}
