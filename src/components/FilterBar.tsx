import { useMemo, useState, type ReactNode } from 'react'
import { CATALOG, CATEGORY_ABOVE, CATEGORY_BELOW, CATEGORY_LABEL, CATEGORY_ORDER, POWERTRAIN_LABEL, TRANSMISSION_LABEL } from '../lib/catalog'
import { activeFilters, nearbyCategories, quickFilters } from '../lib/filters'
import { normalize } from '../lib/format'
import { paths } from '../lib/router'
import type { Category, Powertrain, Preferences, ScenarioKind, Transmission } from '../lib/types'
import { KIND_LABEL, type SortKey } from './RankingTable'
import { Sheet } from './Sheet'
import { Chip, NumberField, Segmented } from './ui'

const BRANDS = [...new Set(CATALOG.map((m) => m.brand))].sort((a, b) => a.localeCompare(b, 'pt-BR'))

export type Sort = { key: SortKey; dir: 1 | -1 }
const SORTS: { id: string; label: string; sort: Sort }[] = [
  { id: 'rank', label: 'Recomendados', sort: { key: 'rank', dir: 1 } },
  { id: 'monthly', label: 'Menor custo/mês', sort: { key: 'monthly', dir: 1 } },
  { id: 'savings', label: 'Maior economia', sort: { key: 'savings', dir: -1 } },
  { id: 'price', label: 'Menor preço', sort: { key: 'price', dir: 1 } },
  { id: 'breakEven', label: 'Compensa mais rápido', sort: { key: 'breakEven', dir: 1 } },
]

interface Props {
  prefs: Preferences
  onPrefs: (p: Preferences) => void
  carCategory: Category
  onlySavings: boolean
  onOnlySavings: (v: boolean) => void
  resultCount: number
  onAddCustom: (query: string) => void
  onReset?: () => void
  sort: Sort
  onSort: (s: Sort) => void
}

