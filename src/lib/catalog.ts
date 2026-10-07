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
  'suv-grande': 0.035,
  picape: 0.045,
}

const MAINTENANCE_BY_CATEGORY: Record<Category, number> = {
  'hatch-compacto': 1400,
  hatch: 1700,
  sedan: 2100,
  'suv-compacto': 2300,
  'suv-medio': 3000,
  'suv-grande': 3600,
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
  { id: 'citroen-c3', since: 2023, brand: 'Citroën', model: 'C3', version: 'Live 1.0', category: 'hatch-compacto', powertrain: 'flex', seats: 5, trunkL: 315, refPriceNew: 79990, consumption: flex(13.4, 14.6, 9.3, 10.3), fipe: { brand: 'citroen', include: ['c3', 'live'], exclude: ['aircross'] } },
  { id: 'renault-kwid-etech', since: 2022, brand: 'Renault', model: 'Kwid E-Tech', version: 'Elétrico', category: 'hatch-compacto', powertrain: 'eletrico', seats: 4, trunkL: 290, refPriceNew: 99990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 9.0, roadKmKWh: 7.4 }, insuranceRate: 0.05, maintenanceBase: 800, fipe: { brand: 'renault', include: ['kwid', 'e-tech'] } },
  { id: 'byd-dolphin-mini', since: 2024, brand: 'BYD', model: 'Dolphin Mini', version: 'GS', category: 'hatch-compacto', powertrain: 'eletrico', seats: 5, trunkL: 230, refPriceNew: 119990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 7.8, roadKmKWh: 6.6 }, insuranceRate: 0.05, maintenanceBase: 900, fipe: { brand: 'byd', include: ['dolphin', 'mini'] } },

  // Hatch
  { id: 'fiat-argo', brand: 'Fiat', model: 'Argo', version: 'Drive 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 300, refPriceNew: 92990, consumption: flex(13.5, 15.0, 9.5, 10.5), fipe: { brand: 'fiat', include: ['argo', 'drive', '1.0'] } },
  { id: 'chevrolet-onix', brand: 'Chevrolet', model: 'Onix', version: 'LT 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 275, refPriceNew: 99990, consumption: flex(13.9, 17.1, 9.7, 11.9), fipe: { brand: 'chevrolet', include: ['onix', 'lt', '1.0'], exclude: ['plus', 'sedan', 'ltz', 'premier'] } },
  { id: 'hyundai-hb20', brand: 'Hyundai', model: 'HB20', version: 'Comfort 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 300, refPriceNew: 97990, consumption: flex(13.3, 15.5, 9.3, 10.8), fipe: { brand: 'hyundai', include: ['hb20', 'comfort', '1.0'], exclude: ['hb20s', 'tgdi'] } },
  { id: 'vw-polo-track', since: 2023, brand: 'Volkswagen', model: 'Polo', version: 'Track 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 300, refPriceNew: 92990, consumption: flex(13.4, 15.6, 9.3, 10.9), fipe: { brand: 'volkswagen', include: ['polo', 'track'] } },
  { id: 'peugeot-208', brand: 'Peugeot', model: '208', version: 'Active 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 311, refPriceNew: 94990, consumption: flex(13.6, 15.0, 9.5, 10.6), fipe: { brand: 'peugeot', include: ['208', 'active'], exclude: ['e-208', '2008'] } },
  { id: 'byd-dolphin', since: 2023, brand: 'BYD', model: 'Dolphin', version: 'GS', category: 'hatch', powertrain: 'eletrico', seats: 5, trunkL: 345, refPriceNew: 149990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 7.0, roadKmKWh: 6.0 }, insuranceRate: 0.05, maintenanceBase: 1000, fipe: { brand: 'byd', include: ['dolphin'], exclude: ['mini', 'plus'] } },

  // Sedan
  { id: 'chevrolet-onix-plus', brand: 'Chevrolet', model: 'Onix Plus', version: 'LT 1.0 Turbo Aut.', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 469, refPriceNew: 124990, consumption: flex(12.6, 16.3, 8.8, 11.4), fipe: { brand: 'chevrolet', include: ['onix', 'plus', 'lt'], exclude: ['ltz', 'premier'] } },
  { id: 'vw-virtus', brand: 'Volkswagen', model: 'Virtus', version: 'TSI 1.0 Aut.', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 521, refPriceNew: 129990, consumption: flex(12.4, 14.8, 8.6, 10.4), fipe: { brand: 'volkswagen', include: ['virtus', 'tsi'], exclude: ['gts', 'exclusive', 'highline'] } },
  { id: 'hyundai-hb20s', brand: 'Hyundai', model: 'HB20S', version: 'Comfort 1.0', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 475, refPriceNew: 109990, consumption: flex(13.0, 15.2, 9.1, 10.6), fipe: { brand: 'hyundai', include: ['hb20s', 'comfort'] } },
  { id: 'honda-city', brand: 'Honda', model: 'City Sedan', version: 'EXL 1.5 CVT', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 519, refPriceNew: 139990, consumption: flex(12.6, 15.4, 8.8, 10.7), fipe: { brand: 'honda', include: ['city', 'exl'], exclude: ['hatch'] } },
  { id: 'toyota-corolla', brand: 'Toyota', model: 'Corolla', version: 'XEi 2.0', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 470, refPriceNew: 182990, consumption: flex(11.0, 13.9, 7.6, 9.8), fipe: { brand: 'toyota', include: ['corolla', 'xei'], exclude: ['cross', 'hybrid|hibrido'] } },
  { id: 'toyota-corolla-hybrid', brand: 'Toyota', model: 'Corolla', version: 'Altis Hybrid', category: 'sedan', powertrain: 'hibrido', seats: 5, trunkL: 470, refPriceNew: 204990, consumption: flex(17.3, 15.5, 12.1, 10.8), maintenanceBase: 2200, fipe: { brand: 'toyota', include: ['corolla', 'hybrid|hibrido'], exclude: ['cross'] } },
  { id: 'byd-king', since: 2025, brand: 'BYD', model: 'King', version: 'GS (plug-in)', category: 'sedan', powertrain: 'hibrido-plugin', seats: 5, trunkL: 450, refPriceNew: 179990, consumption: { cityKmL: 18.0, roadKmL: 16.0, cityKmKWh: 6.3, roadKmKWh: 5.4 }, evShare: 0.6, insuranceRate: 0.048, maintenanceBase: 1600, fipe: { brand: 'byd', include: ['king'] } },

  // SUV compacto
  { id: 'fiat-pulse', since: 2022, brand: 'Fiat', model: 'Pulse', version: 'Drive 1.3 CVT', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 370, refPriceNew: 116990, consumption: flex(12.9, 14.3, 9.2, 10.4), fipe: { brand: 'fiat', include: ['pulse', 'drive'] } },
  { id: 'renault-kardian', since: 2025, brand: 'Renault', model: 'Kardian', version: 'Evolution 1.0T', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 410, refPriceNew: 116990, consumption: flex(11.8, 13.9, 8.2, 9.6), fipe: { brand: 'renault', include: ['kardian'] } },
  { id: 'vw-nivus', since: 2021, brand: 'Volkswagen', model: 'Nivus', version: 'Comfortline 200 TSI', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 415, refPriceNew: 158290, consumption: flex(12.4, 14.8, 8.6, 10.3), consumptionHistory: [{ untilModelYear: 2022, consumption: flex(10.7, 13.2, 7.7, 9.4) }], fipe: { brand: 'volkswagen', include: ['nivus', 'comfortline'] } },
  { id: 'chevrolet-tracker', brand: 'Chevrolet', model: 'Tracker', version: 'LT 1.0 Turbo', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 393, refPriceNew: 146990, consumption: flex(11.5, 13.8, 8.1, 9.9), fipe: { brand: 'chevrolet', include: ['tracker', 'lt'], exclude: ['ltz', 'premier', 'rs'] } },
  { id: 'vw-tcross', brand: 'Volkswagen', model: 'T-Cross', version: '200 TSI', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 373, refPriceNew: 152890, consumption: flex(11.9, 14.1, 8.1, 9.8), fipe: { brand: 'volkswagen', include: ['t-cross', '200'] } },
  { id: 'hyundai-creta', since: 2022, brand: 'Hyundai', model: 'Creta', version: 'Comfort 1.0 TGDi', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 422, refPriceNew: 156590, consumption: flex(12.0, 12.7, 8.4, 9.0), fipe: { brand: 'hyundai', include: ['creta', 'comfort'] } },
  { id: 'nissan-kicks', since: 2026, brand: 'Nissan', model: 'Kicks', version: 'Advance 1.0T', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 470, refPriceNew: 169990, consumption: flex(11.7, 14.3, 8.3, 9.9), fipe: { brand: 'nissan', include: ['kicks', 'advance'], exclude: ['play'] } },
  { id: 'jeep-renegade', brand: 'Jeep', model: 'Renegade', version: 'Longitude MHEV', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 320, refPriceNew: 158690, consumption: flex(11.9, 11.8, 8.3, 8.6), consumptionHistory: [{ untilModelYear: 2026, consumption: flex(11.0, 12.8, 7.7, 9.1) }], fipe: { brand: 'jeep', include: ['renegade', 'longitude'] } },
  { id: 'honda-hrv', since: 2023, brand: 'Honda', model: 'HR-V', version: 'EXL 1.5', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 354, refPriceNew: 174300, consumption: flex(12.5, 13.9, 8.8, 9.9), fipe: { brand: 'honda', include: ['hr-v', 'exl'] } },
  { id: 'toyota-yaris-cross-hybrid', since: 2026, brand: 'Toyota', model: 'Yaris Cross', version: 'XRX Hybrid', category: 'suv-compacto', powertrain: 'hibrido', seats: 5, trunkL: 391, refPriceNew: 189990, consumption: flex(17.9, 15.3, 13.2, 10.7), maintenanceBase: 2100, fipe: { brand: 'toyota', include: ['yaris', 'cross', 'hybrid|hibrido'] } },
  { id: 'byd-yuan-pro', since: 2025, brand: 'BYD', model: 'Yuan Pro', version: 'GS', category: 'suv-compacto', powertrain: 'eletrico', seats: 5, trunkL: 265, refPriceNew: 182990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 7.06, roadKmKWh: 7.06 }, insuranceRate: 0.048, maintenanceBase: 1000, fipe: { brand: 'byd', include: ['yuan', 'pro'] } },

  // SUV médio
  { id: 'toyota-corolla-cross', since: 2022, brand: 'Toyota', model: 'Corolla Cross', version: 'XRE 2.0', category: 'suv-medio', powertrain: 'flex', seats: 5, trunkL: 440, refPriceNew: 179990, consumption: flex(10.5, 12.6, 7.3, 8.8), fipe: { brand: 'toyota', include: ['corolla', 'cross', 'xre'] } },
  { id: 'toyota-corolla-cross-hybrid', since: 2022, brand: 'Toyota', model: 'Corolla Cross', version: 'XRX Hybrid Premium', category: 'suv-medio', powertrain: 'hibrido', seats: 5, trunkL: 440, refPriceNew: 223790, consumption: flex(17.8, 14.7, 11.8, 9.7), maintenanceBase: 2600, fipe: { brand: 'toyota', include: ['corolla', 'cross', 'xrx', 'hybrid|hibrido'] } },
  { id: 'toyota-corolla-cross-xrv-hybrid', infoId: 'toyota-corolla-cross-hybrid', since: 2027, brand: 'Toyota', model: 'Corolla Cross', version: 'XRV Hybrid', category: 'suv-medio', powertrain: 'hibrido', seats: 5, trunkL: 440, refPriceNew: 213990, consumption: flex(17.8, 14.7, 11.8, 9.7), maintenanceBase: 2600, fipe: { brand: 'toyota', include: ['corolla', 'cross', 'xrv', 'hybrid|hibrido'] } },
  { id: 'vw-taos', since: 2021, brand: 'Volkswagen', model: 'Taos', version: 'Highline 250 TSI', category: 'suv-medio', powertrain: 'flex', seats: 5, trunkL: 498, refPriceNew: 209990, consumption: flex(9.9, 12.1, 6.9, 8.4), fipe: { brand: 'volkswagen', include: ['taos', 'highline'] } },
  { id: 'honda-zrv', since: 2023, brand: 'Honda', model: 'ZR-V', version: 'Touring 2.0', category: 'suv-medio', powertrain: 'gasolina', seats: 5, trunkL: 380, refPriceNew: 214900, consumption: { cityKmL: 10.6, roadKmL: 12.9 }, fipe: { brand: 'honda', include: ['zr-v'] } },
  { id: 'byd-yuan-plus', since: 2023, brand: 'BYD', model: 'Yuan Plus', version: 'EV', category: 'suv-medio', powertrain: 'eletrico', seats: 5, trunkL: 490, refPriceNew: 269990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 6.21, roadKmKWh: 6.21 }, insuranceRate: 0.048, maintenanceBase: 1100, fipe: { brand: 'byd', include: ['yuan', 'plus'] } },
  { id: 'jeep-compass', brand: 'Jeep', model: 'Compass', version: 'Longitude T270', category: 'suv-medio', powertrain: 'flex', seats: 5, trunkL: 410, refPriceNew: 199890, consumption: flex(10.1, 12.1, 7.3, 8.6), fipe: { brand: 'jeep', include: ['compass', 'longitude'], exclude: ['diesel', '4x4', 'hybrid'] } },
  { id: 'byd-song-pro', since: 2025, brand: 'BYD', model: 'Song Pro', version: 'GS (plug-in)', category: 'suv-medio', powertrain: 'hibrido-plugin', seats: 5, trunkL: 530, refPriceNew: 199990, consumption: { cityKmL: 15.9, roadKmL: 13.5, cityKmLEthanol: 11.7, roadKmLEthanol: 10.5, cityKmKWh: 3.9, roadKmKWh: 3.9 }, evShare: 0.6, insuranceRate: 0.046, maintenanceBase: 1800, estimated: ['consumo elétrico (3,9 km/kWh = 72 km de autonomia ÷ 18,3 kWh; o PBEV só publica valor combinado)', 'fração rodada no modo elétrico (60%)'], fipe: { brand: 'byd', include: ['song', 'pro'] } },
  { id: 'gwm-haval-h6', since: 2023, brand: 'GWM', model: 'Haval H6', version: 'HEV', category: 'suv-medio', powertrain: 'hibrido', seats: 5, trunkL: 560, refPriceNew: 229000, consumption: { cityKmL: 14.4, roadKmL: 13.1 }, insuranceRate: 0.042, maintenanceBase: 2600, fipe: { brand: 'gwm', include: ['h6', 'hev'], exclude: ['phev'] } },
  { id: 'gwm-haval-h6-phev', since: 2023, brand: 'GWM', model: 'Haval H6', version: 'PHEV34', category: 'suv-medio', powertrain: 'hibrido-plugin', seats: 5, trunkL: 560, refPriceNew: 249000, consumption: { cityKmL: 14.0, roadKmL: 12.8, cityKmKWh: 5.2, roadKmKWh: 4.5 }, evShare: 0.7, insuranceRate: 0.042, maintenanceBase: 2400, fipe: { brand: 'gwm', include: ['h6', 'phev34|phev'] } },

  // SUV grande
  { id: 'byd-song-plus', since: 2023, brand: 'BYD', model: 'Song Plus', version: 'DM-i (plug-in)', category: 'suv-grande', powertrain: 'hibrido-plugin', seats: 5, trunkL: 574, refPriceNew: 249990, consumption: { cityKmL: 14.9, roadKmL: 12.1, cityKmKWh: 5.5, roadKmKWh: 4.8 }, evShare: 0.7, insuranceRate: 0.045, maintenanceBase: 1900, estimated: ['consumo elétrico (5,5/4,8 km/kWh, sem fonte)', 'fração rodada no modo elétrico (70%)'], fipe: { brand: 'byd', include: ['song', 'plus'] } },
  { id: 'byd-sealion-7', since: 2025, brand: 'BYD', model: 'Sealion 7', version: 'EV', category: 'suv-grande', powertrain: 'eletrico', seats: 5, trunkL: 520, refPriceNew: 299990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 5.4, roadKmKWh: 4.6 }, insuranceRate: 0.047, maintenanceBase: 1300, fipe: { brand: 'byd', include: ['sealion'] } },
  { id: 'toyota-rav4-hybrid', brand: 'Toyota', model: 'RAV4', version: 'SX Hybrid', category: 'suv-grande', powertrain: 'hibrido', seats: 5, trunkL: 580, refPriceNew: 329990, consumption: { cityKmL: 15.9, roadKmL: 14.7 }, maintenanceBase: 3000, fipe: { brand: 'toyota', include: ['rav4', 'hybrid|hibrido'] } },
  { id: 'jeep-commander', since: 2022, brand: 'Jeep', model: 'Commander', version: 'Overland 1.3T', category: 'suv-grande', powertrain: 'flex', seats: 7, trunkL: 233, refPriceNew: 259990, consumption: flex(9.4, 11.1, 6.5, 7.8), fipe: { brand: 'jeep', include: ['commander', 'overland'], exclude: ['diesel', '4x4'] } },

  // Picape
  { id: 'fiat-strada', since: 2021, brand: 'Fiat', model: 'Strada', version: 'Volcano 1.3', category: 'picape', powertrain: 'flex', seats: 5, trunkL: 844, refPriceNew: 124990, consumption: flex(12.4, 13.5, 8.6, 9.4), fipe: { brand: 'fiat', include: ['strada', 'volcano'] } },
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
  'suv-grande': 'SUV grande',
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
  { category: 'suv-grande', monthlyFee: 6490, kmFranchiseMonth: 1500, excessKmPrice: 1.2 },
  { category: 'picape', monthlyFee: 3690, kmFranchiseMonth: 1500, excessKmPrice: 0.85 },
]

/** Modelo representativo usado para estimar o consumo de cada categoria de assinatura. */
export const SUBSCRIPTION_REPRESENTATIVE: Record<Category, string> = {
  'hatch-compacto': 'fiat-mobi',
  hatch: 'chevrolet-onix',
  sedan: 'vw-virtus',
  'suv-compacto': 'chevrolet-tracker',
  'suv-medio': 'jeep-compass',
  'suv-grande': 'jeep-commander',
  picape: 'fiat-strada',
}
