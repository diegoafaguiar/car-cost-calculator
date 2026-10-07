import { DEFAULT_SUBSCRIPTION_PLANS } from './catalog'
import type { Assumptions, CurrentCar, Preferences } from './types'

/** Perfil do Diego (out/2026). Valores marcados como estimativa devem ser conferidos. */
export const DEFAULT_CAR: CurrentCar = {
  label: 'Toyota Corolla Cross XRX Hybrid 1.8',
  // FIPE set/2026 (código 002204-7). O botão "Buscar na FIPE" atualiza para o mês corrente.
  fipeValue: 139427,
  fipeReference: 'setembro de 2026',
  modelYear: 2022,
  odometerKm: 89000,
  catalogModelId: 'toyota-corolla-cross-hybrid',
  category: 'suv-medio',
  powertrain: 'hibrido',
  // INMETRO: 17,7/14,6 km/l gasolina e 12,5/10,1 km/l etanol.
  consumption: { cityKmL: 17.7, roadKmL: 14.6, cityKmLEthanol: 12.5, roadKmLEthanol: 10.1 },
  insuranceYear: 450 * 12,
  // Estimativa: revisões Toyota + desgaste (pastilhas, fluidos) para ~90-100 mil km.
  maintenanceYear: 4200,
  // FIPE caiu de R$ 150.129 (ago/2025) para R$ 139.427 (set/2026): ~7% a.a.
  depreciationYear: 0.07,
  loanBalance: 0,
  loanPayment: 0,
  loanRemaining: 0,
  plannedCosts: [
    { id: 'pneus', label: 'Jogo de pneus 225/50 R18 (estimativa)', amount: 3800, month: 6 },
    { id: 'bateria12v', label: 'Bateria 12V (estimativa)', amount: 900, month: 12 },
  ],
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  kmPerYear: 12500,
  cityShare: 0.9,
  gasolinePrice: 6.29,
  ethanolPrice: 4.29,
  dieselPrice: 6.09,
  kwhPrice: 0.95,
  // Com recarga em casa e ~34 km/dia na cidade, a maior parte cabe na autonomia elétrica (57–126 km).
  phevElectricShare: 0.7,
  // Faixa informada pelo usuário: 8–10% a.a. líquido.
  investReturnYear: 0.09,
  inflationYear: 0.045,
  // Alíquotas do RJ em 2026.
  ipvaRate: 0.04,
  ipvaRateHybrid: 0.015,
  ipvaRateEV: 0.005,
  licensingFee: 210,
  // Taxa "boa" de mercado (CET); promoções de montadora podem ser menores.
  financeRateMonth: 0.0149,
  financeMonths: 48,
  downPaymentPct: 0.3,
  // Regras por montadora/modelo (ex.: taxa zero). Adicione em Premissas → Compra e financiamento.
  financeRules: [],
  paymentMode: 'auto',
  savingsAvailable: 20000,
  saleDiscountPct: 0.08,
  usedPremiumPct: 0.05,
  // Seguro atual (R$ 5.400 em R$ 139 mil = 3,9%) vs. média de SUV médio (3,6%).
  insuranceFactor: 1.1,
  mileageDiscountPer10k: 0.01,
  maintenanceGrowth: 0.08,
  subscriptionPlans: DEFAULT_SUBSCRIPTION_PLANS,
}

export const DEFAULT_PREFERENCES: Preferences = {
  rankHorizon: 3,
  categories: ['suv-compacto', 'suv-medio', 'suv-grande'],
  powertrains: ['flex', 'gasolina', 'diesel', 'hibrido', 'hibrido-plugin', 'eletrico'],
  kinds: ['keep', 'new', 'used', 'subscription'],
  usedAges: [2, 4],
  maxPrice: 0,
  maxMonthly: 0,
  minSeats: 0,
  // "Pequena inclinação" a híbridos: R$ 100/mês é um ponto de partida, ajuste ao seu gosto.
  powertrainValue: { hibrido: 100, 'hibrido-plugin': 100 },
  rankBy: 'ajustado',
  search: '',
  brands: [],
}
