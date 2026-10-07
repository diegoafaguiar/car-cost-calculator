import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { money } from '../lib/format'
import { COST_KEYS, COST_LABEL } from '../lib/tco'
import type { Horizon, ScenarioResult } from '../lib/types'

interface Props {
  result: ScenarioResult
  horizon: Horizon
  /** Quando informado, mostra também a conta da diferença para manter o seu carro. */
  keep?: ScenarioResult
  children: ReactNode
  align?: 'left' | 'right'
}

/**
 * Explica de onde vem o custo mensal: cada componente dividido pelos meses do horizonte, somados.
 * Abre ao passar o mouse, ao focar com o teclado ou ao tocar (celular).
 */
export function CostTooltip({ result, horizon, keep, children, align = 'right' }: Props) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const id = useId()
  const n = horizon * 12
  const h = result.horizons[horizon]
  const rows = COST_KEYS.map((k) => ({ k, v: h.breakdown[k] / n })).filter((r) => Math.abs(r.v) >= 0.5)
  const showDiff = keep && result.scenario.kind !== 'keep'
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const W = 288

  useLayoutEffect(() => {
    if (!open || !ref.current) return
    const place = () => {
      const r = ref.current!.getBoundingClientRect()
      const vw = window.innerWidth
      let left = align === 'right' ? r.right - W : r.left
      left = Math.max(8, Math.min(left, vw - W - 8))
      setPos({ top: r.bottom + 8, left })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, align])

  useEffect(() => {
    if (!pinned) return
    const close = (e: PointerEvent) => {
      const tip = document.getElementById(id)
      if (ref.current && !ref.current.contains(e.target as Node) && !tip?.contains(e.target as Node)) {
        setPinned(false)
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [pinned, id])

  return (
    <span
      ref={ref}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => !pinned && setOpen(false)}
    >
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => !pinned && setOpen(false)}
        onClick={(e) => {
          e.stopPropagation()
          setPinned((p) => !p)
          setOpen(true)
        }}
        className="cursor-help underline decoration-dotted decoration-1 underline-offset-4 decoration-ink/30 hover:decoration-ink/60"
      >
        {children}
      </button>
      {open && pos && createPortal(
        <span
          id={id}
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => !pinned && setOpen(false)}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: W }}
          className="z-[60] block rounded-xl border border-line bg-surface p-3 text-left text-xs font-normal text-ink shadow-xl"
        >
          <span className="mb-2 block font-semibold">
            Custo por mês em {horizon} {horizon === 1 ? 'ano' : 'anos'}
          </span>
          <span className="block space-y-1">
            {rows.map((r, i) => (
              <span key={r.k} className="flex justify-between gap-3 tabular">
                <span className="text-ink-2">
                  {i > 0 ? (r.v < 0 ? '− ' : '+ ') : r.v < 0 ? '− ' : ''}
                  {COST_LABEL[r.k]}
                </span>
                <span>{money(Math.abs(r.v))}</span>
              </span>
            ))}
          </span>
          <span className="mt-2 flex justify-between gap-3 border-t border-line pt-2 font-semibold tabular">
            <span>= Total por mês</span>
            <span>{money(h.monthly)}</span>
          </span>
          <span className="mt-1 block text-[11px] text-muted tabular">
            {money(h.total)} no período ÷ {n} meses
          </span>
          {showDiff && keep && (
            <span className="mt-3 block rounded-lg bg-surface-2 p-2 tabular">
              <span className="flex justify-between gap-3">
                <span className="text-ink-2">Manter o seu carro</span>
                <span>{money(keep.horizons[horizon].monthly)}</span>
              </span>
              <span className="flex justify-between gap-3">
                <span className="text-ink-2">− Esta opção</span>
                <span>{money(h.monthly)}</span>
              </span>
              <span className={`mt-1 flex justify-between gap-3 border-t border-line pt-1 font-semibold ${h.savingsVsKeep > 0 ? 'text-good' : 'text-bad'}`}>
                <span>= {h.savingsVsKeep > 0 ? 'Economia' : 'Custa a mais'} por mês</span>
                <span>{money(Math.abs(h.savingsVsKeep) / n)}</span>
              </span>
              <span className="block text-[11px] text-muted">
                {money(Math.abs(h.savingsVsKeep))} em {horizon} {horizon === 1 ? 'ano' : 'anos'}
              </span>
            </span>
          )}
        </span>,
        document.body,
      )}
    </span>
  )
}
