import { useEffect, useRef, useState } from 'react'
import { DEFAULT_ASSUMPTIONS, DEFAULT_PREFERENCES } from '../lib/defaults'
import type { Assumptions, CurrentCar, Preferences } from '../lib/types'
import { AssumptionsForm } from './AssumptionsForm'
import { CurrentCarForm } from './CurrentCarForm'
import { Button, Segmented } from './ui'

export type SettingsTab = 'car' | 'assumptions'

interface Props {
  tab: SettingsTab
  onClose: () => void
  car: CurrentCar
  onCar: (c: CurrentCar) => void
  assumptions: Assumptions
  onAssumptions: (a: Assumptions) => void
  prefs: Preferences
  onPrefs: (p: Preferences) => void
  token: string
  onToken: (t: string) => void
  year: number
}

/** Painel lateral com o cadastro do carro e as premissas, para manter o painel principal limpo. */
export function SettingsDrawer(props: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<SettingsTab>(props.tab)
  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog
      ref={ref}
      onClose={props.onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-lg overflow-y-auto border-l border-line bg-page p-0 text-ink backdrop:bg-black/40"
    >
      <div className="sticky top-0 z-10 border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Configurações</h2>
          <Button variant="ghost" onClick={() => ref.current?.close()}>
            Fechar
          </Button>
        </div>
        <div className="mt-3">
          <Segmented<SettingsTab>
            label="Seção"
            value={tab}
            options={[
              { value: 'car', label: 'Meu carro' },
              { value: 'assumptions', label: 'Premissas' },
            ]}
            onChange={setTab}
          />
        </div>
      </div>
      <div className="space-y-3 p-5">
        {tab === 'car' ? (
          <CurrentCarForm car={props.car} onChange={props.onCar} year={props.year} assumptions={props.assumptions} />
        ) : (
          <>
            <AssumptionsForm
              a={props.assumptions}
              onChange={props.onAssumptions}
              prefs={props.prefs}
              onPrefs={props.onPrefs}
              token={props.token}
              onToken={props.onToken}
            />
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm('Restaurar todas as premissas para os valores padrão? Seu carro e os preços FIPE salvos serão mantidos.')) {
                  props.onAssumptions(DEFAULT_ASSUMPTIONS)
                  props.onPrefs(DEFAULT_PREFERENCES)
                }
              }}
            >
              Restaurar premissas padrão
            </Button>
          </>
        )}
        <p className="pt-2 text-xs text-muted">As alterações são salvas automaticamente neste navegador.</p>
      </div>
    </dialog>
  )
}
