import { useState } from 'react'
import { CATEGORY_LABEL, POWERTRAIN_LABEL } from '../lib/catalog'
import { yearOf, ZERO_KM_YEAR } from '../lib/fipe'
import { money } from '../lib/format'
import { currentCarValue, depreciationRate, mileagePenalty, revisionSchedule } from '../lib/tco'
import { DEFAULT_CAR } from '../lib/defaults'
import type { Assumptions } from '../lib/types'
import type { Category, CurrentCar, PlannedCost, Powertrain } from '../lib/types'
import { FipePicker } from './FipePicker'
import { Button, Collapsible, NumberField, SelectField, TextField } from './ui'

interface Props {
  car: CurrentCar
  onChange: (c: CurrentCar) => void
  year: number
  assumptions: Assumptions
}

export function CurrentCarForm({ car, onChange, year, assumptions }: Props) {
  const [picking, setPicking] = useState(!car.fipe && !car.fipeValue)
  const set = <K extends keyof CurrentCar>(k: K, v: CurrentCar[K]) => onChange({ ...car, [k]: v })
  const setCons = (k: keyof CurrentCar['consumption'], v: number) =>
    onChange({ ...car, consumption: { ...car.consumption, [k]: v } })
  const setPlanned = (list: PlannedCost[]) => set('plannedCosts', list)
  const value = currentCarValue(car)
  const isEV = car.powertrain === 'eletrico'
  const age = Math.max(0, year - car.modelYear)
  const kmPen = mileagePenalty(car, assumptions, year)

  return (
    <Collapsible title="Meu carro" hint={value ? `${car.label} · ${money(value)}` : 'Informe seu carro'} defaultOpen>
      <div className="space-y-4">
        <div className="rounded-lg border border-line bg-surface-2/50 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Tabela FIPE</span>
            <Button variant="ghost" onClick={() => setPicking((p) => !p)}>
              {picking ? 'Fechar' : car.fipe ? 'Trocar modelo' : 'Buscar na FIPE'}
            </Button>
          </div>
          {car.fipeValue ? (
            <p className="text-sm text-ink-2">
              <span className="font-semibold text-ink tabular">{money(car.fipeValue)}</span>
              {car.fipe && ` · ${car.fipe.modelName} · ${car.fipe.yearName}`}
              {car.fipeReference && <span className="block text-xs text-muted">Referência: {car.fipeReference}</span>}
            </p>
          ) : (
            !picking && <p className="text-sm text-muted">Nenhum modelo FIPE selecionado.</p>
          )}
          {picking && (
            <div className="mt-3">
              <FipePicker
                value={car.fipe}
                onSelect={(sel, price) => {
                  const y = yearOf(sel.yearCode)
                  const modelYear = y === ZERO_KM_YEAR ? year : y
                  const carAge = Math.max(0, year - modelYear)
                  onChange({
                    ...car,
                    fipe: sel,
                    fipeValue: price?.price,
                    fipeReference: price?.referenceMonth,
                    manualValue: undefined,
                    label: `${sel.brandName.replace(/^.*- /, '')} ${sel.modelName}`.slice(0, 60),
                    modelYear,
                    depreciationYear: depreciationRate(carAge, 1),
                  })
                  setPicking(false)
                }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <TextField label="Nome" value={car.label} onChange={(v) => set('label', v)} />
          </div>
          <NumberField
            label="Valor manual"
            prefix="R$"
            value={car.manualValue ?? 0}
            onChange={(v) => set('manualValue', v || undefined)}
            hint="Sobrepõe a FIPE"
          />
          <NumberField label="Ano modelo" value={car.modelYear} onChange={(v) => set('modelYear', Math.round(v))} hint={`${age} anos de uso`} />
          <NumberField
            label="Km rodados"
            suffix="km"
            step={1000}
            value={car.odometerKm}
            onChange={(v) => set('odometerKm', v)}
            hint={
              kmPen > 0
                ? `−${(kmPen * 100).toFixed(1)}% na revenda (acima da média)`
                : kmPen < 0
                  ? `+${(-kmPen * 100).toFixed(1)}% na revenda (abaixo da média)`
                  : 'Na média de mercado'
            }
          />
          <SelectField<Category>
            label="Categoria"
            value={car.category}
            options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value: value as Category, label }))}
            onChange={(v) => set('category', v)}
          />
          <SelectField<Powertrain>
            label="Motorização"
            value={car.powertrain}
            options={Object.entries(POWERTRAIN_LABEL).map(([value, label]) => ({ value: value as Powertrain, label }))}
            onChange={(v) => set('powertrain', v)}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Consumo real</legend>
          {(isEV ? !(car.consumption.cityKmKWh && car.consumption.roadKmKWh) : !(car.consumption.cityKmL > 0 && car.consumption.roadKmL > 0)) && (
            <p role="alert" className="rounded-lg bg-warn-soft px-3 py-2 text-xs">
              Informe o consumo na cidade e na estrada; sem ele o custo de combustível fica zerado.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {isEV ? (
              <>
                <NumberField label="Cidade" suffix="km/kWh" value={car.consumption.cityKmKWh ?? 0} onChange={(v) => setCons('cityKmKWh', v)} />
                <NumberField label="Estrada" suffix="km/kWh" value={car.consumption.roadKmKWh ?? 0} onChange={(v) => setCons('roadKmKWh', v)} />
              </>
            ) : (
              <>
                <NumberField label="Cidade (gasolina)" suffix="km/l" value={car.consumption.cityKmL} onChange={(v) => setCons('cityKmL', v)} />
                <NumberField label="Estrada (gasolina)" suffix="km/l" value={car.consumption.roadKmL} onChange={(v) => setCons('roadKmL', v)} />
                {car.powertrain !== 'gasolina' && car.powertrain !== 'diesel' && (
                  <>
                    <NumberField label="Cidade (etanol)" suffix="km/l" value={car.consumption.cityKmLEthanol ?? 0} onChange={(v) => setCons('cityKmLEthanol', v)} />
                    <NumberField label="Estrada (etanol)" suffix="km/l" value={car.consumption.roadKmLEthanol ?? 0} onChange={(v) => setCons('roadKmLEthanol', v)} />
                  </>
                )}
              </>
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Custos atuais</legend>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Seguro por ano" prefix="R$" value={car.insuranceYear} onChange={(v) => set('insuranceYear', v)} />
            <NumberField
              label="Outros gastos de manutenção/ano"
              prefix="R$"
              value={car.maintenanceYear}
              onChange={(v) => set('maintenanceYear', v)}
              hint={car.revisions ? 'Lavagens, desgaste e reparos — sem as revisões' : 'Inclui revisões (plano de revisões desligado)'}
            />
            <NumberField
              label="Depreciação esperada"
              suffix="% a.a."
              scale={100}
              value={car.depreciationYear}
              onChange={(v) => set('depreciationYear', v)}
              hint={`Média p/ ${age} anos: ${(depreciationRate(age, 1) * 100).toFixed(1)}%`}
            />
          </div>
        </fieldset>

        <RevisionsEditor car={car} onChange={onChange} kmPerYear={assumptions.kmPerYear} />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Financiamento em aberto</legend>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Saldo p/ quitar" prefix="R$" value={car.loanBalance} onChange={(v) => set('loanBalance', v)} />
            <NumberField label="Parcela" prefix="R$" value={car.loanPayment} onChange={(v) => set('loanPayment', v)} />
            <NumberField label="Restantes" value={car.loanRemaining} onChange={(v) => set('loanRemaining', Math.round(v))} />
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Gastos previstos (se mantiver)</legend>
          {car.plannedCosts.map((pc, i) => (
            <div key={pc.id} className="grid grid-cols-[1fr_6.5rem_4.5rem_auto] items-end gap-2">
              <TextField label={i === 0 ? 'Item' : ''} value={pc.label} onChange={(v) => setPlanned(car.plannedCosts.map((x) => (x.id === pc.id ? { ...x, label: v } : x)))} />
              <NumberField label={i === 0 ? 'Valor' : ''} prefix="R$" value={pc.amount} onChange={(v) => setPlanned(car.plannedCosts.map((x) => (x.id === pc.id ? { ...x, amount: v } : x)))} />
              <NumberField label={i === 0 ? 'Mês' : ''} value={pc.month} onChange={(v) => setPlanned(car.plannedCosts.map((x) => (x.id === pc.id ? { ...x, month: v } : x)))} />
              <button
                type="button"
                aria-label={`Remover ${pc.label}`}
                className="mb-1 rounded p-1 text-muted hover:text-bad"
                onClick={() => setPlanned(car.plannedCosts.filter((x) => x.id !== pc.id))}
              >
                <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            onClick={() =>
              setPlanned([...car.plannedCosts, { id: crypto.randomUUID(), label: 'Novo gasto', amount: 1000, month: 12 }])
            }
          >
            + Adicionar gasto previsto
          </Button>
          <p className="text-xs text-muted">Ex.: pneus, embreagem, bateria. Mês 1 = mês que vem.</p>
        </fieldset>
      </div>
    </Collapsible>
  )
}

/** Plano de revisões por km: tabela editável, próxima revisão e total previsto por horizonte. */
function RevisionsEditor({ car, onChange, kmPerYear }: { car: CurrentCar; onChange: (c: CurrentCar) => void; kmPerYear: number }) {
  const rp = car.revisions
  const schedule = revisionSchedule(car, kmPerYear, 60)
  const next = schedule[0]
  const total = (months: number) => schedule.filter((r) => r.month <= months).reduce((s, r) => s + r.price, 0)
  const setRp = (patch: Partial<NonNullable<CurrentCar['revisions']>>) => rp && onChange({ ...car, revisions: { ...rp, ...patch } })

  return (
    <fieldset className="space-y-3 rounded-lg border border-line p-3">
      <legend className="px-1 text-sm font-medium">Revisões programadas</legend>
      {!rp ? (
        <div className="space-y-2 text-sm text-ink-2">
          <p>Desligado: as revisões estão dentro de “Outros gastos de manutenção”.</p>
          <Button
            onClick={() =>
              onChange({
                ...car,
                revisions: DEFAULT_CAR.revisions ?? { intervalKm: 10000, prices: Array(10).fill(1000), surcharge: 0, reference: 'informado' },
              })
            }
          >
            Usar plano de revisões por km
          </Button>
          <p className="text-xs text-muted">Ao ligar, tire o valor das revisões de “Outros gastos” para não contar duas vezes.</p>
        </div>
      ) : (
        <>
          {next && (
            <div className="rounded-lg bg-accent-soft p-3 text-sm">
              <span className="block text-xs font-medium text-accent">Próxima revisão</span>
              <span className="block font-semibold">
                {next.km.toLocaleString('pt-BR')} km · {money(next.price)}
              </span>
              <span className="block text-xs text-ink-2">
                em cerca de {next.month} {next.month === 1 ? 'mês' : 'meses'} (rodando {kmPerYear.toLocaleString('pt-BR')} km/ano)
              </span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {[12, 36, 60].map((m) => (
              <div key={m} className="rounded-lg border border-line p-2">
                <span className="block text-muted">{m / 12} {m === 12 ? 'ano' : 'anos'}</span>
                <span className="block font-semibold text-ink tabular">{money(total(m))}</span>
                <span className="block text-muted">{schedule.filter((r) => r.month <= m).length} revisões</span>
              </div>
            ))}
          </div>
          <details>
            <summary className="cursor-pointer text-xs font-medium text-accent">Editar tabela de preços</summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <NumberField label="Intervalo" suffix="km" step={1000} value={rp.intervalKm} onChange={(v) => setRp({ intervalKm: Math.max(1000, v) })} />
              <NumberField label="Acréscimo por revisão" prefix="R$" value={rp.surcharge} onChange={(v) => setRp({ surcharge: v })} hint="Ex.: versão híbrida" />
              {rp.prices.map((p, i) => (
                <NumberField
                  key={i}
                  label={`${((i + 1) * rp.intervalKm).toLocaleString('pt-BR')} km`}
                  prefix="R$"
                  value={p}
                  onChange={(v) => setRp({ prices: rp.prices.map((x, j) => (j === i ? v : x)) })}
                />
              ))}
            </div>
          </details>
          <p className="text-xs text-muted">
            {rp.reference}. Depois do fim da tabela, o ciclo se repete (estimativa). Valores corrigidos pela inflação no cálculo.
          </p>
          <Button variant="ghost" onClick={() => onChange({ ...car, revisions: null })}>
            Desligar plano de revisões
          </Button>
        </>
      )}
    </fieldset>
  )
}
