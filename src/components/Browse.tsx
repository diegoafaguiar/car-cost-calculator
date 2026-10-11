import { useState, type ReactNode } from 'react'
import { CATEGORY_LABEL, POWERTRAIN_LABEL, TRANSMISSION_LABEL } from '../lib/catalog'
import { money } from '../lib/format'
import { MODEL_INFO } from '../lib/modelInfo'
import { paths } from '../lib/router'
import { comfortScore, featuresFor, safetyScore, techScore } from '../lib/scores'
import type { CatalogModel, Horizon, ScenarioResult } from '../lib/types'
import { Badge } from './ui'
import { WikiImage } from './WikiImage'

const YEAR = new Date().getFullYear()

/** Trilha de navegação (Início › Marcas › BYD). O último item é a página atual. */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Você está em" className="text-sm text-ink-2">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden className="text-muted">›</span>}
            {it.href ? (
              <a href={it.href} className="hover:text-ink hover:underline">
                {it.label}
              </a>
            ) : (
              <span aria-current="page" className="font-medium text-ink">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** Compartilha o link da página: menu nativo no celular, cópia para a área de transferência no computador. */
export function ShareButton({ title, text }: { title: string; text?: string }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch {
        // Cancelado pelo usuário: cai para a cópia.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copie o link:', url)
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-2"
      aria-live="polite"
    >
      <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
        <path d="M10 3v9M6.5 6.5L10 3l3.5 3.5M4 11v4.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {copied ? 'Link copiado' : 'Compartilhar'}
    </button>
  )
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: ReactNode; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold tracking-wide text-accent uppercase">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-3xl text-sm text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

const fmtScore = (v: number | null) => (v === null ? '—' : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }))

/** Cartão de um modelo do catálogo, com o custo para o usuário (melhor ano) e as notas. */
export function CarCard({ model, best, keep, horizon }: { model: CatalogModel; best?: ScenarioResult; keep?: ScenarioResult; horizon: Horizon }) {
  const info = MODEL_INFO[model.infoId ?? model.id]
  const f = featuresFor(model.id)
  const scores: [string, number | null][] = [
    ['Segurança', safetyScore(f).value],
    ['Tecnologia', techScore(f).value],
    ['Conforto', comfortScore(f, model.id).value],
  ]
  const h = best?.horizons[horizon]
  const bestYear = best ? (best.scenario.ageAtStart === 0 ? '0 km' : `seminovo ${YEAR - best.scenario.ageAtStart}`) : null
  return (
    <a
      href={paths.car(model.id)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-[border-color,box-shadow] hover:border-accent/40 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="p-2 pb-0">
        <WikiImage compact deferred lang={info?.wikipedia?.lang} title={info?.wikipedia?.title} fallbackQuery={`${model.brand} ${model.model}`} alt={`${model.brand} ${model.model}`} />
      </div>
      <div className="flex flex-1 flex-col p-4 pt-3">
        <p className="text-xs font-medium text-muted">{model.brand}</p>
        <h3 className="font-semibold tracking-tight group-hover:text-accent">{model.model}</h3>
        <p className="line-clamp-1 text-xs text-ink-2">{model.version}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <Badge>{CATEGORY_LABEL[model.category]}</Badge>
          <Badge>{POWERTRAIN_LABEL[model.powertrain]}</Badge>
          <Badge>{TRANSMISSION_LABEL[model.transmission]}</Badge>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-3 text-sm">
          <div>
            <dt className="text-xs text-muted">0 km a partir de</dt>
            <dd className="font-semibold tabular">{money(model.refPriceNew)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Para você ({horizon}a)</dt>
            <dd className="font-semibold tabular">{h ? `${money(h.monthly)}/mês` : '—'}</dd>
            {h && keep && (
              <dd className={`text-[11px] tabular ${h.savingsVsKeep > 0 ? 'text-good' : 'text-ink-2'}`}>
                {bestYear} · {h.savingsVsKeep > 0 ? '▲' : '▼'} {money(Math.abs(h.savingsVsKeep))}
              </dd>
            )}
          </div>
        </dl>
        <dl className="mt-auto flex justify-between gap-2 pt-3 text-[11px] text-ink-2">
          {scores.map(([k, v]) => (
            <div key={k}>
              <dt className="text-muted">{k}</dt>
              <dd className="font-semibold text-ink tabular">{fmtScore(v)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </a>
  )
}

export function CarGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
}
