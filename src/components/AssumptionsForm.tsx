import { CATEGORY_LABEL } from '../lib/catalog'
import type { Assumptions, PaymentMode, Preferences } from '../lib/types'
import { ChipGroup, Collapsible, NumberField, SelectField, TextField } from './ui'

interface Props {
  a: Assumptions
  onChange: (a: Assumptions) => void
  prefs: Preferences
  onPrefs: (p: Preferences) => void
  token: string
  onToken: (t: string) => void
}

export function AssumptionsForm({ a, onChange, prefs, onPrefs, token, onToken }: Props) {
  const set = <K extends keyof Assumptions>(k: K, v: Assumptions[K]) => onChange({ ...a, [k]: v })

  return (
    <div className="space-y-3">
      <Collapsible title="Uso e energia" hint={`${a.kmPerYear.toLocaleString('pt-BR')} km/ano · ${Math.round(a.cityShare * 100)}% cidade`} defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Km por ano" suffix="km" step={1000} value={a.kmPerYear} onChange={(v) => set('kmPerYear', v)} />
          <NumberField label="Uso na cidade" suffix="%" scale={100} value={a.cityShare} onChange={(v) => set('cityShare', Math.min(1, Math.max(0, v)))} />
          <NumberField label="Gasolina" prefix="R$" suffix="/l" step={0.01} value={a.gasolinePrice} onChange={(v) => set('gasolinePrice', v)} />
          <NumberField label="Etanol" prefix="R$" suffix="/l" step={0.01} value={a.ethanolPrice} onChange={(v) => set('ethanolPrice', v)} hint={`Paridade: ${((a.ethanolPrice / a.gasolinePrice) * 100).toFixed(0)}%`} />
          <NumberField label="Diesel" prefix="R$" suffix="/l" step={0.01} value={a.dieselPrice} onChange={(v) => set('dieselPrice', v)} />
          <NumberField label="Energia (recarga)" prefix="R$" suffix="/kWh" step={0.01} value={a.kwhPrice} onChange={(v) => set('kwhPrice', v)} hint="Tarifa residencial" />
        </div>
      </Collapsible>

      <Collapsible title="Compra e financiamento" hint={paymentHint(a)}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <SelectField<PaymentMode>
              label="Forma de pagamento"
              value={a.paymentMode}
              options={[
                { value: 'auto', label: 'Automático: à vista se couber, senão financia' },
                { value: 'avista', label: 'Sempre à vista (usa reservas)' },
                { value: 'financiado', label: 'Sempre financiado' },
              ]}
              onChange={(v) => set('paymentMode', v)}
            />
          </div>
          <NumberField label="Reserva disponível" prefix="R$" value={a.savingsAvailable} onChange={(v) => set('savingsAvailable', v)} hint="Além do carro atual" />
          <NumberField label="Entrada mínima" suffix="%" scale={100} value={a.downPaymentPct} onChange={(v) => set('downPaymentPct', v)} />
          <NumberField label="Juros (CET)" suffix="% a.m." scale={100} step={0.01} value={a.financeRateMonth} onChange={(v) => set('financeRateMonth', v)} />
          <NumberField label="Prazo" suffix="meses" value={a.financeMonths} onChange={(v) => set('financeMonths', Math.round(v))} />
          <NumberField label="Deságio na venda" suffix="%" scale={100} value={a.saleDiscountPct} onChange={(v) => set('saleDiscountPct', v)} hint="Abaixo da FIPE ao vender/trocar" />
          <NumberField label="Ágio no seminovo" suffix="%" scale={100} value={a.usedPremiumPct} onChange={(v) => set('usedPremiumPct', v)} hint="Acima da FIPE ao comprar" />
        </div>
      </Collapsible>

      <Collapsible title="Economia e impostos" hint={`Rendimento ${(a.investReturnYear * 100).toFixed(1)}% · IPCA ${(a.inflationYear * 100).toFixed(1)}%`}>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Rendimento líquido" suffix="% a.a." scale={100} step={0.1} value={a.investReturnYear} onChange={(v) => set('investReturnYear', v)} hint="Custo de oportunidade" />
          <NumberField label="Inflação" suffix="% a.a." scale={100} step={0.1} value={a.inflationYear} onChange={(v) => set('inflationYear', v)} />
          <NumberField label="IPVA combustão" suffix="%" scale={100} step={0.1} value={a.ipvaRate} onChange={(v) => set('ipvaRate', v)} />
          <NumberField label="IPVA híbridos" suffix="%" scale={100} step={0.1} value={a.ipvaRateHybrid} onChange={(v) => set('ipvaRateHybrid', v)} />
          <NumberField label="IPVA elétricos" suffix="%" scale={100} step={0.1} value={a.ipvaRateEV} onChange={(v) => set('ipvaRateEV', v)} hint="Isento em alguns estados" />
          <NumberField label="Licenciamento" prefix="R$" value={a.licensingFee} onChange={(v) => set('licensingFee', v)} />
          <NumberField label="Manutenção cresce" suffix="% a.a." scale={100} value={a.maintenanceGrowth} onChange={(v) => set('maintenanceGrowth', v)} hint="Por ano de idade" />
        </div>
      </Collapsible>

      <Collapsible title="Mercado" hint="Seminovos, assinatura e FIPE">
        <div className="space-y-4">
          <ChipGroup<number>
            label="Idades de seminovo simuladas"
            options={[1, 2, 3, 4, 5, 6].map((v) => ({ value: v, label: `${v} ${v === 1 ? 'ano' : 'anos'}` }))}
            selected={prefs.usedAges}
            onChange={(v) => onPrefs({ ...prefs, usedAges: [...v].sort() })}
          />
          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-2">Assinatura: mensalidade e franquia</span>
            <div className="space-y-2">
              {a.subscriptionPlans.map((p, i) => (
                <div key={p.category} className="grid grid-cols-[1fr_6.5rem_5.5rem] items-end gap-2">
                  <span className="pb-2 text-sm">{CATEGORY_LABEL[p.category]}</span>
                  <NumberField label={i === 0 ? 'R$/mês' : ''} value={p.monthlyFee} onChange={(v) => set('subscriptionPlans', a.subscriptionPlans.map((x) => (x.category === p.category ? { ...x, monthlyFee: v } : x)))} />
                  <NumberField label={i === 0 ? 'km/mês' : ''} value={p.kmFranchiseMonth} onChange={(v) => set('subscriptionPlans', a.subscriptionPlans.map((x) => (x.category === p.category ? { ...x, kmFranchiseMonth: v } : x)))} />
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">Médias de mercado. Inclui seguro, IPVA e manutenção; reajuste anual pela inflação.</p>
          </div>
          <TextField label="Token da API FIPE (opcional)" value={token} onChange={onToken} placeholder="Aumenta o limite diário de consultas" />
          <p className="-mt-2 text-xs text-muted">
            Sem token: 500 consultas/dia. Token gratuito em fipe.online. As respostas ficam em cache por 7 dias.
          </p>
        </div>
      </Collapsible>
    </div>
  )
}

function paymentHint(a: Assumptions) {
  const mode = { auto: 'Automático', avista: 'À vista', financiado: 'Financiado' }[a.paymentMode]
  return `${mode} · ${(a.financeRateMonth * 100).toFixed(2)}% a.m. em ${a.financeMonths}x`
}
