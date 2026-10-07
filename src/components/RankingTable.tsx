import { useState } from 'react'
import { POWERTRAIN_LABEL } from '../lib/catalog'
import { money, money2, months } from '../lib/format'
import type { Horizon, ScenarioKind, ScenarioResult } from '../lib/types'
import { Badge } from './ui'

export type SortKey =
  | 'rank'
  | 'label'
  | 'price'
  | 'upfront'
  | 'installment'
  | 'monthly'
  | 't1'
  | 't3'
  | 't5'
  | 'adjusted'
  | 'perKm'
  | 'savings'
  | 'breakEven'

export const KIND_LABEL: Record<ScenarioKind, string> = {
  keep: 'Manter',
  new: '0 km',
  used: 'Seminovo',
  subscription: 'Assinatura',
}

const KIND_TONE: Record<ScenarioKind, 'neutral' | 'accent' | 'good' | 'warn'> = {
  keep: 'warn',
  new: 'accent',
  used: 'neutral',
  subscription: 'good',
}

interface Props {
  rows: { result: ScenarioResult; rank: number }[]
  horizon: Horizon
  sort: { key: SortKey; dir: 1 | -1 }
  onSort: (key: SortKey) => void
  compare: string[]
  colors: Record<string, string>
  onToggleCompare: (id: string) => void
  onOpen: (id: string) => void
  showAdjusted?: boolean
}

const PAGE = 25

