import { CATALOG, CATEGORY_LABEL, POWERTRAIN_LABEL } from '../lib/catalog'
import { money, money2, months } from '../lib/format'
import { marketFor } from '../lib/market'
import { MODEL_INFO } from '../lib/modelInfo'
import type { CurrentCar, Horizon, ScenarioResult } from '../lib/types'
import { HORIZONS } from '../lib/types'
import { CostTooltip } from './CostTooltip'
import { Badge, Button, Segmented, Switch } from './ui'
import { WikiImage } from './WikiImage'

interface Props {
  car: CurrentCar
  keep: ScenarioResult
  ranked: ScenarioResult[]
  horizon: Horizon
  onHorizon: (h: Horizon) => void
  score: (r: ScenarioResult, h: Horizon) => number
  onEdit: () => void
  onOpen: (id: string) => void
  includeOpportunity: boolean
  onIncludeOpportunity: (v: boolean) => void
  investReturn: number
  compare: string[]
  onToggleCompare: (id: string) => void
  usingPreference: boolean
}

const TERM: Record<Horizon, string> = { 1: 'Curto prazo', 3: 'Médio prazo', 5: 'Longo prazo' }
const yrs = (h: number) => `${h} ${h === 1 ? 'ano' : 'anos'}`
/** "0 km" ou "seminovo 2022", para frases. */
const when = (r: ScenarioResult) =>
  r.scenario.kind === 'subscription'
    ? 'por assinatura'
    : r.scenario.ageAtStart === 0
      ? '0 km'
      : `seminovo ${new Date().getFullYear() - r.scenario.ageAtStart}`

