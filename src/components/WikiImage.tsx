import { useEffect, useState } from 'react'

interface Summary {
  title: string
  image?: string
  page?: string
}

const cache = new Map<string, Promise<Summary | null>>()

function fetchSummary(lang: string, title: string) {
  const key = `${lang}:${title}`
  if (!cache.has(key)) {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`
    cache.set(
      key,
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) =>
          d
            ? {
                title: d.title as string,
                image: (d.originalimage?.source ?? d.thumbnail?.source) as string | undefined,
                page: d.content_urls?.desktop?.page as string | undefined,
              }
            : null,
        )
        .catch(() => null),
    )
  }
  return cache.get(key)!
}

/** Foto do artigo da Wikipédia (Wikimedia Commons), sempre com crédito e aviso de imagem ilustrativa. */
export function WikiImage({ lang, title, alt, compact }: { lang: string; title: string; alt: string; compact?: boolean }) {
  const [data, setData] = useState<Summary | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    fetchSummary(lang, title).then((d) => alive && setData(d))
    return () => {
      alive = false
    }
  }, [lang, title])

  const box = compact ? 'aspect-[16/10] rounded-lg' : 'aspect-[16/9] rounded-xl'
  if (data === undefined) return <div className={`${box} w-full animate-pulse bg-surface-2`} />
  if (!data?.image)
    return (
      <div className={`${box} flex w-full items-center justify-center bg-surface-2 p-4 text-center text-xs text-muted`}>
        <CarGlyph />
      </div>
    )
  if (compact)
    return (
      <img src={data.image} alt={alt} title={`Foto: Wikimedia Commons, via Wikipédia — ${data.title}`} loading="lazy" className={`${box} w-full bg-surface-2 object-cover`} />
    )
  return (
    <figure>
      <img src={data.image} alt={alt} loading="lazy" className={`${box} w-full bg-surface-2 object-cover`} />
      <figcaption className="mt-1 text-xs text-muted">
        Imagem ilustrativa (pode não corresponder ao ano/versão exatos). Foto: Wikimedia Commons, via{' '}
        <a href={data.page} target="_blank" rel="noreferrer" className="underline">
          Wikipédia — {data.title}
        </a>
        .
      </figcaption>
    </figure>
  )
}

function CarGlyph() {
  return (
    <svg viewBox="0 0 64 32" className="w-16 text-muted/60" aria-label="Imagem indisponível">
      <path d="M6 22l5-9a5 5 0 0 1 4.4-2.6h27.2A5 5 0 0 1 47 12.8L53 22v5a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2H17v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1z" fill="currentColor" />
    </svg>
  )
}
