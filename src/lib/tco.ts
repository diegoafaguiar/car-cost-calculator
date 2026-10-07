import {
  CATALOG,
  CATEGORY_LABEL,
  INSURANCE_BY_CATEGORY,
  MAINTENANCE_BY_CATEGORY,
  POWERTRAIN_LABEL,
  SUBSCRIPTION_REPRESENTATIVE,
} from './catalog'
import { marketFor } from './market'
import type {
  Assumptions,
  Breakdown,
  CatalogModel,
  Consumption,
  CostKey,
  CurrentCar,
  CustomCar,
  FinanceRule,
  Horizon,
  HorizonResult,
  Powertrain,
  PriceSource,
  Scenario,
  ScenarioResult,
} from './types'
import { HORIZONS } from './types'

export const SIM_MONTHS = 60

export const COST_KEYS: CostKey[] = [
  'depreciation',
  'energy',
  'insurance',
  'taxes',
  'maintenance',
  'interest',
  'subscription',
  'opportunity',
]

export const COST_LABEL: Record<CostKey, string> = {
  depreciation: 'Depreciação',
  energy: 'Combustível / energia',
  insurance: 'Seguro',
  taxes: 'IPVA e licenciamento',
  maintenance: 'Manutenção',
  interest: 'Juros do financiamento',
  subscription: 'Assinatura',
  opportunity: 'Custo de oportunidade',
}

const emptyBreakdown = (): Breakdown => ({
  depreciation: 0,
  energy: 0,
  insurance: 0,
  taxes: 0,
  maintenance: 0,
  interest: 0,
  subscription: 0,
  opportunity: 0,
})

const monthlyRate = (yearly: number) => Math.pow(1 + yearly, 1 / 12) - 1

/** Custo de energia por km, escolhendo o combustível mais barato em carros flex. */
export function energyCostPerKm(
  powertrain: Powertrain,
  c: Consumption,
  a: Assumptions,
  evShare = 0,
): number {
  const mix = (city: number, road: number) => {
    if (city <= 0 || road <= 0) return Infinity
    return a.cityShare / city + (1 - a.cityShare) / road
  }
  const litersGas = mix(c.cityKmL, c.roadKmL)
  const kwh = mix(c.cityKmKWh ?? 0, c.roadKmKWh ?? 0)

  const combustion = () => {
    if (powertrain === 'diesel') return litersGas * a.dieselPrice
    const gas = litersGas * a.gasolinePrice
    if (powertrain === 'gasolina') return gas
    // Flex (inclui híbridos flex da Toyota): usa o mais barato por km.
    const hasEthanol = powertrain === 'flex' || c.cityKmLEthanol !== undefined
    if (!hasEthanol) return gas
    const eth =
      mix(c.cityKmLEthanol ?? c.cityKmL * 0.7, c.roadKmLEthanol ?? c.roadKmL * 0.7) * a.ethanolPrice
    return Math.min(gas, eth)
  }

  if (powertrain === 'eletrico') return kwh * a.kwhPrice
  if (powertrain === 'hibrido-plugin') {
    const share = a.phevElectricShare ?? evShare
    return share * kwh * a.kwhPrice + (1 - share) * combustion()
  }
  return combustion()
}

/** Qual combustível compensa (para exibição). */
export function bestFuel(powertrain: Powertrain, c: Consumption, a: Assumptions): string {
  if (powertrain === 'eletrico') return 'Energia elétrica'
  if (powertrain === 'diesel') return 'Diesel'
  if (powertrain === 'gasolina' || (powertrain !== 'flex' && c.cityKmLEthanol === undefined)) {
    return powertrain === 'hibrido-plugin' ? 'Eletricidade + gasolina' : 'Gasolina'
  }
  const gas = energyCostPerKm('gasolina', c, a)
  const eth = energyCostPerKm('flex', c, a)
  const fuel = eth < gas ? 'Etanol' : 'Gasolina'
  return powertrain === 'hibrido-plugin' ? `Eletricidade + ${fuel.toLowerCase()}` : fuel
}

