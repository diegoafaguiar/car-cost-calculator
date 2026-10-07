import { useEffect, useRef, useState } from 'react'
import { CATALOG, CATEGORY_LABEL, POWERTRAIN_LABEL } from '../lib/catalog'
import type { FipeOverride } from '../lib/fipe'
import { money, money2, months, pct } from '../lib/format'
import { bestFuel, depreciationRate, energyCostPerKm } from '../lib/tco'
import type { Assumptions, Horizon, ScenarioResult } from '../lib/types'
import { HORIZONS } from '../lib/types'
import { BreakdownBars } from './BreakdownBars'
import { FipePicker } from './FipePicker'
import { KIND_LABEL } from './RankingTable'
import { Badge, Button, Segmented } from './ui'

interface Props {
  result: ScenarioResult
  keep?: ScenarioResult
  a: Assumptions
  initialHorizon: Horizon
  override?: FipeOverride
  onOverride: (modelId: string, o: FipeOverride | undefined) => void
  onClose: () => void
}

export function DetailDrawer({ result, keep, a, initialHorizon, override, onOverride, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [horizon, setHorizon] = useState<Horizon>(initialHorizon)
  const [picking, setPicking] = useState(false)
  const s = result.scenario
  const h = result.horizons[horizon]
  const model = s.modelId ? CATALOG.find((m) => m.id === s.modelId) : undefined
  const cpk = energyCostPerKm(s.powertrain, s.consumption, a, s.evShare)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const facts: [string, string][] = [
    ['Tipo', KIND_LABEL[s.kind]],
    ['Categoria', CATEGORY_LABEL[s.category]],
    ['Motorização', POWERTRAIN_LABEL[s.powertrain]],
    ['Combustível que compensa', bestFuel(s.powertrain, s.consumption, a)],
    ['Energia por km', money2(cpk)],
  ]
  if (s.kind !== 'subscription') {
    facts.push(
      [s.kind === 'keep' ? 'Valor de mercado' : 'Preço', `${money(s.price)} (${s.priceSource === 'fipe' ? 'FIPE' : s.priceSource})`],
      ['Seguro estimado (1º ano)', money(s.price * s.insuranceRate)],
      ['Depreciação 1º ano', pct(s.fixedDepreciation ?? depreciationRate(s.ageAtStart, s.depreciationFactor))],
    )
    if (s.fipeReference) facts.push(['Referência FIPE', s.fipeReference])
  }
  if (result.financed > 0) {
    facts.push(
      ['Valor financiado', money(result.financed)],
      ['Parcela', `${money(result.installment)} × ${a.financeMonths}`],
    )
  }
  if (result.upfrontCash > 0) facts.push(['Desembolso além do carro atual', money(result.upfrontCash)])
  if (s.plan) {
    facts.push(
      ['Mensalidade', money(s.plan.monthlyFee)],
      ['Franquia', `${s.plan.kmFranchiseMonth.toLocaleString('pt-BR')} km/mês`],
    )
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-xl overflow-y-auto border-l border-line bg-surface p-0 text-ink backdrop:bg-black/40"
    >
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-surface p-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold">{s.label}</h2>
          <p className="text-sm text-ink-2">{s.detail}</p>
        </div>
        <Button variant="ghost" onClick={() => ref.current?.close()}>
          Fechar
        </Button>
      </div>

      <div className="space-y-6 p-4 sm:px-6">
        <Segmented<Horizon>
          label="Horizonte"
          value={horizon}
          options={HORIZONS.map((y) => ({ value: y, label: `${y} ${y === 1 ? 'ano' : 'anos'}` }))}
          onChange={setHorizon}
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Custo total" value={money(h.total)} />
          <Metric label="Custo por mês" value={money(h.monthly)} />
          <Metric label="Custo por km" value={money2(h.perKm)} />
          {s.kind !== 'keep' && keep && (
            <>
              <Metric
                label="vs. manter"
                value={
                  <span className={h.savingsVsKeep > 0 ? 'text-good' : 'text-bad'}>
                    {h.savingsVsKeep > 0 ? '▲ economia ' : '▼ custa mais '}
                    {money(Math.abs(h.savingsVsKeep))}
                  </span>
                }
              />
              <Metric
                label="Compensa em"
                value={result.breakEvenMonth === null ? 'Não em 5 anos' : result.breakEvenMonth === 0 ? 'Imediato' : months(result.breakEvenMonth)}
              />
            </>
          )}
        </div>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Composição do custo em {horizon} {horizon === 1 ? 'ano' : 'anos'}</h3>
          <BreakdownBars breakdown={h.breakdown} total={h.total} />
          <p className="mt-3 text-xs text-muted">
            Depreciação considera o deságio de {pct(a.saleDiscountPct, 0)} na revenda ao final. Custo de oportunidade é o
            rendimento perdido (ou ganho, se negativo) com o dinheiro aplicado a {pct(a.investReturnYear)} a.a.
          </p>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Premissas desta opção</h3>
          <dl className="divide-y divide-line rounded-lg border border-line text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-3 py-2">
                <dt className="text-ink-2">{k}</dt>
                <dd className="text-right tabular">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {model && s.kind !== 'subscription' && (
          <section className="rounded-lg border border-line p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">Versão na FIPE</h3>
                <p className="text-xs text-ink-2">
                  {override ? (
                    <>
                      Fixada: {override.modelName} <Badge tone="accent">manual</Badge>
                    </>
                  ) : (
                    'Encontrada automaticamente pelo nome. Ajuste se a versão não for a desejada.'
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {override && (
                  <Button variant="ghost" onClick={() => onOverride(model.id, undefined)}>
                    Voltar ao automático
                  </Button>
                )}
                <Button onClick={() => setPicking((p) => !p)}>{picking ? 'Cancelar' : 'Escolher versão'}</Button>
              </div>
            </div>
            {picking && (
              <div className="mt-3">
                <FipePicker
                  withYear={false}
                  onSelect={(sel) => {
                    onOverride(model.id, { brandCode: sel.brandCode, modelCode: sel.modelCode, modelName: sel.modelName })
                    setPicking(false)
                  }}
                />
                <p className="mt-2 text-xs text-muted">Depois de escolher, clique em “Atualizar preços FIPE” no ranking.</p>
              </div>
            )}
          </section>
        )}
      </div>
    </dialog>
  )
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="text-xs text-ink-2">{label}</div>
      <div className="mt-0.5 font-semibold tabular">{value}</div>
    </div>
  )
}
