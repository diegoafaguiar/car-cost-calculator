import { useMemo, useState } from 'react'
import { CATALOG, CATEGORY_ABOVE, CATEGORY_BELOW, CATEGORY_LABEL, CATEGORY_ORDER, POWERTRAIN_LABEL } from '../lib/catalog'
import { normalize } from '../lib/format'
import type { Category, Powertrain, Preferences, ScenarioKind } from '../lib/types'
import { KIND_LABEL } from './RankingTable'
import { Chip, ChipGroup, NumberField, Segmented } from './ui'

const BRANDS = [...new Set(CATALOG.map((m) => m.brand))].sort((a, b) => a.localeCompare(b, 'pt-BR'))

interface Props {
  prefs: Preferences
  onPrefs: (p: Preferences) => void
  carCategory: Category
  onlySavings: boolean
  onOnlySavings: (v: boolean) => void
  resultCount: number
  onAddCustom: (query: string) => void
}

const labels = (cats: Category[]) => cats.map((c) => CATEGORY_LABEL[c]).join(' e ')

/** Filtros principais sempre à vista; os demais ficam em "Mais filtros". */
export function FilterBar({ prefs, onPrefs, carCategory, onlySavings, onOnlySavings, resultCount, onAddCustom }: Props) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const set = (p: Partial<Preferences>) => onPrefs({ ...prefs, ...p })

  const below = CATEGORY_BELOW[carCategory]
  const above = CATEGORY_ABOVE[carCategory]
  const has = (cats: Category[]) => cats.length > 0 && cats.every((c) => prefs.categories.includes(c))
  const toggle = (cats: Category[]) =>
    set({
      categories: has(cats) ? prefs.categories.filter((c) => !cats.includes(c)) : [...new Set([...prefs.categories, ...cats])],
    })
  const allOn = CATEGORY_ORDER.every((c) => prefs.categories.includes(c))

  const suggestions = useMemo(() => {
    const words = normalize(prefs.search).split(/\s+/).filter(Boolean)
    if (!words.length) return []
    return CATALOG.filter((m) => {
      const text = normalize(`${m.brand} ${m.model} ${m.version}`)
      return words.every((w) => text.includes(w))
    }).slice(0, 6)
  }, [prefs.search])

  const extra = [(prefs.brands ?? []).length > 0, prefs.maxMonthly > 0, prefs.minSeats > 0, onlySavings].filter(Boolean).length

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="relative">
          <label className="mb-1.5 block text-xs font-medium text-ink-2" htmlFor="car-search">
            Buscar um carro
          </label>
          <div className="relative">
            <svg viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden>
              <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              id="car-search"
              type="search"
              value={prefs.search}
              onChange={(e) => set({ search: e.target.value })}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder="Marca ou modelo — ex.: Song Pro, Corolla, BYD"
              autoComplete="off"
              className="w-full rounded-lg border border-line bg-surface-2 py-2 pr-3 pl-9 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>
          {focused && prefs.search.trim() && (
            <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
              {suggestions.length > 0 && (
                <ul className="max-h-72 overflow-y-auto py-1">
                  {suggestions.map((m) => (
                    <li key={m.id}>
                      <a href={`#/carro/${m.id}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-surface-2">
                        <span>
                          <span className="font-medium">
                            {m.brand} {m.model}
                          </span>{' '}
                          <span className="text-ink-2">{m.version}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted">{CATEGORY_LABEL[m.category]} · ver ficha</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onAddCustom(prefs.search.trim())}
                className="block w-full border-t border-line px-3 py-2 text-left text-sm text-accent hover:bg-surface-2"
              >
                {suggestions.length ? 'Não é esse?' : 'Não está no catálogo.'} Adicionar “{prefs.search.trim()}” pela FIPE →
              </button>
            </div>
          )}
          <p className="mt-1 text-xs text-muted">A busca também filtra o ranking.</p>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink-2">Faixa de preço do carro</span>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="" prefix="De R$" step={5000} value={prefs.minPrice ?? 0} onChange={(v) => set({ minPrice: v })} />
            <NumberField label="" prefix="Até R$" step={5000} value={prefs.maxPrice} onChange={(v) => set({ maxPrice: v })} />
          </div>
          <p className="mt-1 text-xs text-muted">0 = sem limite. Assinaturas não entram no filtro de preço.</p>
        </div>

      </div>

      <div className="mt-4 border-t border-line pt-4">
        <span className="mb-1.5 block text-xs font-medium text-ink-2">Categorias — seu carro é {CATEGORY_LABEL[carCategory]}</span>
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={prefs.categories.includes(carCategory)} onClick={() => toggle([carCategory])}>
            Mesma categoria · {CATEGORY_LABEL[carCategory]}
          </Chip>
          {below.length > 0 && (
            <Chip active={has(below)} onClick={() => toggle(below)}>
              Uma abaixo · {labels(below)}
            </Chip>
          )}
          {above.length > 0 && (
            <Chip active={has(above)} onClick={() => toggle(above)}>
              Uma acima · {labels(above)}
            </Chip>
          )}
          <span className="mx-1 h-5 w-px bg-line" aria-hidden />
          <button
            type="button"
            className="text-xs font-medium text-accent hover:underline"
            onClick={() => set({ categories: allOn ? [carCategory] : CATEGORY_ORDER })}
          >
            {allOn ? 'Só a minha categoria' : 'Todas as categorias'}
          </button>
        </div>
        <div className="mt-3">
          <ChipGroup<Category>
            options={CATEGORY_ORDER.map((k) => ({ value: k, label: CATEGORY_LABEL[k] }))}
            selected={prefs.categories}
            onChange={(v) => set({ categories: v })}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 border-t border-line pt-4 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
        <ChipGroup<Powertrain>
          label="Motorização"
          options={(Object.keys(POWERTRAIN_LABEL) as Powertrain[]).map((k) => ({ value: k, label: POWERTRAIN_LABEL[k] }))}
          selected={prefs.powertrains}
          onChange={(v) => set({ powertrains: v })}
        />
        <ChipGroup<ScenarioKind>
          label="Tipo de opção"
          options={(Object.keys(KIND_LABEL) as ScenarioKind[]).map((k) => ({ value: k, label: KIND_LABEL[k] }))}
          selected={prefs.kinds}
          onChange={(v) => set({ kinds: v })}
        />
        <div className="flex items-center gap-3 md:justify-end">
          <span className="text-xs text-muted tabular">{resultCount} opções</span>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium whitespace-nowrap hover:bg-surface-2"
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
              <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Mais filtros{extra ? ` (${extra})` : ''}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-line pt-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <NumberField label={`Custo mensal máximo (${prefs.rankHorizon}a)`} prefix="R$" step={100} value={prefs.maxMonthly} onChange={(v) => set({ maxMonthly: v })} hint="0 = sem limite" />
            <NumberField label="Lugares mínimos" value={prefs.minSeats} onChange={(v) => set({ minSeats: Math.round(v) })} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-xs font-medium text-ink-2">Marcas</span>
              {(prefs.brands ?? []).length > 0 && (
                <button type="button" className="text-xs text-accent hover:underline" onClick={() => set({ brands: [] })}>
                  limpar (todas)
                </button>
              )}
            </div>
            <ChipGroup<string>
              options={BRANDS.map((b) => ({ value: b, label: b }))}
              selected={prefs.brands ?? []}
              onChange={(v) => set({ brands: v })}
            />
            <p className="mt-1 text-xs text-muted">Nenhuma marcada = todas as marcas. Assinaturas não são filtradas por marca.</p>
          </div>
          <Chip active={onlySavings} onClick={() => onOnlySavings(!onlySavings)}>
            Só opções que economizam em relação a manter
          </Chip>
          <div className="rounded-xl bg-surface-2/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-sm font-medium">Preferência por motorização</span>
                <p className="text-xs text-muted">
                  Quanto vale para você, por mês, cada tipo de motor. Não muda os custos — só a ordem do ranking.
                </p>
              </div>
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
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          </div>
        </div>
      )}
    </div>
  )
}
