import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Painel modal: sobe de baixo no celular (fácil de alcançar com o polegar) e abre à direita no computador.
 * Fecha com Esc, clique fora ou no botão; o rodapé fica fixo para a ação principal.
 */
export function Sheet({
  title,
  subtitle,
  onClose,
  footer,
  children,
}: {
  title: string
  subtitle?: ReactNode
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    d.showModal()
    // Evita a página de fundo rolar junto no celular.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-label={title}
      className="sheet fixed inset-x-0 bottom-0 top-auto m-0 block max-h-[88dvh] w-full max-w-none overflow-hidden md:flex md:flex-col rounded-t-2xl border-t border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/45 md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:max-h-dvh md:max-w-md md:rounded-none md:border-t-0 md:border-l"
    >
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ink/15 md:hidden" aria-hidden />
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="-mr-2 grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink"
          aria-label="Fechar"
        >
          <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      {/*
        No celular a área rolável tem altura máxima explícita (88dvh menos cabeçalho e rodapé): o Safari do iPhone
        espremia a zero o conteúdo flexível de um diálogo sem altura definida. No computador o painel tem altura fixa e usa flex.
      */}
      <div className="max-h-[calc(88dvh-9rem)] overflow-y-auto overscroll-contain px-5 py-4 md:max-h-none md:min-h-0 md:flex-1">{children}</div>
      {footer && <footer className="shrink-0 border-t border-line bg-surface px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</footer>}
    </dialog>
  )
}

/** Fecha o Sheet que contém o elemento (para botões do rodapé). */
export function closeSheet(el: HTMLElement | null) {
  el?.closest('dialog')?.close()
}
