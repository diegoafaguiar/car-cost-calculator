import { useEffect, useState } from 'react'

/** true enquanto a media query casar (ex.: '(max-width: 639px)'). */
export function useMedia(query: string) {
  const get = () => typeof matchMedia !== 'undefined' && matchMedia(query).matches
  const [on, setOn] = useState(get)
  useEffect(() => {
    const m = matchMedia(query)
    const f = () => setOn(m.matches)
    f()
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [query])
  return on
}