/** Barra de filtros: busca, atalhos de um toque, etiquetas removíveis e o painel completo. */
export function FilterBar(props: Props) {
  const { prefs, onPrefs, carCategory, onlySavings, onOnlySavings, resultCount } = props
  const [open, setOpen] = useState(false)
  const set = (p: Partial<Preferences>) => onPrefs({ ...prefs, ...p })
  const active = activeFilters(prefs, carCategory)
  const count = active.length + (onlySavings ? 1 : 0)
  const quick = quickFilters(carCategory)
  const sortId = SORTS.find((s) => s.sort.key === props.sort.key && s.sort.dir === props.sort.dir)?.id ?? 'custom'

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <SearchBox value={prefs.search} onChange={(v) => set({ search: v })} onAddCustom={props.onAddCustom} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`relative inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition-colors ${
            count ? 'border-accent/40 bg-accent-soft text-accent' : 'border-line bg-surface hover:bg-surface-2'
          }`}
          aria-label={`Filtros${count ? ` (${count} ativos)` : ''}`}
        >
          <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
            <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">Filtros</span>
          {count > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink tabular">{count}</span>}
        </button>
        <label className="relative hidden shrink-0 sm:block">
          <span className="sr-only">Ordenar por</span>
          <select
            value={sortId}
            onChange={(e) => {
              const s = SORTS.find((x) => x.id === e.target.value)
              if (s) props.onSort(s.sort)
            }}
            className="h-full appearance-none rounded-xl border border-line bg-surface py-2 pr-8 pl-3 text-sm font-medium outline-none hover:bg-surface-2 focus:border-accent"
          >
            {sortId === 'custom' && <option value="custom">Ordem da tabela</option>}
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <svg viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden>
            <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </label>
      </div>

      {/* Atalhos: rolam na horizontal no celular. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {quick.map((q) => {
          const on = q.active(prefs, onlySavings)
          return (
            <button
              key={q.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                const r = q.toggle(prefs, onlySavings)
                if (r.prefs) set(r.prefs)
                if (r.onlySavings !== undefined) onOnlySavings(r.onlySavings)
              }}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors ${
                on ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface text-ink-2 hover:border-ink/25 hover:text-ink'
              }`}
            >
              {q.label}
            </button>
          )
        })}
      </div>

      {(active.length > 0 || onlySavings) && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted">Filtrando:</span>
          {active.map((f) => (
            <RemovablePill key={f.id} label={f.label} onRemove={() => set(f.clear)} />
          ))}
          {onlySavings && <RemovablePill label="Só os que economizam" onRemove={() => onOnlySavings(false)} />}
          {props.onReset && (
            <button type="button" onClick={props.onReset} className="ml-1 font-medium text-accent hover:underline">
              Restaurar padrão
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 sm:hidden">
        <span className="text-xs text-muted tabular">{resultCount} opções</span>
        <label className="relative">
          <span className="sr-only">Ordenar por</span>
          <select
            value={sortId}
            onChange={(e) => {
              const s = SORTS.find((x) => x.id === e.target.value)
              if (s) props.onSort(s.sort)
            }}
            className="appearance-none rounded-lg bg-transparent py-1 pr-6 pl-2 text-right text-xs font-medium text-ink outline-none"
          >
            {sortId === 'custom' && <option value="custom">Ordem da tabela</option>}
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <svg viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 right-0.5 size-3.5 -translate-y-1/2 text-muted" aria-hidden>
            <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </label>
      </div>

      {open && <FilterSheet {...props} onClose={() => setOpen(false)} />}
    </div>
  )
}

function RemovablePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface py-0.5 pr-1 pl-2.5 text-ink">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remover filtro ${label}`} className="grid size-5 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
        <svg viewBox="0 0 20 20" className="size-3" aria-hidden>
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  )
}

/** Busca com sugestões do catálogo (abre a ficha) e atalho para adicionar pela FIPE. */
function SearchBox({ value, onChange, onAddCustom }: { value: string; onChange: (v: string) => void; onAddCustom: (q: string) => void }) {
  const [focused, setFocused] = useState(false)
  const suggestions = useMemo(() => {
    const words = normalize(value).split(/\s+/).filter(Boolean)
    if (!words.length) return []
    return CATALOG.filter((m) => words.every((w) => normalize(`${m.brand} ${m.model} ${m.version}`).includes(w))).slice(0, 6)
  }, [value])
  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor="car-search" className="sr-only">
        Buscar um carro
      </label>
      <svg viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden>
        <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        id="car-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Buscar carro ou marca"
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 w-full rounded-xl border border-line bg-surface pr-3 pl-9 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 sm:text-sm"
      />
      {focused && value.trim() && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
          {suggestions.length > 0 && (
            <ul className="max-h-72 overflow-y-auto py-1">
              {suggestions.map((m) => (
                <li key={m.id}>
                  <a href={paths.car(m.id)} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-surface-2">
                    <span className="min-w-0 truncate">
                      <span className="font-medium">
                        {m.brand} {m.model}
                      </span>{' '}
                      <span className="text-ink-2">{m.version}</span>
                    </span>
                    <span className="shrink-0 text-xs text-accent">ficha →</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-line px-3 py-1.5 text-[11px] text-muted">A busca também filtra a lista abaixo.</p>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onAddCustom(value.trim())}
            className="block w-full border-t border-line px-3 py-2.5 text-left text-sm text-accent hover:bg-surface-2"
          >
            {suggestions.length ? 'Não é esse?' : 'Não está no catálogo.'} Adicionar “{value.trim()}” pela FIPE →
          </button>
        </div>
      )}
    </div>
  )
}

const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x])

/** Painel completo de filtros, em seções; o rodapé mostra quantas opções sobram. */
function FilterSheet({ prefs, onPrefs, carCategory, onlySavings, onOnlySavings, resultCount, onReset, onClose }: Props & { onClose: () => void }) {
  const set = (p: Partial<Preferences>) => onPrefs({ ...prefs, ...p })
  const near = nearbyCategories(carCategory)
  const below = CATEGORY_BELOW[carCategory]
  const above = CATEGORY_ABOVE[carCategory]
  return (
    <Sheet
      title="Filtros"
      subtitle={`Seu carro: ${CATEGORY_LABEL[carCategory]}`}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          {onReset && (
            <button type="button" onClick={onReset} className="px-2 text-sm font-medium text-ink-2 hover:text-ink">
              Restaurar
            </button>
          )}
          <button
            type="button"
            onClick={(e) => e.currentTarget.closest('dialog')?.close()}
            className="ml-auto flex-1 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-ink hover:opacity-90 sm:flex-none"
          >
            Ver {resultCount} {resultCount === 1 ? 'opção' : 'opções'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <Section title="Categoria">
          <div className="mb-2 grid grid-cols-3 gap-2">
            {[
              { label: 'Uma abaixo', cats: below },
              { label: 'A mesma', cats: [carCategory] },
              { label: 'Uma acima', cats: above },
            ].map((g) => {
              const on = g.cats.length > 0 && g.cats.every((c) => prefs.categories.includes(c))
              return (
                <button
                  key={g.label}
                  type="button"
                  disabled={!g.cats.length}
                  aria-pressed={on}
                  onClick={() => set({ categories: on ? prefs.categories.filter((c) => !g.cats.includes(c)) : [...new Set([...prefs.categories, ...g.cats])] })}
                  className={`rounded-xl border p-2.5 text-left transition-colors disabled:opacity-40 ${on ? 'border-accent bg-accent-soft' : 'border-line hover:border-ink/25'}`}
                >
                  <span className={`block text-xs font-semibold ${on ? 'text-accent' : 'text-ink'}`}>{g.label}</span>
                  <span className="block truncate text-[11px] text-ink-2">{g.cats.map((c) => CATEGORY_LABEL[c]).join(', ') || '—'}</span>
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((c) => (
              <Chip key={c} active={prefs.categories.includes(c)} onClick={() => set({ categories: toggle(prefs.categories, c) })}>
                {CATEGORY_LABEL[c]}
              </Chip>
            ))}
          </div>
          <LinkRow>
            <button type="button" onClick={() => set({ categories: near })}>Parecidas com a minha</button>
            <button type="button" onClick={() => set({ categories: CATEGORY_ORDER })}>Todas</button>
          </LinkRow>
        </Section>

        <Section title="Motorização">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(POWERTRAIN_LABEL) as Powertrain[]).map((p) => (
              <Chip key={p} active={prefs.powertrains.includes(p)} onClick={() => set({ powertrains: toggle(prefs.powertrains, p) })}>
                {POWERTRAIN_LABEL[p]}
              </Chip>
            ))}
          </div>
          <LinkRow>
            <button type="button" onClick={() => set({ powertrains: ['hibrido', 'hibrido-plugin', 'eletrico'] })}>Só eletrificados</button>
            <button type="button" onClick={() => set({ powertrains: Object.keys(POWERTRAIN_LABEL) as Powertrain[] })}>Todas</button>
          </LinkRow>
        </Section>

        <div className="grid gap-6 sm:grid-cols-2">
          <Section title="Câmbio">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(TRANSMISSION_LABEL) as Transmission[]).map((t) => (
                <Chip key={t} active={(prefs.transmissions ?? []).includes(t)} onClick={() => set({ transmissions: toggle(prefs.transmissions ?? [], t) })}>
                  {TRANSMISSION_LABEL[t]}
                </Chip>
              ))}
            </div>
          </Section>
          <Section title="Tipo de opção">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(KIND_LABEL) as ScenarioKind[])
                .filter((k) => k !== 'keep')
                .map((k) => (
                  <Chip key={k} active={prefs.kinds.includes(k)} onClick={() => set({ kinds: toggle(prefs.kinds, k) })}>
                    {KIND_LABEL[k]}
                  </Chip>
                ))}
            </div>
          </Section>
        </div>

        <Section title="Preço do carro">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {[100000, 150000, 200000, 250000].map((v) => (
              <Chip key={v} active={prefs.maxPrice === v && !prefs.minPrice} onClick={() => set({ maxPrice: prefs.maxPrice === v ? 0 : v, minPrice: 0 })}>
                Até {v / 1000} mil
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Mínimo" prefix="R$" step={5000} value={prefs.minPrice ?? 0} onChange={(v) => set({ minPrice: v })} />
            <NumberField label="Máximo" prefix="R$" step={5000} value={prefs.maxPrice} onChange={(v) => set({ maxPrice: v })} />
          </div>
          <Hint>0 = sem limite. Assinaturas não entram no filtro de preço.</Hint>
        </Section>

        <Section title="Ano-modelo">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {[2022, 2023, 2024, 2025].map((y) => (
              <Chip key={y} active={prefs.minModelYear === y && !prefs.maxModelYear} onClick={() => set({ minModelYear: y, maxModelYear: 0 })}>
                {y}+
              </Chip>
            ))}
            <Chip active={!prefs.minModelYear && !prefs.maxModelYear} onClick={() => set({ minModelYear: 0, maxModelYear: 0 })}>
              Qualquer ano
            </Chip>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="De" value={prefs.minModelYear ?? 0} onChange={(v) => set({ minModelYear: Math.round(v) })} />
            <NumberField label="Até" value={prefs.maxModelYear ?? 0} onChange={(v) => set({ maxModelYear: Math.round(v) })} />
          </div>
          <Hint>0 km conta como {new Date().getFullYear()}.</Hint>
        </Section>

        <Section title="Marcas">
          <div className="flex flex-wrap gap-1.5">
            {BRANDS.map((b) => (
              <Chip key={b} active={(prefs.brands ?? []).includes(b)} onClick={() => set({ brands: toggle(prefs.brands ?? [], b) })}>
                {b}
              </Chip>
            ))}
          </div>
          <Hint>Nenhuma marcada = todas. Assinaturas não são filtradas por marca.</Hint>
        </Section>

        <Section title="Mais">
          <div className="grid grid-cols-2 gap-2">
            <NumberField label={`Custo máx. por mês (${prefs.rankHorizon}a)`} prefix="R$" step={100} value={prefs.maxMonthly} onChange={(v) => set({ maxMonthly: v })} />
            <NumberField label="Lugares mínimos" value={prefs.minSeats} onChange={(v) => set({ minSeats: Math.round(v) })} />
          </div>
          <div className="mt-3 space-y-2">
            <ToggleRow label="Só opções que economizam em relação a manter" checked={onlySavings} onChange={onOnlySavings} />
            <ToggleRow label="Um por modelo (agrupar os anos)" checked={!!prefs.groupByModel} onChange={(v) => set({ groupByModel: v })} />
          </div>
        </Section>

        <Section title="Preferência por motorização">
          <Hint>Quanto vale para você, por mês, ter cada tipo de motor. Não muda os custos — só a ordem do ranking.</Hint>
          <div className="my-2">
            <Segmented<'real' | 'ajustado'>
              label="Ordenar ranking por"
              value={prefs.rankBy}
              options={[
                { value: 'ajustado', label: 'Com preferência' },
                { value: 'real', label: 'Só custo' },
              ]}
              onChange={(v) => set({ rankBy: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['hibrido', 'hibrido-plugin', 'eletrico', 'flex'] as Powertrain[]).map((p) => (
              <NumberField
                key={p}
                label={POWERTRAIN_LABEL[p]}
                prefix="R$"
                suffix="/mês"
                step={50}
                value={prefs.powertrainValue?.[p] ?? 0}
                onChange={(v) => set({ powertrainValue: { ...prefs.powertrainValue, [p]: v } })}
              />
            ))}
          </div>
        </Section>
      </div>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-xs text-muted">{children}</p>
}

function LinkRow({ children }: { children: ReactNode }) {
  return <div className="mt-2 flex gap-4 text-xs font-medium text-accent [&>button:hover]:underline">{children}</div>
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 text-sm">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[var(--accent)]" />
    </label>
  )
}
