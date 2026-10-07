import { useEffect, useState } from 'react'

/** Estado salvo no localStorage do navegador (mescla com o padrão para campos novos). */
export function usePersisted<T>(key: string, initial: T, migrate?: (stored: Record<string, unknown>) => Record<string, unknown>) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return initial
      let parsed = JSON.parse(raw) as T
      // Dado corrompido ou de outro formato: volta ao padrão.
      if (parsed === null || typeof parsed !== typeof initial || Array.isArray(parsed) !== Array.isArray(initial)) return initial
      if (initial && typeof initial === 'object' && !Array.isArray(initial)) {
        if (migrate) parsed = migrate(parsed as Record<string, unknown>) as T
        return { ...initial, ...parsed }
      }
      return parsed
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Sem armazenamento disponível: mantém só em memória.
    }
  }, [key, value])

  return [value, setValue] as const
}
