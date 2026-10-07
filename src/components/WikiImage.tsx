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
export function WikiImage({ lang, title, alt }: { lang: string; title: string; alt: string }) {
  const [data, setData] = useState<Summary | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    fetchSummary(lang, title).then((d) => alive && setData(d))
    return () => {
      alive = false
    }
  }, [lang, title])

  if (data === undefined) return <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-surface-2" />
  if (!data?.image)
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl bg-surface-2 p-4 text-center text-sm text-muted">
        Imagem indisponível no momento.
      </div>
    )
  return (
    <figure>
      <img src={data.image} alt={alt} loading="lazy" className="aspect-[16/9] w-full rounded-xl bg-surface-2 object-cover" />
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
