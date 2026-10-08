import { useEffect, useMemo, useRef, useState } from 'react'
import { BreakdownBars } from './components/BreakdownBars'
import { CarHero } from './components/CarHero'
import { Comparator } from './components/Comparator'
import { CustomCarDialog } from './components/CustomCarDialog'
import { CostChart, type Series } from './components/CostChart'
import { DetailDrawer } from './components/DetailDrawer'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ExportMenu } from './components/ExportMenu'
import { FilterBar } from './components/FilterBar'
import { ModelPage } from './components/ModelPage'
import { KIND_LABEL, RankingTable, type SortKey } from './components/RankingTable'
import { SettingsDrawer, type SettingsTab } from './components/SettingsDrawer'
import { TopModels } from './components/TopModels'
import { TradeInCard } from './components/TradeInCard'
import { Button, Card } from './components/ui'
import { CATALOG } from './lib/catalog'
import { DEFAULT_ASSUMPTIONS, DEFAULT_CAR, DEFAULT_PREFERENCES } from './lib/defaults'
import { FipeError, resolveCatalogPrice, setFipeToken, type FipeOverride } from './lib/fipe'
import { money, normalize } from './lib/format'
import { buildScenarios, currentCarValue, groupByModel, modelYearOf, tradeInFor, priceKey, runAll, type PriceEntry } from './lib/tco'
import type { CustomCar, Horizon, Preferences, RankRow, ScenarioResult } from './lib/types'
import { usePersisted } from './lib/usePersisted'

const YEAR = new Date().getFullYear()
const START_MONTH = new Date().getMonth()
const SERIES_COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)']
const MAX_COMPARE = SERIES_COLORS.length

/** Campos de preferência que são filtros (o botão "Limpar filtros" volta só estes ao padrão). */
const FILTER_KEYS = [
  'categories', 'powertrains', 'transmissions', 'kinds', 'maxPrice', 'minPrice', 'maxMonthly', 'minSeats',
  'minModelYear', 'maxModelYear', 'groupByModel', 'search', 'brands',
] as const satisfies readonly (keyof Preferences)[]
const pickFilters = (p: Preferences) => Object.fromEntries(FILTER_KEYS.map((k) => [k, p[k]])) as Partial<Preferences>
const filtersAreDefault = (p: Preferences) =>
  FILTER_KEYS.every((k) => JSON.stringify(p[k]) === JSON.stringify(DEFAULT_PREFERENCES[k]))

/**
 * Remove (uma vez) preços FIPE salvos com uma busca errada. O Onix Plus buscava a versão LT,
 * mais barata, embora o catálogo seja o LTZ; esses preços somem até a próxima atualização.
 */
