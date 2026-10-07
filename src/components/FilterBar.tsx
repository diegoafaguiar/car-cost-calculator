import { useState } from 'react'
import { CATEGORY_LABEL, CATEGORY_NEIGHBORS, CATEGORY_ORDER, POWERTRAIN_LABEL } from '../lib/catalog'
import type { Category, Horizon, Powertrain, Preferences, ScenarioKind } from '../lib/types'
import { HORIZONS } from '../lib/types'
import { KIND_LABEL } from './RankingTable'
import { Chip, ChipGroup, NumberField, Segmented, TextField } from './ui'

type Preset = 'same' | 'near' | 'all' | 'custom'

const sameSet = (a: Category[], b: Category[]) => a.length === b.length && a.every((x) => b.includes(x))

interface Props {
  prefs: Preferences
  onPrefs: (p: Preferences) => void
  carCategory: Category
  onlySavings: boolean
  onOnlySavings: (v: boolean) => void
  resultCount: number
}

/** Filtros principais sempre à vista; os demais ficam em "Mais filtros". */
export function FilterBar({ prefs, onPrefs, carCategory, onlySavings, onOnlySavings, resultCount }: Props) {
  const [open, setOpen] = useState(false)
  const presets: Record<Exclude<Preset, 'custom'>, Category[]> = {
    same: [carCategory],
    near: CATEGORY_NEIGHBORS[carCategory],
    all: CATEGORY_ORDER,
  }
  const preset: Preset =
    (Object.keys(presets) as (keyof typeof presets)[]).find((k) => sameSet(presets[k], prefs.categories)) ?? 'custom'
  const extra = [prefs.maxPrice > 0, prefs.maxMonthly > 0, prefs.minSeats > 0, !!prefs.search, onlySavings].filter(Boolean).length
  const set = (p: Partial<Preferences>) => onPrefs({ ...prefs, ...p })

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink-2">Horizonte</span>
          <Segmented<Horizon>
            label="Horizonte"
            value={prefs.rankHorizon}
            options={HORIZONS.map((y) => ({ value: y, label: `${y} ${y === 1 ? 'ano' : 'anos'}` }))}
            onChange={(v) => set({ rankHorizon: v })}
          />
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-ink-2">
            Comparar com — seu carro é {CATEGORY_LABEL[carCategory]}
          </span>
          <Segmented<Preset>
            label="Categorias"
            value={preset}
            options={[
              { value: 'same', label: 'Mesma categoria' },
              { value: 'near', label: 'Uma acima/abaixo' },
              { value: 'all', label: 'Todas' },
              ...(preset === 'custom' ? [{ value: 'custom' as const, label: 'Personalizado' }] : []),
            ]}
            onChange={(v) => v !== 'custom' && set({ categories: presets[v] })}
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted tabular">{resultCount} opções</span>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface-2"
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
              <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Mais filtros{extra ? ` (${extra})` : ''}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 border-t border-line pt-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <ChipGroup<Category>
          label="Categorias"
          options={CATEGORY_ORDER.map((k) => ({ value: k, label: CATEGORY_LABEL[k] }))}
          selected={prefs.categories}
          onChange={(v) => set({ categories: v })}
        />
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
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-line pt-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <TextField label="Buscar modelo" value={prefs.search} onChange={(v) => set({ search: v })} placeholder="ex.: corolla, byd" />
            <NumberField label="Preço máximo" prefix="R$" step={5000} value={prefs.maxPrice} onChange={(v) => set({ maxPrice: v })} hint="0 = sem limite" />
            <NumberField label={`Custo mensal máximo (${prefs.rankHorizon}a)`} prefix="R$" step={100} value={prefs.maxMonthly} onChange={(v) => set({ maxMonthly: v })} hint="0 = sem limite" />
            <NumberField label="Lugares mínimos" value={prefs.minSeats} onChange={(v) => set({ minSeats: Math.round(v) })} />
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
