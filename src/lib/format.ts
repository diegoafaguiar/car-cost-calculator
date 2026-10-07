const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const brl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

export const money = (v: number) => brl.format(Math.round(v))
export const money2 = (v: number) => brl2.format(v)
export const number = (v: number) => num.format(v)
export const compactMoney = (v: number) => `R$ ${compact.format(v)}`
export const pct = (v: number, digits = 1) =>
  `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: digits })}%`
export const signedMoney = (v: number) => (v > 0 ? `+${money(v)}` : money(v))

export function months(m: number): string {
  if (m < 12) return `${m} ${m === 1 ? 'mês' : 'meses'}`
  const y = Math.floor(m / 12)
  const r = m % 12
  const ys = `${y} ${y === 1 ? 'ano' : 'anos'}`
  return r ? `${ys} e ${r} ${r === 1 ? 'mês' : 'meses'}` : ys
}

/** "R$ 123.456,00" → 123456 */
export function parseBrl(s: string): number {
  const clean = s.replace(/[^\d,]/g, '').replace(',', '.')
  const v = Number.parseFloat(clean)
  return Number.isFinite(v) ? v : 0
}

export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
