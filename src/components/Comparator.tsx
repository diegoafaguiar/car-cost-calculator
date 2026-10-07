import { useMemo, useState, type ReactNode } from 'react'
import { CATALOG, CATEGORY_LABEL, POWERTRAIN_LABEL, TRANSMISSION_LABEL } from '../lib/catalog'
import { money, money2, months, normalize, number } from '../lib/format'
import { MODEL_INFO, type ModelInfo } from '../lib/modelInfo'
import { COST_KEYS, COST_LABEL, energyCostPerKm } from '../lib/tco'
import type { Assumptions, Horizon, ScenarioResult } from '../lib/types'
import { HORIZONS } from '../lib/types'
import { average, comfortScore, featuresFor, relativeScore, safetyScore, techScore, type Score } from '../lib/scores'
import { CostTooltip } from './CostTooltip'
import { ScoreBadge } from './ScoreBadge'
import { Card, Segmented } from './ui'
import { WikiImage } from './WikiImage'

interface Props {
  keep?: ScenarioResult
  results: ScenarioResult[]
  ranked: ScenarioResult[]
  compare: string[]
  colors: Record<string, string>
  max: number
  onToggle: (id: string) => void
  horizon: Horizon
  onHorizon: (h: Horizon) => void
  assumptions: Assumptions
  onOpen: (id: string) => void
  /** Modelo do catálogo equivalente ao seu carro (para foto e ficha). */
  carModelId?: string
  carModelYear?: number
}

const infoFor = (r: ScenarioResult, carModelId?: string): ModelInfo | undefined => {
  const m = CATALOG.find((x) => x.id === (r.scenario.kind === 'keep' ? carModelId : r.scenario.modelId))
  return m ? MODEL_INFO[m.infoId ?? m.id] : undefined
}

