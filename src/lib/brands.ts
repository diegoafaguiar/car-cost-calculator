import { CATALOG } from './catalog'
import { brandSlug } from './router'
import type { CatalogModel, Category, Horizon, Powertrain, ScenarioResult } from './types'

export interface Brand {
  name: string
  slug: string
  models: CatalogModel[]
  categories: Category[]
  powertrains: Powertrain[]
  priceMin: number
  priceMax: number
  /** Marca que começou a vender no Brasil em 2025–2026 (rede e histórico de revenda curtos). */
  newInBrazil: boolean
  /** Fator de depreciação da marca (> 1 = desvaloriza mais que a média). */
  depreciationFactor: number
}

/** Estreias no Brasil em 2025–2026 (lançamentos oficiais das marcas; a MG voltou ao país em 2025). */
const NEW_IN_BRAZIL = new Set(['Caoa Changan', 'Denza', 'GAC', 'Geely', 'Jaecoo', 'Jetour', 'Leapmotor', 'MG', 'Omoda', 'Zeekr'])

const uniq = <T,>(xs: T[]) => [...new Set(xs)]

export const BRANDS: Brand[] = uniq(CATALOG.map((m) => m.brand))
  .map((name) => {
    const models = CATALOG.filter((m) => m.brand === name)
    const prices = models.map((m) => m.refPriceNew)
    return {
      name,
      slug: brandSlug(name),
      models,
      categories: uniq(models.map((m) => m.category)),
      powertrains: uniq(models.map((m) => m.powertrain)),
      priceMin: Math.min(...prices),
      priceMax: Math.max(...prices),
      newInBrazil: NEW_IN_BRAZIL.has(name),
      depreciationFactor: Math.max(...models.map((m) => m.depreciationFactor)),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

export const brandBySlug = (slug: string) => BRANDS.find((b) => b.slug === slug)

/** Melhor forma de ter o modelo (0 km ou seminovo) no horizonte, pelas premissas do usuário. */
export function bestFor(results: ScenarioResult[], modelId: string, h: Horizon): ScenarioResult | undefined {
  let best: ScenarioResult | undefined
  for (const r of results) {
    if (r.scenario.modelId !== modelId || (r.scenario.kind !== 'new' && r.scenario.kind !== 'used')) continue
    if (!best || r.horizons[h].total < best.horizons[h].total) best = r
  }
  return best
}