/** Depreciação anual esperada para um carro com a idade informada. */
export function depreciationRate(age: number, factor: number): number {
  const base = age <= 0 ? 0.15 : Math.max(0.04, 0.1 - 0.006 * (age - 1))
  return Math.min(0.4, base * factor)
}

/** Valor de mercado após `months` meses, a partir do valor atual. */
export function projectValue(
  value: number,
  ageAtStart: number,
  factor: number,
  months: number,
  fixedRate?: number,
): number {
  let v = value
  let remaining = months
  let age = ageAtStart
  while (remaining > 0) {
    const step = Math.min(12, remaining)
    const rate = fixedRate ?? depreciationRate(age, factor)
    v *= Math.pow(1 - rate, step / 12)
    remaining -= step
    age += 1
  }
  return v
}

/** Valor estimado de um modelo com `age` anos, a partir do preço 0 km. */
export function estimateUsedPrice(newPrice: number, age: number, factor: number): number {
  return projectValue(newPrice, 0, factor, age * 12)
}

export function pmt(principal: number, rate: number, n: number): number {
  if (principal <= 0 || n <= 0) return 0
  if (rate === 0) return principal / n
  return (principal * rate) / (1 - Math.pow(1 + rate, -n))
}

function ipvaRateFor(p: Powertrain, a: Assumptions) {
  if (p === 'eletrico') return a.ipvaRateEV
  if (p === 'hibrido-plugin') return a.ipvaRatePHEV ?? a.ipvaRateHybrid
  if (p === 'hibrido') return a.ipvaRateHybrid
  return a.ipvaRate
}

export function currentCarValue(car: CurrentCar): number {
  return car.manualValue && car.manualValue > 0 ? car.manualValue : (car.fipeValue ?? 0)
}

/** Desconto (ou ágio, se negativo) no carro atual por rodar acima (abaixo) da média de 12 mil km/ano. */
export function mileagePenalty(car: CurrentCar, a: Assumptions, year: number): number {
  if (!car.odometerKm) return 0
  const expected = Math.max(0.5, year - car.modelYear) * 12000
  const pen = ((car.odometerKm - expected) / 10000) * a.mileageDiscountPer10k
  return Math.min(0.25, Math.max(-0.05, pen))
}

/** Escolhe a condição de financiamento: regra do modelo > regra da marca > padrão. */
export function financeTermsFor(s: Scenario, a: Assumptions) {
  const kindOk = (r: FinanceRule) =>
    r.appliesTo === 'all' || (r.appliesTo === 'new' ? s.kind === 'new' : s.kind === 'used')
  const rules = (a.financeRules ?? []).filter(kindOk)
  const rule =
    rules.find((r) => r.modelId && r.modelId === s.modelId) ??
    rules.find((r) => !r.modelId && r.brand && r.brand === s.brand)
  return rule
    ? { rateMonth: rule.rateMonth, months: rule.months, downPaymentPct: rule.downPaymentPct, ruleId: rule.id }
    : { rateMonth: a.financeRateMonth, months: a.financeMonths, downPaymentPct: a.downPaymentPct }
}

export interface SimContext {
  assumptions: Assumptions
  car: CurrentCar
  /** Mês do calendário em que a simulação começa (0 = janeiro). Define quando o IPVA vence. */
  startMonth: number
  year: number
}

interface Loan {
  balance: number
  payment: number
  remaining: number
  /** Juros mensais; quando ausente, os juros são rateados linearmente. */
  rate?: number
}

function stepLoan(loan: Loan): { paid: number; interest: number } {
  if (loan.remaining <= 0 || loan.payment <= 0) return { paid: 0, interest: 0 }
  const interest =
    loan.rate !== undefined
      ? loan.balance * loan.rate
      : Math.max(0, (loan.payment * loan.remaining - loan.balance) / loan.remaining)
  const principal = Math.min(loan.balance, loan.payment - interest)
  loan.balance = Math.max(0, loan.balance - principal)
  loan.remaining -= 1
  return { paid: loan.payment, interest }
}

