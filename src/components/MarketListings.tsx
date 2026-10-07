import { useState } from 'react'
import { money } from '../lib/format'
import { marketYears, searchLinks } from '../lib/market'
import { Card } from './ui'

interface Props {
  modelIds: string[]
  brand: string
  model: string
  /** Ano destacado inicialmente (ex.: o do seminovo aberto). */
  initialYear?: number
  compact?: boolean
}

/** Anúncios pesquisados (amostra com data e link) e atalhos de busca nos marketplaces. */
export function MarketListings({ modelIds, brand, model, initialYear, compact }: Props) {
  const data = modelIds.flatMap((id) => marketYears(id)).sort((a, b) => b.modelYear - a.modelYear)
  const years = [...new Set(data.map((d) => d.modelYear))]
  const [year, setYear] = useState<number | undefined>(initialYear && years.includes(initialYear) ? initialYear : years[0])
  const current = data.filter((d) => d.modelYear === year)
  const links = searchLinks(brand, model, year)

  const body = (
    <div className="space-y-4">
      {years.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Ano-modelo">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                role="tab"
                aria-selected={y === year}
                onClick={() => setYear(y)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${y === year ? 'border-accent/40 bg-accent-soft text-accent' : 'border-line text-ink-2 hover:text-ink'}`}
              >
                {y}
              </button>
            ))}
          </div>
          {current.map((d) => (
            <div key={`${d.modelId}@${d.modelYear}`} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Fig label="Mediana dos anúncios" value={d.summary?.count ? money(d.summary.median) : '—'} />
                <Fig label="Faixa" value={d.summary?.count ? `${money(d.summary.min)} – ${money(d.summary.max)}` : '—'} />
                <Fig label="Anúncios na amostra" value={String(d.summary?.count ?? 0)} />
                <Fig
                  label="FIPE"
                  value={d.fipe?.price ? money(d.fipe.price) : '—'}
                  sub={d.fipe?.reference}
                />
              </div>
              {d.version && <p className="text-xs text-ink-2">Versão predominante: {d.version}</p>}
              {d.listings.length > 0 && (
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {d.listings.slice(0, compact ? 4 : 10).map((l, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="min-w-0">
                        <a href={l.url} target="_blank" rel="noreferrer" className="block truncate font-medium hover:underline">
                          {l.title}
                        </a>
                        <span className="block text-xs text-muted">
                          {l.source}
                          {l.km !== null && ` · ${l.km.toLocaleString('pt-BR')} km`}
                          {l.city && ` · ${l.city}`} · visto em {l.date}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold tabular">{money(l.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {d.notes && <p className="text-xs text-ink-2">{d.notes}</p>}
            </div>
          ))}
          <p className="text-xs text-muted">
            Amostra coletada em pesquisa na web (out/2026), não é uma consulta ao vivo: os anúncios podem ter sido vendidos ou
            alterados. Preço pedido costuma ser maior que o preço final de negociação.
          </p>
        </>
      ) : (
        <p className="text-sm text-ink-2">Ainda não há amostra de anúncios pesquisada para este modelo.</p>
      )}
      <div>
        <span className="mb-1.5 block text-xs font-medium text-ink-2">
          Ver anúncios atuais{year ? ` de ${year}` : ''} nos marketplaces
        </span>
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <a
              key={l.source}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface-2"
            >
              {l.source}
              <span aria-hidden>↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )

  if (compact) return body
  return (
    <Card title="Anúncios de seminovos" subtitle={`${brand} ${model} nos marketplaces`}>
      {body}
    </Card>
  )
}

function Fig({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-line p-2.5">
      <div className="text-[11px] text-ink-2">{label}</div>
      <div className="font-semibold tabular">{value}</div>
      {sub && <div className="text-[11px] text-muted">{sub}</div>}
    </div>
  )
}
