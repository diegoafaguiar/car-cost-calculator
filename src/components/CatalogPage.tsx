import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react'
import { bestFor, BRANDS } from '../lib/brands'
import { CATALOG, CATEGORY_LABEL, CATEGORY_ORDER, POWERTRAIN_LABEL, TRANSMISSION_LABEL } from '../lib/catalog'
import { normalize } from '../lib/format'
import { paths, usePageMeta } from '../lib/router'
import type { Category, Horizon, Powertrain, ScenarioResult, Transmission } from '../lib/types'
import { Breadcrumbs, CarCard, CarGrid, PageHeader, ShareButton } from './Browse'
import { Sheet } from './Sheet'
import { Chip } from './ui'

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
  const nActive = f.cat.length + f.mot.length + f.cambio.length + (f.marca ? 1 : 0)
  const [sheet, setSheet] = useState(false)
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

      <section aria-label="Filtros" className="space-y-3">
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Buscar carro</span>
            <svg viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden>
              <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={f.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Buscar marca, modelo ou versão"
              enterKeyHint="search"
              className="h-11 w-full rounded-xl border border-line bg-surface pr-3 pl-9 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 sm:text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => setSheet(true)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium ${nActive ? 'border-accent/40 bg-accent-soft text-accent' : 'border-line bg-surface hover:bg-surface-2'}`}
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
              <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Filtros</span>
            {nActive > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">{nActive}</span>}
          </button>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {(['suv-compacto', 'suv-medio', 'suv-grande'] as Category[]).map((c) => (
            <QuickChip key={c} on={f.cat.includes(c)} onClick={() => set({ cat: toggle(f.cat, c) })}>
              {CATEGORY_LABEL[c]}
            </QuickChip>
          ))}
          {(['hibrido', 'hibrido-plugin', 'eletrico'] as Powertrain[]).map((p) => (
            <QuickChip key={p} on={f.mot.includes(p)} onClick={() => set({ mot: toggle(f.mot, p) })}>
              {POWERTRAIN_LABEL[p]}
            </QuickChip>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span aria-live="polite">
            {shown.length} {shown.length === 1 ? 'carro' : 'carros'}
            {active && (
              <button type="button" className="ml-3 font-medium text-accent hover:underline" onClick={() => setF({ q: '', cat: [], mot: [], cambio: [], marca: '', ordem: f.ordem })}>
                Limpar filtros
              </button>
            )}
          </span>
          <label className="relative">
            <span className="sr-only">Ordenar</span>
            <select value={f.ordem} onChange={(e) => set({ ordem: e.target.value as Sort })} className="appearance-none bg-transparent py-1 pr-6 text-right font-medium text-ink outline-none">
              {(Object.keys(SORT_LABEL) as Sort[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABEL[k]}
                </option>
              ))}
            </select>
            <svg viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 right-0.5 size-3.5 -translate-y-1/2" aria-hidden>
              <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </label>
        </div>
      </section>

      {sheet && (
        <Sheet
          title="Filtros"
          onClose={() => setSheet(false)}
          footer={
            <button type="button" onClick={(e) => e.currentTarget.closest('dialog')?.close()} className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-ink hover:opacity-90">
              Ver {shown.length} {shown.length === 1 ? 'carro' : 'carros'}
            </button>
          }
        >
          <div className="space-y-6">
            <SheetSection title="Categoria">
              {CATEGORY_ORDER.map((c) => (
                <Chip key={c} active={f.cat.includes(c)} onClick={() => set({ cat: toggle(f.cat, c) })}>
                  {CATEGORY_LABEL[c]}
                </Chip>
              ))}
            </SheetSection>
            <SheetSection title="Motorização">
              {(Object.keys(POWERTRAIN_LABEL) as Powertrain[]).map((p) => (
                <Chip key={p} active={f.mot.includes(p)} onClick={() => set({ mot: toggle(f.mot, p) })}>
                  {POWERTRAIN_LABEL[p]}
                </Chip>
              ))}
            </SheetSection>
            <SheetSection title="Câmbio">
              {(Object.keys(TRANSMISSION_LABEL) as Transmission[]).map((t) => (
                <Chip key={t} active={f.cambio.includes(t)} onClick={() => set({ cambio: toggle(f.cambio, t) })}>
                  {TRANSMISSION_LABEL[t]}
                </Chip>
              ))}
            </SheetSection>
            <SheetSection title="Marca">
              <Chip active={!f.marca} onClick={() => set({ marca: '' })}>
                Todas
              </Chip>
              {BRANDS.map((b) => (
                <Chip key={b.slug} active={f.marca === b.name} onClick={() => set({ marca: f.marca === b.name ? '' : b.name })}>
                  {b.name}
                </Chip>
              ))}
            </SheetSection>
          </div>
        </Sheet>
      )}

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

function QuickChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap ${on ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface text-ink-2 hover:text-ink'}`}
    >
      {children}
    </button>
  )
}

function SheetSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </section>
  )
}
