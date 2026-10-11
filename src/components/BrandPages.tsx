import { useMemo } from 'react'
import { bestFor, brandBySlug, BRANDS, type Brand } from '../lib/brands'
import { CATEGORY_LABEL, CATEGORY_ORDER, POWERTRAIN_LABEL } from '../lib/catalog'
import { money } from '../lib/format'
import { paths, usePageMeta } from '../lib/router'
import type { Horizon, ScenarioResult } from '../lib/types'
import { Breadcrumbs, CarCard, CarGrid, PageHeader, ShareButton } from './Browse'
import { Badge, Button, Card } from './ui'

const yrs = (h: number) => `${h} ${h === 1 ? 'ano' : 'anos'}`
const range = (b: Brand) => (b.priceMin === b.priceMax ? money(b.priceMin) : `${money(b.priceMin)} a ${money(b.priceMax)}`)
const isNew = (b: Brand) => b.newInBrazil

/** Lista de marcas com quantos modelos cada uma tem no catálogo. */
export function BrandsPage() {
  usePageMeta('Marcas de carros no Brasil — modelos e preços | Custo de Carro', `${BRANDS.length} marcas com os modelos à venda no Brasil, faixa de preço e motorizações.`)
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Início', href: paths.home() }, { label: 'Marcas' }]} />
      <PageHeader
        eyebrow={`${BRANDS.length} marcas`}
        title="Marcas"
        subtitle="Escolha uma marca para ver os modelos disponíveis no catálogo, com preço, ficha técnica e custo para você."
        actions={<ShareButton title="Marcas — Custo de Carro" />}
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {BRANDS.map((b) => (
          <li key={b.slug}>
            <a
              href={paths.brand(b.name)}
              className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-accent/40"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-lg font-semibold tracking-tight group-hover:text-accent">{b.name}</span>
                {isNew(b) && <Badge tone="accent">Nova no Brasil</Badge>}
              </span>
              <span className="text-sm text-ink-2">
                {b.models.length} {b.models.length === 1 ? 'modelo' : 'modelos'} · {range(b)}
              </span>
              <span className="mt-3 flex flex-wrap gap-1">
                {b.powertrains.map((p) => (
                  <Badge key={p}>{POWERTRAIN_LABEL[p]}</Badge>
                ))}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface BrandPageProps {
  slug: string
  results: ScenarioResult[]
  keep?: ScenarioResult
  horizon: Horizon
  /** Abre o ranking do painel só com esta marca. */
  onShowInRanking: (brand: string) => void
}

/** Página de uma marca: resumo, melhor opção para o usuário e todos os modelos, por categoria. */
export function BrandPage({ slug, results, keep, horizon, onShowInRanking }: BrandPageProps) {
  const brand = brandBySlug(slug)
  usePageMeta(
    brand ? `${brand.name}: modelos, preços e custo de ter | Custo de Carro` : 'Marca não encontrada | Custo de Carro',
    brand ? `${brand.models.length} modelos da ${brand.name} no Brasil (${range(brand)}): ficha técnica, equipamentos, consumo e custo total em 1, 3 e 5 anos.` : undefined,
  )
  const best = useMemo(() => new Map((brand?.models ?? []).map((m) => [m.id, bestFor(results, m.id, horizon)])), [brand, results, horizon])

  if (!brand) return <NotFound what="Marca" />

  const top = [...best.values()].filter((r): r is ScenarioResult => !!r).sort((a, b) => a.horizons[horizon].total - b.horizons[horizon].total)[0]
  const byCategory = CATEGORY_ORDER.map((c) => [c, brand.models.filter((m) => m.category === c)] as const).filter(([, ms]) => ms.length)

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Início', href: paths.home() }, { label: 'Marcas', href: paths.brands() }, { label: brand.name }]} />
      <PageHeader
        eyebrow={isNew(brand) ? 'Marca nova no Brasil' : 'Marca'}
        title={brand.name}
        subtitle={`${brand.models.length} ${brand.models.length === 1 ? 'modelo' : 'modelos'} no catálogo · 0 km de ${range(brand)}`}
        actions={
          <>
            <ShareButton title={`${brand.name} — Custo de Carro`} />
            <Button variant="primary" onClick={() => onShowInRanking(brand.name)}>
              Ver no ranking
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card title={`Melhor opção da ${brand.name} para você`} subtitle={`Custo total em ${yrs(horizon)}, com as suas premissas`}>
          {top ? (
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <a href={paths.car(top.scenario.modelId!)} className="text-lg font-semibold hover:text-accent hover:underline">
                  {top.scenario.label}
                </a>
                <p className="text-sm text-ink-2">{top.scenario.detail}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold tabular">{money(top.horizons[horizon].monthly)}/mês</p>
                {keep && (
                  <p className={`text-sm tabular ${top.horizons[horizon].savingsVsKeep > 0 ? 'text-good' : 'text-bad'}`}>
                    {top.horizons[horizon].savingsVsKeep > 0 ? '▲ economiza ' : '▼ custa '}
                    {money(Math.abs(top.horizons[horizon].savingsVsKeep))}
                    {top.horizons[horizon].savingsVsKeep > 0 ? '' : ' a mais'} vs. manter
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Sem cálculo disponível.</p>
          )}
        </Card>
        <Card title="Resumo da marca">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Categorias</dt>
              <dd>{brand.categories.map((c) => CATEGORY_LABEL[c]).join(', ')}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Motorizações</dt>
              <dd>{brand.powertrains.map((p) => POWERTRAIN_LABEL[p]).join(', ')}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Desvalorização no cálculo</dt>
              <dd>
                {brand.depreciationFactor > 1
                  ? `${Math.round((brand.depreciationFactor - 1) * 100)}% acima da média`
                  : brand.depreciationFactor < 1
                    ? `${Math.round((1 - brand.depreciationFactor) * 100)}% abaixo da média`
                    : 'na média do mercado'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Modelos no catálogo</dt>
              <dd>{brand.models.length}</dd>
            </div>
          </dl>
          {isNew(brand) && (
            <p className="mt-3 text-xs text-muted">Marca recente no Brasil: rede de concessionárias e histórico de revenda ainda curtos — por isso o cálculo usa desvalorização maior.</p>
          )}
        </Card>
      </div>

      {byCategory.map(([c, models]) => (
        <section key={c} className="space-y-3" aria-labelledby={`cat-${c}`}>
          <h2 id={`cat-${c}`} className="text-[15px] font-semibold tracking-tight">
            {CATEGORY_LABEL[c]} <span className="font-normal text-muted">· {models.length}</span>
          </h2>
          <CarGrid>
            {models.map((m) => (
              <CarCard key={m.id} model={m} best={best.get(m.id)} keep={keep} horizon={horizon} />
            ))}
          </CarGrid>
        </section>
      ))}

      <p className="text-sm">
        <a href={paths.brands()} className="text-accent hover:underline">
          ← Ver todas as marcas
        </a>
      </p>
    </div>
  )
}

export function NotFound({ what = 'Página' }: { what?: string }) {
  usePageMeta(`${what} não encontrada | Custo de Carro`)
  return (
    <Card title={`${what} não encontrada`}>
      <p className="text-sm text-ink-2">O link pode estar desatualizado. Veja a lista completa:</p>
      <p className="mt-3 flex gap-4 text-sm">
        <a href={paths.cars()} className="text-accent hover:underline">
          Todos os carros
        </a>
        <a href={paths.brands()} className="text-accent hover:underline">
          Marcas
        </a>
        <a href={paths.home()} className="text-accent hover:underline">
          Início
        </a>
      </p>
    </Card>
  )
}