/**
 * Simula 60 meses de um cenário. O custo é medido como a perda de patrimônio
 * frente a vender o carro atual hoje e investir o valor: considera fluxo de caixa,
 * valor de revenda ao final (com deságio de venda), saldo devedor e rendimento.
 */
export function simulate(s: Scenario, ctx: SimContext): Omit<ScenarioResult, 'breakEvenMonth'> {
  const a = ctx.assumptions
  const car = ctx.car
  const rm = monthlyRate(a.investReturnYear)
  // Sem custo de oportunidade, o dinheiro não rende no cálculo do custo (a decisão de financiar continua usando o rendimento).
  const rmCost = a.includeOpportunity === false ? 0 : rm
  const sale = 1 - a.saleDiscountPct
  const kmMonth = a.kmPerYear / 12
  const curValue = currentCarValue(car)
  const kmFactor = 1 - mileagePenalty(car, a, ctx.year)
  const curSale = curValue * kmFactor * sale

  const w0 = curSale - car.loanBalance
  let cash = 0
  let loan: Loan = { balance: 0, payment: 0, remaining: 0 }
  let costBasis = 0
  let upfrontCash = 0
  let financed = 0
  const terms = financeTermsFor(s, a)

  if (s.kind === 'keep') {
    loan = { balance: car.loanBalance, payment: car.loanPayment, remaining: car.loanRemaining }
    costBasis = curSale
  } else {
    cash = curSale - car.loanBalance
    if (s.kind !== 'subscription') {
      // Preço de anúncio já é o preço pedido: não soma o ágio sobre a FIPE.
      const paid = s.kind === 'used' && s.priceSource !== 'anuncios' ? s.price * (1 + a.usedPremiumPct) : s.price
      costBasis = paid
      const available = Math.max(0, cash)
      let down = paid
      if (a.paymentMode === 'financiado') {
        down = Math.min(paid, Math.max(paid * terms.downPaymentPct, available))
      } else if (a.paymentMode === 'auto' && terms.rateMonth < rm) {
        // Juros abaixo do rendimento (ex.: taxa zero): vale financiar o máximo e manter o dinheiro aplicado.
        down = paid * terms.downPaymentPct
      } else if (a.paymentMode === 'auto' && available + a.savingsAvailable < paid) {
        down = Math.min(paid, Math.max(paid * terms.downPaymentPct, available + a.savingsAvailable))
      }
      financed = paid - down
      cash -= down
      upfrontCash = Math.max(0, -cash)
      loan = {
        balance: financed,
        payment: pmt(financed, terms.rateMonth, terms.months),
        remaining: financed > 0 ? terms.months : 0,
        rate: terms.rateMonth,
      }
    }
  }

  const hasAsset = s.kind !== 'subscription'
  const assetAt = (m: number) =>
    hasAsset ? projectValue(s.price, s.ageAtStart, s.depreciationFactor, m, s.fixedDepreciation) : 0

  // Valor de revenda: deságio de venda e, no carro atual, ajuste por quilometragem.
  const resaleAt = (m: number) => assetAt(m) * sale * (s.kind === 'keep' ? kmFactor : 1)

  // Consumo não informado (0) daria custo infinito: trata como 0 e o formulário avisa o usuário.
  const cpkRaw = energyCostPerKm(s.powertrain, s.consumption, a, s.evShare)
  const cpk = Number.isFinite(cpkRaw) ? cpkRaw : 0
  const sums = emptyBreakdown()
  const cumulative: number[] = [w0 - (cash + resaleAt(0) - loan.balance)]
  let insuranceMonthly = 0
  const snapshots: Partial<Record<number, Breakdown>> = {}

  for (let m = 0; m < SIM_MONTHS; m++) {
    const y = Math.floor(m / 12)
    const infl = Math.pow(1 + a.inflationYear, m / 12)
    const inflYear = Math.pow(1 + a.inflationYear, y)
    let out = 0

    if (hasAsset) {
      // Seguro: renovado a cada 12 meses sobre o valor do carro, pago mensalmente.
      if (m % 12 === 0) insuranceMonthly = (assetAt(m) * s.insuranceRate * inflYear) / 12
      sums.insurance += insuranceMonthly
      out += insuranceMonthly

      // IPVA e licenciamento vencem em janeiro. O ano corrente já está pago no carro atual e
      // no seminovo; o 0 km paga IPVA proporcional aos meses restantes do ano.
      const calendarMonth = (ctx.startMonth + m) % 12
      let taxes = 0
      if (calendarMonth === 0 && (m > 0 || s.kind === 'new')) {
        taxes = assetAt(m) * ipvaRateFor(s.powertrain, a) + a.licensingFee * infl
      } else if (m === 0 && s.kind === 'new') {
        taxes = (s.price * ipvaRateFor(s.powertrain, a) * (12 - ctx.startMonth)) / 12
      }
      sums.taxes += taxes
      out += taxes
    }

    const energy = kmMonth * cpk * infl
    sums.energy += energy
    out += energy

    if (hasAsset) {
      const maintenance =
        ((s.maintenanceBase * Math.pow(1 + a.maintenanceGrowth, s.ageAtStart + y)) / 12) * infl
      sums.maintenance += maintenance
      out += maintenance
    }

    if (s.kind === 'keep') {
      // Revisões programadas pela quilometragem: dispara quando o hodômetro passa por um múltiplo do intervalo.
      const rp = car.revisions
      if (rp && rp.intervalKm > 0 && rp.prices.length && kmMonth > 0) {
        const odoStart = (car.odometerKm || 0) + kmMonth * m
        const odoEnd = odoStart + kmMonth
        for (let k = Math.floor(odoStart / rp.intervalKm) + 1; k * rp.intervalKm <= odoEnd; k++) {
          const price = (rp.prices[(k - 1) % rp.prices.length] + rp.surcharge) * infl
          sums.maintenance += price
          out += price
        }
      }
      for (const pc of car.plannedCosts) {
        if (Math.max(1, Math.round(pc.month)) - 1 === m) {
          sums.maintenance += pc.amount
          out += pc.amount
        }
      }
    }

    if (s.plan) {
      const excess = Math.max(0, kmMonth - s.plan.kmFranchiseMonth) * s.plan.excessKmPrice
      const fee = (s.plan.monthlyFee + excess) * inflYear
      sums.subscription += fee
      out += fee
    }

    const { paid, interest } = stepLoan(loan)
    sums.interest += interest
    out += paid

    cash = (cash - out) * (1 + rmCost)
    const netWorth = cash + resaleAt(m + 1) - loan.balance
    const cost = w0 * Math.pow(1 + rmCost, m + 1) - netWorth
    cumulative.push(cost)

    const month = m + 1
    if (month % 12 === 0 && HORIZONS.includes((month / 12) as Horizon)) {
      const b: Breakdown = { ...sums }
      b.depreciation = hasAsset ? costBasis - resaleAt(month) : 0
      const accounted = COST_KEYS.filter((k) => k !== 'opportunity').reduce((t, k) => t + b[k], 0)
      b.opportunity = cost - accounted
      snapshots[month] = b
    }
  }

  const horizons = {} as Record<Horizon, HorizonResult>
  for (const h of HORIZONS) {
    const total = cumulative[h * 12]
    horizons[h] = {
      years: h,
      total,
      monthly: total / (h * 12),
      perKm: a.kmPerYear > 0 ? total / (a.kmPerYear * h) : 0,
      breakdown: snapshots[h * 12] ?? emptyBreakdown(),
      savingsVsKeep: 0,
      adjusted: total,
    }
  }

  return {
    scenario: s,
    cumulative,
    horizons,
    upfrontCash,
    financed,
    installment: loan.rate !== undefined ? pmt(financed, terms.rateMonth, terms.months) : 0,
    finance: terms,
  }
}

