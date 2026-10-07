import { CATALOG } from './catalog'
import { MODEL_INFO } from './modelInfo'

/** Checklist de equipamentos verificados por versão (true/false/null = não confirmado). */
export interface FeatureData {
  id: string
  version: string
  researchedAt: string
  tech: Record<TechKey, boolean | null>
  comfort: Record<ComfortKey, boolean | null>
  safety: Record<SafetyKey, boolean | null>
  /** counts=false quando o teste é de outro modelo/versão (mostrado, mas fora da nota). */
  ncap: { stars: number | null; year: number | null; program: string | null; note?: string; source?: string | null; counts?: boolean }
  sources: { label: string; url: string }[]
  unverified?: string[]
}

export type TechKey = 'screen10' | 'wirelessMirroring' | 'digitalCluster' | 'wirelessCharger' | 'camera360' | 'adaptiveCruise' | 'connectedApp' | 'keyless'
export type ComfortKey = 'automatic' | 'digitalAC' | 'rearVents' | 'leather' | 'powerSeat' | 'seatClimate' | 'sunroof'
export type SafetyKey = 'airbags6' | 'aeb' | 'laneKeep' | 'blindSpot' | 'rearCrossTraffic'

export const ITEM_LABEL: Record<TechKey | ComfortKey | SafetyKey | 'rearSpace', string> = {
  screen10: 'Multimídia de 10" ou mais',
  wirelessMirroring: 'Android Auto / CarPlay sem fio',
  digitalCluster: 'Painel 100% digital',
  wirelessCharger: 'Carregador por indução',
  camera360: 'Câmera 360°',
  adaptiveCruise: 'Piloto automático adaptativo',
  connectedApp: 'App com funções remotas',
  keyless: 'Chave presencial e partida por botão',
  automatic: 'Câmbio automático',
  digitalAC: 'Ar-condicionado digital',
  rearVents: 'Saídas de ar traseiras',
  leather: 'Bancos em couro/sintético',
  powerSeat: 'Banco do motorista elétrico',
  seatClimate: 'Bancos ventilados ou aquecidos',
  sunroof: 'Teto solar',
  rearSpace: 'Entre-eixos de 2,65 m ou mais (espaço traseiro)',
  airbags6: '6 airbags ou mais',
  aeb: 'Frenagem autônoma de emergência',
  laneKeep: 'Assistente de permanência em faixa',
  blindSpot: 'Monitor de ponto cego',
  rearCrossTraffic: 'Alerta de tráfego cruzado traseiro',
}

const files = import.meta.glob<{ default: FeatureData }>('../data/features/*.json', { eager: true })
export const FEATURES: Record<string, FeatureData> = Object.fromEntries(
  Object.entries(files).map(([path, m]) => [path.split('/').pop()!.replace('.json', ''), m.default]),
)

export interface Score {
  /** 0–10, ou null quando os dados confirmados não bastam. */
  value: number | null
  items: { label: string; has: boolean | null }[]
  note?: string
}

const MIN_COVERAGE = 0.4

/**
 * Nota conservadora: proporção de itens que o carro comprovadamente tem. Item não confirmado conta como ausente
 * (as fontes costumam citar o que o carro tem, raramente o que falta). Sem nota abaixo de 40% de itens confirmados.
 */
function checklist(items: { label: string; has: boolean | null }[], note?: string): Score {
  const known = items.filter((i) => i.has !== null)
  if (!items.length || known.length / items.length < MIN_COVERAGE) {
    return { value: null, items, note: `Dados insuficientes: ${known.length} de ${items.length} itens confirmados` }
  }
  const yes = known.filter((i) => i.has).length
  const pending = items.length - known.length
  return {
    value: Math.round(((10 * yes) / items.length) * 10) / 10,
    items,
    note: note ?? `Tem ${yes} de ${items.length} itens${pending ? ` (${pending} não confirmado${pending > 1 ? 's' : ''}, contado${pending > 1 ? 's' : ''} como ausente${pending > 1 ? 's' : ''})` : ''}`,
  }
}

/** Busca o checklist de um modelo do catálogo (ou de um ano específico, ex.: o carro do usuário). */
export function featuresFor(modelId?: string, modelYear?: number): FeatureData | undefined {
  if (!modelId) return undefined
  return (modelYear ? FEATURES[`${modelId}@${modelYear}`] : undefined) ?? FEATURES[modelId]
}

export function techScore(f?: FeatureData): Score {
  if (!f) return { value: null, items: [], note: 'Sem checklist pesquisado' }
  return checklist((Object.keys(f.tech) as TechKey[]).map((k) => ({ label: ITEM_LABEL[k], has: f.tech[k] })))
}

export function comfortScore(f: FeatureData | undefined, modelId?: string): Score {
  if (!f) return { value: null, items: [], note: 'Sem checklist pesquisado' }
  const m = CATALOG.find((x) => x.id === modelId)
  const wb = m ? MODEL_INFO[m.infoId ?? m.id]?.specs.wheelbaseMm : null
  const items = (Object.keys(f.comfort) as ComfortKey[]).map((k) => ({ label: ITEM_LABEL[k], has: f.comfort[k] }))
  items.push({ label: ITEM_LABEL.rearSpace, has: wb ? wb >= 2650 : null })
  return checklist(items)
}

/** Segurança: 60% Latin NCAP (estrelas × 2) + 40% assistentes; sem teste, só os assistentes. */
export function safetyScore(f?: FeatureData): Score {
  if (!f) return { value: null, items: [], note: 'Sem checklist pesquisado' }
  const adas = checklist((Object.keys(f.safety) as SafetyKey[]).map((k) => ({ label: ITEM_LABEL[k], has: f.safety[k] })))
  const stars = f.ncap?.stars
  const ncapLabel =
    stars !== null && stars !== undefined
      ? `${f.ncap.program ?? 'NCAP'}${f.ncap.year ? ` ${f.ncap.year}` : ''}: ${stars} estrela${stars === 1 ? '' : 's'}`
      : 'Sem teste NCAP encontrado'
  // Resultados anteriores a 2020 (protocolo antigo do Latin NCAP) e testes de outro modelo não entram na nota.
  const outdated = f.ncap?.year !== null && f.ncap?.year !== undefined && f.ncap.year < 2020
  const otherModel = f.ncap?.counts === false
  if (stars === null || stars === undefined || outdated || otherModel) {
    const why = outdated ? ' (protocolo anterior a 2020, não comparável)' : otherModel ? ' (teste de outro modelo/versão)' : ''
    return { ...adas, note: `${ncapLabel}${why}; nota só pelos assistentes (${adas.note})` }
  }
  const ncap = stars * 2
  const value = adas.value === null ? ncap : Math.round((0.6 * ncap + 0.4 * adas.value) * 10) / 10
  return { value, items: adas.items, note: `${ncapLabel} (60%) + assistentes (40%)` }
}

/** Nota relativa: o melhor valor do conjunto recebe 10. */
export function relativeScore(value: number, best: number, lowerIsBetter = true): number {
  if (value <= 0 || best <= 0) return 0
  const r = lowerIsBetter ? best / value : value / best
  return Math.round(Math.min(10, 10 * r) * 10) / 10
}

export function average(values: (number | null)[]): number | null {
  const v = values.filter((x): x is number => x !== null)
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null
}
