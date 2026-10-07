import { money, pct } from '../lib/format'
import { COST_KEYS, COST_LABEL } from '../lib/tco'
import type { Breakdown } from '../lib/types'

/** Composição do custo: uma barra por componente; valores negativos (rendimento) vão à esquerda. */
export function BreakdownBars({ breakdown, total }: { breakdown: Breakdown; total: number }) {
  const rows = COST_KEYS.map((k) => ({ key: k, label: COST_LABEL[k], value: breakdown[k] })).filter(
    (r) => Math.abs(r.value) >= 1,
  )
  const maxPos = Math.max(1, ...rows.map((r) => r.value))
  const maxNeg = Math.max(0, ...rows.map((r) => -r.value))
  const span = maxPos + maxNeg
  const zero = (maxNeg / span) * 100

  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const w = (Math.abs(r.value) / span) * 100
        const neg = r.value < 0
        return (
          <li key={r.key} className="group grid grid-cols-[9.5rem_1fr_5.5rem] items-center gap-2 text-sm" title={`${r.label}: ${money(r.value)}`}>
            <span className="truncate text-ink-2">{r.label}</span>
            <span className="relative h-3">
              <span
                className="absolute top-0 h-3 rounded-sm transition-opacity group-hover:opacity-80"
                style={{
                  left: `${neg ? zero - w : zero}%`,
                  width: `${Math.max(w, 0.5)}%`,
                  background: neg ? 'var(--s3)' : 'var(--s1)',
                }}
              />
              {maxNeg > 0 && <span className="absolute -top-0.5 h-4 w-px bg-[var(--axis)]" style={{ left: `${zero}%` }} />}
            </span>
            <span className="text-right tabular text-ink">
              {money(r.value)}
              <span className="block text-[11px] text-muted">{total > 0 ? pct(r.value / total, 0) : ''}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
