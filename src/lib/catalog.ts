import { MODEL_INFO } from './modelInfo'
import type { CatalogModel, Category, Powertrain, SubscriptionPlan, Transmission } from './types'

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
  // Marcas novas no Brasil (2025–2026), sem histórico de revenda: mesma faixa da BYD.
  'Caoa Chery': 1.25,
  'Caoa Changan': 1.3,
  Leapmotor: 1.3,
  Jetour: 1.3,
  MG: 1.3,
  GAC: 1.3,
  Zeekr: 1.3,
  Denza: 1.3,
}

const flex = (city: number, road: number, cityE: number, roadE: number) => ({
  cityKmL: city,
  roadKmL: road,
  cityKmLEthanol: cityE,
  roadKmLEthanol: roadE,
})

const seeds: Seed[] = [
  // Hatch compacto
  { id: 'fiat-mobi', since: 2017, brand: 'Fiat', model: 'Mobi', version: 'Like 1.0', category: 'hatch-compacto', powertrain: 'flex', transmission: 'manual', seats: 5, trunkL: 200, refPriceNew: 85490, consumption: { cityKmL: 14.0, roadKmL: 15.1, cityKmLEthanol: 9.8, roadKmLEthanol: 10.6 }, fipe: { brand: 'fiat', include: ['mobi', 'like'] } },
  { id: 'renault-kwid', since: 2018, brand: 'Renault', model: 'Kwid', version: 'Evolution 1.0', category: 'hatch-compacto', powertrain: 'flex', transmission: 'manual', seats: 5, trunkL: 290, refPriceNew: 82790, consumption: { cityKmL: 15.3, roadKmL: 15.7, cityKmLEthanol: 10.8, roadKmLEthanol: 11.0 }, fipe: { brand: 'renault', include: ['kwid', 'zen'], exclude: ['e-tech'] } },
  { id: 'citroen-c3', since: 2023, brand: 'Citroën', model: 'C3', version: 'Live Go 1.0', category: 'hatch-compacto', powertrain: 'flex', transmission: 'manual', seats: 5, trunkL: 315, refPriceNew: 77990, consumption: { cityKmL: 13.2, roadKmL: 14.5, cityKmLEthanol: 9.3, roadKmLEthanol: 10.3 }, fipe: { brand: 'citroen', include: ['c3', 'live'], exclude: ['aircross'] } },
  { id: 'renault-kwid-etech', since: 2022, brand: 'Renault', model: 'Kwid E-Tech', version: 'Techno (elétrico)', category: 'hatch-compacto', powertrain: 'eletrico', transmission: 'automatico', seats: 4, trunkL: 290, refPriceNew: 99990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 8.18, roadKmKWh: 8.18 }, insuranceRate: 0.05, maintenanceBase: 800, fipe: { brand: 'renault', include: ['kwid', 'e-tech'] } },
  { id: 'byd-dolphin-mini', since: 2024, brand: 'BYD', model: 'Dolphin Mini', version: 'GS', category: 'hatch-compacto', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 230, refPriceNew: 119990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 8.78, roadKmKWh: 8.78 }, insuranceRate: 0.05, maintenanceBase: 900, fipe: { brand: 'byd', include: ['dolphin', 'mini'] } },

  // Hatch
  { id: 'fiat-argo', since: 2018, brand: 'Fiat', model: 'Argo', version: 'Drive 1.0', category: 'hatch', powertrain: 'flex', transmission: 'manual', seats: 5, trunkL: 300, refPriceNew: 93490, consumption: { cityKmL: 13.9, roadKmL: 15.1, cityKmLEthanol: 9.6, roadKmLEthanol: 10.7 }, fipe: { brand: 'fiat', include: ['argo', 'drive', '1.0'] } },
  { id: 'chevrolet-onix', since: 2020, brand: 'Chevrolet', model: 'Onix', version: '1.0 MT', category: 'hatch', powertrain: 'flex', transmission: 'manual', seats: 5, trunkL: 275, refPriceNew: 102890, consumption: { cityKmL: 13.7, roadKmL: 17.7 }, fipe: { brand: 'chevrolet', include: ['onix', 'lt', '1.0'], exclude: ['plus', 'sedan', 'ltz', 'premier'] } },
  { id: 'hyundai-hb20', since: 2020, brand: 'Hyundai', model: 'HB20', version: 'Comfort 1.0', category: 'hatch', powertrain: 'flex', transmission: 'manual', seats: 5, trunkL: 300, refPriceNew: 96140, consumption: { cityKmL: 13.4, roadKmL: 15.4, cityKmLEthanol: 9.7, roadKmLEthanol: 10.9 }, fipe: { brand: 'hyundai', include: ['hb20', 'comfort', '1.0'], exclude: ['hb20s', 'tgdi'] } },
  { id: 'vw-polo-track', since: 2023, brand: 'Volkswagen', model: 'Polo', version: 'Track 1.0', category: 'hatch', powertrain: 'flex', transmission: 'manual', seats: 5, trunkL: 300, refPriceNew: 93660, consumption: { cityKmL: 13.7, roadKmL: 15.2, cityKmLEthanol: 9.4, roadKmLEthanol: 10.8 }, fipe: { brand: 'volkswagen', include: ['polo', 'track'] } },
  { id: 'peugeot-208', since: 2021, brand: 'Peugeot', model: '208', version: 'Style 1.0', category: 'hatch', powertrain: 'flex', transmission: 'manual', seats: 5, trunkL: 265, refPriceNew: 93990, consumption: { cityKmL: 13.6, roadKmL: 15.3, cityKmLEthanol: 9.5, roadKmLEthanol: 10.8 }, fipe: { brand: 'peugeot', include: ['208', 'style'], exclude: ['e-208', '2008', 'turbo', 'aut'] } },
  { id: 'byd-dolphin', since: 2024, brand: 'BYD', model: 'Dolphin', version: 'GS', category: 'hatch', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 345, refPriceNew: 149990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 8.57, roadKmKWh: 8.57 }, insuranceRate: 0.05, maintenanceBase: 1000, fipe: { brand: 'byd', include: ['dolphin'], exclude: ['mini', 'plus'] } },
  { id: 'byd-dolphin-plus', since: 2024, brand: 'BYD', model: 'Dolphin Plus', version: 'Plus', category: 'hatch', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 345, refPriceNew: 184800, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 7.06, roadKmKWh: 7.06 }, insuranceRate: 0.05, maintenanceBase: 1000, fipe: { brand: 'byd', include: ['dolphin', 'plus'] } },

  // Sedan
  { id: 'chevrolet-onix-plus', since: 2020, brand: 'Chevrolet', model: 'Onix Plus', version: 'LTZ 1.0 Turbo Aut.', category: 'sedan', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 500, refPriceNew: 120190, consumption: flex(12.6, 16.3, 8.8, 11.4), estimated: ['consumo do catálogo não confirmado (fontes divergem)'], fipe: { brand: 'chevrolet', include: ['onix', 'plus', 'ltz'], exclude: ['premier', 'midnight'] } },
  { id: 'vw-virtus', since: 2018, brand: 'Volkswagen', model: 'Virtus', version: '170 TSI Aut.', category: 'sedan', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 521, refPriceNew: 134390, consumption: { cityKmL: 12.2, roadKmL: 14.9, cityKmLEthanol: 8.5, roadKmLEthanol: 10.4 }, fipe: { brand: 'volkswagen', include: ['virtus', 'tsi'], exclude: ['gts', 'exclusive', 'highline'] } },
  { id: 'hyundai-hb20s', since: 2020, brand: 'Hyundai', model: 'HB20S', version: 'Comfort 1.0', category: 'sedan', powertrain: 'flex', transmission: 'manual', seats: 5, trunkL: 475, refPriceNew: 105290, consumption: { cityKmL: 13.4, roadKmL: 15.4, cityKmLEthanol: 9.7, roadKmLEthanol: 10.9 }, fipe: { brand: 'hyundai', include: ['hb20s', 'comfort'] } },
  { id: 'honda-city', since: 2022, brand: 'Honda', model: 'City Sedan', version: 'EXL 1.5 CVT', category: 'sedan', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 519, refPriceNew: 145800, consumption: { cityKmL: 13.2, roadKmL: 15.3, cityKmLEthanol: 9.1, roadKmLEthanol: 10.8 }, fipe: { brand: 'honda', include: ['city', 'exl'], exclude: ['hatch'] } },
  { id: 'toyota-corolla', since: 2020, brand: 'Toyota', model: 'Corolla', version: 'XEi 2.0', category: 'sedan', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 470, refPriceNew: 177590, consumption: { cityKmL: 11.9, roadKmL: 14.5, cityKmLEthanol: 8.0, roadKmLEthanol: 10.0 }, fipe: { brand: 'toyota', include: ['corolla', 'xei'], exclude: ['cross', 'hybrid|hibrido'] } },
  { id: 'toyota-corolla-hybrid', since: 2020, infoId: 'toyota-corolla', brand: 'Toyota', model: 'Corolla', version: 'Altis Premium Hybrid', category: 'sedan', powertrain: 'hibrido', transmission: 'automatico', seats: 5, trunkL: 470, refPriceNew: 210090, consumption: flex(17.5, 15.2, 12.5, 10.7), maintenanceBase: 2200, estimated: ['consumo publicado para a GLi Hybrid; a imprensa diz que a Altis Premium é igual'], fipe: { brand: 'toyota', include: ['corolla', 'hybrid|hibrido'], exclude: ['cross'] } },
  { id: 'byd-king', since: 2025, brand: 'BYD', model: 'King', version: 'GS (plug-in)', category: 'sedan', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 450, refPriceNew: 175990, consumption: { cityKmL: 16.8, roadKmL: 14.7, cityKmKWh: 4.37, roadKmKWh: 4.37 }, insuranceRate: 0.048, maintenanceBase: 1600, estimated: ['consumo elétrico (4,4 km/kWh = 80 km ÷ 18,3 kWh; o PBEV não publica km/kWh de plug-in)'], fipe: { brand: 'byd', include: ['king'] } },
  { id: 'byd-seal', since: 2024, brand: 'BYD', model: 'Seal', version: 'AWD', category: 'sedan', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 400, refPriceNew: 299990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 5.81, roadKmKWh: 5.81 }, insuranceRate: 0.048, maintenanceBase: 1300, fipe: { brand: 'byd', include: ['seal'], exclude: ['sealion'] } },

  // SUV compacto
  { id: 'fiat-pulse', since: 2022, brand: 'Fiat', model: 'Pulse', version: 'Drive 1.3 CVT', category: 'suv-compacto', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 370, refPriceNew: 116990, consumption: flex(12.9, 14.3, 9.2, 10.4), fipe: { brand: 'fiat', include: ['pulse', 'drive'] } },
  { id: 'renault-kardian', since: 2025, brand: 'Renault', model: 'Kardian', version: 'Evolution 1.0T EDC', category: 'suv-compacto', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 358, refPriceNew: 126590, consumption: { cityKmL: 13.1, roadKmL: 13.9, cityKmLEthanol: 9.0, roadKmLEthanol: 9.7 }, fipe: { brand: 'renault', include: ['kardian'] } },
  { id: 'vw-nivus', since: 2021, brand: 'Volkswagen', model: 'Nivus', version: 'Comfortline 200 TSI', category: 'suv-compacto', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 415, refPriceNew: 158290, consumption: flex(12.4, 14.8, 8.6, 10.3), consumptionHistory: [{ untilModelYear: 2022, consumption: flex(10.7, 13.2, 7.7, 9.4) }], fipe: { brand: 'volkswagen', include: ['nivus', 'comfortline'] } },
  { id: 'chevrolet-tracker', since: 2021, brand: 'Chevrolet', model: 'Tracker', version: 'LT 1.0 Turbo', category: 'suv-compacto', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 393, refPriceNew: 146990, consumption: flex(11.5, 13.8, 8.1, 9.9), fipe: { brand: 'chevrolet', include: ['tracker', 'lt'], exclude: ['ltz', 'premier', 'rs'] } },
  { id: 'vw-tcross', since: 2020, brand: 'Volkswagen', model: 'T-Cross', version: '200 TSI', category: 'suv-compacto', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 373, refPriceNew: 152890, consumption: flex(11.9, 14.1, 8.1, 9.8), fipe: { brand: 'volkswagen', include: ['t-cross', '200'] } },
  { id: 'hyundai-creta', since: 2022, brand: 'Hyundai', model: 'Creta', version: 'Comfort 1.0 TGDi', category: 'suv-compacto', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 422, refPriceNew: 156590, consumption: flex(12.0, 12.7, 8.4, 9.0), fipe: { brand: 'hyundai', include: ['creta', 'comfort'] } },
  { id: 'nissan-kicks', since: 2026, brand: 'Nissan', model: 'Kicks', version: 'Advance 1.0T', category: 'suv-compacto', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 470, refPriceNew: 169990, consumption: flex(11.7, 14.3, 8.3, 9.9), fipe: { brand: 'nissan', include: ['kicks', 'advance'], exclude: ['play'] } },
  { id: 'jeep-renegade', since: 2016, brand: 'Jeep', model: 'Renegade', version: 'Longitude MHEV', category: 'suv-compacto', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 320, refPriceNew: 158690, consumption: flex(11.9, 11.8, 8.3, 8.6), consumptionHistory: [{ untilModelYear: 2026, consumption: flex(11.0, 12.8, 7.7, 9.1) }], fipe: { brand: 'jeep', include: ['renegade', 'longitude'] } },
  { id: 'honda-hrv', since: 2023, brand: 'Honda', model: 'HR-V', version: 'EXL 1.5', category: 'suv-compacto', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 354, refPriceNew: 174300, consumption: flex(12.5, 13.9, 8.8, 9.9), fipe: { brand: 'honda', include: ['hr-v', 'exl'] } },
  { id: 'omoda-5-hev', since: 2026, brand: 'Omoda', model: '5 HEV', version: 'Luxury 1.5 TGDI HEV', category: 'suv-compacto', powertrain: 'hibrido', transmission: 'automatico', seats: 5, trunkL: 378, refPriceNew: 159990, consumption: { cityKmL: 15.1, roadKmL: 13.2 }, maintenanceBase: 2200, fipe: { brand: 'omoda', include: ['5', 'hev|hibrido'], exclude: ['e5', '7'] } },
  { id: 'toyota-yaris-cross-hybrid', since: 2026, brand: 'Toyota', model: 'Yaris Cross', version: 'XRX Hybrid', category: 'suv-compacto', powertrain: 'hibrido', transmission: 'automatico', seats: 5, trunkL: 391, refPriceNew: 189990, consumption: flex(17.9, 15.3, 13.2, 10.7), maintenanceBase: 2100, fipe: { brand: 'toyota', include: ['yaris', 'cross', 'hybrid|hibrido'] } },
  { id: 'byd-yuan-pro', since: 2025, brand: 'BYD', model: 'Yuan Pro', version: 'GS', category: 'suv-compacto', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 265, refPriceNew: 182990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 7.06, roadKmKWh: 7.06 }, insuranceRate: 0.048, maintenanceBase: 1000, fipe: { brand: 'byd', include: ['yuan', 'pro'] } },

  // SUV médio
  { id: 'toyota-corolla-cross', infoId: 'toyota-corolla-cross-hybrid', since: 2022, brand: 'Toyota', model: 'Corolla Cross', version: 'XRE 2.0', category: 'suv-medio', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 440, refPriceNew: 194790, consumption: flex(10.5, 12.6, 7.3, 8.8), fipe: { brand: 'toyota', include: ['corolla', 'cross', 'xre'] } },
  { id: 'toyota-corolla-cross-hybrid', since: 2022, brand: 'Toyota', model: 'Corolla Cross', version: 'XRX Hybrid Premium', category: 'suv-medio', powertrain: 'hibrido', transmission: 'automatico', seats: 5, trunkL: 440, refPriceNew: 223790, consumption: flex(17.8, 14.7, 11.8, 9.7), maintenanceBase: 2600, fipe: { brand: 'toyota', include: ['corolla', 'cross', 'xrx', 'hybrid|hibrido'] } },
  { id: 'toyota-corolla-cross-xrv-hybrid', infoId: 'toyota-corolla-cross-hybrid', since: 2027, brand: 'Toyota', model: 'Corolla Cross', version: 'XRV Hybrid', category: 'suv-medio', powertrain: 'hibrido', transmission: 'automatico', seats: 5, trunkL: 440, refPriceNew: 213990, consumption: flex(17.8, 14.7, 11.8, 9.7), maintenanceBase: 2600, fipe: { brand: 'toyota', include: ['corolla', 'cross', 'xrv', 'hybrid|hibrido'] } },
  { id: 'vw-taos', since: 2022, brand: 'Volkswagen', model: 'Taos', version: 'Highline 250 TSI', category: 'suv-medio', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 498, refPriceNew: 219990, consumption: { cityKmL: 11.1, roadKmL: 13.3, cityKmLEthanol: 7.7, roadKmLEthanol: 9.3 }, fipe: { brand: 'volkswagen', include: ['taos', 'highline'] } },
  { id: 'honda-zrv', since: 2024, brand: 'Honda', model: 'ZR-V', version: 'Touring 2.0', category: 'suv-medio', powertrain: 'gasolina', transmission: 'automatico', seats: 5, trunkL: 389, refPriceNew: 214500, consumption: { cityKmL: 10.2, roadKmL: 12.1 }, fipe: { brand: 'honda', include: ['zr-v'] } },
  { id: 'byd-yuan-plus', since: 2023, brand: 'BYD', model: 'Yuan Plus', version: 'EV', category: 'suv-medio', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 490, refPriceNew: 269990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 6.21, roadKmKWh: 6.21 }, insuranceRate: 0.048, maintenanceBase: 1100, fipe: { brand: 'byd', include: ['yuan', 'plus'] } },
  { id: 'jeep-compass', since: 2017, brand: 'Jeep', model: 'Compass', version: 'Longitude T270', category: 'suv-medio', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 410, refPriceNew: 199890, consumption: flex(10.1, 12.1, 7.3, 8.6), fipe: { brand: 'jeep', include: ['compass', 'longitude'], exclude: ['diesel', '4x4', 'hybrid'] } },
  { id: 'byd-song-pro-gl', infoId: 'byd-song-pro', since: 2025, brand: 'BYD', model: 'Song Pro', version: 'GL (plug-in, flex)', category: 'suv-medio', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 530, refPriceNew: 176990, consumption: { cityKmL: 16.0, roadKmL: 13.9, cityKmLEthanol: 12.1, roadKmLEthanol: 10.7, cityKmKWh: 4.35, roadKmKWh: 4.35 }, consumptionHistory: [{ untilModelYear: 2026, consumption: { cityKmL: 14.8, roadKmL: 12.6, cityKmKWh: 3.8, roadKmKWh: 3.8 } }], insuranceRate: 0.046, maintenanceBase: 1800, estimated: ['consumo elétrico (4,35 km/kWh = 57 km ÷ 13,1 kWh; seminovos 2025/26: 49 km ÷ 12,9 kWh)'], fipe: { brand: 'byd', include: ['song', 'pro', 'gl'] } },
  { id: 'byd-song-pro', since: 2025, brand: 'BYD', model: 'Song Pro', version: 'GS (plug-in, flex)', category: 'suv-medio', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 530, refPriceNew: 199990, consumption: { cityKmL: 15.9, roadKmL: 13.5, cityKmLEthanol: 11.7, roadKmLEthanol: 10.5, cityKmKWh: 3.93, roadKmKWh: 3.93 }, consumptionHistory: [{ untilModelYear: 2026, consumption: { cityKmL: 14.8, roadKmL: 12.0, cityKmKWh: 3.39, roadKmKWh: 3.39 } }], insuranceRate: 0.046, maintenanceBase: 1800, estimated: ['consumo elétrico (3,93 km/kWh = 72 km ÷ 18,3 kWh; seminovos 2025/26: 62 km ÷ 18,3 kWh)'], fipe: { brand: 'byd', include: ['song', 'pro', 'gs'] } },
  { id: 'jaecoo-7-phev', since: 2026, brand: 'Jaecoo', model: '7 PHEV', version: 'Elite 1.5 TGDI PHEV', category: 'suv-medio', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 500, refPriceNew: 189990, consumption: { cityKmL: 15.1, roadKmL: 13.5, cityKmKWh: 4.3, roadKmKWh: 4.3 }, insuranceRate: 0.045, maintenanceBase: 2000, estimated: ['consumo elétrico (4,3 km/kWh = 79 km ÷ 18,3 kWh)'], fipe: { brand: 'jaecoo', include: ['7'], exclude: ['5', '8'] } },
  { id: 'geely-ex5-em-i', since: 2026, brand: 'Geely', model: 'EX5 EM-i', version: 'Pro', category: 'suv-medio', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 428, refPriceNew: 199990, consumption: { cityKmL: 14.8, roadKmL: 13.1, cityKmKWh: 3.5, roadKmKWh: 3.5 }, insuranceRate: 0.045, maintenanceBase: 2000, estimated: ['consumo elétrico (3,5 km/kWh = 65 km ÷ 18,4 kWh)', 'preço pode ser o promocional (R$ 189.990) na concessionária'], fipe: { brand: 'geely', include: ['ex5', 'em-i'] } },
  { id: 'gwm-haval-h6', since: 2023, brand: 'GWM', model: 'Haval H6', version: 'HEV2 Flex', category: 'suv-medio', powertrain: 'hibrido', transmission: 'automatico', seats: 5, trunkL: 560, refPriceNew: 225000, consumption: { cityKmL: 15.8, roadKmL: 13.0 }, insuranceRate: 0.042, maintenanceBase: 2600, estimated: ['consumo com etanol não considerado (só o urbano, 10,2 km/l, foi encontrado)'], fipe: { brand: 'gwm', include: ['h6', 'hev|hev2'], exclude: ['phev', 'phev19', 'phev35', 'gt'] } },
  { id: 'gwm-haval-h6-phev', since: 2023, brand: 'GWM', model: 'Haval H6', version: 'PHEV35 Flex', category: 'suv-medio', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 560, refPriceNew: 290000, consumption: { cityKmL: 10.7, roadKmL: 10.7, cityKmKWh: 3.6, roadKmKWh: 3.6 }, insuranceRate: 0.042, maintenanceBase: 2400, estimated: ['consumo elétrico (3,6 km/kWh = 126 km ÷ 35 kWh)', 'consumo a gasolina na cidade (usado o da estrada, 10,7 km/l; o urbano publicado mistura uso elétrico)'], fipe: { brand: 'gwm', include: ['h6', 'phev35|phev'], exclude: ['gt'] } },

  // SUV grande
  { id: 'byd-song-plus', since: 2023, brand: 'BYD', model: 'Song Plus', version: '1.5 turbo DM-i (plug-in)', category: 'suv-grande', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 574, refPriceNew: 249990, consumption: { cityKmL: 14.9, roadKmL: 12.1, cityKmKWh: 3.72, roadKmKWh: 3.72 }, consumptionHistory: [{ untilModelYear: 2024, consumption: { cityKmL: 15.1, roadKmL: 13.2, cityKmKWh: 3.72, roadKmKWh: 3.72 } }], insuranceRate: 0.045, maintenanceBase: 1900, estimated: ['consumo a gasolina da linha 2027 não publicado: usado o da 2025/26 (14,9/12,1 km/l)', 'consumo elétrico (3,72 km/kWh = 99 km ÷ 26,6 kWh)', 'seminovos 2023/24 tinham só 28 km de autonomia elétrica; o cálculo usa a mesma fração elétrica de todos os plug-in'], fipe: { brand: 'byd', include: ['song', 'plus'], exclude: ['premium'] } },
  { id: 'byd-sealion-7', since: 2026, brand: 'BYD', model: 'Sealion 7', version: 'AWD', category: 'suv-grande', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 500, refPriceNew: 339990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 4.36, roadKmKWh: 4.36 }, insuranceRate: 0.047, maintenanceBase: 1300, estimated: ['consumo (4,36 km/kWh = 360 km ÷ 82,5 kWh; MJ/km do PBEV não encontrado)'], fipe: { brand: 'byd', include: ['sealion'] } },
  { id: 'byd-atto-8', since: 2026, brand: 'BYD', model: 'Atto 8', version: 'AWD (plug-in, 7 lugares)', category: 'suv-grande', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 7, trunkL: 270, refPriceNew: 399990, consumption: { cityKmL: 11.4, roadKmL: 10.8, cityKmKWh: 3.12, roadKmKWh: 3.12 }, insuranceRate: 0.045, maintenanceBase: 2200, estimated: ['consumo elétrico (3,1 km/kWh, autonomia ÷ bateria)'], fipe: { brand: 'byd', include: ['atto'] } },
  { id: 'toyota-rav4-hybrid', since: 2026, brand: 'Toyota', model: 'RAV4', version: 'SX Hybrid', category: 'suv-grande', powertrain: 'hibrido', transmission: 'automatico', seats: 5, trunkL: 456, refPriceNew: 349290, consumption: { cityKmL: 15.3, roadKmL: 14.1 }, maintenanceBase: 3000, fipe: { brand: 'toyota', include: ['rav4', 'hybrid|hibrido'] } },
  { id: 'jeep-commander', since: 2022, brand: 'Jeep', model: 'Commander', version: 'Overland T270 MHEV', category: 'suv-grande', powertrain: 'flex', transmission: 'automatico', seats: 7, trunkL: 661, refPriceNew: 283790, consumption: { cityKmL: 11.0, roadKmL: 11.2, cityKmLEthanol: 7.6, roadKmLEthanol: 8.1 }, fipe: { brand: 'jeep', include: ['commander', 'overland'], exclude: ['diesel', '4x4'] } },
  { id: 'jeep-commander-longitude', infoId: 'jeep-commander', since: 2022, brand: 'Jeep', model: 'Commander', version: 'Longitude T270', category: 'suv-grande', powertrain: 'flex', transmission: 'automatico', seats: 7, trunkL: 661, refPriceNew: 228790, consumption: flex(10.0, 11.4, 7.0, 8.2), fipe: { brand: 'jeep', include: ['commander', 'longitude'], exclude: ['diesel', '4x4'] } },

  // Picape
  { id: 'fiat-strada', since: 2021, brand: 'Fiat', model: 'Strada', version: 'Volcano CD 1.3', category: 'picape', powertrain: 'flex', transmission: 'manual', seats: 5, trunkL: 844, refPriceNew: 136490, consumption: { cityKmL: 12.4, roadKmL: 13.9, cityKmLEthanol: 8.9, roadKmLEthanol: 9.8 }, fipe: { brand: 'fiat', include: ['strada', 'volcano'] } },
  { id: 'byd-shark', since: 2025, brand: 'BYD', model: 'Shark', version: 'GS (plug-in)', category: 'picape', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 1200, refPriceNew: 344990, consumption: { cityKmL: 9.5, roadKmL: 7.7, cityKmKWh: 1.93, roadKmKWh: 1.93 }, insuranceRate: 0.045, maintenanceBase: 2600, estimated: ['consumo elétrico (1,9 km/kWh, autonomia ÷ bateria)', 'porta-malas = volume da caçamba em litros'], fipe: { brand: 'byd', include: ['shark'] } },
  { id: 'fiat-toro', since: 2016, brand: 'Fiat', model: 'Toro', version: 'Freedom 1.3T', category: 'picape', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 937, refPriceNew: 177490, consumption: { cityKmL: 9.4, roadKmL: 10.8, cityKmLEthanol: 6.8, roadKmLEthanol: 7.9 }, fipe: { brand: 'fiat', include: ['toro', 'freedom'], exclude: ['diesel'] } },
  // Marcas recentes no Brasil (pesquisa out/2026; consumos elétricos = autonomia ÷ bateria, estimados).
  { id: 'leapmotor-c10-reev', since: 2026, brand: 'Leapmotor', model: 'C10 REEV', version: 'Ultra-Híbrido 1.5 REEV', category: 'suv-medio', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 435, refPriceNew: 219990, consumption: { cityKmL: 12.0, roadKmL: 12.0, cityKmKWh: 3.9, roadKmKWh: 3.9 }, estimated: ['range-extender (REEV): motor a gasolina só gera energia; tratado como híbrido plug-in', 'consumo a gasolina (≈12 km/l médio, bateria descarregada: Motor Show/Grupo Sentinela; sem divisão cidade/estrada)', 'consumo elétrico (3,9 km/kWh = 111 km ÷ 28,4 kWh)', 'manutenção'], fipe: { brand: 'leapmotor', include: ['c10', 'hibrido|ultra-hibrido|reev'], exclude: ['eletrico'] } },
  { id: 'leapmotor-c10', since: 2026, brand: 'Leapmotor', model: 'C10', version: 'Elétrico BEV 69,9 kWh', category: 'suv-medio', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 465, refPriceNew: 204990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 4.8, roadKmKWh: 4.8 }, estimated: ['consumo elétrico (4,8 km/kWh = 338 km PBEV ÷ 69,9 kWh)', 'manutenção'], fipe: { brand: 'leapmotor', include: ['c10', 'eletrico'], exclude: ['hibrido', 'ultra-hibrido', 'reev'] } },
  { id: 'leapmotor-b10-reev', since: 2027, brand: 'Leapmotor', model: 'B10 REEV', version: 'Ultra-Híbrido 1.5 REEV', category: 'suv-medio', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 350, refPriceNew: 179990, consumption: { cityKmL: 13.5, roadKmL: 12.3, cityKmKWh: 3.6, roadKmKWh: 3.6 }, estimated: ['range-extender (REEV): motor a gasolina só gera energia; tratado como híbrido plug-in', 'consumo elétrico (3,6 km/kWh = 68 km ÷ 18,8 kWh)', 'manutenção', 'FIPE: modelo ainda não listado'], fipe: { brand: 'leapmotor', include: ['b10', 'hibrido|ultra-hibrido|reev'], exclude: ['eletrico'] } },
  { id: 'leapmotor-b10', since: 2026, brand: 'Leapmotor', model: 'B10', version: 'Elétrico 56,2 kWh', category: 'suv-medio', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 420, refPriceNew: 182990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 5.1, roadKmKWh: 5.1 }, estimated: ['consumo elétrico (5,1 km/kWh = 288 km PBEV ÷ 56,2 kWh)', 'porta-malas (≈420 L, blog de concessionária)', 'manutenção'], fipe: { brand: 'leapmotor', include: ['b10', 'eletrico'], exclude: ['hibrido', 'ultra-hibrido', 'reev'] } },
  { id: 'jetour-s06-phev', since: 2026, brand: 'Jetour', model: 'S06 PHEV', version: 'Advance 1.5 TGDI PHEV', category: 'suv-medio', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 416, refPriceNew: 199900, consumption: { cityKmL: 14.0, roadKmL: 12.6, cityKmKWh: 3.6, roadKmKWh: 3.6 }, estimated: ['consumo elétrico (3,6 km/kWh = 70 km ÷ 19,43 kWh)', 'manutenção'], fipe: { brand: 'jetour', include: ['s06', 'advance'] } },
  { id: 'jetour-t1-phev', since: 2026, brand: 'Jetour', model: 'T1 PHEV', version: 'Advance 1.5 TGDI PHEV', category: 'suv-medio', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 574, refPriceNew: 249900, consumption: { cityKmL: 13.6, roadKmL: 12.2, cityKmKWh: 3.3, roadKmKWh: 3.3 }, estimated: ['consumo elétrico (3,3 km/kWh = 88 km ÷ 26,7 kWh)', 'preço (derivado da venda direta R$ 224.910 = -10% em out/2026)', 'manutenção'], fipe: { brand: 'jetour', include: ['t1', 'advance'] } },
  { id: 'jetour-t2-phev', since: 2026, brand: 'Jetour', model: 'T2 PHEV', version: 'Advance 1.5 TGDI PHEV 4x2', category: 'suv-grande', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 580, refPriceNew: 289900, consumption: { cityKmL: 11.4, roadKmL: 10.5, cityKmKWh: 2.8, roadKmKWh: 2.8 }, estimated: ['consumo elétrico (2,8 km/kWh = 75 km ÷ 26,7 kWh)', 'manutenção'], fipe: { brand: 'jetour', include: ['t2', 'advance'], exclude: ['xwd'] } },
  { id: 'mg-s5', since: 2026, brand: 'MG', model: 'S5', version: 'Comfort', category: 'suv-medio', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 453, refPriceNew: 218800, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 5.5, roadKmKWh: 5.5 }, maintenanceBase: 590, estimated: ['preço sugerido (R$ 218.800); oferta oficial de R$ 179.800 até 31/10/2026 e FIPE 0 km ~R$ 179.925 — atualize a FIPE', 'consumo elétrico (5,5 km/kWh = 351 km Inmetro ÷ 64 kWh; PBEV não publicado)', 'manutenção = média anual das 3 primeiras revisões a preço fixo (R$ 440 / 893 / 440, a cada 12 meses ou 24 mil km)'], fipe: { brand: 'mg', include: ['s5', 'comfort'] } },
  { id: 'gac-gs4-hev', since: 2026, brand: 'GAC', model: 'GS4 HEV', version: 'Premium 2.0 HEV', category: 'suv-medio', powertrain: 'hibrido', transmission: 'automatico', seats: 5, trunkL: 638, refPriceNew: 191990, consumption: { cityKmL: 14.1, roadKmL: 11.8 }, estimated: ['manutenção'], fipe: { brand: 'gac', include: ['gs4', 'premium'] } },
  { id: 'gac-aion-v', since: 2025, brand: 'GAC', model: 'Aion V', version: 'Elite', category: 'suv-medio', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 427, refPriceNew: 219990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 5.2, roadKmKWh: 5.2 }, estimated: ['consumo elétrico (5,2 km/kWh = 389 km Inmetro ÷ 75,3 kWh; PBEV não publicado)', 'manutenção'], fipe: { brand: 'gac', include: ['aion', 'v'], exclude: ['y', 'ut', 'es'] } },
  { id: 'gac-hyptec-ht', since: 2025, brand: 'GAC', model: 'Hyptec HT', version: 'Elite (83 kWh)', category: 'suv-grande', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 670, refPriceNew: 314990, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 5.2, roadKmKWh: 5.2 }, estimated: ['consumo elétrico (5,2 km/kWh = 431 km Inmetro ÷ 83 kWh; PBEV não publicado)', 'seminovos 2025/26 têm bateria de 72,7 kWh e 362 km (~5,0 km/kWh)', 'manutenção'], fipe: { brand: 'gac', include: ['hyptec', 'ht', 'elite'] } },
  { id: 'gac-gs9-phev', since: 2027, brand: 'GAC', model: 'GS9', version: 'Ultra 1.5 Turbo AWD (plug-in REEV, 6 lugares)', category: 'suv-grande', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 6, trunkL: 255, refPriceNew: 399990, consumption: { cityKmL: 12.7, roadKmL: 13.5, cityKmKWh: 2.6, roadKmKWh: 2.6 }, estimated: ['plug-in com extensor de autonomia (PHEV/REEV) tratado como hibrido-plugin', 'consumo a gasolina 12,7/13,5 km/l citado pela imprensa, não visto na tabela PBEV', 'consumo elétrico (2,6 km/kWh = 114 km ÷ 44,5 kWh)', 'manutenção'], fipe: { brand: 'gac', include: ['gs9'] } },
  { id: 'caoa-chery-tiggo-7-phev', since: 2025, brand: 'Caoa Chery', model: 'Tiggo 7 Pro PHEV', version: '1.5 TGDI PHEV DHT', category: 'suv-medio', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 484, refPriceNew: 209990, consumption: { cityKmL: 15.1, roadKmL: 13.5, cityKmKWh: 3.7, roadKmKWh: 3.7 }, estimated: ['consumo a gasolina sem recarga (Inmetro só divulgou o "equivalente" 38,6/30,3 km/l com bateria carregada; usado o do Jaecoo 7 PHEV, mesmo conjunto 1.5 TGDI + 204 cv + 18,4 kWh)', 'consumo elétrico (3,7 km/kWh = 68 km ÷ 18,4 kWh)', 'manutenção'], fipe: { brand: 'caoa chery', include: ['tiggo', '7', 'pro', 'turbo', 'hibrido'], exclude: ['max', 'drive'] } },
  { id: 'caoa-chery-tiggo-8-phev', since: 2024, brand: 'Caoa Chery', model: 'Tiggo 8 Pro PHEV', version: '1.5 TGDI PHEV DHT 7 lugares', category: 'suv-grande', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 7, trunkL: 193, refPriceNew: 249990, consumption: { cityKmL: 14.0, roadKmL: 11.9, cityKmKWh: 3.8, roadKmKWh: 3.8 }, estimated: ['consumo a gasolina sem recarga (Inmetro só divulgou o "equivalente" 36,1/29,6 km/l com bateria carregada; usado o do Omoda 7 SHS-P, mesmo conjunto — o Tiggo 8 de 7 lugares deve gastar mais)', 'consumo elétrico (3,8 km/kWh = 70 km ÷ 18,4 kWh)', 'since 2024 pela listagem FIPE (geração anterior de 317 cv)', 'manutenção'], fipe: { brand: 'caoa chery', include: ['tiggo', '8', 'pro', 'turbo', 'hibrido'], exclude: ['max', 'drive', 'tgdi'] } },
  { id: 'omoda-7-phev', since: 2026, brand: 'Omoda', model: '7 PHEV', version: 'Luxury 1.5 TGDI SHS-P', category: 'suv-medio', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 590, refPriceNew: 254990, consumption: { cityKmL: 14.0, roadKmL: 11.9, cityKmKWh: 3.3, roadKmKWh: 3.3 }, estimated: ['consumo elétrico (3,3 km/kWh = 60 km ÷ 18,4 kWh)', 'ordem cidade/estrada do consumo a gasolina diverge entre fontes (14,0/11,9 x 11,9/14,0)', 'preço pode ser o promocional (R$ 244.990) no site oficial', 'manutenção'], fipe: { brand: 'omoda', include: ['7'], exclude: ['5', 'e5'] } },
  { id: 'jaecoo-5-hev', since: 2027, brand: 'Jaecoo', model: '5 HEV', version: 'Comfort 1.5 TGDI HEV', category: 'suv-compacto', powertrain: 'hibrido', transmission: 'automatico', seats: 5, trunkL: 410, refPriceNew: 159990, consumption: { cityKmL: 15.5, roadKmL: 13.7 }, estimated: ['preço pode ser o do lote de lançamento (R$ 154.990, 3.600 unidades)', 'modelo ainda sem FIPE (lançado em out/2026) — regra FIPE provisória', 'manutenção'], fipe: { brand: 'jaecoo', include: ['5'], exclude: ['7', '8'] } },
  { id: 'geely-ex5', since: 2026, brand: 'Geely', model: 'EX5', version: 'Pro (elétrico)', category: 'suv-medio', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 461, refPriceNew: 207800, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 5.8, roadKmKWh: 5.8 }, estimated: ['consumo elétrico (5,8 km/kWh = 349 km PBEV ÷ 60,22 kWh; km/kWh oficial não encontrado)', 'preço pode ser o com bônus (R$ 197.800) no site oficial', 'manutenção'], fipe: { brand: 'geely', include: ['ex5', 'eletrico'], exclude: ['em-i'] } },
  { id: 'gwm-tank-300', since: 2025, brand: 'GWM', model: 'Tank 300', version: '2.0 Hi4-T PHEV Flex 4x4', category: 'suv-grande', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 360, refPriceNew: 342000, consumption: { cityKmL: 7.5, roadKmL: 7.6, cityKmLEthanol: 5.4, roadKmLEthanol: 5.7, cityKmKWh: 2.0, roadKmKWh: 2.0 }, estimated: ['consumo elétrico (2,0 km/kWh = 74 km ÷ 37,1 kWh)', 'consumo híbrido sem carga só no Car.blog.br (combinado com elétrico: 18,3/18,8 km/l G)', 'manutenção'], fipe: { brand: 'gwm', include: ['tank', '300'] } },
  { id: 'zeekr-x', since: 2025, brand: 'Zeekr', model: 'X', version: 'Premium RWD (elétrico)', category: 'suv-compacto', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 362, refPriceNew: 298000, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 5.0, roadKmKWh: 5.0 }, estimated: ['consumo (5,0 km/kWh = 332 km PBEV ÷ 66 kWh; MJ/km do PBEV não encontrado; algumas fontes dizem bateria de 51 kWh)', 'manutenção'], fipe: { brand: 'zeekr', include: ['x', 'premium'] } },
  { id: 'zeekr-7x', since: 2026, brand: 'Zeekr', model: '7X', version: 'Premium RWD (elétrico)', category: 'suv-grande', powertrain: 'eletrico', transmission: 'automatico', seats: 5, trunkL: 539, refPriceNew: 378000, consumption: { cityKmL: 0, roadKmL: 0, cityKmKWh: 4.91, roadKmKWh: 4.91 }, estimated: ['consumo (4,91 km/kWh = 491 km PBEV ÷ 100 kWh; MJ/km do PBEV não encontrado)', 'manutenção', 'FIPE só tem a Flagship AWD (seminovos 2026 são Flagship, mais cara)'], fipe: { brand: 'zeekr', include: ['7x'] } },
  { id: 'denza-b5', since: 2026, brand: 'Denza', model: 'B5', version: 'GS 1.5 Turbo PHEV 4WD', category: 'suv-grande', powertrain: 'hibrido-plugin', transmission: 'automatico', seats: 5, trunkL: 470, refPriceNew: 449000, consumption: { cityKmL: 8.4, roadKmL: 7.9, cityKmKWh: 2.33, roadKmKWh: 2.33 }, estimated: ['consumo elétrico (2,33 km/kWh = 74 km ÷ 31,8 kWh; o PBEV não publica km/kWh de plug-in)', 'manutenção', 'preço da GS (R$ 449 mil) pela imprensa; GL de entrada custa R$ 405 mil'], fipe: { brand: 'denza', include: ['b5'], exclude: ['gl'] } },
  { id: 'changan-uni-t', since: 2026, brand: 'Caoa Changan', model: 'Uni-T', version: 'Infinity 1.5 TGDi flex', category: 'suv-medio', powertrain: 'flex', transmission: 'automatico', seats: 5, trunkL: 425, refPriceNew: 174990, consumption: { cityKmL: 10.5, roadKmL: 12.4, cityKmLEthanol: 7.3, roadKmLEthanol: 8.7 }, estimated: ['manutenção', 'porta-malas (425 L na maioria das fontes; 332 L e 350 L em outras)'], fipe: { brand: 'caoa changan', include: ['uni-t'] } },
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

export const TRANSMISSION_LABEL: Record<Transmission, string> = {
  manual: 'Manual',
  automatico: 'Automático',
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
