import { useEffect, useMemo, useRef, useState } from 'react'
import { AssumptionsForm } from './components/AssumptionsForm'
import { CostChart, type Series } from './components/CostChart'
import { CurrentCarForm } from './components/CurrentCarForm'
import { DetailDrawer } from './components/DetailDrawer'
import { Insights } from './components/Insights'
import { KIND_LABEL, RankingTable, type SortKey } from './components/RankingTable'
import { Button, Card, ChipGroup, NumberField, Segmented, TextField } from './components/ui'
import { CATALOG, CATEGORY_LABEL, POWERTRAIN_LABEL } from './lib/catalog'
import { DEFAULT_ASSUMPTIONS, DEFAULT_CAR, DEFAULT_PREFERENCES } from './lib/defaults'
import { FipeError, resolveCatalogPrice, setFipeToken, type FipeOverride } from './lib/fipe'
import { normalize } from './lib/format'
import { buildScenarios, currentCarValue, priceKey, runAll, type PriceEntry } from './lib/tco'
import type { Category, Horizon, Powertrain, ScenarioKind, ScenarioResult } from './lib/types'
import { HORIZONS } from './lib/types'
import { usePersisted } from './lib/usePersisted'

const YEAR = new Date().getFullYear()
const SERIES_COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)']
const MAX_COMPARE = SERIES_COLORS.length

function sortValue(r: ScenarioResult, key: SortKey, horizon: Horizon, rank: number): number | string {
  const h = r.horizons[horizon]
  switch (key) {
    case 'rank':
      return rank
    case 'label':
      return `${r.scenario.label} ${r.scenario.detail}`
    case 'price':
      return r.scenario.price
    case 'upfront':
      return r.upfrontCash
    case 'installment':
      return r.scenario.plan?.monthlyFee ?? r.installment
    case 'monthly':
      return h.monthly
    case 't1':
      return r.horizons[1].total
    case 't3':
      return r.horizons[3].total
    case 't5':
      return r.horizons[5].total
    case 'perKm':
      return h.perKm
    case 'savings':
      return h.savingsVsKeep
    case 'breakEven':
      return r.breakEvenMonth ?? 999
  }
}

