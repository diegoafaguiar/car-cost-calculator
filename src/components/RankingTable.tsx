import { useState } from 'react'
import { CATEGORY_LABEL, POWERTRAIN_LABEL } from '../lib/catalog'
import { money, money2, months } from '../lib/format'
import type { Horizon, PriceSource, ScenarioKind, ScenarioResult } from '../lib/types'
import { Badge } from './ui'

export type SortKey =
  | 'rank'
  | 'label'
  | 'price'
  | 'upfront'
  | 'installment'
  | 'monthly'
  | 'total'
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

const SOURCE_LABEL: Record<PriceSource, string> = {
  fipe: 'FIPE',
  pesquisa: 'Preço pesquisado',
  manual: 'Manual',
  estimado: 'Preço estimado',
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

const PAGE = 20

export function RankingTable({ rows, horizon, sort, onSort, compare, colors, onToggleCompare, onOpen, showAdjusted }: Props) {
  const [limit, setLimit] = useState(PAGE)
  const [detailed, setDetailed] = useState(false)

  const cols: { key: SortKey; label: string; title?: string; when?: boolean }[] = [
    { key: 'price', label: 'Preço' },
    { key: 'installment', label: 'Pagamento', title: 'Parcela e desembolso além do seu carro' },
    { key: 'monthly', label: 'Custo/mês', title: `Custo total em ${horizon} ${horizon === 1 ? 'ano' : 'anos'} dividido pelos meses` },
    { key: 'total', label: `Total ${horizon}a` },
    { key: 't1', label: '1 ano', when: detailed },
    { key: 't3', label: '3 anos', when: detailed },
    { key: 't5', label: '5 anos', when: detailed },
    { key: 'perKm', label: 'R$/km', when: detailed },
    { key: 'adjusted', label: 'Ajustado', title: 'Custo total menos o valor da sua preferência por motorização', when: detailed && showAdjusted },
    { key: 'savings', label: 'vs. manter', title: 'Positivo = economia em relação a manter o seu carro' },
    { key: 'breakEven', label: 'Compensa em', title: 'A partir de quando fica mais barato que manter' },
  ]
  const visible = cols.filter((c) => c.when === undefined || c.when)

  const sortButton = (k: SortKey, label: string, title?: string) => (
    <button type="button" title={title} className="inline-flex items-center gap-1 hover:text-ink" onClick={() => onSort(k)}>
      {label}
      <span aria-hidden className={sort.key === k ? 'text-ink' : 'opacity-0'}>
        {sort.key === k && sort.dir === -1 ? '↓' : '↑'}
      </span>
    </button>
  )

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" checked={detailed} onChange={(e) => setDetailed(e.target.checked)} className="size-4 accent-[var(--accent)]" />
          Visão detalhada (1, 3 e 5 anos, custo por km)
        </label>
        <span className="hidden text-xs text-muted md:inline">Marque até 5 opções para comparar no gráfico</span>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-line md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface-2 text-xs text-ink-2">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <span className="sr-only">Comparar</span>
              </th>
              <th className="w-10 px-1 py-2.5 text-left font-medium">{sortButton('rank', '#')}</th>
              <th className="px-3 py-2.5 text-left font-medium">{sortButton('label', 'Opção')}</th>
              {visible.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
                  className="px-3 py-2.5 text-right font-medium whitespace-nowrap"
                >
                  {sortButton(c.key, c.label, c.title)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map(({ result: r, rank }) => {
              const s = r.scenario
              const isKeep = s.kind === 'keep'
              const checked = compare.includes(s.id)
              return (
                <tr
                  key={s.id}
                  onClick={() => onOpen(s.id)}
                  className={`cursor-pointer border-t border-line transition-colors hover:bg-surface-2/70 ${isKeep ? 'bg-warn-soft' : ''}`}
                >
                  <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    {!isKeep && (
                      <input
                        type="checkbox"
                        checked={checked}
                        aria-label={`Comparar ${s.label}`}
                        onChange={() => onToggleCompare(s.id)}
                        className="size-4"
                        style={{ accentColor: checked && colors[s.id] ? colors[s.id] : 'var(--accent)' }}
                      />
                    )}
                  </td>
                  <td className="px-1 py-3 tabular text-muted">{rank}</td>
                  <td className="min-w-64 px-3 py-3">
                    <OptionCell result={r} />
                  </td>
                  {visible.map((c) => (
                    <td key={c.key} className="px-3 py-3 text-right tabular whitespace-nowrap">
                      <Cell k={c.key} r={r} horizon={horizon} />
                    </td>
                  ))}
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={visible.length + 3} className="px-3 py-10 text-center text-sm text-muted">
                  Nenhuma opção com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ul className="space-y-2 md:hidden">
        {rows.slice(0, limit).map(({ result: r, rank }) => {
          const isKeep = r.scenario.kind === 'keep'
          return (
            <li key={r.scenario.id} className={`rounded-xl border border-line p-3 ${isKeep ? 'bg-warn-soft' : 'bg-surface'}`}>
              <button type="button" className="w-full text-left" onClick={() => onOpen(r.scenario.id)}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs text-muted tabular">#{rank}</span>
                  <span className="font-semibold tabular">{money(r.horizons[horizon].monthly)}/mês</span>
                </div>
                <OptionCell result={r} />
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
                  <span className="text-xs text-ink-2 tabular">
                    {r.scenario.kind === 'subscription' ? 'sem compra' : money(r.scenario.price)}
                  </span>
                  <Savings r={r} horizon={horizon} />
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>
          Mostrando {Math.min(limit, rows.length)} de {rows.length}
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

function OptionCell({ result: r }: { result: ScenarioResult }) {
  const s = r.scenario
  return (
    <div>
      <span className="font-medium text-ink">{s.label}</span>
      <span className="block text-xs text-ink-2">{s.detail}</span>
      <span className="mt-1.5 flex flex-wrap items-center gap-1">
        <Badge tone={KIND_TONE[s.kind]}>{KIND_LABEL[s.kind]}</Badge>
        <Badge>{CATEGORY_LABEL[s.category]}</Badge>
        <Badge>{POWERTRAIN_LABEL[s.powertrain]}</Badge>
        {s.kind !== 'subscription' && s.kind !== 'keep' && (
          <Badge tone={s.priceSource === 'estimado' ? 'neutral' : 'good'}>{SOURCE_LABEL[s.priceSource]}</Badge>
        )}
        {s.modelId && s.kind !== 'subscription' && (
          <a
            href={`#/carro/${s.modelId}`}
            onClick={(e) => e.stopPropagation()}
            className="ml-1 text-xs font-medium whitespace-nowrap text-accent hover:underline"
          >
            Ficha →
          </a>
        )}
      </span>
    </div>
  )
}

function Savings({ r, horizon }: { r: ScenarioResult; horizon: Horizon }) {
  if (r.scenario.kind === 'keep') return <span className="text-xs text-muted">referência</span>
  const v = r.horizons[horizon].savingsVsKeep
  return (
    <span className={`text-xs font-medium ${v > 0 ? 'text-good' : 'text-bad'}`}>
      {v > 0 ? '▲ economiza ' : '▼ custa mais '}
      {money(Math.abs(v))}
    </span>
  )
}

function Cell({ k, r, horizon }: { k: SortKey; r: ScenarioResult; horizon: Horizon }) {
  const s = r.scenario
  const h = r.horizons[horizon]
  switch (k) {
    case 'price':
      return <span className="text-ink-2">{s.kind === 'subscription' ? '—' : money(s.price)}</span>
    case 'installment':
      if (s.plan) return <Two a={`${money(s.plan.monthlyFee)}/mês`} b="mensalidade" />
      if (s.kind === 'keep') return <span className="text-muted">—</span>
      return (
        <Two
          a={r.installment > 0 ? `${money(r.installment)} × ${r.finance.months}` : 'à vista'}
          b={r.upfrontCash > 0 ? `+ ${money(r.upfrontCash)} da reserva` : 'só com o seu carro'}
        />
      )
    case 'monthly':
      return <span className="font-semibold">{money(h.monthly)}</span>
    case 'total':
      return <span className="text-ink-2">{money(h.total)}</span>
    case 't1':
      return <span className="text-ink-2">{money(r.horizons[1].total)}</span>
    case 't3':
      return <span className="text-ink-2">{money(r.horizons[3].total)}</span>
    case 't5':
      return <span className="text-ink-2">{money(r.horizons[5].total)}</span>
    case 'perKm':
      return <span className="text-ink-2">{money2(h.perKm)}</span>
    case 'adjusted':
      return <span className="text-ink-2">{money(h.adjusted)}</span>
    case 'savings':
      return <Savings r={r} horizon={horizon} />
    case 'breakEven':
      return (
        <span className="text-xs text-ink-2">
          {s.kind === 'keep' ? '—' : r.breakEvenMonth === null ? 'não em 5 anos' : r.breakEvenMonth === 0 ? 'imediato' : months(r.breakEvenMonth)}
        </span>
      )
    default:
      return null
  }
}

function Two({ a, b }: { a: string; b: string }) {
  return (
    <span>
      <span className="block">{a}</span>
      <span className="block text-xs text-muted">{b}</span>
    </span>
  )
}
