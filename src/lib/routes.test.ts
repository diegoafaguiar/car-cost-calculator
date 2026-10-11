import { describe, expect, it } from 'vitest'
// @ts-expect-error módulo JS do build, sem tipos
import { routeMeta, withMeta } from '../../scripts/route-meta.mjs'
import { BRANDS, brandBySlug } from './brands'
import { CATALOG } from './catalog'
import { brandSlug, parseRoute, paths } from './router'

describe('rotas', () => {
  it('interpreta caminhos e o ano do link', () => {
    expect(parseRoute('/')).toEqual({ name: 'home' })
    expect(parseRoute('/carros/')).toEqual({ name: 'cars' })
    expect(parseRoute('/carro/byd-dolphin', '?ano=2024')).toEqual({ name: 'car', id: 'byd-dolphin', year: 2024 })
    expect(parseRoute('/marca/caoa-changan')).toEqual({ name: 'brand', slug: 'caoa-changan' })
    expect(parseRoute('/xyz').name).toBe('notFound')
  })

  it('gera slugs de marca sem acento nem espaço', () => {
    expect(brandSlug('Citroën')).toBe('citroen')
    expect(brandSlug('Caoa Changan')).toBe('caoa-changan')
    expect(paths.brand('Caoa Chery')).toBe('/marca/caoa-chery')
  })

  it('toda marca tem página e slug único', () => {
    expect(new Set(BRANDS.map((b) => b.slug)).size).toBe(BRANDS.length)
    for (const b of BRANDS) expect(brandBySlug(b.slug)?.name).toBe(b.name)
  })

  it('o build gera metatags para todos os carros e marcas do catálogo', () => {
    const routes: { path: string; title: string; description: string }[] = routeMeta(process.cwd())
    const set = new Set(routes.map((r) => r.path))
    for (const m of CATALOG) expect(set.has(paths.car(m.id))).toBe(true)
    for (const b of BRANDS) expect(set.has(paths.brand(b.name))).toBe(true)
    expect(routes.length).toBe(CATALOG.length + BRANDS.length + 2)
    for (const r of routes) expect(r.description.length).toBeLessThanOrEqual(220)
  })

  it('substitui título, descrição e Open Graph no HTML', () => {
    const html = '<title>x</title><meta name="description" content="y" /><!-- og --><meta /><!-- /og -->'
    const out = withMeta(html, { title: 'A & "B"', description: 'C' })
    expect(out).toContain('<title>A &amp; &quot;B&quot;</title>')
    expect(out).toContain('og:description" content="C"')
  })
})
