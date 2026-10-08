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
  // R$ 4.200/ano informados pelo usuário (manutenção + lavagens), dos quais ~R$ 1.650/ano são revisões
  // (média das 7 revisões previstas de 90 a 150 mil km). O restante fica aqui; as revisões vão no plano abaixo.
  maintenanceYear: 2550,
  // Preço fixo Toyota Corolla Cross 10–100 mil km (válido até set/2025) + R$ 177,60 por revisão na versão híbrida.
  // Após 100 mil km, o ciclo é repetido (estimativa: a Toyota não publica preços acima de 100 mil km).
  revisions: {
    intervalKm: 10000,
    prices: [543, 1062, 765, 1452, 753, 1359, 681, 1314, 672, 1750],
    surcharge: 177.6,
    reference: 'Tabela de revisões com preço fixo Toyota, válida até set/2025',
    // Informado na conversa: a última revisão (80 mil km) custou "quase 5×" os R$ 850 da tabela da próxima.
    // Valor aproximado — troque pelo da nota fiscal.
    actual: { km: 80000, price: 4000, mode: 'fator', note: 'valor aproximado informado por você; use o da nota fiscal' },
  },
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
  includeOpportunity: true,
  // Faixa informada pelo usuário: 8–10% a.a. líquido.
  investReturnYear: 0.09,
  inflationYear: 0.045,
  // RJ 2026. O usuário pagou 4% no Corolla Cross Hybrid (HEV); a redução para 1,5% valeu só para o plug-in.
  // Há fonte dizendo 1,5% para qualquer híbrido no RJ — confira o seu carnê.
  ipvaRate: 0.04,
  ipvaRateHybrid: 0.04,
  ipvaRatePHEV: 0.015,
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
  // 1 a 4 anos: inclui os BYD lançados entre 2023 e 2025.
  usedAges: [1, 2, 3, 4],
  maxPrice: 0,
  maxMonthly: 0,
  minSeats: 0,
  minPrice: 0,
  transmissions: ['manual', 'automatico'],
  // Preferência do usuário: nada abaixo do ano-modelo 2022.
  minModelYear: 2022,
  maxModelYear: 0,
  groupByModel: false,
  // "Pequena inclinação" a híbridos: R$ 100/mês é um ponto de partida, ajuste ao seu gosto.
  powertrainValue: { hibrido: 100, 'hibrido-plugin': 100 },
  rankBy: 'ajustado',
  search: '',
  brands: [],
}
