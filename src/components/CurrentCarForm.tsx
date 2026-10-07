import { useState } from 'react'
import { CATEGORY_LABEL, POWERTRAIN_LABEL } from '../lib/catalog'
import { yearOf, ZERO_KM_YEAR } from '../lib/fipe'
import { money } from '../lib/format'
import { currentCarValue, depreciationRate } from '../lib/tco'
import type { Category, CurrentCar, PlannedCost, Powertrain } from '../lib/types'
import { FipePicker } from './FipePicker'
import { Button, Collapsible, NumberField, SelectField, TextField } from './ui'

interface Props {
  car: CurrentCar
  onChange: (c: CurrentCar) => void
  year: number
}

export function CurrentCarForm({ car, onChange, year }: Props) {
  const [picking, setPicking] = useState(!car.fipe)
  const set = <K extends keyof CurrentCar>(k: K, v: CurrentCar[K]) => onChange({ ...car, [k]: v })
  const setCons = (k: keyof CurrentCar['consumption'], v: number) =>
    onChange({ ...car, consumption: { ...car.consumption, [k]: v } })
  const setPlanned = (list: PlannedCost[]) => set('plannedCosts', list)
  const value = currentCarValue(car)
  const isEV = car.powertrain === 'eletrico'
  const age = Math.max(0, year - car.modelYear)

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
            <NumberField label="Manutenção por ano" prefix="R$" value={car.maintenanceYear} onChange={(v) => set('maintenanceYear', v)} hint="Revisões, pneus, freios" />
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
