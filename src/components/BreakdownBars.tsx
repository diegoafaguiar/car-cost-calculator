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
          <li
            key={r.key}
            className="group grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1 text-sm sm:grid-cols-[9.5rem_1fr_5.5rem]"
            title={`${r.label}: ${money(r.value)}`}
          >
            <span className="truncate text-ink-2">{r.label}</span>
            <span className="relative order-last col-span-2 h-2.5 rounded-sm bg-surface-2 sm:order-none sm:col-span-1 sm:h-3 sm:bg-transparent">
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
              <span className="ml-1.5 text-[11px] text-muted sm:ml-0 sm:block">{total > 0 ? pct(r.value / total, 0) : ''}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
