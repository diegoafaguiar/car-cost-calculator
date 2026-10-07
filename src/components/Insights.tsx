import { money, money2, months, pct } from '../lib/format'
import { COST_LABEL } from '../lib/tco'
import type { CostKey, Horizon, ScenarioResult } from '../lib/types'
import { HORIZONS } from '../lib/types'
import { BreakdownBars } from './BreakdownBars'
import { Card, Stat } from './ui'

interface Props {
  keep: ScenarioResult
  ranked: ScenarioResult[]
  horizon: Horizon
  onOpen: (id: string) => void
}

/** Visão do carro atual e da melhor alternativa em cada horizonte. */
export function Insights({ keep, ranked, horizon, onOpen }: Props) {
  const h = keep.horizons[horizon]
  const top = (Object.entries(h.breakdown) as [CostKey, number][]).sort((a, b) => b[1] - a[1])[0]
  const alternatives = ranked.filter((r) => r.scenario.kind !== 'keep')
  const median = (() => {
    const v = alternatives.map((r) => r.horizons[horizon].perKm).sort((a, b) => a - b)
    return v.length ? v[Math.floor(v.length / 2)] : 0
  })()
  const keepPosition = ranked.findIndex((r) => r.scenario.kind === 'keep') + 1

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Valor do meu carro" value={money(keep.scenario.price)} sub={keep.scenario.priceSource === 'fipe' ? `FIPE ${keep.scenario.fipeReference ?? ''}` : 'Valor informado'} />
        <Stat label={`Custo real por mês (${horizon}a)`} value={money(h.monthly)} sub="Inclui depreciação e oportunidade" />
        <Stat label="Custo por km" value={money2(h.perKm)} sub={median ? `Mediana do mercado filtrado: ${money2(median)}` : undefined} />
        <Stat
          label="Posição no ranking"
          value={keepPosition ? `${keepPosition}º de ${ranked.length}` : '—'}
          sub={keepPosition === 1 ? 'Manter é a opção mais barata' : `Horizonte de ${horizon} ${horizon === 1 ? 'ano' : 'anos'}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card title="Para onde vai o dinheiro do seu carro" subtitle={`Próximos ${horizon} ${horizon === 1 ? 'ano' : 'anos'} · ${money(h.total)} no total`}>
          <BreakdownBars breakdown={h.breakdown} total={h.total} />
          {top && h.total > 0 && (
            <p className="mt-3 text-sm text-ink-2">
              O maior peso é <strong className="text-ink">{COST_LABEL[top[0]].toLowerCase()}</strong> ({pct(top[1] / h.total, 0)} do total).
            </p>
          )}
        </Card>

        <Card title="Melhor opção por horizonte" subtitle="Considerando os filtros e premissas atuais">
          <ul className="space-y-3">
            {HORIZONS.map((y) => {
              const best = [...ranked].sort((a, b) => a.horizons[y].total - b.horizons[y].total)[0]
              if (!best) return null
              const isKeep = best.scenario.kind === 'keep'
              const saving = best.horizons[y].savingsVsKeep
              return (
                <li key={y} className="rounded-lg border border-line p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                      {y === 1 ? 'Curto prazo' : y === 3 ? 'Médio prazo' : 'Longo prazo'} · {y} {y === 1 ? 'ano' : 'anos'}
                    </span>
                    <span className="tabular text-sm text-ink-2">{money(best.horizons[y].monthly)}/mês</span>
                  </div>
                  <button type="button" onClick={() => onOpen(best.scenario.id)} className="mt-1 block text-left font-semibold hover:underline">
                    {best.scenario.label}
                    <span className="ml-1 font-normal text-ink-2">· {best.scenario.detail}</span>
                  </button>
                  <p className="mt-1 text-sm">
                    {isKeep ? (
                      <span className="text-ink-2">Manter seu carro é o mais barato neste horizonte.</span>
                    ) : (
                      <>
                        <span className="text-good">▲ economia de {money(saving)}</span>
                        <span className="text-ink-2">
                          {' '}
                          vs. manter
                          {best.breakEvenMonth ? ` · compensa a partir de ${months(best.breakEvenMonth)}` : ''}
                        </span>
                      </>
                    )}
                  </p>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </div>
  )
}
