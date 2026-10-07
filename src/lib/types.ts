export type Powertrain = 'flex' | 'gasolina' | 'diesel' | 'hibrido' | 'hibrido-plugin' | 'eletrico'

export type Category =
  | 'hatch-compacto'
  | 'hatch'
  | 'sedan'
  | 'suv-compacto'
  | 'suv-medio'
  | 'suv-grande'
  | 'picape'

export type ScenarioKind = 'keep' | 'new' | 'used' | 'subscription'

export type PaymentMode = 'auto' | 'avista' | 'financiado'

export type Horizon = 1 | 3 | 5

export const HORIZONS: Horizon[] = [1, 3, 5]

/** Consumo em km/l (combustão) e km/kWh (elétrico), ciclo INMETRO. */
export interface Consumption {
  cityKmL: number
  roadKmL: number
  /** Consumo com etanol; se ausente em carro flex, assume 70% do consumo com gasolina. */
  cityKmLEthanol?: number
  roadKmLEthanol?: number
  cityKmKWh?: number
  roadKmKWh?: number
}

export interface FipeQuery {
  /** Trecho do nome da marca na FIPE (ex.: "chevrolet"). */
  brand: string
  /** Todos os termos devem aparecer no nome do modelo FIPE ("a|b" aceita qualquer um). */
  include: string[]
  /** Nenhum destes termos pode aparecer. */
  exclude?: string[]
}

export interface CatalogModel {
  id: string
  brand: string
  model: string
  version: string
  category: Category
  powertrain: Powertrain
  seats: number
  trunkL: number
  /** Preço de referência 0 km (R$), usado quando a FIPE não responde. */
  refPriceNew: number
  consumption: Consumption
  /** Seguro anual como fração do valor do carro. */
  insuranceRate: number
  /** Manutenção anual (revisões, pneus, freios) com o carro novo, em R$. */
  maintenanceBase: number
  /** Multiplicador da curva de depreciação (1 = média de mercado). */
  depreciationFactor: number
  /** Primeiro ano-modelo vendido no Brasil (seminovos anteriores não existem). */
  since?: number
  /** Fração rodada no modo elétrico (só híbridos plug-in). */
  evShare?: number
  fipe: FipeQuery
}

export interface FipeSelection {
  brandCode: string
  brandName: string
  modelCode: string
  modelName: string
  yearCode: string
  yearName: string
}

export interface PlannedCost {
  id: string
  label: string
  amount: number
  /** Mês (1 = próximo mês) em que o gasto deve ocorrer. */
  month: number
}

export interface CurrentCar {
  label: string
  fipe?: FipeSelection
  fipeValue?: number
  fipeReference?: string
  /** Valor informado manualmente; tem prioridade sobre a FIPE quando preenchido. */
  manualValue?: number
  modelYear: number
  /** Quilometragem atual (para ajustar o valor de revenda). */
  odometerKm: number
  category: Category
  powertrain: Powertrain
  consumption: Consumption
  insuranceYear: number
  maintenanceYear: number
  /** Depreciação anual esperada (fração). */
  depreciationYear: number
  loanBalance: number
  loanPayment: number
  loanRemaining: number
  plannedCosts: PlannedCost[]
}

export interface SubscriptionPlan {
  category: Category
  monthlyFee: number
  kmFranchiseMonth: number
  excessKmPrice: number
}

export interface Assumptions {
  kmPerYear: number
  /** Fração rodada na cidade (0..1). */
  cityShare: number
  gasolinePrice: number
  ethanolPrice: number
  dieselPrice: number
  kwhPrice: number
  /** Rendimento líquido anual do dinheiro parado (custo de oportunidade). */
  investReturnYear: number
  inflationYear: number
  ipvaRate: number
  ipvaRateHybrid: number
  ipvaRateEV: number
  licensingFee: number
  financeRateMonth: number
  financeMonths: number
  downPaymentPct: number
  paymentMode: PaymentMode
  /** Dinheiro disponível além do carro atual, usado para pagar à vista. */
  savingsAvailable: number
  /** Deságio ao vender um carro em relação à FIPE (troca em concessionária). */
  saleDiscountPct: number
  /** Ágio pago na compra de seminovo em relação à FIPE. */
  usedPremiumPct: number
  /** Multiplicador do seguro estimado (região, perfil, bônus). 1 = média nacional. */
  insuranceFactor: number
  /** Desconto no valor do carro atual a cada 10 mil km acima da média de 12 mil km/ano. */
  mileageDiscountPer10k: number
  /** Crescimento anual da manutenção com a idade do carro. */
  maintenanceGrowth: number
  subscriptionPlans: SubscriptionPlan[]
}

export interface Preferences {
  rankHorizon: Horizon
  categories: Category[]
  powertrains: Powertrain[]
  kinds: ScenarioKind[]
  /** Idades (anos) dos seminovos simulados. */
  usedAges: number[]
  maxPrice: number
  maxMonthly: number
  minSeats: number
  search: string
}

export type PriceSource = 'fipe' | 'estimado' | 'manual'

export interface Scenario {
  id: string
  kind: ScenarioKind
  label: string
  detail: string
  modelId?: string
  category: Category
  powertrain: Powertrain
  seats?: number
  consumption: Consumption
  evShare?: number
  /** Preço de compra (0 para manter e assinatura). Para "manter", valor de mercado atual. */
  price: number
  priceSource: PriceSource
  fipeReference?: string
  ageAtStart: number
  insuranceRate: number
  maintenanceBase: number
  depreciationFactor: number
  /** Depreciação anual fixa (sobrepõe a curva padrão, usado no carro atual). */
  fixedDepreciation?: number
  plan?: SubscriptionPlan
}

export type CostKey =
  | 'depreciation'
  | 'energy'
  | 'insurance'
  | 'taxes'
  | 'maintenance'
  | 'interest'
  | 'subscription'
  | 'opportunity'

export type Breakdown = Record<CostKey, number>

export interface HorizonResult {
  years: Horizon
  total: number
  monthly: number
  perKm: number
  breakdown: Breakdown
  /** Diferença para manter o carro atual (positivo = economia). */
  savingsVsKeep: number
}

export interface ScenarioResult {
  scenario: Scenario
  /** Custo acumulado mês a mês (índice 0 = início, 60 = fim do 5º ano). */
  cumulative: number[]
  horizons: Record<Horizon, HorizonResult>
  upfrontCash: number
  financed: number
  installment: number
  /** Mês a partir do qual a opção passa a ser mais barata que manter (até 60). */
  breakEvenMonth: number | null
}