export default function App() {
  const [car, setCar] = usePersisted('ccc:car', DEFAULT_CAR)
  const [assumptions, setAssumptions] = usePersisted('ccc:assumptions', DEFAULT_ASSUMPTIONS)
  const [prefs, setPrefs] = usePersisted('ccc:prefs', DEFAULT_PREFERENCES)
  const [prices, setPrices] = usePersisted<Record<string, PriceEntry>>('ccc:prices', {})
  const [overrides, setOverrides] = usePersisted<Record<string, FipeOverride>>('ccc:overrides', {})
  const [token, setToken] = usePersisted('ccc:fipeToken', '')
  const [compare, setCompare] = usePersisted<string[]>('ccc:compare', [])
  const [onlySavings, setOnlySavings] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'rank', dir: 1 })
  const [openId, setOpenId] = useState<string | null>(null)
  const [fetchState, setFetchState] = useState<{ done: number; total: number; failed: number; error?: string } | null>(null)
  const abort = useRef(false)

  useEffect(() => setFipeToken(token), [token])

  const results = useMemo(() => {
    const scenarios = buildScenarios({ car, assumptions, usedAges: prefs.usedAges, prices, year: YEAR })
    return runAll(scenarios, { assumptions, car })
  }, [car, assumptions, prefs.usedAges, prices])

  const keep = results.find((r) => r.scenario.kind === 'keep')
  const horizon = prefs.rankHorizon

  const filtered = useMemo(() => {
    const words = normalize(prefs.search).split(/\s+/).filter(Boolean)
    return results.filter((r) => {
      const s = r.scenario
      if (!prefs.kinds.includes(s.kind)) return false
      if (s.kind === 'keep') return true
      if (!prefs.categories.includes(s.category)) return false
      if (!prefs.powertrains.includes(s.powertrain)) return false
      if (prefs.maxPrice > 0 && s.price > prefs.maxPrice) return false
      if (prefs.maxMonthly > 0 && r.horizons[horizon].monthly > prefs.maxMonthly) return false
      if (prefs.minSeats > 0 && (s.seats ?? 5) < prefs.minSeats) return false
      if (onlySavings && r.horizons[horizon].savingsVsKeep <= 0) return false
      if (words.length) {
        const text = normalize(`${s.label} ${s.detail} ${KIND_LABEL[s.kind]}`)
        if (!words.every((w) => text.includes(w))) return false
      }
      return true
    })
  }, [results, prefs, horizon, onlySavings])

  const ranked = useMemo(
    () => [...filtered].sort((a, b) => a.horizons[horizon].total - b.horizons[horizon].total),
    [filtered, horizon],
  )

  const rows = useMemo(() => {
    const withRank = ranked.map((result, i) => ({ result, rank: i + 1 }))
    return withRank.sort((a, b) => {
      const va = sortValue(a.result, sort.key, horizon, a.rank)
      const vb = sortValue(b.result, sort.key, horizon, b.rank)
      const c = typeof va === 'string' ? va.localeCompare(String(vb), 'pt-BR') : va - (vb as number)
      return c * sort.dir
    })
  }, [ranked, sort, horizon])

  // Na primeira visita, compara as 4 melhores opções; depois a escolha do usuário é mantida.
  useEffect(() => {
    if (compare.length === 0 && ranked.length > 1) {
      setCompare(ranked.filter((r) => r.scenario.kind !== 'keep').slice(0, 4).map((r) => r.scenario.id))
    }
  }, [compare.length, ranked, setCompare])

  const colors = useMemo(() => {
    const map: Record<string, string> = {}
    compare.forEach((id, i) => (map[id] = SERIES_COLORS[i % SERIES_COLORS.length]))
    return map
  }, [compare])

  const series: Series[] = useMemo(() => {
    const list: Series[] = []
    if (keep) list.push({ id: 'keep', label: `Manter: ${keep.scenario.label}`, color: 'var(--ink-2)', values: keep.cumulative, dashed: true })
    for (const id of compare) {
      const r = results.find((x) => x.scenario.id === id)
      if (r) list.push({ id, label: `${r.scenario.label} · ${r.scenario.detail.split(' · ').pop()}`, color: colors[id], values: r.cumulative })
    }
    return list
  }, [keep, compare, results, colors])

  const toggleCompare = (id: string) => {
    if (id === 'keep') return
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= MAX_COMPARE ? c : [...c, id]))
  }

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === 'savings' ? -1 : 1 }))

  async function refreshPrices() {
    abort.current = false
    const models = CATALOG.filter(
      (m) => prefs.categories.includes(m.category) && prefs.powertrains.includes(m.powertrain),
    )
    const ages = [
      ...(prefs.kinds.includes('new') || prefs.kinds.includes('used') ? [0] : []),
      ...(prefs.kinds.includes('used') ? prefs.usedAges : []),
    ]
    const jobs = models.flatMap((m) => ages.map((age) => ({ m, age })))
    const state = { done: 0, total: jobs.length, failed: 0, error: undefined as string | undefined }
    setFetchState({ ...state })

    await Promise.all(
      jobs.map(async ({ m, age }) => {
        if (abort.current) return
        try {
          const r = await resolveCatalogPrice(m, age === 0 ? 0 : YEAR - age, overrides[m.id])
          if (r) {
            setPrices((p) => ({ ...p, [priceKey(m.id, age)]: { price: r.price, source: 'fipe', reference: r.reference } }))
          } else {
            state.failed++
          }
        } catch (e) {
          state.failed++
          if (e instanceof FipeError && e.status === 429) {
            abort.current = true
            state.error = e.message
          } else if (!state.error) {
            state.error = e instanceof Error ? e.message : 'Falha ao consultar a FIPE.'
          }
        } finally {
          state.done++
          setFetchState({ ...state })
        }
      }),
    )
  }

  const fetching = fetchState !== null && fetchState.done < fetchState.total
  const fipeCount = results.filter((r) => r.scenario.priceSource === 'fipe' && r.scenario.kind !== 'keep').length
  const open = openId ? results.find((r) => r.scenario.id === openId) : undefined
  const hasValue = currentCarValue(car) > 0

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Custo de Carro</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-2">
            Compare o custo total de manter seu carro com 0 km, seminovos e assinatura em 1, 3 e 5 anos —
            com Tabela FIPE, depreciação, financiamento e custo de oportunidade.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="space-y-3 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pr-1">
          <CurrentCarForm car={car} onChange={setCar} year={YEAR} />
          <AssumptionsForm a={assumptions} onChange={setAssumptions} prefs={prefs} onPrefs={setPrefs} token={token} onToken={setToken} />
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm('Restaurar todas as premissas para os valores padrão? Seu carro e preços FIPE salvos serão mantidos.')) {
                setAssumptions(DEFAULT_ASSUMPTIONS)
                setPrefs(DEFAULT_PREFERENCES)
              }
            }}
          >
            Restaurar premissas padrão
          </Button>
        </aside>

        <main className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented<Horizon>
              label="Horizonte do ranking"
              value={horizon}
              options={HORIZONS.map((y) => ({ value: y, label: `${y === 1 ? 'Curto' : y === 3 ? 'Médio' : 'Longo'} · ${y}a` }))}
              onChange={(v) => setPrefs({ ...prefs, rankHorizon: v })}
            />
            <span className="text-xs text-muted">
              Custos em reais nominais, com inflação de {(assumptions.inflationYear * 100).toFixed(1)}% a.a.
            </span>
          </div>

          {!hasValue && (
            <p className="rounded-lg border border-line bg-[#fab219]/12 p-3 text-sm">
              Informe o valor do seu carro (busque na FIPE ou preencha o valor manual) para comparar as opções.
            </p>
          )}
          {car.label.includes('(exemplo)') && (
            <p className="rounded-lg border border-line bg-surface-2 p-3 text-sm text-ink-2">
              Você está vendo um carro de exemplo. Abra <strong className="text-ink">Meu carro</strong> e busque o seu na
              FIPE para ver a sua análise.
            </p>
          )}

          {keep && <Insights keep={keep} ranked={ranked} horizon={horizon} onOpen={setOpenId} />}

          <Card
            title="Custo acumulado"
            subtitle="Perda de patrimônio mês a mês, já descontando a revenda. Marque até 5 opções no ranking para comparar."
          >
            <CostChart series={series} />
          </Card>

          <Card
            title="Ranking de opções"
            subtitle={`Ordenado pelo custo total em ${horizon} ${horizon === 1 ? 'ano' : 'anos'}. Clique numa opção para ver o detalhe.`}
            actions={
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">
                  {fetching
                    ? `Consultando FIPE ${fetchState.done}/${fetchState.total}…`
                    : `${fipeCount} preços FIPE · demais estimados`}
                </span>
                <Button variant="primary" onClick={refreshPrices} disabled={fetching}>
                  Atualizar preços FIPE
                </Button>
              </div>
            }
          >
            {fetchState?.error && !fetching && <p className="mb-3 text-sm text-bad">{fetchState.error}</p>}
            {fetchState && !fetching && !fetchState.error && fetchState.failed > 0 && (
              <p className="mb-3 text-sm text-ink-2">
                {fetchState.failed} preço(s) não encontrados na FIPE para o ano pedido; usando estimativa. Ajuste a versão no
                detalhe da opção, se quiser.
              </p>
            )}

            <div className="mb-4 space-y-3 rounded-lg border border-line bg-surface-2/40 p-3">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <TextField label="Buscar" value={prefs.search} onChange={(v) => setPrefs({ ...prefs, search: v })} placeholder="ex.: corolla, elétrico" />
                <NumberField label="Preço máximo" prefix="R$" step={5000} value={prefs.maxPrice} onChange={(v) => setPrefs({ ...prefs, maxPrice: v })} hint="0 = sem limite" />
                <NumberField label={`Custo mensal máx. (${horizon}a)`} prefix="R$" step={100} value={prefs.maxMonthly} onChange={(v) => setPrefs({ ...prefs, maxMonthly: v })} hint="0 = sem limite" />
                <NumberField label="Lugares mínimos" value={prefs.minSeats} onChange={(v) => setPrefs({ ...prefs, minSeats: Math.round(v) })} />
              </div>
              <ChipGroup<ScenarioKind>
                label="Tipo"
                options={(Object.keys(KIND_LABEL) as ScenarioKind[]).map((k) => ({ value: k, label: KIND_LABEL[k] }))}
                selected={prefs.kinds}
                onChange={(v) => setPrefs({ ...prefs, kinds: v })}
              />
              <ChipGroup<Category>
                label="Categoria"
                options={(Object.keys(CATEGORY_LABEL) as Category[]).map((k) => ({ value: k, label: CATEGORY_LABEL[k] }))}
                selected={prefs.categories}
                onChange={(v) => setPrefs({ ...prefs, categories: v })}
              />
              <ChipGroup<Powertrain>
                label="Motorização"
                options={(Object.keys(POWERTRAIN_LABEL) as Powertrain[]).map((k) => ({ value: k, label: POWERTRAIN_LABEL[k] }))}
                selected={prefs.powertrains}
                onChange={(v) => setPrefs({ ...prefs, powertrains: v })}
              />
              <label className="flex items-center gap-2 text-sm text-ink-2">
                <input type="checkbox" checked={onlySavings} onChange={(e) => setOnlySavings(e.target.checked)} className="size-4 accent-[var(--accent)]" />
                Mostrar só opções que economizam em relação a manter
              </label>
            </div>

            <RankingTable
              rows={rows}
              horizon={horizon}
              sort={sort}
              onSort={onSort}
              compare={compare}
              colors={colors}
              onToggleCompare={toggleCompare}
              onOpen={setOpenId}
            />
          </Card>

          <Methodology />
        </main>
      </div>

      {open && (
        <DetailDrawer
          key={open.scenario.id}
          result={open}
          keep={keep}
          a={assumptions}
          initialHorizon={horizon}
          override={open.scenario.modelId ? overrides[open.scenario.modelId] : undefined}
          onOverride={(id, o) =>
            setOverrides((cur) => {
              const next = { ...cur }
              if (o) next[id] = o
              else delete next[id]
              return next
            })
          }
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  )
}

