import { monthlyRate, pmt } from './tco'

/** Condições do simulador de financiamento (ajustáveis pelo usuário). */
export interface FinanceSim {
  /** Entrada mínima exigida para a taxa zero (fração do preço). */
  zeroMinDown: number
  /** Prazos da taxa zero. */
  zeroMonths: number[]
  /** Taxa baixa de referência (a.m.) e prazo, para quem não chega à entrada da taxa zero. */
  lowRateMonth: number
  lowMonths: number
}

export const DEFAULT_FINANCE_SIM: FinanceSim = {
  zeroMinDown: 0.6,
  zeroMonths: [24, 36],
  lowRateMonth: 0.0099,
  lowMonths: 36,
}

export interface Plan {
  label: string
  rateMonth: number
  months: number
  financed: number
  payment: number
  total: number
  interest: number
  /** Valor presente das parcelas descontado pelo rendimento: quanto o plano "custa" hoje. */
  presentCost: number
}

/** Valor presente de n parcelas iguais à taxa de rendimento r (mensal). */
const presentValue = (payment: number, months: number, r: number) =>
  r <= 0 ? payment * months : (payment * (1 - Math.pow(1 + r, -months))) / r

export function makePlan(label: string, financed: number, rateMonth: number, months: number, investRateMonth: number): Plan {
  const payment = financed > 0 ? pmt(financed, rateMonth, months) : 0
  const total = payment * months
  return { label, rateMonth, months, financed, payment, total, interest: total - financed, presentCost: presentValue(payment, months, investRateMonth) }
}

export interface Offer {
  price: number
  /** Dinheiro para a entrada: seu carro (avaliação, já sem o saldo devedor) + reserva. */
  budget: number
  /** Fração do preço que a entrada cobre. */
  downPct: number
  /** Quanto falta (preço − entrada). */
  pending: number
  pendingPct: number
  /** A entrada chega ao mínimo da taxa zero? */
  zeroEligible: boolean
  /** Quanto falta de entrada para a taxa zero (0 se já chega). */
  zeroGap: number
  /** Valor financiado na taxa zero: o que falta, limitado ao máximo permitido (1 − entrada mínima). */
  zeroFinanced: number
  zeroPlans: Plan[]
  lowPlan: Plan
  stdPlan: Plan
}

/**
 * Simula a compra de um 0 km mais caro que o seu carro: entrada com o usado + reserva e o restante financiado.
 * A taxa zero exige entrada mínima; se não chegar, mostra quanto falta e as parcelas com essa entrada completada.
 */
export function offerFor(
  price: number,
  budget: number,
  sim: FinanceSim,
  std: { rateMonth: number; months: number },
  investReturnYear: number,
): Offer {
  const rm = monthlyRate(investReturnYear)
  const down = Math.min(price, Math.max(0, budget))
  const pending = price - down
  const minDown = price * sim.zeroMinDown
  const zeroEligible = down + 0.5 >= minDown
  const zeroFinanced = Math.min(pending, price - minDown)
  return {
    price,
    budget,
    downPct: price > 0 ? down / price : 0,
    pending,
    pendingPct: price > 0 ? pending / price : 0,
    zeroEligible,
    zeroGap: Math.max(0, minDown - down),
    zeroFinanced: Math.max(0, zeroFinanced),
    zeroPlans: sim.zeroMonths.map((n) => makePlan(`Taxa zero ${n}×`, Math.max(0, zeroFinanced), 0, n, rm)),
    lowPlan: makePlan(`${(sim.lowRateMonth * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% a.m. ${sim.lowMonths}×`, pending, sim.lowRateMonth, sim.lowMonths, rm),
    stdPlan: makePlan(`${(std.rateMonth * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% a.m. ${std.months}×`, pending, std.rateMonth, std.months, rm),
  }
}
