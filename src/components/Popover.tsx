import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** Conteúdo flutuante que abre com mouse, foco ou toque; renderizado fora de containers com rolagem. */
export function Popover({ trigger, children, width = 280, align = 'right' }: { trigger: ReactNode; children: ReactNode; width?: number; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLSpanElement>(null)
  const id = useId()

  useLayoutEffect(() => {
    if (!open || !ref.current) return
    const place = () => {
      const r = ref.current!.getBoundingClientRect()
      let left = align === 'right' ? r.right - width : r.left
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8))
      setPos({ top: r.bottom + 8, left })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, align, width])

  useEffect(() => {
    if (!pinned) return
    const close = (e: PointerEvent) => {
      const tip = document.getElementById(id)
      if (!ref.current?.contains(e.target as Node) && !tip?.contains(e.target as Node)) {
        setPinned(false)
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [pinned, id])

  return (
    <span ref={ref} className="relative inline-block" onMouseEnter={() => setOpen(true)} onMouseLeave={() => !pinned && setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => !pinned && setOpen(false)}
        onClick={(e) => {
          e.stopPropagation()
          setPinned((p) => !p)
          setOpen(true)
        }}
        className="cursor-help text-left"
      >
        {trigger}
      </button>
      {open &&
        pos &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => !pinned && setOpen(false)}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width }}
            className="z-[60] block rounded-xl border border-line bg-surface p-3 text-left text-xs font-normal text-ink shadow-xl"
          >
            {children}
          </span>,
          document.body,
        )}
    </span>
  )
}
