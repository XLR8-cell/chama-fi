import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { can as canRole, type Action } from './lib/roles'
import { findMember } from './mocks/db'
import type { Member } from './types'

export type ThemePref = 'system' | 'light' | 'dark'
interface Ctx {
  user: Member | null
  signIn: (m: Member) => void
  signOut: () => void
  can: (a: Action) => boolean
  themePref: ThemePref; setThemePref: (t: ThemePref) => void
  meId: string; version: number; refresh: () => void
  toast: (message: string, tone?: 'ok' | 'error') => void
}
const AppCtx = createContext<Ctx | null>(null)
export const useApp = () => {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp must be used inside AppProvider')
  return c
}

const SESSION = 'chama-fi-session'
const THEME = 'chama-fi-theme'
const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string | null) => {
  try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* storage unavailable */ }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => read(SESSION))
  const user = userId ? findMember(userId) ?? null : null
  const [themePref, setThemePref] = useState<ThemePref>(() => (read(THEME) as ThemePref) || 'system')
  const [version, setVersion] = useState(0)
  const [msg, setMsg] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null)

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = themePref === 'dark' || (themePref === 'system' && mq.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0E0A1F' : '#1E1B4B')
    }
    apply()
    write(THEME, themePref)
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [themePref])

  const signIn = useCallback((m: Member) => { setUserId(m.id); write(SESSION, m.id) }, [])
  const signOut = useCallback(() => { setUserId(null); write(SESSION, null) }, [])
  const can = useCallback((a: Action) => !!user && canRole(user.role, a), [user])
  const refresh = useCallback(() => setVersion((v) => v + 1), [])
  const toast = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => setMsg({ text, tone }), [])
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 3500)
    return () => clearTimeout(t)
  }, [msg])

  return (
    <AppCtx.Provider value={{ user, signIn, signOut, can, themePref, setThemePref, meId: user?.id ?? '', version, refresh, toast }}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 flex justify-center px-4 md:bottom-6">
        {msg && (
          <p className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${msg.tone === 'error' ? 'bg-danger text-onbrand' : 'bg-deep text-white'}`}>
            {msg.text}
          </p>
        )}
      </div>
    </AppCtx.Provider>
  )
}
