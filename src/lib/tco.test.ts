import { describe, expect, it } from 'vitest'
import { DEFAULT_ASSUMPTIONS, DEFAULT_CAR } from './defaults'
import { matchesQuery, transmissionFromFipeName } from './fipe'
import { CATALOG } from './catalog'
import { parseBrl } from './format'
import {
  breakEven,
  breakEvenTradeIn,
  buildScenarios,
  energyCostPerKm,
  groupByModel,
  mileagePenalty,
  modelYearOf,
  pmt,
  projectValue,
  runAll,
  simulate,
  tradeInFor,
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
  revisions: null,
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

  it('sem custo de oportunidade, o componente fica zerado', () => {
    const ra = { ...a, investReturnYear: 0.1, includeOpportunity: false }
    const list = buildScenarios({ car, assumptions: ra, usedAges: [2], prices: {}, year: 2026 })
    for (const s of list.slice(0, 5)) {
      const r = simulate(s, { ...ctx, assumptions: ra })
      expect(Math.abs(r.horizons[3].breakdown.opportunity)).toBeLessThan(1)
    }
    const withOpp = simulate(list[0], { ...ctx, assumptions: { ...ra, includeOpportunity: true } })
    expect(withOpp.horizons[3].breakdown.opportunity).toBeGreaterThan(1000)
  })

  it('separa IPVA de híbrido convencional e plug-in', () => {
    const ra = { ...a, ipvaRateHybrid: 0.04, ipvaRatePHEV: 0.015 }
    const list = buildScenarios({ car, assumptions: ra, usedAges: [], prices: {}, year: 2026 })
    const jan = { ...ctx, assumptions: ra, startMonth: 0 }
    const hev = list.find((s) => s.id === 'new:toyota-corolla-hybrid:0')!
    const phev = list.find((s) => s.id === 'new:byd-king:0')!
    expect(simulate(hev, jan).horizons[1].breakdown.taxes).toBeCloseTo(hev.price * 0.04 + ra.licensingFee)
    expect(simulate(phev, jan).horizons[1].breakdown.taxes).toBeCloseTo(phev.price * 0.015 + ra.licensingFee)
  })

  it('inclui carros adicionados pelo usuário', () => {
    const custom = {
      id: 'x', brand: 'Kia', model: 'Niro', version: 'HEV', modelYear: 2024, category: 'suv-compacto' as const,
      powertrain: 'hibrido' as const, seats: 5, consumption: { cityKmL: 17, roadKmL: 15 }, price: 150000, priceSource: 'manual' as const,
    }
    const list = buildScenarios({ car, assumptions: a, usedAges: [], prices: {}, year: 2026, customCars: [custom] })
    const s = list.find((x) => x.id === 'custom:x')!
    expect(s.kind).toBe('used')
    expect(s.ageAtStart).toBe(2)
    expect(s.custom).toBe(true)
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

  it('usa a regra de financiamento da marca (taxa zero) só no 0 km', () => {
    const rules = [{ id: 'tz', brand: 'Toyota', appliesTo: 'new' as const, rateMonth: 0, months: 24, downPaymentPct: 0.6 }]
    const ra = { ...a, financeRules: rules, paymentMode: 'financiado' as const }
    const list = buildScenarios({ car, assumptions: ra, usedAges: [2], prices: {}, year: 2026 })
    const zero = simulate(list.find((s) => s.id === 'new:toyota-corolla:0')!, { ...ctx, assumptions: ra })
    expect(zero.finance.ruleId).toBe('tz')
    expect(zero.horizons[5].breakdown.interest).toBeCloseTo(0)
    expect(zero.installment).toBeCloseTo(zero.financed / 24)
    const used = simulate(list.find((s) => s.id === 'used:toyota-corolla:2')!, { ...ctx, assumptions: ra })
    expect(used.finance.ruleId).toBeUndefined()
  })

  it('preferência por motorização só afeta o custo ajustado', () => {
    const list = buildScenarios({ car, assumptions: a, usedAges: [], prices: {}, year: 2026 })
    const results = runAll(list, ctx, { hibrido: 100 })
    const hybrid = results.find((r) => r.scenario.id === 'new:toyota-corolla-hybrid:0')!
    expect(hybrid.horizons[3].adjusted).toBeCloseTo(hybrid.horizons[3].total - 3600)
    const flexCar = results.find((r) => r.scenario.id === 'new:fiat-mobi:0')!
    expect(flexCar.horizons[3].adjusted).toBe(flexCar.horizons[3].total)
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

describe('dados de mercado', () => {
  it('usa a FIPE vista na pesquisa de anúncios para o seminovo', () => {
    const list = buildScenarios({ car, assumptions: a, usedAges: [1], prices: {}, year: 2026 })
    const s = list.find((x) => x.id === 'used:byd-song-pro:1')!
    expect(s.priceSource).toBe('fipe')
    expect(s.price).toBe(161133)
  })

  it('ignora anúncios de versão diferente da do catálogo', () => {
    const list = buildScenarios({ car, assumptions: a, usedAges: [2], prices: {}, year: 2026 })
    expect(list.find((x) => x.id === 'used:fiat-pulse:2')!.priceSource).toBe('estimado')
  })
})

describe('revisões', () => {
  it('agenda as revisões pela quilometragem', async () => {
    const { revisionSchedule } = await import('./tco')
    const s = revisionSchedule(DEFAULT_CAR, 12000, 60)
    expect(s[0]).toEqual({ km: 90000, month: 1, price: 672 + 177.6 })
    expect(s[1]).toEqual({ km: 100000, month: 11, price: 1750 + 177.6 })
    expect(s.length).toBe(6) // 90 a 140 mil km em 60 meses (12 mil km/ano a partir de 89 mil)
  })

  it('soma as revisões na manutenção do carro atual', () => {
    const withRev = { ...DEFAULT_CAR, plannedCosts: [] }
    const noRev = { ...withRev, revisions: null }
    const aa = { ...a, kmPerYear: 12000 }
    const k1 = simulate(buildScenarios({ car: withRev, assumptions: aa, usedAges: [], prices: {}, year: 2026 })[0], { ...ctx, car: withRev, assumptions: aa })
    const k0 = simulate(buildScenarios({ car: noRev, assumptions: aa, usedAges: [], prices: {}, year: 2026 })[0], { ...ctx, car: noRev, assumptions: aa })
    expect(k1.horizons[1].breakdown.maintenance - k0.horizons[1].breakdown.maintenance).toBeCloseTo(672 + 177.6 + 1750 + 177.6)
  })
})

describe('notas', () => {
  it('segurança ignora NCAP antigo e usa só assistentes', async () => {
    const { safetyScore } = await import('./scores')
    const f = {
      id: 'x', version: '', researchedAt: '', tech: {} as never, comfort: {} as never,
      safety: { airbags6: true, aeb: true, laneKeep: false, blindSpot: false, rearCrossTraffic: null },
      ncap: { stars: 5, year: 2019, program: 'Latin NCAP' }, sources: [],
    }
    expect(safetyScore(f).value).toBe(4) // tem 2 de 5 itens (1 não confirmado conta como ausente)
    expect(safetyScore({ ...f, ncap: { ...f.ncap, year: 2023 } }).value).toBe(7.6) // 0,6×10 + 0,4×4
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

describe('anos-modelo', () => {
  it('modelYearOf: 0 km é o ano atual; seminovo desconta a idade; manter e assinatura não têm ano', () => {
    const list = buildScenarios({ car, assumptions: a, usedAges: [4], prices: {}, year: 2026 })
    expect(modelYearOf(list.find((s) => s.kind === 'new')!, 2026)).toBe(2026)
    expect(modelYearOf(list.find((s) => s.kind === 'used')!, 2026)).toBe(2022)
    expect(modelYearOf(list.find((s) => s.kind === 'keep')!, 2026)).toBeNull()
    const sub = list.find((s) => s.kind === 'subscription')
    if (sub) expect(modelYearOf(sub, 2026)).toBeNull()
  })

  it('groupByModel deixa uma linha por modelo, no melhor ano, com os demais anos agrupados', () => {
    const list = buildScenarios({ car, assumptions: a, usedAges: [1, 2, 3, 4], prices: {}, year: 2026 })
    const ranked = runAll(list, ctx).sort((x, y) => x.horizons[3].total - y.horizons[3].total)
    const rows = groupByModel(ranked)
    expect(rows.map((r) => r.rank)).toEqual(rows.map((_, i) => i + 1))
    // Nenhum modelo aparece em duas linhas, e nenhum cenário se perde.
    const heads = rows.filter((r) => r.result.scenario.modelId && r.result.scenario.kind !== 'subscription').map((r) => r.result.scenario.modelId)
    expect(new Set(heads).size).toBe(heads.length)
    expect(rows.reduce((n, r) => n + 1 + (r.others?.length ?? 0), 0)).toBe(ranked.length)
    // A linha principal é o melhor ano; os agrupados são do mesmo modelo e não mais baratos.
    for (const r of rows) {
      for (const o of r.others ?? []) {
        expect(o.scenario.modelId).toBe(r.result.scenario.modelId)
        expect(o.horizons[3].total).toBeGreaterThanOrEqual(r.result.horizons[3].total)
      }
    }
    expect(rows.some((r) => (r.others?.length ?? 0) > 0)).toBe(true)
  })
})

describe('troca do carro atual', () => {
  it('sem proposta, estima mercado − km − deságio; com proposta, usa o valor informado', () => {
    const t = tradeInFor(car, a, 2026)
    expect(t.manual).toBe(false)
    expect(t.auto).toBeCloseTo(62000 * (1 - a.saleDiscountPct))
    expect(t.value).toBe(t.auto)
    const m = tradeInFor({ ...car, tradeInValue: 50000 }, a, 2026)
    expect(m.manual).toBe(true)
    expect(m.value).toBe(50000)
    expect(m.auto).toBe(t.auto)
  })

  it('avaliação maior favorece a troca e não muda o custo de manter além do ponto de partida', () => {
    const list = buildScenarios({ car, assumptions: a, usedAges: [2], prices: {}, year: 2026 })
    const keepS = list.find((s) => s.kind === 'keep')!
    const alt = list.find((s) => s.kind === 'used')!
    const at = (v: number) => {
      const c = { ...ctx, car: { ...car, tradeInValue: v } }
      return simulate(alt, c).horizons[3].total - simulate(keepS, c).horizons[3].total
    }
    expect(at(60000)).toBeLessThan(at(50000))
  })

  it('troco: o que sobra do valor do carro fica com você e não entra como custo', () => {
    const rich = { ...car, tradeInValue: 200000 }
    const c = { ...ctx, car: rich, assumptions: { ...a, paymentMode: 'avista' as const } }
    const list = buildScenarios({ car: rich, assumptions: c.assumptions, usedAges: [2], prices: {}, year: 2026 })
    const cheap = list.filter((s) => s.kind === 'used').sort((x, y) => x.price - y.price)[0]
    const r = simulate(cheap, c)
    const paid = cheap.priceSource === 'anuncios' ? cheap.price : cheap.price * (1 + a.usedPremiumPct)
    expect(r.upfrontCash).toBe(0)
    expect(r.changeBack).toBeCloseTo(200000 - paid)
  })

  it('breakEvenTradeIn encontra a avaliação em que a troca empata com manter', () => {
    const list = buildScenarios({ car, assumptions: a, usedAges: [2], prices: {}, year: 2026 })
    const keepS = list.find((s) => s.kind === 'keep')!
    const alt = list.find((s) => s.kind === 'used')!
    const v = breakEvenTradeIn(alt, keepS, ctx, 3)
    if (v !== null && v > 0) {
      const cc = { ...ctx, car: { ...car, tradeInValue: v } }
      const gap = simulate(alt, cc).horizons[3].total - simulate(keepS, cc).horizons[3].total
      expect(Math.abs(gap)).toBeLessThan(200)
    }
  })
})

describe('câmbio', () => {
  it('todo modelo do catálogo tem câmbio', () => {
    expect(CATALOG.every((m) => m.transmission === 'manual' || m.transmission === 'automatico')).toBe(true)
  })
  it('lê o câmbio do nome FIPE', () => {
    expect(transmissionFromFipeName('ONIX SEDAN Plus LTZ 1.0 12V TB Flex Aut.')).toBe('automatico')
    expect(transmissionFromFipeName('ONIX HATCH LT 1.0 12V Flex 5p Mec.')).toBe('manual')
    expect(transmissionFromFipeName('COROLLA CROSS XRX 1.8 16V HYBRID')).toBeNull()
  })
})
