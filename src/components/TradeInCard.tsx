import { useMemo } from 'react'
import { money, pct } from '../lib/format'
import { breakEvenTradeIn, mileagePenalty, tradeInFor, type SimContext } from '../lib/tco'
import type { CurrentCar, Horizon, ScenarioResult } from '../lib/types'
import { Badge, Card, Chip, NumberField, TextField } from './ui'

interface Props {
  car: CurrentCar
  onCar: (c: CurrentCar) => void
  ctx: SimContext
  keep: ScenarioResult
  /** Melhor alternativa à troca no horizonte (para mostrar o impacto da avaliação). */
  best?: ScenarioResult
  horizon: Horizon
  onEditCar: () => void
  onEditAssumptions: () => void
}

/**
 * Pontos de partida para quem ainda não tem proposta. Não há percentual oficial: as fontes citam
 * troca em concessionária de ~10% a 20% abaixo da FIPE e venda particular perto da FIPE.
 */
const PRESETS = [
  { key: 'particular', label: 'Venda particular', pct: 0.03, hint: 'perto da FIPE' },
  { key: 'troca', label: 'Troca na concessionária', pct: 0.12, hint: 'costuma ficar 10% a 20% abaixo' },
  { key: 'repasse', label: 'Loja de compra / repasse', pct: 0.18, hint: 'compra rápida, paga menos' },
] as const

const yrs = (h: number) => `${h} ${h === 1 ? 'ano' : 'anos'}`
const round500 = (v: number) => Math.round(v / 500) * 500

