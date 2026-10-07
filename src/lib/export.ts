import { CATEGORY_LABEL, POWERTRAIN_LABEL } from './catalog'
import { money } from './format'
import { COST_KEYS, COST_LABEL } from './tco'
import type { CurrentCar, Horizon, ScenarioResult } from './types'

const KIND: Record<string, string> = { keep: 'Manter', new: '0 km', used: 'Seminovo', subscription: 'Assinatura' }
const yrs = (h: number) => `${h} ${h === 1 ? 'ano' : 'anos'}`
const today = () => new Date().toLocaleDateString('pt-BR')
/** "0 km", "seminovo 2023" ou "assinatura", para frases. */
const when = (r: ScenarioResult) =>
  r.scenario.kind === 'subscription' ? 'assinatura' : r.scenario.ageAtStart === 0 ? '0 km' : `seminovo ${new Date().getFullYear() - r.scenario.ageAtStart}`

export interface ExportContext {
  car: CurrentCar
  keep?: ScenarioResult
  ranked: ScenarioResult[]
  compared: ScenarioResult[]
  horizon: Horizon
  includeOpportunity: boolean
  url: string
}

/** Linha "plana" de um cenário, usada em CSV e planilha. */
function flat(r: ScenarioResult, rank: number, h: Horizon) {
  const s = r.scenario
  const hr = r.horizons[h]
  return {
    rank,
    opcao: s.label,
    detalhe: s.detail,
    tipo: KIND[s.kind],
    categoria: CATEGORY_LABEL[s.category],
    motorizacao: POWERTRAIN_LABEL[s.powertrain],
    preco: s.kind === 'subscription' ? null : Math.round(s.price),
    fontePreco: s.priceSource,
    parcela: r.installment > 0 ? Math.round(r.installment) : null,
    prazo: r.installment > 0 ? r.finance.months : null,
    custoMes: Math.round(hr.monthly),
    total1: Math.round(r.horizons[1].total),
    total3: Math.round(r.horizons[3].total),
    total5: Math.round(r.horizons[5].total),
    custoKm: Math.round(hr.perKm * 100) / 100,
    vsManter: s.kind === 'keep' ? 0 : Math.round(hr.savingsVsKeep),
    compensaMeses: r.breakEvenMonth,
    ...Object.fromEntries(COST_KEYS.map((k) => [k, Math.round(hr.breakdown[k])])),
  }
}

const HEADERS: [string, string][] = [
  ['rank', 'Posição'],
  ['opcao', 'Opção'],
  ['detalhe', 'Detalhe'],
  ['tipo', 'Tipo'],
  ['categoria', 'Categoria'],
  ['motorizacao', 'Motorização'],
  ['preco', 'Preço (R$)'],
  ['fontePreco', 'Fonte do preço'],
  ['parcela', 'Parcela (R$)'],
  ['prazo', 'Prazo (meses)'],
  ['custoMes', 'Custo por mês no horizonte (R$)'],
  ['total1', 'Custo total 1 ano (R$)'],
  ['total3', 'Custo total 3 anos (R$)'],
  ['total5', 'Custo total 5 anos (R$)'],
  ['custoKm', 'Custo por km (R$)'],
  ['vsManter', 'Economia vs. manter no horizonte (R$)'],
  ['compensaMeses', 'Compensa a partir do mês'],
  ...COST_KEYS.map((k) => [k, `${COST_LABEL[k]} no horizonte (R$)`] as [string, string]),
]

/** CSV no padrão do Excel em português: ";" como separador, vírgula decimal e BOM UTF-8. */
export function toCSV(ctx: ExportContext): Blob {
  const rows = ctx.ranked.map((r, i) => flat(r, i + 1, ctx.horizon) as Record<string, unknown>)
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return ''
    if (typeof v === 'number') return String(v).replace('.', ',')
    const s = String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    `Custo de Carro — ranking em ${yrs(ctx.horizon)} — ${today()}`,
    `Seu carro: ${ctx.car.label} ${ctx.car.modelYear}; custo de oportunidade ${ctx.includeOpportunity ? 'incluído' : 'desligado'}`,
    '',
    HEADERS.map(([, h]) => cell(h)).join(';'),
    ...rows.map((r) => HEADERS.map(([k]) => cell(r[k])).join(';')),
  ]
  return new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
}

