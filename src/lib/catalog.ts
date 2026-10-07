import type { CatalogModel, Category, Powertrain, SubscriptionPlan } from './types'

/**
 * Catálogo curado dos modelos mais vendidos no Brasil.
 * Preços são referência para quando a FIPE estiver indisponível; o app
 * substitui pelo valor FIPE ao consultar. Consumo: ciclo INMETRO (aproximado).
 */
type Seed = Omit<CatalogModel, 'insuranceRate' | 'maintenanceBase' | 'depreciationFactor'> &
  Partial<Pick<CatalogModel, 'insuranceRate' | 'maintenanceBase' | 'depreciationFactor'>>

const INSURANCE_BY_CATEGORY: Record<Category, number> = {
  'hatch-compacto': 0.045,
  hatch: 0.042,
  sedan: 0.04,
  'suv-compacto': 0.038,
  'suv-medio': 0.036,
  picape: 0.045,
}

const MAINTENANCE_BY_CATEGORY: Record<Category, number> = {
  'hatch-compacto': 1400,
  hatch: 1700,
  sedan: 2100,
  'suv-compacto': 2300,
  'suv-medio': 3000,
  picape: 2400,
}

const BRAND_DEPRECIATION: Record<string, number> = {
  Toyota: 0.8,
  Honda: 0.85,
  Hyundai: 0.95,
  Fiat: 1,
  Volkswagen: 1,
  Chevrolet: 1,
  Jeep: 1.1,
  Nissan: 1.1,
  Renault: 1.15,
  Peugeot: 1.15,
  'Citroën': 1.15,
  BYD: 1.3,
  GWM: 1.25,
}

const flex = (city: number, road: number, cityE: number, roadE: number) => ({
  cityKmL: city,
  roadKmL: road,
  cityKmLEthanol: cityE,
  roadKmLEthanol: roadE,
})