/** Primeiro mês a partir do qual a opção fica (e permanece) mais barata que manter. */
export function breakEven(option: number[], keep: number[]): number | null {
  const last = option.length - 1
  if (option[last] > keep[last]) return null
  let m = last
  while (m > 0 && option[m - 1] <= keep[m - 1]) m--
  return m
}

/** Próximas revisões do carro atual dentro de `months` meses, com mês e preço (sem inflação). */
export function revisionSchedule(car: CurrentCar, kmPerYear: number, months = 60) {
  const rp = car.revisions
  if (!rp || rp.intervalKm <= 0 || !rp.prices.length || kmPerYear <= 0) return []
  const kmMonth = kmPerYear / 12
  const odo = car.odometerKm || 0
  const list: { km: number; month: number; price: number }[] = []
  for (let k = Math.floor(odo / rp.intervalKm) + 1; ; k++) {
    const km = k * rp.intervalKm
    const month = Math.max(1, Math.ceil((km - odo) / kmMonth))
    if (month > months) break
    list.push({ km, month, price: rp.prices[(k - 1) % rp.prices.length] + rp.surcharge })
  }
  return list
}

export interface PriceEntry {
  price: number
  source: PriceSource
  reference?: string
}

export const priceKey = (modelId: string, age: number) => `${modelId}:${age}`