const STALE_PRICE_FIXES: { flag: string; modelIds: string[] }[] = [
  { flag: 'ccc:fix:onix-plus-ltz', modelIds: ['chevrolet-onix-plus'] },
  // 208: catálogo é o Style, a busca FIPE pegava o Active.
  { flag: 'ccc:fix:208-style', modelIds: ['peugeot-208'] },
]
function dropStalePrices(stored: Record<string, unknown>) {
  const out = { ...stored }
  for (const fix of STALE_PRICE_FIXES) {
    try {
      if (localStorage.getItem(fix.flag)) continue
      for (const k of Object.keys(out)) if (fix.modelIds.includes(k.split(':')[0])) delete out[k]
      localStorage.setItem(fix.flag, '1')
    } catch {
      // Sem armazenamento: nada salvo para corrigir.
    }
  }
  return out
}

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
    case 'total':
      return h.total
    case 't1':
      return r.horizons[1].total
    case 't3':
      return r.horizons[3].total
    case 't5':
      return r.horizons[5].total
    case 'adjusted':
      return h.adjusted
    case 'perKm':
      return h.perKm
    case 'savings':
      return h.savingsVsKeep
    case 'breakEven':
      return r.breakEvenMonth ?? 999
  }
}

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const on = () => {
      setHash(window.location.hash)
      if (window.location.hash.startsWith('#/')) window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

export default function App() {
  const route = useHashRoute()
  const modelRoute = route.match(/^#\/carro\/([\w-]+)/)?.[1]
  const [car, setCar] = usePersisted('ccc:car', DEFAULT_CAR, (s) => {
    // Versões anteriores não separavam as revisões: os R$ 4.200/ano já as incluíam.
    if (s.revisions !== undefined) {
      // Plano Toyota padrão sem calibração: aplica a revisão real informada (uma vez; null = o usuário removeu).
      const rp = s.revisions as { reference?: string; actual?: unknown } | null
      if (rp && rp.actual === undefined && rp.reference === DEFAULT_CAR.revisions?.reference) {
        return { ...s, revisions: { ...rp, actual: DEFAULT_CAR.revisions?.actual } }
      }
      return s
    }
    return s.maintenanceYear === 4200
      ? { ...s, maintenanceYear: DEFAULT_CAR.maintenanceYear, revisions: DEFAULT_CAR.revisions }
      : { ...s, revisions: null }
  })
  const [assumptions, setAssumptions] = usePersisted('ccc:assumptions', DEFAULT_ASSUMPTIONS, (s) =>
    // Versões anteriores tinham uma única alíquota para híbridos (1,5%): separa HEV e plug-in.
    s.ipvaRatePHEV === undefined
      ? { ...s, ipvaRatePHEV: s.ipvaRateHybrid ?? DEFAULT_ASSUMPTIONS.ipvaRatePHEV, ipvaRateHybrid: s.ipvaRateHybrid === 0.015 ? 0.04 : s.ipvaRateHybrid }
      : s,
  )
  const [prefs, setPrefs] = usePersisted('ccc:prefs', DEFAULT_PREFERENCES, (s) =>
    // O padrão antigo simulava só seminovos de 2 e 4 anos; amplia para 1 a 4.
    JSON.stringify(s.usedAges) === '[2,4]' ? { ...s, usedAges: [1, 2, 3, 4] } : s,
  )
  const [prices, setPrices] = usePersisted<Record<string, PriceEntry>>('ccc:prices', {}, dropStalePrices)
  const [overrides, setOverrides] = usePersisted<Record<string, FipeOverride>>('ccc:overrides', {})
  const [token, setToken] = usePersisted('ccc:fipeToken', '')
  const [compare, setCompare] = usePersisted<string[]>('ccc:compare', [])
  const [customCars, setCustomCars] = usePersisted<CustomCar[]>('ccc:customCars', [])
  const [adding, setAdding] = useState<string | null>(null)
  const [onlySavings, setOnlySavings] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'rank', dir: 1 })
  const [openId, setOpenId] = useState<string | null>(null)
  const [settings, setSettings] = useState<SettingsTab | null>(null)
  const [fetchState, setFetchState] = useState<{ done: number; total: number; failed: number; error?: string } | null>(null)
  const abort = useRef(false)

  useEffect(() => setFipeToken(token), [token])

  const simCtx = useMemo(() => ({ assumptions, car, startMonth: START_MONTH, year: YEAR }), [assumptions, car])
  const results = useMemo(() => {
    const scenarios = buildScenarios({ car, assumptions, usedAges: prefs.usedAges, prices, year: YEAR, customCars })
    return runAll(scenarios, simCtx, prefs.powertrainValue)
  }, [simCtx, car, assumptions, prefs.usedAges, prefs.powertrainValue, prices, customCars])

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
      if (prefs.brands?.length && s.kind !== 'subscription' && !prefs.brands.includes(s.brand ?? '')) return false
      if (prefs.maxPrice > 0 && s.price > prefs.maxPrice) return false
      if (prefs.minPrice > 0 && s.kind !== 'subscription' && s.price < prefs.minPrice) return false
      const my = modelYearOf(s, YEAR)
      if (my !== null && prefs.minModelYear > 0 && my < prefs.minModelYear) return false
      if (my !== null && prefs.maxModelYear > 0 && my > prefs.maxModelYear) return false
      if (prefs.maxMonthly > 0 && r.horizons[horizon].monthly > prefs.maxMonthly) return false
      if (prefs.minSeats > 0 && (s.seats ?? 5) < prefs.minSeats) return false
      if (s.transmission && prefs.transmissions && !prefs.transmissions.includes(s.transmission)) return false
      if (onlySavings && r.horizons[horizon].savingsVsKeep <= 0) return false
      if (words.length) {
        const text = normalize(`${s.label} ${s.detail} ${KIND_LABEL[s.kind]}`)
        if (!words.every((w) => text.includes(w))) return false
      }
      return true
    })
  }, [results, prefs, horizon, onlySavings])

  const score = useMemo(
    () => (r: ScenarioResult, h: Horizon) => (prefs.rankBy === 'ajustado' ? r.horizons[h].adjusted : r.horizons[h].total),
    [prefs.rankBy],
  )
  const ranked = useMemo(
    () => [...filtered].sort((a, b) => score(a, horizon) - score(b, horizon)),
    [filtered, horizon, score],
  )
  const hasPreference = Object.values(prefs.powertrainValue ?? {}).some((v) => v)

  const rows = useMemo(() => {
    const withRank: RankRow[] = prefs.groupByModel ? groupByModel(ranked) : ranked.map((result, i) => ({ result, rank: i + 1 }))
    return withRank.sort((a, b) => {
      const va = sortValue(a.result, sort.key, horizon, a.rank)
      const vb = sortValue(b.result, sort.key, horizon, b.rank)
      const c = typeof va === 'string' ? va.localeCompare(String(vb), 'pt-BR') : va - (vb as number)
      return c * sort.dir
    })
  }, [ranked, sort, horizon, prefs.groupByModel])

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

  const resetFilters =
    filtersAreDefault(prefs) && !onlySavings
      ? undefined
      : () => {
          setPrefs({ ...prefs, ...pickFilters(DEFAULT_PREFERENCES) })
          setOnlySavings(false)
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
    const jobs = models.flatMap((m) =>
      ages.filter((age) => YEAR - age >= (m.since ?? 0)).map((age) => ({ m, age })),
    )
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

  const exportCtx = () => ({
    car,
    keep,
    ranked,
    compared: compare.map((id) => results.find((r) => r.scenario.id === id)).filter((r): r is ScenarioResult => !!r),
    horizon,
    includeOpportunity: assumptions.includeOpportunity !== false,
    tradeIn: tradeInFor(car, assumptions, YEAR),
    url: window.location.origin + window.location.pathname,
  })

  const fetching = fetchState !== null && fetchState.done < fetchState.total
  const fipeCount = results.filter((r) => r.scenario.priceSource === 'fipe' && r.scenario.kind !== 'keep').length
  const open = openId ? results.find((r) => r.scenario.id === openId) : undefined
  const hasValue = currentCarValue(car) > 0

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-4 sm:px-6">
          <a href="#/" className="flex shrink-0 items-center gap-2.5" aria-label="Custo de Carro — início">
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-ink" aria-hidden>
              <svg viewBox="0 0 24 24" className="size-5">
                <path d="M4 15l1.8-4.6A2.5 2.5 0 0 1 8.1 9h7.8a2.5 2.5 0 0 1 2.3 1.4L20 15v3a1 1 0 0 1-1 1h-1.2a1 1 0 0 1-1-1v-.8H7.2v.8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" fill="currentColor" />
              </svg>
            </span>
            <span className="hidden leading-tight min-[430px]:block">
              <span className="block text-sm font-semibold tracking-tight whitespace-nowrap">Custo de Carro</span>
              <span className="hidden text-xs text-muted sm:block">Manter, trocar ou assinar — com dados</span>
            </span>
          </a>
          <nav className="ml-auto flex items-center gap-0.5 whitespace-nowrap sm:gap-1.5">
            {!modelRoute && <ExportMenu ctx={exportCtx} />}
            <Button variant="ghost" onClick={() => setSettings('car')}>
              Meu carro
            </Button>
            <Button variant="ghost" onClick={() => setSettings('assumptions')}>
              Premissas
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:py-8">
        {modelRoute ? (
          <main>
            <ErrorBoundary area="Ficha do carro">
            <ModelPage
              modelId={modelRoute}
              results={results}
              ranked={ranked}
              keep={keep}
              horizon={horizon}
              onHorizon={(v) => setPrefs({ ...prefs, rankHorizon: v })}
              assumptions={assumptions}
              car={car}
              maxCompare={MAX_COMPARE}
              onCompare={(ids) => {
                setCompare(ids)
                window.location.hash = '#/'
                setTimeout(() => document.getElementById('sec-compare')?.scrollIntoView({ behavior: 'smooth' }), 80)
              }}
            />
            </ErrorBoundary>
          </main>
        ) : (
          <main className="space-y-6">
            <SectionNav />

            {!hasValue && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-warn-soft p-4 text-sm">
                Informe o valor do seu carro (busque na FIPE ou preencha manualmente) para comparar as opções.
                <Button variant="primary" onClick={() => setSettings('car')}>
                  Cadastrar meu carro
                </Button>
              </div>
            )}

            {keep && (
              <section id="sec-summary" className="scroll-mt-32">
              <CarHero
                car={car}
                keep={keep}
                ranked={ranked}
                horizon={horizon}
                score={score}
                onEdit={() => setSettings('car')}
                onOpen={setOpenId}
                includeOpportunity={assumptions.includeOpportunity !== false}
                onIncludeOpportunity={(v) => setAssumptions({ ...assumptions, includeOpportunity: v })}
                investReturn={assumptions.investReturnYear}
                onHorizon={(v) => setPrefs({ ...prefs, rankHorizon: v })}
                compare={compare}
                onToggleCompare={toggleCompare}
                usingPreference={prefs.rankBy === 'ajustado' && hasPreference}
                tradeIn={tradeInFor(car, assumptions, YEAR)}
                onEditTrade={() => document.getElementById('sec-trade')?.scrollIntoView({ behavior: 'smooth' })}
              />
              </section>
            )}

            {keep && (
              <section id="sec-trade" className="scroll-mt-32">
                <ErrorBoundary area="Troca">
                  <TradeInCard
                    car={car}
                    onCar={setCar}
                    ctx={simCtx}
                    keep={keep}
                    best={ranked.find((r) => r.scenario.kind !== 'keep')}
                    horizon={horizon}
                    onEditCar={() => setSettings('car')}
                    onEditAssumptions={() => setSettings('assumptions')}
                  />
                </ErrorBoundary>
              </section>
            )}

            <section id="sec-filters" className="scroll-mt-32">
            <FilterBar
              prefs={prefs}
              onPrefs={setPrefs}
              carCategory={car.category}
              onlySavings={onlySavings}
              onOnlySavings={setOnlySavings}
              resultCount={ranked.length}
              onAddCustom={(q) => setAdding(q)}
              onReset={resetFilters}
            />
            </section>

            <section id="sec-top" className="scroll-mt-32">
              <ErrorBoundary area="Top 10">
              <TopModels ranked={ranked} horizon={horizon} compare={compare} onToggleCompare={toggleCompare} max={MAX_COMPARE} />
              </ErrorBoundary>
            </section>

            <section id="sec-compare" className="scroll-mt-32">
              <ErrorBoundary area="Comparação">
              <Comparator
                keep={keep}
                results={results}
                ranked={ranked}
                compare={compare}
                colors={colors}
                max={MAX_COMPARE}
                onToggle={toggleCompare}
                horizon={horizon}
                onHorizon={(v) => setPrefs({ ...prefs, rankHorizon: v })}
                assumptions={assumptions}
                onOpen={setOpenId}
                carModelId={car.catalogModelId}
                carModelYear={car.modelYear}
              />
              </ErrorBoundary>
            </section>

            <div id="sec-chart" className="grid scroll-mt-32 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Card className="min-w-0" title="Custo acumulado" subtitle="Perda de patrimônio mês a mês, já descontando a revenda">
                <CostChart series={series} />
              </Card>
              {keep && (
                <Card
                  className="min-w-0"
                  title="Para onde vai o dinheiro do seu carro"
                  subtitle={`${horizon} ${horizon === 1 ? 'ano' : 'anos'} · ${money(keep.horizons[horizon].total)} no total`}
                >
                  <BreakdownBars breakdown={keep.horizons[horizon].breakdown} total={keep.horizons[horizon].total} />
                </Card>
              )}
            </div>

            <section id="sec-ranking" className="scroll-mt-32">
            <Card
              title="Ranking completo"
              subtitle={`Ordenado pelo ${prefs.rankBy === 'ajustado' && hasPreference ? 'custo ajustado à sua preferência' : 'custo total'} em ${horizon} ${horizon === 1 ? 'ano' : 'anos'}. Clique numa linha para ver o detalhe.`}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted">
                    {fetching ? `Consultando FIPE ${fetchState.done}/${fetchState.total}…` : `${fipeCount} preços FIPE ao vivo`}
                  </span>
                  <Button onClick={() => setAdding('')}>+ Adicionar carro</Button>
                  <Button variant="primary" onClick={refreshPrices} disabled={fetching}>
                    Atualizar preços FIPE
                  </Button>
                </div>
              }
            >
              {fetchState?.error && !fetching && <p className="mb-3 text-sm text-bad">{fetchState.error}</p>}
              {fetchState && !fetching && !fetchState.error && fetchState.failed > 0 && (
                <p className="mb-3 text-sm text-ink-2">
                  {fetchState.failed} preço(s) não encontrados na FIPE para o ano pedido; usando estimativa. Ajuste a versão
                  no detalhe da opção, se quiser.
                </p>
              )}
              <RankingTable
                rows={rows}
                horizon={horizon}
                sort={sort}
                onSort={onSort}
                compare={compare}
                colors={colors}
                onToggleCompare={toggleCompare}
                onOpen={setOpenId}
                showAdjusted={hasPreference}
                keep={keep}
                onResetFilters={resetFilters}
              />
            </Card>
            </section>

            <Methodology inflation={assumptions.inflationYear} />
          </main>
        )}
        <footer className="mt-10 border-t border-line pt-6 text-xs text-muted">
          Preços: Tabela FIPE (API Parallelum) e fichas pesquisadas com fontes citadas. Estimativas são sinalizadas. Não é
          recomendação financeira.
        </footer>
      </div>

      {adding !== null && (
        <CustomCarDialog
          year={YEAR}
          cars={customCars}
          onChange={setCustomCars}
          onClose={() => setAdding(null)}
          initialSearch={adding}
        />
      )}

      {settings && (
        <SettingsDrawer
          tab={settings}
          onClose={() => setSettings(null)}
          car={car}
          onCar={setCar}
          assumptions={assumptions}
          onAssumptions={setAssumptions}
          prefs={prefs}
          onPrefs={setPrefs}
          token={token}
          onToken={setToken}
          year={YEAR}
        />
      )}

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
          inCompare={compare.includes(open.scenario.id)}
          onToggleCompare={() => toggleCompare(open.scenario.id)}
        />
      )}
    </div>
  )
}

