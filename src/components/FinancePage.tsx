import { useMemo, useState } from 'react'
import { activeFilters } from '../lib/filters'
import { DEFAULT_FINANCE_SIM, offerFor, type FinanceSim, type Offer, type Plan } from '../lib/finance'
import { money, normalize } from '../lib/format'
import { paths, usePageMeta } from '../lib/router'
import { tradeInFor } from '../lib/tco'
import type { Assumptions, Category, CurrentCar, FinanceRule, Preferences, ScenarioResult } from '../lib/types'
import { Breadcrumbs, PageHeader, ShareButton } from './Browse'
import { Card, Chip, NumberField } from './ui'

/** Marcas chinesas do catálogo (as que mais anunciam taxa zero com entrada alta). */
export const CHINESE_BRANDS = ['BYD', 'GWM', 'Caoa Chery', 'Omoda', 'Jaecoo', 'Geely', 'Leapmotor', 'Jetour', 'MG', 'GAC', 'Zeekr', 'Denza', 'Caoa Changan']
const RULE_PREFIX = 'sim-zero-'
const pct = (v: number) => `${Math.round(v * 100)}%`

interface Props {
  focusId?: string
  ranked: ScenarioResult[]
  car: CurrentCar
  onCar: (c: CurrentCar) => void
  assumptions: Assumptions
  onAssumptions: (a: Assumptions) => void
  sim: FinanceSim
  onSim: (s: FinanceSim) => void
  prefs: Preferences
  carCategory: Category
  year: number
  onEditFilters: () => void
}

