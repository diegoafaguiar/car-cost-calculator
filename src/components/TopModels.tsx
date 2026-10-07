import { CATALOG, CATEGORY_LABEL, POWERTRAIN_LABEL } from '../lib/catalog'
import { money } from '../lib/format'
import { MODEL_INFO } from '../lib/modelInfo'
import type { Horizon, ScenarioResult } from '../lib/types'
import { Badge, Card } from './ui'
import { WikiImage } from './WikiImage'

/** Os 10 modelos mais bem colocados (melhor forma de cada um), com foto e link para a ficha. */
export function TopModels({ ranked, horizon }: { ranked: ScenarioResult[]; horizon: Horizon }) {
  const seen = new Set<string>()
  const top: ScenarioResult[] = []
  for (const r of ranked) {
    const id = r.scenario.modelId
    const family = CATALOG.find((m) => m.id === id)?.infoId ?? id
    if (!id || !family || r.scenario.kind === 'subscription' || r.scenario.kind === 'keep' || seen.has(family)) continue
    seen.add(family)
    top.push(r)
    if (top.length === 10) break
  }
  if (!top.length) return null

  return (
    <Card
      title="Top 10 modelos"
      subtitle={`A melhor forma de ter cada modelo em ${horizon} ${horizon === 1 ? 'ano' : 'anos'}. Abra a ficha para ver versões, destaques e a comparação com o seu carro.`}
    >
      <ol className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-5">
        {top.map((r, i) => {
          const m = CATALOG.find((x) => x.id === r.scenario.modelId)!
          const info = MODEL_INFO[m.infoId ?? m.id]
          const s = r.horizons[horizon].savingsVsKeep
          return (
            <li key={m.id} className="w-56 shrink-0 snap-start sm:w-auto">
              <a
                href={`#/carro/${m.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:border-accent/50 hover:shadow-card"
              >
                <div className="relative">
                  {info?.wikipedia ? (
                    <WikiImage compact lang={info.wikipedia.lang} title={info.wikipedia.title} alt={`${m.brand} ${m.model}`} />
                  ) : (
                    <div className="aspect-[16/10] bg-surface-2" />
                  )}
                  <span className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-semibold text-white tabular">
                    {i + 1}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <span className="font-semibold leading-tight group-hover:text-accent">
                    {m.brand} {m.model}
                  </span>
                  <span className="text-xs text-ink-2">{r.scenario.detail.split(' · ').pop()}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    <Badge>{CATEGORY_LABEL[m.category]}</Badge>
                    <Badge>{POWERTRAIN_LABEL[m.powertrain]}</Badge>
                  </span>
                  <span className="mt-auto pt-3">
                    <span className="block text-sm font-semibold tabular">{money(r.horizons[horizon].monthly)}/mês</span>
                    <span className={`block text-xs tabular ${s > 0 ? 'text-good' : 'text-bad'}`}>
                      {s > 0 ? '▲ ' : '▼ '}
                      {money(Math.abs(s))} vs. manter
                    </span>
                    {!info && <span className="mt-1 block text-[11px] text-muted">Ficha ainda não pesquisada</span>}
                  </span>
                </div>
              </a>
            </li>
          )
        })}
      </ol>
      <p className="mt-2 text-xs text-muted">Fotos ilustrativas da Wikimedia Commons, via Wikipédia.</p>
    </Card>
  )
}
