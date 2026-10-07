import type { ReactNode } from 'react'
import { CATALOG, CATEGORY_LABEL, POWERTRAIN_LABEL } from '../lib/catalog'
import { money, money2, months, number } from '../lib/format'
import { MODEL_INFO, type ModelInfo } from '../lib/modelInfo'
import { energyCostPerKm } from '../lib/tco'
import type { Assumptions, Consumption, CurrentCar, Horizon, ScenarioResult } from '../lib/types'
import { HORIZONS } from '../lib/types'
import { BreakdownBars } from './BreakdownBars'
import { Badge, Card, Segmented } from './ui'
import { WikiImage } from './WikiImage'

interface Props {
  modelId: string
  results: ScenarioResult[]
  ranked: ScenarioResult[]
  keep?: ScenarioResult
  horizon: Horizon
  onHorizon: (h: Horizon) => void
  assumptions: Assumptions
  car: CurrentCar
}

const yearsLabel = (h: number) => `${h} ${h === 1 ? 'ano' : 'anos'}`

/** Página de detalhes de um modelo: ficha pesquisada (com fontes) + análise comparativa calculada. */
export function ModelPage({ modelId, results, ranked, keep, horizon, onHorizon, assumptions: a, car }: Props) {
  const model = CATALOG.find((m) => m.id === modelId)
  if (!model) {
    return (
      <Card title="Modelo não encontrado">
        <a href="#/" className="text-accent underline">
          Voltar ao painel
        </a>
      </Card>
    )
  }
  const info = MODEL_INFO[model.infoId ?? modelId]
  const mine = car.catalogModelId ? MODEL_INFO[car.catalogModelId] : undefined
  // Todas as versões do catálogo que compartilham esta ficha (ex.: Song Pro GL e GS).
  const family = new Set(CATALOG.filter((m) => (m.infoId ?? m.id) === (model.infoId ?? model.id)).map((m) => m.id))
  const versionOf = (id?: string) => CATALOG.find((m) => m.id === id)?.version ?? ''
  const options = results
    .filter((r) => family.has(r.scenario.modelId ?? '') && (r.scenario.kind === 'new' || r.scenario.kind === 'used'))
    .sort((x, y) => x.scenario.ageAtStart - y.scenario.ageAtStart || x.scenario.price - y.scenario.price)
  const rankOf = (r: ScenarioResult) => ranked.findIndex((x) => x.scenario.id === r.scenario.id) + 1
  const best = [...options].sort((x, y) => x.horizons[horizon].total - y.horizons[horizon].total)[0]
  const leader = ranked.find((r) => r.scenario.kind !== 'keep')
  const anyEstimated = options.some((o) => o.scenario.priceSource === 'estimado')

  return (
    <div className="space-y-6">
      <a href="#/" className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
        ← Voltar ao ranking
      </a>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          {info?.wikipedia ? (
            <WikiImage lang={info.wikipedia.lang} title={info.wikipedia.title} alt={`${model.brand} ${model.model}`} />
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-xl bg-surface-2 text-sm text-muted">
              Sem imagem cadastrada
            </div>
          )}
          {info?.officialUrl && (
            <a href={info.officialUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-accent underline">
              Fotos e versões no site oficial →
            </a>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge>{CATEGORY_LABEL[model.category]}</Badge>
            <Badge>{POWERTRAIN_LABEL[model.powertrain]}</Badge>
            {info ? (
              <Badge tone="good">Ficha pesquisada em {info.researchedAt}</Badge>
            ) : (
              <Badge tone="warn">Ficha não pesquisada — dados de referência</Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {model.brand} {model.model}
          </h1>
          {info?.generation && <p className="text-sm text-ink-2">{info.generation}</p>}
          <h2 className="pt-2 text-sm font-semibold">Resumo</h2>
          {info ? (
            <p className="text-sm leading-relaxed">{info.summary}</p>
          ) : (
            <p className="text-sm text-ink-2">
              Ainda não há uma ficha verificada para este modelo. Os números da análise usam o catálogo de referência
              (preço, consumo e custos estimados).
            </p>
          )}
          {best && keep && (
            <p className="rounded-lg border border-line bg-surface-2/50 p-3 text-sm leading-relaxed">
              <AutoAnalysis version={family.size > 1 ? versionOf(best.scenario.modelId) : ''} best={best} keep={keep} horizon={horizon} rank={rankOf(best)} total={ranked.length} leader={leader} />
            </p>
          )}
        </div>
      </div>

      <Card
        title="Análise comparativa"
        subtitle={`Custos com as suas premissas. Ranking entre as ${ranked.length} opções dos filtros atuais.`}
        actions={
          <Segmented<Horizon>
            label="Horizonte"
            value={horizon}
            options={HORIZONS.map((y) => ({ value: y, label: yearsLabel(y) }))}
            onChange={onHorizon}
          />
        }
      >
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface-2 text-xs text-ink-2">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Opção</th>
                <th className="px-3 py-2 text-right font-medium">Preço</th>
                <th className="px-3 py-2 text-right font-medium">Desembolso</th>
                <th className="px-3 py-2 text-right font-medium">Parcela</th>
                <th className="px-3 py-2 text-right font-medium">Custo/mês ({horizon}a)</th>
                <th className="px-3 py-2 text-right font-medium">vs. manter ({horizon}a)</th>
                <th className="px-3 py-2 text-right font-medium">Compensa em</th>
                <th className="px-3 py-2 text-right font-medium">Posição</th>
              </tr>
            </thead>
            <tbody>
              {keep && (
                <tr className="border-t border-line bg-[#fab219]/8">
                  <td className="px-3 py-2">
                    <span className="font-medium">Manter: {keep.scenario.label}</span>
                  </td>
                  <td className="px-3 py-2 text-right tabular">{money(keep.scenario.price)}</td>
                  <td className="px-3 py-2 text-right">—</td>
                  <td className="px-3 py-2 text-right">—</td>
                  <td className="px-3 py-2 text-right font-semibold tabular">{money(keep.horizons[horizon].monthly)}</td>
                  <td className="px-3 py-2 text-right text-muted">base</td>
                  <td className="px-3 py-2 text-right">—</td>
                  <td className="px-3 py-2 text-right tabular">{rankOf(keep) || '—'}º</td>
                </tr>
              )}
              {options.map((o) => {
                const h = o.horizons[horizon]
                const pos = rankOf(o)
                return (
                  <tr key={o.scenario.id} className="border-t border-line">
                    <td className="px-3 py-2">
                      <span className="font-medium">{o.scenario.ageAtStart === 0 ? '0 km' : `Seminovo ${o.scenario.detail.split(' · ').pop()?.replace(' (seminovo)', '')}`}</span>
                      <span className="block text-xs text-ink-2">{versionOf(o.scenario.modelId)}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular whitespace-nowrap">
                      {money(o.scenario.price)}
                      <span className="block text-xs text-muted">{{ fipe: 'FIPE', pesquisa: 'pesquisa', manual: 'manual', estimado: 'estimado' }[o.scenario.priceSource]}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular">{o.upfrontCash > 0 ? money(o.upfrontCash) : '—'}</td>
                    <td className="px-3 py-2 text-right tabular whitespace-nowrap">
                      {o.installment > 0 ? `${money(o.installment)} × ${o.finance.months}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold tabular">{money(h.monthly)}</td>
                    <td className={`px-3 py-2 text-right tabular whitespace-nowrap ${h.savingsVsKeep > 0 ? 'text-good' : 'text-bad'}`}>
                      {h.savingsVsKeep > 0 ? '▲ ' : '▼ '}
                      {money(Math.abs(h.savingsVsKeep))}
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-ink-2">
                      {o.breakEvenMonth === null ? 'não em 5 anos' : o.breakEvenMonth === 0 ? 'imediato' : months(o.breakEvenMonth)}
                    </td>
                    <td className="px-3 py-2 text-right tabular">{pos ? `${pos}º` : 'fora dos filtros'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {anyEstimated && (
          <p className="mt-2 text-xs text-muted">
            Há preços estimados nesta tabela. Clique em “Atualizar preços FIPE” no painel para usar os valores oficiais.
          </p>
        )}

        {best && keep && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold">
                Melhor forma: {versionOf(best.scenario.modelId)} · {best.scenario.ageAtStart === 0 ? '0 km' : best.scenario.detail.split(' · ').pop()} · {money(best.horizons[horizon].total)} em {yearsLabel(horizon)}
              </h3>
              <BreakdownBars breakdown={best.horizons[horizon].breakdown} total={best.horizons[horizon].total} />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold">
                Manter seu carro · {money(keep.horizons[horizon].total)} em {yearsLabel(horizon)}
              </h3>
              <BreakdownBars breakdown={keep.horizons[horizon].breakdown} total={keep.horizons[horizon].total} />
            </div>
          </div>
        )}
      </Card>

      <Card title="Como este carro entra no cálculo" subtitle="Transparência: o que vem de fonte e o que é estimativa">
        <dl className="divide-y divide-line text-sm">
          <Fact
            k="Preço 0 km"
            v={`${money(model.refPriceNew)} (${model.version})`}
            src={info?.price0km.source ? <SourceLink href={info.price0km.source} label={`pesquisa, ${info.price0km.date ?? info.researchedAt}`} /> : 'estimativa do catálogo'}
            note="Substituído pelo valor FIPE ao clicar em “Atualizar preços FIPE”."
          />
          <Fact
            k="Consumo"
            v={consumptionText(model.consumption)}
            src={info?.inmetro.source ? <SourceLink href={info.inmetro.source} label={`INMETRO/PBEV ${info.inmetro.year ?? ''}`} /> : 'estimativa do catálogo'}
            note={model.consumptionHistory?.length ? `Seminovos até ${model.consumptionHistory[0].untilModelYear} usam ${consumptionText(model.consumptionHistory[0].consumption)}.` : undefined}
          />
          <Fact k="Seguro" v={`${((model.insuranceRate * a.insuranceFactor) * 100).toFixed(1)}% do valor por ano`} src="estimativa" note="Média por categoria × fator do seu perfil. Não é cotação — peça uma à sua corretora." />
          <Fact k="Manutenção" v={`${money(model.maintenanceBase)}/ano com o carro novo, +${(a.maintenanceGrowth * 100).toFixed(0)}% por ano de idade`} src="estimativa" note="Média por categoria; confira o preço das revisões na concessionária." />
          <Fact k="Depreciação" v={`curva de mercado × ${model.depreciationFactor.toLocaleString('pt-BR')} (fator da marca/motorização)`} src="estimativa" note="Histórico de revenda varia; use o histórico FIPE do modelo para conferir." />
          {model.powertrain === 'hibrido-plugin' && (
            <Fact k="Uso elétrico" v={`${Math.round(a.phevElectricShare * 100)}% dos km no modo elétrico`} src="sua premissa" note="Ajuste em Premissas → Uso e energia conforme sua rotina de recarga." />
          )}
          {model.estimated?.map((e) => <Fact key={e} k="Outros" v={e} src="estimativa" />)}
        </dl>
      </Card>

      <SpecComparison
        info={info}
        mine={mine}
        mineLabel={car.label}
        energyThis={best ? energyCostPerKm(best.scenario.powertrain, best.scenario.consumption, a, best.scenario.evShare) : undefined}
        energyMine={keep ? energyCostPerKm(keep.scenario.powertrain, keep.scenario.consumption, a, keep.scenario.evShare) : undefined}
      />

      {info && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Destaques">
              <List items={info.highlights} marker="+" tone="text-good" />
            </Card>
            <Card title="Pontos de atenção">
              <List items={info.watchOuts} marker="!" tone="text-bad" />
            </Card>
          </div>

          {info.timeline.length > 0 && (
            <Card title="O que mudou entre os anos-modelo" subtitle="Útil para comparar seminovos com o 0 km">
              <ol className="relative space-y-4 border-l border-line pl-5">
                {info.timeline.map((t, i) => (
                  <li key={i}>
                    <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-accent" aria-hidden />
                    <span className="text-sm font-semibold">{t.modelYear}</span>
                    <p className="text-sm text-ink-2">{t.change}</p>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {info.versionsAndPrices.length > 0 && (
            <Card title="Versões e preços sugeridos (0 km)" subtitle="Preço público divulgado; valores na concessionária podem variar">
              <ul className="divide-y divide-line text-sm">
                {info.versionsAndPrices.map((v, i) => (
                  <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                    <span>{v.version}</span>
                    <span className="tabular">
                      {v.price ? money(v.price) : '—'}
                      <span className="ml-2 text-xs text-muted">
                        {v.date}
                        {v.source && (
                          <>
                            {' · '}
                            <a href={v.source} target="_blank" rel="noreferrer" className="underline">
                              fonte
                            </a>
                          </>
                        )}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Fontes e confiabilidade">
            <div className="space-y-3 text-sm">
              <p className="text-ink-2">
                Ficha montada a partir das fontes abaixo, consultadas em {info.researchedAt}. Confirme preços e equipamentos na
                concessionária antes de decidir.
              </p>
              {info.unverified.length > 0 && (
                <div className="rounded-lg bg-[#fab219]/12 p-3">
                  <span className="font-medium">Não foi possível confirmar:</span>
                  <ul className="mt-1 list-disc pl-5 text-ink-2">
                    {info.unverified.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}
              <ul className="list-disc space-y-1 pl-5">
                {info.sources.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-accent underline">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function AutoAnalysis({
  version,
  best,
  keep,
  horizon,
  rank,
  total,
  leader,
}: {
  version: string
  best: ScenarioResult
  keep: ScenarioResult
  horizon: Horizon
  rank: number
  total: number
  leader?: ScenarioResult
}) {
  const h = best.horizons[horizon]
  const form =
    (best.scenario.ageAtStart === 0 ? 'comprar 0 km' : `comprar seminovo ${best.scenario.detail.split(' · ').pop()?.replace(' (seminovo)', '')}`) +
    (version ? ` na versão ${version}` : '')
  const isLeader = leader?.scenario.id === best.scenario.id
  return (
    <>
      <strong>Análise ({yearsLabel(horizon)}):</strong> a forma mais barata de ter este carro é <strong>{form}</strong>, custando{' '}
      <strong>{money(h.monthly)}/mês</strong> —{' '}
      {h.savingsVsKeep > 0 ? (
        <span className="text-good">{money(h.savingsVsKeep)} a menos</span>
      ) : (
        <span className="text-bad">{money(-h.savingsVsKeep)} a mais</span>
      )}{' '}
      que manter o seu carro ({money(keep.horizons[horizon].monthly)}/mês).{' '}
      {rank > 0 && `Fica em ${rank}º de ${total} no ranking atual.`}{' '}
      {!isLeader && leader && rank > 0 && (
        <>
          O 1º colocado ({leader.scenario.label}, {leader.scenario.detail.split(' · ').pop()}) custa{' '}
          {money(h.total - leader.horizons[horizon].total)} a menos no período.
        </>
      )}
      {best.breakEvenMonth !== null && h.savingsVsKeep > 0 && best.breakEvenMonth > 0 && ` A troca se paga a partir de ${months(best.breakEvenMonth)}.`}
    </>
  )
}

function List({ items, marker, tone }: { items: string[]; marker: string; tone: string }) {
  if (!items.length) return <p className="text-sm text-muted">Nada encontrado nas fontes.</p>
  return (
    <ul className="space-y-2 text-sm">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2">
          <span className={`font-semibold ${tone}`} aria-hidden>
            {marker}
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

function SpecComparison({
  info,
  mine,
  mineLabel,
  energyThis,
  energyMine,
}: {
  info?: ModelInfo
  mine?: ModelInfo
  mineLabel: string
  energyThis?: number
  energyMine?: number
}) {
  const fmtNum = (v: number | null | undefined, unit: string) => (v ? `${number(v)} ${unit}` : '—')
  const cons = (i?: ModelInfo) => {
    if (!i) return '—'
    const { cityGas, cityEth, cityKmKWh } = i.inmetro
    const parts = [
      cityGas && `${number(cityGas)} km/l (G)`,
      cityEth && `${number(cityEth)} km/l (E)`,
      cityKmKWh && `${number(cityKmKWh)} km/kWh`,
    ].filter(Boolean)
    return parts.length ? parts.join(' · ') : '—'
  }
  const rows: [string, ReactNode, ReactNode][] = [
    ['Versão de referência', info?.specs.version ?? '—', mine?.specs.version ?? '—'],
    ['Motor', info?.specs.engine ?? '—', mine?.specs.engine ?? '—'],
    ['Potência (cv)', info?.specs.powerCv ?? '—', mine?.specs.powerCv ?? '—'],
    ['Torque (kgfm)', info?.specs.torqueKgfm ?? '—', mine?.specs.torqueKgfm ?? '—'],
    ['Câmbio', info?.specs.transmission ?? '—', mine?.specs.transmission ?? '—'],
    ['Porta-malas', fmtNum(info?.specs.trunkL, 'L'), fmtNum(mine?.specs.trunkL, 'L')],
    ['Comprimento', fmtNum(info?.specs.lengthMm, 'mm'), fmtNum(mine?.specs.lengthMm, 'mm')],
    ['Entre-eixos', fmtNum(info?.specs.wheelbaseMm, 'mm'), fmtNum(mine?.specs.wheelbaseMm, 'mm')],
    ['Consumo na cidade (INMETRO)', cons(info), cons(mine)],
    ['Energia por km (suas premissas)', energyThis !== undefined ? money2(energyThis) : '—', energyMine !== undefined ? money2(energyMine) : '—'],
    ['Segurança', info?.specs.safety ?? '—', mine?.specs.safety ?? '—'],
    ['Garantia', info?.specs.warranty ?? '—', mine?.specs.warranty ?? '—'],
  ]
  return (
    <Card title="Ficha técnica lado a lado" subtitle="Dados da ficha pesquisada; “—” quando não confirmado nas fontes">
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-surface-2 text-xs text-ink-2">
            <tr>
              <th className="px-3 py-2 text-left font-medium" />
              <th className="px-3 py-2 text-left font-medium">{info?.displayName ?? 'Este modelo'}</th>
              <th className="px-3 py-2 text-left font-medium">Seu carro: {mineLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([k, x, y]) => (
              <tr key={k} className="border-t border-line align-top">
                <th scope="row" className="px-3 py-2 text-left font-normal text-ink-2">
                  {k}
                </th>
                <td className="px-3 py-2">{x}</td>
                <td className="px-3 py-2">{y}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function consumptionText(c: Consumption) {
  const parts: string[] = []
  if (c.cityKmL) parts.push(`G ${number(c.cityKmL)}/${number(c.roadKmL)} km/l`)
  if (c.cityKmLEthanol) parts.push(`E ${number(c.cityKmLEthanol)}/${number(c.roadKmLEthanol ?? 0)} km/l`)
  if (c.cityKmKWh) parts.push(`${number(c.cityKmKWh)}/${number(c.roadKmKWh ?? 0)} km/kWh`)
  return `${parts.join(' · ')} (cidade/estrada)`
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-accent underline">
      {label}
    </a>
  )
}

function Fact({ k, v, src, note }: { k: string; v: ReactNode; src: ReactNode; note?: string }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[10rem_1fr_auto] sm:gap-4">
      <dt className="text-ink-2">{k}</dt>
      <dd>
        {v}
        {note && <span className="block text-xs text-muted">{note}</span>}
      </dd>
      <dd className="text-xs sm:text-right">{src === 'estimativa' ? <Badge tone="warn">estimativa</Badge> : src}</dd>
    </div>
  )
}