/**
 * Valores FIPE já verificados (fonte citada), usados até a consulta ao vivo.
 * Chave: "<modelo>@<ano-modelo>".
 */
export const KNOWN_FIPE: Record<string, PriceEntry> = {
  // Corolla Cross XRX 1.8 Híbrido 2022, código 002204-7 (tabelafipebrasil.com, set/2026).
  'toyota-corolla-cross-hybrid@2022': { price: 139427, source: 'fipe', reference: 'setembro de 2026' },
}

export function priceFor(
  model: CatalogModel,
  age: number,
  prices: Record<string, PriceEntry>,
  year?: number,
): PriceEntry {
  const known = year !== undefined ? KNOWN_FIPE[`${model.id}@${year - age}`] : undefined
  const hit = prices[priceKey(model.id, age)] ?? known
  if (hit && hit.price > 0) return hit
  // Seminovo sem FIPE ao vivo: usa a FIPE vista na pesquisa de mercado ou a mediana dos anúncios.
  const mkRaw = year !== undefined && age > 0 ? marketFor(model.id, year - age) : undefined
  const mk = mkRaw?.useForPrice === false ? undefined : mkRaw
  if (mk?.fipe?.price) return { price: mk.fipe.price, source: 'fipe', reference: mk.fipe.reference }
  if (mk?.summary && mk.summary.count >= 3) return { price: mk.summary.median, source: 'anuncios', reference: mk.listings[0]?.date }
  const newHit = prices[priceKey(model.id, 0)]
  const base = newHit && newHit.price > 0 ? newHit.price : model.refPriceNew
  if (age === 0 && !(newHit && newHit.price > 0) && model.priceRef) {
    return { price: base, source: 'pesquisa', reference: model.priceRef }
  }
  return {
    price: age === 0 ? base : estimateUsedPrice(base, age, model.depreciationFactor),
    source: 'estimado',
  }
}

export function carAge(car: CurrentCar, year: number): number {
  return Math.max(0, year - car.modelYear)
}

