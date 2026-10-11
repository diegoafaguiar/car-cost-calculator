import { useEffect, useState } from 'react'

interface ToastMsg {
  id: number
  text: string
  action?: { label: string; href: string }
}

const EVENT = 'app:toast'
let seq = 0

/** Mostra um aviso curto no rodapé (ex.: "Adicionado à comparação"). */
export function toast(text: string, action?: ToastMsg['action']) {
  window.dispatchEvent(new CustomEvent<ToastMsg>(EVENT, { detail: { id: ++seq, text, action } }))
}

export function Toaster() {
  const [msg, setMsg] = useState<ToastMsg | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const on = (e: Event) => {
      setMsg((e as CustomEvent<ToastMsg>).detail)
      clearTimeout(timer)
      timer = setTimeout(() => setMsg(null), 3500)
    }
    window.addEventListener(EVENT, on)
    return () => {
      window.removeEventListener(EVENT, on)
      clearTimeout(timer)
    }
  }, [])
  if (!msg) return null
  return (
    <div
      role="status"
      aria-live="polite"
      key={msg.id}
      className="toast fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-page shadow-xl md:bottom-6"
    >
      <span>{msg.text}</span>
      {msg.action && (
        <a href={msg.action.href} onClick={() => setMsg(null)} className="shrink-0 font-semibold text-accent-soft underline-offset-2 hover:underline">
          {msg.action.label}
        </a>
      )}
    </div>
  )
}
