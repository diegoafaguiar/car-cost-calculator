import { useEffect, useRef, useState } from 'react'
import { CATEGORY_LABEL, CATEGORY_ORDER, POWERTRAIN_LABEL, TRANSMISSION_LABEL } from '../lib/catalog'
import { transmissionFromFipeName, yearOf, ZERO_KM_YEAR } from '../lib/fipe'
import { money } from '../lib/format'
import type { Category, Consumption, CustomCar, Powertrain, Transmission } from '../lib/types'
import { FipePicker } from './FipePicker'
import { Button, NumberField, SelectField, TextField } from './ui'

interface Props {
  year: number
  cars: CustomCar[]
  onChange: (cars: CustomCar[]) => void
  onClose: () => void
  initialSearch?: string
}

const EMPTY_CONS: Consumption = { cityKmL: 0, roadKmL: 0 }

/** Adiciona à comparação um carro que não está no catálogo, a partir da FIPE. */
export function CustomCarDialog({ year, cars, onChange, onClose, initialSearch }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => ref.current?.showModal(), [])

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState(initialSearch ?? '')
  const [version, setVersion] = useState('')
  const [modelYear, setModelYear] = useState(year)
  const [price, setPrice] = useState(0)
  const [priceSource, setPriceSource] = useState<'fipe' | 'manual'>('manual')
  const [fipeReference, setFipeReference] = useState<string | undefined>()
  const [category, setCategory] = useState<Category>('suv-medio')
  const [powertrain, setPowertrain] = useState<Powertrain>('flex')
  const [transmission, setTransmission] = useState<Transmission>('automatico')
  const [seats, setSeats] = useState(5)
  const [cons, setCons] = useState<Consumption>(EMPTY_CONS)

  const isEV = powertrain === 'eletrico'
  const hasFuel = !isEV
  const hasKWh = powertrain === 'eletrico' || powertrain === 'hibrido-plugin'
  const hasEthanol = powertrain === 'flex' || powertrain === 'hibrido' || powertrain === 'hibrido-plugin'
  const consOk =
    (!hasFuel || (cons.cityKmL > 0 && cons.roadKmL > 0)) && (!hasKWh || ((cons.cityKmKWh ?? 0) > 0 && (cons.roadKmKWh ?? 0) > 0))
  const valid = brand.trim() && model.trim() && price > 0 && consOk
  const setC = (k: keyof Consumption, v: number) => setCons((c) => ({ ...c, [k]: v }))

  const save = () => {
    if (!valid) return
    // Campos opcionais zerados viram "não informado" (etanol ausente = só gasolina).
    const opt = (v?: number) => (v && v > 0 ? v : undefined)
    const consumption: Consumption = {
      cityKmL: isEV ? 0 : cons.cityKmL,
      roadKmL: isEV ? 0 : cons.roadKmL,
      cityKmLEthanol: hasEthanol && !isEV ? opt(cons.cityKmLEthanol) : undefined,
      roadKmLEthanol: hasEthanol && !isEV ? opt(cons.roadKmLEthanol) : undefined,
      cityKmKWh: hasKWh ? opt(cons.cityKmKWh) : undefined,
      roadKmKWh: hasKWh ? opt(cons.roadKmKWh) : undefined,
    }
    onChange([
      ...cars,
      {
        id: crypto.randomUUID(),
        brand: brand.trim(),
        model: model.trim(),
        version: version.trim() || '—',
        modelYear,
        category,
        powertrain,
        transmission,
        seats,
        consumption,
        price,
        priceSource,
        fipeReference,
      },
    ])
    ref.current?.close()
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(640px,calc(100%-2rem))] max-h-[90dvh] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/40"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Adicionar um carro à comparação</h2>
          <p className="text-xs text-ink-2">Para modelos fora do catálogo. Busque o preço na FIPE e informe o consumo.</p>
        </div>
        <Button variant="ghost" onClick={() => ref.current?.close()}>
          Fechar
        </Button>
      </div>

      <div className="space-y-5 p-5">
        <section className="space-y-3 rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold">1. Modelo e preço (Tabela FIPE)</h3>
          <FipePicker
            onSelect={(sel, p) => {
              const y = yearOf(sel.yearCode)
              setBrand(sel.brandName.replace(/^.*- /, ''))
              setModel(sel.modelName.split(' ')[0])
              setVersion(sel.modelName)
              const t = transmissionFromFipeName(sel.modelName)
              if (t) setTransmission(t)
              setModelYear(y === ZERO_KM_YEAR ? year : y)
              if (p?.price) {
                setPrice(p.price)
                setPriceSource('fipe')
                setFipeReference(p.referenceMonth)
              }
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Marca" value={brand} onChange={setBrand} />
            <TextField label="Modelo" value={model} onChange={setModel} />
            <TextField label="Versão" value={version} onChange={setVersion} />
            <NumberField label="Ano-modelo" value={modelYear} onChange={(v) => setModelYear(Math.round(v))} hint={modelYear >= year ? 'Tratado como 0 km' : 'Tratado como seminovo'} />
            <NumberField
              label="Preço"
              prefix="R$"
              value={price}
              onChange={(v) => {
                setPrice(v)
                setPriceSource('manual')
              }}
              hint={priceSource === 'fipe' ? `FIPE ${fipeReference ?? ''}` : 'Informado manualmente'}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold">2. Categoria, motorização e câmbio</h3>
          <div className="grid gap-3 sm:grid-cols-4">
            <SelectField<Category>
              label="Categoria"
              value={category}
              options={CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))}
              onChange={setCategory}
            />
            <SelectField<Powertrain>
              label="Motorização"
              value={powertrain}
              options={(Object.keys(POWERTRAIN_LABEL) as Powertrain[]).map((p) => ({ value: p, label: POWERTRAIN_LABEL[p] }))}
              onChange={setPowertrain}
            />
            <SelectField<Transmission>
              label="Câmbio"
              value={transmission}
              options={(Object.keys(TRANSMISSION_LABEL) as Transmission[]).map((t) => ({ value: t, label: TRANSMISSION_LABEL[t] }))}
              onChange={setTransmission}
            />
            <NumberField label="Lugares" value={seats} onChange={(v) => setSeats(Math.round(v))} />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold">3. Consumo (INMETRO/PBEV)</h3>
          <p className="text-xs text-muted">
            Use os valores oficiais da etiqueta do INMETRO (site da montadora ou tabela PBEV). Sem consumo informado, o carro
            não entra na comparação.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {hasFuel && (
              <>
                <NumberField label="Cidade (gasolina)" suffix="km/l" value={cons.cityKmL} onChange={(v) => setC('cityKmL', v)} />
                <NumberField label="Estrada (gasolina)" suffix="km/l" value={cons.roadKmL} onChange={(v) => setC('roadKmL', v)} />
              </>
            )}
            {hasFuel && hasEthanol && (
              <>
                <NumberField label="Cidade (etanol, opcional)" suffix="km/l" value={cons.cityKmLEthanol ?? 0} onChange={(v) => setC('cityKmLEthanol', v)} />
                <NumberField label="Estrada (etanol, opcional)" suffix="km/l" value={cons.roadKmLEthanol ?? 0} onChange={(v) => setC('roadKmLEthanol', v)} />
              </>
            )}
            {hasKWh && (
              <>
                <NumberField label="Elétrico cidade" suffix="km/kWh" value={cons.cityKmKWh ?? 0} onChange={(v) => setC('cityKmKWh', v)} />
                <NumberField label="Elétrico estrada" suffix="km/kWh" value={cons.roadKmKWh ?? 0} onChange={(v) => setC('roadKmKWh', v)} />
              </>
            )}
          </div>
          <p className="text-xs text-muted">
            Seguro, manutenção e depreciação usam médias da categoria (estimativas), como nos demais carros sem dados próprios.
          </p>
        </section>

        <div className="flex items-center justify-end gap-2">
          {!valid && <span className="text-xs text-muted">Preencha marca, modelo, preço e consumo.</span>}
          <Button variant="primary" onClick={save} disabled={!valid}>
            Adicionar à comparação
          </Button>
        </div>

        {cars.length > 0 && (
          <section className="border-t border-line pt-4">
            <h3 className="mb-2 text-sm font-semibold">Carros adicionados por você</h3>
            <ul className="divide-y divide-line text-sm">
              {cars.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    {c.brand} {c.model} <span className="text-ink-2">· {c.version} · {c.modelYear}</span>
                    <span className="block text-xs text-muted tabular">
                      {money(c.price)} · {CATEGORY_LABEL[c.category]} · {POWERTRAIN_LABEL[c.powertrain]}
                    </span>
                  </span>
                  <Button variant="ghost" onClick={() => onChange(cars.filter((x) => x.id !== c.id))}>
                    Remover
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </dialog>
  )
}
