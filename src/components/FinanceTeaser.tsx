import { offerFor, type FinanceSim } from '../lib/finance'
import { money } from '../lib/format'
import { paths } from '../lib/router'
import type { Assumptions, ScenarioResult } from '../lib/types'

/** Chamada no painel: quantos 0 km mais caros que o seu carro dão para a taxa zero com a sua entrada. */
export function FinanceTeaser({ ranked, tradeValue, budget, sim, a }: { ranked: ScenarioResult[]; tradeValue: number; budget: number; sim: FinanceSim; a: Assumptions }) {
  const offers = ranked
    .filter((r) => r.scenario.kind === 'new' && r.scenario.price > Math.max(tradeValue, budget))
    .map((r) => ({ r, o: offerFor(r.scenario.price, budget, sim, { rateMonth: a.financeRateMonth, months: a.financeMonths }, a.investReturnYear) }))
  const eligible = offers.filter((x) => x.o.zeroEligible)
  const n = Math.max(...sim.zeroMonths)
  const example = [...eligible].sort((x, y) => x.o.zeroPlans[x.o.zeroPlans.length - 1].payment - y.o.zeroPlans[y.o.zeroPlans.length - 1].payment)[0]
  const max = budget / sim.zeroMinDown
  return (
    <a href={paths.finance()} className="group flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-accent/40 sm:p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-good/12 text-good" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-5">
          <path d="M3 7h18v10H3zM3 11h18M7 15h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-ink-2">Financiar um 0 km com o seu carro na entrada</span>
        <span className="block font-semibold tracking-tight">
          Taxa zero ({Math.round(sim.zeroMinDown * 100)}% de entrada) até <span className="tabular">{money(max)}</span>
        </span>
        <span className="block text-xs text-ink-2">
          {eligible.length} de {offers.length} opções 0 km acima da sua entrada
          {example && ` · ex.: ${example.r.scenario.label} por ${money(example.o.zeroPlans[example.o.zeroPlans.length - 1].payment)}/mês em ${n}×`}
        </span>
      </span>
      <span className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-sm font-medium group-hover:border-accent/40 group-hover:text-accent">Simular →</span>
    </a>
  )
}
