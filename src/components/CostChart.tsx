import { useEffect, useMemo, useRef, useState } from 'react'
import { compactMoney, money } from '../lib/format'

export interface Series {
  id: string
  label: string
  color: string
  values: number[]
  dashed?: boolean
}

const H = 280
const PAD = { top: 16, right: 16, bottom: 28, left: 64 }

export function niceTicks(min: number, max: number, count = 5) {
  const span = max - min || 1
  const step0 = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(step0)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) ?? step0
  const start = Math.floor(min / step) * step
  const ticks: number[] = [start]
  // Vai até a primeira marca que cobre o máximo (antes podia parar abaixo e as linhas saíam do gráfico).
  while (ticks[ticks.length - 1] < max - step * 1e-6) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

/** Marcas do eixo X: trimestres no horizonte de 1 ano, anos nos demais. */
function xTicks(months: number) {
  const step = months <= 12 ? 3 : 12
  const out: number[] = []
  for (let m = step; m <= months; m += step) out.push(m)
  return out
}
const tickLabel = (m: number, months: number) => (months <= 12 ? `${m} meses` : `${m / 12} ${m === 12 ? 'ano' : 'anos'}`)
const monthLabel = (m: number) => {
  if (m === 0) return 'Hoje'
  const y = Math.floor(m / 12)
  const r = m % 12
  return `Mês ${m}${y ? ` (${y}a${r ? ` ${r}m` : ''})` : ''}`
}

/** Custo acumulado mês a mês, com crosshair e tooltip. */
export function CostChart({ series: full, months: horizonMonths }: { series: Series[]; months?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Mostra só o horizonte escolhido: em 1 ano, a escala fica nos primeiros 12 meses (antes ficava esmagada nos 60).
  const total = full[0]?.values.length ? full[0].values.length - 1 : 60
  const months = Math.min(total, horizonMonths ?? total)
  const series = useMemo(() => full.map((s) => ({ ...s, values: s.values.slice(0, months + 1) })), [full, months])
  const { ticks, y, x } = useMemo(() => {
    const all = series.flatMap((s) => s.values)
    const lowest = Math.min(0, ...all)
    const min = lowest > -1 ? 0 : lowest
    const max = Math.max(1, ...all)
    const ticks = niceTicks(min, max, width < 480 ? 4 : 6)
    const lo = ticks[0]
    const hi = ticks[ticks.length - 1]
    const innerH = H - PAD.top - PAD.bottom
    const innerW = width - PAD.left - PAD.right
    return {
      ticks,
      y: (v: number) => PAD.top + innerH - ((v - lo) / (hi - lo || 1)) * innerH,
      x: (m: number) => PAD.left + (m / months) * innerW,
    }
  }, [series, width, months])

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const m = Math.round(((px - PAD.left) / (width - PAD.left - PAD.right)) * months)
    setHover(m >= 0 && m <= months ? m : null)
  }

  const sorted = hover === null ? [] : [...series].sort((a, b) => a.values[hover] - b.values[hover])
  const tipLeft = hover !== null && x(hover) > width / 2

  return (
    <div ref={ref} className="relative">
      <svg
        width={width}
        height={H}
        role="img"
        aria-label="Custo acumulado por mês para cada opção comparada"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        className="block touch-pan-y select-none"
        onPointerDown={onMove}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--muted)" className="tabular">
              {compactMoney(t)}
            </text>
          </g>
        ))}
        {xTicks(months).map((m) => (
          <g key={m}>
            <line x1={x(m)} x2={x(m)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--axis)" strokeDasharray="2 3" />
            <text x={x(m)} y={H - 8} textAnchor={m === months ? 'end' : 'middle'} fontSize={11} fill="var(--muted)">
              {tickLabel(m, months)}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={width - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--axis)" />
        {series.map((s) => (
          <path
            key={s.id}
            d={s.values.map((v, m) => `${m ? 'L' : 'M'}${x(m).toFixed(1)},${y(v).toFixed(1)}`).join('')}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? '6 4' : undefined}
            strokeLinejoin="round"
          />
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--ink-2)" strokeWidth={1} />
            {series.map((s) => (
              <circle key={s.id} cx={x(hover)} cy={y(s.values[hover])} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-[min(15rem,70%)] rounded-lg border border-line bg-surface p-2.5 text-xs shadow-lg"
          style={tipLeft ? { right: Math.max(0, width - x(hover) + 12) } : { left: Math.min(x(hover) + 12, width * 0.3) }}
        >
          <div className="mb-1.5 font-semibold text-ink">{monthLabel(hover)}</div>
          {sorted.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 py-0.5">
              <span className="flex min-w-0 items-center gap-1.5 text-ink-2">
                <span className="size-2 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="truncate">{s.label}</span>
              </span>
              <span className="tabular text-ink">{money(s.values[hover])}</span>
            </div>
          ))}
        </div>
      )}
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2" aria-label="Legenda">
        {series.map((s) => (
          <li key={s.id} className="flex items-center gap-1.5">
            <svg width="16" height="4" aria-hidden>
              <line x1="0" x2="16" y1="2" y2="2" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed ? '4 3' : undefined} />
            </svg>
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
