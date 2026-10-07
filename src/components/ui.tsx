import { useEffect, useState, type ReactNode } from 'react'

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
}: {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-line bg-surface p-4 sm:p-5 ${className}`}>
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}

export function Collapsible({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string
  hint?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details open={defaultOpen} className="group rounded-xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 select-none sm:px-5">
        <span>
          <span className="block font-semibold text-ink">{title}</span>
          {hint && <span className="block text-sm text-ink-2">{hint}</span>}
        </span>
        <svg
          viewBox="0 0 20 20"
          className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"
          aria-hidden
        >
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </summary>
      <div className="border-t border-line p-4 sm:px-5">{children}</div>
    </details>
  )
}

const inputCls =
  'w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-sm text-ink tabular outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'

export function Label({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

/**
 * Campo numérico. `scale` converte a exibição (100 para porcentagens guardadas como fração).
 * Mantém o texto digitado enquanto o usuário edita, para não brigar com vírgulas.
 */
export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  scale = 1,
  step,
  min,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  scale?: number
  step?: number
  min?: number
  hint?: string
}) {
  const display = (v: number) => (Number.isFinite(v) ? String(Math.round(v * scale * 10000) / 10000) : '')
  const [text, setText] = useState(display(value))
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (!focused) setText(display(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused])

  return (
    <Label label={label} hint={hint}>
      <span className="relative flex items-center">
        {prefix && <span className="pointer-events-none absolute left-2.5 text-xs text-muted">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          className={`${inputCls} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''}`}
          value={text}
          step={step}
          min={min}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setText(e.target.value)
            const v = Number.parseFloat(e.target.value.replace(',', '.'))
            onChange(Number.isFinite(v) ? v / scale : 0)
          }}
        />
        {suffix && <span className="pointer-events-none absolute right-2.5 text-xs text-muted">{suffix}</span>}
      </span>
    </Label>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <Label label={label}>
      <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Label>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  hint,
}: {
  label: string
  value: T | ''
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <Label label={label} hint={hint}>
      <select
        className={`${inputCls} disabled:opacity-50`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {value === '' && <option value="">Selecione…</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Label>
  )
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? 'border-accent bg-accent text-accent-ink'
          : 'border-line bg-surface-2 text-ink-2 hover:text-ink'
      }`}
    >
      {active && (
        <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
          <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.2" />
        </svg>
      )}
      {children}
    </button>
  )
}

export function ChipGroup<T extends string | number>({
  label,
  options,
  selected,
  onChange,
}: {
  label?: string
  options: { value: T; label: string }[]
  selected: T[]
  onChange: (v: T[]) => void
}) {
  return (
    <div>
      {label && <span className="mb-1.5 block text-xs font-medium text-ink-2">{label}</span>}
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.value)
          return (
            <Chip
              key={String(o.value)}
              active={on}
              onClick={() => onChange(on ? selected.filter((s) => s !== o.value) : [...selected, o.value])}
            >
              {o.label}
            </Chip>
          )
        })}
      </div>
    </div>
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            o.value === value ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  const styles = {
    primary: 'bg-accent text-accent-ink hover:opacity-90',
    secondary: 'border border-line bg-surface-2 text-ink hover:bg-surface',
    ghost: 'text-ink-2 hover:text-ink',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'good' | 'warn' }) {
  const styles = {
    neutral: 'bg-surface-2 text-ink-2',
    accent: 'bg-accent/12 text-accent',
    good: 'bg-good/12 text-good',
    warn: 'bg-[#fab219]/18 text-ink-2',
  }[tone]
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${styles}`}>{children}</span>
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
}) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface p-4">
      <div className="text-xs font-medium text-ink-2">{label}</div>
      <div className="mt-1 truncate text-2xl font-semibold text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  )
}
