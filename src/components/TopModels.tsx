import { CATALOG } from '../lib/catalog'
import { money } from '../lib/format'
import { MODEL_INFO } from '../lib/modelInfo'
import type { Horizon, ScenarioResult } from '../lib/types'
import { Badge, Card } from './ui'

/** Os 10 modelos mais bem colocados (melhor forma de cada um), com link para a ficha. */
export function TopModels({ ranked, horizon }: { ranked: ScenarioResult[]; horizon: Horizon }) {
  const seen = new Set<string>()
  const top: ScenarioResult[] = []
  for (const r of ranked) {
    const id = r.scenario.modelId
    if (!id || r.scenario.kind === 'subscription' || r.scenario.kind === 'keep' || seen.has(id)) continue
    seen.add(id)
    top.push(r)
    if (top.length === 10) break
  }
  if (!top.length) return null

  return (
    <Card
      title="Top 10 modelos — fichas e análise"
      subtitle={`Melhor forma de ter cada modelo em ${horizon} ${horizon === 1 ? 'ano' : 'anos'}. Abra a ficha para ver versões, destaques, fotos e a comparação com o seu carro.`}
    >
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {top.map((r, i) => {
          const m = CATALOG.find((x) => x.id === r.scenario.modelId)!
          const info = MODEL_INFO[m.infoId ?? m.id]
          const s = r.horizons[horizon].savingsVsKeep
          return (
            <li key={m.id}>
              <a href={`#/carro/${m.id}`} className="block h-full rounded-lg border border-line p-3 transition-colors hover:border-accent">
                <span className="text-xs text-muted tabular">#{i + 1}</span>
                <span className="block font-semibold">
                  {m.brand} {m.model}
                </span>
                <span className="block text-xs text-ink-2">{r.scenario.detail.split(' · ').pop()}</span>
                <span className="mt-1 block text-sm tabular">{money(r.horizons[horizon].monthly)}/mês</span>
                <span className={`block text-xs tabular ${s > 0 ? 'text-good' : 'text-bad'}`}>
                  {s > 0 ? '▲ ' : '▼ '}
                  {money(Math.abs(s))} vs. manter
                </span>
                <span className="mt-2 block">
                  {info ? <Badge tone="good">Ficha verificada</Badge> : <Badge tone="warn">Sem ficha</Badge>}
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
