import { useEffect, useState } from 'react'
import { useApp } from './context'

/** Runs a mock-API call, re-running whenever the app calls refresh(). */
export function useApi<T>(fn: () => Promise<T>) {
  const { version } = useApp()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    fn().then((d) => live && (setData(d), setError(null)))
      .catch((e: Error) => live && setError(e.message))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])
  return { data, error, loading: data === null && error === null }
}