const SECTIONS = [
  ['sec-summary', 'Resumo'],
  ['sec-trade', 'Troca'],
  ['sec-filters', 'Filtros'],
  ['sec-top', 'Top 10'],
  ['sec-compare', 'Comparar'],
  ['sec-chart', 'Evolução do custo'],
  ['sec-ranking', 'Ranking'],
] as const

/** Atalhos para as seções do painel. */
function SectionNav() {
  return (
    <nav aria-label="Seções" className="sticky top-14 z-20 -mx-4 -mt-6 border-b border-line bg-page/90 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mt-8">
      <ul className="flex gap-1 overflow-x-auto py-2 text-sm">
        {SECTIONS.map(([id, label]) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="rounded-lg px-3 py-1.5 font-medium whitespace-nowrap text-ink-2 hover:bg-surface hover:text-ink"
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Methodology({ inflation }: { inflation: number }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
        Como o cálculo funciona
        <span className="text-sm font-normal text-muted group-open:hidden">mostrar</span>
      </summary>
      <div className="mt-4 grid gap-4 text-sm text-ink-2 md:grid-cols-2">
        <p>
          <strong className="text-ink">Custo total = perda de patrimônio.</strong> O ponto de partida é vender seu carro
          hoje e aplicar o dinheiro. Cada cenário simula 60 meses de gastos (combustível, seguro, IPVA, manutenção,
          parcelas, mensalidade) e, ao final, soma o valor de revenda e desconta o saldo devedor.
        </p>
        <p>
          <strong className="text-ink">Depreciação</strong> segue uma curva de mercado (≈15% no 1º ano de um 0 km,
          caindo para ≈4–10% a.a.), ajustada por marca e motorização. Seu carro usa a taxa que você informar.
          <strong className="text-ink"> Flex</strong> usa o combustível mais barato por km. Valores nominais, com
          inflação de {(inflation * 100).toFixed(1)}% a.a.
        </p>
        <p>
          <strong className="text-ink">Preços</strong> vêm da FIPE quando consultados; sem ela, do preço 0 km pesquisado
          (com fonte) ou de uma estimativa pela curva de depreciação. Consumo segue o INMETRO. Seguro e manutenção são
          médias por categoria.
        </p>
        <p>
          <strong className="text-ink">Limitações:</strong> não considera sinistros, condições de negociação nem
          preferências subjetivas além da preferência por motorização. Use o ranking como base de dados e combine com o
          que importa para você.
        </p>
      </div>
    </details>
  )
}

function ThemeToggle() {
  const [theme, setTheme] = usePersisted<'system' | 'light' | 'dark'>('ccc:theme', 'system')
  useEffect(() => {
    const el = document.documentElement
    if (theme === 'system') el.removeAttribute('data-theme')
    else el.setAttribute('data-theme', theme)
  }, [theme])
  const next = { system: 'light', light: 'dark', dark: 'system' } as const
  const label = { system: 'Tema automático', light: 'Tema claro', dark: 'Tema escuro' }[theme]
  return (
    <button
      type="button"
      onClick={() => setTheme(next[theme])}
      title={`${label} (clique para trocar)`}
      aria-label={label}
      className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink"
    >
      <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden>
        {theme === 'dark' ? (
          <path d="M15.5 12.5A6.5 6.5 0 0 1 7.5 4.5a6.5 6.5 0 1 0 8 8z" fill="currentColor" />
        ) : theme === 'light' ? (
          <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <circle cx="10" cy="10" r="3.5" />
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" />
          </g>
        ) : (
          <g fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="10" cy="10" r="7" />
            <path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor" />
          </g>
        )}
      </svg>
    </button>
  )
}
