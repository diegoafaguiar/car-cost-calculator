import { useEffect } from 'react'
import { activeFilters } from '../lib/filters'
import { money } from '../lib/format'
import { paths, usePageMeta } from '../lib/router'
import type { Assumptions, Category, Horizon, Preferences, ScenarioResult } from '../lib/types'
import { HORIZONS } from '../lib/types'
import { BreakdownBars } from './BreakdownBars'
import { Breadcrumbs, PageHeader, ShareButton } from './Browse'
import { Comparator } from './Comparator'
import { CostChart, type Series } from './CostChart'
import { Button, Card, Segmented } from './ui'

const YEAR = new Date().getFullYear()
const yrs = (h: number) => `${h} ${h === 1 ? 'ano' : 'anos'}`

interface Props {
  idsFromUrl?: string[]
  results: ScenarioResult[]
  ranked: ScenarioResult[]
  keep?: ScenarioResult
  compare: string[]
  onCompare: (ids: string[]) => void
  onToggle: (id: string) => void
  colors: Record<string, string>
  series: Series[]
  max: number
  horizon: Horizon
  onHorizon: (h: Horizon) => void
  assumptions: Assumptions
  prefs: Preferences
  carCategory: Category
  carModelId?: string
  carModelYear?: number
  onOpen: (id: string) => void
  onEditFilters: () => void
}

/** Comparação detalhada em página própria: notas, custos, gráfico e composição, com link compartilhável. */
export function ComparePage(p: Props) {
  const { results, ranked, keep, compare, horizon } = p
  usePageMeta('Comparação detalhada | Custo de Carro', 'Compare lado a lado custo total, parcelas, notas e ficha técnica de até 5 carros.')

  // Link compartilhado (?opcoes=a,b): usa as opções do link, se existirem.
  useEffect(() => {
    if (!p.idsFromUrl?.length) return
    const valid = p.idsFromUrl.filter((id) => results.some((r) => r.scenario.id === id)).slice(0, p.max)
    if (valid.length && valid.join() !== compare.join()) p.onCompare(valid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Mantém a URL com as opções atuais, para o botão compartilhar levar exatamente esta comparação.
  useEffect(() => {
    history.replaceState(history.state, '', paths.compare(compare))
  }, [compare])

  const chosen = compare.map((id) => results.find((r) => r.scenario.id === id)).filter((r): r is ScenarioResult => !!r)
  const best = ranked.filter((r) => r.scenario.kind !== 'keep').slice(0, Math.max(1, p.max - 1))
  const filters = activeFilters(p.prefs, p.carCategory)
  const name = (r: ScenarioResult) =>
    `${r.scenario.label} · ${r.scenario.kind === 'subscription' ? 'assinatura' : r.scenario.ageAtStart === 0 ? '0 km' : `seminovo ${YEAR - r.scenario.ageAtStart}`}`

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Início', href: paths.home() }, { label: 'Comparação' }]} />
      <PageHeader
        eyebrow={`${chosen.length} de ${p.max} opções · ${yrs(horizon)}`}
        title="Comparação detalhada"
        subtitle="Seu carro contra as opções escolhidas: custo total, parcelas, notas, composição do custo e ficha técnica."
        actions={
          <>
            <ShareButton title="Comparação — Custo de Carro" text={chosen.map(name).join(' × ')} />
            <Segmented<Horizon> label="Horizonte" value={horizon} options={HORIZONS.map((y) => ({ value: y, label: yrs(y) }))} onChange={p.onHorizon} />
          </>
        }
      />

      <Card
        title="Opções na comparação"
        subtitle={
          filters.length ? (
            <>
              Sugestões a partir dos seus filtros: {filters.map((f) => f.label).join(' · ')}.{' '}
              <button type="button" onClick={p.onEditFilters} className="font-medium text-accent hover:underline">
                Editar filtros
              </button>
            </>
          ) : (
            'Sugestões a partir de todas as opções.'
          )
        }
        actions={
          <Button variant="primary" onClick={() => p.onCompare(best.map((r) => r.scenario.id))}>
            Preencher com as {best.length} melhores
          </Button>
        }
      >
        {chosen.length ? (
          <ul className="flex flex-wrap gap-2">
            {chosen.map((r) => (
              <li key={r.scenario.id} className="inline-flex items-center gap-2 rounded-full border border-line py-1 pr-1 pl-3 text-sm">
                <span className="size-2.5 rounded-full" style={{ background: p.colors[r.scenario.id] }} aria-hidden />
                <button type="button" onClick={() => p.onOpen(r.scenario.id)} className="text-left hover:underline">
                  {name(r)}
                </button>
                <span className="text-xs text-muted tabular">{money(r.horizons[horizon].monthly)}/mês</span>
                <button
                  type="button"
                  onClick={() => p.onToggle(r.scenario.id)}
                  aria-label={`Remover ${name(r)}`}
                  className="grid size-7 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nenhuma opção escolhida. Use “Preencher com as melhores” ou a busca abaixo.</p>
        )}
        {best.some((r) => !compare.includes(r.scenario.id)) && (
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-2 text-xs font-medium text-ink-2">Melhores com os seus filtros</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {ranked
                .filter((r) => r.scenario.kind !== 'keep' && !compare.includes(r.scenario.id))
                .slice(0, 8)
                .map((r) => (
                  <button
                    key={r.scenario.id}
                    type="button"
                    onClick={() => p.onToggle(r.scenario.id)}
                    className="shrink-0 rounded-xl border border-line px-3 py-2 text-left text-sm hover:border-accent/40"
                  >
                    <span className="block font-medium whitespace-nowrap">+ {name(r)}</span>
                    <span className={`block text-xs tabular ${r.horizons[horizon].savingsVsKeep > 0 ? 'text-good' : 'text-ink-2'}`}>
                      {money(r.horizons[horizon].monthly)}/mês
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </Card>

      <Comparator
        keep={keep}
        results={results}
        ranked={ranked}
        compare={compare}
        colors={p.colors}
        max={p.max}
        onToggle={p.onToggle}
        horizon={horizon}
        onHorizon={p.onHorizon}
        assumptions={p.assumptions}
        onOpen={p.onOpen}
        carModelId={p.carModelId}
        carModelYear={p.carModelYear}
      />

      <Card title="Custo acumulado" subtitle={`Perda de patrimônio mês a mês em ${yrs(horizon)}, já descontando a revenda. Toque no gráfico para ver os valores.`}>
        <CostChart series={p.series} months={horizon * 12} />
      </Card>

      {(keep || chosen.length > 0) && (
        <section className="space-y-3" aria-labelledby="breakdowns">
          <h2 id="breakdowns" className="text-[15px] font-semibold tracking-tight">
            Para onde vai o dinheiro ({yrs(horizon)})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...(keep ? [keep] : []), ...chosen].map((r) => (
              <Card
                key={r.scenario.id}
                title={r.scenario.kind === 'keep' ? `Manter: ${r.scenario.label}` : name(r)}
                subtitle={`${money(r.horizons[horizon].total)} no total · ${money(r.horizons[horizon].monthly)}/mês`}
              >
                <BreakdownBars breakdown={r.horizons[horizon].breakdown} total={r.horizons[horizon].total} />
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