const seeds: Seed[] = [
  // Hatch compacto
  { id: 'fiat-mobi', brand: 'Fiat', model: 'Mobi', version: 'Like 1.0', category: 'hatch-compacto', powertrain: 'flex', seats: 5, trunkL: 235, refPriceNew: 78990, consumption: flex(13.5, 15.0, 9.6, 10.5), fipe: { brand: 'fiat', include: ['mobi', 'like'] } },
  { id: 'renault-kwid', brand: 'Renault', model: 'Kwid', version: 'Zen 1.0', category: 'hatch-compacto', powertrain: 'flex', seats: 5, trunkL: 290, refPriceNew: 74990, consumption: flex(15.3, 15.7, 10.8, 11.0), fipe: { brand: 'renault', include: ['kwid', 'zen'], exclude: ['e-tech'] } },
  { id: 'citroen-c3', brand: 'Citroën', model: 'C3', version: 'Live 1.0', category: 'hatch-compacto', powertrain: 'flex', seats: 5, trunkL: 315, refPriceNew: 79990, consumption: flex(13.4, 14.6, 9.3, 10.3), fipe: { brand: 'citroen', include: ['c3', 'live'], exclude: ['aircross'] } },
  { id: 'renault-kwid-etech', brand: 'Renault', model: 'Kwid E-Tech', version: 'Elétrico', category: 'hatch-compacto', powertrain: 'eletrico', seats: 4, trunkL: 290, refPriceNew: 99990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 9.0, roadKmKWh: 7.4 }, insuranceRate: 0.05, maintenanceBase: 800, fipe: { brand: 'renault', include: ['kwid', 'e-tech'] } },
  { id: 'byd-dolphin-mini', brand: 'BYD', model: 'Dolphin Mini', version: 'GS', category: 'hatch-compacto', powertrain: 'eletrico', seats: 5, trunkL: 230, refPriceNew: 119990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 7.8, roadKmKWh: 6.6 }, insuranceRate: 0.05, maintenanceBase: 900, fipe: { brand: 'byd', include: ['dolphin', 'mini'] } },

  // Hatch
  { id: 'fiat-argo', brand: 'Fiat', model: 'Argo', version: 'Drive 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 300, refPriceNew: 92990, consumption: flex(13.5, 15.0, 9.5, 10.5), fipe: { brand: 'fiat', include: ['argo', 'drive', '1.0'] } },
  { id: 'chevrolet-onix', brand: 'Chevrolet', model: 'Onix', version: 'LT 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 275, refPriceNew: 99990, consumption: flex(13.9, 17.1, 9.7, 11.9), fipe: { brand: 'chevrolet', include: ['onix', 'lt', '1.0'], exclude: ['plus', 'sedan', 'ltz', 'premier'] } },
  { id: 'hyundai-hb20', brand: 'Hyundai', model: 'HB20', version: 'Comfort 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 300, refPriceNew: 97990, consumption: flex(13.3, 15.5, 9.3, 10.8), fipe: { brand: 'hyundai', include: ['hb20', 'comfort', '1.0'], exclude: ['hb20s', 'tgdi'] } },
  { id: 'vw-polo-track', brand: 'Volkswagen', model: 'Polo', version: 'Track 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 300, refPriceNew: 92990, consumption: flex(13.4, 15.6, 9.3, 10.9), fipe: { brand: 'volkswagen', include: ['polo', 'track'] } },
  { id: 'peugeot-208', brand: 'Peugeot', model: '208', version: 'Active 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 311, refPriceNew: 94990, consumption: flex(13.6, 15.0, 9.5, 10.6), fipe: { brand: 'peugeot', include: ['208', 'active'], exclude: ['e-208', '2008'] } },
  { id: 'byd-dolphin', brand: 'BYD', model: 'Dolphin', version: 'GS', category: 'hatch', powertrain: 'eletrico', seats: 5, trunkL: 345, refPriceNew: 149990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 7.0, roadKmKWh: 6.0 }, insuranceRate: 0.05, maintenanceBase: 1000, fipe: { brand: 'byd', include: ['dolphin'], exclude: ['mini', 'plus'] } },

  // Sedan
  { id: 'chevrolet-onix-plus', brand: 'Chevrolet', model: 'Onix Plus', version: 'LT 1.0 Turbo Aut.', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 469, refPriceNew: 124990, consumption: flex(12.6, 16.3, 8.8, 11.4), fipe: { brand: 'chevrolet', include: ['onix', 'plus', 'lt'], exclude: ['ltz', 'premier'] } },
  { id: 'vw-virtus', brand: 'Volkswagen', model: 'Virtus', version: 'TSI 1.0 Aut.', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 521, refPriceNew: 129990, consumption: flex(12.4, 14.8, 8.6, 10.4), fipe: { brand: 'volkswagen', include: ['virtus', 'tsi'], exclude: ['gts', 'exclusive', 'highline'] } },
  { id: 'hyundai-hb20s', brand: 'Hyundai', model: 'HB20S', version: 'Comfort 1.0', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 475, refPriceNew: 109990, consumption: flex(13.0, 15.2, 9.1, 10.6), fipe: { brand: 'hyundai', include: ['hb20s', 'comfort'] } },
  { id: 'honda-city', brand: 'Honda', model: 'City Sedan', version: 'EXL 1.5 CVT', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 519, refPriceNew: 139990, consumption: flex(12.6, 15.4, 8.8, 10.7), fipe: { brand: 'honda', include: ['city', 'exl'], exclude: ['hatch'] } },
  { id: 'toyota-corolla', brand: 'Toyota', model: 'Corolla', version: 'XEi 2.0', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 470, refPriceNew: 182990, consumption: flex(11.0, 13.9, 7.6, 9.8), fipe: { brand: 'toyota', include: ['corolla', 'xei'], exclude: ['cross', 'hybrid'] } },
  { id: 'toyota-corolla-hybrid', brand: 'Toyota', model: 'Corolla', version: 'Altis Hybrid', category: 'sedan', powertrain: 'hibrido', seats: 5, trunkL: 470, refPriceNew: 204990, consumption: flex(17.3, 15.5, 12.1, 10.8), maintenanceBase: 2200, fipe: { brand: 'toyota', include: ['corolla', 'hybrid'], exclude: ['cross'] } },
  { id: 'byd-king', brand: 'BYD', model: 'King', version: 'GS (plug-in)', category: 'sedan', powertrain: 'hibrido-plugin', seats: 5, trunkL: 450, refPriceNew: 179990, consumption: { cityKmL: 18.0, roadKmL: 16.0, cityKmKWh: 6.3, roadKmKWh: 5.4 }, evShare: 0.6, insuranceRate: 0.048, maintenanceBase: 1600, fipe: { brand: 'byd', include: ['king'] } },

  // SUV compacto
  { id: 'fiat-pulse', brand: 'Fiat', model: 'Pulse', version: 'Drive 1.3', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 370, refPriceNew: 112990, consumption: flex(12.1, 13.6, 8.4, 9.5), fipe: { brand: 'fiat', include: ['pulse', 'drive'] } },
  { id: 'renault-kardian', brand: 'Renault', model: 'Kardian', version: 'Evolution 1.0T', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 410, refPriceNew: 116990, consumption: flex(11.8, 13.9, 8.2, 9.6), fipe: { brand: 'renault', include: ['kardian'] } },
  { id: 'vw-nivus', brand: 'Volkswagen', model: 'Nivus', version: 'Comfortline TSI', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 415, refPriceNew: 134990, consumption: flex(11.8, 14.0, 8.2, 9.8), fipe: { brand: 'volkswagen', include: ['nivus', 'comfortline'] } },
  { id: 'chevrolet-tracker', brand: 'Chevrolet', model: 'Tracker', version: 'LT 1.0 Turbo', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 393, refPriceNew: 139990, consumption: flex(11.5, 13.8, 8.0, 9.6), fipe: { brand: 'chevrolet', include: ['tracker', 'lt'], exclude: ['ltz', 'premier', 'rs'] } },
  { id: 'vw-tcross', brand: 'Volkswagen', model: 'T-Cross', version: '200 TSI', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 420, refPriceNew: 149990, consumption: flex(11.4, 13.3, 7.9, 9.3), fipe: { brand: 'volkswagen', include: ['t-cross', '200'] } },
  { id: 'hyundai-creta', brand: 'Hyundai', model: 'Creta', version: 'Comfort 1.0T', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 422, refPriceNew: 149990, consumption: flex(11.4, 13.4, 8.0, 9.3), fipe: { brand: 'hyundai', include: ['creta', 'comfort'] } },
  { id: 'nissan-kicks', brand: 'Nissan', model: 'Kicks', version: 'Advance 1.0T', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 470, refPriceNew: 159990, consumption: flex(12.0, 14.0, 8.4, 9.8), fipe: { brand: 'nissan', include: ['kicks', 'advance'], exclude: ['play'] } },
  { id: 'jeep-renegade', brand: 'Jeep', model: 'Renegade', version: 'Longitude 1.3T', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 320, refPriceNew: 145990, consumption: flex(10.6, 12.2, 7.2, 8.5), fipe: { brand: 'jeep', include: ['renegade', 'longitude'] } },
  { id: 'honda-hrv', brand: 'Honda', model: 'HR-V', version: 'EXL 1.5', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 354, refPriceNew: 169990, consumption: flex(11.6, 13.5, 8.1, 9.4), fipe: { brand: 'honda', include: ['hr-v', 'exl'] } },

  // SUV médio
  { id: 'toyota-corolla-cross', brand: 'Toyota', model: 'Corolla Cross', version: 'XRE 2.0', category: 'suv-medio', powertrain: 'flex', seats: 5, trunkL: 440, refPriceNew: 179990, consumption: flex(10.5, 12.6, 7.3, 8.8), fipe: { brand: 'toyota', include: ['corolla', 'cross', 'xre'] } },
  { id: 'toyota-corolla-cross-hybrid', brand: 'Toyota', model: 'Corolla Cross', version: 'XRX Hybrid', category: 'suv-medio', powertrain: 'hibrido', seats: 5, trunkL: 440, refPriceNew: 204990, consumption: flex(15.8, 14.7, 11.0, 10.3), maintenanceBase: 2600, fipe: { brand: 'toyota', include: ['corolla', 'cross', 'hybrid'] } },
  { id: 'jeep-compass', brand: 'Jeep', model: 'Compass', version: 'Longitude 1.3T', category: 'suv-medio', powertrain: 'flex', seats: 5, trunkL: 410, refPriceNew: 194990, consumption: flex(10.1, 11.9, 7.0, 8.3), fipe: { brand: 'jeep', include: ['compass', 'longitude'], exclude: ['diesel', '4x4', 'hybrid'] } },
  { id: 'byd-song-pro', brand: 'BYD', model: 'Song Pro', version: 'GS (plug-in)', category: 'suv-medio', powertrain: 'hibrido-plugin', seats: 5, trunkL: 520, refPriceNew: 189990, consumption: { cityKmL: 15.0, roadKmL: 14.0, cityKmKWh: 5.8, roadKmKWh: 5.0 }, evShare: 0.6, insuranceRate: 0.046, maintenanceBase: 1800, fipe: { brand: 'byd', include: ['song', 'pro'] } },
  { id: 'gwm-haval-h6', brand: 'GWM', model: 'Haval H6', version: 'HEV', category: 'suv-medio', powertrain: 'hibrido', seats: 5, trunkL: 560, refPriceNew: 229000, consumption: { cityKmL: 14.4, roadKmL: 13.1 }, insuranceRate: 0.042, maintenanceBase: 2600, fipe: { brand: 'gwm', include: ['h6', 'hev'], exclude: ['phev'] } },

  // Picape
  { id: 'fiat-strada', brand: 'Fiat', model: 'Strada', version: 'Volcano 1.3', category: 'picape', powertrain: 'flex', seats: 5, trunkL: 844, refPriceNew: 124990, consumption: flex(12.4, 13.5, 8.6, 9.4), fipe: { brand: 'fiat', include: ['strada', 'volcano'] } },
  { id: 'fiat-toro', brand: 'Fiat', model: 'Toro', version: 'Freedom 1.3T', category: 'picape', powertrain: 'flex', seats: 5, trunkL: 937, refPriceNew: 159990, consumption: flex(9.3, 11.1, 6.6, 7.7), fipe: { brand: 'fiat', include: ['toro', 'freedom'], exclude: ['diesel'] } },
]

export const CATALOG: CatalogModel[] = seeds.map((s) => ({
  ...s,
  insuranceRate: s.insuranceRate ?? INSURANCE_BY_CATEGORY[s.category],
  maintenanceBase: s.maintenanceBase ?? MAINTENANCE_BY_CATEGORY[s.category],
  depreciationFactor: s.depreciationFactor ?? BRAND_DEPRECIATION[s.brand] ?? 1,
}))

export const CATEGORY_LABEL: Record<Category, string> = {
  'hatch-compacto': 'Hatch compacto',
  hatch: 'Hatch',
  sedan: 'Sedã',
  'suv-compacto': 'SUV compacto',
  'suv-medio': 'SUV médio',
  picape: 'Picape',
}

export const POWERTRAIN_LABEL: Record<Powertrain, string> = {
  flex: 'Flex',
  gasolina: 'Gasolina',
  diesel: 'Diesel',
  hibrido: 'Híbrido',
  'hibrido-plugin': 'Híbrido plug-in',
  eletrico: 'Elétrico',
}

/** Mensalidades médias de assinatura (Localiza Meoo, Movida, Unidas etc.), plano 12–36 meses. */
export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { category: 'hatch-compacto', monthlyFee: 2190, kmFranchiseMonth: 1500, excessKmPrice: 0.6 },
  { category: 'hatch', monthlyFee: 2590, kmFranchiseMonth: 1500, excessKmPrice: 0.65 },
  { category: 'sedan', monthlyFee: 2990, kmFranchiseMonth: 1500, excessKmPrice: 0.7 },
  { category: 'suv-compacto', monthlyFee: 3490, kmFranchiseMonth: 1500, excessKmPrice: 0.8 },
  { category: 'suv-medio', monthlyFee: 4690, kmFranchiseMonth: 1500, excessKmPrice: 0.95 },
  { category: 'picape', monthlyFee: 3690, kmFranchiseMonth: 1500, excessKmPrice: 0.85 },
]

/** Modelo representativo usado para estimar o consumo de cada categoria de assinatura. */
export const SUBSCRIPTION_REPRESENTATIVE: Record<Category, string> = {
  'hatch-compacto': 'fiat-mobi',
  hatch: 'chevrolet-onix',
  sedan: 'vw-virtus',
  'suv-compacto': 'chevrolet-tracker',
  'suv-medio': 'jeep-compass',
  picape: 'fiat-strada',
}
