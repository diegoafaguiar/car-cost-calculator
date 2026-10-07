import { useEffect, useState } from 'react'

/** Estado salvo no localStorage do navegador (mescla com o padrão para campos novos). */
export function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return initial
      const parsed = JSON.parse(raw) as T
      if (initial && typeof initial === 'object' && !Array.isArray(initial)) {
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
