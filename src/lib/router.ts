import { useEffect, useState } from 'react'
import { normalize } from './format'

/**
 * Roteador mínimo com a History API: URLs limpas (/carro/x, /marca/y) que podem ser compartilhadas.
 * Links internos são <a href="/..."> comuns; um único ouvinte intercepta o clique e evita recarregar a página.
 */

export type Route =
  | { name: 'home' }
  | { name: 'car'; id: string; year?: number }
  | { name: 'cars' }
  | { name: 'brand'; slug: string }
  | { name: 'brands' }
  | { name: 'notFound'; path: string }

export const brandSlug = (brand: string) =>
  normalize(brand)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const paths = {
  home: () => '/',
  cars: () => '/carros',
  car: (id: string, year?: number) => `/carro/${id}${year ? `?ano=${year}` : ''}`,
  brands: () => '/marcas',
  brand: (brand: string) => `/marca/${brandSlug(brand)}`,
}

export function parseRoute(pathname: string, search = ''): Route {
  const p = pathname.replace(/\/+$/, '') || '/'
  if (p === '/') return { name: 'home' }
  if (p === '/carros') return { name: 'cars' }
  if (p === '/marcas') return { name: 'brands' }
  let m = p.match(/^\/carro\/([\w-]+)$/)
  if (m) {
    const year = Number(new URLSearchParams(search).get('ano')) || undefined
    return { name: 'car', id: m[1], year }
  }
  m = p.match(/^\/marca\/([\w-]+)$/)
  if (m) return { name: 'brand', slug: m[1] }
  return { name: 'notFound', path: p }
}

const EVENT = 'app:navigate'

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === location.pathname + location.search) return
  // Guarda a rolagem da página atual para restaurar ao voltar.
  history.replaceState({ ...(history.state ?? {}), scrollY: window.scrollY }, '')
  if (opts.replace) history.replaceState({}, '', to)
  else history.pushState({}, '', to)
  window.dispatchEvent(new Event(EVENT))
  window.scrollTo(0, 0)
}

/** Converte links antigos (#/carro/x) para o caminho novo, sem recarregar. */
function upgradeHashUrl() {
  const m = location.hash.match(/^#\/(carro\/[\w-]+)?$/)
  if (m) history.replaceState({}, '', m[1] ? `/${m[1]}` : '/')
}

export function useRoute(): Route {
  const read = () => parseRoute(location.pathname, location.search)
  const [route, setRoute] = useState<Route>(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    upgradeHashUrl()
    return read()
  })

  useEffect(() => {
    const update = () => setRoute(read())
    const onPop = (e: PopStateEvent) => {
      update()
      const y = (e.state as { scrollY?: number } | null)?.scrollY
      // Espera a página renderizar antes de restaurar a rolagem.
      requestAnimationFrame(() => window.scrollTo(0, y ?? 0))
    }
    // Fase de captura: funciona mesmo em links dentro de elementos que param a propagação do clique.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a')
      if (!a || a.target || a.hasAttribute('download')) return
      const href = a.getAttribute('href')
      if (!href || !href.startsWith('/') || href.startsWith('//')) return
      e.preventDefault()
      navigate(href)
    }
    window.addEventListener(EVENT, update)
    window.addEventListener('popstate', onPop)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener(EVENT, update)
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  return route
}

/** Título e descrição da aba (o HTML pré-gerado já traz os mesmos valores para quem compartilha o link). */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
}
