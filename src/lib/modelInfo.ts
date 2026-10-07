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

const files = import.meta.glob<{ default: ModelInfo }>('../data/models/*.json', { eager: true })

export const MODEL_INFO: Record<string, ModelInfo> = Object.fromEntries(
  Object.values(files).map((m) => [m.default.id, m.default]),
)
