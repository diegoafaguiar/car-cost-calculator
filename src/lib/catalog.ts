import { MODEL_INFO } from './modelInfo'
import type { CatalogModel, Category, Powertrain, SubscriptionPlan } from './types'

/**
 * Catálogo curado dos modelos mais vendidos no Brasil.
 * Preços são referência para quando a FIPE estiver indisponível; o app
 * substitui pelo valor FIPE ao consultar. Consumo: ciclo INMETRO (aproximado).
 */
type Seed = Omit<CatalogModel, 'insuranceRate' | 'maintenanceBase' | 'depreciationFactor'> &
  Partial<Pick<CatalogModel, 'insuranceRate' | 'maintenanceBase' | 'depreciationFactor'>>

export const INSURANCE_BY_CATEGORY: Record<Category, number> = {
  'hatch-compacto': 0.045,
  hatch: 0.042,
  sedan: 0.04,
  'suv-compacto': 0.038,
  'suv-medio': 0.036,
  'suv-grande': 0.035,
  picape: 0.045,
}

export const MAINTENANCE_BY_CATEGORY: Record<Category, number> = {
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
  Omoda: 1.25,
  Jaecoo: 1.25,
  Geely: 1.25,
}

const flex = (city: number, road: number, cityE: number, roadE: number) => ({
  cityKmL: city,
  roadKmL: road,
  cityKmLEthanol: cityE,
  roadKmLEthanol: roadE,
})