/** Simulador: seu carro como entrada de um 0 km mais caro, quanto falta e as parcelas com taxa zero ou baixa. */
export function FinancePage(p: Props) {
  const { car, assumptions: a, sim } = p
  usePageMeta('Simulador de financiamento de 0 km | Custo de Carro', 'Seu carro na troca como entrada: percentual a financiar e parcelas em 24 ou 36 vezes com taxa zero ou taxa baixa.')
  const [q, setQ] = useState('')
  const t = tradeInFor(car, a, p.year)
  const tradeNet = Math.max(0, t.value - car.loanBalance)
  const budget = tradeNet + a.savingsAvailable
  const filters = activeFilters(p.prefs, p.carCategory)

  const offers = useMemo(() => {
    const words = normalize(q).split(/\s+/).filter(Boolean)
    return p.ranked
      // Só os que precisam de financiamento: mais caros que o seu carro + a reserva.
      .filter((r) => r.scenario.kind === 'new' && r.scenario.price > budget)
      .filter((r) => words.every((w) => normalize(`${r.scenario.label} ${r.scenario.detail}`).includes(w)))
      .map((r) => ({ r, o: offerFor(r.scenario.price, budget, sim, { rateMonth: a.financeRateMonth, months: a.financeMonths }, a.investReturnYear) }))
      .sort((x, y) => {
        if (p.focusId) {
          if (x.r.scenario.modelId === p.focusId) return -1
          if (y.r.scenario.modelId === p.focusId) return 1
        }
        return Number(y.o.zeroEligible) - Number(x.o.zeroEligible) || x.o.zeroGap - y.o.zeroGap || x.r.scenario.price - y.r.scenario.price
      })
  }, [p.ranked, p.focusId, q, t.value, budget, sim, a.financeRateMonth, a.financeMonths, a.investReturnYear])
  const eligible = offers.filter((x) => x.o.zeroEligible).length
  const coveredCash = p.ranked.filter((r) => r.scenario.kind === 'new' && r.scenario.price > t.value && r.scenario.price <= budget).length

  // Regras de taxa zero que o simulador cria no cálculo de custo (aparecem em Premissas › Financiamento).
  const simRules = (a.financeRules ?? []).filter((r) => r.id.startsWith(RULE_PREFIX))
  const scope: 'none' | 'chinese' | 'all' = !simRules.length ? 'none' : simRules.some((r) => !r.brand) ? 'all' : 'chinese'
  const applyScope = (next: 'none' | 'chinese' | 'all', s = sim) => {
    const others = (a.financeRules ?? []).filter((r) => !r.id.startsWith(RULE_PREFIX))
    const months = Math.max(...s.zeroMonths)
    const rule = (brand: string): FinanceRule => ({
      id: `${RULE_PREFIX}${brand || 'todas'}`,
      brand,
      appliesTo: 'new',
      rateMonth: 0,
      months,
      downPaymentPct: s.zeroMinDown,
      note: `Taxa zero simulada: entrada mínima ${pct(s.zeroMinDown)}, ${months}×`,
    })
    const added = next === 'none' ? [] : next === 'all' ? [rule('')] : CHINESE_BRANDS.map(rule)
    p.onAssumptions({ ...a, financeRules: [...others, ...added] })
  }
  const setSim = (s: FinanceSim) => {
    p.onSim(s)
    if (scope !== 'none') applyScope(scope, s)
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Início', href: paths.home() }, { label: 'Financiamento' }]} />
      <PageHeader
        eyebrow="Simulador · 0 km"
        title="Financiamento com o seu carro na entrada"
        subtitle="Veja quanto do 0 km o seu usado cobre, quanto falta financiar e as parcelas com taxa zero ou taxa baixa."
        actions={<ShareButton title="Simulador de financiamento — Custo de Carro" />}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card title="Sua entrada" subtitle="Seu carro na troca + dinheiro guardado">
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Avaliação do seu carro"
              prefix="R$"
              step={1000}
              value={car.tradeInValue ?? Math.round(t.auto)}
              onChange={(v) => p.onCar({ ...car, tradeInValue: v > 0 ? Math.round(v) : undefined })}
              hint={t.manual ? 'proposta informada' : `estimativa: ${money(t.auto)}`}
            />
            <NumberField label="Dinheiro extra" prefix="R$" step={1000} value={a.savingsAvailable} onChange={(v) => p.onAssumptions({ ...a, savingsAvailable: Math.max(0, v) })} hint="além do carro" />
          </div>
          {car.loanBalance > 0 && <p className="mt-2 text-xs text-ink-2">Desconta o saldo devedor do seu carro ({money(car.loanBalance)}).</p>}
          <div className="mt-4 flex items-end justify-between rounded-xl bg-accent-soft px-4 py-3">
            <span className="text-sm text-ink-2">Entrada disponível</span>
            <span className="text-2xl font-semibold tracking-tight tabular">{money(budget)}</span>
          </div>
          {t.manual && (
            <button type="button" onClick={() => p.onCar({ ...car, tradeInValue: undefined })} className="mt-2 text-xs font-medium text-accent hover:underline">
              Voltar à estimativa automática ({money(t.auto)})
            </button>
          )}
        </Card>

        <Card title="Condições" subtitle="Informadas por você — confirme a campanha na concessionária">
          <div className="space-y-4">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-ink-2">Taxa zero: entrada mínima</span>
              <div className="flex flex-wrap gap-1.5">
                {[0.5, 0.6, 0.65, 0.7].map((v) => (
                  <Chip key={v} active={sim.zeroMinDown === v} onClick={() => setSim({ ...sim, zeroMinDown: v })}>
                    {pct(v)}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-ink-2">Taxa zero: prazos</span>
              <div className="flex flex-wrap gap-1.5">
                {[12, 18, 24, 36, 48].map((n) => (
                  <Chip
                    key={n}
                    active={sim.zeroMonths.includes(n)}
                    onClick={() => {
                      const next = sim.zeroMonths.includes(n) ? sim.zeroMonths.filter((x) => x !== n) : [...sim.zeroMonths, n].sort((x, y) => x - y)
                      if (next.length) setSim({ ...sim, zeroMonths: next })
                    }}
                  >
                    {n}×
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Taxa baixa" suffix="% a.m." step={0.01} scale={100} value={sim.lowRateMonth} onChange={(v) => setSim({ ...sim, lowRateMonth: Math.max(0, v) })} />
              <NumberField label="Prazo da taxa baixa" suffix="×" value={sim.lowMonths} onChange={(v) => setSim({ ...sim, lowMonths: Math.max(1, Math.round(v)) })} />
            </div>
            <p className="text-xs text-muted">
              Taxa padrão (Premissas): {(a.financeRateMonth * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% a.m. em {a.financeMonths}×. Simulação sem IOF, TAC e seguro
              prestamista, que entram no CET da proposta real.
              <button type="button" onClick={() => p.onSim(DEFAULT_FINANCE_SIM)} className="ml-1 font-medium text-accent hover:underline">
                Restaurar
              </button>
            </p>
          </div>
        </Card>
      </div>

      <Card
        title="Usar a taxa zero no ranking"
        subtitle={`Faz o custo total dos 0 km considerar a taxa zero (entrada de ${pct(sim.zeroMinDown)}, ${Math.max(...sim.zeroMonths)}×) quando a sua entrada alcança o mínimo.`}
      >
        <div className="flex flex-wrap gap-1.5">
          <Chip active={scope === 'none'} onClick={() => applyScope('none')}>
            Não aplicar
          </Chip>
          <Chip active={scope === 'chinese'} onClick={() => applyScope('chinese')}>
            Só marcas chinesas
          </Chip>
          <Chip active={scope === 'all'} onClick={() => applyScope('all')}>
            Todas as marcas
          </Chip>
        </div>
        {scope === 'chinese' && <p className="mt-2 text-xs text-muted">{CHINESE_BRANDS.join(', ')}.</p>}
      </Card>

      <section className="space-y-3" aria-labelledby="fin-list">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="fin-list" className="text-[15px] font-semibold tracking-tight">
              0 km que precisam de financiamento
            </h2>
            <p className="text-sm text-ink-2">
              {offers.length} opções acima da sua entrada · {eligible} com entrada suficiente para a taxa zero
              {coveredCash > 0 && ` · outras ${coveredCash} acima do valor do carro você paga à vista com a reserva`}
              {filters.length > 0 && (
                <>
                  {' '}
                  · filtros: {filters.map((f) => f.label).join(', ')}{' '}
                  <button type="button" onClick={p.onEditFilters} className="font-medium text-accent hover:underline">
                    editar
                  </button>
                </>
              )}
            </p>
          </div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar modelo"
            className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-[15px] outline-none focus:border-accent sm:w-64 sm:text-sm"
          />
        </div>
        {offers.length ? (
          <ul className="grid gap-4 lg:grid-cols-2">
            {offers.slice(0, 40).map(({ r, o }) => (
              <OfferCard key={r.scenario.id} r={r} o={o} sim={sim} highlight={r.scenario.modelId === p.focusId} />
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-2">Nenhum 0 km acima da sua entrada com os filtros atuais.</p>
        )}
      </section>
    </div>
  )
}

function OfferCard({ r, o, sim, highlight }: { r: ScenarioResult; o: Offer; sim: FinanceSim; highlight: boolean }) {
  const s = r.scenario
  const plans: (Plan & { kind: 'zero' | 'low' | 'std' })[] = [...o.zeroPlans.map((x) => ({ ...x, kind: 'zero' as const })), { ...o.lowPlan, kind: 'low' }, { ...o.stdPlan, kind: 'std' }]
  // O ganho da taxa zero: quanto ela vale hoje frente a pagar o que falta à vista (o dinheiro fica rendendo).
  const zero = o.zeroPlans[o.zeroPlans.length - 1]
  const gain = zero && o.zeroEligible ? zero.financed - zero.presentCost : 0
  return (
    <li className={`rounded-2xl border bg-surface p-4 shadow-card sm:p-5 ${highlight ? 'border-accent' : 'border-line'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a href={paths.car(s.modelId!)} className="font-semibold hover:text-accent hover:underline">
            {s.label}
          </a>
          <p className="truncate text-xs text-ink-2">{s.detail.replace(' · 0 km', '')}</p>
        </div>
        <span className="shrink-0 text-right">
          <span className="block font-semibold tabular">{money(o.price)}</span>
          <span className="block text-[11px] text-muted">0 km{s.priceSource === 'fipe' ? ' · FIPE' : ''}</span>
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs">
          <span>
            Entrada cobre <strong className="tabular">{pct(o.downPct)}</strong>
          </span>
          <span className="text-ink-2">
            Falta <strong className="text-ink tabular">{money(o.pending)}</strong> ({pct(o.pendingPct)})
          </span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`Entrada cobre ${pct(o.downPct)} do preço; mínimo para taxa zero ${pct(sim.zeroMinDown)}`}>
          <div className={`h-full rounded-full ${o.zeroEligible ? 'bg-good' : 'bg-accent'}`} style={{ width: `${Math.min(100, o.downPct * 100)}%` }} />
          <div className="absolute inset-y-0 w-0.5 bg-ink/70" style={{ left: `${sim.zeroMinDown * 100}%` }} />
        </div>
        <p className={`mt-1.5 text-xs ${o.zeroEligible ? 'text-good' : 'text-ink-2'}`}>
          {o.zeroEligible
            ? `✓ Entrada acima de ${pct(sim.zeroMinDown)}: dá para a taxa zero.`
            : `Para a taxa zero faltam ${money(o.zeroGap)} de entrada (mínimo ${pct(sim.zeroMinDown)} = ${money(o.price * sim.zeroMinDown)}).`}
        </p>
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-2">
        {plans.map((pl) => {
          const unavailable = pl.kind === 'zero' && !o.zeroEligible
          return (
            <li key={pl.label} className={`rounded-xl border p-2.5 ${pl.kind === 'zero' && o.zeroEligible ? 'border-good/40 bg-good/5' : 'border-line'}`}>
              <span className="block text-[11px] font-medium text-ink-2">{pl.label}</span>
              {o.pending <= 0 ? (
                <span className="block text-sm font-semibold">à vista</span>
              ) : (
                <>
                  <span className="block font-semibold tabular">{money(pl.payment)}/mês</span>
                  <span className="block text-[11px] text-muted tabular">
                    {unavailable ? `com +${money(o.zeroGap)} de entrada` : pl.interest > 1 ? `juros ${money(pl.interest)}` : 'sem juros'}
                  </span>
                </>
              )}
            </li>
          )
        })}
      </ul>
      {gain > 1 && (
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs text-ink-2">
          Com o dinheiro rendendo, a taxa zero em {zero.months}× vale cerca de <strong className="text-good tabular">{money(gain)}</strong> a menos que pagar o restante à vista.
        </p>
      )}
    </li>
  )
}
