import { money } from '../lib/format'
import { paths } from '../lib/router'
import type { Horizon, ScenarioResult } from '../lib/types'

const YEAR = new Date().getFullYear()

/** Resumo da comparação no painel: custo por mês de cada opção em barras e o atalho para a página detalhada. */
export function ComparePreview({
  keep,
  results,
  compare,
  colors,
  horizon,
  max,
  onToggle,
}: {
  keep?: ScenarioResult
  results: ScenarioResult[]
  compare: string[]
  colors: Record<string, string>
  horizon: Horizon
  max: number
  onToggle: (id: string) => void
}) {
  const chosen = compare.map((id) => results.find((r) => r.scenario.id === id)).filter((r): r is ScenarioResult => !!r)
  const rows = [...(keep ? [keep] : []), ...chosen]
  const top = Math.max(1, ...rows.map((r) => r.horizons[horizon].monthly))
  const label = (r: ScenarioResult) =>
    r.scenario.kind === 'keep'
      ? 'Manter o seu carro'
      : `${r.scenario.label} ${r.scenario.kind === 'subscription' ? '(assinatura)' : r.scenario.ageAtStart === 0 ? '0 km' : YEAR - r.scenario.ageAtStart}`

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Comparação</h2>
          <p className="mt-0.5 text-sm text-ink-2">
            {chosen.length} de {max} opções · custo por mês em {horizon} {horizon === 1 ? 'ano' : 'anos'}
          </p>
        </div>
        <a href={paths.compare(compare)} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink hover:opacity-90">
          Comparação detalhada →
        </a>
      </header>
      {chosen.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">Toque em + nas opções acima para comparar com o seu carro.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const isKeep = r.scenario.kind === 'keep'
            const h = r.horizons[horizon]
            return (
              <li key={r.scenario.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: isKeep ? 'var(--ink-2)' : colors[r.scenario.id] }} aria-hidden />
                  <span className="truncate font-medium">{label(r)}</span>
                  {!isKeep && (
                    <button type="button" onClick={() => onToggle(r.scenario.id)} aria-label={`Remover ${label(r)}`} className="shrink-0 rounded px-1 text-muted hover:text-ink">
                      ×
                    </button>
                  )}
                </span>
                <span className="text-right text-sm font-semibold tabular">
                  {money(h.monthly)}
                  {!isKeep && (
                    <span className={`ml-2 text-xs font-normal ${h.savingsVsKeep > 0 ? 'text-good' : 'text-bad'}`}>
                      {h.savingsVsKeep > 0 ? '▲' : '▼'} {money(Math.abs(h.savingsVsKeep))}
                    </span>
                  )}
                </span>
                <span className="col-span-2 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                  <span
                    className="block h-full rounded-full transition-[width] duration-300"
                    style={{ width: `${(h.monthly / top) * 100}%`, background: isKeep ? 'var(--ink-2)' : colors[r.scenario.id] }}
                  />
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
