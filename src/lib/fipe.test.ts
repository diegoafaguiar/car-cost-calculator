import { afterEach, describe, expect, it, vi } from 'vitest'
import { CATALOG } from './catalog'
import { resolveCatalogPrice } from './fipe'

const routes: Record<string, unknown> = {
  '/brands': [{ code: '23', name: 'GM - Chevrolet' }, { code: '59', name: 'VW - VolksWagen' }],
  '/brands/23/models': [
    { code: '1', name: 'ONIX HATCH LTZ 1.0 12V Flex 5p Mec.' },
    { code: '2', name: 'ONIX HATCH LT 1.0 12V Flex 5p Mec.' },
    { code: '3', name: 'ONIX SEDAN Plus LT 1.0 12V TB Flex Aut.' },
  ],
  '/brands/23/models/2/years': [
    { code: '32000-1', name: '32000 Gasolina' },
    { code: '2024-1', name: '2024 Gasolina' },
  ],
  '/brands/23/models/2/years/2024-1': { price: 'R$ 78.900,00', referenceMonth: 'outubro de 2026', modelYear: 2024 },
}

afterEach(() => vi.unstubAllGlobals())

describe('matchesQuery', () => {
  it('reconhece "(Híbrido)" da FIPE', async () => {
    const { matchesQuery } = await import('./fipe')
    const cc = CATALOG.find((m) => m.id === 'toyota-corolla-cross-hybrid')!
    expect(matchesQuery('Corolla Cross XRX 1.8 16V Aut. (Híbrido)', cc.fipe)).toBe(true)
    expect(matchesQuery('Corolla Cross XRX 2.0 16V Flex Aut.', cc.fipe)).toBe(false)
  })
})

describe('resolveCatalogPrice', () => {
  it('encontra a versão certa e o ano pedido', async () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
    })
    vi.stubGlobal('fetch', async (url: string) => {
      const path = url.replace(/^.*\/cars/, '')
      const body = routes[path]
      return { ok: body !== undefined, status: body ? 200 : 404, json: async () => body }
    })
    const onix = CATALOG.find((m) => m.id === 'chevrolet-onix')!
    const r = await resolveCatalogPrice(onix, 2024)
    expect(r?.price).toBe(78900)
    expect(r?.fipeName).toContain('LT 1.0')
    expect(r?.reference).toBe('outubro de 2026')
  })
})