/** Comparação lado a lado: seu carro + até N opções, com custos, composição e ficha. */
export function Comparator({ keep, results, ranked, compare, colors, max, onToggle, horizon, onHorizon, assumptions: a, onOpen, carModelId, carModelYear }: Props) {
  const infoOf = (r: ScenarioResult) => infoFor(r, carModelId)
  const [query, setQuery] = useState('')
  const columns = [keep, ...compare.map((id) => results.find((r) => r.scenario.id === id))].filter(Boolean) as ScenarioResult[]
  const rankOf = (r: ScenarioResult) => ranked.findIndex((x) => x.scenario.id === r.scenario.id) + 1

  const candidates = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean)
    if (!words.length) return []
    return results
      .filter((r) => r.scenario.kind !== 'keep' && !compare.includes(r.scenario.id))
      .filter((r) => words.every((w) => normalize(`${r.scenario.label} ${r.scenario.detail}`).includes(w)))
      .slice(0, 8)
  }, [query, results, compare])

  const h = (r: ScenarioResult) => r.horizons[horizon]
  const shortName = (r: ScenarioResult) =>
    r.scenario.kind === 'keep' ? 'Seu carro' : `${r.scenario.label} ${r.scenario.ageAtStart === 0 ? '0 km' : r.scenario.detail.match(/\b(20\d\d)\b/)?.[1] ?? ''}`.trim()
  const modelOf = (r: ScenarioResult) => (r.scenario.kind === 'keep' ? carModelId : r.scenario.modelId)
  const featOf = (r: ScenarioResult) => featuresFor(modelOf(r), r.scenario.kind === 'keep' ? carModelYear : undefined)
  const energyOf = (r: ScenarioResult) => energyCostPerKm(r.scenario.powertrain, r.scenario.consumption, a, r.scenario.evShare)
  const bestMonthly = Math.min(...columns.map((c) => c.horizons[horizon].monthly))
  const bestEnergy = Math.min(...columns.map(energyOf).filter((v) => v > 0))
  const scoresOf = (r: ScenarioResult) => {
    const f = featOf(r)
    const cost: Score = { value: relativeScore(r.horizons[horizon].monthly, bestMonthly), items: [], note: `Relativa às opções comparadas: a de menor custo por mês recebe 10 (${money(r.horizons[horizon].monthly)}/mês).` }
    const eff: Score = { value: relativeScore(energyOf(r), bestEnergy), items: [], note: `Relativa às opções comparadas: o menor custo de energia por km recebe 10 (${money2(energyOf(r))}/km).` }
    const tech = techScore(f)
    const comfort = comfortScore(f, modelOf(r))
    const safety = safetyScore(f)
    const overall: Score = {
      value: average([cost.value, eff.value, tech.value, comfort.value, safety.value]),
      items: [],
      note: 'Média simples das notas disponíveis (custo, eficiência, tecnologia, conforto e segurança).',
    }
    return { cost, eff, tech, comfort, safety, overall }
  }
  const allScores = columns.map(scoresOf)
  const scoreRow = (label: string, key: keyof ReturnType<typeof scoresOf>) => {
    const vals = allScores.map((s) => s[key].value)
    const valid = vals.filter((v): v is number => v !== null)
    const top = valid.length > 1 ? Math.max(...valid) : null
    return (
      <Row key={label} label={label}>
        {allScores.map((s, i) => (
          <td key={i} className="px-3 py-2 text-right">
            <ScoreBadge score={s[key]} title={label} highlight={s[key].value !== null && s[key].value === top} />
            {s[key].value !== null && s[key].value === top && <span className="ml-1 sm:hidden" aria-label="vencedor">🏆</span>}
          </td>
        ))}
        <Winner name={winnerName(vals, 'high')} />
      </Row>
    )
  }
  /** Nome da opção vencedora numa linha (ou "empate"); null quando não se aplica. */
  const winnerName = (vals: (number | null)[], better: 'low' | 'high' | 'none') => {
    if (better === 'none') return null
    const valid = vals.map((v, i) => [v, i] as const).filter((x): x is readonly [number, number] => x[0] !== null)
    if (valid.length < 2) return null
    const target = better === 'low' ? Math.min(...valid.map((x) => x[0])) : Math.max(...valid.map((x) => x[0]))
    // Empate só quando os valores são praticamente iguais (tolerância proporcional: serve para R$, km e notas).
    const eps = Math.max(1e-6, Math.abs(target) * 1e-4)
    const winners = valid.filter((x) => Math.abs(x[0] - target) <= eps)
    if (winners.length > 1) return 'empate'
    const r = columns[winners[0][1]]
    return { name: shortName(r), color: r.scenario.kind === 'keep' ? 'var(--ink-2)' : colors[r.scenario.id] }
  }
  /** Linha numérica: destaca o menor (ou maior) valor entre as colunas. */
  const numRow = (label: string, get: (r: ScenarioResult) => number | null, fmt: (v: number) => string, better: 'low' | 'high' | 'none' = 'low') => {
    const vals = columns.map(get)
    const valid = vals.filter((v): v is number => v !== null)
    const target = better === 'none' || valid.length < 2 ? null : better === 'low' ? Math.min(...valid) : Math.max(...valid)
    return (
      <Row key={label} label={label}>
        {vals.map((v, i) => (
          <td key={i} className={`px-3 py-2 text-right tabular ${v !== null && v === target ? 'font-semibold text-good' : ''}`}>
            {v === null ? <span className="text-muted">—</span> : fmt(v)}
            {v !== null && v === target && <span className="ml-1 sm:hidden" aria-label="vencedor">🏆</span>}
          </td>
        ))}
        <Winner name={winnerName(vals, better)} />
      </Row>
    )
  }
  const textRow = (label: string, get: (r: ScenarioResult) => ReactNode) => (
    <Row key={label} label={label}>
      {columns.map((r, i) => (
        <td key={i} className="px-3 py-2 text-right text-ink-2">
          {(() => {
            const v = get(r)
            if (v === undefined || v === null || v === '') return <span className="text-muted">—</span>
            return typeof v === 'string' ? (
              <span className="line-clamp-3" title={v}>
                {v}
              </span>
            ) : (
              v
            )
          })()}
        </td>
      ))}
      <td className="hidden sm:table-cell" />
    </Row>
  )

  return (
    <Card
      title="Comparar lado a lado"
      subtitle={`Seu carro e até ${max} opções. 🏆 indica o vencedor de cada linha (em verde).`}
      actions={
        <Segmented<Horizon>
          label="Horizonte"
          value={horizon}
          options={HORIZONS.map((y) => ({ value: y, label: `${y} ${y === 1 ? 'ano' : 'anos'}` }))}
          onChange={onHorizon}
        />
      }
    >
      <div className="relative mb-4 max-w-md" data-export-ignore="true">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={compare.length >= max}
          placeholder={compare.length >= max ? `Limite de ${max} opções — remova uma para adicionar` : 'Adicionar opção: digite um modelo (ex.: Song Pro 0 km)'}
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
        />
        {candidates.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-lg">
            {candidates.map((r) => (
              <li key={r.scenario.id}>
                <button
                  type="button"
                  onClick={() => {
                    onToggle(r.scenario.id)
                    setQuery('')
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-surface-2"
                >
                  <span>
                    <span className="font-medium">{r.scenario.label}</span> <span className="text-ink-2">{r.scenario.detail}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted tabular">{money(h(r).monthly)}/mês</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {columns.length <= 1 ? (
        <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
          Adicione opções pela busca acima, marcando linhas no ranking ou pelo botão “Comparar” dos cartões.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <p className="px-3 pt-2 text-[11px] text-muted sm:hidden">Deslize para o lado para ver todas as opções →</p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="align-top">
                <th className="sticky left-0 z-10 w-28 bg-surface px-3 py-3 text-left text-xs font-medium text-ink-2 sm:w-44" />
                {columns.map((r) => {
                  const info = infoOf(r)
                  const isKeep = r.scenario.kind === 'keep'
                  return (
                    <th key={r.scenario.id} className={`min-w-36 px-3 py-3 text-left font-normal sm:min-w-44 ${isKeep ? 'bg-warn-soft' : ''}`}>
                      <div className="mb-2 w-full">
                        <WikiImage
                          compact
                          lang={info?.wikipedia?.lang}
                          title={info?.wikipedia?.title}
                          fallbackQuery={r.scenario.kind === 'keep' ? undefined : r.scenario.label}
                          alt={r.scenario.label}
                        />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <button type="button" onClick={() => onOpen(r.scenario.id)} className="text-left hover:underline">
                          <span className="flex items-center gap-1.5 font-semibold">
                            {!isKeep && <span className="size-2.5 shrink-0 rounded-full" style={{ background: colors[r.scenario.id] }} />}
                            {isKeep ? 'Manter o seu carro' : r.scenario.label}
                          </span>
                          <span className="block text-xs text-ink-2">{isKeep ? r.scenario.label : r.scenario.detail}</span>
                        </button>
                        {!isKeep && (
                          <button
                            type="button"
                            aria-label={`Remover ${r.scenario.label} da comparação`}
                            onClick={() => onToggle(r.scenario.id)}
                            className="rounded p-0.5 text-muted hover:text-bad"
                          >
                            <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
                              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </th>
                  )
                })}
                <th className="hidden min-w-32 bg-surface-2/60 px-3 py-3 text-left align-bottom text-xs font-semibold text-ink-2 sm:table-cell">
                  Vencedor
                </th>
              </tr>
            </thead>
            <tbody>
              <Group label="Notas de 0 a 10 · toque para ver os critérios" span={columns.length} />
              {scoreRow('Custo', 'cost')}
              {scoreRow('Eficiência', 'eff')}
              {scoreRow('Tecnologia', 'tech')}
              {scoreRow('Conforto', 'comfort')}
              {scoreRow('Segurança', 'safety')}
              {scoreRow('Nota geral', 'overall')}

              <Group label={`Custo em ${horizon} ${horizon === 1 ? 'ano' : 'anos'}`} span={columns.length} />
              <Row label="Custo por mês">
                {columns.map((r) => {
                  const best = Math.min(...columns.map((c) => h(c).monthly))
                  return (
                    <td key={r.scenario.id} className={`px-3 py-2 text-right tabular ${h(r).monthly === best ? 'font-semibold text-good' : ''}`}>
                      <CostTooltip result={r} horizon={horizon} keep={keep}>
                        {money(h(r).monthly)}
                      </CostTooltip>
                      {h(r).monthly === best && <span className="ml-1 sm:hidden" aria-label="vencedor">🏆</span>}
                    </td>
                  )
                })}
                <Winner name={winnerName(columns.map((c) => h(c).monthly), 'low')} />
              </Row>
              {numRow('Custo total', (r) => h(r).total, money)}
              {numRow('Custo por km', (r) => h(r).perKm, money2)}
              {numRow('vs. manter', (r) => (r.scenario.kind === 'keep' ? 0 : h(r).savingsVsKeep), (v) => (v === 0 ? 'base' : `${v > 0 ? '+' : '−'}${money(Math.abs(v))}`), 'high')}
              {textRow('Compensa em', (r) =>
                r.scenario.kind === 'keep' ? '—' : r.breakEvenMonth === null ? 'não em 5 anos' : r.breakEvenMonth === 0 ? 'imediato' : months(r.breakEvenMonth),
              )}
              {textRow('Posição no ranking', (r) => (rankOf(r) ? `${rankOf(r)}º de ${ranked.length}` : 'fora dos filtros'))}

              <Group label="Compra" span={columns.length} />
              {numRow('Preço', (r) => (r.scenario.kind === 'subscription' ? null : r.scenario.price), money, 'none')}
              {textRow('Pagamento', (r) =>
                r.scenario.kind === 'keep'
                  ? '—'
                  : r.scenario.plan
                    ? `${money(r.scenario.plan.monthlyFee)}/mês (assinatura)`
                    : r.installment > 0
                      ? `${money(r.installment)} × ${r.finance.months}`
                      : 'à vista',
              )}
              {numRow('Desembolso da reserva', (r) => (r.scenario.kind === 'keep' ? null : r.upfrontCash), money, 'none')}
              {columns.some((r) => r.changeBack > 0) &&
                numRow('Troco para você', (r) => (r.scenario.kind === 'keep' || r.scenario.plan ? null : r.changeBack), money, 'none')}

              <Group label={`Composição do custo (${horizon}a)`} span={columns.length} />
              {COST_KEYS.filter((k) => columns.some((r) => Math.abs(h(r).breakdown[k]) >= 1)).map((k) =>
                numRow(COST_LABEL[k], (r) => h(r).breakdown[k], money),
              )}
              {[1, 3, 5]
                .filter((y) => y !== horizon)
                .map((y) => numRow(`Custo total em ${y} ${y === 1 ? 'ano' : 'anos'}`, (r) => r.horizons[y as Horizon].total, money))}

              <Group label="Carro" span={columns.length} />
              {textRow('Categoria', (r) => CATEGORY_LABEL[r.scenario.category])}
              {textRow('Motorização', (r) => POWERTRAIN_LABEL[r.scenario.powertrain])}
              {textRow('Câmbio', (r) => (r.scenario.transmission ? TRANSMISSION_LABEL[r.scenario.transmission] : '—'))}
              {numRow('Energia por km', (r) => energyCostPerKm(r.scenario.powertrain, r.scenario.consumption, a, r.scenario.evShare), money2)}
              {textRow('Motor', (r) => infoOf(r)?.specs.engine)}
              {textRow('Potência (cv)', (r) => infoOf(r)?.specs.powerCv)}
              {numRow('Porta-malas (L)', (r) => infoOf(r)?.specs.trunkL ?? null, (v) => number(v), 'high')}
              {textRow('Teste de colisão', (r) => infoOf(r)?.specs.safety)}
              {textRow('Garantia', (r) => infoOf(r)?.specs.warranty)}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-muted">
        Tecnologia, conforto e segurança vêm de checklists de equipamentos pesquisados por versão (linha atual; seminovos
        podem ter equipamentos diferentes) e do Latin NCAP. Custo e eficiência são relativos às opções na tela. “—” ou “sem
        nota” quando o dado não foi confirmado.
      </p>
    </Card>
  )
}

function Group({ label, span }: { label: string; span: number }) {
  return (
    <tr>
      <th colSpan={span + 2} className="bg-surface-2 px-3 py-1.5 text-left text-[11px] font-semibold tracking-wide text-muted uppercase">
        {label}
      </th>
    </tr>
  )
}

function Winner({ name }: { name: { name: string; color: string } | 'empate' | null }) {
  return (
    <td className="hidden bg-surface-2/60 px-3 py-2 text-left text-xs sm:table-cell">
      {name === null ? null : name === 'empate' ? (
        <span className="text-muted">empate</span>
      ) : (
        <span className="inline-flex items-center gap-1.5 font-medium">
          <span aria-hidden>🏆</span>
          <span className="size-2 shrink-0 rounded-full" style={{ background: name.color }} />
          <span className="line-clamp-2">{name.name}</span>
        </span>
      )}
    </td>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <tr className="border-t border-line align-top">
      <th scope="row" className="sticky left-0 z-10 max-w-28 bg-surface px-3 py-2 text-left text-xs font-normal text-ink-2 sm:max-w-none sm:text-sm">
        {label}
      </th>
      {children}
    </tr>
  )
}