/** Planilha XLSX com três abas: resumo, comparação lado a lado e ranking completo. */
export async function toXLSX(ctx: ExportContext): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const bold = { fontWeight: 'bold' as const }
  const hdr = (s: string) => ({ value: s, ...bold, backgroundColor: '#EEF2F7' })
  const num = (v: number | null, fmt = '#,##0') => (v === null ? null : { value: v, type: Number, format: fmt })

  const keep = ctx.keep
  const resumo = [
    [{ value: 'Custo de Carro', ...bold, fontSize: 14 }],
    [{ value: `Gerado em ${today()} · ${ctx.url}` }],
    [],
    [hdr('Seu carro'), { value: `${ctx.car.label} · ${ctx.car.modelYear}` }],
    [hdr('Horizonte'), { value: yrs(ctx.horizon) }],
    [hdr('Custo de oportunidade'), { value: ctx.includeOpportunity ? 'incluído' : 'desligado' }],
    [hdr('Manter: custo por mês (R$)'), num(keep ? Math.round(keep.horizons[ctx.horizon].monthly) : null)],
    [hdr('Manter: custo total (R$)'), num(keep ? Math.round(keep.horizons[ctx.horizon].total) : null)],
    [],
    [hdr('Melhores alternativas'), hdr('Custo/mês (R$)'), hdr('vs. manter (R$)')],
    ...ctx.ranked
      .filter((r) => r.scenario.kind !== 'keep')
      .slice(0, 10)
      .map((r) => [
        { value: `${r.scenario.label} · ${r.scenario.detail}` },
        num(Math.round(r.horizons[ctx.horizon].monthly)),
        num(Math.round(r.horizons[ctx.horizon].savingsVsKeep)),
      ]),
  ]

  const cols = [keep, ...ctx.compared].filter(Boolean) as ScenarioResult[]
  const cmpRow = (label: string, get: (r: ScenarioResult) => number | string | null, fmt?: string) => [
    hdr(label),
    ...cols.map((r) => {
      const v = get(r)
      return typeof v === 'number' ? num(v, fmt) : v === null ? null : { value: v }
    }),
  ]
  const h = ctx.horizon
  const comparacao = [
    [hdr(`Comparação · ${yrs(h)}`), ...cols.map((r) => hdr(r.scenario.kind === 'keep' ? 'Manter o seu carro' : `${r.scenario.label} · ${r.scenario.detail}`))],
    cmpRow('Custo por mês (R$)', (r) => Math.round(r.horizons[h].monthly)),
    cmpRow('Custo total (R$)', (r) => Math.round(r.horizons[h].total)),
    cmpRow('Custo por km (R$)', (r) => Math.round(r.horizons[h].perKm * 100) / 100, '#,##0.00'),
    cmpRow('vs. manter (R$)', (r) => (r.scenario.kind === 'keep' ? 0 : Math.round(r.horizons[h].savingsVsKeep))),
    cmpRow('Preço (R$)', (r) => (r.scenario.kind === 'subscription' ? null : Math.round(r.scenario.price))),
    ...COST_KEYS.map((k) => cmpRow(`${COST_LABEL[k]} (R$)`, (r) => Math.round(r.horizons[h].breakdown[k]))),
    cmpRow('Categoria', (r) => CATEGORY_LABEL[r.scenario.category]),
    cmpRow('Motorização', (r) => POWERTRAIN_LABEL[r.scenario.powertrain]),
  ]

  const ranking = [
    HEADERS.map(([, t]) => hdr(t)),
    ...ctx.ranked.map((r, i) => {
      const f = flat(r, i + 1, h) as Record<string, unknown>
      return HEADERS.map(([k]) => {
        const v = f[k]
        if (v === null || v === undefined) return null
        return typeof v === 'number' ? num(v, k === 'custoKm' ? '#,##0.00' : '#,##0') : { value: String(v) }
      })
    }),
  ]

  return writeXlsxFile(
    [
      { data: resumo as never, sheet: 'Resumo', columns: [{ width: 44 }, { width: 18 }, { width: 18 }] },
      { data: comparacao as never, sheet: 'Comparação', columns: [{ width: 30 }, ...cols.map(() => ({ width: 28 }))] },
      { data: ranking as never, sheet: 'Ranking', columns: HEADERS.map(([k]) => ({ width: k === 'opcao' || k === 'detalhe' ? 30 : 16 })) },
    ],
    {},
  ).toBlob()
}

/** Resumo em texto para colar no WhatsApp (negrito com *asteriscos*). */
export function whatsappText(ctx: ExportContext): string {
  const h = ctx.horizon
  const keep = ctx.keep
  const lines: string[] = []
  lines.push(`🚗 *Custo de Carro* — análise em ${yrs(h)}`)
  lines.push(`Meu carro: ${ctx.car.label} ${ctx.car.modelYear}`)
  if (keep) lines.push(`Manter custa *${money(keep.horizons[h].monthly)}/mês* (${money(keep.horizons[h].total)} no período)`)
  const best = ctx.ranked[0]
  if (best && keep) {
    lines.push(
      best.scenario.kind === 'keep'
        ? '✅ *Conclusão:* manter o meu carro é a opção mais barata.'
        : `✅ *Conclusão:* ${best.scenario.label} ${when(best)} — ${money(best.horizons[h].monthly)}/mês, ${best.horizons[h].savingsVsKeep >= 0 ? 'economia' : 'custa a mais'} de ${money(Math.abs(best.horizons[h].savingsVsKeep))}`,
    )
  }
  const cmp = ctx.compared.length ? ctx.compared : ctx.ranked.filter((r) => r.scenario.kind !== 'keep').slice(0, 3)
  if (cmp.length) {
    lines.push('', `*${ctx.compared.length ? 'Comparação' : 'Melhores alternativas'}:*`)
    cmp.forEach((r, i) => {
      const v = r.horizons[h].savingsVsKeep
      lines.push(`${i + 1}. ${r.scenario.label} — ${r.scenario.detail}`)
      lines.push(`   ${money(r.horizons[h].monthly)}/mês · ${v >= 0 ? '▲ economiza' : '▼ custa mais'} ${money(Math.abs(v))}`)
    })
  }
  lines.push('', `_Custos incluem depreciação, combustível, seguro, IPVA, manutenção${ctx.includeOpportunity ? ' e custo de oportunidade' : ''}._`)
  lines.push(ctx.url)
  return lines.join('\n')
}

export function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** PNG de um elemento da página (ex.: o comparador), em alta resolução. */
export async function toPNG(node: HTMLElement, background: string): Promise<Blob> {
  const { toBlob } = await import('html-to-image')
  const blob = await toBlob(node, {
    pixelRatio: 2,
    backgroundColor: background,
    cacheBust: true,
    // Imagens externas que não permitirem cópia viram um quadro vazio em vez de quebrar a exportação.
    imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    filter: (el) => !(el instanceof HTMLElement && el.dataset.exportIgnore === 'true'),
  })
  if (!blob) throw new Error('Não foi possível gerar a imagem.')
  return blob
}

export const fileStamp = () => new Date().toISOString().slice(0, 10)