/** Primeira dobra: veredito, controles principais, o seu carro e as melhores alternativas. */
export function CarHero(p: Props) {
  const { car, keep, ranked, horizon, score } = p
  const h = keep.horizons[horizon]
  const s = keep.scenario
  const cm = CATALOG.find((m) => m.id === car.catalogModelId)
  const info = cm ? MODEL_INFO[cm.infoId ?? cm.id] : undefined
  const market = cm ? marketFor(cm.id, car.modelYear) : undefined
  const ordered = [...ranked].sort((a, b) => score(a, horizon) - score(b, horizon))
  const best = ordered[0]
  // Uma linha por modelo (a melhor forma de tê-lo), para as alternativas não repetirem o mesmo carro.
  const familyOf = (r: ScenarioResult) => {
    const m = CATALOG.find((x) => x.id === r.scenario.modelId)
    return r.scenario.kind === 'subscription' ? r.scenario.id : (m?.infoId ?? m?.id ?? r.scenario.id)
  }
  const seen = new Set<string>()
  const alternatives = ordered
    .filter((r) => r.scenario.kind !== 'keep')
    .filter((r) => (seen.has(familyOf(r)) ? false : (seen.add(familyOf(r)), true)))
    .slice(0, 3)
  const position = ordered.findIndex((r) => r.scenario.kind === 'keep') + 1
  const bestIsKeep = !best || best.scenario.kind === 'keep'
  const bestSaving = best ? best.horizons[horizon].savingsVsKeep : 0

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-col gap-4 border-b border-line bg-gradient-to-br from-accent-soft to-transparent p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">Conclusão em {yrs(horizon)}</p>
          <h1 className="mt-1 text-xl leading-snug font-semibold tracking-tight text-balance sm:text-2xl">
            {bestIsKeep ? (
              <>Manter o seu {car.label.split(' ').slice(0, 3).join(' ')} é a opção mais barata.</>
            ) : bestSaving > 0 ? (
              <>
                Trocar por <span className="text-accent">{best.scenario.label}</span> {when(best)} economiza{' '}
                <span className="text-good">{money(bestSaving)}</span> em relação a manter.
              </>
            ) : (
              <>
                Com a sua preferência, <span className="text-accent">{best.scenario.label}</span> lidera — mas custa{' '}
                <span className="text-bad">{money(-bestSaving)}</span> a mais que manter.
              </>
            )}
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            {ranked.length} opções comparadas com os filtros atuais · manter está em {position}º
            {p.usingPreference && ' · ranking considera a sua preferência por motorização'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-2">Horizonte</span>
            <Segmented<Horizon>
              label="Horizonte"
              value={horizon}
              options={HORIZONS.map((y) => ({ value: y, label: yrs(y) }))}
              onChange={p.onHorizon}
            />
          </div>
          <Switch
            checked={p.includeOpportunity}
            onChange={p.onIncludeOpportunity}
            label="Custo de oportunidade"
            hint={p.includeOpportunity ? `Rendimento de ${(p.investReturn * 100).toFixed(1)}% a.a.` : 'Só gastos e depreciação'}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 border-b border-line p-5 sm:p-6 lg:border-r lg:border-b-0">
          <div className="flex items-start gap-4">
            {cm && (
              <div className="w-24 shrink-0 sm:w-28">
                <WikiImage compact lang={info?.wikipedia?.lang} title={info?.wikipedia?.title} fallbackQuery={`${cm.brand} ${cm.model}`} alt={car.label} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">Seu carro</p>
                  <h2 className="line-clamp-2 font-semibold tracking-tight sm:text-lg">{car.label}</h2>
                </div>
                <Button onClick={p.onEdit}>Editar</Button>
              </div>
              <p className="mt-0.5 text-sm text-ink-2">
                {car.modelYear} · {car.odometerKm ? `${car.odometerKm.toLocaleString('pt-BR')} km` : 'km não informado'}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge>{CATEGORY_LABEL[car.category]}</Badge>
                <Badge>{POWERTRAIN_LABEL[car.powertrain]}</Badge>
              </div>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Custo por mês">
              <CostTooltip result={keep} horizon={horizon} align="left">
                {money(h.monthly)}
              </CostTooltip>
            </Kpi>
            <Kpi label={`Total em ${yrs(horizon)}`}>{money(h.total)}</Kpi>
            <Kpi label="Por km">{money2(h.perKm)}</Kpi>
            <Kpi label="Valor de mercado" sub={s.priceSource === 'fipe' ? `FIPE ${s.fipeReference ?? ''}` : 'informado'}>
              {money(s.price)}
            </Kpi>
          </dl>
          {market?.summary && market.summary.count > 0 && (
            <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-2">
              Anúncios de {cm?.model} {car.modelYear} vistos em {market.listings[0]?.date ?? 'out/2026'}: mediana{' '}
              <strong className="text-ink tabular">{money(market.summary.median)}</strong> ({market.summary.count} anúncios, de{' '}
              {money(market.summary.min)} a {money(market.summary.max)}). Preço pedido não é preço de venda.
            </p>
          )}
          <p className="mt-3 text-xs text-muted">Passe o mouse ou toque no custo por mês para ver de onde vem cada real.</p>
        </div>

        <div className="min-w-0 p-5 sm:p-6">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">Melhores alternativas</p>
            <span className="text-xs text-muted">custo por mês · vs. manter</span>
          </div>
          <ol className="divide-y divide-line">
            {alternatives.map((r, i) => {
              const v = r.horizons[horizon].savingsVsKeep
              const inCmp = p.compare.includes(r.scenario.id)
              return (
                <li key={r.scenario.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold tabular">{i + 1}</span>
                  <button type="button" onClick={() => p.onOpen(r.scenario.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate font-medium hover:underline">{r.scenario.label}</span>
                    <span className="block truncate text-xs text-ink-2">{r.scenario.detail}</span>
                  </button>
                  <span className="text-right text-sm">
                    <span className="block font-semibold tabular">
                      <CostTooltip result={r} horizon={horizon} keep={keep}>
                        {money(r.horizons[horizon].monthly)}
                      </CostTooltip>
                    </span>
                    <span className={`block text-xs tabular ${v > 0 ? 'text-good' : 'text-bad'}`}>
                      {v > 0 ? '▲ ' : '▼ '}
                      {money(Math.abs(v))}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => p.onToggleCompare(r.scenario.id)}
                    title={inCmp ? 'Remover da comparação' : 'Adicionar à comparação'}
                    aria-label={inCmp ? `Remover ${r.scenario.label} da comparação` : `Comparar ${r.scenario.label}`}
                    className={`grid size-8 shrink-0 place-items-center rounded-lg border text-sm ${
                      inCmp ? 'border-accent/40 bg-accent-soft text-accent' : 'border-line text-ink-2 hover:text-ink'
                    }`}
                  >
                    {inCmp ? '✓' : '+'}
                  </button>
                </li>
              )
            })}
          </ol>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {HORIZONS.map((y) => {
              const b = [...ranked].sort((a, c) => score(a, y) - score(c, y))[0]
              if (!b) return null
              const isKeep = b.scenario.kind === 'keep'
              const sv = b.horizons[y].savingsVsKeep
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => p.onHorizon(y)}
                  className={`min-w-0 rounded-xl border p-2.5 text-left transition-colors ${y === horizon ? 'border-accent/40 bg-accent-soft' : 'border-line hover:border-ink/20'}`}
                >
                  <span className="block truncate text-[10px] font-semibold tracking-wide text-muted uppercase sm:text-[11px]">
                    {TERM[y]} · {yrs(y)}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-semibold">{isKeep ? 'Manter' : b.scenario.label}</span>
                  <span className={`block truncate text-xs tabular ${isKeep ? 'text-ink-2' : sv > 0 ? 'text-good' : 'text-ink-2'}`}>
                    {isKeep ? 'mais barato' : sv > 0 ? `▲ ${money(sv)}` : 'por preferência'}
                  </span>
                  {!isKeep && b.breakEvenMonth !== null && b.breakEvenMonth > 0 && sv > 0 && (
                    <span className="hidden text-[11px] text-muted sm:block">compensa em {months(b.breakEvenMonth)}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function Kpi({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-2">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tracking-tight tabular">{children}</dd>
      {sub && <dd className="truncate text-[11px] text-muted">{sub}</dd>}
    </div>
  )
}
