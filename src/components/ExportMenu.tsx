import { useEffect, useRef, useState } from 'react'
import { download, fileStamp, toCSV, toPNG, toXLSX, whatsappText, type ExportContext } from '../lib/export'

/** Exportações: texto para WhatsApp, CSV, Excel e PNG da comparação. */
export function ExportMenu({ ctx, label = 'Exportar' }: { ctx: () => ExportContext; label?: string }) {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 3500)
    return () => clearTimeout(t)
  }, [msg])

  const run = async (fn: () => Promise<string | void>, ok: string) => {
    setOpen(false)
    setBusy(true)
    try {
      const custom = await fn()
      setMsg({ text: custom || ok })
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : 'Não foi possível exportar.', error: true })
    } finally {
      setBusy(false)
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Navegadores sem permissão de área de transferência: cópia via campo temporário.
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      if (!ok) throw new Error('Não foi possível copiar. Use “Abrir no WhatsApp”.')
    }
  }

  const items: { label: string; hint: string; action: () => void }[] = [
    { label: 'Copiar resumo para WhatsApp', hint: 'Texto formatado para colar', action: () => run(() => copy(whatsappText(ctx())), 'Resumo copiado. É só colar no WhatsApp.') },
    {
      label: 'Abrir no WhatsApp',
      hint: 'Escolha o contato e envie',
      action: () =>
        run(async () => {
          window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText(ctx()))}`, '_blank', 'noopener')
        }, 'Abrindo o WhatsApp…'),
    },
    { label: 'Baixar planilha Excel (.xlsx)', hint: 'Resumo, comparação e ranking', action: () => run(async () => download(await toXLSX(ctx()), `custo-de-carro-${fileStamp()}.xlsx`), 'Planilha baixada.') },
    { label: 'Baixar CSV', hint: 'Ranking completo', action: () => run(async () => download(toCSV(ctx()), `custo-de-carro-ranking-${fileStamp()}.csv`), 'CSV baixado.') },
    {
      label: 'Baixar imagem da comparação (PNG)',
      hint: 'Tabela lado a lado',
      action: () =>
        run(async () => {
          const node = document.getElementById('sec-compare')
          if (!node) throw new Error('Comparação não encontrada nesta página.')
          const bg = getComputedStyle(document.body).backgroundColor
          download(await toPNG(node, bg), `custo-de-carro-comparacao-${fileStamp()}.png`)
        }, 'Imagem baixada.'),
    },
  ]

  return (
    <div ref={ref} className="relative" data-export-ignore="true">
      <button
        type="button"
        aria-haspopup="menu"
        aria-label={label}
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium whitespace-nowrap text-accent-ink hover:opacity-90 disabled:opacity-60"
      >
        <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
          <path d="M10 3v9m0 0l-3.5-3.5M10 12l3.5-3.5M4 14v2a1 1 0 001 1h10a1 1 0 001-1v-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="hidden sm:inline">{busy ? 'Gerando…' : label}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl">
          {items.map((i) => (
            <button key={i.label} type="button" role="menuitem" onClick={i.action} className="block w-full px-3 py-2 text-left hover:bg-surface-2">
              <span className="block text-sm font-medium text-ink">{i.label}</span>
              <span className="block text-xs text-muted">{i.hint}</span>
            </button>
          ))}
        </div>
      )}
      {msg && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl ${
            msg.error ? 'bg-bad text-white' : 'bg-ink text-page'
          }`}
        >
          {msg.text}
        </div>
      )}
    </div>
  )
}
