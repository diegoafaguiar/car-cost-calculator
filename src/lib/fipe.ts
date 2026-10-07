import { normalize, parseBrl } from './format'
import type { CatalogModel, FipeQuery } from './types'

/** API pública da FIPE mantida pela Parallelum (https://fipe.parallelum.com.br). */
const BASE = 'https://fipe.parallelum.com.br/api/v2/cars'
const TTL_MS = 7 * 24 * 60 * 60 * 1000
const MAX_PARALLEL = 3

export interface FipeItem {
  code: string
  name: string
}

export interface FipePrice {
  price: number
  brand: string
  model: string
  modelYear: number
  fuel: string
  codeFipe: string
  referenceMonth: string
}

export class FipeError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let token = ''
export function setFipeToken(t: string) {
  token = t.trim()
}

const inflight = new Map<string, Promise<unknown>>()
let active = 0
const waiting: (() => void)[] = []

async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_PARALLEL) await new Promise<void>((r) => waiting.push(r))
  active++
  try {
    return await fn()
  } finally {
    active--
    waiting.shift()?.()
  }
}

function readCache<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return undefined
    const { t, data } = JSON.parse(raw) as { t: number; data: T }
    return Date.now() - t < TTL_MS ? data : undefined
  } catch {
    return undefined
  }
}

function writeCache(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), data }))
  } catch {
    // Armazenamento cheio ou bloqueado: segue sem cache.
  }
}

async function get<T>(path: string): Promise<T> {
  const key = `fipe:v2:${path}`
  const cached = readCache<T>(key)
  if (cached !== undefined) return cached
  const pending = inflight.get(key)
  if (pending) return pending as Promise<T>

  const p = slot(async () => {
    let res: Response | undefined
    // Uma nova tentativa em falha de rede ou erro temporário do servidor (5xx).
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        res = await fetch(`${BASE}${path}`, {
          headers: token ? { 'X-Subscription-Token': token } : undefined,
        })
        if (res.status < 500) break
      } catch {
        res = undefined
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 800))
    }
    if (!res) throw new FipeError(0, 'Não foi possível conectar à API FIPE. Verifique sua conexão e tente de novo.')
    if (!res.ok) {
      const msg =
        res.status === 429
          ? 'Limite diário da API FIPE atingido. Informe um token gratuito em Premissas ou tente amanhã.'
          : `FIPE respondeu ${res.status}`
      throw new FipeError(res.status, msg)
    }
    const data = (await res.json()) as T
    writeCache(key, data)
    return data
  }).finally(() => inflight.delete(key))

  inflight.set(key, p)
  return p
}

export const getBrands = () => get<FipeItem[]>('/brands')
export const getModels = (brand: string) => get<FipeItem[]>(`/brands/${brand}/models`)
export const getYears = (brand: string, model: string) =>
  get<FipeItem[]>(`/brands/${brand}/models/${model}/years`)

export async function getPrice(brand: string, model: string, year: string): Promise<FipePrice> {
  const raw = await get<Record<string, unknown>>(`/brands/${brand}/models/${model}/years/${year}`)
  return {
    price: parseBrl(String(raw.price ?? '')),
    brand: String(raw.brand ?? ''),
    model: String(raw.model ?? ''),
    modelYear: Number(raw.modelYear ?? 0),
    fuel: String(raw.fuel ?? ''),
    codeFipe: String(raw.codeFipe ?? ''),
    referenceMonth: String(raw.referenceMonth ?? ''),
  }
}

/** Código de ano da FIPE para 0 km. */
export const ZERO_KM_YEAR = 32000

export const yearOf = (code: string) => Number.parseInt(code.split('-')[0], 10)

const words = (s: string) =>
  normalize(s)
    .split(/\s+/)
    .map((w) => w.replace(/^[(\[]+|[)\],]+$/g, '').replace(/\.$/, ''))
    .filter(Boolean)

export function matchesQuery(name: string, q: FipeQuery): boolean {
  const ws = new Set(words(name))
  const has = (t: string) => t.split('|').some((alt) => ws.has(alt))
  return q.include.every(has) && !(q.exclude ?? []).some(has)
}

export function findBrand(brands: FipeItem[], q: FipeQuery): FipeItem | undefined {
  const target = normalize(q.brand)
  return brands.find((b) => words(b.name).includes(target)) ?? brands.find((b) => normalize(b.name).includes(target))
}

export interface ResolvedPrice {
  price: number
  reference: string
  fipeName: string
  codeFipe: string
}

/** Override manual: versão FIPE escolhida pelo usuário para um modelo do catálogo. */
export interface FipeOverride {
  brandCode: string
  modelCode: string
  modelName: string
}

/**
 * Encontra o modelo do catálogo na FIPE e retorna o preço para o ano desejado
 * (`modelYear` = 0 para 0 km). Tenta as versões mais enxutas primeiro.
 */
export async function resolveCatalogPrice(
  m: CatalogModel,
  modelYear: number,
  override?: FipeOverride,
): Promise<ResolvedPrice | null> {
  let brandCode: string
  let candidates: FipeItem[]
  if (override) {
    brandCode = override.brandCode
    candidates = [{ code: override.modelCode, name: override.modelName }]
  } else {
    const brand = findBrand(await getBrands(), m.fipe)
    if (!brand) return null
    brandCode = brand.code
    candidates = (await getModels(brand.code))
      .filter((x) => matchesQuery(x.name, m.fipe))
      .sort((x, y) => x.name.length - y.name.length)
      .slice(0, 3)
  }

  const wanted = modelYear === 0 ? ZERO_KM_YEAR : modelYear
  for (const c of candidates) {
    const years = await getYears(brandCode, c.code)
    const year = years.find((y) => yearOf(y.code) === wanted)
    if (!year) continue
    const p = await getPrice(brandCode, c.code, year.code)
    if (p.price > 0) {
      return { price: p.price, reference: p.referenceMonth, fipeName: c.name, codeFipe: p.codeFipe }
    }
  }
  return null
}