export function RankingTable({ rows, horizon, sort, onSort, compare, colors, onToggleCompare, onOpen, showAdjusted }: Props) {
  const [limit, setLimit] = useState(PAGE)
  const cols: { key: SortKey; label: string; align?: 'right'; title?: string }[] = [
    { key: 'rank', label: '#' },
    { key: 'label', label: 'Opção' },
    { key: 'price', label: 'Preço', align: 'right' },
    { key: 'upfront', label: 'Desembolso', align: 'right', title: 'Dinheiro necessário além do carro atual' },
    { key: 'installment', label: 'Parcela', align: 'right' },
    { key: 'monthly', label: `Custo/mês (${horizon}a)`, align: 'right', title: 'Custo total do horizonte dividido pelos meses' },
    { key: 't1', label: '1 ano', align: 'right' },
    { key: 't3', label: '3 anos', align: 'right' },
    { key: 't5', label: '5 anos', align: 'right' },
    ...(showAdjusted
      ? [{ key: 'adjusted' as const, label: `Ajustado (${horizon}a)`, align: 'right' as const, title: 'Custo total menos o valor que você atribui à motorização (preferência)' }]
      : []),
    { key: 'perKm', label: 'R$/km', align: 'right' },
    { key: 'savings', label: `Economia (${horizon}a)`, align: 'right', title: 'Quanto você economiza em relação a manter o carro atual' },
    { key: 'breakEven', label: 'Compensa em', align: 'right', title: 'A partir de quando fica mais barato que manter' },
  ]

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[1200px] border-collapse text-sm">
          <thead className="bg-surface-2 text-xs text-ink-2">
            <tr>
              <th className="w-8 px-2 py-2">
                <span className="sr-only">Comparar</span>
              </th>
              {cols.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  title={c.title}
                  aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
                  className={`px-2 py-2 font-medium whitespace-nowrap ${c.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  <button type="button" className="inline-flex items-center gap-1 hover:text-ink" onClick={() => onSort(c.key)}>
                    {c.label}
                    <span aria-hidden className={sort.key === c.key ? 'text-ink' : 'opacity-30'}>
                      {sort.key === c.key && sort.dir === -1 ? '↓' : '↑'}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map(({ result: r, rank }) => {
              const s = r.scenario
              const h = r.horizons[horizon]
              const isKeep = s.kind === 'keep'
              const checked = compare.includes(s.id)
              return (
                <tr
                  key={s.id}
                  className={`border-t border-line hover:bg-surface-2/60 ${isKeep ? 'bg-[#fab219]/8' : ''}`}
                >
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      aria-label={`Comparar ${s.label}`}
                      onChange={() => onToggleCompare(s.id)}
                      className="size-4 accent-[var(--accent)]"
                      style={checked && colors[s.id] ? { accentColor: colors[s.id] } : undefined}
                    />
                  </td>
                  <td className="px-2 py-2 tabular text-muted">{rank}</td>
                  <td className="min-w-60 px-2 py-2">
                    <button type="button" className="text-left hover:underline" onClick={() => onOpen(s.id)}>
                      <span className="font-medium text-ink">{s.label}</span>
                      <span className="block text-xs text-ink-2">{s.detail}</span>
                    </button>
                    {s.modelId && s.kind !== 'subscription' && (
                      <a href={`#/carro/${s.modelId}`} className="ml-2 text-xs font-medium whitespace-nowrap text-accent hover:underline">
                        Ficha e análise →
                      </a>
                    )}
                    <span className="mt-1 flex flex-wrap gap-1">
                      <Badge tone={KIND_TONE[s.kind]}>{KIND_LABEL[s.kind]}</Badge>
                      <Badge>{POWERTRAIN_LABEL[s.powertrain]}</Badge>
                      {s.kind !== 'subscription' && (
                        <Badge tone={s.priceSource === 'fipe' || s.priceSource === 'pesquisa' ? 'good' : 'neutral'}>
                          {{ fipe: 'FIPE', pesquisa: 'Preço pesquisado', manual: 'Manual', estimado: 'Estimado' }[s.priceSource]}
                        </Badge>
                      )}
                    </span>
                  </td>
                  <Num v={s.kind === 'subscription' ? null : s.price} />
                  <Num v={isKeep ? null : r.upfrontCash} zeroDash />
                  <td className="px-2 py-2 text-right tabular whitespace-nowrap">
                    {s.plan ? (
                      <>
                        {money(s.plan.monthlyFee)}
                        <span className="block text-xs text-muted">mensalidade</span>
                      </>
                    ) : r.installment > 0 ? (
                      <>
                        {money(r.installment)}
                        <span className="block text-xs text-muted">financiado</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold tabular whitespace-nowrap">{money(h.monthly)}</td>
                  <Num v={r.horizons[1].total} strong={horizon === 1} />
                  <Num v={r.horizons[3].total} strong={horizon === 3} />
                  <Num v={r.horizons[5].total} strong={horizon === 5} />
                  {showAdjusted && (
                    <td className="px-2 py-2 text-right tabular whitespace-nowrap text-ink-2">
                      {money(h.adjusted)}
                      {h.adjusted !== h.total && <span className="block text-xs text-good">preferência</span>}
                    </td>
                  )}
                  <td className="px-2 py-2 text-right tabular">{money2(h.perKm)}</td>
                  <td
                    className={`px-2 py-2 text-right tabular whitespace-nowrap ${
                      isKeep ? 'text-muted' : h.savingsVsKeep > 0 ? 'text-good' : 'text-bad'
                    }`}
                  >
                    {isKeep ? 'base' : `${h.savingsVsKeep > 0 ? '▲ ' : '▼ '}${money(Math.abs(h.savingsVsKeep))}`}
                  </td>
                  <td className="px-2 py-2 text-right text-xs whitespace-nowrap text-ink-2">
                    {isKeep ? '—' : r.breakEvenMonth === null ? 'não em 5 anos' : r.breakEvenMonth === 0 ? 'imediato' : months(r.breakEvenMonth)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>
          Mostrando {Math.min(limit, rows.length)} de {rows.length} opções
        </span>
        {rows.length > limit && (
          <button type="button" className="font-medium text-accent hover:underline" onClick={() => setLimit((l) => l + PAGE)}>
            Mostrar mais
          </button>
        )}
      </div>
    </div>
  )
}

function Num({ v, strong, zeroDash }: { v: number | null; strong?: boolean; zeroDash?: boolean }) {
  return (
    <td className={`px-2 py-2 text-right tabular whitespace-nowrap ${strong ? 'font-semibold text-ink' : 'text-ink-2'}`}>
      {v === null || (zeroDash && v < 1) ? '—' : money(v)}
    </td>
  )
}
