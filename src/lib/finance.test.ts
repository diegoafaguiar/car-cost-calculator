import { describe, expect, it } from 'vitest'
import { DEFAULT_FINANCE_SIM, offerFor } from './finance'

const std = { rateMonth: 0.0149, months: 48 }

describe('simulador de financiamento', () => {
  it('entrada acima do mínimo: taxa zero no que falta, sem juros', () => {
    const o = offerFor(200000, 140000, DEFAULT_FINANCE_SIM, std, 0.09)
    expect(o.downPct).toBeCloseTo(0.7)
    expect(o.pending).toBe(60000)
    expect(o.zeroEligible).toBe(true)
    expect(o.zeroGap).toBe(0)
    const [z24, z36] = o.zeroPlans
    expect(z24.payment).toBeCloseTo(2500)
    expect(z36.payment).toBeCloseTo(60000 / 36)
    expect(z36.interest).toBeCloseTo(0)
    // Com o dinheiro rendendo 9% a.a., pagar em 36× sem juros custa menos hoje que à vista.
    expect(z36.presentCost).toBeLessThan(60000)
    expect(o.lowPlan.interest).toBeGreaterThan(0)
  })

  it('entrada abaixo do mínimo: mostra quanto falta e as parcelas com a entrada completada', () => {
    const o = offerFor(200000, 100000, DEFAULT_FINANCE_SIM, std, 0.09)
    expect(o.zeroEligible).toBe(false)
    expect(o.zeroGap).toBe(20000)
    expect(o.zeroFinanced).toBe(80000)
    expect(o.zeroPlans[0].payment).toBeCloseTo(80000 / 24)
    expect(o.stdPlan.financed).toBe(100000)
  })

  it('entrada maior que o preço: nada a financiar', () => {
    const o = offerFor(100000, 150000, DEFAULT_FINANCE_SIM, std, 0.09)
    expect(o.pending).toBe(0)
    expect(o.zeroPlans[0].payment).toBe(0)
  })
})