export function buildScenarios(opts: {
  car: CurrentCar
  assumptions: Assumptions
  usedAges: number[]
  prices: Record<string, PriceEntry>
  year: number
  catalog?: CatalogModel[]
  customCars?: CustomCar[]
}): Scenario[] {
  const { car, assumptions: a, usedAges, prices, year } = opts
  const catalog = opts.catalog ?? CATALOG
  const value = currentCarValue(car)
  const age = carAge(car, year)
  const list: Scenario[] = []

  list.push({
    id: 'keep',
    kind: 'keep',
    label: car.label || 'Meu carro atual',
    detail: `Manter · ${car.modelYear}`,
    category: car.category,
    powertrain: car.powertrain,
    consumption: car.consumption,
    price: value,
    priceSource: car.manualValue ? 'manual' : car.fipeValue ? 'fipe' : 'manual',
    fipeReference: car.fipeReference,
    ageAtStart: age,
    insuranceRate: value > 0 ? car.insuranceYear / value : 0,
    // A manutenção informada já é a do carro na idade atual.
    maintenanceBase: car.maintenanceYear / Math.pow(1 + a.maintenanceGrowth, age),
    depreciationFactor: 1,
    fixedDepreciation: car.depreciationYear,
  })

  for (const m of catalog) {
    const insuranceRate = m.insuranceRate * a.insuranceFactor
    for (const ageOpt of [0, ...usedAges.filter((age) => year - age >= (m.since ?? 0))]) {
      const p = priceFor(m, ageOpt, prices, year)
      const used = ageOpt > 0
      list.push({
        id: `${used ? 'used' : 'new'}:${m.id}:${ageOpt}`,
        kind: used ? 'used' : 'new',
        label: `${m.brand} ${m.model}`,
        brand: m.brand,
        detail: `${m.version} · ${used ? `${year - ageOpt} (seminovo)` : '0 km'}`,
        modelId: m.id,
        category: m.category,
        powertrain: m.powertrain,
        seats: m.seats,
        consumption:
          m.consumptionHistory?.find((h) => year - ageOpt <= h.untilModelYear)?.consumption ?? m.consumption,
        evShare: m.evShare,
        price: p.price,
        priceSource: p.source,
        fipeReference: p.reference,
        ageAtStart: ageOpt,
        insuranceRate,
        maintenanceBase: m.maintenanceBase,
        depreciationFactor: m.depreciationFactor,
      })
    }
  }

  for (const c of opts.customCars ?? []) {
    const ageOpt = Math.max(0, year - c.modelYear)
    list.push({
      id: `custom:${c.id}`,
      kind: ageOpt === 0 ? 'new' : 'used',
      label: `${c.brand} ${c.model}`,
      detail: `${c.version} · ${ageOpt === 0 ? '0 km' : `${c.modelYear} (seminovo)`} · adicionado por você`,
      brand: c.brand,
      category: c.category,
      powertrain: c.powertrain,
      seats: c.seats,
      consumption: c.consumption,
      price: c.price,
      priceSource: c.priceSource,
      fipeReference: c.fipeReference,
      ageAtStart: ageOpt,
      insuranceRate: INSURANCE_BY_CATEGORY[c.category] * a.insuranceFactor,
      maintenanceBase: MAINTENANCE_BY_CATEGORY[c.category],
      depreciationFactor: 1,
      custom: true,
    })
  }

  for (const plan of a.subscriptionPlans) {
    const rep = catalog.find((m) => m.id === SUBSCRIPTION_REPRESENTATIVE[plan.category])
    if (!rep) continue
    list.push({
      id: `sub:${plan.category}`,
      kind: 'subscription',
      label: `Assinatura · ${CATEGORY_LABEL[plan.category]}`,
      detail: `Ex.: ${rep.brand} ${rep.model} · ${plan.kmFranchiseMonth.toLocaleString('pt-BR')} km/mês`,
      modelId: rep.id,
      category: plan.category,
      powertrain: rep.powertrain,
      seats: rep.seats,
      consumption: rep.consumption,
      price: 0,
      priceSource: 'estimado',
      ageAtStart: 0,
      insuranceRate: 0,
      maintenanceBase: 0,
      depreciationFactor: 1,
      plan,
    })
  }

  return list
}

export function runAll(
  scenarios: Scenario[],
  ctx: SimContext,
  powertrainValue: Partial<Record<Powertrain, number>> = {},
): ScenarioResult[] {
  const raw = scenarios.map((s) => simulate(s, ctx))
  const keep = raw.find((r) => r.scenario.kind === 'keep')
  return raw.map((r) => {
    const horizons = { ...r.horizons }
    for (const h of HORIZONS) {
      horizons[h] = {
        ...horizons[h],
        savingsVsKeep: keep ? keep.horizons[h].total - horizons[h].total : 0,
        adjusted: horizons[h].total - (powertrainValue[r.scenario.powertrain] ?? 0) * h * 12,
      }
    }
    return {
      ...r,
      horizons,
      breakEvenMonth:
        keep && r.scenario.kind !== 'keep' ? breakEven(r.cumulative, keep.cumulative) : null,
    }
  })
}

export const describePowertrain = (p: Powertrain) => POWERTRAIN_LABEL[p]