const seeds: Seed[] = [
  // Hatch compacto
  { id: 'fiat-mobi', since: 2017, brand: 'Fiat', model: 'Mobi', version: 'Like 1.0', category: 'hatch-compacto', powertrain: 'flex', seats: 5, trunkL: 200, refPriceNew: 85490, consumption: { cityKmL: 14.0, roadKmL: 15.1, cityKmLEthanol: 9.8, roadKmLEthanol: 10.6 }, fipe: { brand: 'fiat', include: ['mobi', 'like'] } },
  { id: 'renault-kwid', since: 2018, brand: 'Renault', model: 'Kwid', version: 'Evolution 1.0', category: 'hatch-compacto', powertrain: 'flex', seats: 5, trunkL: 290, refPriceNew: 82790, consumption: { cityKmL: 15.3, roadKmL: 15.7, cityKmLEthanol: 10.8, roadKmLEthanol: 11.0 }, fipe: { brand: 'renault', include: ['kwid', 'zen'], exclude: ['e-tech'] } },
  { id: 'citroen-c3', since: 2023, brand: 'Citroën', model: 'C3', version: 'Live Go 1.0', category: 'hatch-compacto', powertrain: 'flex', seats: 5, trunkL: 315, refPriceNew: 77990, consumption: { cityKmL: 13.2, roadKmL: 14.5, cityKmLEthanol: 9.3, roadKmLEthanol: 10.3 }, fipe: { brand: 'citroen', include: ['c3', 'live'], exclude: ['aircross'] } },
  { id: 'renault-kwid-etech', since: 2022, brand: 'Renault', model: 'Kwid E-Tech', version: 'Techno (elétrico)', category: 'hatch-compacto', powertrain: 'eletrico', seats: 4, trunkL: 290, refPriceNew: 99990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 8.18, roadKmKWh: 8.18 }, insuranceRate: 0.05, maintenanceBase: 800, fipe: { brand: 'renault', include: ['kwid', 'e-tech'] } },
  { id: 'byd-dolphin-mini', since: 2024, brand: 'BYD', model: 'Dolphin Mini', version: 'GS', category: 'hatch-compacto', powertrain: 'eletrico', seats: 5, trunkL: 230, refPriceNew: 119990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 8.78, roadKmKWh: 8.78 }, insuranceRate: 0.05, maintenanceBase: 900, fipe: { brand: 'byd', include: ['dolphin', 'mini'] } },

  // Hatch
  { id: 'fiat-argo', since: 2018, brand: 'Fiat', model: 'Argo', version: 'Drive 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 300, refPriceNew: 93490, consumption: { cityKmL: 13.9, roadKmL: 15.1, cityKmLEthanol: 9.6, roadKmLEthanol: 10.7 }, fipe: { brand: 'fiat', include: ['argo', 'drive', '1.0'] } },
  { id: 'chevrolet-onix', since: 2020, brand: 'Chevrolet', model: 'Onix', version: '1.0 MT', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 275, refPriceNew: 102890, consumption: { cityKmL: 13.7, roadKmL: 17.7 }, fipe: { brand: 'chevrolet', include: ['onix', 'lt', '1.0'], exclude: ['plus', 'sedan', 'ltz', 'premier'] } },
  { id: 'hyundai-hb20', since: 2020, brand: 'Hyundai', model: 'HB20', version: 'Comfort 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 300, refPriceNew: 96140, consumption: { cityKmL: 13.4, roadKmL: 15.4, cityKmLEthanol: 9.7, roadKmLEthanol: 10.9 }, fipe: { brand: 'hyundai', include: ['hb20', 'comfort', '1.0'], exclude: ['hb20s', 'tgdi'] } },
  { id: 'vw-polo-track', since: 2023, brand: 'Volkswagen', model: 'Polo', version: 'Track 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 300, refPriceNew: 93660, consumption: { cityKmL: 13.7, roadKmL: 15.2, cityKmLEthanol: 9.4, roadKmLEthanol: 10.8 }, fipe: { brand: 'volkswagen', include: ['polo', 'track'] } },
  { id: 'peugeot-208', since: 2021, brand: 'Peugeot', model: '208', version: 'Style 1.0', category: 'hatch', powertrain: 'flex', seats: 5, trunkL: 265, refPriceNew: 93990, consumption: { cityKmL: 13.6, roadKmL: 15.3, cityKmLEthanol: 9.5, roadKmLEthanol: 10.8 }, fipe: { brand: 'peugeot', include: ['208', 'active'], exclude: ['e-208', '2008'] } },
  { id: 'byd-dolphin', since: 2024, brand: 'BYD', model: 'Dolphin', version: 'GS', category: 'hatch', powertrain: 'eletrico', seats: 5, trunkL: 345, refPriceNew: 149990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 8.57, roadKmKWh: 8.57 }, insuranceRate: 0.05, maintenanceBase: 1000, fipe: { brand: 'byd', include: ['dolphin'], exclude: ['mini', 'plus'] } },
  { id: 'byd-dolphin-plus', since: 2024, brand: 'BYD', model: 'Dolphin Plus', version: 'Plus', category: 'hatch', powertrain: 'eletrico', seats: 5, trunkL: 345, refPriceNew: 184800, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 7.06, roadKmKWh: 7.06 }, insuranceRate: 0.05, maintenanceBase: 1000, fipe: { brand: 'byd', include: ['dolphin', 'plus'] } },

  // Sedan
  { id: 'chevrolet-onix-plus', since: 2020, brand: 'Chevrolet', model: 'Onix Plus', version: 'LTZ 1.0 Turbo Aut.', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 500, refPriceNew: 120190, consumption: flex(12.6, 16.3, 8.8, 11.4), estimated: ['consumo do catálogo não confirmado (fontes divergem)'], fipe: { brand: 'chevrolet', include: ['onix', 'plus', 'lt'], exclude: ['ltz', 'premier'] } },
  { id: 'vw-virtus', since: 2018, brand: 'Volkswagen', model: 'Virtus', version: '170 TSI Aut.', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 521, refPriceNew: 134390, consumption: { cityKmL: 12.2, roadKmL: 14.9, cityKmLEthanol: 8.5, roadKmLEthanol: 10.4 }, fipe: { brand: 'volkswagen', include: ['virtus', 'tsi'], exclude: ['gts', 'exclusive', 'highline'] } },
  { id: 'hyundai-hb20s', since: 2020, brand: 'Hyundai', model: 'HB20S', version: 'Comfort 1.0', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 475, refPriceNew: 105290, consumption: { cityKmL: 13.4, roadKmL: 15.4, cityKmLEthanol: 9.7, roadKmLEthanol: 10.9 }, fipe: { brand: 'hyundai', include: ['hb20s', 'comfort'] } },
  { id: 'honda-city', since: 2022, brand: 'Honda', model: 'City Sedan', version: 'EXL 1.5 CVT', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 519, refPriceNew: 145800, consumption: { cityKmL: 13.2, roadKmL: 15.3, cityKmLEthanol: 9.1, roadKmLEthanol: 10.8 }, fipe: { brand: 'honda', include: ['city', 'exl'], exclude: ['hatch'] } },
  { id: 'toyota-corolla', since: 2020, brand: 'Toyota', model: 'Corolla', version: 'XEi 2.0', category: 'sedan', powertrain: 'flex', seats: 5, trunkL: 470, refPriceNew: 177590, consumption: { cityKmL: 11.9, roadKmL: 14.5, cityKmLEthanol: 8.0, roadKmLEthanol: 10.0 }, fipe: { brand: 'toyota', include: ['corolla', 'xei'], exclude: ['cross', 'hybrid|hibrido'] } },
  { id: 'toyota-corolla-hybrid', since: 2020, infoId: 'toyota-corolla', brand: 'Toyota', model: 'Corolla', version: 'Altis Premium Hybrid', category: 'sedan', powertrain: 'hibrido', seats: 5, trunkL: 470, refPriceNew: 210090, consumption: flex(17.5, 15.2, 12.5, 10.7), maintenanceBase: 2200, estimated: ['consumo publicado para a GLi Hybrid; a imprensa diz que a Altis Premium é igual'], fipe: { brand: 'toyota', include: ['corolla', 'hybrid|hibrido'], exclude: ['cross'] } },
  { id: 'byd-king', since: 2025, brand: 'BYD', model: 'King', version: 'GS (plug-in)', category: 'sedan', powertrain: 'hibrido-plugin', seats: 5, trunkL: 450, refPriceNew: 175990, consumption: { cityKmL: 16.8, roadKmL: 14.7, cityKmKWh: 4.37, roadKmKWh: 4.37 }, insuranceRate: 0.048, maintenanceBase: 1600, estimated: ['consumo elétrico (4,4 km/kWh = 80 km ÷ 18,3 kWh; o PBEV não publica km/kWh de plug-in)'], fipe: { brand: 'byd', include: ['king'] } },
  { id: 'byd-seal', since: 2024, brand: 'BYD', model: 'Seal', version: 'AWD', category: 'sedan', powertrain: 'eletrico', seats: 5, trunkL: 400, refPriceNew: 299990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 5.81, roadKmKWh: 5.81 }, insuranceRate: 0.048, maintenanceBase: 1300, fipe: { brand: 'byd', include: ['seal'], exclude: ['sealion'] } },

  // SUV compacto
  { id: 'fiat-pulse', since: 2022, brand: 'Fiat', model: 'Pulse', version: 'Drive 1.3 CVT', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 370, refPriceNew: 116990, consumption: flex(12.9, 14.3, 9.2, 10.4), fipe: { brand: 'fiat', include: ['pulse', 'drive'] } },
  { id: 'renault-kardian', since: 2025, brand: 'Renault', model: 'Kardian', version: 'Evolution 1.0T EDC', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 358, refPriceNew: 126590, consumption: { cityKmL: 13.1, roadKmL: 13.9, cityKmLEthanol: 9.0, roadKmLEthanol: 9.7 }, fipe: { brand: 'renault', include: ['kardian'] } },
  { id: 'vw-nivus', since: 2021, brand: 'Volkswagen', model: 'Nivus', version: 'Comfortline 200 TSI', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 415, refPriceNew: 158290, consumption: flex(12.4, 14.8, 8.6, 10.3), consumptionHistory: [{ untilModelYear: 2022, consumption: flex(10.7, 13.2, 7.7, 9.4) }], fipe: { brand: 'volkswagen', include: ['nivus', 'comfortline'] } },
  { id: 'chevrolet-tracker', since: 2021, brand: 'Chevrolet', model: 'Tracker', version: 'LT 1.0 Turbo', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 393, refPriceNew: 146990, consumption: flex(11.5, 13.8, 8.1, 9.9), fipe: { brand: 'chevrolet', include: ['tracker', 'lt'], exclude: ['ltz', 'premier', 'rs'] } },
  { id: 'vw-tcross', since: 2020, brand: 'Volkswagen', model: 'T-Cross', version: '200 TSI', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 373, refPriceNew: 152890, consumption: flex(11.9, 14.1, 8.1, 9.8), fipe: { brand: 'volkswagen', include: ['t-cross', '200'] } },
  { id: 'hyundai-creta', since: 2022, brand: 'Hyundai', model: 'Creta', version: 'Comfort 1.0 TGDi', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 422, refPriceNew: 156590, consumption: flex(12.0, 12.7, 8.4, 9.0), fipe: { brand: 'hyundai', include: ['creta', 'comfort'] } },
  { id: 'nissan-kicks', since: 2026, brand: 'Nissan', model: 'Kicks', version: 'Advance 1.0T', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 470, refPriceNew: 169990, consumption: flex(11.7, 14.3, 8.3, 9.9), fipe: { brand: 'nissan', include: ['kicks', 'advance'], exclude: ['play'] } },
  { id: 'jeep-renegade', since: 2016, brand: 'Jeep', model: 'Renegade', version: 'Longitude MHEV', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 320, refPriceNew: 158690, consumption: flex(11.9, 11.8, 8.3, 8.6), consumptionHistory: [{ untilModelYear: 2026, consumption: flex(11.0, 12.8, 7.7, 9.1) }], fipe: { brand: 'jeep', include: ['renegade', 'longitude'] } },
  { id: 'honda-hrv', since: 2023, brand: 'Honda', model: 'HR-V', version: 'EXL 1.5', category: 'suv-compacto', powertrain: 'flex', seats: 5, trunkL: 354, refPriceNew: 174300, consumption: flex(12.5, 13.9, 8.8, 9.9), fipe: { brand: 'honda', include: ['hr-v', 'exl'] } },
  { id: 'omoda-5-hev', since: 2026, brand: 'Omoda', model: '5 HEV', version: 'Luxury 1.5 TGDI HEV', category: 'suv-compacto', powertrain: 'hibrido', seats: 5, trunkL: 378, refPriceNew: 159990, consumption: { cityKmL: 15.1, roadKmL: 13.2 }, maintenanceBase: 2200, fipe: { brand: 'omoda', include: ['5', 'hev|hibrido'], exclude: ['e5', '7'] } },
  { id: 'toyota-yaris-cross-hybrid', since: 2026, brand: 'Toyota', model: 'Yaris Cross', version: 'XRX Hybrid', category: 'suv-compacto', powertrain: 'hibrido', seats: 5, trunkL: 391, refPriceNew: 189990, consumption: flex(17.9, 15.3, 13.2, 10.7), maintenanceBase: 2100, fipe: { brand: 'toyota', include: ['yaris', 'cross', 'hybrid|hibrido'] } },
  { id: 'byd-yuan-pro', since: 2025, brand: 'BYD', model: 'Yuan Pro', version: 'GS', category: 'suv-compacto', powertrain: 'eletrico', seats: 5, trunkL: 265, refPriceNew: 182990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 7.06, roadKmKWh: 7.06 }, insuranceRate: 0.048, maintenanceBase: 1000, fipe: { brand: 'byd', include: ['yuan', 'pro'] } },

  // SUV médio
  { id: 'toyota-corolla-cross', infoId: 'toyota-corolla-cross-hybrid', since: 2022, brand: 'Toyota', model: 'Corolla Cross', version: 'XRE 2.0', category: 'suv-medio', powertrain: 'flex', seats: 5, trunkL: 440, refPriceNew: 194790, consumption: flex(10.5, 12.6, 7.3, 8.8), fipe: { brand: 'toyota', include: ['corolla', 'cross', 'xre'] } },
  { id: 'toyota-corolla-cross-hybrid', since: 2022, brand: 'Toyota', model: 'Corolla Cross', version: 'XRX Hybrid Premium', category: 'suv-medio', powertrain: 'hibrido', seats: 5, trunkL: 440, refPriceNew: 223790, consumption: flex(17.8, 14.7, 11.8, 9.7), maintenanceBase: 2600, fipe: { brand: 'toyota', include: ['corolla', 'cross', 'xrx', 'hybrid|hibrido'] } },
  { id: 'toyota-corolla-cross-xrv-hybrid', infoId: 'toyota-corolla-cross-hybrid', since: 2027, brand: 'Toyota', model: 'Corolla Cross', version: 'XRV Hybrid', category: 'suv-medio', powertrain: 'hibrido', seats: 5, trunkL: 440, refPriceNew: 213990, consumption: flex(17.8, 14.7, 11.8, 9.7), maintenanceBase: 2600, fipe: { brand: 'toyota', include: ['corolla', 'cross', 'xrv', 'hybrid|hibrido'] } },
  { id: 'vw-taos', since: 2022, brand: 'Volkswagen', model: 'Taos', version: 'Highline 250 TSI', category: 'suv-medio', powertrain: 'flex', seats: 5, trunkL: 498, refPriceNew: 219990, consumption: { cityKmL: 11.1, roadKmL: 13.3, cityKmLEthanol: 7.7, roadKmLEthanol: 9.3 }, fipe: { brand: 'volkswagen', include: ['taos', 'highline'] } },
  { id: 'honda-zrv', since: 2024, brand: 'Honda', model: 'ZR-V', version: 'Touring 2.0', category: 'suv-medio', powertrain: 'gasolina', seats: 5, trunkL: 389, refPriceNew: 214500, consumption: { cityKmL: 10.2, roadKmL: 12.1 }, fipe: { brand: 'honda', include: ['zr-v'] } },
  { id: 'byd-yuan-plus', since: 2023, brand: 'BYD', model: 'Yuan Plus', version: 'EV', category: 'suv-medio', powertrain: 'eletrico', seats: 5, trunkL: 490, refPriceNew: 269990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 6.21, roadKmKWh: 6.21 }, insuranceRate: 0.048, maintenanceBase: 1100, fipe: { brand: 'byd', include: ['yuan', 'plus'] } },
  { id: 'jeep-compass', since: 2017, brand: 'Jeep', model: 'Compass', version: 'Longitude T270', category: 'suv-medio', powertrain: 'flex', seats: 5, trunkL: 410, refPriceNew: 199890, consumption: flex(10.1, 12.1, 7.3, 8.6), fipe: { brand: 'jeep', include: ['compass', 'longitude'], exclude: ['diesel', '4x4', 'hybrid'] } },
  { id: 'byd-song-pro-gl', infoId: 'byd-song-pro', since: 2025, brand: 'BYD', model: 'Song Pro', version: 'GL (plug-in, flex)', category: 'suv-medio', powertrain: 'hibrido-plugin', seats: 5, trunkL: 530, refPriceNew: 176990, consumption: { cityKmL: 16.0, roadKmL: 13.9, cityKmLEthanol: 12.1, roadKmLEthanol: 10.7, cityKmKWh: 4.35, roadKmKWh: 4.35 }, consumptionHistory: [{ untilModelYear: 2026, consumption: { cityKmL: 14.8, roadKmL: 12.6, cityKmKWh: 3.8, roadKmKWh: 3.8 } }], insuranceRate: 0.046, maintenanceBase: 1800, estimated: ['consumo elétrico (4,35 km/kWh = 57 km ÷ 13,1 kWh; seminovos 2025/26: 49 km ÷ 12,9 kWh)'], fipe: { brand: 'byd', include: ['song', 'pro', 'gl'] } },
  { id: 'byd-song-pro', since: 2025, brand: 'BYD', model: 'Song Pro', version: 'GS (plug-in, flex)', category: 'suv-medio', powertrain: 'hibrido-plugin', seats: 5, trunkL: 530, refPriceNew: 199990, consumption: { cityKmL: 15.9, roadKmL: 13.5, cityKmLEthanol: 11.7, roadKmLEthanol: 10.5, cityKmKWh: 3.93, roadKmKWh: 3.93 }, consumptionHistory: [{ untilModelYear: 2026, consumption: { cityKmL: 14.8, roadKmL: 12.0, cityKmKWh: 3.39, roadKmKWh: 3.39 } }], insuranceRate: 0.046, maintenanceBase: 1800, estimated: ['consumo elétrico (3,93 km/kWh = 72 km ÷ 18,3 kWh; seminovos 2025/26: 62 km ÷ 18,3 kWh)'], fipe: { brand: 'byd', include: ['song', 'pro', 'gs'] } },
  { id: 'jaecoo-7-phev', since: 2026, brand: 'Jaecoo', model: '7 PHEV', version: 'Elite 1.5 TGDI PHEV', category: 'suv-medio', powertrain: 'hibrido-plugin', seats: 5, trunkL: 500, refPriceNew: 189990, consumption: { cityKmL: 15.1, roadKmL: 13.5, cityKmKWh: 4.3, roadKmKWh: 4.3 }, insuranceRate: 0.045, maintenanceBase: 2000, estimated: ['consumo elétrico (4,3 km/kWh = 79 km ÷ 18,3 kWh)'], fipe: { brand: 'jaecoo', include: ['7'], exclude: ['5', '8'] } },
  { id: 'geely-ex5-em-i', since: 2026, brand: 'Geely', model: 'EX5 EM-i', version: 'Pro', category: 'suv-medio', powertrain: 'hibrido-plugin', seats: 5, trunkL: 428, refPriceNew: 199990, consumption: { cityKmL: 14.8, roadKmL: 13.1, cityKmKWh: 3.5, roadKmKWh: 3.5 }, insuranceRate: 0.045, maintenanceBase: 2000, estimated: ['consumo elétrico (3,5 km/kWh = 65 km ÷ 18,4 kWh)', 'preço pode ser o promocional (R$ 189.990) na concessionária'], fipe: { brand: 'geely', include: ['ex5', 'em-i'] } },
  { id: 'gwm-haval-h6', since: 2023, brand: 'GWM', model: 'Haval H6', version: 'HEV2 Flex', category: 'suv-medio', powertrain: 'hibrido', seats: 5, trunkL: 560, refPriceNew: 225000, consumption: { cityKmL: 15.8, roadKmL: 13.0 }, insuranceRate: 0.042, maintenanceBase: 2600, estimated: ['consumo com etanol não considerado (só o urbano, 10,2 km/l, foi encontrado)'], fipe: { brand: 'gwm', include: ['h6', 'hev|hev2'], exclude: ['phev', 'phev19', 'phev35', 'gt'] } },
  { id: 'gwm-haval-h6-phev', since: 2023, brand: 'GWM', model: 'Haval H6', version: 'PHEV35 Flex', category: 'suv-medio', powertrain: 'hibrido-plugin', seats: 5, trunkL: 560, refPriceNew: 290000, consumption: { cityKmL: 10.7, roadKmL: 10.7, cityKmKWh: 3.6, roadKmKWh: 3.6 }, insuranceRate: 0.042, maintenanceBase: 2400, estimated: ['consumo elétrico (3,6 km/kWh = 126 km ÷ 35 kWh)', 'consumo a gasolina na cidade (usado o da estrada, 10,7 km/l; o urbano publicado mistura uso elétrico)'], fipe: { brand: 'gwm', include: ['h6', 'phev35|phev'], exclude: ['gt'] } },

  // SUV grande
  { id: 'byd-song-plus', since: 2023, brand: 'BYD', model: 'Song Plus', version: '1.5 turbo DM-i (plug-in)', category: 'suv-grande', powertrain: 'hibrido-plugin', seats: 5, trunkL: 574, refPriceNew: 249990, consumption: { cityKmL: 14.9, roadKmL: 12.1, cityKmKWh: 3.72, roadKmKWh: 3.72 }, consumptionHistory: [{ untilModelYear: 2024, consumption: { cityKmL: 15.1, roadKmL: 13.2, cityKmKWh: 3.72, roadKmKWh: 3.72 } }], insuranceRate: 0.045, maintenanceBase: 1900, estimated: ['consumo a gasolina da linha 2027 não publicado: usado o da 2025/26 (14,9/12,1 km/l)', 'consumo elétrico (3,72 km/kWh = 99 km ÷ 26,6 kWh)', 'seminovos 2023/24 tinham só 28 km de autonomia elétrica; o cálculo usa a mesma fração elétrica de todos os plug-in'], fipe: { brand: 'byd', include: ['song', 'plus'], exclude: ['premium'] } },
  { id: 'byd-sealion-7', since: 2026, brand: 'BYD', model: 'Sealion 7', version: 'AWD', category: 'suv-grande', powertrain: 'eletrico', seats: 5, trunkL: 500, refPriceNew: 339990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 4.36, roadKmKWh: 4.36 }, insuranceRate: 0.047, maintenanceBase: 1300, estimated: ['consumo (4,36 km/kWh = 360 km ÷ 82,5 kWh; MJ/km do PBEV não encontrado)'], fipe: { brand: 'byd', include: ['sealion'] } },
  { id: 'byd-atto-8', since: 2026, brand: 'BYD', model: 'Atto 8', version: 'AWD (plug-in, 7 lugares)', category: 'suv-grande', powertrain: 'hibrido-plugin', seats: 7, trunkL: 270, refPriceNew: 399990, consumption: { cityKmL: 11.4, roadKmL: 10.8, cityKmKWh: 3.12, roadKmKWh: 3.12 }, insuranceRate: 0.045, maintenanceBase: 2200, estimated: ['consumo elétrico (3,1 km/kWh, autonomia ÷ bateria)'], fipe: { brand: 'byd', include: ['atto'] } },
  { id: 'toyota-rav4-hybrid', since: 2026, brand: 'Toyota', model: 'RAV4', version: 'SX Hybrid', category: 'suv-grande', powertrain: 'hibrido', seats: 5, trunkL: 456, refPriceNew: 349290, consumption: { cityKmL: 15.3, roadKmL: 14.1 }, maintenanceBase: 3000, fipe: { brand: 'toyota', include: ['rav4', 'hybrid|hibrido'] } },
  { id: 'jeep-commander', since: 2022, brand: 'Jeep', model: 'Commander', version: 'Overland T270 MHEV', category: 'suv-grande', powertrain: 'flex', seats: 7, trunkL: 661, refPriceNew: 283790, consumption: { cityKmL: 11.0, roadKmL: 11.2, cityKmLEthanol: 7.6, roadKmLEthanol: 8.1 }, fipe: { brand: 'jeep', include: ['commander', 'overland'], exclude: ['diesel', '4x4'] } },
  { id: 'jeep-commander-longitude', infoId: 'jeep-commander', since: 2022, brand: 'Jeep', model: 'Commander', version: 'Longitude T270', category: 'suv-grande', powertrain: 'flex', seats: 7, trunkL: 661, refPriceNew: 228790, consumption: flex(10.0, 11.4, 7.0, 8.2), fipe: { brand: 'jeep', include: ['commander', 'longitude'], exclude: ['diesel', '4x4'] } },

  // Picape
  { id: 'fiat-strada', since: 2021, brand: 'Fiat', model: 'Strada', version: 'Volcano CD 1.3', category: 'picape', powertrain: 'flex', seats: 5, trunkL: 844, refPriceNew: 136490, consumption: { cityKmL: 12.4, roadKmL: 13.9, cityKmLEthanol: 8.9, roadKmLEthanol: 9.8 }, fipe: { brand: 'fiat', include: ['strada', 'volcano'] } },
  { id: 'byd-shark', since: 2025, brand: 'BYD', model: 'Shark', version: 'GS (plug-in)', category: 'picape', powertrain: 'hibrido-plugin', seats: 5, trunkL: 1200, refPriceNew: 344990, consumption: { cityKmL: 9.5, roadKmL: 7.7, cityKmKWh: 1.93, roadKmKWh: 1.93 }, insuranceRate: 0.045, maintenanceBase: 2600, estimated: ['consumo elétrico (1,9 km/kWh, autonomia ÷ bateria)', 'porta-malas = volume da caçamba em litros'], fipe: { brand: 'byd', include: ['shark'] } },
  { id: 'fiat-toro', since: 2016, brand: 'Fiat', model: 'Toro', version: 'Freedom 1.3T', category: 'picape', powertrain: 'flex', seats: 5, trunkL: 937, refPriceNew: 177490, consumption: { cityKmL: 9.4, roadKmL: 10.8, cityKmLEthanol: 6.8, roadKmLEthanol: 7.9 }, fipe: { brand: 'fiat', include: ['toro', 'freedom'], exclude: ['diesel'] } },
]

