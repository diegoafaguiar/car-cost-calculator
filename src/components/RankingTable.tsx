import { useState } from 'react'
import { CATEGORY_LABEL, POWERTRAIN_LABEL, TRANSMISSION_LABEL } from '../lib/catalog'
import { money, money2, months } from '../lib/format'
import type { Horizon, PriceSource, RankRow, ScenarioKind, ScenarioResult } from '../lib/types'
import { CostTooltip } from './CostTooltip'
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
  anuncios: 'Mediana de anúncios',
  manual: 'Manual',
  estimado: 'Preço estimado',
}

interface Props {
  rows: RankRow[]
  horizon: Horizon
  sort: { key: SortKey; dir: 1 | -1 }
  onSort: (key: SortKey) => void
  compare: string[]
  colors: Record<string, string>
  onToggleCompare: (id: string) => void
  onOpen: (id: string) => void
  showAdjusted?: boolean
  keep?: ScenarioResult
  onResetFilters?: () => void
}

const PAGE = 20

export function RankingTable({ rows, horizon, sort, onSort, compare, colors, onToggleCompare, onOpen, showAdjusted, keep, onResetFilters }: Props) {
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
            {rows.slice(0, limit).map(({ result: r, rank, others }) => {
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
                    <OtherYears best={r} others={others} horizon={horizon} onOpen={onOpen} />
                  </td>
                  {visible.map((c) => (
                    <td key={c.key} className="px-3 py-3 text-right tabular whitespace-nowrap">
                      <Cell k={c.key} r={r} horizon={horizon} keep={keep} />
                    </td>
                  ))}
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={visible.length + 3} className="px-3 py-10 text-center text-sm text-muted">
                  Nenhuma opção com os filtros atuais.
                  {onResetFilters && (
                    <button type="button" onClick={onResetFilters} className="ml-2 font-medium text-accent hover:underline">
                      Limpar filtros
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ul className="space-y-2 md:hidden">
        {rows.slice(0, limit).map(({ result: r, rank, others }) => {
          const isKeep = r.scenario.kind === 'keep'
          return (
            <li key={r.scenario.id} className={`rounded-xl border border-line p-3 ${isKeep ? 'bg-warn-soft' : 'bg-surface'}`}>
              <div role="button" tabIndex={0} className="w-full cursor-pointer text-left" onClick={() => onOpen(r.scenario.id)} onKeyDown={(e) => e.key === 'Enter' && onOpen(r.scenario.id)}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs text-muted tabular">#{rank}</span>
                  <span className="font-semibold tabular" onClick={(e) => e.stopPropagation()}>
                    <CostTooltip result={r} horizon={horizon} keep={keep}>
                      {money(r.horizons[horizon].monthly)}/mês
                    </CostTooltip>
                  </span>
                </div>
                <OptionCell result={r} />
                <OtherYears best={r} others={others} horizon={horizon} onOpen={onOpen} />
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
                  <span className="text-xs text-ink-2 tabular">
                    {r.scenario.kind === 'subscription' ? 'sem compra' : money(r.scenario.price)}
                  </span>
                  <Savings r={r} horizon={horizon} />
                </div>
              </div>
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
        {s.transmission && s.kind !== 'keep' && <Badge>{TRANSMISSION_LABEL[s.transmission]}</Badge>}
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

const yearLabel = (r: ScenarioResult) =>
  r.scenario.ageAtStart === 0 ? '0 km' : String(new Date().getFullYear() - r.scenario.ageAtStart)

/** Chips com os outros anos do mesmo modelo e a diferença de custo por mês para o melhor ano. */
function OtherYears({ best, others, horizon, onOpen }: { best: ScenarioResult; others?: ScenarioResult[]; horizon: Horizon; onOpen: (id: string) => void }) {
  if (!others?.length) return null
  const base = best.horizons[horizon].monthly
  const list = [...others].sort((a, b) => a.scenario.ageAtStart - b.scenario.ageAtStart)
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1 text-xs" onClick={(e) => e.stopPropagation()}>
      <span className="text-muted">Melhor ano: {yearLabel(best)} · outros:</span>
      {list.map((o) => {
        const d = o.horizons[horizon].monthly - base
        return (
          <button
            key={o.scenario.id}
            type="button"
            onClick={() => onOpen(o.scenario.id)}
            title={`${o.scenario.label} ${yearLabel(o)}: ${money(o.horizons[horizon].monthly)}/mês`}
            className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 tabular text-ink-2 hover:border-accent hover:text-accent"
          >
            {yearLabel(o)} <span className="text-muted">{d >= 0 ? "+" : "−"}{money(Math.abs(d))}</span>
          </button>
        )
      })}
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

function Cell({ k, r, horizon, keep }: { k: SortKey; r: ScenarioResult; horizon: Horizon; keep?: ScenarioResult }) {
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
          b={r.upfrontCash > 0 ? `+ ${money(r.upfrontCash)} da reserva` : r.changeBack > 0 ? `sobra ${money(r.changeBack)} de troco` : 'só com o seu carro'}
        />
      )
    case 'monthly':
      return (
        <span className="font-semibold" onClick={(e) => e.stopPropagation()}>
          <CostTooltip result={r} horizon={horizon} keep={keep}>
            {money(h.monthly)}
          </CostTooltip>
        </span>
      )
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
