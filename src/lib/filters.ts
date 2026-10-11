import { CATEGORY_ABOVE, CATEGORY_BELOW, CATEGORY_LABEL, CATEGORY_ORDER, POWERTRAIN_LABEL, TRANSMISSION_LABEL } from './catalog'
import { DEFAULT_PREFERENCES } from './defaults'
import { money } from './format'
import type { Category, Powertrain, Preferences, ScenarioKind, Transmission } from './types'

const KIND_LABEL: Record<ScenarioKind, string> = { keep: 'Manter', new: '0 km', used: 'Seminovo', subscription: 'Assinatura' }
const ALL_POWERTRAINS = Object.keys(POWERTRAIN_LABEL) as Powertrain[]
const ALL_TRANSMISSIONS = Object.keys(TRANSMISSION_LABEL) as Transmission[]
const ALL_KINDS = Object.keys(KIND_LABEL) as ScenarioKind[]
const ELECTRIFIED: Powertrain[] = ['hibrido', 'hibrido-plugin', 'eletrico']

const same = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((x) => b.includes(x))
const k = (n: number) => `${Math.round(n / 1000)} mil`

/** Faixa de categorias "parecidas" com a do carro do usuário (mesma, uma abaixo e uma acima). */
export const nearbyCategories = (c: Category): Category[] => [...CATEGORY_BELOW[c], c, ...CATEGORY_ABOVE[c]]

export interface ActiveFilter {
  id: string
  label: string
  /** Mudança nas preferências que remove só este filtro. */
  clear: Partial<Preferences>
}

/** Filtros diferentes do "sem filtro", em linguagem simples, para mostrar como etiquetas removíveis. */
export function activeFilters(p: Preferences, carCategory: Category): ActiveFilter[] {
  const out: ActiveFilter[] = []
  const cats = p.categories
  if (!same(cats, CATEGORY_ORDER)) {
    const label = same(cats, nearbyCategories(carCategory))
      ? 'Categorias parecidas com a sua'
      : same(cats, [carCategory])
        ? `Só ${CATEGORY_LABEL[carCategory]}`
        : cats.length <= 2
          ? cats.map((c) => CATEGORY_LABEL[c]).join(', ')
          : `${cats.length} categorias`
    out.push({ id: 'cat', label, clear: { categories: CATEGORY_ORDER } })
  }
  if (!same(p.powertrains, ALL_POWERTRAINS)) {
    const label = same(p.powertrains, ELECTRIFIED)
      ? 'Híbridos e elétricos'
      : p.powertrains.length <= 2
        ? p.powertrains.map((x) => POWERTRAIN_LABEL[x]).join(', ')
        : `${p.powertrains.length} motorizações`
    out.push({ id: 'mot', label, clear: { powertrains: ALL_POWERTRAINS } })
  }
  const tr = p.transmissions ?? ALL_TRANSMISSIONS
  if (!same(tr, ALL_TRANSMISSIONS)) out.push({ id: 'cambio', label: tr.map((x) => TRANSMISSION_LABEL[x]).join(', ') || 'Nenhum câmbio', clear: { transmissions: ALL_TRANSMISSIONS } })
  if (!same(p.kinds, ALL_KINDS)) {
    const off = ALL_KINDS.filter((x) => !p.kinds.includes(x) && x !== 'keep')
    if (off.length) out.push({ id: 'kind', label: `Sem ${off.map((x) => KIND_LABEL[x].toLowerCase()).join(', ')}`, clear: { kinds: ALL_KINDS } })
  }
  if (p.minPrice > 0 || p.maxPrice > 0) {
    const label = p.minPrice > 0 && p.maxPrice > 0 ? `R$ ${k(p.minPrice)} a ${k(p.maxPrice)}` : p.maxPrice > 0 ? `Até R$ ${k(p.maxPrice)}` : `A partir de R$ ${k(p.minPrice)}`
    out.push({ id: 'price', label, clear: { minPrice: 0, maxPrice: 0 } })
  }
  if (p.minModelYear > 0 || p.maxModelYear > 0) {
    const label = p.minModelYear > 0 && p.maxModelYear > 0 ? `Ano ${p.minModelYear}–${p.maxModelYear}` : p.minModelYear > 0 ? `${p.minModelYear} ou mais novo` : `Até ${p.maxModelYear}`
    out.push({ id: 'year', label, clear: { minModelYear: 0, maxModelYear: 0 } })
  }
  if (p.maxMonthly > 0) out.push({ id: 'monthly', label: `Até ${money(p.maxMonthly)}/mês`, clear: { maxMonthly: 0 } })
  if (p.minSeats > 0) out.push({ id: 'seats', label: `${p.minSeats}+ lugares`, clear: { minSeats: 0 } })
  if ((p.brands ?? []).length) out.push({ id: 'brands', label: p.brands.length <= 2 ? p.brands.join(', ') : `${p.brands.length} marcas`, clear: { brands: [] } })
  if (p.search.trim()) out.push({ id: 'search', label: `“${p.search.trim()}”`, clear: { search: '' } })
  if (p.groupByModel) out.push({ id: 'group', label: 'Um por modelo', clear: { groupByModel: false } })
  return out
}

export interface QuickFilter {
  id: string
  label: string
  active: (p: Preferences, onlySavings: boolean) => boolean
  /** Liga ou desliga o atalho. */
  toggle: (p: Preferences, onlySavings: boolean) => { prefs?: Partial<Preferences>; onlySavings?: boolean }
}

/** Atalhos de um toque, os filtros mais usados. */
export function quickFilters(carCategory: Category): QuickFilter[] {
  const near = nearbyCategories(carCategory)
  return [
    {
      id: 'near',
      label: 'Parecidos com o meu',
      active: (p) => same(p.categories, near),
      toggle: (p) => ({ prefs: { categories: same(p.categories, near) ? CATEGORY_ORDER : near } }),
    },
    {
      id: 'electrified',
      label: 'Híbridos e elétricos',
      active: (p) => same(p.powertrains, ELECTRIFIED),
      toggle: (p) => ({ prefs: { powertrains: same(p.powertrains, ELECTRIFIED) ? ALL_POWERTRAINS : ELECTRIFIED } }),
    },
    {
      id: 'savings',
      label: 'Só os que economizam',
      active: (_p, s) => s,
      toggle: (_p, s) => ({ onlySavings: !s }),
    },
    {
      id: 'recent',
      label: '2023 ou mais novo',
      active: (p) => p.minModelYear === 2023,
      toggle: (p) => ({ prefs: { minModelYear: p.minModelYear === 2023 ? DEFAULT_PREFERENCES.minModelYear : 2023 } }),
    },
    {
      id: 'auto',
      label: 'Automático',
      active: (p) => same(p.transmissions ?? ALL_TRANSMISSIONS, ['automatico']),
      toggle: (p) => ({ prefs: { transmissions: same(p.transmissions ?? [], ['automatico']) ? ALL_TRANSMISSIONS : ['automatico'] } }),
    },
    {
      id: 'group',
      label: 'Um por modelo',
      active: (p) => !!p.groupByModel,
      toggle: (p) => ({ prefs: { groupByModel: !p.groupByModel } }),
    },
  ]
}
