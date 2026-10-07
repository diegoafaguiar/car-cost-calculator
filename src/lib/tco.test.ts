import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSUMPTIONS, DEFAULT_CAR } from './defaults'
import { matchesQuery } from './fipe'
import { parseBrl } from './format'
import {
  breakEven,
  buildScenarios,
  energyCostPerKm,
  mileagePenalty,
  pmt,
  projectValue,
  runAll,
  simulate,
} from './tco'
import type { Assumptions, CurrentCar } from './types'

const a: Assumptions = { ...DEFAULT_ASSUMPTIONS, inflationYear: 0, investReturnYear: 0 }
const car: CurrentCar = {
  ...DEFAULT_CAR,
  fipeValue: 62000,
  modelYear: 2020,
  odometerKm: 0,
  category: 'hatch',
  powertrain: 'flex',
  insuranceYear: 2800,
  maintenanceYear: 2600,
  depreciationYear: 0.07,
  plannedCosts: [],
}
const ctx = { assumptions: a, car, startMonth: 0, year: 2026 }

describe('energyCostPerKm', () => {
  it('escolhe etanol quando compensa no flex', () => {
    const c = { cityKmL: 10, roadKmL: 10, cityKmLEthanol: 8, roadKmLEthanol: 8 }
    const cpk = energyCostPerKm('flex', c, { ...a, gasolinePrice: 6, ethanolPrice: 4 })
    expect(cpk).toBeCloseTo(0.5) // 4/8 < 6/10
  })

  it('calcula elétrico por kWh', () => {
    const c = { cityKmL: 0, roadKmL: 0, cityKmKWh: 8, roadKmKWh: 8 }
    expect(energyCostPerKm('eletrico', c, { ...a, kwhPrice: 0.8 })).toBeCloseTo(0.1)
  })
})

describe('financeiro', () => {
  it('pmt bate com a tabela Price', () => {
    expect(pmt(10000, 0.01, 12)).toBeCloseTo(888.49, 1)
  })

  it('projeta depreciação fixa', () => {
    expect(projectValue(100, 5, 1, 24, 0.1)).toBeCloseTo(81)
  })

  it('breakEven encontra o mês em que a opção fica mais barata para sempre', () => {
    expect(breakEven([10, 9, 5, 3], [0, 4, 6, 8])).toBe(2)
    expect(breakEven([10, 9, 9], [0, 4, 6])).toBeNull()
  })
})

describe('simulate', () => {
  it('manter sem juros nem inflação soma custos + depreciação', () => {
    const [keep] = buildScenarios({ car, assumptions: a, usedAges: [], prices: {}, year: 2026 })
    const r = simulate(keep, ctx)
    const b = r.horizons[1].breakdown
    expect(r.cumulative[0]).toBeCloseTo(0)
    expect(b.opportunity).toBeCloseTo(0, 4)
    const value = 62000
    expect(b.taxes).toBe(0) // IPVA do ano corrente já pago
    const sale = 1 - a.saleDiscountPct
    expect(b.depreciation).toBeCloseTo(value * 0.07 * sale, 4)
    expect(b.insurance).toBeCloseTo(2800, 4)
    expect(b.maintenance).toBeCloseTo(2600, 4)
    expect(r.horizons[1].total).toBeCloseTo(
      b.depreciation + b.energy + b.insurance + b.taxes + b.maintenance,
      4,
    )
  })

  it('cobra IPVA em janeiro e proporcional no 0 km', () => {
    const list = buildScenarios({ car, assumptions: a, usedAges: [2], prices: {}, year: 2026 })
    const october = { ...ctx, startMonth: 9 }
    const keep = simulate(list[0], october)
    expect(keep.horizons[1].breakdown.taxes).toBeCloseTo(
      projectValue(62000, 6, 1, 3, 0.07) * a.ipvaRate + a.licensingFee,
    )
    const zero = list.find((s) => s.id === 'new:fiat-mobi:0')!
    const r = simulate(zero, october)
    const proportional = (zero.price * a.ipvaRate * 3) / 12
    expect(r.horizons[1].breakdown.taxes).toBeCloseTo(
      proportional + projectValue(zero.price, 0, zero.depreciationFactor, 3) * a.ipvaRate + a.licensingFee,
    )
  })

  it('aplica desconto por quilometragem alta no carro atual', () => {
    const high = { ...car, odometerKm: 6 * 12000 + 30000 }
    expect(mileagePenalty(high, a, 2026)).toBeCloseTo(0.03)
    const [keep] = buildScenarios({ car: high, assumptions: a, usedAges: [], prices: {}, year: 2026 })
    const r = simulate(keep, { ...ctx, car: high })
    expect(r.cumulative[0]).toBeCloseTo(0)
  })

  it('assinatura não tem ativo e o carro atual vira caixa', () => {
    const list = buildScenarios({ car, assumptions: a, usedAges: [], prices: {}, year: 2026 })
    const sub = list.find((s) => s.kind === 'subscription')!
    const r = simulate(sub, ctx)
    expect(r.horizons[1].breakdown.depreciation).toBe(0)
    expect(r.horizons[1].breakdown.subscription).toBeCloseTo(sub.plan!.monthlyFee * 12)
  })

  it('financia quando não há dinheiro suficiente no modo auto', () => {
    const list = buildScenarios({ car, assumptions: a, usedAges: [], prices: {}, year: 2026 })
    const corolla = list.find((s) => s.id === 'new:toyota-corolla:0')!
    const r = simulate(corolla, { ...ctx, assumptions: { ...a, investReturnYear: 0.1 } })
    expect(r.financed).toBeGreaterThan(0)
    expect(r.installment).toBeGreaterThan(0)
    expect(r.horizons[5].breakdown.interest).toBeGreaterThan(0)
  })

  it('runAll calcula economia em relação a manter', () => {
    const list = buildScenarios({ car, assumptions: a, usedAges: [2], prices: {}, year: 2026 })
    const results = runAll(list, ctx)
    const keep = results.find((r) => r.scenario.kind === 'keep')!
    expect(keep.horizons[3].savingsVsKeep).toBe(0)
    const other = results[1]
    expect(other.horizons[3].savingsVsKeep).toBeCloseTo(
      keep.horizons[3].total - other.horizons[3].total,
    )
  })
})

describe('fipe helpers', () => {
  it('casa nomes por palavra inteira', () => {
    const q = { brand: 'chevrolet', include: ['onix', 'lt', '1.0'], exclude: ['plus', 'ltz'] }
    expect(matchesQuery('ONIX HATCH LT 1.0 12V Flex 5p Mec.', q)).toBe(true)
    expect(matchesQuery('ONIX HATCH LTZ 1.0 12V Flex 5p Mec.', q)).toBe(false)
    expect(matchesQuery('ONIX SEDAN Plus LT 1.0 12V TB Flex Aut.', q)).toBe(false)
  })

  it('converte preço FIPE', () => {
    expect(parseBrl('R$ 123.456,78')).toBeCloseTo(123456.78)
  })
})