export const CATALOG: CatalogModel[] = seeds.map((s) => ({
  ...s,
  insuranceRate: s.insuranceRate ?? INSURANCE_BY_CATEGORY[s.category],
  maintenanceBase: s.maintenanceBase ?? MAINTENANCE_BY_CATEGORY[s.category],
  depreciationFactor: s.depreciationFactor ?? BRAND_DEPRECIATION[s.brand] ?? 1,
  priceRef: priceRefFor(s),
}))

function priceRefFor(s: Seed): string | undefined {
  const info = MODEL_INFO[s.infoId ?? s.id]
  if (!info) return undefined
  const match = [info.price0km, ...info.versionsAndPrices].find((v) => v.price === s.refPriceNew)
  return match ? (match.date ?? info.researchedAt) : undefined
}

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

export const CATEGORY_ORDER: Category[] = [
  'hatch-compacto',
  'hatch',
  'sedan',
  'suv-compacto',
  'suv-medio',
  'suv-grande',
  'picape',
]

/** Categoria imediatamente abaixo e acima da sua, em porte e preço. */
export const CATEGORY_BELOW: Record<Category, Category[]> = {
  'hatch-compacto': [],
  hatch: ['hatch-compacto'],
  sedan: ['hatch'],
  'suv-compacto': ['hatch', 'sedan'],
  'suv-medio': ['suv-compacto'],
  'suv-grande': ['suv-medio'],
  picape: [],
}

export const CATEGORY_ABOVE: Record<Category, Category[]> = {
  'hatch-compacto': ['hatch'],
  hatch: ['sedan', 'suv-compacto'],
  sedan: ['suv-medio'],
  'suv-compacto': ['suv-medio'],
  'suv-medio': ['suv-grande'],
  'suv-grande': [],
  picape: [],
}