/** Avaliação do carro atual na troca: de onde vem o valor, como mudar e quanto ele pesa na decisão. */
export function TradeInCard({ car, onCar, ctx, keep, best, horizon, onEditCar, onEditAssumptions }: Props) {
  const a = ctx.assumptions
  const t = tradeInFor(car, a, ctx.year)
  const kmPct = mileagePenalty(car, a, ctx.year)
  const expectedKm = Math.round(Math.max(0.5, ctx.year - car.modelYear) * 12000)
  const afterKm = t.market - t.kmAdjust
  const presetValue = (p: number) => round500(afterKm * (1 - p))
  const activePreset = t.manual ? PRESETS.find((p) => presetValue(p.pct) === car.tradeInValue)?.key : undefined
  const setValue = (v: number, note?: string) => onCar({ ...car, tradeInValue: v > 0 ? Math.round(v) : undefined, tradeInNote: note ?? car.tradeInNote })

  const alt = best && best.scenario.kind !== 'keep' ? best : undefined
  const impact = useMemo(() => {
    if (!alt) return null
    const even = breakEvenTradeIn(alt.scenario, keep.scenario, ctx, horizon)
    return { even }
  }, [alt, keep.scenario, ctx, horizon])
  const saving = alt ? alt.horizons[horizon].savingsVsKeep : 0
  // Diferença entre o que você recebe agora e o que o carro vale para quem o mantém (custo de trocar agora).
  const friction = t.auto - t.value

  return (
    <Card
      title="Seu carro na troca"
      subtitle="Quanto você recebe hoje pelo seu carro. É o valor que mais muda os cenários de troca."
      actions={t.manual ? <Badge tone="good">Proposta informada</Badge> : <Badge>Estimativa automática</Badge>}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <dl className="divide-y divide-line rounded-xl border border-line text-sm">
            <Line k="Valor de mercado" sub={car.manualValue ? 'informado por você' : car.fipeReference ? `FIPE ${car.fipeReference}` : 'FIPE'} v={money(t.market)} action={<LinkBtn onClick={onEditCar}>alterar</LinkBtn>} />
            <Line
              k={kmPct >= 0 ? 'Desconto por quilometragem' : 'Ágio por baixa quilometragem'}
              sub={car.odometerKm ? `${car.odometerKm.toLocaleString('pt-BR')} km; média esperada ~${expectedKm.toLocaleString('pt-BR')} km (${pct(Math.abs(kmPct))})` : 'km não informado'}
              v={`${t.kmAdjust > 0 ? '−' : '+'} ${money(Math.abs(t.kmAdjust))}`}
            />
            <Line k="Deságio de venda" sub={`${pct(a.saleDiscountPct, 0)} — em Premissas`} v={`− ${money(t.saleDiscount)}`} action={<LinkBtn onClick={onEditAssumptions}>alterar</LinkBtn>} />
            <Line k="Estimativa automática" v={money(t.auto)} strong={!t.manual} />
            {t.manual && <Line k="Proposta informada" sub={car.tradeInNote || undefined} v={money(t.value)} strong />}
          </dl>
          <p className="mt-2 text-xs text-muted">
            Quem mantém o carro vende no futuro pelo valor de mercado projetado (com o mesmo deságio). Uma proposta abaixo da estimativa é um custo de trocar agora e pesa contra todas as opções de troca.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              label="Quanto você recebe na troca"
              prefix="R$"
              step={1000}
              value={car.tradeInValue ?? 0}
              onChange={(v) => setValue(v)}
              hint="0 = usar a estimativa automática"
            />
            <TextField label="Origem do valor (opcional)" value={car.tradeInNote ?? ''} onChange={(v) => onCar({ ...car, tradeInNote: v })} placeholder="Ex.: proposta Toyota Barra, 05/10" />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-2">Sem proposta ainda? Use um ponto de partida</span>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={!t.manual} onClick={() => setValue(0, '')}>
                Estimativa ({money(t.auto)})
              </Chip>
              {PRESETS.map((p) => (
                <Chip key={p.key} active={activePreset === p.key} onClick={() => setValue(presetValue(p.pct), `${p.label} (FIPE −${Math.round(p.pct * 100)}%, referência)`)}>
                  {p.label} ({money(presetValue(p.pct))})
                </Chip>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Referências, não preços: não há percentual oficial. As fontes citam troca de ~10% a 20% abaixo da FIPE e venda particular perto dela (
              <a className="underline" href="https://carzin.com.br/mercado/tabela-fipe-troca-concessionaria.html" target="_blank" rel="noreferrer">Carzin</a>,{' '}
              <a className="underline" href="https://autopapo.com.br/blog-do-boris/pagamos-tabela-fipe-no-seu-usado-sera/" target="_blank" rel="noreferrer">AutoPapo</a>
              ). O melhor número é uma proposta real — peça duas ou três.
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl bg-surface-2 p-3 text-sm">
            {friction > 1 && (
              <p>
                Você recebe <strong className="tabular">{money(friction)}</strong> a menos que a estimativa de venda — esse é o custo de trocar agora.
              </p>
            )}
            {alt && (
              <p>
                Com esta avaliação, a melhor troca ({alt.scenario.label} {alt.scenario.ageAtStart === 0 ? '0 km' : alt.scenario.kind === 'subscription' ? 'por assinatura' : `seminovo ${ctx.year - alt.scenario.ageAtStart}`}){' '}
                {saving >= 0 ? (
                  <>
                    economiza <strong className="text-good tabular">{money(saving)}</strong>
                  </>
                ) : (
                  <>
                    custa <strong className="text-bad tabular">{money(-saving)}</strong> a mais
                  </>
                )}{' '}
                em {yrs(horizon)}.
                {impact?.even != null && impact.even > 0 && (
                  <>
                    {' '}
                    Ela empata com manter se a avaliação for <strong className="tabular">{money(impact.even)}</strong>
                    {impact.even > t.value ? ` (${money(impact.even - t.value)} a mais).` : ` (${money(t.value - impact.even)} a menos).`}
                  </>
                )}
              </p>
            )}
            {alt && alt.changeBack > 0 && (
              <p>
                Nessa troca sobram <strong className="tabular">{money(alt.changeBack)}</strong> de troco para você (o cálculo considera esse dinheiro aplicado).
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function Line({ k, sub, v, strong, action }: { k: string; sub?: string; v: string; strong?: boolean; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <dt className="min-w-0">
        <span className={strong ? 'font-semibold' : ''}>{k}</span> {action}
        {sub && <span className="block text-xs text-muted">{sub}</span>}
      </dt>
      <dd className={`shrink-0 tabular ${strong ? 'font-semibold text-ink' : 'text-ink-2'}`}>{v}</dd>
    </div>
  )
}

function LinkBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="text-xs font-medium text-accent hover:underline">
      {children}
    </button>
  )
}
