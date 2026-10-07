import type { Score } from '../lib/scores'
import { Popover } from './Popover'

const tone = (v: number) => (v >= 7.5 ? 'var(--good)' : v >= 5 ? 'var(--accent)' : v >= 3 ? '#d97706' : 'var(--bad)')

/** Nota 0–10 com barra; o detalhe mostra os itens considerados (✓ tem, ✗ não tem, ? não confirmado). */
export function ScoreBadge({ score, title, highlight }: { score: Score; title: string; highlight?: boolean }) {
  const v = score.value
  const trigger =
    v === null ? (
      <span className="text-xs text-muted underline decoration-dotted underline-offset-4">sem nota</span>
    ) : (
      <span className="inline-flex items-center gap-2">
        <span className={`w-8 text-right tabular ${highlight ? 'font-semibold text-good' : 'font-medium'}`}>{v.toLocaleString('pt-BR')}</span>
        <span className="relative h-1.5 w-14 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${v * 10}%`, background: tone(v) }} />
        </span>
      </span>
    )
  return (
    <Popover trigger={trigger}>
      <span className="mb-1 block font-semibold">
        {title}
        {v !== null && `: ${v.toLocaleString('pt-BR')}/10`}
      </span>
      {score.note && <span className="mb-2 block text-muted">{score.note}</span>}
      {score.items.length > 0 && (
        <span className="block space-y-0.5">
          {score.items.map((i) => (
            <span key={i.label} className="flex gap-2">
              <span className={i.has === null ? 'text-muted' : i.has ? 'text-good' : 'text-bad'} aria-hidden>
                {i.has === null ? '?' : i.has ? '✓' : '✗'}
              </span>
              <span className={i.has === null ? 'text-muted' : ''}>{i.label}</span>
            </span>
          ))}
        </span>
      )}
    </Popover>
  )
}
