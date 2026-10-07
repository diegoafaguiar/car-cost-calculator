import { Component, type ReactNode } from 'react'

interface State {
  error: Error | null
}

/** Evita tela branca: mostra o erro e oferece recarregar ou restaurar os dados salvos. */
export class ErrorBoundary extends Component<{ children: ReactNode; area?: string }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Erro na interface', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="rounded-2xl border border-line bg-surface p-6 shadow-card">
        <h2 className="font-semibold">Algo deu errado{this.props.area ? ` em “${this.props.area}”` : ''}.</h2>
        <p className="mt-1 text-sm text-ink-2">
          O restante da página continua funcionando. Se o erro persistir, restaure os dados salvos neste navegador.
        </p>
        <p className="mt-2 font-mono text-xs text-muted">{this.state.error.message}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => this.setState({ error: null })} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface-2">
            Tentar de novo
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm('Apagar os dados salvos (seu carro, premissas e preços) e recarregar?')) return
              try {
                Object.keys(localStorage)
                  .filter((k) => k.startsWith('ccc:'))
                  .forEach((k) => localStorage.removeItem(k))
              } catch {
                // sem acesso ao armazenamento
              }
              location.reload()
            }}
            className="rounded-lg bg-bad px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Restaurar dados e recarregar
          </button>
        </div>
      </div>
    )
  }
}