function Methodology() {
  return (
    <Card title="Como o cálculo funciona">
      <div className="grid gap-4 text-sm text-ink-2 md:grid-cols-2">
        <p>
          <strong className="text-ink">Custo total = perda de patrimônio.</strong> O ponto de partida é vender seu carro
          hoje e aplicar o dinheiro. Cada cenário simula 60 meses de gastos (combustível, seguro, IPVA, manutenção,
          parcelas, mensalidade) e, ao final, soma o valor de revenda do carro e desconta o saldo devedor. A diferença
          para o ponto de partida é o custo real.
        </p>
        <p>
          <strong className="text-ink">Depreciação</strong> segue uma curva de mercado (≈15% no 1º ano de um 0 km,
          caindo para ≈4–10% a.a.), ajustada por marca e por motorização. Seu carro usa a taxa que você informar.
          <strong className="text-ink"> Flex</strong> usa o combustível mais barato por km.
        </p>
        <p>
          <strong className="text-ink">Preços</strong> vêm da Tabela FIPE quando consultados; caso contrário, usam a
          referência do catálogo (0 km) e a curva de depreciação (seminovos). Consumo segue o INMETRO. Seguro e
          manutenção são estimativas por categoria; ajuste o seu carro com os valores reais.
        </p>
        <p>
          <strong className="text-ink">Limitações:</strong> não considera valor de revenda de assinatura (não há),
          reajustes do seguro por sinistro, nem preferências subjetivas (conforto, espaço, tecnologia). Use o ranking
          como base de dados e combine com o que importa para você.
        </p>
      </div>
    </Card>
  )
}

function ThemeToggle() {
  const [theme, setTheme] = usePersisted<'system' | 'light' | 'dark'>('ccc:theme', 'system')
  useEffect(() => {
    const el = document.documentElement
    if (theme === 'system') el.removeAttribute('data-theme')
    else el.setAttribute('data-theme', theme)
  }, [theme])
  return (
    <Segmented
      label="Tema"
      value={theme}
      options={[
        { value: 'system', label: 'Auto' },
        { value: 'light', label: 'Claro' },
        { value: 'dark', label: 'Escuro' },
      ]}
      onChange={setTheme}
    />
  )
}
