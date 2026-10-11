import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { bestFor, BRANDS } from '../lib/brands'
import { CATALOG, CATEGORY_LABEL, CATEGORY_ORDER, POWERTRAIN_LABEL, TRANSMISSION_LABEL } from '../lib/catalog'
import { normalize } from '../lib/format'
import { paths, usePageMeta } from '../lib/router'
import type { Category, Horizon, Powertrain, ScenarioResult, Transmission } from '../lib/types'
import { Breadcrumbs, CarCard, CarGrid, PageHeader, ShareButton } from './Browse'
import { Chip, SelectField } from './ui'

type Sort = 'cost' | 'price' | 'name'
const SORT_LABEL: Record<Sort, string> = { cost: 'Menor custo para você', price: 'Menor preço 0 km', name: 'Nome (A–Z)' }

interface Filters {
  q: string
  cat: Category[]
  mot: Powertrain[]
  cambio: Transmission[]
  marca: string
  ordem: Sort
}

const list = <T extends string>(v: string | null, allowed: readonly string[]) =>
  (v ? v.split(',').filter((x) => allowed.includes(x)) : []) as T[]

function readFilters(): Filters {
  const p = new URLSearchParams(location.search)
  const ordem = p.get('ordem') as Sort
  return {
    q: p.get('q') ?? '',
    cat: list<Category>(p.get('cat'), CATEGORY_ORDER),
    mot: list<Powertrain>(p.get('mot'), Object.keys(POWERTRAIN_LABEL)),
    cambio: list<Transmission>(p.get('cambio'), Object.keys(TRANSMISSION_LABEL)),
    marca: p.get('marca') ?? '',
    ordem: ordem in SORT_LABEL ? ordem : 'cost',
  }
}

/** Mantém os filtros na URL, para o link compartilhado abrir a mesma lista. */
function writeFilters(f: Filters) {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.cat.length) p.set('cat', f.cat.join(','))
  if (f.mot.length) p.set('mot', f.mot.join(','))
  if (f.cambio.length) p.set('cambio', f.cambio.join(','))
  if (f.marca) p.set('marca', f.marca)
  if (f.ordem !== 'cost') p.set('ordem', f.ordem)
  const qs = p.toString()
  history.replaceState(history.state, '', `${location.pathname}${qs ? `?${qs}` : ''}`)
}

const ALL = '__todas'
const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x])

/** Todos os carros do catálogo, com busca e filtros. */
export function CatalogPage({ results, keep, horizon }: { results: ScenarioResult[]; keep?: ScenarioResult; horizon: Horizon }) {
  const [f, setF] = useState<Filters>(readFilters)
  const q = useDeferredValue(f.q)
  useEffect(() => writeFilters(f), [f])
  usePageMeta(
    'Todos os carros — preço, custo e ficha técnica | Custo de Carro',
    `${CATALOG.length} carros vendidos no Brasil com preço, consumo, equipamentos e custo total de ter em 1, 3 e 5 anos.`,
  )

  const best = useMemo(() => new Map(CATALOG.map((m) => [m.id, bestFor(results, m.id, horizon)])), [results, horizon])
  const shown = useMemo(() => {
    const words = normalize(q).split(/\s+/).filter(Boolean)
    const out = CATALOG.filter((m) => {
      if (f.cat.length && !f.cat.includes(m.category)) return false
      if (f.mot.length && !f.mot.includes(m.powertrain)) return false
      if (f.cambio.length && !f.cambio.includes(m.transmission)) return false
      if (f.marca && m.brand !== f.marca) return false
      const text = normalize(`${m.brand} ${m.model} ${m.version}`)
      return words.every((w) => text.includes(w))
    })
    const cost = (id: string) => best.get(id)?.horizons[horizon].monthly ?? Infinity
    return out.sort((a, b) =>
      f.ordem === 'price'
        ? a.refPriceNew - b.refPriceNew
        : f.ordem === 'name'
          ? `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, 'pt-BR')
          : cost(a.id) - cost(b.id),
    )
  }, [f.cat, f.mot, f.cambio, f.marca, f.ordem, q, best, horizon])

  const active = f.q || f.cat.length || f.mot.length || f.cambio.length || f.marca
  const set = (p: Partial<Filters>) => setF((x) => ({ ...x, ...p }))

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Início', href: paths.home() }, { label: 'Carros' }]} />
      <PageHeader
        eyebrow={`${CATALOG.length} carros · ${BRANDS.length} marcas`}
        title="Todos os carros"
        subtitle={`Preço 0 km, ficha técnica, equipamentos e quanto custa ter cada um com as suas premissas (melhor ano entre 0 km e seminovos, em ${horizon} ${horizon === 1 ? 'ano' : 'anos'}).`}
        actions={<ShareButton title="Todos os carros — Custo de Carro" />}
      />

      <section aria-label="Filtros" className="space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-2">Buscar</span>
            <input
              type="search"
              value={f.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Buscar por marca, modelo ou versão"
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <SelectField<string>
            label="Marca"
            value={f.marca || ALL}
            options={[{ value: ALL, label: 'Todas as marcas' }, ...BRANDS.map((b) => ({ value: b.name, label: `${b.name} (${b.models.length})` }))]}
            onChange={(v) => set({ marca: v === ALL ? '' : v })}
          />
          <SelectField<Sort> label="Ordenar" value={f.ordem} options={(Object.keys(SORT_LABEL) as Sort[]).map((k) => ({ value: k, label: SORT_LABEL[k] }))} onChange={(v) => set({ ordem: v })} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_ORDER.map((c) => (
            <Chip key={c} active={f.cat.includes(c)} onClick={() => set({ cat: toggle(f.cat, c) })}>
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(POWERTRAIN_LABEL) as Powertrain[]).map((p) => (
            <Chip key={p} active={f.mot.includes(p)} onClick={() => set({ mot: toggle(f.mot, p) })}>
              {POWERTRAIN_LABEL[p]}
            </Chip>
          ))}
          <span className="mx-1 w-px self-stretch bg-line" aria-hidden />
          {(Object.keys(TRANSMISSION_LABEL) as Transmission[]).map((t) => (
            <Chip key={t} active={f.cambio.includes(t)} onClick={() => set({ cambio: toggle(f.cambio, t) })}>
              {TRANSMISSION_LABEL[t]}
            </Chip>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted">
          <span aria-live="polite">
            {shown.length} {shown.length === 1 ? 'carro' : 'carros'}
          </span>
          {active && (
            <button type="button" className="font-medium text-accent hover:underline" onClick={() => setF({ q: '', cat: [], mot: [], cambio: [], marca: '', ordem: f.ordem })}>
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      {shown.length ? (
        <CarGrid>
          {shown.map((m) => (
            <CarCard key={m.id} model={m} best={best.get(m.id)} keep={keep} horizon={horizon} />
          ))}
        </CarGrid>
      ) : (
        <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">Nenhum carro com esses filtros.</p>
      )}
    </div>
  )
}
