import { CATEGORY_LABEL, POWERTRAIN_LABEL } from '../lib/catalog'
import { money, money2, months } from '../lib/format'
import type { CurrentCar, Horizon, ScenarioResult } from '../lib/types'
import { HORIZONS } from '../lib/types'
import { Badge, Button } from './ui'

interface Props {
  car: CurrentCar
  keep: ScenarioResult
  ranked: ScenarioResult[]
  horizon: Horizon
  score: (r: ScenarioResult, h: Horizon) => number
  onEdit: () => void
  onOpen: (id: string) => void
  includeOpportunity: boolean
}

const TERM: Record<Horizon, string> = { 1: 'Curto prazo', 3: 'Médio prazo', 5: 'Longo prazo' }

/** Topo do painel: o seu carro, quanto ele custa de verdade e o veredito por horizonte. */
export function CarHero({ car, keep, ranked, horizon, score, onEdit, onOpen, includeOpportunity }: Props) {
  const h = keep.horizons[horizon]
  const position = ranked.findIndex((r) => r.scenario.kind === 'keep') + 1
  const s = keep.scenario

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-muted uppercase">Seu carro</p>
              <h2 className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl">{car.label}</h2>
              <p className="mt-1 text-sm text-ink-2">
                {car.modelYear} · {car.odometerKm ? `${car.odometerKm.toLocaleString('pt-BR')} km` : 'km não informado'}
              </p>
            </div>
            <Button onClick={onEdit}>Editar</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge>{CATEGORY_LABEL[car.category]}</Badge>
            <Badge>{POWERTRAIN_LABEL[car.powertrain]}</Badge>
            <Badge tone={s.priceSource === 'fipe' ? 'good' : 'neutral'}>
              {s.priceSource === 'fipe' ? `FIPE ${s.fipeReference ?? ''}` : 'Valor informado'}
            </Badge>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
            <div>
              <dt className="text-xs text-ink-2">Valor de mercado</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular">{money(s.price)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-2">Custo real ({horizon}a)</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular">
                {money(h.monthly)}
                <span className="text-xs font-normal text-muted">/mês</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-2">Por km</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular">{money2(h.perKm)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">
            Custo real inclui depreciação, combustível, seguro, IPVA e manutenção
            {includeOpportunity ? ', além do rendimento que o dinheiro do carro teria aplicado.' : '. Custo de oportunidade desligado.'}
            {position > 0 && ` Manter está em ${position}º de ${ranked.length} no ranking atual.`}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Melhor decisão com os filtros atuais</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {HORIZONS.map((y) => {
              const best = [...ranked].sort((a, b) => score(a, y) - score(b, y))[0]
              if (!best) return null
              const isKeep = best.scenario.kind === 'keep'
              const saving = best.horizons[y].savingsVsKeep
              return (
                <li key={y}>
                  <button
                    type="button"
                    onClick={() => onOpen(best.scenario.id)}
                    className={`h-full w-full rounded-xl border p-3 text-left transition-colors hover:border-accent/50 ${
                      y === horizon ? 'border-accent/40 bg-accent-soft' : 'border-line'
                    }`}
                  >
                    <span className="block text-[11px] font-semibold tracking-wide text-muted uppercase">
                      {TERM[y]} · {y} {y === 1 ? 'ano' : 'anos'}
                    </span>
                    <span className="mt-1 block font-semibold leading-snug">
                      {isKeep ? 'Manter o seu carro' : best.scenario.label}
                    </span>
                    {!isKeep && <span className="block text-xs text-ink-2">{best.scenario.detail}</span>}
                    <span className="mt-2 block text-sm">
                      {isKeep ? (
                        <span className="text-ink-2">Nenhuma troca sai mais barata</span>
                      ) : saving > 0 ? (
                        <span className="text-good">▲ {money(saving)} de economia</span>
                      ) : (
                        <span className="text-ink-2">
                          {money(-saving)} a mais, compensado pela sua preferência
                        </span>
                      )}
                    </span>
                    {!isKeep && best.breakEvenMonth !== null && best.breakEvenMonth > 0 && saving > 0 && (
                      <span className="block text-xs text-muted">compensa a partir de {months(best.breakEvenMonth)}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
