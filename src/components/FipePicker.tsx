import { useEffect, useMemo, useState } from 'react'
import { getBrands, getModels, getPrice, getYears, type FipeItem, type FipePrice } from '../lib/fipe'
import { normalize } from '../lib/format'
import type { FipeSelection } from '../lib/types'
import { SelectField, TextField } from './ui'

interface Props {
  value?: Partial<FipeSelection>
  /** Sem ano: escolhe só marca e modelo (o ano é definido pelo cenário). */
  withYear?: boolean
  onSelect: (sel: FipeSelection, price?: FipePrice) => void
}

export function FipePicker({ value, withYear = true, onSelect }: Props) {
  const [brands, setBrands] = useState<FipeItem[]>([])
  const [models, setModels] = useState<FipeItem[]>([])
  const [years, setYears] = useState<FipeItem[]>([])
  const [brand, setBrand] = useState(value?.brandCode ?? '')
  const [model, setModel] = useState(value?.modelCode ?? '')
  const [year, setYear] = useState(value?.yearCode ?? '')
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState('')
  const [error, setError] = useState('')

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : 'Falha ao consultar a FIPE')

  useEffect(() => {
    setLoading('marcas')
    getBrands()
      .then(setBrands)
      .catch(fail)
      .finally(() => setLoading(''))
  }, [])

  useEffect(() => {
    setModels([])
    if (!brand) return
    setLoading('modelos')
    getModels(brand)
      .then(setModels)
      .catch(fail)
      .finally(() => setLoading(''))
  }, [brand])

  useEffect(() => {
    setYears([])
    if (!brand || !model || !withYear) return
    setLoading('anos')
    getYears(brand, model)
      .then(setYears)
      .catch(fail)
      .finally(() => setLoading(''))
  }, [brand, model, withYear])

  const filteredModels = useMemo(() => {
    const words = normalize(filter).split(/\s+/).filter(Boolean)
    return models.filter((m) => {
      const n = normalize(m.name)
      return words.every((w) => n.includes(w)) || m.code === model
    })
  }, [models, filter, model])

  const brandName = brands.find((b) => b.code === brand)?.name ?? value?.brandName ?? ''
  const modelName = models.find((m) => m.code === model)?.name ?? value?.modelName ?? ''

  const pickModel = (code: string) => {
    setModel(code)
    setYear('')
    if (!withYear) {
      const name = models.find((m) => m.code === code)?.name ?? ''
      onSelect({ brandCode: brand, brandName, modelCode: code, modelName: name, yearCode: '', yearName: '' })
    }
  }

  const pickYear = async (code: string) => {
    setYear(code)
    setError('')
    setLoading('preço')
    try {
      const price = await getPrice(brand, model, code)
      const yearName = years.find((y) => y.code === code)?.name ?? ''
      onSelect({ brandCode: brand, brandName, modelCode: model, modelName, yearCode: code, yearName }, price)
    } catch (e) {
      fail(e)
    } finally {
      setLoading('')
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Marca"
          value={brand}
          options={brands.map((b) => ({ value: b.code, label: b.name }))}
          onChange={(v) => {
            setBrand(v)
            setModel('')
            setYear('')
          }}
          disabled={!brands.length}
        />
        <TextField label="Filtrar modelo" value={filter} onChange={setFilter} placeholder="ex.: onix lt 1.0" />
      </div>
      <SelectField
        label={`Modelo${filteredModels.length ? ` (${filteredModels.length})` : ''}`}
        value={model}
        options={filteredModels.map((m) => ({ value: m.code, label: m.name }))}
        onChange={pickModel}
        disabled={!models.length}
      />
      {withYear && (
        <SelectField
          label="Ano / combustível"
          value={year}
          options={years.map((y) => ({ value: y.code, label: y.name.replace('32000', 'Zero km') }))}
          onChange={pickYear}
          disabled={!years.length}
        />
      )}
      <p className="text-xs text-muted" aria-live="polite">
        {error ? <span className="text-bad">{error}</span> : loading ? `Carregando ${loading}…` : 'Fonte: Tabela FIPE (API Parallelum)'}
      </p>
    </div>
  )
}
