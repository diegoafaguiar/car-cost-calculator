import { DEFAULT_SUBSCRIPTION_PLANS } from './catalog'
import type { Assumptions, CurrentCar, Preferences } from './types'

export const DEFAULT_CAR: CurrentCar = {
  label: 'Hyundai HB20 1.0 (exemplo)',
  manualValue: 62000,
  modelYear: 2020,
  category: 'hatch',
  powertrain: 'flex',
  consumption: { cityKmL: 12.8, roadKmL: 14.9, cityKmLEthanol: 8.9, roadKmLEthanol: 10.4 },
  insuranceYear: 2800,
  maintenanceYear: 2600,
  depreciationYear: 0.07,
  loanBalance: 0,
  loanPayment: 0,
  loanRemaining: 0,
  plannedCosts: [
    { id: 'pneus', label: 'Jogo de pneus', amount: 2200, month: 6 },
    { id: 'embreagem', label: 'Kit de embreagem', amount: 1800, month: 18 },
  ],
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  kmPerYear: 12000,
  cityShare: 0.6,
  gasolinePrice: 6.29,
  ethanolPrice: 4.29,
  dieselPrice: 6.09,
  kwhPrice: 0.95,
  investReturnYear: 0.11,
  inflationYear: 0.045,
  ipvaRate: 0.04,
  ipvaRateHybrid: 0.04,
  ipvaRateEV: 0.04,
  licensingFee: 170,
  financeRateMonth: 0.0179,
  financeMonths: 48,
  downPaymentPct: 0.3,
  paymentMode: 'auto',
  savingsAvailable: 0,
  saleDiscountPct: 0.08,
  usedPremiumPct: 0.05,
  maintenanceGrowth: 0.08,
  subscriptionPlans: DEFAULT_SUBSCRIPTION_PLANS,
}

export const DEFAULT_PREFERENCES: Preferences = {
  rankHorizon: 3,
  categories: ['hatch-compacto', 'hatch', 'sedan', 'suv-compacto', 'suv-medio', 'picape'],
  powertrains: ['flex', 'gasolina', 'diesel', 'hibrido', 'hibrido-plugin', 'eletrico'],
  kinds: ['keep', 'new', 'used', 'subscription'],
  usedAges: [2, 4],
  maxPrice: 0,
  maxMonthly: 0,
  minSeats: 0,
  search: '',
}
